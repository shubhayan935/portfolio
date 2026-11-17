"use client"

import { useEffect, useMemo, useRef, useState } from "react"

type Voxel = { x: number; y: number; z: number; color: string; side?: string }

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

function buildScene(): Voxel[] {
  const v: Voxel[] = []
  const add = (x: number, y: number, z: number, color: string, side?: string) => v.push({ x, y, z, color, side })
  const cut = new Set(["0,0", "0,7", "7,0", "7,7", "0,6", "6,0", "1,7"])

  for (let x = 0; x < 8; x++)
    for (let y = 0; y < 8; y++) {
      if (cut.has(`${x},${y}`)) continue
      add(x, y, 0, "#5b3a24")
      add(x, y, 1, (x + y) % 3 === 0 ? "#4caf50" : "#5cc160", "#6b4428")
    }

  for (let z = 2; z <= 4; z++) add(1, 2, z, "#7a4b2a")
  for (let x = 0; x <= 2; x++)
    for (let y = 1; y <= 3; y++) {
      add(x, y, 5, "#2e8b3e")
      if (x === 1 || y === 2) add(x, y, 6, "#38a34a")
    }
  add(1, 2, 7, "#45b858")

  add(4, 4, 2, "#c9a26b")
  add(5, 4, 2, "#c9a26b")
  add(4, 3, 3, "#2b2f38", "#5ab0ff")
  add(5, 3, 3, "#2b2f38", "#5ab0ff")
  add(4, 3, 4, "#2b2f38", "#5ab0ff")
  add(5, 3, 4, "#2b2f38", "#5ab0ff")

  add(6, 2, 2, "#f4ff5c")
  add(6, 3, 2, "#f4ff5c")
  add(6, 2, 3, "#f4ff5c")

  return v
}

const N = 8
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

type Kind = "person" | "dog" | "cat"
const CREATURES: { name: string; kind: Kind; color: string }[] = [
  { name: "Person", kind: "person", color: "#f2c79b" },
  { name: "Dog", kind: "dog", color: "#c98b4f" },
  { name: "Cat", kind: "cat", color: "#f08c3a" },
]
const SHIRTS = ["#3b5bdb", "#e8590c", "#2f9e44", "#ae3ec9", "#f1f3f5", "#1c7ed6", "#c0533a"]
const SKINS = ["#f2c79b", "#d9a066", "#a8703f", "#6b4428"]
const PANTS = ["#2b2f38", "#364fc7", "#5c3d2e"]
const HAIR = ["#2b1d14", "#5c3d2e", "#d9b25f", "#111111"]
const DOGS = ["#c98b4f", "#f1f3f5", "#3b3b3b", "#8a5a33", "#e0b878"]
const CATS = ["#f08c3a", "#8a8f98", "#2b2f38", "#f1f3f5"]
const DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]]

type Block = { color: string; side?: string }
type Face = "top" | "right" | "left"
type Mode = "walk" | "pet" | "wait" | "fetch" | "return"
type Ent = {
  id: number; kind: Kind; x: number; y: number; z: number; dx: number; dy: number
  c: string[]; mode: Mode; mate: number; t: number; cool: number; heart: number; ball: boolean
}
type Ball = { id: number; x: number; y: number; z: number; tx: number; ty: number; tz: number; owner: number; dog: number }
type Sim = { ents: Ent[]; balls: Ball[] }
type Pos = { x: number; y: number; z: number }

const key = (x: number, y: number, z: number) => `${x},${y},${z}`
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5)

let nextId = 1
function makeEnt(kind: Kind, x: number, y: number, z: number): Ent {
  const c =
    kind === "person" ? [pick(SHIRTS), pick(SKINS), pick(PANTS), pick(HAIR)]
    : kind === "dog" ? [pick(DOGS)]
    : [pick(CATS)]
  const [dx, dy] = pick(DIRS)
  return { id: nextId++, kind, x, y, z, dx, dy, c, mode: "walk", mate: -1, t: 0, cool: 6, heart: 0, ball: false }
}

function initialWorld() {
  const m = new Map<string, Block>()
  for (const b of buildScene()) m.set(key(b.x, b.y, b.z), { color: b.color, side: b.side })
  return m
}

const BASE = new Set([...initialWorld().keys()].filter((k) => k.endsWith(",0")))

function initialSim(): Sim {
  return {
    ents: [
      makeEnt("person", 5, 6, 2),
      makeEnt("dog", 6, 5, 2),
      makeEnt("person", 2, 5, 2),
      makeEnt("dog", 3, 6, 2),
      makeEnt("cat", 3, 1, 2),
    ],
    balls: [],
  }
}

function toView(x: number, y: number, r: number): [number, number] {
  for (let i = 0; i < r; i++) [x, y] = [N - 1 - y, x]
  return [x, y]
}

function toWorld(x: number, y: number, r: number): [number, number] {
  for (let i = 0; i < r; i++) [x, y] = [y, N - 1 - x]
  return [x, y]
}

function step(sim: Sim, world: Map<string, Block>): Sim {
  const has = (x: number, y: number, z: number) => world.has(key(x, y, z))
  const canStand = (x: number, y: number, z: number) => !has(x, y, z) && has(x, y, z - 1)
  let balls = sim.balls.map((b) => ({ ...b, x: b.tx, y: b.ty, z: b.tz }))
  const ents: Ent[] = []
  for (const o of sim.ents) {
    const e = { ...o }
    for (let n = 0; has(e.x, e.y, e.z) && n < 20; n++) e.z++
    for (let n = 0; !has(e.x, e.y, e.z - 1) && n < 30; n++) e.z--
    if (has(e.x, e.y, e.z - 1)) ents.push(e)
  }
  const byId = new Map(ents.map((e) => [e.id, e]))
  const occ = new Set(ents.map((e) => key(e.x, e.y, e.z)))
  const dist = (a: Pos, b: Pos) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
  const face = (e: Ent, o: Pos) => {
    const dx = o.x - e.x
    const dy = o.y - e.y
    if (Math.abs(dx) >= Math.abs(dy) && dx) [e.dx, e.dy] = [Math.sign(dx), 0]
    else if (dy) [e.dx, e.dy] = [0, Math.sign(dy)]
  }
  const move = (e: Ent, tx: number, ty: number) => {
    for (const dz of [0, 1, -1]) {
      const nz = e.z + dz
      if (canStand(tx, ty, nz) && (dz < 1 || !has(e.x, e.y, e.z + 1)) && !occ.has(key(tx, ty, nz))) {
        occ.delete(key(e.x, e.y, e.z))
        ;[e.dx, e.dy, e.x, e.y, e.z] = [tx - e.x, ty - e.y, tx, ty, nz]
        occ.add(key(e.x, e.y, e.z))
        return true
      }
    }
    return false
  }
  const wander = (e: Ent) => {
    if (Math.random() < 0.35) return
    const dirs = Math.random() < 0.6 ? [[e.dx, e.dy] as [number, number], ...shuffle(DIRS)] : shuffle(DIRS)
    for (const [dx, dy] of dirs) if (move(e, e.x + dx, e.y + dy)) return
  }
  const toward = (e: Ent, o: Pos) => {
    const opts = DIRS.map((d) => ({ d, n: Math.abs(e.x + d[0] - o.x) + Math.abs(e.y + d[1] - o.y) })).sort((a, b) => a.n - b.n)
    for (const { d } of opts) if (move(e, e.x + d[0], e.y + d[1])) return
  }
  const end = (e: Ent) => {
    for (const x of [e, byId.get(e.mate)]) {
      if (!x) continue
      x.mode = "walk"
      x.mate = -1
      x.t = 0
      x.cool = 12
      x.ball = false
    }
    balls = balls.filter((b) => b.owner !== e.id && b.dog !== e.id)
  }
  const throwTarget = (e: Ent): Pos | null => {
    for (let i = 0; i < 16; i++) {
      const tx = e.x + Math.round(Math.random() * 8 - 4)
      const ty = e.y + Math.round(Math.random() * 8 - 4)
      const d = Math.abs(tx - e.x) + Math.abs(ty - e.y)
      if (d < 2 || d > 5) continue
      for (const tz of [e.z, e.z + 1, e.z - 1, e.z - 2]) if (canStand(tx, ty, tz)) return { x: tx, y: ty, z: tz }
    }
    return null
  }

  for (const e of ents) {
    if (e.heart > 0) e.heart--
    if (e.cool > 0) e.cool--
    const mate = byId.get(e.mate)
    if (e.mode !== "walk" && (!mate || mate.mate !== e.id)) {
      end(e)
      continue
    }
    if (e.mode === "walk") {
      if (e.kind === "person" && e.cool === 0 && Math.random() < 0.3) {
        const dog = ents.find((d) => d.kind === "dog" && d.mode === "walk" && d.cool === 0 && dist(e, d) <= 2)
        if (dog) {
          const target = Math.random() < 0.55 ? throwTarget(e) : null
          ;[e.mate, dog.mate, e.t, dog.t] = [dog.id, e.id, 0, 0]
          face(e, dog)
          face(dog, e)
          if (target) {
            e.mode = "wait"
            dog.mode = "fetch"
            balls.push({ id: nextId++, x: e.x, y: e.y, z: e.z + 0.6, tx: target.x, ty: target.y, tz: target.z, owner: e.id, dog: dog.id })
            face(e, target)
          } else {
            e.mode = dog.mode = "pet"
            e.t = dog.t = 7
          }
          continue
        }
      }
      wander(e)
    } else if (e.mode === "pet") {
      if (e.kind === "dog") e.heart = 2
      if (--e.t <= 0) end(e)
    } else if (e.mode === "wait") {
      if (++e.t > 45) end(e)
    } else if (e.mode === "fetch") {
      const ball = balls.find((b) => b.dog === e.id)
      if (!ball || ++e.t > 40) {
        end(e)
        continue
      }
      if (ball.x !== ball.tx || ball.y !== ball.ty) continue
      if (e.x === ball.x && e.y === ball.y) {
        e.ball = true
        e.mode = "return"
        e.t = 0
        balls = balls.filter((b) => b !== ball)
      } else toward(e, ball)
    } else if (e.mode === "return" && mate) {
      if (dist(e, mate) <= 1) {
        face(e, mate)
        face(mate, e)
        e.heart = mate.heart = 5
        end(e)
      } else if (++e.t > 40) end(e)
      else {
        toward(e, mate)
        face(mate, e)
      }
    }
  }
  return { ents, balls }
}

type Box = { x: number; y: number; z: number; w: number; d: number; h: number; color: string }

function box(fx: number, fy: number, a: number, b: number, z: number, w: number, d: number, h: number, color: string): Box {
  const r = (u: number, v: number) => [u * fx - v * fy, u * fy + v * fx]
  const [x1, y1] = r(a, b)
  const [x2, y2] = r(a + w, b + d)
  return { x: Math.min(x1, x2), y: Math.min(y1, y2), z, w: Math.abs(x2 - x1), d: Math.abs(y2 - y1), h, color }
}

function creatureBoxes(e: Ent, fx: number, fy: number): Box[] {
  const k = e.kind === "person" ? 1.35 : 1.6
  const B = (a: number, b: number, z: number, w: number, d: number, h: number, c: string) => box(fx, fy, a * k, b * k, z * k, w * k, d * k, h * k, c)
  if (e.kind === "person") {
    const [shirt, skin, pants, hair] = e.c
    return [
      B(-0.1, -0.15, 0, 0.2, 0.3, 0.32, pants),
      B(-0.11, -0.17, 0.32, 0.22, 0.34, 0.34, shirt),
      B(-0.12, -0.12, 0.66, 0.24, 0.24, 0.22, skin),
      B(-0.13, -0.13, 0.88, 0.26, 0.26, 0.07, hair),
      ...(e.mode === "pet" ? [B(0.11, -0.05, 0.5, 0.22, 0.1, 0.08, shirt)] : []),
    ]
  }
  const coat = e.c[0]
  const dark = shade(coat, 0.6)
  if (e.kind === "dog")
    return [
      B(-0.22, -0.1, 0, 0.4, 0.2, 0.14, dark),
      B(-0.25, -0.12, 0.14, 0.45, 0.24, 0.2, coat),
      B(0.14, -0.11, 0.22, 0.2, 0.22, 0.2, coat),
      B(0.34, -0.06, 0.24, 0.07, 0.12, 0.08, dark),
      B(0.17, -0.12, 0.42, 0.06, 0.06, 0.06, dark),
      B(0.17, 0.06, 0.42, 0.06, 0.06, 0.06, dark),
      B(-0.31, -0.03, 0.3, 0.07, 0.06, 0.14, coat),
      ...(e.ball ? [B(0.36, -0.05, 0.3, 0.1, 0.1, 0.1, "#ff5a5a")] : []),
    ]
  return [
    B(-0.15, -0.07, 0, 0.28, 0.14, 0.1, dark),
    B(-0.17, -0.08, 0.1, 0.32, 0.16, 0.14, coat),
    B(0.1, -0.09, 0.16, 0.15, 0.18, 0.15, coat),
    B(0.13, -0.09, 0.31, 0.05, 0.05, 0.05, coat),
    B(0.13, 0.04, 0.31, 0.05, 0.05, 0.05, coat),
    B(-0.22, -0.025, 0.18, 0.05, 0.05, 0.22, coat),
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

const Heart = ({ y }: { y: number }) => (
  <path transform={`translate(0 ${y})`} d="M0,3 L-3.5,-0.5 A1.8,1.8 0 0 1 0,-2.6 A1.8,1.8 0 0 1 3.5,-0.5 Z" fill="#ff6b8a" />
)

function fitsWidth(x: number, y: number, hw: number) {
  for (let r = 0; r < 4; r++) {
    const [vx, vy] = toView(x, y, r)
    if (Math.abs((vx - vy) * C) + C > hw - 2) return false
  }
  return true
}

export function VoxelBuilder() {
  const [world, setWorld] = useState(initialWorld)
  const [sim, setSim] = useState(initialSim)
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
  const prev = useRef(new Map<number, Pos>())
  const tickAt = useRef(0)
  const born = useRef<Map<string, number> | null>(null)
  worldRef.current = world
  const now = performance.now()
  born.current ??= new Map([...world.keys()].map((k) => [k, now]))
  const bucket = Math.floor(now / 500)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
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
      if (BASE.has(key(x, y, z))) return
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
      if (!world.has(key(nx, ny, nz - 1)) || world.has(key(nx, ny, nz))) return
      setSim((s) =>
        s.ents.length >= 30 || s.ents.some((e) => e.x === nx && e.y === ny && e.z === nz)
          ? s
          : { ...s, ents: [...s.ents, makeEnt(kind, nx, ny, nz)] },
      )
      return
    }
    if (sim.ents.some((e) => e.x === nx && e.y === ny && e.z === nz)) return
    const { color, side } = PALETTE[tool]
    const next = new Map(world)
    next.set(key(nx, ny, nz), { color, side })
    born.current?.set(key(nx, ny, nz), performance.now())
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
    const els = items.map(({ k, vx, vy, z, b }) => {
      minY = Math.min(minY, (vx + vy) * H - (z + 1) * S)
      maxY = Math.max(maxY, (vx + vy + 2) * H - z * S)
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
          <g key={k} className={performance.now() - (born.current?.get(k) ?? 0) < 600 ? "voxel-drop" : undefined}>
            {showTop && <polygon points={`${p(vx, vy, z + 1)} ${p(vx + 1, vy, z + 1)} ${p(vx + 1, vy + 1, z + 1)} ${p(vx, vy + 1, z + 1)}`} fill={b.color} {...faceProps("top")} />}
            {showRight && <polygon points={`${p(vx + 1, vy, z + 1)} ${p(vx + 1, vy + 1, z + 1)} ${p(vx + 1, vy + 1, z)} ${p(vx + 1, vy, z)}`} fill={shade(side, 0.62)} {...faceProps("right")} />}
            {showLeft && <polygon points={`${p(vx, vy + 1, z + 1)} ${p(vx + 1, vy + 1, z + 1)} ${p(vx + 1, vy + 1, z)} ${p(vx, vy + 1, z)}`} fill={shade(side, 0.8)} {...faceProps("left")} />}
          </g>
        ),
      }
    })
    return { els, minY, maxY }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, rot, hover, erase, tool, hw, sim.ents.length, bucket])

  const alpha = Math.min(1, (performance.now() - tickAt.current) / TICK)
  const at = (id: number, cur: Pos) => {
    const o = prev.current.get(id) ?? cur
    const x = o.x + (cur.x - o.x) * alpha
    const y = o.y + (cur.y - o.y) * alpha
    const z = o.z + (cur.z - o.z) * alpha
    const [vx, vy] = toView(x, y, rot)
    return { vx, vy, z }
  }

  const sprites = [
    ...sim.ents.map((e) => {
      const { vx, vy, z } = at(e.id, e)
      const [fx, fy] = toView(e.dx || 1, e.dy, rot).map((n, i) => n - toView(0, 0, rot)[i])
      const parts = creatureBoxes(e, fx, fy).sort((a, b) => a.x + a.w / 2 + a.y + a.d / 2 + a.z - (b.x + b.w / 2 + b.y + b.d / 2 + b.z))
      const [sx, sy] = proj(vx + 0.5, vy + 0.5, z)
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
            {e.heart > 0 && <Heart y={-(e.kind === "person" ? 1.45 : 1) * S - 4} />}
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
            <Cuboid b={{ x: -0.06, y: -0.06, z: 0, w: 0.12, d: 0.12, h: 0.12, color: "#ff5a5a" }} />
          </g>
        ),
      }
    }),
  ]

  const scene = [...blocks.els, ...sprites].sort((a, b) => a.depth - b.depth)
  const top = blocks.minY - 30
  const height = blocks.maxY - top + 8
  const tools = [...PALETTE.map((c) => ({ ...c, label: `${c.name} block` })), ...CREATURES.map((c) => ({ ...c, label: `Add ${c.name.toLowerCase()}` }))]

  return (
    <div className="select-none">
      <div ref={wrap} className="w-full">
        <svg
          viewBox={`${(-hw).toFixed(1)} ${top.toFixed(1)} ${(hw * 2).toFixed(1)} ${height.toFixed(1)}`}
          className="w-full h-auto"
          onPointerLeave={() => setHover(null)}
          role="img"
          aria-label="Interactive voxel world"
        >
          {ready && scene.map((s) => s.el)}
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
          { label: "Reset", on: false, fn: () => { born.current = null; setWorld(initialWorld()); setSim(initialSim()); setRot(0) } },
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
        Click a block face to build or drop in a creature. Build out past the edges to grow the island.
      </p>
    </div>
  )
}

export function VoxelCube({ color = "#f4ff5c", className = "" }: { color?: string; className?: string }) {
  return (
    <svg viewBox="-9 -10 18 19" className={`inline-block size-5 ${className}`} aria-hidden="true">
      <polygon points="0,-9 8,-4.5 0,0 -8,-4.5" fill={color} />
      <polygon points="0,0 8,-4.5 8,4.5 0,9" fill={shade(color, 0.62)} />
      <polygon points="-8,-4.5 0,0 0,9 -8,4.5" fill={shade(color, 0.8)} />
    </svg>
  )
}

export function VoxelHeading({ children, className = "", color }: { children: React.ReactNode; className?: string; color?: string }) {
  return (
    <h2 className={`flex items-center gap-3 text-2xl font-normal font-garnett ${className}`}>
      <VoxelCube color={color} />
      {children}
    </h2>
  )
}
