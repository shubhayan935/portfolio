import * as THREE from "three"
import { Batch } from "./voxels"
import { TRUSS_ROWS, TRUSS_Y, STAGE, ROOM } from "./world"

const beamVert = /* glsl */ `
  uniform float uLen;
  varying float vAlong;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  void main() {
    vAlong = position.z / uLen;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - w.xyz);
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`
const beamFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uTime;
  varying float vAlong;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float noise(vec3 x) {
    vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  void main() {
    float edge = pow(abs(dot(normalize(vN), normalize(vV))), 2.2);
    float fall = pow(clamp(1.0 - vAlong, 0.0, 1.0), 1.4);
    float near = smoothstep(0.0, 0.04, vAlong);
    float haze = 0.45 + 0.75 * noise(vW * 0.09 + vec3(0.0, uTime * 0.25, uTime * 0.1));
    float floorFade = smoothstep(-0.5, 3.0, vW.y);
    float a = uIntensity * edge * fall * near * haze * floorFade * 0.55;
    gl_FragColor = vec4(uColor * a, 1.0);
  }
`

export class Beam {
  mesh: THREE.Mesh
  mat: THREE.ShaderMaterial
  constructor(len: number, radius: number) {
    const g = new THREE.CylinderGeometry(0.35, radius, len, 28, 1, true)
    g.translate(0, -len / 2, 0)
    g.rotateX(-Math.PI / 2)
    this.mat = new THREE.ShaderMaterial({
      vertexShader: beamVert, fragmentShader: beamFrag,
      uniforms: { uLen: { value: len }, uColor: { value: new THREE.Color() }, uIntensity: { value: 0 }, uTime: { value: 0 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    })
    this.mesh = new THREE.Mesh(g, this.mat)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 10
  }
}

export type Fixture = {
  group: THREE.Group; head: THREE.Group; beam: Beam; lens: THREE.Mesh; lensMat: THREE.MeshBasicMaterial
  pos: THREE.Vector3; kind: "front" | "mid" | "floor"; index: number; rowIndex: number; rowSize: number
  aim: THREE.Vector3; target: THREE.Vector3; light: THREE.SpotLight | null; color: THREE.Color; dim: number
}

export function buildFixtures(scene: THREE.Scene) {
  const fixtures: Fixture[] = []
  const bodyMat = new THREE.MeshStandardMaterial({ color: "#16161a", roughness: 0.5, metalness: 0.5 })
  const make = (pos: THREE.Vector3, kind: Fixture["kind"], rowIndex: number, rowSize: number) => {
    const group = new THREE.Group()
    group.position.copy(pos)
    const b = new Batch()
    if (kind === "floor") {
      b.center(0, 0.4, 0, 2.6, 0.8, 2.6, "#18181c")
      b.center(-1.2, 1.6, 0, 0.4, 2.2, 1, "#202025")
      b.center(1.2, 1.6, 0, 0.4, 2.2, 1, "#202025")
    } else {
      b.center(0, -0.5, 0, 2.6, 1, 2.6, "#18181c")
      b.center(-1.2, -1.8, 0, 0.4, 2.2, 1, "#202025")
      b.center(1.2, -1.8, 0, 0.4, 2.2, 1, "#202025")
    }
    const yoke = b.build(bodyMat, { cast: false, receive: false })
    group.add(yoke)
    const head = new THREE.Group()
    head.position.set(0, kind === "floor" ? 2.2 : -2.4, 0)
    const hb = new Batch()
    hb.center(0, 0, -0.3, 1.9, 1.9, 2.4, "#121215")
    hb.center(0, 0, 0.95, 1.6, 1.6, 0.3, "#0a0a0c")
    head.add(hb.build(bodyMat, { cast: false, receive: false }))
    const lensMat = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false })
    const lens = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.12), lensMat)
    lens.position.z = 1.12
    head.add(lens)
    const beam = new Beam(kind === "floor" ? 95 : 70, kind === "floor" ? 3.2 : 5.5)
    beam.mesh.position.z = 1.1
    head.add(beam.mesh)
    group.add(head)
    scene.add(group)
    fixtures.push({
      group, head, beam, lens, lensMat, pos: pos.clone().add(head.position), kind, index: fixtures.length, rowIndex, rowSize,
      aim: new THREE.Vector3(0, 0, 0), target: new THREE.Vector3(0, 0, 0), light: null, color: new THREE.Color(), dim: 0,
    })
  }
  const front = 8
  for (let i = 0; i < front; i++) make(new THREE.Vector3(-35 + (i * 70) / (front - 1), TRUSS_Y, TRUSS_ROWS[0]), "front", i, front)
  const mid = 6
  for (let i = 0; i < mid; i++) make(new THREE.Vector3(-30 + (i * 60) / (mid - 1), TRUSS_Y, TRUSS_ROWS[1]), "mid", i, mid)
  const floorXs = [-24, -18, 18, 24, -6, 6]
  floorXs.forEach((x, i) => make(new THREE.Vector3(x, STAGE.h, x === -6 || x === 6 ? -41.5 : -40), "floor", i, floorXs.length))

  // real spotlights on a subset (the rest are visual beams only)
  const lit = [1, 3, 4, 6, 9, 12]
  lit.forEach((idx, k) => {
    const f = fixtures[idx]
    const l = new THREE.SpotLight(0xffffff, 0, 140, 0.32, 0.6, 1.1)
    l.position.copy(f.pos)
    l.castShadow = k < 2
    if (l.castShadow) {
      l.shadow.mapSize.set(1024, 1024)
      l.shadow.bias = -0.0008
      l.shadow.camera.near = 5
      l.shadow.camera.far = 130
    }
    scene.add(l)
    scene.add(l.target)
    f.light = l
  })
  return fixtures
}

export function buildLasers(scene: THREE.Scene) {
  const lasers: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; origin: THREE.Vector3; k: number; side: number }[] = []
  const geo = new THREE.CylinderGeometry(0.06, 0.18, 150, 6, 1, true)
  geo.translate(0, -75, 0)
  geo.rotateX(-Math.PI / 2)
  const origins = [new THREE.Vector3(-14, 33, -42.5), new THREE.Vector3(14, 33, -42.5), new THREE.Vector3(0, 8.5, -30.6)]
  origins.forEach((o, oi) => {
    for (let k = 0; k < 9; k++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0x000000, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.copy(o)
      mesh.frustumCulled = false
      mesh.renderOrder = 11
      scene.add(mesh)
      lasers.push({ mesh, mat, origin: o, k, side: oi })
    }
  })
  return lasers
}

export function buildMirrorball(scene: THREE.Scene, center: THREE.Vector3) {
  const pts: THREE.Vector3[] = []
  const R = 2.6
  for (let y = -R; y <= R; y += 0.5) for (let x = -R; x <= R; x += 0.5) for (let z = -R; z <= R; z += 0.5) {
    const d = Math.hypot(x, y, z)
    if (d <= R && d > R - 0.55) pts.push(new THREE.Vector3(x, y, z))
  }
  const tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(0.46, 0.46, 0.46), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), pts.length)
  const m = new THREE.Matrix4()
  pts.forEach((p, i) => { m.makeTranslation(p.x, p.y, p.z); tiles.setMatrixAt(i, m); tiles.setColorAt(i, new THREE.Color(0.2, 0.2, 0.22)) })
  const ball = new THREE.Group()
  ball.position.copy(center)
  ball.add(tiles)
  const chain = new THREE.Mesh(new THREE.BoxGeometry(0.15, ROOM.h - center.y - R, 0.15), new THREE.MeshStandardMaterial({ color: "#555" }))
  chain.position.y = R + (ROOM.h - center.y - R) / 2
  ball.add(chain)
  scene.add(ball)

  const N = 420
  const dirs: THREE.Vector3[] = []
  for (let i = 0; i < N; i++) {
    const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2
    dirs.push(new THREE.Vector3(Math.sqrt(1 - u * u) * Math.cos(a), u * 0.8 - 0.25, Math.sqrt(1 - u * u) * Math.sin(a)).normalize())
  }
  const geo = new THREE.BufferGeometry()
  const posArr = new Float32Array(N * 3)
  geo.setAttribute("position", new THREE.BufferAttribute(posArr, 3))
  const c = document.createElement("canvas")
  c.width = c.height = 64
  const g = c.getContext("2d")!
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grd.addColorStop(0, "rgba(255,255,255,1)")
  grd.addColorStop(0.35, "rgba(255,255,255,0.6)")
  grd.addColorStop(1, "rgba(255,255,255,0)")
  g.fillStyle = grd
  g.fillRect(0, 0, 64, 64)
  const tex = new THREE.CanvasTexture(c)
  const spotMat = new THREE.PointsMaterial({ size: 1.1, map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0x000000, toneMapped: false })
  const spots = new THREE.Points(geo, spotMat)
  spots.frustumCulled = false
  scene.add(spots)
  const tmp = new THREE.Vector3()
  function update(angle: number, intensity: number, t: number) {
    ball.rotation.y = angle
    const col = tiles.instanceColor!
    for (let i = 0; i < pts.length; i++) {
      const glint = Math.pow(Math.max(0, Math.sin(i * 12.9898 + angle * 9.0 + t * 0.5)), 24)
      const v = 0.12 + 0.1 * intensity + glint * (0.3 + intensity * 2.5)
      col.setXYZ(i, v, v, v * 1.05)
    }
    col.needsUpdate = true
    spotMat.color.setRGB(intensity * 1.4, intensity * 1.4, intensity * 1.5)
    for (let i = 0; i < N; i++) {
      tmp.copy(dirs[i]).applyAxisAngle(THREE.Object3D.DEFAULT_UP, angle)
      let best = 1e9
      const o = center
      const cand = [
        tmp.y < 0 ? (0.05 - o.y) / tmp.y : 1e9,
        tmp.y > 0 ? (ROOM.h - 0.1 - o.y) / tmp.y : 1e9,
        tmp.x < 0 ? (ROOM.x0 + 0.3 - o.x) / tmp.x : (ROOM.x1 - 0.3 - o.x) / tmp.x,
        tmp.z < 0 ? (ROOM.z0 + 0.2 - o.z) / tmp.z : (ROOM.z1 - 0.2 - o.z) / tmp.z,
      ]
      for (const v of cand) if (v > 0 && v < best) best = v
      posArr[i * 3] = o.x + tmp.x * best
      posArr[i * 3 + 1] = o.y + tmp.y * best
      posArr[i * 3 + 2] = o.z + tmp.z * best
    }
    geo.attributes.position.needsUpdate = true
  }
  return { update, ball }
}
