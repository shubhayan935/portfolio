"use client"

import { useEffect, useRef, useState } from "react"
import type { AudioEngine } from "./audio"

const fmt = (s: number) => {
  if (!isFinite(s)) return "--:--"
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`
}

export function usePlayback(engine: AudioEngine) {
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(NaN)
  useEffect(() => {
    const el = engine.el
    const on = () => {
      setPlaying(!el.paused)
      setTime(el.currentTime)
      setDuration(el.duration)
    }
    const evs = ["play", "pause", "timeupdate", "loadedmetadata", "ended"]
    evs.forEach((e) => el.addEventListener(e, on))
    on()
    return () => evs.forEach((e) => el.removeEventListener(e, on))
  }, [engine])
  return { playing, time, duration }
}

function PlayIcon({ playing }: { playing: boolean }) {
  return playing ? (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" className="size-4 translate-x-[1px]" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" /></svg>
  )
}

function Meter({ engine, bars = 24, className = "" }: { engine: AudioEngine; bars?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const el = ref.current
      if (!el) return
      const f = engine.frame
      for (let i = 0; i < el.children.length; i++) {
        const v = f.bars[Math.floor((i / el.children.length) * 56)] ?? 0
        ;(el.children[i] as HTMLElement).style.transform = `scaleY(${Math.max(0.06, Math.min(1, v))})`
      }
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [engine])
  return (
    <div ref={ref} className={`flex h-6 items-end gap-[2px] ${className}`} aria-hidden="true">
      {Array.from({ length: bars }, (_, i) => (
        <span key={i} className="h-full w-[3px] origin-bottom bg-white/80" style={{ transform: "scaleY(0.06)" }} />
      ))}
    </div>
  )
}

export function Player({ engine, title, subtitle }: { engine: AudioEngine; title: string; subtitle: string }) {
  const { playing, time, duration } = usePlayback(engine)
  const [vol, setVol] = useState(0.9)
  useEffect(() => { engine.el.volume = vol }, [engine, vol])
  const pct = duration ? (time / duration) * 100 : 0
  return (
    <div className="pointer-events-auto flex w-full items-center gap-4 border border-white/15 bg-black/55 px-3 py-3 backdrop-blur-md md:gap-5 md:px-4">
      <button
        onClick={() => engine.toggle()}
        className="flex size-11 shrink-0 cursor-pointer items-center justify-center bg-white text-black transition-transform hover:scale-105 active:scale-95"
        aria-label={playing ? "Pause the set" : "Play the set"}
      >
        <PlayIcon playing={playing} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 whitespace-nowrap text-[11px] uppercase tracking-[0.14em] text-white/60">
          <span className={`inline-block size-1.5 ${playing ? "animate-pulse bg-[#ff2b3b]" : "bg-white/40"}`} />
          <span>{playing ? "On air" : "Tune in"}</span>
          <span className="text-white/30">/</span>
          <span className="truncate">{subtitle}</span>
        </div>
        <div className="mt-1 truncate font-garnett text-base text-white">{title}</div>
        <div className="mt-2 flex items-center gap-3">
          <span className="w-10 text-[11px] tabular-nums text-white/60">{fmt(time)}</span>
          <input
            type="range" min={0} max={duration || 0} step={0.1} value={time}
            onChange={(e) => { engine.el.currentTime = Number(e.target.value) }}
            className="jd-range h-1 flex-1 cursor-pointer" style={{ ["--pct" as string]: `${pct}%` }}
            aria-label="Seek"
          />
          <span className="w-10 text-right text-[11px] tabular-nums text-white/60">{fmt(duration)}</span>
        </div>
      </div>
      <Meter engine={engine} className="hidden md:flex" />
      <input
        type="range" min={0} max={1} step={0.01} value={vol} onChange={(e) => setVol(Number(e.target.value))}
        className="jd-range hidden h-1 w-20 cursor-pointer md:block" style={{ ["--pct" as string]: `${vol * 100}%` }} aria-label="Volume"
      />
    </div>
  )
}

export function MiniPlayer({ engine, title, visible }: { engine: AudioEngine; title: string; visible: boolean }) {
  const { playing, time, duration } = usePlayback(engine)
  const pct = duration ? (time / duration) * 100 : 0
  return (
    <div className={`fixed bottom-5 left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 transition-all duration-500 ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"}`}>
      <div className="relative flex items-center gap-3 border border-white/15 bg-black/70 px-3 py-2.5 backdrop-blur-xl">
        <button onClick={() => engine.toggle()} className="flex size-8 cursor-pointer items-center justify-center bg-white text-black" aria-label={playing ? "Pause" : "Play"}>
          <PlayIcon playing={playing} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-white/55">
            <span className={`inline-block size-1.5 ${playing ? "animate-pulse bg-[#ff2b3b]" : "bg-white/40"}`} />
            {playing ? "On air" : "Paused"} · {fmt(time)}
          </div>
          <div className="truncate font-garnett text-sm">{title}</div>
        </div>
        <Meter engine={engine} bars={14} className="h-5" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/10"><div className="h-full bg-white/70" style={{ width: `${pct}%` }} /></div>
      </div>
    </div>
  )
}
