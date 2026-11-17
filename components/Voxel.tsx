"use client"

import { useEffect, useMemo, useRef, useState } from "react"

const S = 14
const C = S * 0.866
const H = S * 0.5

function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.round(((n >> 16) & 255) * f)
  const g = Math.round(((n >> 8) & 255) * f)
  const b = Math.round((n & 255) * f)
  return `rgb(${r},${g},${b})`
}

function proj(x: number, y: number, z: number): [number, number] {
  return [(x - y) * C, (x + y) * H - z * S]
}

function p(x: number, y: number, z: number) {
  const [a, b] = proj(x, y, z)
  return `${a.toFixed(2)},${b.toFixed(2)}`
}

const MAX_Z = 14
const SCALE = 1.5
const TICK = 450
const PALETTE = [
  { name: "Grass", color: "#5cc160", side: "#6b4428" },
  { name: "Dirt", color: "#5b3a24" },
  { name: "Wood", color: "#7a4b2a" },
  { name: "Leaves", color: "#2e8b3e" },
  { name: "Stone", color: "#8a8f98" },
  { name: "Ramp", color: "#f4ff5c" },
  { name: "Glass", color: "#5ab0ff" },
  { name: "Brick", color: "#c0533a" },
  { name: "Snow", color: "#f1f3f5" },
]

type Kind = "person" | "dog"
const CREATURES: { name: string; kind: Kind }[] = [
  { name: "Person", kind: "person" },
  { name: "Dog", kind: "dog" },
]
const SHIRTS = ["#3b5bdb", "#e8590c", "#2f9e44", "#ae3ec9", "#f1f3f5", "#1c7ed6", "#c0533a"]
const SKINS = ["#f2c79b", "#d9a066", "#a8703f", "#6b4428"]
const PANTS = ["#2b2f38", "#364fc7", "#5c3d2e"]
const HAIR = ["#2b1d14", "#5c3d2e", "#d9b25f", "#111111"]
const DOGS = ["#c98b4f", "#f1f3f5", "#3b3b3b", "#8a5a33", "#e0b878"]
const DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]]

type Block = { color: string; side?: string }
type World = Map<string, Block>
type Face = "top" | "right" | "left"
type Mode = "walk" | "pet" | "wait" | "fetch" | "return"
type Pos = { x: number; y: number; z: number }
type Ent = Pos & {
  id: number; kind: Kind; dx: number; dy: number; c: string[]; mode: Mode; mate: number
  t: number; cool: number; heart: number; say: number; ball: boolean; goal: Pos | null; idle: number
}
type Ball = Pos & { id: number; tx: number; ty: number; tz: number; owner: number; dog: number }
type Sim = { ents: Ent[]; balls: Ball[] }

const key = (x: number, y: number, z: number) => `${x},${y},${z}`
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

let nextId = 1
function makeEnt(kind: Kind, x: number, y: number, z: number): Ent {
  const c = kind === "person" ? [pick(SHIRTS), pick(SKINS), pick(PANTS), pick(HAIR)] : [pick(DOGS)]
  const [dx, dy] = pick(DIRS)
  return {
    id: nextId++, kind, x, y, z, dx, dy, c, mode: "walk", mate: -1, t: 0, cool: 8,
    heart: 0, say: 0, ball: false, goal: null, idle: Math.floor(Math.random() * 4),
  }
}

function radiusFor(hw: number) {
  return Math.max(4, Math.floor(((hw - 2) / C + 1) / 2))
}

function buildWorld(R: number): World {
  const m: World = new Map()
  const set = (x: number, y: number, z: number, color: string, side?: string) => m.set(key(x, y, z), { color, side })
  for (let x = -R; x <= R; x++)
    for (let y = -R; y <= R; y++) {
      if (Math.abs(x) + Math.abs(y) > 2 * R - 2) continue
      set(x, y, 0, "#5b3a24")
      set(x, y, 1, (((x + y) % 3) + 3) % 3 === 0 ? "#4caf50" : "#5cc160", "#6b4428")
    }
  const tree = (tx: number, ty: number, h = 3) => {
    for (let z = 2; z <= h + 1; z++) set(tx, ty, z, "#7a4b2a")
    for (let x = tx - 1; x <= tx + 1; x++)
      for (let y = ty - 1; y <= ty + 1; y++) {
        set(x, y, h + 2, "#2e8b3e")
        if (x === tx || y === ty) set(x, y, h + 3, "#38a34a")
      }
    set(tx, ty, h + 4, "#45b858")
  }
  tree(-R + 2, -R + 3)
  set(0, 1, 2, "#c9a26b")
  set(1, 1, 2, "#c9a26b")
  for (const z of [3, 4]) for (const x of [0, 1]) set(x, 0, z, "#2b2f38", "#5ab0ff")
  set(R - 2, -R + 3, 2, "#f4ff5c")
  set(R - 2, -R + 4, 2, "#f4ff5c")
  set(R - 2, -R + 3, 3, "#f4ff5c")
  if (R >= 6)
    for (let x = 2; x <= 4; x++)
      for (let y = R - 3; y <= R - 2; y++) {
        m.delete(key(x, y, 1))
        set(x, y, 0, "#3d8fd6")
      }
  if (R >= 7) {
    tree(R - 2, R - 3, 2)
    tree(-R + 3, R - 3, 4)
    set(-2, R - 2, 2, "#8a8f98")
    set(R - 3, -1, 2, "#8a8f98")
    set(R - 3, -1, 3, "#8a8f98")
  }
  return m
}

const walkable = (w: World, x: number, y: number, z: number) =>
  !w.has(key(x, y, z)) && !w.has(key(x, y, z + 1)) && w.has(key(x, y, z - 1))

function spawn(w: World, R: number): Sim {
  const n = R >= 7 ? 3 : 2
  const ents: Ent[] = []
  const used = new Set<string>()
  for (const kind of [...Array(n).fill("person"), ...Array(n).fill("dog")] as Kind[]) {
    for (let i = 0; i < 50; i++) {
      const x = Math.round(Math.random() * 2 * (R - 2)) - (R - 2)
      const y = Math.round(Math.random() * 2 * (R - 2)) - (R - 2)
      if (!walkable(w, x, y, 2) || used.has(`${x},${y}`)) continue
      used.add(`${x},${y}`)
      ents.push(makeEnt(kind, x, y, 2))
      break
    }
  }
  return { ents, balls: [] }
}

function toView(x: number, y: number, r: number): [number, number] {
  for (let i = 0; i < r; i++) [x, y] = [-y, x]
  return [x, y]
}

function toWorld(x: number, y: number, r: number): [number, number] {
  for (let i = 0; i < r; i++) [x, y] = [y, -x]
  return [x, y]
}

type Node = { x: number; y: number; d: number; prev: string | null }

function step(sim: Sim, world: World): Sim {
  const has = (x: number, y: number, z: number) => world.has(key(x, y, z))
  let balls = sim.balls.map((b) => ({ ...b, x: b.tx, y: b.ty, z: b.tz }))
  const ents: Ent[] = []
  for (const o of sim.ents) {
    const e = { ...o }
    const z0 = e.z
    for (let n = 0; has(e.x, e.y, e.z) && n < 20; n++) e.z++
    for (let n = 0; !has(e.x, e.y, e.z - 1) && n < 30; n++) e.z--
    if (e.z !== z0) e.goal = null
    if (has(e.x, e.y, e.z - 1)) ents.push(e)
  }
  const byId = new Map(ents.map((e) => [e.id, e]))
  const occ = new Set(ents.map((e) => key(e.x, e.y, e.z)))
  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

  const face = (e: Ent, o: Pos) => {
    const dx = o.x - e.x
    const dy = o.y - e.y
    if (Math.abs(dx) >= Math.abs(dy) && dx) [e.dx, e.dy] = [Math.sign(dx), 0]
    else if (dy) [e.dx, e.dy] = [0, Math.sign(dy)]
  }

  const bfs = (e: Ent, limit: number) => {
    const seen = new Map<string, Node>()
    const start = `${e.x},${e.y}`
    seen.set(start, { x: e.x, y: e.y, d: 0, prev: null })
    const q = [start]
    for (let i = 0; i < q.length; i++) {
      const c = seen.get(q[i])!
      if (c.d >= limit) continue
      for (const [dx, dy] of DIRS) {
        const nx = c.x + dx
        const ny = c.y + dy
        const k = `${nx},${ny}`
        if (seen.has(k) || !walkable(world, nx, ny, e.z)) continue
        seen.set(k, { x: nx, y: ny, d: c.d + 1, prev: q[i] })
        if (!occ.has(key(nx, ny, e.z))) q.push(k)
      }
    }
    return seen
  }

  const stepTo = (e: Ent, g: Pos) => {
    const s = bfs(e, 40)
    let c = s.get(`${g.x},${g.y}`)
    if (!c) return false
    if (c.d === 0) return true
    while (c.prev && s.get(c.prev)!.d > 0) c = s.get(c.prev)!
    if (occ.has(key(c.x, c.y, e.z))) return c.d === 1
    occ.delete(key(e.x, e.y, e.z))
    ;[e.dx, e.dy, e.x, e.y] = [c.x - e.x, c.y - e.y, c.x, c.y]
    occ.add(key(e.x, e.y, e.z))
    return true
  }

  const chooseGoal = (e: Ent) => {
    const cells = [...bfs(e, 10).values()].filter((c) => c.d >= 3 && !occ.has(key(c.x, c.y, e.z)))
    if (!cells.length) return null
    const people = ents.filter((o) => o.kind === "person" && o !== e && o.z === e.z)
    const social = e.kind === "dog" ? 0.55 : 0.2
    if (people.length && Math.random() < social) {
      const friend = people.reduce((a, b) => (dist(a, e) <= dist(b, e) ? a : b))
      const near = cells.filter((c) => dist(c, friend) <= 2)
      if (near.length) return { ...pick(near), z: e.z }
    }
    return { ...pick(cells), z: e.z }
  }

  const live = (e: Ent) => {
    if (e.idle > 0) {
      e.idle--
      if (Math.random() < 0.15) [e.dx, e.dy] = pick(DIRS)
      return
    }
    if (!e.goal) {
      e.goal = chooseGoal(e)
      if (!e.goal) e.idle = 3
      return
    }
    if (e.x === e.goal.x && e.y === e.goal.y) {
      e.goal = null
      e.idle = 2 + Math.floor(Math.random() * (e.kind === "dog" ? 5 : 8))
      return
    }
    if (!stepTo(e, e.goal)) {
      e.goal = null
      e.idle = 1
    }
  }

  const end = (e: Ent) => {
    for (const x of [e, byId.get(e.mate)]) {
      if (!x) continue
      Object.assign(x, { mode: "walk", mate: -1, t: 0, cool: 14, ball: false, goal: null, idle: 2 })
    }
    balls = balls.filter((b) => b.owner !== e.id && b.dog !== e.id)
  }

  const throwTarget = (person: Ent, dog: Ent): Pos | null => {
    const cells = [...bfs(dog, 9).values()].filter((c) => {
      const d = dist(c, person)
      return d >= 3 && d <= 6
    })
    return cells.length ? { ...pick(cells), z: dog.z } : null
  }

  for (const e of ents) {
    if (e.heart > 0) e.heart--
    if (e.say > 0) e.say--
    if (e.cool > 0) e.cool--
    const mate = byId.get(e.mate)
    if (e.mode !== "walk" && (!mate || mate.mate !== e.id)) {
      end(e)
      continue
    }
    if (e.mode === "walk") {
      if (e.kind === "person" && e.cool === 0 && Math.random() < 0.25) {
        const dog = ents.find((d) => d.kind === "dog" && d.mode === "walk" && d.cool === 0 && d.z === e.z && dist(e, d) <= 2)
        if (dog) {
          const target = Math.random() < 0.6 ? throwTarget(e, dog) : null
          ;[e.mate, dog.mate, e.t, dog.t, e.goal, dog.goal] = [dog.id, e.id, 0, 0, null, null]
          face(e, dog)
          face(dog, e)
          if (target) {
            e.mode = "wait"
            dog.mode = "fetch"
            e.say = 3
            balls.push({ id: nextId++, x: e.x, y: e.y, z: e.z + 0.6, tx: target.x, ty: target.y, tz: target.z, owner: e.id, dog: dog.id })
            face(e, target)
          } else {
            e.mode = dog.mode = "pet"
            e.t = dog.t = 7
          }
          continue
        }
      }
      live(e)
    } else if (e.mode === "pet") {
      if (e.kind === "dog") e.heart = 2
      if (--e.t <= 0) end(e)
    } else if (e.mode === "wait") {
      if (++e.t > 50) end(e)
    } else if (e.mode === "fetch") {
      const ball = balls.find((b) => b.dog === e.id)
      if (!ball || ++e.t > 45) {
        end(e)
        continue
      }
      if (e.x === ball.x && e.y === ball.y) {
        e.ball = true
        e.mode = "return"
        e.t = 0
        balls = balls.filter((b) => b !== ball)
      } else if (!stepTo(e, ball)) end(e)
    } else if (e.mode === "return" && mate) {
      face(mate, e)
      if (dist(e, mate) <= 1) {
        face(e, mate)
        e.heart = mate.heart = 5
        end(e)
      } else if (++e.t > 45 || !stepTo(e, mate)) end(e)
    }
  }
  return { ents, balls }
}

type Box = { x: number; y: number; z: number; w: number; d: number; h: number; color: string }

function creatureBoxes(e: Ent, fx: number, fy: number, s: number): Box[] {
  const k = e.kind === "person" ? 1.35 : 1.6
  const B = (a: number, b: number, z: number, w: number, d: number, h: number, color: string): Box => {
    const r = (u: number, v: number) => [(u * fx - v * fy) * k, (u * fy + v * fx) * k]
    const [x1, y1] = r(a, b)
    const [x2, y2] = r(a + w, b + d)
    return { x: Math.min(x1, x2), y: Math.min(y1, y2), z: z * k, w: Math.abs(x2 - x1), d: Math.abs(y2 - y1), h: h * k, color }
  }
  const bob = Math.abs(s) * 0.025
  if (e.kind === "person") {
    const [shirt, skin, pants, hair] = e.c
    const pet = e.mode === "pet"
    return [
      B(-0.06 + s * 0.08, -0.12, 0, 0.12, 0.11, 0.32, pants),
      B(-0.06 - s * 0.08, 0.01, 0, 0.12, 0.11, 0.32, pants),
      B(-0.12, -0.13, 0.32 + bob, 0.24, 0.26, 0.34, shirt),
      B(-0.04 - s * 0.09, -0.2, 0.36 + bob, 0.08, 0.07, 0.28, skin),
      pet ? B(0.08, 0.13, 0.52, 0.26, 0.07, 0.07, skin) : B(-0.04 + s * 0.09, 0.13, 0.36 + bob, 0.08, 0.07, 0.28, skin),
      B(-0.13, -0.13, 0.66 + bob, 0.26, 0.26, 0.24, skin),
      B(-0.14, -0.14, 0.9 + bob, 0.28, 0.28, 0.07, hair),
    ]
  }
  const coat = e.c[0]
  const dark = shade(coat, 0.6)
  const wag = e.heart > 0 ? Math.sin(performance.now() / 70) * 0.06 : 0
  const leg = (a: number, b: number, sw: number) => B(a + sw * 0.06, b, 0, 0.08, 0.08, 0.15, dark)
  return [
    leg(0.06, -0.13, s),
    leg(0.06, 0.05, -s),
    leg(-0.2, -0.13, -s),
    leg(-0.2, 0.05, s),
    B(-0.22, -0.14, 0.14 + bob, 0.38, 0.28, 0.2, coat),
    B(0.1, -0.12, 0.24 + bob, 0.24, 0.24, 0.22, coat),
    B(0.34, -0.06, 0.26 + bob, 0.07, 0.12, 0.08, dark),
    B(0.13, -0.12, 0.46 + bob, 0.07, 0.07, 0.07, dark),
    B(0.13, 0.05, 0.46 + bob, 0.07, 0.07, 0.07, dark),
    B(-0.28, -0.03 + wag, 0.3, 0.07, 0.07, 0.14, coat),
    ...(e.ball ? [B(0.36, -0.05, 0.32, 0.1, 0.1, 0.1, "#ff5a5a")] : []),
  ]
}

function Cuboid({ b }: { b: Box }) {
  const { x, y, z, w, d, h, color } = b
  return (
    <>
      <polygon points={`${p(x, y, z + h)} ${p(x + w, y, z + h)} ${p(x + w, y + d, z + h)} ${p(x, y + d, z + h)}`} fill={color} />
      <polygon points={`${p(x + w, y, z + h)} ${p(x + w, y + d, z + h)} ${p(x + w, y + d, z)} ${p(x + w, y, z)}`} fill={shade(color, 0.62)} />
      <polygon points={`${p(x, y + d, z + h)} ${p(x + w, y + d, z + h)} ${p(x + w, y + d, z)} ${p(x, y + d, z)}`} fill={shade(color, 0.8)} />
    </>
  )
}

function fitsWidth(x: number, y: number, hw: number) {
  for (let r = 0; r < 4; r++) {
    const [vx, vy] = toView(x, y, r)
    if (Math.abs((vx - vy) * C) + C > hw - 2) return false
  }
  return true
}

export function VoxelBuilder() {
  const [world, setWorld] = useState<World>(() => new Map())
  const [sim, setSim] = useState<Sim>({ ents: [], balls: [] })
  const [rot, setRot] = useState(0)
  const [tool, setTool] = useState(0)
  const [erase, setErase] = useState(false)
  const [hover, setHover] = useState<string | null>(null)
  const [hw, setHw] = useState(200)
  const [visible, setVisible] = useState(false)
  const [ready, setReady] = useState(false)
  const [, setFrame] = useState(0)
  const wrap = useRef<HTMLDivElement>(null)
  const worldRef = useRef(world)
  const base = useRef(new Set<string>())
  const prev = useRef(new Map<number, Pos>())
  const tickAt = useRef(0)
  const born = useRef(new Map<string, number>())
  worldRef.current = world
  const now = performance.now()
  const bucket = Math.floor(now / 500)

  const reset = (half: number) => {
    const w = buildWorld(radiusFor(half))
    const t = performance.now()
    base.current = new Set([...w.keys()].filter((k) => k.endsWith(",0")))
    born.current = new Map([...w.keys()].map((k) => [k, t]))
    prev.current = new Map()
    setWorld(w)
    setSim(spawn(w, radiusFor(half)))
    setRot(0)
  }

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const half = el.clientWidth / SCALE / 2
    setHw(half)
    reset(half)
    setReady(true)
    const ro = new ResizeObserver(([e]) => setHw(e.contentRect.width / SCALE / 2))
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    ro.observe(el)
    io.observe(el)
    return () => {
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!visible) return
    const id = setInterval(() => {
      setSim((s) => {
        const m = new Map<number, Pos>()
        for (const e of s.ents) m.set(e.id, { x: e.x, y: e.y, z: e.z })
        for (const b of s.balls) m.set(b.id, { x: b.x, y: b.y, z: b.z })
        prev.current = m
        tickAt.current = performance.now()
        return step(s, worldRef.current)
      })
    }, TICK)
    let raf = 0
    const loop = () => {
      setFrame((f) => f + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      clearInterval(id)
      cancelAnimationFrame(raf)
    }
  }, [visible])

  const rotate = (d: number) => setRot((r) => (r + d + 4) % 4)

  const act = (vx: number, vy: number, z: number, f: Face) => {
    const [x, y] = toWorld(vx, vy, rot)
    if (erase) {
      if (base.current.has(key(x, y, z))) return
      const next = new Map(world)
      next.delete(key(x, y, z))
      setWorld(next)
      return
    }
    const [nvx, nvy, nz] = f === "top" ? [vx, vy, z + 1] : f === "right" ? [vx + 1, vy, z] : [vx, vy + 1, z]
    const [nx, ny] = toWorld(nvx, nvy, rot)
    if (nz > MAX_Z || !fitsWidth(nx, ny, hw)) return
    if (tool >= PALETTE.length) {
      const kind = CREATURES[tool - PALETTE.length].kind
      if (!walkable(world, nx, ny, nz)) return
      setSim((s) =>
        s.ents.length >= 30 || s.ents.some((e) => e.x === nx && e.y === ny && e.z === nz)
          ? s
          : { ...s, ents: [...s.ents, makeEnt(kind, nx, ny, nz)] },
      )
      return
    }
    if (sim.ents.some((e) => e.x === nx && e.y === ny && (e.z === nz || e.z === nz - 1))) return
    const { color, side } = PALETTE[tool]
    const next = new Map(world)
    next.set(key(nx, ny, nz), { color, side })
    born.current.set(key(nx, ny, nz), performance.now())
    setWorld(next)
  }

  const blocks = useMemo(() => {
    const items = [...world.entries()].map(([k, b]) => {
      const [x, y, z] = k.split(",").map(Number)
      const [vx, vy] = toView(x, y, rot)
      return { k, z, vx, vy, b }
    })
    const occ = new Set(items.map((i) => key(i.vx, i.vy, i.z)))
    let minY = Infinity
    let maxY = -Infinity
    let maxX = 0
    const t = performance.now()
    const els = items.map(({ k, vx, vy, z, b }) => {
      minY = Math.min(minY, (vx + vy) * H - (z + 1) * S)
      maxY = Math.max(maxY, (vx + vy + 2) * H - z * S)
      maxX = Math.max(maxX, Math.abs((vx - vy) * C) + C)
      const showTop = !occ.has(key(vx, vy, z + 1))
      const showRight = !occ.has(key(vx + 1, vy, z))
      const showLeft = !occ.has(key(vx, vy + 1, z))
      const lit = (f: Face) => hover === `${k}:${f}`
      const faceProps = (f: Face) => ({
        onClick: () => act(vx, vy, z, f),
        onPointerEnter: () => setHover(`${k}:${f}`),
        stroke: lit(f) ? (erase ? "#ff6b6b" : "#ffffff") : "none",
        strokeWidth: 1.2,
        className: "cursor-pointer",
      })
      const side = b.side ?? b.color
      return {
        depth: vx + vy + z,
        el: (
          <g key={k} className={t - (born.current.get(k) ?? 0) < 600 ? "voxel-drop" : undefined}>
            {showTop && <polygon points={`${p(vx, vy, z + 1)} ${p(vx + 1, vy, z + 1)} ${p(vx + 1, vy + 1, z + 1)} ${p(vx, vy + 1, z + 1)}`} fill={b.color} {...faceProps("top")} />}
            {showRight && <polygon points={`${p(vx + 1, vy, z + 1)} ${p(vx + 1, vy + 1, z + 1)} ${p(vx + 1, vy + 1, z)} ${p(vx + 1, vy, z)}`} fill={shade(side, 0.62)} {...faceProps("right")} />}
            {showLeft && <polygon points={`${p(vx, vy + 1, z + 1)} ${p(vx + 1, vy + 1, z + 1)} ${p(vx + 1, vy + 1, z)} ${p(vx, vy + 1, z)}`} fill={shade(side, 0.8)} {...faceProps("left")} />}
          </g>
        ),
      }
    })
    return { els, minY, maxY, maxX }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, rot, hover, erase, tool, hw, sim.ents, bucket])

  const alpha = Math.min(1, (now - tickAt.current) / TICK)
  const at = (id: number, cur: Pos) => {
    const o = prev.current.get(id) ?? cur
    const moving = o.x !== cur.x || o.y !== cur.y
    const [vx, vy] = toView(o.x + (cur.x - o.x) * alpha, o.y + (cur.y - o.y) * alpha, rot)
    return { vx, vy, z: o.z + (cur.z - o.z) * alpha, moving }
  }

  const overlay: React.ReactNode[] = []
  const sprites = [
    ...sim.ents.map((e) => {
      const { vx, vy, z, moving } = at(e.id, e)
      const [fx, fy] = toView(e.dx, e.dy, rot)
      const swing = moving ? Math.sin(alpha * Math.PI * 2) : 0
      const parts = creatureBoxes(e, fx || (fy ? 0 : 1), fy, swing).sort(
        (a, b) => a.x + a.w / 2 + a.y + a.d / 2 + a.z - (b.x + b.w / 2 + b.y + b.d / 2 + b.z),
      )
      const [sx, sy] = proj(vx + 0.5, vy + 0.5, z)
      const top = sy - (e.kind === "person" ? 1.35 : 0.85) * S
      if (e.heart > 0)
        overlay.push(
          <path key={`h${e.id}`} transform={`translate(${sx.toFixed(2)} ${(top - 4).toFixed(2)})`} d="M0,3 L-3.5,-0.5 A1.8,1.8 0 0 1 0,-2.6 A1.8,1.8 0 0 1 3.5,-0.5 Z" fill="#ff6b8a" />,
        )
      if (e.say > 0)
        overlay.push(
          <g key={`s${e.id}`} transform={`translate(${sx.toFixed(2)} ${(top - 6).toFixed(2)})`} className="pointer-events-none">
            <polygon points="-2,-1 3,-1 -1,4" fill="#ffffff" />
            <rect x={-15} y={-12} width={30} height={11} rx={3} fill="#ffffff" />
            <text x={0} y={-4.2} textAnchor="middle" fontSize={7.5} fontWeight={600} fill="#111111">fetch!</text>
          </g>,
        )
      return {
        depth: vx + vy + z + 0.5,
        el: (
          <g
            key={`e${e.id}`}
            transform={`translate(${sx.toFixed(2)} ${sy.toFixed(2)})`}
            className={erase ? "cursor-pointer" : "pointer-events-none"}
            onClick={() => erase && setSim((s) => ({ ...s, ents: s.ents.filter((x) => x.id !== e.id) }))}
          >
            {parts.map((b, i) => <Cuboid key={i} b={b} />)}
          </g>
        ),
      }
    }),
    ...sim.balls.map((b) => {
      const { vx, vy, z } = at(b.id, b)
      const [sx, sy] = proj(vx + 0.5, vy + 0.5, z + 4 * alpha * (1 - alpha) * 1.5)
      return {
        depth: vx + vy + z + 0.5,
        el: (
          <g key={`b${b.id}`} transform={`translate(${sx.toFixed(2)} ${sy.toFixed(2)})`} className="pointer-events-none">
            <Cuboid b={{ x: -0.07, y: -0.07, z: 0, w: 0.14, d: 0.14, h: 0.14, color: "#ff5a5a" }} />
          </g>
        ),
      }
    }),
  ]

  const scene = [...blocks.els, ...sprites].sort((a, b) => a.depth - b.depth)
  const half = Math.max(hw, blocks.maxX + 2)
  const top = (Number.isFinite(blocks.minY) ? blocks.minY : -100) - 30
  const height = (Number.isFinite(blocks.maxY) ? blocks.maxY : 100) - top + 8
  const tools = [...PALETTE.map((c) => ({ ...c, label: `${c.name} block` })), ...CREATURES.map((c) => ({ ...c, color: "", label: `Add ${c.name.toLowerCase()}` }))]

  return (
    <div className="select-none">
      <div ref={wrap} className="w-full">
        <svg
          viewBox={`${(-half).toFixed(1)} ${top.toFixed(1)} ${(half * 2).toFixed(1)} ${height.toFixed(1)}`}
          className="w-full h-auto"
          onPointerLeave={() => setHover(null)}
          role="img"
          aria-label="Interactive voxel world"
        >
          {ready && scene.map((s) => s.el)}
          {ready && overlay}
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {tools.map((c, i) => (
          <button
            key={c.name}
            title={c.label}
            aria-label={c.label}
            onClick={() => {
              setTool(i)
              setErase(false)
            }}
            className={`h-7 border-2 transition-transform ${i < PALETTE.length ? "w-7" : "px-2 text-xs text-gray-200 border-[#2b2f38]"} ${!erase && tool === i ? "!border-white -translate-y-0.5" : i < PALETTE.length ? "border-transparent" : ""}`}
            style={i < PALETTE.length ? { background: c.color, boxShadow: `3px 3px 0 0 ${shade(c.color, 0.5)}` } : { boxShadow: "3px 3px 0 0 #1a1d23" }}
          >
            {i < PALETTE.length ? null : c.name}
          </button>
        ))}
        <span className="w-2" />
        {[
          { label: "Erase", on: erase, fn: () => setErase((e) => !e) },
          { label: "↺", on: false, fn: () => rotate(-1), aria: "Rotate left" },
          { label: "↻", on: false, fn: () => rotate(1), aria: "Rotate right" },
          { label: "Reset", on: false, fn: () => reset(hw) },
        ].map((b) => (
          <button
            key={b.label}
            aria-label={b.aria ?? b.label}
            onClick={b.fn}
            className={`text-xs px-2 h-7 border-2 ${b.on ? "border-[#ff6b6b] text-[#ff6b6b]" : "border-[#2b2f38] text-gray-300 hover:border-gray-400"}`}
            style={{ boxShadow: "3px 3px 0 0 #1a1d23" }}
          >
            {b.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-gray-500 text-center">
        Click a block face to build, or add people and dogs. Build past the edges to grow the island.
      </p>
    </div>
  )
}
