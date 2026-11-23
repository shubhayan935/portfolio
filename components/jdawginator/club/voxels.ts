import * as THREE from "three"

const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _e = new THREE.Euler()
const _p = new THREE.Vector3()
const _s = new THREE.Vector3()
const _c = new THREE.Color()

let seed = 1337
export const rand = () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}
export const resetRand = (s: number) => { seed = s }
export const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)]

export const BOX = new THREE.BoxGeometry(1, 1, 1)

type Item = { x: number; y: number; z: number; w: number; h: number; d: number; c: THREE.Color; rx: number; ry: number }

export class Batch {
  items: Item[] = []
  box(x0: number, y0: number, z0: number, w: number, h: number, d: number, color: THREE.ColorRepresentation, jitter = 0, rx = 0, ry = 0) {
    const c = new THREE.Color(color)
    if (jitter) {
      const j = 1 + (rand() * 2 - 1) * jitter
      c.multiplyScalar(j)
    }
    this.items.push({ x: x0 + w / 2, y: y0 + h / 2, z: z0 + d / 2, w, h, d, c, rx, ry })
    return this
  }
  center(x: number, y: number, z: number, w: number, h: number, d: number, color: THREE.ColorRepresentation, jitter = 0, rx = 0, ry = 0) {
    return this.box(x - w / 2, y - h / 2, z - d / 2, w, h, d, color, jitter, rx, ry)
  }
  build(material: THREE.Material, shadows = { cast: true, receive: true }) {
    const mesh = new THREE.InstancedMesh(BOX, material, Math.max(1, this.items.length))
    this.items.forEach((it, i) => {
      _e.set(it.rx, it.ry, 0)
      _q.setFromEuler(_e)
      _m.compose(_p.set(it.x, it.y, it.z), _q, _s.set(it.w, it.h, it.d))
      mesh.setMatrixAt(i, _m)
      mesh.setColorAt(i, it.c)
    })
    mesh.count = this.items.length
    mesh.castShadow = shadows.cast
    mesh.receiveShadow = shadows.receive
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
    return mesh
  }
}

export class Pixels {
  mesh: THREE.InstancedMesh
  pos: THREE.Vector3[] = []
  constructor(points: { x: number; y: number; z: number; sx: number; sy: number; sz: number }[], opts: { additive?: boolean } = {}) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })
    if (opts.additive) Object.assign(mat, { blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })
    this.mesh = new THREE.InstancedMesh(BOX, mat, points.length)
    points.forEach((p, i) => {
      _m.compose(_p.set(p.x, p.y, p.z), _q.identity(), _s.set(p.sx, p.sy, p.sz))
      this.mesh.setMatrixAt(i, _m)
      this.mesh.setColorAt(i, _c.setRGB(0, 0, 0))
      this.pos.push(new THREE.Vector3(p.x, p.y, p.z))
    })
    this.mesh.frustumCulled = false
  }
  set(i: number, r: number, g: number, b: number) {
    this.mesh.setColorAt(i, _c.setRGB(r, g, b))
  }
  flush() {
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true
  }
}
