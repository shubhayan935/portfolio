"use client"

import { useEffect, useRef } from "react"
import type { AudioEngine } from "./audio"
import { createClub, type Club } from "./club/club"

export default function ClubCanvas({ engine, onReady }: { engine: AudioEngine; onReady: (club: Club) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const club = createClub(canvas, engine, { reducedMotion })
    onReady(club)
    const io = new IntersectionObserver(([e]) => club.setActive(e.isIntersecting), { threshold: 0 })
    io.observe(canvas)
    return () => {
      io.disconnect()
      club.dispose()
    }
  }, [engine, onReady])
  return <canvas ref={ref} className="absolute inset-0 h-full w-full cursor-crosshair" aria-label="Interactive voxel club scene reacting to the DJ set" />
}
