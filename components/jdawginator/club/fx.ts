import * as THREE from "three"
import { ROOM, STAGE } from "./world"

function softTexture(inner = 0.0) {
  const c = document.createElement("canvas")
  c.width = c.height = 128
  const g = c.getContext("2d")!
  const grd = g.createRadialGradient(64, 64, inner, 64, 64, 64)
  grd.addColorStop(0, "rgba(255,255,255,1)")
  grd.addColorStop(0.4, "rgba(255,255,255,0.45)")
  grd.addColorStop(1, "rgba(255,255,255,0)")
  g.fillStyle = grd
  g.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

export function buildHaze(scene: THREE.Scene) {
  const tex = softTexture()
  const sprites: { s: THREE.Sprite; v: THREE.Vector3; base: number }[] = []
  for (let i = 0; i < 46; i++) {
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0x000000, opacity: 1 })
    const s = new THREE.Sprite(mat)
    s.position.set(ROOM.x0 + Math.random() * (ROOM.x1 - ROOM.x0), 8 + Math.random() * 34, ROOM.z0 + Math.random() * 80)
    const sc = 26 + Math.random() * 30
    s.scale.set(sc, sc * 0.7, 1)
    s.renderOrder = 5
    scene.add(s)
    sprites.push({ s, v: new THREE.Vector3((Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.6), base: 0.5 + Math.random() * 0.5 })
  }
  const tint = new THREE.Color()
  return (dt: number, color: THREE.Color, amount: number, cam: THREE.Vector3) => {
    for (const p of sprites) {
      p.s.position.addScaledVector(p.v, dt)
      if (p.s.position.x < ROOM.x0 - 10) p.s.position.x = ROOM.x1 + 5
      if (p.s.position.x > ROOM.x1 + 10) p.s.position.x = ROOM.x0 - 5
      if (p.s.position.z < ROOM.z0) p.s.position.z = ROOM.z0 + 80
      if (p.s.position.z > ROOM.z0 + 85) p.s.position.z = ROOM.z0
      const near = Math.min(1, Math.max(0, (p.s.position.distanceTo(cam) - p.s.scale.x * 0.35) / 30))
      tint.copy(color).multiplyScalar(0.035 * p.base * amount * near * near)
      ;(p.s.material as THREE.SpriteMaterial).color.copy(tint)
    }
  }
}

export function buildCO2(scene: THREE.Scene) {
  const N = 1400
  const pos = new Float32Array(N * 3), vel = new Float32Array(N * 3), life = new Float32Array(N), size = new Float32Array(N)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3))
  geo.setAttribute("life", new THREE.BufferAttribute(life, 1))
  geo.setAttribute("psize", new THREE.BufferAttribute(size, 1))
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTex: { value: softTexture() }, uScale: { value: 600 }, uTint: { value: new THREE.Color(1, 1, 1) } },
    vertexShader: `attribute float life; attribute float psize; varying float vLife; uniform float uScale;
      void main(){ vLife = life; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv; gl_PointSize = psize * (1.0 + (1.0-life)*2.5) * uScale / -mv.z; }`,
    fragmentShader: `uniform sampler2D uTex; uniform vec3 uTint; varying float vLife; void main(){ if (vLife <= 0.0) discard; vec4 t = texture2D(uTex, gl_PointCoord); float a = t.a * vLife * vLife * 0.22; gl_FragColor = vec4(uTint * a, a); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
  const pts = new THREE.Points(geo, mat)
  pts.frustumCulled = false
  pts.renderOrder = 12
  scene.add(pts)
  const nozzles = [-21, -14, 14, 21].map((x) => new THREE.Vector3(x, STAGE.h + 0.5, STAGE.z1 - 1.5))
  let cursor = 0
  let firing = 0
  return {
    fire(seconds = 1.6) { firing = seconds },
    update(dt: number, tint: THREE.Color) {
      mat.uniforms.uTint.value.copy(tint).lerp(new THREE.Color(1, 1, 1), 0.6)
      if (firing > 0) {
        firing -= dt
        for (const n of nozzles) for (let k = 0; k < 9; k++) {
          const i = cursor = (cursor + 1) % N
          pos[i * 3] = n.x + (Math.random() - 0.5) * 0.6; pos[i * 3 + 1] = n.y; pos[i * 3 + 2] = n.z
          vel[i * 3] = (Math.random() - 0.5) * 4; vel[i * 3 + 1] = 32 + Math.random() * 14; vel[i * 3 + 2] = (Math.random() - 0.2) * 4
          life[i] = 1; size[i] = 2 + Math.random() * 2
        }
      }
      for (let i = 0; i < N; i++) {
        if (life[i] <= 0) continue
        life[i] -= dt * 0.55
        vel[i * 3 + 1] *= Math.exp(-dt * 2.2)
        vel[i * 3] *= Math.exp(-dt * 1.2)
        vel[i * 3 + 2] *= Math.exp(-dt * 1.2)
        pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt
      }
      geo.attributes.position.needsUpdate = true
      geo.attributes.life.needsUpdate = true
      geo.attributes.psize.needsUpdate = true
    },
  }
}

export function buildConfetti(scene: THREE.Scene) {
  const N = 900
  const geo = new THREE.PlaneGeometry(0.7, 0.42)
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 0.4, metalness: 0.6, emissive: 0x111111 })
  const mesh = new THREE.InstancedMesh(geo, mat, N)
  mesh.frustumCulled = false
  const palette = ["#ff2bd6", "#2bd9ff", "#ffffff", "#c0c4cc", "#ff3b6b", "#7a5cff"].map((c) => new THREE.Color(c))
  const st = Array.from({ length: N }, (_, i) => {
    mesh.setColorAt(i, palette[i % palette.length])
    return { p: new THREE.Vector3(0, -50, 0), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3(), alive: false, rest: false }
  })
  scene.add(mesh)
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1)
  return {
    fire() {
      st.forEach((c, i) => {
        const side = i % 2 ? 1 : -1
        c.p.set(side * 18 + (Math.random() - 0.5) * 2, 10, STAGE.z1 - 2)
        c.v.set(-side * (4 + Math.random() * 14), 34 + Math.random() * 18, 6 + Math.random() * 22)
        c.w.set(Math.random() * 8, Math.random() * 8, Math.random() * 8)
        c.alive = true
        c.rest = false
      })
    },
    update(dt: number, t: number) {
      st.forEach((c, i) => {
        if (c.alive && !c.rest) {
          c.v.y -= 22 * dt
          const drag = c.v.y < 0 ? 3.2 : 0.6
          c.v.multiplyScalar(Math.exp(-dt * drag))
          if (c.v.y < -3.2) c.v.y = -3.2
          c.p.addScaledVector(c.v, dt)
          c.p.x += Math.sin(t * 2 + i) * dt * 1.2
          c.r.x += c.w.x * dt; c.r.y += c.w.y * dt; c.r.z += c.w.z * dt
          if (c.p.y < 0.1) { c.p.y = 0.08; c.rest = true; c.r.set(-Math.PI / 2, 0, c.r.z) }
        }
        q.setFromEuler(c.r)
        m.compose(c.p, q, s)
        mesh.setMatrixAt(i, m)
      })
      mesh.instanceMatrix.needsUpdate = true
    },
  }
}

export const FinishShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uFlash: { value: 0 }, uAberration: { value: 0.0015 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime; uniform float uFlash; uniform float uAberration; varying vec2 vUv;
    float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uTime * 3.1) * 43758.5453); }
    void main(){
      vec2 c = vUv - 0.5;
      float d = dot(c, c);
      vec2 off = c * uAberration * (1.0 + d * 4.0);
      vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
      col += uFlash * vec3(0.9, 0.92, 1.0);
      col *= 1.0 - smoothstep(0.12, 0.62, d) * 0.65;
      col += (rnd(vUv * 900.0) - 0.5) * 0.035;
      gl_FragColor = vec4(col, 1.0);
    }`,
}
