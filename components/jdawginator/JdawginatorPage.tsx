"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { AudioEngine } from "./audio"
import { MiniPlayer, Player } from "./Player"
import type { Club, ShotName } from "./club/club"
import Article from "./Article"

const ClubCanvas = dynamic(() => import("./ClubCanvas"), { ssr: false })

export const SET = {
  src: "/jdawginator/set.mp3",
  title: "JDAWGINATOR — Live",
  subtitle: "Live DJ set",
}

const SHOTS: { name: ShotName; label: string }[] = [
  { name: "floor", label: "Floor" },
  { name: "booth", label: "Booth" },
  { name: "crowd", label: "Crowd" },
  { name: "wide", label: "Wide" },
  { name: "overhead", label: "Overhead" },
]

export default function JdawginatorPage() {
  const [engine, setEngine] = useState<AudioEngine | null>(null)
  useEffect(() => {
    const e = new AudioEngine(SET.src)
    if (process.env.NODE_ENV !== "production") (window as unknown as { __engine: AudioEngine }).__engine = e
    setEngine(e)
    return () => e.dispose()
  }, [])
  const club = useRef<Club | null>(null)
  const [shot, setShot] = useState<{ shot: ShotName; auto: boolean }>({ shot: "floor", auto: true })
  const [headerVisible, setHeaderVisible] = useState(true)
  const [playing, setPlaying] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  const onReady = useCallback((c: Club) => {
    club.current = c
    if (process.env.NODE_ENV !== "production") (window as unknown as { __club: Club }).__club = c
  }, [])

  useEffect(() => {
    if (!engine) return
    const id = setInterval(() => club.current && setShot(club.current.getShot()), 500)
    const on = () => setPlaying(!engine.el.paused)
    engine.el.addEventListener("play", on)
    engine.el.addEventListener("pause", on)
    return () => { clearInterval(id); engine.el.removeEventListener("play", on); engine.el.removeEventListener("pause", on); engine.pause() }
  }, [engine])

  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setHeaderVisible(e.intersectionRatio > 0.15), { threshold: [0, 0.15, 0.5] })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-4 md:px-8">
        <Link href="/" className="font-garnett text-lg text-white/90 transition-colors hover:text-white">Shubhayan Srivastava</Link>
        <Link href="/#writing" className="text-xs uppercase tracking-[0.16em] text-white/60 transition-colors hover:text-white">Writing</Link>
      </nav>

      <header ref={headerRef} className="relative h-[100svh] min-h-[620px] w-full overflow-hidden bg-[#030205]">
        {engine && <ClubCanvas engine={engine} onReady={onReady} />}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black via-black/50 to-transparent" />

        {!playing && engine && (
          <button
            onClick={() => engine.play()}
            className="group absolute left-1/2 top-[42%] flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center gap-3 border border-white/25 bg-black/45 px-5 py-3 backdrop-blur-md transition-colors hover:border-white/60"
          >
            <span className="flex size-9 items-center justify-center bg-white text-black transition-transform group-hover:scale-105">
              <svg viewBox="0 0 24 24" className="size-4 translate-x-[1px]" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" /></svg>
            </span>
            <span className="text-left">
              <span className="block text-[11px] uppercase tracking-[0.16em] text-white/60">Doors open</span>
              <span className="block font-garnett text-lg">Tune in to the set</span>
            </span>
          </button>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-6 md:px-8 md:pb-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/60">Writing · Live set</div>
              <h1 className="mt-2 font-garnett text-5xl font-medium leading-[0.95] md:text-7xl">JDAWGINATOR</h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">A live recording, played back like a radio broadcast inside a voxel club that dances to it.</p>
            </div>
            <div className="w-full max-w-[500px] lg:w-[500px]">
              {engine && <Player engine={engine} title={SET.title} subtitle={SET.subtitle} />}
              <div className="pointer-events-auto mt-2 flex flex-wrap items-center gap-1">
                <button
                  onClick={() => { club.current?.setAuto(); setShot((s) => ({ ...s, auto: true })) }}
                  className={`cursor-pointer border px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] transition-colors ${shot.auto ? "border-white bg-white text-black" : "border-white/20 text-white/70 hover:border-white/50"}`}
                >
                  Auto cam
                </button>
                {SHOTS.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => { club.current?.setShot(s.name); setShot({ shot: s.name, auto: false }) }}
                    className={`cursor-pointer border px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] transition-colors ${!shot.auto && shot.shot === s.name ? "border-white bg-white text-black" : "border-white/20 text-white/70 hover:border-white/50"}`}
                  >
                    {s.label}
                  </button>
                ))}
                <span className="ml-auto hidden text-[11px] text-white/45 md:inline">Click the room to fire CO₂</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <Article />

      {engine && <MiniPlayer engine={engine} title={SET.title} visible={!headerVisible} />}
    </div>
  )
}
