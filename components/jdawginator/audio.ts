export type AudioFrame = {
  playing: boolean
  time: number
  beat: number
  bpm: number
  confidence: number
  kick: number
  pulse: number
  bass: number
  mid: number
  high: number
  level: number
  energy: number
  tension: number
  drop: number
  section: "idle" | "break" | "groove" | "peak"
  sectionTime: number
  bars: Float32Array
}

const BAR_COUNT = 64
const ema = (prev: number, next: number, dt: number, tau: number) => prev + (next - prev) * (1 - Math.exp(-dt / tau))

class Agc {
  peak = 1e-3
  push(v: number, dt: number) {
    this.peak = Math.max(v, this.peak * Math.exp(-dt / 12), 1e-3)
    return Math.min(1, v / this.peak)
  }
}

export class AudioEngine {
  readonly el: HTMLAudioElement
  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private freq: Uint8Array<ArrayBuffer> = new Uint8Array(1024)
  private lowPrev = 0
  private flux: number[] = []
  private onsets: number[] = []
  private lastOnset = -1
  private clock = 0
  private agc = { low: new Agc(), bass: new Agc(), mid: new Agc(), high: new Agc(), level: new Agc() }
  private barAgc = new Float32Array(BAR_COUNT).fill(1e-3)
  private lowBassSince = 0
  private phaseErr = 0
  private highHist: number[] = []
  readonly frame: AudioFrame = {
    playing: false, time: 0, beat: 0, bpm: 124, confidence: 0, kick: 0, pulse: 0, bass: 0, mid: 0, high: 0,
    level: 0, energy: 0, tension: 0, drop: 0, section: "idle", sectionTime: 0, bars: new Float32Array(BAR_COUNT),
  }

  constructor(src: string) {
    this.el = new Audio()
    this.el.volume = 0.9
    this.el.src = src
    this.el.preload = "metadata"
    this.el.crossOrigin = "anonymous"
  }

  async play() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctx()
      const node = this.ctx.createMediaElementSource(this.el)
      this.analyser = this.ctx.createAnalyser()
      this.analyser.fftSize = 2048
      this.analyser.smoothingTimeConstant = 0.55
      node.connect(this.analyser)
      this.analyser.connect(this.ctx.destination)
      this.freq = new Uint8Array(this.analyser.frequencyBinCount)
    }
    if (this.ctx.state === "suspended") await this.ctx.resume()
    await this.el.play()
  }

  pause() {
    this.el.pause()
  }

  dispose() {
    this.el.pause()
    this.el.removeAttribute("src")
    this.el.load()
    this.ctx?.close()
    this.ctx = null
    this.analyser = null
  }

  toggle() {
    return this.el.paused ? this.play() : Promise.resolve(this.pause())
  }

  private band(lo: number, hi: number) {
    if (!this.ctx) return 0
    const hz = this.ctx.sampleRate / 2 / this.freq.length
    const a = Math.max(1, Math.floor(lo / hz)), b = Math.min(this.freq.length - 1, Math.ceil(hi / hz))
    let s = 0
    for (let i = a; i <= b; i++) s += this.freq[i]
    return s / ((b - a + 1) * 255)
  }

  private updateTempo() {
    const now = this.clock
    this.onsets = this.onsets.filter((t) => now - t < 10 && t <= now)
    const hist = new Float32Array(157)
    for (let i = 0; i < this.onsets.length; i++)
      for (let j = i + 1; j < this.onsets.length && j < i + 8; j++) {
        let d = this.onsets[j] - this.onsets[i]
        if (d < 0.2 || d > 3) continue
        while (d < 60 / 156) d *= 2
        while (d >= 60 / 78) d /= 2
        const bpm = 60 / d
        for (let k = 78; k <= 156; k++) hist[k] += Math.exp(-((k - bpm) ** 2) / 2)
      }
    let best = 0, bestK = 0
    for (let k = 78; k <= 156; k++) if (hist[k] > best) { best = hist[k]; bestK = k }
    if (best > 2) {
      let num = 0, den = 0
      for (let k = Math.max(78, bestK - 2); k <= Math.min(156, bestK + 2); k++) { num += k * hist[k]; den += hist[k] }
      const target = num / den
      this.frame.bpm += (target - this.frame.bpm) * 0.15
    }
  }

  update(dt: number) {
    const f = this.frame
    dt = Math.min(dt, 0.1)
    f.playing = !!this.ctx && !this.el.paused
    f.time = this.el.currentTime
    const prevClock = this.clock
    this.clock = f.playing ? this.el.currentTime : this.clock + dt
    if (this.clock < prevClock - 0.05 || this.clock > prevClock + 1) { this.onsets = []; this.lastOnset = -1 }
    const corr = this.phaseErr * (1 - Math.exp(-dt * 5))
    this.phaseErr -= corr
    f.beat += (dt * f.bpm) / 60 + corr
    f.kick *= Math.exp(-dt * 7)
    f.drop *= Math.exp(-dt * 0.45)

    if (!f.playing || !this.analyser) {
      for (const k of ["bass", "mid", "high", "level", "energy", "tension"] as const) f[k] = ema(f[k], 0, dt, 0.6)
      f.pulse = ema(f.pulse, 0, dt, 0.3)
      for (let i = 0; i < BAR_COUNT; i++) f.bars[i] *= Math.exp(-dt * 4)
      if (f.section !== "idle") { f.section = "idle"; f.sectionTime = 0 }
      f.sectionTime += dt
      return
    }

    this.analyser.getByteFrequencyData(this.freq)
    const low = this.band(30, 130)
    const bass = this.agc.bass.push(this.band(30, 250), dt)
    const mid = this.agc.mid.push(this.band(250, 2500), dt)
    const high = this.agc.high.push(this.band(2500, 12000), dt)
    const level = this.agc.level.push(this.band(30, 12000), dt)

    const fl = Math.max(0, low - this.lowPrev)
    this.lowPrev = low
    this.flux.push(fl)
    if (this.flux.length > 90) this.flux.shift()
    const mean = this.flux.reduce((a, b) => a + b, 0) / this.flux.length
    const sd = Math.sqrt(this.flux.reduce((a, b) => a + (b - mean) ** 2, 0) / this.flux.length)
    const lowN = this.agc.low.push(low, dt)
    if (fl > mean + 1.4 * sd && fl > 0.012 && lowN > 0.35 && this.clock - this.lastOnset > 0.26) {
      this.lastOnset = this.clock
      this.onsets.push(this.clock)
      this.updateTempo()
      f.kick = 1
      const frac = f.beat - Math.round(f.beat)
      this.phaseErr = -frac * 0.35
      const aligned = Math.abs(frac) < 0.12 ? 1 : 0
      f.confidence = f.confidence * 0.85 + aligned * 0.15
    }
    if (this.clock - this.lastOnset > 2) f.confidence *= Math.exp(-dt * 0.5)

    f.bass = ema(f.bass, bass, dt, 0.08)
    f.mid = ema(f.mid, mid, dt, 0.08)
    f.high = ema(f.high, high, dt, 0.05)
    f.level = ema(f.level, level, dt, 0.1)
    f.energy = ema(f.energy, level * 0.6 + bass * 0.4, dt, 2.5)
    const phase = f.beat - Math.floor(f.beat)
    const phasePulse = Math.exp(-phase * 6) * f.confidence * Math.min(1, f.bass * 1.4)
    f.pulse = Math.max(f.kick * lowN, phasePulse)

    const bassSlow = this.lowBassSlow = ema(this.lowBassSlow, lowN, dt, 0.7)
    this.highHist.push(f.high + f.mid)
    if (this.highHist.length > 240) this.highHist.shift()

    const prev = f.section
    let next: AudioFrame["section"] = prev === "idle" ? "groove" : prev
    if (bassSlow < 0.28) next = "break"
    else if (prev === "break" && bassSlow > 0.5) next = "peak"
    else if (prev !== "break") next = f.energy > 0.62 && bassSlow > 0.55 ? "peak" : f.energy < 0.5 ? "groove" : prev
    if (next !== prev) {
      if (prev === "break" && next === "peak" && f.sectionTime > 3) f.drop = 1
      f.section = next
      f.sectionTime = 0
    }
    f.sectionTime += dt
    if (f.section === "break") {
      this.lowBassSince += dt
      const recent = this.highHist.slice(-30).reduce((a, b) => a + b, 0) / 30
      f.tension = ema(f.tension, Math.min(1, (this.lowBassSince / 16) * 0.6 + recent * 0.4), dt, 0.5)
    } else {
      this.lowBassSince = 0
      f.tension = ema(f.tension, 0, dt, 0.4)
    }

    if (this.ctx) {
      const nyq = this.ctx.sampleRate / 2
      for (let i = 0; i < BAR_COUNT; i++) {
        const lo = 35 * Math.pow(16000 / 35, i / BAR_COUNT), hi = 35 * Math.pow(16000 / 35, (i + 1) / BAR_COUNT)
        const v = this.band(lo, Math.max(hi, lo + nyq / this.freq.length))
        this.barAgc[i] = Math.max(v, this.barAgc[i] * Math.exp(-dt / 8), 0.02)
        const n = v / this.barAgc[i]
        f.bars[i] = n > f.bars[i] ? n : f.bars[i] * Math.exp(-dt * 5)
      }
    }
  }

  private lowBassSlow = 0
}
