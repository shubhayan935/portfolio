"use client"

import { useMemo, useRef, useState } from "react"

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

function p(x: number, y: number, z: number) {
  return `${((x - y) * C).toFixed(2)},${((x + y) * H - z * S).toFixed(2)}`
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

  add(5, 6, 2, "#3b5bdb")
  add(5, 6, 3, "#f1f3f5")
  add(5, 6, 4, "#f2c79b")

  add(6, 2, 2, "#f4ff5c")
  add(6, 3, 2, "#f4ff5c")
  add(6, 2, 3, "#f4ff5c")

  return v
}

const N = 8
const MAX_Z = 12
const PALETTE = [
  { name: "Grass", color: "#5cc160", side: "#6b4428" },
  { name: "Wood", color: "#7a4b2a" },
  { name: "Leaves", color: "#2e8b3e" },
  { name: "Stone", color: "#8a8f98" },
  { name: "Ramp", color: "#f4ff5c" },
  { name: "Glass", color: "#5ab0ff" },
  { name: "Brick", color: "#c0533a" },
  { name: "Snow", color: "#f1f3f5" },
]

type Block = { color: string; side?: string }
type Face = "top" | "right" | "left"

const key = (x: number, y: number, z: number) => `${x},${y},${z}`

function initialWorld() {
  const m = new Map<string, Block>()
  for (const b of buildScene()) m.set(key(b.x, b.y, b.z), { color: b.color, side: b.side })
  return m
}

function toView(x: number, y: number, r: number): [number, number] {
  for (let i = 0; i < r; i++) [x, y] = [N - 1 - y, x]
  return [x, y]
}

function toWorld(x: number, y: number, r: number): [number, number] {
  for (let i = 0; i < r; i++) [x, y] = [y, N - 1 - x]
  return [x, y]
}

export function VoxelBuilder() {
  const [world, setWorld] = useState(initialWorld)
  const [rot, setRot] = useState(0)
  const [tool, setTool] = useState(0)
  const [erase, setErase] = useState(false)
  const [hover, setHover] = useState<string | null>(null)
  const drag = useRef<{ x: number; moved: boolean } | null>(null)

  const view = useMemo(() => {
    const items = [...world.entries()].map(([k, b]) => {
      const [x, y, z] = k.split(",").map(Number)
      const [vx, vy] = toView(x, y, rot)
      return { k, x, y, z, vx, vy, b }
    })
    const occ = new Set(items.map((i) => key(i.vx, i.vy, i.z)))
    items.sort((a, b) => a.vx + a.vy + a.z - (b.vx + b.vy + b.z) || a.z - b.z)
    return { items, occ }
  }, [world, rot])

  const rotate = (d: number) => setRot((r) => (r + d + 4) % 4)

  const act = (vx: number, vy: number, z: number, face: Face) => {
    if (drag.current?.moved) return
    const [x, y] = toWorld(vx, vy, rot)
    const next = new Map(world)
    if (erase) {
      if (z === 0) return
      next.delete(key(x, y, z))
    } else {
      const [nvx, nvy, nz] = face === "top" ? [vx, vy, z + 1] : face === "right" ? [vx + 1, vy, z] : [vx, vy + 1, z]
      const [nx, ny] = toWorld(nvx, nvy, rot)
      if (nx < 0 || ny < 0 || nx >= N || ny >= N || nz > MAX_Z) return
      const { color, side } = PALETTE[tool]
      next.set(key(nx, ny, nz), { color, side })
    }
    setWorld(next)
  }

  return (
    <div className="flex flex-col items-center select-none">
      <svg
        viewBox="-110 -140 230 255"
        className="w-[300px] md:w-[360px] h-auto touch-pan-y cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => (drag.current = { x: e.clientX, moved: false })}
        onPointerMove={(e) => {
          const d = drag.current
          if (!d) return
          const dx = e.clientX - d.x
          if (Math.abs(dx) > 6) d.moved = true
          if (Math.abs(dx) > 60) {
            rotate(dx > 0 ? 1 : -1)
            d.x = e.clientX
          }
        }}
        onPointerUp={() => setTimeout(() => (drag.current = null), 0)}
        onPointerLeave={() => {
          drag.current = null
          setHover(null)
        }}
        role="img"
        aria-label="Interactive voxel island"
      >
        {view.items.map(({ k, vx, vy, z, b }) => {
          const showTop = !view.occ.has(key(vx, vy, z + 1))
          const showRight = !view.occ.has(key(vx + 1, vy, z))
          const showLeft = !view.occ.has(key(vx, vy + 1, z))
          const lit = (f: Face) => hover === `${k}:${f}`
          const faceProps = (f: Face) => ({
            onClick: () => act(vx, vy, z, f),
            onPointerEnter: () => setHover(`${k}:${f}`),
            stroke: lit(f) ? (erase ? "#ff6b6b" : "#ffffff") : "none",
            strokeWidth: 1.2,
            className: "cursor-pointer",
          })
          const side = b.side ?? b.color
          return (
            <g key={k} className="voxel-drop">
              {showTop && <polygon points={`${p(vx, vy, z + 1)} ${p(vx + 1, vy, z + 1)} ${p(vx + 1, vy + 1, z + 1)} ${p(vx, vy + 1, z + 1)}`} fill={b.color} {...faceProps("top")} />}
              {showRight && <polygon points={`${p(vx + 1, vy, z + 1)} ${p(vx + 1, vy + 1, z + 1)} ${p(vx + 1, vy + 1, z)} ${p(vx + 1, vy, z)}`} fill={shade(side, 0.62)} {...faceProps("right")} />}
              {showLeft && <polygon points={`${p(vx, vy + 1, z + 1)} ${p(vx + 1, vy + 1, z + 1)} ${p(vx + 1, vy + 1, z)} ${p(vx, vy + 1, z)}`} fill={shade(side, 0.8)} {...faceProps("left")} />}
            </g>
          )
        })}
      </svg>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {PALETTE.map((c, i) => (
          <button
            key={c.name}
            title={c.name}
            aria-label={`${c.name} block`}
            onClick={() => {
              setTool(i)
              setErase(false)
            }}
            className={`size-7 border-2 transition-transform ${!erase && tool === i ? "border-white -translate-y-0.5" : "border-transparent"}`}
            style={{ background: c.color, boxShadow: `3px 3px 0 0 ${shade(c.color, 0.5)}` }}
          />
        ))}
        <span className="w-2" />
        {[
          { label: "Erase", on: erase, fn: () => setErase((e) => !e) },
          { label: "↺", on: false, fn: () => rotate(-1), aria: "Rotate left" },
          { label: "↻", on: false, fn: () => rotate(1), aria: "Rotate right" },
          { label: "Reset", on: false, fn: () => { setWorld(initialWorld()); setRot(0) } },
        ].map((b) => (
          <button
            key={b.label}
            aria-label={b.aria ?? b.label}
            onClick={b.fn}
            className={`font-pixel text-sm px-2 h-7 border-2 ${b.on ? "border-[#ff6b6b] text-[#ff6b6b]" : "border-[#2b2f38] text-gray-300 hover:border-gray-400"}`}
            style={{ boxShadow: "3px 3px 0 0 #1a1d23" }}
          >
            {b.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-gray-500 font-pixel">click to build · drag to rotate</p>
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
    <h2 className={`flex items-center gap-3 text-2xl font-pixel ${className}`}>
      <VoxelCube color={color} />
      {children}
    </h2>
  )
}
