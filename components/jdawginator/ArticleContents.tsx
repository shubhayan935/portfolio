"use client"

import { useEffect, useRef, useState } from "react"

export default function ArticleContents({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(-1)
  const [mark, setMark] = useState({ top: 0, height: 0 })
  const items = useRef<(HTMLLIElement | null)[]>([])

  useEffect(() => {
    const update = () => {
      const line = window.innerHeight * 0.35
      let idx = -1
      sections.forEach((s, i) => {
        const el = document.getElementById(s.id)
        if (el && el.getBoundingClientRect().top <= line) idx = i
      })
      if (idx >= 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) idx = sections.length - 1
      setActive(idx)
    }
    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [sections])

  useEffect(() => {
    const li = items.current[active]
    if (li) setMark({ top: li.offsetTop, height: li.offsetHeight })
  }, [active])

  return (
    <nav aria-label="Article sections" className="hidden border-t border-white/15 pt-4 md:block">
      <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">Contents</div>
      <ul className="relative mt-2.5 space-y-1.5 border-l border-white/15 pl-3 text-[12.5px]">
        <span
          aria-hidden="true"
          className={`absolute -left-px w-px bg-white transition-all duration-300 ease-out ${active < 0 ? "opacity-0" : "opacity-100"}`}
          style={{ top: mark.top, height: mark.height }}
        />
        {sections.map((s, i) => (
          <li key={s.id} ref={(el) => { items.current[i] = el }}>
            <a
              href={`#${s.id}`}
              aria-current={i === active ? "location" : undefined}
              className={`block transition-colors duration-300 hover:text-white ${i === active ? "text-white" : "text-white/45"}`}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
