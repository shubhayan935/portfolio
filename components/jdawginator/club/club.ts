import * as THREE from "three"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js"
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js"
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js"
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js"
import type { AudioEngine, AudioFrame } from "../audio"
import { buildWorld, LED, STAGE, ROOM } from "./world"
import { Crowd, type Style } from "./crowd"
import { buildFixtures, buildLasers, buildMirrorball, type Fixture } from "./lights"
import { buildHaze, buildCO2, buildConfetti, FinishShader } from "./fx"
import { textPixels } from "./font"
import { rand, resetRand } from "./voxels"

export type ShotName = "floor" | "booth" | "wide" | "crowd" | "overhead"
export const SHOTS: { name: ShotName; label: string }[] = [
  { name: "floor", label: "Floor" },
  { name: "booth", label: "Booth" },
  { name: "crowd", label: "In the crowd" },
  { name: "wide", label: "Wide" },
  { name: "overhead", label: "Overhead" },
]

type Shot = { pos: THREE.Vector3; look: THREE.Vector3; fov: number; drift: THREE.Vector3; driftRate: number }
const SHOT: Record<ShotName, Shot> = {
  floor: { pos: new THREE.Vector3(0, 11.5, 54), look: new THREE.Vector3(0, 12.5, -38), fov: 40, drift: new THREE.Vector3(10, 1.5, 3), driftRate: 0.05 },
  booth: { pos: new THREE.Vector3(-7, 15.5, -42.5), look: new THREE.Vector3(3, 7, 20), fov: 50, drift: new THREE.Vector3(3, 0.8, 0.5), driftRate: 0.08 },
  crowd: { pos: new THREE.Vector3(-44, 15, 16), look: new THREE.Vector3(-4, 8, -26), fov: 52, drift: new THREE.Vector3(4, 1, 3), driftRate: 0.07 },
  wide: { pos: new THREE.Vector3(-28, 34, 56), look: new THREE.Vector3(2, 6, -18), fov: 46, drift: new THREE.Vector3(5, 1, 0), driftRate: 0.04 },
  overhead: { pos: new THREE.Vector3(16, 41, 34), look: new THREE.Vector3(-2, 0, -12), fov: 58, drift: new THREE.Vector3(6, 0, 4), driftRate: 0.05 },
}
const AUTO_ORDER: ShotName[] = ["floor", "booth", "crowd", "wide", "floor", "overhead", "crowd", "booth"]

const PALETTES = [
  ["#ff1fd1", "#18d6ff"], ["#ff2a14", "#ff9a1a"], ["#2a4dff", "#e8f0ff"], ["#8a2bff", "#22ff9a"],
  ["#ff1f5a", "#5a2bff"], ["#00e1ff", "#ffffff"], ["#ff4fd8", "#ffffff"], ["#ff3b1f", "#2bd9ff"],
].map((p) => p.map((c) => new THREE.Color(c)))

const MOVES = ["fan", "sweep", "cross", "ballyhoo", "chase"] as const
const LED_MODES = ["spectrum", "rings", "tunnel", "plasma", "grid", "spectrum", "rings"] as const

export function createClub(canvas: HTMLCanvasElement, engine: AudioEngine, opts: { reducedMotion: boolean }) {
  resetRand(424242)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  RectAreaLightUniformsLib.init()

  const scene = new THREE.Scene()
  scene.background = new THREE.Color("#030205")
  scene.fog = new THREE.FogExp2("#05030a", 0.0065)
  const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.5, 400)

  const world = buildWorld(scene)

  // crowd placement
  const spots: { x: number; z: number; yaw: number; style?: Style; fixed?: boolean }[] = []
  const taken: [number, number][] = []
  const free = (x: number, z: number, r: number) => taken.every(([a, b]) => (a - x) ** 2 + (b - z) ** 2 > r * r)
  for (let tries = 0; tries < 20000 && spots.length < 240; tries++) {
    const x = -38 + rand() * 70, z = -23 + rand() * 58
    if (x > 30 && z > 2) continue
    const dens = Math.exp(-(z + 23) / 46) * (1 - Math.abs(x) / 70)
    if (rand() > dens + 0.12) continue
    if ((x + 44) ** 2 + (z - 16) ** 2 < 90) continue
    if (!free(x, z, 3.3)) continue
    taken.push([x, z])
    spots.push({ x, z, yaw: Math.atan2(-x * 0.7, -36 - z) + (rand() - 0.5) * 0.5 })
  }
  for (let z = 9; z < 31; z += 4.2 + rand() * 1.5) spots.push({ x: 31.2 + rand(), z, yaw: Math.PI / 2 + (rand() - 0.5) * 0.6, style: "idle", fixed: true })
  for (const z of [12, 25]) spots.push({ x: 41, z, yaw: -Math.PI / 2, style: "bartender", fixed: true })
  for (const x of [-24, 24]) spots.push({ x, z: STAGE.z1 + 4.5, yaw: Math.PI + (x > 0 ? -0.3 : 0.3), style: "idle", fixed: true })
  const crowd = new Crowd(scene, spots, { x: 0, z: -37.1, y: STAGE.h })
  const djIndex = crowd.djIndex

  // DJ accessories: headphones that follow the head matrix
  const hp = new THREE.Group()
  hp.matrixAutoUpdate = false
  const hpMat = new THREE.MeshStandardMaterial({ color: "#151518", roughness: 0.4, metalness: 0.4 })
  const band = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.4, 0.6), hpMat); band.position.set(0, 3.95, 0); hp.add(band)
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.2, 0.5), hpMat); arm.position.set(s * 1.75, 2.85, 0); hp.add(arm)
    const cup = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 1.4), hpMat); cup.position.set(s * 1.75, 1.5, 0); hp.add(cup)
  }
  const hpLed = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.3), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 1.6, 2), toneMapped: false }))
  hpLed.position.set(2.12, 1.5, 0); hp.add(hpLed)
  scene.add(hp)

  const fixtures = buildFixtures(scene)
  const lasers = buildLasers(scene)
  const mirror = buildMirrorball(scene, new THREE.Vector3(0, 33, 2))
  const haze = buildHaze(scene)
  const co2 = buildCO2(scene)
  const confetti = buildConfetti(scene)

  const hemi = new THREE.HemisphereLight("#3a2a55", "#0a0608", 0.35)
  scene.add(hemi)
  const rearWash = new THREE.DirectionalLight("#ffffff", 0)
  rearWash.position.set(0, 34, 70)
  rearWash.target.position.set(0, 0, -20)
  scene.add(rearWash, rearWash.target)
  const ledLight = new THREE.RectAreaLight("#ffffff", 0, LED.w, LED.h)
  ledLight.position.set(0, LED.y0 + LED.h / 2, LED.z + 0.6)
  ledLight.lookAt(0, LED.y0 + LED.h / 2, 0)
  scene.add(ledLight)
  const boothLight = new THREE.PointLight("#5aa8ff", 0, 14, 1.6)
  boothLight.position.set(0, 14.5, -33.5)
  scene.add(boothLight)
  const barLight = new THREE.PointLight("#ffa35a", 60, 30, 1.4)
  barLight.position.set(38, 15, 18)
  scene.add(barLight)
  const strobe = new THREE.PointLight("#eef2ff", 0, 160, 1)
  strobe.position.set(0, 43, -6)
  scene.add(strobe)
  const pinSpot = new THREE.SpotLight("#ffffff", 0, 60, 0.07, 0.3, 1)
  pinSpot.position.set(0, ROOM.h - 1, 28)
  pinSpot.target.position.set(0, 33, 2)
  scene.add(pinSpot, pinSpot.target)
  const houseLight = new THREE.SpotLight("#ffb98a", 0, 120, 0.9, 0.9, 1.2)
  houseLight.position.set(0, ROOM.h - 1, 10)
  houseLight.target.position.set(0, 0, -6)
  scene.add(houseLight, houseLight.target)

  // post
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 288), 0.9, 0.55, 0.72)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())
  const finish = new ShaderPass(FinishShader)
  composer.addPass(finish)

  // state
  let width = 1, height = 1
  let shot: ShotName = "floor"
  let auto = true
  let lastAutoPhrase = -1
  let shotIndex = 0
  const camPos = SHOT.floor.pos.clone(), camLook = SHOT.floor.look.clone()
  const fromPos = camPos.clone(), fromLook = camLook.clone()
  let camT = 1, camFov = SHOT.floor.fov
  const pointer = new THREE.Vector2(), pointerS = new THREE.Vector2()
  let time = 0, mirrorAngle = 0, flash = 0, firstDrop = true
  let phrase = -1, paletteIdx = 0, moveIdx = 0, ledMode: (typeof LED_MODES)[number] = "spectrum"
  const ringTimes: number[] = []
  let lastKick = 0
  const marquee = textPixels("JDAWGINATOR • LIVE • ")
  const marqueeSet = new Set(marquee.pts.map(([x, y]) => `${x},${y}`))
  let running = true, active = true, raf = 0
  let frameAvg = 16, dpr = renderer.getPixelRatio()
  const colA = new THREE.Color(), colB = new THREE.Color(), tmpC = new THREE.Color(), avg = new THREE.Color()
  const v3 = new THREE.Vector3()

  function setShot(name: ShotName, manual = true) {
    if (manual) auto = false
    if (name === shot && camT >= 1) return
    shot = name
    fromPos.copy(camPos)
    fromLook.copy(camLook)
    camT = 0
  }
  function setAuto() {
    auto = true
  }

  function resize() {
    const r = canvas.getBoundingClientRect()
    width = Math.max(1, r.width)
    height = Math.max(1, r.height)
    renderer.setSize(width, height, false)
    composer.setPixelRatio(renderer.getPixelRatio())
    composer.setSize(width, height)
    bloom.resolution.set(width / 2, height / 2)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  function onPointer(e: PointerEvent) {
    const r = canvas.getBoundingClientRect()
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1)
  }
  function onClick() {
    co2.fire(1.1)
    flash = Math.max(flash, opts.reducedMotion ? 0 : 0.25)
  }
  canvas.addEventListener("pointermove", onPointer)
  canvas.addEventListener("click", onClick)

  function updateCamera(dt: number, f: AudioFrame) {
    if (auto) {
      const ph = f.playing ? Math.floor(f.beat / 32) : Math.floor(time / 14)
      if (ph !== lastAutoPhrase) {
        lastAutoPhrase = ph
        if (time > 2) { shotIndex = (shotIndex + 1) % AUTO_ORDER.length; setShot(AUTO_ORDER[shotIndex], false) }
      }
    }
    const s = SHOT[shot]
    camT = Math.min(1, camT + dt / 3.2)
    const k = camT < 1 ? camT * camT * (3 - 2 * camT) : 1
    const dr = Math.sin(time * s.driftRate * Math.PI * 2)
    const dr2 = Math.cos(time * s.driftRate * Math.PI * 1.3)
    pointerS.lerp(pointer, 1 - Math.exp(-dt * 3))
    v3.set(s.pos.x + s.drift.x * dr + pointerS.x * 3.5, s.pos.y + s.drift.y * dr2 - pointerS.y * 2, s.pos.z + s.drift.z * dr2)
    camPos.lerpVectors(fromPos, v3, k)
    const shake = f.playing ? f.pulse * f.bass * 0.06 * (shot === "crowd" ? 2.5 : 1) : 0
    camPos.y += shake
    v3.set(s.look.x + pointerS.x * 2, s.look.y - pointerS.y * 1.5, s.look.z)
    camLook.lerpVectors(fromLook, v3, k)
    camFov += (s.fov - camFov) * (1 - Math.exp(-dt * 2))
    camera.fov = camFov
    camera.position.copy(camPos)
    camera.lookAt(camLook)
    if (camOverride) { camera.position.copy(camOverride.pos); camera.lookAt(camOverride.look); camera.fov = camOverride.fov }
    camera.updateProjectionMatrix()
  }

  function aimFixture(fx: Fixture, f: AudioFrame, move: (typeof MOVES)[number], level: string) {
    const b = f.beat, i = fx.rowIndex, n = fx.rowSize, u = n > 1 ? i / (n - 1) : 0.5
    const t = fx.target
    if (fx.kind === "floor") {
      const side = fx.pos.x < 0 ? -1 : 1
      if (level === "peak" && move !== "fan") t.set(fx.pos.x * 0.4 + 30 * Math.sin(b * Math.PI / 4 + i), 2, 10 + 20 * Math.sin(b * Math.PI / 8 + i * 0.7))
      else t.set(fx.pos.x + side * (10 + 18 * Math.sin(b * Math.PI / 16 + i)), ROOM.h, fx.pos.z + 40 + 18 * Math.cos(b * Math.PI / 12 + i * 1.3))
      return
    }
    const o = fx.kind === "mid" ? 1.3 : 0
    switch (move) {
      case "fan": t.set((-44 + 88 * u) * (0.65 + 0.35 * Math.sin(b * Math.PI / 8)), 0, 6 + 18 * Math.sin(b * Math.PI / 16 + i * 0.4 + o)); break
      case "sweep": t.set(32 * Math.sin(b * Math.PI / 8 + i * 0.12 + o), 0, 8 + 16 * Math.cos(b * Math.PI / 8 + o)); break
      case "cross": { const sd = u < 0.5 ? 1 : -1; t.set(sd * (14 + 14 * Math.sin(b * Math.PI / 4 + o)), 0, 6 + 10 * Math.sin(b * Math.PI / 8 + i)); break }
      case "ballyhoo": t.set(34 * Math.sin(b * Math.PI / 4 * (1 + 0.13 * i) + i), 0, 10 + 22 * Math.sin(b * Math.PI / 6 + i * 1.7)); break
      case "chase": {
        const pickD = crowd.dancers[Math.floor(Math.abs(Math.sin((Math.floor(b / 2) + 1) * 12.9898 + fx.index * 78.233) * 43758) % (crowd.dancers.length - 8))]
        t.set(pickD.x, 6, pickD.z)
        break
      }
    }
  }

  function show(dt: number, f: AudioFrame) {
    const playing = f.playing
    const ph = Math.floor(f.beat / 32)
    if (ph !== phrase) {
      phrase = ph
      if (playing) {
        paletteIdx = (paletteIdx + 1 + Math.floor(rand() * 3)) % PALETTES.length
        moveIdx = Math.floor(rand() * MOVES.length)
        ledMode = LED_MODES[Math.floor(rand() * LED_MODES.length)]
      }
    }
    const pal = PALETTES[paletteIdx]
    colA.copy(pal[0]); colB.copy(pal[1])
    const sec = f.section
    const drop = f.drop
    if (drop > 0.97 && f.sectionTime < 0.2) {
      flash = opts.reducedMotion ? 0.2 : 1
      co2.fire(2)
      if (firstDrop) { confetti.fire(); firstDrop = false }
    }
    const beatFrac = f.beat - Math.floor(f.beat)
    const quarter = (f.beat * 4) % 1
    const strobeOn = !opts.reducedMotion && playing && ((sec === "peak" && f.high > 0.82 && Math.floor(f.beat / 4) % 8 === 7) || (sec === "break" && f.tension > 0.75) || drop > 0.85)
    const strobeVal = strobeOn ? (quarter < 0.22 ? 1 : 0) : 0
    flash *= Math.exp(-dt * 5)
    strobe.intensity = (strobeVal * 0.5 + flash) * 9000
    finish.uniforms.uFlash.value = flash * 0.35 + strobeVal * 0.05

    const move = MOVES[moveIdx]
    fixtures.forEach((fx) => {
      let dim = 0
      const alt = fx.index % 2 === 0
      tmpC.copy(alt ? colA : colB)
      if (!playing) {
        dim = fx.kind === "mid" && fx.rowIndex % 2 === 0 ? 0.32 : fx.kind === "floor" ? 0.0 : 0.06
        tmpC.set("#ffd2a8")
        fx.target.set(20 * Math.sin(time * 0.1 + fx.index), 0, 10 + 10 * Math.cos(time * 0.13 + fx.index))
      } else {
        aimFixture(fx, f, move, sec)
        if (sec === "break") {
          dim = fx.kind === "front" ? 0 : fx.kind === "mid" ? 0.45 : 0.75
          tmpC.copy(fx.kind === "floor" ? new THREE.Color("#bcd2ff") : colA).lerp(new THREE.Color("#2a3cff"), 0.4)
          if (f.tension > 0.5) dim *= 0.6 + 0.4 * Math.exp(-beatFrac * 4)
        } else if (sec === "groove") {
          dim = (fx.kind === "front" ? 0.75 : fx.kind === "mid" ? 0.55 : 0.35) * (0.55 + 0.45 * f.pulse)
        } else {
          const chaseOn = move === "chase" ? (Math.floor(f.beat) % fx.rowSize) === fx.rowIndex || f.pulse > 0.7 : true
          dim = (chaseOn ? 1 : 0.15) * (0.6 + 0.4 * f.pulse)
          if (strobeOn) dim *= strobeVal * 1.4
        }
        if (drop > 0.6) { tmpC.lerp(new THREE.Color("#ffffff"), (drop - 0.6) * 2.2); dim = Math.max(dim, drop) }
      }
      fx.dim += (dim - fx.dim) * (1 - Math.exp(-dt * 14))
      fx.color.lerp(tmpC, 1 - Math.exp(-dt * 6))
      fx.aim.lerp(fx.target, 1 - Math.exp(-dt * (playing ? 3.2 : 0.8)))
      fx.head.lookAt(fx.aim)
      fx.beam.mat.uniforms.uColor.value.copy(fx.color)
      fx.beam.mat.uniforms.uIntensity.value = fx.dim
      fx.beam.mat.uniforms.uTime.value = time
      fx.lensMat.color.copy(fx.color).multiplyScalar(fx.dim * 4)
      if (fx.light) {
        fx.light.color.copy(fx.color)
        fx.light.intensity = fx.dim * 2600
        fx.head.getWorldPosition(fx.light.position)
        fx.light.target.position.copy(fx.aim)
        fx.light.angle = fx.kind === "floor" ? 0.05 : 0.11
      }
    })

    // lasers
    const laserOn = playing && (sec === "peak" || drop > 0.4)
    lasers.forEach((l) => {
      const b = f.beat
      const spread = 0.13 * (0.6 + 0.4 * Math.sin(b * Math.PI / 8))
      const sweep = Math.sin(b * Math.PI / 4 + l.side * 2) * 0.5
      const yaw = (l.k - 4) * spread + sweep
      const pitch = l.side === 2 ? -0.02 + 0.04 * Math.sin(b * Math.PI / 2 + l.k) : -0.22 + 0.12 * Math.sin(b * Math.PI / 8 + l.k * 0.4)
      l.mesh.rotation.set(-pitch, yaw + (l.side === 0 ? 0.25 : l.side === 1 ? -0.25 : 0), 0, "YXZ")
      const chase = Math.floor(b * 2 + l.k) % 3 !== 0 ? 1 : 0.2
      const lc = paletteIdx % 3 === 0 ? tmpC.set("#22ff55") : paletteIdx % 3 === 1 ? tmpC.set("#ff1e3c") : tmpC.copy(colA)
      l.mat.color.copy(lc).multiplyScalar(laserOn ? 2.2 * chase * (0.6 + 0.4 * f.high) : 0)
      l.mesh.visible = laserOn
    })

    // mirrorball
    mirrorAngle += dt * 0.35
    const mb = !playing ? 0.35 : sec === "break" ? 1 : sec === "groove" ? 0.25 : 0.12
    pinSpot.intensity = mb * 4000
    mirror.update(mirrorAngle, mb, time)

    // house + booth lights
    houseLight.intensity = playing ? 0 : 260
    hemi.intensity = playing ? 0.25 + f.pulse * 0.1 : 0.45
    rearWash.color.copy(colB).lerp(tmpC.set("#ffffff"), 0.35)
    rearWash.intensity = playing ? (sec === "break" ? 0.12 : 0.35 + f.pulse * 0.35) : 0.18
    boothLight.intensity = 30 + (playing ? f.level * 40 : 0)

    // LED wall
    const lw = world.ledWall
    if (f.kick > 0.95 && time - lastKick > 0.2) { ringTimes.push(time); lastKick = time }
    while (ringTimes.length && time - ringTimes[0] > 2.2) ringTimes.shift()
    const mode = !playing ? "marquee" : sec === "break" ? (f.tension > 0.55 ? "tunnel" : "marquee") : ledMode
    avg.setRGB(0, 0, 0)
    const bright = !playing ? 0.75 : sec === "break" ? 0.7 + f.tension * 0.5 : 1
    for (let y = 0; y < LED.h; y++) for (let x = 0; x < LED.w; x++) {
      const i = y * LED.w + x
      const cx = x - LED.w / 2 + 0.5, cy = y - LED.h / 2 + 0.5
      let r = 0, g = 0, bl = 0
      switch (mode) {
        case "spectrum": {
          const bi = Math.min(63, Math.floor(Math.abs(cx) * 2))
          const v = f.bars[bi] * 0.95
          const hgt = v * LED.h
          const on = y < hgt ? 1 : 0
          const cap = Math.abs(y - hgt) < 0.6 ? 1 : 0
          tmpC.copy(colA).lerp(colB, y / LED.h)
          const k = on * (0.55 + 0.45 * (y / LED.h)) + cap * 0.8
          r = tmpC.r * k; g = tmpC.g * k; bl = tmpC.b * k
          break
        }
        case "rings": {
          const d = Math.hypot(cx, cy * 1.15)
          let k = 0
          for (const rt of ringTimes) { const rad = (time - rt) * 26; k += Math.max(0, 1 - Math.abs(d - rad) / 1.6) * Math.max(0, 1 - (time - rt) / 2.2) }
          k = Math.min(1.4, k)
          const ang = Math.atan2(cy, cx)
          tmpC.copy(colA).lerp(colB, 0.5 + 0.5 * Math.sin(ang * 3 + time))
          r = tmpC.r * k; g = tmpC.g * k; bl = tmpC.b * k
          break
        }
        case "tunnel": {
          const d = Math.hypot(cx, cy) + 0.001
          const z = 30 / d + f.beat * 1.0
          const a = Math.atan2(cy, cx) / Math.PI * 4
          const chk = (Math.floor(z) + Math.floor(a + time * 0.2)) % 2 === 0 ? 1 : 0.08
          const k = chk * Math.min(1, d / 10) * (0.5 + 0.5 * f.pulse + f.tension * 0.5)
          tmpC.copy(colA).lerp(colB, (Math.floor(z) % 2))
          r = tmpC.r * k; g = tmpC.g * k; bl = tmpC.b * k
          break
        }
        case "plasma": {
          const v = Math.sin(cx * 0.18 + time * 1.1) + Math.sin(cy * 0.25 - time * 0.8) + Math.sin((cx + cy) * 0.12 + f.beat * 0.6) + Math.sin(Math.hypot(cx, cy) * 0.3 - time * 2)
          const k = (0.35 + 0.35 * f.bass + 0.3 * f.pulse) * (0.5 + 0.5 * Math.sin(v * 1.4))
          tmpC.copy(colA).lerp(colB, 0.5 + 0.5 * Math.sin(v))
          r = tmpC.r * k; g = tmpC.g * k; bl = tmpC.b * k
          break
        }
        case "grid": {
          const cell = (Math.floor(x / 8) * 7 + Math.floor(y / 6) * 13 + Math.floor(f.beat * 2) * 31) % 17
          const on = cell < 3 + f.high * 5 ? 1 : 0
          const edge = x % 8 === 0 || y % 6 === 0 ? 0.25 : 1
          tmpC.copy(cell % 2 ? colA : colB)
          const k = on * edge * (0.4 + 0.6 * f.pulse)
          r = tmpC.r * k; g = tmpC.g * k; bl = tmpC.b * k
          break
        }
        case "marquee": {
          const S = 2
          const mx = Math.floor((x + time * 9) / S) % (marquee.width + 1)
          const my = Math.floor((y - 5) / S)
          const lit = my >= 0 && my < 7 && marqueeSet.has(`${mx},${my}`)
          const bg = 0.05 + 0.05 * Math.sin(cx * 0.2 + time) * Math.sin(cy * 0.3 - time * 0.7)
          tmpC.copy(colA).lerp(colB, 0.5 + 0.5 * Math.sin(x * 0.08 - time))
          const k = lit ? 1 : bg
          r = tmpC.r * k; g = tmpC.g * k; bl = tmpC.b * k
          break
        }
      }
      r *= bright; g *= bright; bl *= bright
      lw.set(i, r * 1.6, g * 1.6, bl * 1.6)
      avg.r += r; avg.g += g; avg.b += bl
    }
    lw.flush()
    avg.multiplyScalar(1 / (LED.w * LED.h))
    const lum = avg.r * 0.3 + avg.g * 0.59 + avg.b * 0.11
    ledLight.color.copy(avg).multiplyScalar(1 / Math.max(0.001, Math.max(avg.r, avg.g, avg.b)))
    ledLight.intensity = lum * 26

    // booth panel: EQ meter
    const bp = world.boothPanel
    for (let y = 0; y < 12; y++) for (let x = 0; x < 42; x++) {
      const v = f.bars[Math.min(63, Math.floor((Math.abs(x - 20.5) / 21) * 48))]
      const on = playing ? (y / 12 < v * 0.95 ? 1 : 0) : (Math.sin(x * 0.4 + time * 2) * 0.5 + 0.5 > 0.92 ? 0.3 : 0.02)
      tmpC.copy(colB).lerp(colA, y / 12)
      bp.set(y * 42 + x, tmpC.r * on * 1.4, tmpC.g * on * 1.4, tmpC.b * on * 1.4)
    }
    bp.flush()
    // strips
    const st = world.strips
    const stageN = world.stripStageCount
    for (let i = 0; i < st.pos.length; i++) {
      let k: number
      if (i < stageN) {
        const ph2 = (i / stageN) * 4 - f.beat * 0.5
        k = playing ? 0.25 + 0.75 * Math.pow(0.5 + 0.5 * Math.sin(ph2 * Math.PI * 2), 4) * (0.4 + 0.6 * f.pulse) : 0.18
        tmpC.copy((Math.floor(i / 8) % 2) ? colA : colB)
      } else {
        const j = (i - stageN) % 80
        k = playing ? (sec === "break" ? 0.15 : Math.max(0, 1 - Math.abs(((j / 80 + f.beat * 0.25) % 1) - 0.5) * 6) * 0.9 + 0.1 * f.pulse) : 0.03
        tmpC.copy(colA)
      }
      st.set(i, tmpC.r * k * 1.5, tmpC.g * k * 1.5, tmpC.b * k * 1.5)
    }
    st.flush()
    // VU + jog
    for (let c = 0; c < 2; c++) for (let r = 0; r < 10; r++) {
      const lv = playing ? Math.min(1, f.level * 1.05 + (c ? f.high : f.bass) * 0.15) : 0
      const on = r / 10 < lv ? 1 : 0.04
      tmpC.set(r > 8 ? "#ff2b2b" : r > 6 ? "#ffaa22" : "#26ff6a")
      world.vu.set(c * 10 + r, tmpC.r * on * 1.5, tmpC.g * on * 1.5, tmpC.b * on * 1.5)
    }
    world.vu.flush()
    for (let i = 0; i < 48; i++) {
      const a = i % 24
      const pos = playing ? (f.beat * 6 * (i < 24 ? 1 : 1.0)) % 24 : -10
      const on = Math.abs(((a - pos + 36) % 24) - 12) > 10.5 ? 1.6 : 0.12
      world.jog.set(i, 0.25 * on, 0.7 * on, 1.2 * on)
    }
    world.jog.flush()
    world.updateCones(f.bass, f.pulse)
    const flick = Math.random() < 0.004 ? 0.25 : 1
    world.neonMat.color.setRGB(1.5 * flick, 1.5 * flick, 1.5 * flick)

    haze(dt, avg.clone().add(colA.clone().multiplyScalar(0.3)), playing ? 1 : 0.5, camera.position)
    co2.update(dt, colA)
    confetti.update(dt, time)
  }

  let last = performance.now()
  let frozen = false
  let camOverride: { pos: THREE.Vector3; look: THREE.Vector3; fov: number } | null = null
  function tick(dt: number, render: boolean) {
    time += dt
    engine.update(dt)
    const f = engine.frame
    show(dt, f)
    crowd.update(dt, f)
    hp.matrix.copy(crowd.headMatrices[djIndex])
    hp.matrixWorldNeedsUpdate = true
    updateCamera(dt, f)
    finish.uniforms.uTime.value = time
    if (render) composer.render(dt)
  }
  function frame(now: number) {
    raf = requestAnimationFrame(frame)
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    if (!running || frozen) return
    if (!active) { engine.update(dt); return }
    tick(dt, true)
    frameAvg = frameAvg * 0.95 + dt * 1000 * 0.05
    if (time > 3 && frameAvg > 30 && dpr > 0.6) { dpr = Math.max(0.6, dpr - 0.15); renderer.setPixelRatio(dpr); resize(); frameAvg = 20 }
  }

  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  resize()
  raf = requestAnimationFrame(frame)

  return {
    setShot,
    setAuto,
    getShot: () => ({ shot, auto }),
    setActive(v: boolean) { active = v },
    fire: onClick,
    debug: {
      freeze(v: boolean) { frozen = v },
      step(n: number, dt = 1 / 60, render = true) { for (let i = 0; i < n; i++) tick(dt, render && i === n - 1) },
      crowd,
      cam(p: number[] | null, l?: number[], fov = 45) { camOverride = p && l ? { pos: new THREE.Vector3(...p), look: new THREE.Vector3(...l), fov } : null },
      dpr(v: number) { dpr = v; renderer.setPixelRatio(v); resize() },
    },
    dispose() {
      running = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener("pointermove", onPointer)
      canvas.removeEventListener("click", onClick)
      const disposeMaterial = (mat: THREE.Material) => {
        for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose()
        const uniforms = (mat as THREE.ShaderMaterial).uniforms
        if (uniforms) for (const u of Object.values(uniforms)) if (u.value instanceof THREE.Texture) u.value.dispose()
        mat.dispose()
      }
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose()
        const mat = m.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach(disposeMaterial)
        else if (mat) disposeMaterial(mat)
        if (o instanceof THREE.InstancedMesh) o.dispose()
        const light = o as THREE.SpotLight
        if (light.isLight && light.shadow) light.shadow.dispose()
      })
      if (scene.background instanceof THREE.Texture) scene.background.dispose()
      for (const p of composer.passes) p.dispose()
      composer.dispose()
      renderer.dispose()
    },
  }
}

export type Club = ReturnType<typeof createClub>
