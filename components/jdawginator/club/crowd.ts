import * as THREE from "three"
import { BOX, rand, pick } from "./voxels"
import type { AudioFrame } from "../audio"

export type Style =
  | "idle" | "bounce" | "twostep" | "pump" | "handsup" | "jump" | "headbang" | "sway" | "clap" | "phone" | "bartender"
  | "dj_mix" | "dj_nod" | "dj_ear" | "dj_pump" | "dj_flick" | "dj_point" | "dj_hands" | "dj_clap"

type Dancer = {
  x: number; z: number; yaw: number; h: number
  shirt: THREE.Color; pants: THREE.Color; skin: THREE.Color; hair: THREE.Color; shoe: THREE.Color
  hairStyle: number; glasses: boolean; phone: boolean; cup: boolean
  style: Style; prev: Style; blend: number; nextSwitch: number; pendingAt: number; pending: Style | null
  off: number; bias: number; fixed: boolean; seed: number; isDJ: boolean
  rate: number; prevRate: number; mirror: boolean; prevMirror: boolean; blendDur: number; nf: number; offs: Float32Array; lastBeat: number; lastE: number
  pose: Float32Array
}

// pose layout
const P_KNEE = 0, P_JUMP = 1, P_SX = 2, P_TWIST = 3, P_LEAN = 4, P_HP = 5, P_HY = 6
const P_LP = 7, P_LR = 8, P_LE = 9, P_RP = 10, P_RR = 11, P_RE = 12, P_PHONE = 13, P_LEG = 14, P_TILT = 15
const POSE_N = 16

const SILHOUETTE = 0.07
const SKINS = ["#f1c9a5", "#e0ac83", "#c68a5d", "#a0673f", "#7a4a2b", "#5a3520", "#f5d7bd"]
const SHIRTS = ["#0d0d0f", "#0d0d0f", "#111114", "#f2f2f2", "#e8e8e8", "#1f2a44", "#3a1a4a", "#7a1424", "#0f3d3a", "#2b2b30", "#c9c9cf", "#ff4f9a", "#3b5bdb", "#4a4f2a", "#6b3a1f"]
const PANTS = ["#141416", "#1c2433", "#2a3550", "#0e0e10", "#3a3a3f", "#4a3a2a", "#23324d"]
const HAIRS = ["#140e0a", "#2b1d14", "#4a3020", "#6b4a2b", "#c9a46a", "#0a0a0a", "#8a2a1a", "#d8d2c8"]
const SHOES = ["#f2f2f2", "#0b0b0c", "#1a1a1a", "#e8e2d6", "#3a3a40"]

const TAU = Math.PI * 2
const sm = (x: number) => x * x * (3 - 2 * x)
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
// smooth periodic accent that peaks on every whole beat
const peak = (b: number, k: number) => Math.pow(0.5 + 0.5 * Math.cos(TAU * b), k)
const noise = (t: number, s: number) => Math.sin(t * 0.73 + s) * 0.5 + Math.sin(t * 1.37 + s * 2.1) * 0.3 + Math.sin(t * 2.21 + s * 3.7) * 0.2
const SWAP: [number, number][] = [[7, 10], [8, 11], [9, 12]]
const NEGATE = [2, 3, 6, 14, 15]
const NO_MIRROR = new Set<Style>(["phone", "idle", "bartender"])

export class Crowd {
  dancers: Dancer[] = []
  meshes: Record<string, THREE.InstancedMesh> = {}
  rim = new THREE.Color(0, 0, 0)
  private rimU = { value: this.rim }
  headMatrices: THREE.Matrix4[] = []
  handMatrices: THREE.Matrix4[] = []
  private time = 0

  constructor(scene: THREE.Scene, spots: { x: number; z: number; yaw: number; style?: Style; fixed?: boolean }[], djSpot: { x: number; z: number; y: number }) {
    for (const s of spots) this.dancers.push(this.make(s.x, s.z, s.yaw, s.style ?? "idle", !!s.fixed))
    this.djY = djSpot.y
    const dj = this.make(djSpot.x, djSpot.z, 0, "dj_mix", false)
    dj.isDJ = true
    dj.off = 0
    dj.bias = 1
    dj.shirt = new THREE.Color("#0c0c0e")
    dj.pants = new THREE.Color("#121214")
    dj.skin = new THREE.Color("#b07a52")
    dj.hair = new THREE.Color("#0c0c0c")
    dj.hairStyle = 3
    dj.glasses = false
    dj.phone = false
    dj.cup = false
    dj.h = 0.76
    this.dancers.push(dj)
    this.djIndex = this.dancers.length - 1

    const N = this.dancers.length
    const std = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, metalness: 0 })
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0 })
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })
    for (const mat of [std, skinMat]) mat.onBeforeCompile = (sh) => {
      sh.uniforms.uRim = this.rimU
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform vec3 uRim;")
        .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
          vec3 vDir = normalize(vViewPosition);
          float fres = pow(1.0 - saturate(abs(dot(normal, vDir))), 4.0);
          float top = saturate(dot(normal, normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz)));
          float back = saturate(dot(normal, normalize((viewMatrix * vec4(0.0, 0.0, -1.0, 0.0)).xyz)));
          float far = smoothstep(6.0, 45.0, length(vViewPosition));
          totalEmissiveRadiance += uRim * far * (fres * (0.3 + 0.7 * back) + top * 0.06);`)
    }
    const defs: [string, number, THREE.Material][] = [
      ["torso", N, std], ["hips", N, std], ["head", N, skinMat], ["hair", N, std], ["hair2", N, std], ["eyes", 2 * N, std],
      ["upper", 2 * N, std], ["fore", 2 * N, skinMat], ["thigh", 2 * N, std], ["shin", 2 * N, std], ["shoe", 2 * N, std],
      ["phone", N, glowMat], ["cup", N, std],
    ]
    for (const [name, n, mat] of defs) {
      const m = new THREE.InstancedMesh(BOX, mat, n)
      m.castShadow = name !== "eyes" && name !== "phone"
      m.receiveShadow = true
      m.frustumCulled = false
      this.meshes[name] = m
      scene.add(m)
    }
    const eyeC = new THREE.Color("#0a0a0a"), glassC = new THREE.Color("#050505")
    this.dancers.forEach((d, i) => {
      const M = this.meshes
      for (const c of [d.shirt, d.pants, d.skin, d.hair, d.shoe]) c.multiplyScalar(SILHOUETTE)
      M.torso.setColorAt(i, d.shirt)
      M.hips.setColorAt(i, d.pants)
      M.head.setColorAt(i, d.skin)
      M.hair.setColorAt(i, d.hair)
      M.hair2.setColorAt(i, d.hairStyle === 3 ? d.hair : d.hair)
      M.phone.setColorAt(i, new THREE.Color(pick(["#cfe3ff", "#ffffff", "#bcd6ff"])).multiplyScalar(1.6))
      M.cup.setColorAt(i, new THREE.Color(pick(["#c8202a", "#e8e8ea", "#2a6bd8"])))
      for (let s = 0; s < 2; s++) {
        M.eyes.setColorAt(2 * i + s, d.glasses ? glassC : eyeC)
        M.upper.setColorAt(2 * i + s, d.shirt)
        M.fore.setColorAt(2 * i + s, d.skin)
        M.thigh.setColorAt(2 * i + s, d.pants)
        M.shin.setColorAt(2 * i + s, d.pants)
        M.shoe.setColorAt(2 * i + s, d.shoe)
      }
      this.headMatrices.push(new THREE.Matrix4())
      this.handMatrices.push(new THREE.Matrix4())
    })
    for (const m of Object.values(this.meshes)) if (m.instanceColor) m.instanceColor.needsUpdate = true
  }

  djIndex = 0
  djY = 0

  private make(x: number, z: number, yaw: number, style: Style, fixed: boolean): Dancer {
    const hairStyle = rand() < 0.08 ? 2 : rand() < 0.3 ? 1 : rand() < 0.12 ? 3 : 0
    return {
      x, z, yaw, h: 0.64 + rand() * 0.14,
      shirt: new THREE.Color(pick(SHIRTS)), pants: new THREE.Color(pick(PANTS)), skin: new THREE.Color(pick(SKINS)),
      hair: new THREE.Color(pick(HAIRS)), shoe: new THREE.Color(pick(SHOES)),
      hairStyle, glasses: rand() < 0.12, phone: rand() < 0.35, cup: rand() < 0.25,
      style, prev: style, blend: 1, nextSwitch: rand() * 10, pendingAt: 0, pending: null,
      off: (rand() - 0.5) * 0.14 + (rand() < 0.15 ? 0.12 : 0), bias: 0.6 + rand() * 0.65, fixed, seed: rand() * 100, isDJ: false,
      rate: 1, prevRate: 1, mirror: rand() < 0.5, prevMirror: false, blendDur: 0.6 + rand() * 0.6, nf: 0.7 + rand() * 0.6, offs: new Float32Array(POSE_N), lastBeat: 0, lastE: 0,
      pose: new Float32Array(POSE_N),
    }
  }

  private choose(d: Dancer, f: AudioFrame): Style {
    if (d.fixed) return d.style
    const r = rand()
    const w = (table: [Style, number][]) => {
      let s = 0
      const tot = table.reduce((a, [, v]) => a + v, 0)
      for (const [k, v] of table) { s += v / tot; if (r < s) return k }
      return table[0][0]
    }
    if (d.isDJ) {
      if (f.drop > 0.6) return w([["dj_hands", 4], ["dj_pump", 2], ["dj_flick", 2]])
      switch (f.section) {
        case "idle": return w([["dj_mix", 3], ["dj_ear", 2], ["dj_nod", 1]])
        case "break": return f.tension > 0.5 ? w([["dj_clap", 3], ["dj_hands", 1.2], ["dj_ear", 1.5], ["dj_point", 0.8]]) : w([["dj_ear", 3], ["dj_mix", 3], ["dj_point", 0.6]])
        case "groove": return w([["dj_mix", 4], ["dj_nod", 3], ["dj_ear", 2], ["dj_pump", 0.7], ["dj_flick", 0.6], ["dj_point", 0.4]])
        case "peak": return w([["dj_pump", 3], ["dj_flick", 3], ["dj_nod", 2], ["dj_mix", 1.5], ["dj_point", 1.5], ["dj_hands", 1]])
      }
    }
    if (f.drop > 0.6) return w([["jump", 4], ["handsup", 4], ["pump", 2], ["bounce", 1]])
    switch (f.section) {
      case "idle": return w([["idle", 7], ["sway", 2], ["phone", 0.3]])
      case "break": return f.tension > 0.45 ? w([["clap", 4], ["handsup", 3], ["phone", 1.5], ["sway", 1]]) : w([["sway", 5], ["phone", 1.5], ["handsup", 1], ["idle", 1]])
      case "groove": return w([["bounce", 4], ["twostep", 3.5], ["pump", 1], ["headbang", 0.7], ["sway", 1], ["phone", 0.4], ["idle", 0.2]])
      case "peak": return w([["bounce", 2.5], ["pump", 3], ["handsup", 2.5], ["jump", 1.5], ["headbang", 1.2], ["twostep", 1]])
    }
  }

  private rateFor(style: Style) {
    if (style === "idle" || style === "phone" || style === "sway" || style.startsWith("dj_")) return 1
    return rand() < 0.2 ? 0.5 : 1
  }

  private posefor(style: Style, d: Dancer, b: number, e: number, f: AudioFrame, out: Float32Array, mirror: boolean) {
    const t = this.time * d.nf + d.seed
    const ph = b - Math.floor(b)
    const bnc = 0.5 - 0.5 * Math.cos(2 * Math.PI * b)
    const half = Math.sin(Math.PI * b)
    const breath = Math.sin(t * 1.7) * 0.04
    out.fill(0)
    out[P_KNEE] = 0.12
    out[P_LE] = 0.35 + breath
    out[P_RE] = 0.35 - breath
    out[P_LR] = 0.12
    out[P_RR] = 0.12
    out[P_HY] = Math.sin(t * 0.37) * 0.25
    switch (style) {
      case "idle":
        out[P_HY] = Math.sin(t * 0.5) * 0.6
        out[P_HP] = Math.sin(t * 0.9) * 0.08
        out[P_TWIST] = Math.sin(t * 0.3) * 0.15
        out[P_KNEE] = 0.08 + bnc * 0.05
        if (d.cup) { out[P_LP] = -0.5; out[P_LE] = 2.0 + Math.max(0, Math.sin(t * 0.6)) * 0.4 }
        break
      case "bounce":
        out[P_KNEE] = 0.14 + 0.42 * e * bnc
        out[P_HP] = 0.28 * e * bnc
        out[P_LP] = -0.35 - 0.35 * e * bnc; out[P_RP] = -0.35 - 0.35 * e * bnc
        out[P_LE] = 1.3; out[P_RE] = 1.3
        out[P_TWIST] = 0.12 * half * e
        break
      case "twostep":
        out[P_KNEE] = 0.12 + 0.35 * e * bnc
        out[P_SX] = 0.7 * half * e
        out[P_TWIST] = 0.28 * half
        out[P_TILT] = -0.06 * half
        out[P_LP] = -0.45 + 0.5 * half; out[P_RP] = -0.45 - 0.5 * half
        out[P_LE] = 1.25; out[P_RE] = 1.25
        out[P_HP] = 0.18 * bnc * e
        out[P_LEG] = 0.25 * half
        break
      case "pump":
        out[P_KNEE] = 0.14 + 0.38 * e * bnc
        out[P_RP] = -2.55 - 0.45 * peak(b, 6); out[P_RR] = 0.25; out[P_RE] = 0.9 - 0.7 * peak(b, 6)
        out[P_LP] = -0.4 - 0.3 * bnc; out[P_LE] = 1.4
        out[P_HP] = 0.3 * bnc * e - 0.15
        break
      case "handsup": {
        const wave = Math.sin((Math.PI * b) / 2) * 0.35
        out[P_KNEE] = 0.14 + 0.36 * e * bnc
        out[P_LP] = -2.75; out[P_RP] = -2.75
        out[P_LR] = 0.35 + wave; out[P_RR] = 0.35 - wave
        out[P_LE] = 0.35; out[P_RE] = 0.35
        out[P_TILT] = wave * 0.25
        out[P_HP] = -0.25 + 0.15 * bnc
        break
      }
      case "jump": {
        const air = Math.pow(Math.max(0, Math.sin(TAU * (b - 0.12))), 1.5)
        out[P_JUMP] = 2.2 * e * air
        out[P_KNEE] = 0.15 + 0.5 * peak(b, 4) * e
        out[P_LP] = -2.9 + 0.3 * air; out[P_RP] = -2.9 + 0.3 * air
        out[P_LR] = 0.3; out[P_RR] = 0.3
        out[P_LE] = 0.3; out[P_RE] = 0.3
        out[P_HP] = -0.2
        break
      }
      case "headbang":
        out[P_KNEE] = 0.15 + 0.3 * bnc * e
        out[P_LEAN] = 0.22 + 0.2 * bnc
      {
        out[P_HP] = 0.75 * peak(b, 4) - 0.1
        out[P_LP] = -0.3; out[P_LE] = 1.0
        const up = sm(clamp01(noise(t * 0.15, d.seed + 5) * 1.6 + 0.3))
        out[P_RP] = -0.3 - 2.4 * up; out[P_RE] = 1.0 - 0.5 * up
        break
      }
      case "sway": {
        const s = Math.sin((Math.PI * b) / 2)
        out[P_KNEE] = 0.1 + 0.15 * bnc * e
        out[P_TWIST] = 0.22 * s
        out[P_SX] = 0.35 * s
        out[P_TILT] = 0.08 * s
        out[P_LP] = -0.3 + 0.2 * s; out[P_RP] = -0.3 - 0.2 * s
        out[P_LE] = 0.8 + 0.3 * s; out[P_RE] = 0.8 - 0.3 * s
        out[P_HP] = 0.1 * bnc
        out[P_HY] = s * 0.3
        break
      }
      case "clap": {
        const c = peak(b, 7)
        out[P_KNEE] = 0.12 + 0.2 * bnc
        out[P_LP] = -2.6; out[P_RP] = -2.6
        out[P_LR] = 0.05 + 0.42 * (1 - c) - 0.25; out[P_RR] = 0.05 + 0.42 * (1 - c) - 0.25
        out[P_LE] = 0.6; out[P_RE] = 0.6
        out[P_HP] = -0.25
        break
      }
      case "phone":
        out[P_KNEE] = 0.12 + 0.18 * bnc * e
        out[P_RP] = -2.15; out[P_RE] = 0.45; out[P_RR] = -0.05
        out[P_LP] = -0.3 + 0.15 * half; out[P_LE] = 1.1
        out[P_PHONE] = 1
        out[P_HP] = -0.15
        break
      case "bartender": {
        const shake = Math.sin(t * 14) * (Math.sin(t * 0.4) > 0.2 ? 1 : 0)
        out[P_LP] = -1.25 + shake * 0.25; out[P_RP] = -1.35 + shake * 0.25
        out[P_LE] = 1.4; out[P_RE] = 1.4
        out[P_LR] = -0.25; out[P_RR] = -0.25
        out[P_HP] = 0.25
        out[P_KNEE] = 0.06 + 0.05 * bnc
        out[P_HY] = Math.sin(t * 0.25) * 0.5
        break
      }
      case "dj_mix": case "dj_nod": case "dj_ear": case "dj_pump": case "dj_flick": case "dj_point": case "dj_hands": case "dj_clap": {
        const knob = noise(t * 2.2, d.seed), knob2 = noise(t * 1.7, d.seed + 9)
        out[P_KNEE] = 0.12 + 0.3 * bnc * e
        out[P_LEAN] = 0.2
        out[P_HP] = 0.3 + 0.35 * peak(b, 5) * e
        out[P_HY] = Math.sin(b * Math.PI * 0.25) * 0.12
        out[P_LP] = -0.55 + knob2 * 0.08; out[P_LE] = 0.9; out[P_LR] = -0.05 + knob2 * 0.06
        out[P_RP] = -0.55 + knob * 0.1; out[P_RE] = 0.9; out[P_RR] = -0.05 + knob * 0.08
        if (style === "dj_nod") { out[P_HP] = 0.15 + 0.7 * peak(b, 4) * e; out[P_LEAN] = 0.3; out[P_KNEE] = 0.15 + 0.4 * bnc * e }
        else if (style === "dj_ear") { out[P_LP] = -0.65; out[P_LE] = 2.55; out[P_LR] = 0.72; out[P_HY] = 0.25; out[P_TILT] = 0.08; out[P_HP] = 0.25 + 0.2 * peak(b, 4) }
        else if (style === "dj_pump") { const k = peak(b, 6); out[P_RP] = -2.5 - 0.45 * k; out[P_RE] = 0.9 - 0.7 * k; out[P_RR] = 0.2; out[P_HP] = -0.1 + 0.45 * k; out[P_LEAN] = 0.1 }
        else if (style === "dj_flick") { const k = peak(b + 0.04, 8); out[P_RP] = -2.35; out[P_RR] = 0.15; out[P_RE] = 0.3 + 1.3 * k; out[P_HP] = 0.1 + 0.4 * k; out[P_LEAN] = 0.08 }
        else if (style === "dj_point") { const sweep = noise(t * 0.3, d.seed + 2) * 0.4; out[P_RP] = -1.75 + 0.15 * peak(b, 6); out[P_RE] = 0.15; out[P_RR] = 0.1 + sweep; out[P_HY] = sweep * 0.6; out[P_HP] = 0; out[P_LEAN] = 0.05 }
        else if (style === "dj_hands") {
          const wave = Math.sin((Math.PI * b) / 2) * 0.3
          out[P_LP] = -2.8; out[P_RP] = -2.8; out[P_LR] = 0.4 + wave; out[P_RR] = 0.4 - wave; out[P_LE] = 0.3; out[P_RE] = 0.3
          out[P_HP] = -0.25 + 0.2 * bnc; out[P_LEAN] = -0.05; out[P_KNEE] = 0.15 + 0.4 * bnc * e
        } else if (style === "dj_clap") {
          const c = peak(b, 7)
          out[P_LP] = -2.6; out[P_RP] = -2.6; out[P_LR] = 0.22 - 0.42 * c; out[P_RR] = 0.22 - 0.42 * c; out[P_LE] = 0.6; out[P_RE] = 0.6
          out[P_HP] = -0.2; out[P_LEAN] = 0
        }
        break
      }
    }
    if (style !== "bartender") {
      const n1 = noise(t * 0.6, d.seed), n2 = noise(t * 0.45, d.seed + 3.1), n3 = noise(t * 0.8, d.seed + 7.7)
      const k = d.isDJ ? 0.4 : 1
      out[P_TWIST] += n1 * 0.1 * k
      out[P_HY] += n2 * 0.25 * k
      out[P_TILT] += n3 * 0.03 * k
      out[P_SX] += n1 * 0.12 * k
      out[P_LP] += n2 * 0.12 * k; out[P_RP] += n1 * 0.12 * k
      out[P_LE] += n3 * 0.15 * k; out[P_RE] -= n2 * 0.15 * k
    }
    if (mirror && !NO_MIRROR.has(style)) {
      for (const [a, c] of SWAP) { const v = out[a]; out[a] = out[c]; out[c] = v }
      for (const a of NEGATE) out[a] = -out[a]
    }
  }

  update(dt: number, f: AudioFrame) {
    this.time += dt
    const crowdE = f.playing ? Math.min(1, 0.35 + f.energy * 0.75 + f.drop * 0.3) : 0.12
    const _m = this.tm
    const spb = 60 / f.bpm
    const sectionChanged = f.section !== this.lastSection
    const dropHit = f.drop > 0.95 && !this.dropSeen
    this.dancers.forEach((d, i) => {
      d.nextSwitch -= dt
      if (!d.fixed) {
        if (d.pending && this.time >= d.pendingAt) {
          if (d.blend < 1) {
            this.posefor(d.style, d, d.lastBeat * d.rate, d.lastE, f, this.tmpPose, d.mirror)
            for (let j = 0; j < POSE_N; j++) d.offs[j] = d.pose[j] - this.tmpPose[j]
          } else d.offs.fill(0)
          d.prev = d.style; d.prevRate = d.rate; d.prevMirror = d.mirror
          d.style = d.pending; d.pending = null; d.blend = 0
          d.rate = this.rateFor(d.style); d.mirror = rand() < 0.5
        } else if (d.nextSwitch <= 0 && !d.pending) {
          d.pending = this.choose(d, f)
          if (d.isDJ) {
            const toBar = (4 - (((f.beat % 4) + 4) % 4)) % 4
            d.pendingAt = this.time + toBar * spb
            d.nextSwitch = toBar * spb + (rand() < 0.6 ? 8 : 16) * spb
          } else {
            d.pendingAt = this.time + rand() * 2 * spb
            d.nextSwitch = (16 + Math.floor(rand() * 4) * 8) * spb * (0.7 + rand() * 0.6)
          }
        }
        if (dropHit || (sectionChanged && (d.isDJ || rand() < 0.75))) {
          d.pending = this.choose(d, f)
          d.pendingAt = this.time + (d.isDJ || dropHit ? rand() * 0.25 : rand() * 3.5)
        }
      }
      const proximity = Math.max(0, Math.min(1, 1 - (d.z + 20) / 70))
      const e = d.isDJ ? Math.max(0.5, crowdE) : Math.min(1, crowdE * d.bias * (0.75 + proximity * 0.45))
      const beat = f.beat + d.off
      this.posefor(d.style, d, beat * d.rate, e, f, this.cur, d.mirror)
      const dur = d.isDJ ? 0.4 : d.blendDur
      d.blend = Math.min(1, d.blend + dt / dur)
      if (d.blend < 1) {
        this.posefor(d.prev, d, beat * d.prevRate, e, f, this.tmpPose, d.prevMirror)
        const k = sm(d.blend)
        for (let j = 0; j < POSE_N; j++) d.pose[j] = this.tmpPose[j] + (this.cur[j] - this.tmpPose[j]) * k + d.offs[j] * (1 - k)
      } else d.pose.set(this.cur)
      d.lastBeat = beat
      d.lastE = e
      this.write(i, d)
    })
    this.lastSection = f.section
    this.dropSeen = f.drop > 0.95
    for (const m of Object.values(this.meshes)) m.instanceMatrix.needsUpdate = true
    void _m
  }

  private lastSection = "idle"
  private dropSeen = false
  private cur = new Float32Array(POSE_N)
  private tmpPose = new Float32Array(POSE_N)
  private tm = new THREE.Matrix4()
  private M = { root: new THREE.Matrix4(), pelvis: new THREE.Matrix4(), torso: new THREE.Matrix4(), chest: new THREE.Matrix4(), head: new THREE.Matrix4(), sh: new THREE.Matrix4(), el: new THREE.Matrix4(), hip: new THREE.Matrix4(), kn: new THREE.Matrix4(), tmp: new THREE.Matrix4(), out: new THREE.Matrix4() }
  private r = new THREE.Matrix4()

  private put(mesh: THREE.InstancedMesh, idx: number, parent: THREE.Matrix4, cx: number, cy: number, cz: number, sx: number, sy: number, sz: number) {
    const o = this.M.out
    o.makeScale(sx, sy, sz)
    o.setPosition(cx, cy, cz)
    o.premultiply(parent)
    mesh.setMatrixAt(idx, o)
  }

  private write(i: number, d: Dancer) {
    const { root, pelvis, torso, chest, head, sh, el, hip, kn } = this.M
    const p = d.pose, M = this.meshes, r = this.r
    const y0 = d.isDJ ? this.djY : 0
    const wander = d.fixed || d.isDJ ? 0 : 1
    const tw = this.time * 0.11 * d.nf
    root.makeRotationY(d.yaw + wander * noise(tw, d.seed + 11) * 0.4)
      .setPosition(d.x + wander * noise(tw * 0.7, d.seed + 13) * 0.45, y0, d.z + wander * noise(tw * 0.6, d.seed + 17) * 0.35)
    root.multiply(r.makeScale(d.h, d.h, d.h))
    const knee = Math.min(0.85, Math.max(0, p[P_KNEE]))
    const P = 6 * Math.cos(knee)
    pelvis.copy(root).multiply(r.makeTranslation(p[P_SX], P + p[P_JUMP], 0)).multiply(r.makeRotationZ(p[P_TILT]))
    torso.copy(pelvis).multiply(r.makeRotationY(p[P_TWIST])).multiply(r.makeRotationX(p[P_LEAN] + knee * 0.25))
    this.put(M.hips, i, pelvis, 0, 0.3, 0, 4, 1.4, 2.3)
    this.put(M.torso, i, torso, 0, 2.7, 0, 4, 4.6, 2.2)
    chest.copy(torso).multiply(r.makeTranslation(0, 5, 0))
    head.copy(chest).multiply(r.makeTranslation(0, 0.25, 0.1)).multiply(r.makeRotationY(p[P_HY])).multiply(r.makeRotationX(p[P_HP]))
    this.headMatrices[i].copy(head)
    this.put(M.head, i, head, 0, 1.6, 0, 3, 3.2, 3)
    // hair styles: 0 short, 1 long, 2 bald, 3 cap
    if (d.hairStyle === 2) {
      this.put(M.hair, i, head, 0, 3.2, 0, 0.001, 0.001, 0.001)
      this.put(M.hair2, i, head, 0, 3.2, 0, 0.001, 0.001, 0.001)
    } else if (d.hairStyle === 3) {
      this.put(M.hair, i, head, 0, 3.35, -0.05, 3.3, 0.9, 3.25)
      this.put(M.hair2, i, head, 0, 3.0, 1.9, 2.9, 0.3, 1.5)
    } else {
      this.put(M.hair, i, head, 0, 3.3, -0.1, 3.25, 0.8, 3.25)
      if (d.hairStyle === 1) this.put(M.hair2, i, head, 0, 1.5, -1.25, 3.3, 3.6, 0.85)
      else this.put(M.hair2, i, head, 0, 2.5, -1.4, 3.2, 1.6, 0.4)
    }
    if (d.glasses) {
      this.put(M.eyes, 2 * i, head, 0, 1.85, 1.52, 2.7, 0.65, 0.15)
      this.put(M.eyes, 2 * i + 1, head, 0, 1.85, 1.52, 0.001, 0.001, 0.001)
    } else for (let s = 0; s < 2; s++) this.put(M.eyes, 2 * i + s, head, s ? 0.7 : -0.7, 1.85, 1.51, 0.45, 0.45, 0.1)

    for (let s = 0; s < 2; s++) {
      const sg = s ? 1 : -1
      const pitch = s ? p[P_RP] : p[P_LP], roll = s ? p[P_RR] : p[P_LR], elbow = s ? p[P_RE] : p[P_LE]
      sh.copy(chest).multiply(r.makeTranslation(sg * 2.65, -0.65, 0)).multiply(r.makeRotationZ(sg * roll)).multiply(r.makeRotationX(pitch))
      this.put(M.upper, 2 * i + s, sh, 0, -1.4, 0, 1.45, 3, 1.5)
      el.copy(sh).multiply(r.makeTranslation(0, -2.9, 0)).multiply(r.makeRotationX(-elbow))
      this.put(M.fore, 2 * i + s, el, 0, -1.45, 0, 1.25, 3, 1.3)
      if (s === 1) {
        this.handMatrices[i].copy(el).multiply(r.makeTranslation(0, -3, 0))
        if (d.phone && p[P_PHONE] > 0.5) this.put(M.phone, i, el, 0, -3.3, 0.55, 0.95, 1.7, 0.16)
        else this.put(M.phone, i, el, 0, -3, 0, 0.001, 0.001, 0.001)
      } else {
        if (d.cup && (d.style === "idle" || d.style === "sway" || d.style === "bounce")) this.put(M.cup, i, el, 0, -3.2, 0.6, 1, 1.4, 1)
        else this.put(M.cup, i, el, 0, -3, 0, 0.001, 0.001, 0.001)
      }
      const swing = s ? -p[P_LEG] : p[P_LEG]
      hip.copy(pelvis).multiply(r.makeTranslation(sg * 1.05, 0, 0)).multiply(r.makeRotationX(-knee + swing))
      this.put(M.thigh, 2 * i + s, hip, 0, -1.5, 0, 1.85, 3.1, 2.1)
      kn.copy(hip).multiply(r.makeTranslation(0, -3, 0)).multiply(r.makeRotationX(2 * knee))
      this.put(M.shin, 2 * i + s, kn, 0, -1.5, 0, 1.75, 3.1, 1.95)
      kn.multiply(r.makeTranslation(0, -3, 0)).multiply(r.makeRotationX(-knee - swing))
      this.put(M.shoe, 2 * i + s, kn, 0, -0.35, 0.35, 1.95, 0.8, 2.9)
    }
  }
}
