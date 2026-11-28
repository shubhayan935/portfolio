import * as THREE from "three"
import { Batch, Pixels, BOX, rand, pick } from "./voxels"
import { textPixels } from "./font"

export const ROOM = { x0: -48, x1: 48, z0: -44, z1: 58, h: 46 }
export const LED = { w: 64, h: 24, x0: -32, y0: 12, z: -43.4 }
export const STAGE = { x0: -26, x1: 26, z0: -44, z1: -28, h: 4 }
export const BOOTH = { x0: -11, x1: 11, z0: -35, z1: -31, top: 8.6 }
export const TRUSS_ROWS = [-22, -2, 18]
export const TRUSS_Y = 40

export type World = ReturnType<typeof buildWorld>

export function buildWorld(scene: THREE.Scene) {
  const matte = new Batch()
  const gloss = new Batch()
  const metal = new Batch()
  const glow = new Batch()

  // floor: polished concrete tiles
  for (let x = ROOM.x0; x < ROOM.x1; x += 2)
    for (let z = ROOM.z0; z < ROOM.z1; z += 2) {
      const worn = Math.exp(-((x * x) / 900 + ((z - 4) * (z - 4)) / 700))
      const base = new THREE.Color("#2a2b30").lerp(new THREE.Color("#3a3634"), worn * 0.6)
      gloss.box(x, -0.5 + rand() * 0.04, z, 2, 0.5, 2, base, 0.12)
    }

  // back wall: concrete panels
  for (let x = ROOM.x0; x < ROOM.x1; x += 4)
    for (let y = 0; y < ROOM.h; y += 4) matte.box(x + 0.05, y + 0.05, ROOM.z0 - 2, 3.9, 3.9, 2, "#1b1c20", 0.15)
  // LED wall frame
  matte.box(LED.x0 - 1, LED.y0 - 1, LED.z - 0.9, LED.w + 2, LED.h + 2, 0.8, "#0a0a0c")
  // side walls: brick
  for (const side of [-1, 1]) {
    const xw = side < 0 ? ROOM.x0 - 1 : ROOM.x1
    matte.box(xw + (side < 0 ? -0.2 : 0.2), 0, ROOM.z0, 1, ROOM.h, ROOM.z1 - ROOM.z0, "#120c0b")
    for (let y = 0, row = 0; y < ROOM.h; y += 1.5, row++)
      for (let z = ROOM.z0 + (row % 2 ? -1.5 : 0); z < ROOM.z1; z += 3) {
        const z0 = Math.max(z, ROOM.z0), z1 = Math.min(z + 3, ROOM.z1)
        if (z1 - z0 < 0.5) continue
        const c = pick(["#3b211c", "#43261f", "#33201c", "#4a2c22", "#2c1b18"])
        matte.box(side < 0 ? xw + 0.6 : xw - 0.6, y + 0.07, z0 + 0.07, 1, 1.36, z1 - z0 - 0.14, c, 0.18)
      }
  }
  // front wall + ceiling + ducts
  matte.box(ROOM.x0, 0, ROOM.z1, ROOM.x1 - ROOM.x0, ROOM.h, 1, "#141416")
  matte.box(ROOM.x0 - 1, ROOM.h, ROOM.z0 - 2, ROOM.x1 - ROOM.x0 + 2, 1.5, ROOM.z1 - ROOM.z0 + 3, "#0c0c0e")
  for (const x of [-24, 24]) {
    metal.box(x - 2, ROOM.h - 4, ROOM.z0, 4, 3, ROOM.z1 - ROOM.z0, "#3b3e45", 0.05)
    for (let z = ROOM.z0; z < ROOM.z1; z += 8) metal.box(x - 2.2, ROOM.h - 4.2, z, 4.4, 3.4, 0.5, "#2c2e33")
  }
  // columns
  for (const x of [-42, 42]) for (const z of [-12, 22]) {
    matte.box(x - 1.6, 0, z - 1.6, 3.2, ROOM.h, 3.2, "#2a2a2e", 0.08)
    matte.box(x - 1.9, 0, z - 1.9, 3.8, 1, 3.8, "#1c1c1f")
  }

  // stage
  for (let x = STAGE.x0; x < STAGE.x1; x += 2)
    for (let z = STAGE.z0; z < STAGE.z1; z += 2) gloss.box(x, STAGE.h - 0.4, z, 2, 0.4, 2, "#121215", 0.2)
  matte.box(STAGE.x0, 0, STAGE.z0, STAGE.x1 - STAGE.x0, STAGE.h - 0.4, STAGE.z1 - STAGE.z0 - 0.6, "#0d0d10")
  // stage steps / barrier
  for (let x = STAGE.x0 + 1; x < STAGE.x1 - 1; x += 1.5) metal.box(x, 0, STAGE.z1 + 2.2, 0.25, 3.4, 0.25, "#5a5d66")
  metal.box(STAGE.x0 + 1, 3.3, STAGE.z1 + 2, STAGE.x1 - STAGE.x0 - 2, 0.35, 0.6, "#6b6f78")
  metal.box(STAGE.x0 + 1, 0.8, STAGE.z1 + 2.1, STAGE.x1 - STAGE.x0 - 2, 0.3, 0.4, "#4a4d55")

  // booth
  const B = BOOTH
  matte.box(B.x0, STAGE.h, B.z0, B.x1 - B.x0, B.top - STAGE.h - 0.4, B.z1 - B.z0, "#1a1a1e")
  matte.box(B.x0 - 0.3, B.top - 0.4, B.z0 - 0.3, B.x1 - B.x0 + 0.6, 0.4, B.z1 - B.z0 + 0.6, "#2b2b31")
  // gear: CDJs, mixer, laptop
  for (const cx of [-6.8, 6.8]) {
    matte.center(cx, B.top + 0.45, -33, 5, 0.9, 6.4, "#18181b")
    matte.center(cx, B.top + 0.95, -32.6, 3.8, 0.12, 3.8, "#0e0e10")
    matte.center(cx, B.top + 1.02, -32.6, 2.2, 0.12, 2.2, "#3c3f46")
    glow.center(cx, B.top + 0.98, -35.1, 3.2, 0.05, 1.2, "#3a7bff")
    glow.center(cx - 1.8, B.top + 0.95, -30.8, 0.6, 0.12, 0.6, "#26ff7a")
    glow.center(cx - 0.9, B.top + 0.95, -30.8, 0.6, 0.12, 0.6, "#ff7a1a")
    for (let i = 0; i < 6; i++) glow.center(cx + 2.1, B.top + 0.95, -35 + i * 0.8, 0.3, 0.1, 0.5, i % 2 ? "#ff3df5" : "#2bd9ff")
  }
  matte.center(0, B.top + 0.55, -33, 4.4, 1.1, 6.6, "#202024")
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) metal.center(-1.5 + c, B.top + 1.25, -35.2 + r * 1.1, 0.45, 0.35, 0.45, "#a8acb5")
  for (let c = 0; c < 4; c++) metal.center(-1.5 + c, B.top + 1.2, -30.7, 0.35, 0.3, 0.9, "#e6e8ec")
  metal.center(0, B.top + 1.2, -29.9, 2.2, 0.3, 0.35, "#e6e8ec")
  // laptop on stand
  metal.center(9.4, B.top + 1.2, -34, 0.4, 2.4, 0.4, "#8a8d95")
  metal.center(9.4, B.top + 2.45, -33.8, 3.6, 0.15, 2.4, "#c7cad1", 0, -0.25)
  metal.center(9.4, B.top + 3.6, -35.1, 3.6, 2.4, 0.12, "#c7cad1", 0, 0.32)
  glow.center(9.4, B.top + 3.62, -34.98, 3.3, 2.1, 0.05, "#6fa8ff", 0, 0.32)
  glow.center(9.4, B.top + 3.6, -35.2, 0.5, 0.6, 0.05, "#ffffff", 0, 0.32)
  // monitor wedges + racks
  for (const x of [-15, 15]) {
    matte.center(x, STAGE.h + 1.3, -35, 4, 2.6, 3.4, "#141417", 0, 0.35)
    metal.center(x, STAGE.h + 1.3, -33.4, 3.3, 1.9, 0.2, "#2a2c31", 0, 0.35)
  }
  matte.box(-20, STAGE.h, -42, 4, 8, 3, "#111114")
  for (let i = 0; i < 6; i++) glow.box(-19.5 + (i % 3) * 1.2, STAGE.h + 1 + Math.floor(i / 3) * 3, -38.95, 0.4, 0.3, 0.05, i % 2 ? "#26ff7a" : "#ff3b3b")

  // speaker stacks
  const cones: { x: number; y: number; z: number; s: number; sub: boolean }[] = []
  for (const sx of [-31, 31]) {
    const zf = -29.6
    let y = 0
    for (const sub of [true, true, false, false]) {
      const h = sub ? 8 : 6, w = sub ? 9 : 8
      matte.box(sx - w / 2, y + 0.05, zf - 8, w, h - 0.1, 8, "#101012")
      metal.box(sx - w / 2 + 0.3, y + 0.35, zf - 0.1, w - 0.6, h - 0.7, 0.2, "#1c1d21")
      if (sub) {
        cones.push({ x: sx - 2.1, y: y + 4, z: zf, s: 3.6, sub: true }, { x: sx + 2.1, y: y + 4, z: zf, s: 3.6, sub: true })
      } else {
        cones.push({ x: sx - 1.8, y: y + 3, z: zf, s: 3.2, sub: false })
        matte.box(sx + 0.6, y + 1.6, zf, 3, 2.8, 0.4, "#060607")
        glow.box(sx + w / 2 - 1, y + 0.6, zf + 0.12, 0.3, 0.3, 0.05, "#3bff8a")
      }
      y += h
    }
  }
  const coneMat = new THREE.MeshStandardMaterial({ color: "#26272c", roughness: 0.5, metalness: 0.2 })
  const coneMesh = new THREE.InstancedMesh(BOX, coneMat, cones.length * 3)
  coneMesh.castShadow = false
  coneMesh.receiveShadow = true
  coneMesh.frustumCulled = false
  const coneColors = ["#0b0b0d", "#2c2d33", "#4a4c54"]
  cones.forEach((_, i) => coneColors.forEach((c, k) => coneMesh.setColorAt(i * 3 + k, new THREE.Color(c))))

  // truss rows with hanging chains
  const trussRows = TRUSS_ROWS
  for (const tz of trussRows) {
    const x0 = -40, x1 = 40, y = TRUSS_Y
    for (const dy of [0, 2]) for (const dz of [-1, 1]) metal.box(x0, y + dy - 0.2, tz + dz - 0.2, x1 - x0, 0.4, 0.4, "#9ea2aa")
    for (let x = x0; x <= x1; x += 2) {
      for (const dz of [-1, 1]) metal.box(x - 0.12, y, tz + dz - 0.12, 0.24, 2, 0.24, "#8a8e96")
      for (let k = 0; k < 4; k++) {
        const t = k / 4
        for (const dz of [-1, 1]) metal.center(x + t * 2, y + (x % 4 === 0 ? t : 1 - t) * 2, tz + dz, 0.22, 0.22, 0.22, "#8a8e96")
      }
    }
    for (const x of [-30, 0, 30]) metal.box(x - 0.15, y + 2, tz - 0.15, 0.3, ROOM.h - y - 2, 0.3, "#55585f")
  }

  // bar
  matte.box(35, 0, 6, 3, 6.6, 26, "#24160f", 0.1)
  for (let z = 6; z < 32; z += 1) matte.box(35.05, 0.4, z + 0.05, 0.2, 5.8, 0.9, "#2d1c13", 0.15)
  gloss.box(34.4, 6.6, 5.6, 4.2, 0.5, 26.8, "#3a2a20", 0.05)
  glow.box(34.35, 6.2, 5.6, 0.1, 0.25, 26.8, "#ff4f9a")
  matte.box(45, 0, 5, 2.5, 22, 28, "#120d0a")
  glow.box(44.9, 8, 6, 0.1, 13, 26, "#3a1a12")
  for (const sy of [8.6, 12.6, 16.6]) {
    matte.box(43.6, sy - 0.3, 6, 2, 0.3, 26, "#5a3a26")
    for (let z = 6.6; z < 31.5; z += 0.9 + rand() * 0.4) {
      const h = 1.3 + rand() * 1.2
      glow.box(44, sy, z, 0.6, h, 0.6, pick(["#c9781e", "#8a3a10", "#2e7a3a", "#b9c4c9", "#6a1e1e", "#d9a35c"]), 0.25)
    }
  }
  matte.box(40, 0, 5, 5, 6, 3, "#1a120d")
  for (const z of [10, 17, 24, 30]) {
    metal.box(36.4, 16, z - 0.05, 0.1, ROOM.h - 16, 0.1, "#222")
    glow.center(36.45, 15.6, z, 1.2, 0.8, 1.2, "#ffb067")
  }
  for (let z = 8; z < 32; z += 3) {
    matte.center(33.2, 2.6, z, 0.3, 5.2, 0.3, "#3a3a3e")
    matte.center(33.2, 5.3, z, 1.8, 0.4, 1.8, "#1a1a1d")
  }

  // neon signs
  const neon = new Batch()
  const sign = textPixels("JDAWGINATOR")
  const ns = 0.62
  for (const [px, py] of sign.pts) neon.center(-(sign.width * ns) / 2 + px * ns, 38.2 + py * ns, ROOM.z0 + 0.4, ns * 0.85, ns * 0.85, 0.3, "#ff2bd6")
  const exit = textPixels("EXIT")
  for (const [px, py] of exit.pts) neon.center(ROOM.x0 + 0.2, 20 + py * 0.32, 48 - px * 0.32, 0.2, 0.28, 0.28, "#22ff66")
  const live = textPixels("LIVE")
  for (const [px, py] of live.pts) neon.center(ROOM.x1 - 0.2, 28 + py * 0.55, -6 + px * 0.55, 0.2, 0.48, 0.48, "#ff2b3b")
  const neonMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })
  const neonMesh = neon.build(neonMat, { cast: false, receive: false })

  const matteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, metalness: 0.0 })
  const glossMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.32, metalness: 0.15 })
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.38, metalness: 0.75 })
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })
  const meshes = [matte.build(matteMat), gloss.build(glossMat, { cast: false, receive: true }), metal.build(metalMat), glow.build(glowMat, { cast: false, receive: false }), neonMesh, coneMesh]
  meshes.forEach((m) => scene.add(m))

  // dynamic pixel surfaces
  const ledPts = []
  for (let y = 0; y < LED.h; y++) for (let x = 0; x < LED.w; x++) ledPts.push({ x: LED.x0 + x + 0.5, y: LED.y0 + y + 0.5, z: LED.z, sx: 0.86, sy: 0.86, sz: 0.2 })
  const ledWall = new Pixels(ledPts)
  const boothPts = []
  for (let y = 0; y < 12; y++) for (let x = 0; x < 42; x++) boothPts.push({ x: B.x0 + 0.5 + x * 0.5 + 0.25, y: STAGE.h + 0.35 + y * 0.32 + 0.16, z: B.z1 + 0.06, sx: 0.4, sy: 0.26, sz: 0.1 })
  const boothPanel = new Pixels(boothPts)
  const stripPts = []
  for (let x = STAGE.x0; x < STAGE.x1; x += 0.5) stripPts.push({ x: x + 0.25, y: STAGE.h - 0.2, z: STAGE.z1 - 0.55, sx: 0.4, sy: 0.25, sz: 0.1 })
  for (const tz of trussRows) for (let x = -40; x < 40; x += 1) stripPts.push({ x: x + 0.5, y: TRUSS_Y - 0.35, z: tz, sx: 0.8, sy: 0.15, sz: 0.3 })
  const strips = new Pixels(stripPts)
  const vuPts = []
  for (let c = 0; c < 2; c++) for (let r = 0; r < 10; r++) vuPts.push({ x: -0.3 + c * 0.6, y: B.top + 1.15, z: -31 - r * 0.45, sx: 0.35, sy: 0.08, sz: 0.3 })
  const jogPts = []
  for (const cx of [-6.8, 6.8]) for (let a = 0; a < 24; a++) {
    const t = (a / 24) * Math.PI * 2
    jogPts.push({ x: cx + Math.cos(t) * 1.75, y: B.top + 1.02, z: -32.6 + Math.sin(t) * 1.75, sx: 0.4, sy: 0.08, sz: 0.4 })
  }
  const vu = new Pixels(vuPts)
  const jog = new Pixels(jogPts)
  for (const p of [ledWall, boothPanel, strips, vu, jog]) scene.add(p.mesh)

  const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _q = new THREE.Quaternion()
  function updateCones(bass: number, pulse: number) {
    cones.forEach((c, i) => {
      const push = (c.sub ? 0.55 : 0.25) * Math.min(1, bass * 0.5 + pulse * 0.7)
      const sizes = [[c.s, c.s, 0.3, 0.1], [c.s * 0.72, c.s * 0.72, 0.3, 0.25 + push * 0.6], [c.s * 0.28, c.s * 0.28, 0.4, 0.45 + push]]
      sizes.forEach(([w, h, d, z], k) => {
        _m.compose(_p.set(c.x, c.y, c.z + z), _q, _s.set(w, h, d))
        coneMesh.setMatrixAt(i * 3 + k, _m)
      })
    })
    coneMesh.instanceMatrix.needsUpdate = true
  }
  updateCones(0, 0)

  return { ledWall, boothPanel, strips, stripStageCount: (STAGE.x1 - STAGE.x0) * 2, vu, jog, neonMat, updateCones, meshes }
}
