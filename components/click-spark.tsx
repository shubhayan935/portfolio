"use client"

import React, { useCallback, useEffect, useRef } from 'react'

interface Spark {
  id: number
  x: number
  y: number
  angle: number
  scale: number
  opacity: number
}

interface ClickSparkProps {
  children: React.ReactNode
  sparkColor?: string
  sparkSize?: number
  sparkRadius?: number
  sparkCount?: number
  duration?: number
  easing?: string
  extraScale?: number
}

export function ClickSpark({
  children,
  sparkColor = '#ffffff',
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
  easing = 'ease-out',
  extraScale = 1,
}: ClickSparkProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sparksRef = useRef<Spark[]>([])
  const sparkIdRef = useRef(0)

  const createSpark = useCallback(
    (x: number, y: number) => {
      const sparks: Spark[] = []

      for (let i = 0; i < sparkCount; i++) {
        const angle = (360 / sparkCount) * i
        sparks.push({
          id: sparkIdRef.current++,
          x,
          y,
          angle,
          scale: 1,
          opacity: 1,
        })
      }

      sparksRef.current = [...sparksRef.current, ...sparks]

      // Create spark elements
      sparks.forEach((spark) => {
        const sparkElement = document.createElement('div')
        sparkElement.className = 'spark-line'
        sparkElement.style.cssText = `
          position: fixed;
          top: ${spark.y}px;
          left: ${spark.x}px;
          width: ${sparkSize}px;
          height: 2px;
          background: ${sparkColor};
          transform-origin: left center;
          transform: rotate(${spark.angle}deg);
          pointer-events: none;
          z-index: 9999;
        `

        document.body.appendChild(sparkElement)

        // Animate the spark
        const animation = sparkElement.animate([
          {
            transform: `rotate(${spark.angle}deg) scaleX(1)`,
            opacity: 1,
          },
          {
            transform: `rotate(${spark.angle}deg) scaleX(${extraScale}) translateX(${sparkRadius}px)`,
            opacity: 0,
          },
        ], {
          duration,
          easing,
          fill: 'forwards',
        })

        animation.onfinish = () => {
          sparkElement.remove()
          sparksRef.current = sparksRef.current.filter(s => s.id !== spark.id)
        }
      })
    },
    [sparkColor, sparkSize, sparkRadius, sparkCount, duration, easing, extraScale]
  )

  const handleClick = useCallback(
    (event: MouseEvent) => {
      const x = event.clientX
      const y = event.clientY
      createSpark(x, y)
    },
    [createSpark]
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('click', handleClick)

    return () => {
      container.removeEventListener('click', handleClick)
      // Clean up any remaining sparks
      document.querySelectorAll('.spark-line').forEach(el => el.remove())
    }
  }, [handleClick])

  return (
    <div ref={containerRef} className="relative">
      {children}
    </div>
  )
}
