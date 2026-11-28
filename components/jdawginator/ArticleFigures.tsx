"use client"

import { useState, type ReactNode } from "react"

const INK = "#ffffff"
const MUTED = "rgba(255,255,255,0.55)"
const FAINT = "rgba(255,255,255,0.38)"
const LINE = "rgba(255,255,255,0.32)"
const GRID = "rgba(255,255,255,0.07)"
const TINT = "rgba(255,255,255,0.035)"
const ACCENT = "#8fb4ff"

function Figure({
  label,
  title,
  aside,
  caption,
  children,
}: {
  label: string
  title: string
  aside?: ReactNode
  caption: ReactNode
  children: ReactNode
}) {
  return (
    <figure className="my-10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="text-[13px] font-medium text-white/90">{title}</div>
        {aside}
      </div>
      {children}
      <figcaption className="mt-3 text-[13px] leading-relaxed text-white/50">
        <span className="font-medium text-white/80">{label}.</span> {caption}
      </figcaption>
    </figure>
  )
}

function Tabs<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="tablist" className="flex border border-white/15 p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={`cursor-pointer px-2.5 py-1 text-[12px] transition-colors ${value === o.id ? "bg-white/12 text-white" : "text-white/50 hover:text-white/80"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Swatch({ dashed, color, label }: { dashed?: boolean; color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[12px] text-white/55">
      <svg width="16" height="6" aria-hidden="true">
        <line x1="0" y1="3" x2="16" y2="3" stroke={color} strokeWidth="1.75" strokeDasharray={dashed ? "3 2" : undefined} />
      </svg>
      {label}
    </span>
  )
}

function Node({ x, y, w, h, title, lines, accent }: { x: number; y: number; w: number; h: number; title: string; lines: string[]; accent?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="3" fill="#000" stroke={accent ? ACCENT : LINE} />
      <text x={x + 12} y={y + 21} fill={INK} fontSize="12.5" fontWeight="500">{title}</text>
      {lines.map((l, i) => (
        <text key={l} x={x + 12} y={y + 38 + i * 15} fill={accent && i === lines.length - 1 ? ACCENT : MUTED} fontSize="11">{l}</text>
      ))}
    </g>
  )
}

function Region({ y, h, title, note }: { y: number; h: number; title: string; note: string }) {
  return (
    <g>
      <rect x="16" y={y} width="720" height={h} rx="4" fill={TINT} />
      <text x="32" y={y + 22} fill="rgba(255,255,255,0.75)" fontSize="11.5" fontWeight="500">{title}</text>
      <text x="720" y={y + 22} textAnchor="end" fill={FAINT} fontSize="11">{note}</text>
    </g>
  )
}

export function ArchitectureDiagram() {
  return (
    <Figure
      label="Figure 1"
      title="System architecture"
      caption={
        <>
          The model never synthesizes audio samples. It hears 16 kHz cue snippets alongside structural section cards and emits a structured <code>CDJProgram</code>; the harness executes the signal processing deterministically and scores the rendered stereo mix.
        </>
      }
    >
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 776 404"
          className="h-auto w-full min-w-[600px]"
          role="img"
          aria-label="JDAWGINATOR architecture separating audio-native planning from the deterministic CDJ harness and verifiable QA loop"
        >
          <defs>
            <marker id="jd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.5)" />
            </marker>
            <marker id="jd-arrow-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={ACCENT} />
            </marker>
          </defs>

          <Region y={4} h={120} title="Perception & planning" note="probabilistic · the model's ears and taste" />
          <Node x={32} y={42} w={190} h={68} title="MIR & phrase analyzer" lines={["Beat grid · bar-1 phrase phase", "6-label TrackSection timeline"]} />
          <Node x={246} y={42} w={206} h={68} title="Audio-native prompt" lines={["16 kHz WAV cue clips (DmelChunk)", "Deck A exit + Deck B entry cards"]} />
          <Node x={476} y={42} w={244} h={68} title="Inkling-Small · Tinker LoRA" lines={["One-shot JSON mix plan at T = 0", "cues · stem timing · loops · exit FX"]} accent />
          <line x1="222" y1="76" x2="244" y2="76" stroke="rgba(255,255,255,0.5)" markerEnd="url(#jd-arrow)" />
          <line x1="452" y1="76" x2="474" y2="76" stroke="rgba(255,255,255,0.5)" markerEnd="url(#jd-arrow)" />

          <line x1="598" y1="110" x2="598" y2="148" stroke="rgba(255,255,255,0.5)" markerEnd="url(#jd-arrow)" />
          <text x="606" y="136" fill={MUTED} fontSize="10.5" fontFamily="ui-monospace, Menlo, monospace">CDJProgram</text>

          <Region y={150} h={124} title="Deterministic CDJ harness" note="no generated audio" />
          <Node x={32} y={188} w={156} h={70} title="1 · Sync & lock" lines={["WSOLA tempo stretch", "Sub-160 Hz kick phase lock"]} />
          <Node x={208} y={188} w={166} h={70} title="2 · Stem separation" lines={["Demucs htdemucs, 4 stems", "3-band drum split"]} />
          <Node x={394} y={188} w={160} h={70} title="3 · DSL compiler" lines={["6-stem cosine keyframes", "Loops 16 → 8 → 4 · StemFX"]} />
          <Node x={574} y={188} w={146} h={70} title="4 · Master render" lines={["44.1 kHz stereo WAV", "LUFS norm + limiter"]} />
          {[188, 374, 554].map((x) => (
            <line key={x} x1={x} y1="223" x2={x + 18} y2="223" stroke="rgba(255,255,255,0.5)" markerEnd="url(#jd-arrow)" />
          ))}

          <line x1="376" y1="274" x2="376" y2="302" stroke="rgba(255,255,255,0.5)" markerEnd="url(#jd-arrow)" />
          <text x="384" y="292" fill={MUTED} fontSize="10.5">rendered stereo mix</text>

          <Region y={304} h={96} title="Verifiable reward" note="GRPO training loop" />
          <Node x={32} y={338} w={334} h={50} title="Technical DSP verifier" lines={["Beat drift · phrase lock · LUFS jump · bass and vocal clash"]} />
          <Node x={386} y={338} w={334} h={50} title="Psychoacoustic mix critic" lines={["Plomp-Levelt roughness · cross-chroma clash · Bark masking"]} />

          <path d="M 720 363 L 758 363 Q 764 363 764 357 L 764 82 Q 764 76 758 76 L 722 76" fill="none" stroke={ACCENT} strokeWidth="1.25" strokeDasharray="4 3" markerEnd="url(#jd-arrow-accent)" />
          <text x="756" y="292" textAnchor="end" fill={ACCENT} fontSize="10.5">reward ∈ [0, 1] → LoRA update</text>
        </svg>
      </div>
    </Figure>
  )
}

const SAMPLE_PLAN_JSON = `{
  "next_track_id": "peggy_gou_nanana",
  "transition_style": "stem_strip_blend",
  "overlap_beats": 32,
  "cue_out_beat_prev": 481,
  "cue_in_beat_next": 33,
  "bass_swap_beat_frac": 0.50,
  "hat_morph_end_frac": 0.45,
  "harmony_strip_a_end_frac": 0.50,
  "harmony_entry_b_start_frac": 0.25,
  "vocal_entry_b_start_frac": 0.55,
  "loop_a_beats": 8,
  "loop_a_tighten": true,
  "hold_a_stem": "loop_all",
  "exit_fx": "hpf_echo_out"
}`

const X0 = 132
const X1 = 736
const bx = (b: number) => X0 + (b / 32) * (X1 - X0)
const ease = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t)))
const ramp = (from: number, to: number, a: number, b: number) => (beat: number) => from + (to - from) * ease((beat - a) / (b - a))
const seq = (...segs: [number, (b: number) => number][]) => (beat: number) => {
  let f = segs[0][1]
  for (const [start, g] of segs) if (beat >= start) f = g
  return f(beat)
}

type Curve = { fn: (b: number) => number; deck: "a" | "b" | "v" }
const ROWS: { label: string; sub: string; curves: Curve[] }[] = [
  { label: "Hi-hats", sub: "above 4 kHz", curves: [{ deck: "a", fn: ramp(1, 0, 0, 14.4) }, { deck: "b", fn: ramp(0, 1, 0, 14.4) }] },
  { label: "Claps & snares", sub: "180 Hz – 4 kHz", curves: [{ deck: "a", fn: ramp(1, 0, 8, 20) }, { deck: "b", fn: ramp(0, 1, 8, 20) }] },
  { label: "Kick & bass", sub: "below 180 Hz", curves: [{ deck: "a", fn: (b) => (b < 16 ? 1 : 0) }, { deck: "b", fn: (b) => (b < 16 ? 0 : 1) }] },
  {
    label: "Harmony & vocals",
    sub: "never overlapping",
    curves: [
      { deck: "a", fn: seq([0, ramp(1, 0.6, 16, 24)], [24, ramp(0.6, 0, 24, 32)]) },
      { deck: "b", fn: ramp(0, 1, 8, 18.6) },
      { deck: "v", fn: ramp(0, 0.85, 17.6, 25) },
    ],
  },
]
const ROW_TOP = 26
const ROW_H = 44
const ROW_GAP = 22

function curvePath(fn: (b: number) => number, top: number) {
  const pts: string[] = []
  for (let i = 0; i <= 256; i++) {
    const beat = (i / 256) * 32
    pts.push(`${bx(beat).toFixed(1)},${(top + ROW_H * (1 - fn(beat))).toFixed(1)}`)
  }
  return pts
}

export function StemAutomationDiagram() {
  const [tab, setTab] = useState<"curves" | "json">("curves")
  const h = ROW_TOP + ROWS.length * (ROW_H + ROW_GAP) + 14

  return (
    <Figure
      label="Figure 2"
      title="A compiled 32-beat CDJProgram"
      aside={<Tabs value={tab} onChange={setTab} options={[{ id: "curves", label: "Stem curves" }, { id: "json", label: "Model output" }]} />}
      caption={
        <>
          Instead of fading two full-spectrum tracks on top of each other, the harness compiles the model&apos;s JSON into cosine-eased per-stem keyframes: hats glide first, claps morph across bars 3–5, and the sub-180 Hz kick and bass swap on the beat-16 downbeat while Deck A loops and exits through a beat-synced high-pass echo.
        </>
      }
    >
      {tab === "curves" ? (
        <>
          <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
            <Swatch color={FAINT} label="Deck A, outgoing" />
            <Swatch color={INK} label="Deck B, incoming" />
            <Swatch color={INK} dashed label="Deck B vocals" />
          </div>
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 760 ${h + 18}`}
              className="h-auto w-full min-w-[600px]"
              role="img"
              aria-label="32-beat stem automation: hats and claps morph progressively, kick and bass swap on beat 16, and Deck A loops 8 to 4 beats before a high-pass echo-out"
            >
              <rect x={bx(24)} y={6} width={bx(32) - bx(24)} height={h - 6} fill={TINT} />
              <text x={bx(28)} y={18} textAnchor="middle" fill={MUTED} fontSize="10.5">loop 8 → 4 · HPF echo-out</text>

              {Array.from({ length: 33 }, (_, b) => b)
                .filter((b) => b % 4 === 0)
                .map((b) => (
                  <g key={b}>
                    <line x1={bx(b)} y1={ROW_TOP - 4} x2={bx(b)} y2={h} stroke={b % 8 === 0 ? "rgba(255,255,255,0.1)" : GRID} />
                    {b % 8 === 0 && (
                      <text x={bx(b)} y={h + 14} textAnchor="middle" fill={FAINT} fontSize="10.5">{b}</text>
                    )}
                  </g>
                ))}
              <text x={X0 - 12} y={h + 14} textAnchor="end" fill={FAINT} fontSize="10.5">beat</text>

              {ROWS.map((row, r) => {
                const top = ROW_TOP + r * (ROW_H + ROW_GAP)
                return (
                  <g key={row.label}>
                    <text x="16" y={top + 18} fill="rgba(255,255,255,0.85)" fontSize="12">{row.label}</text>
                    <text x="16" y={top + 33} fill={FAINT} fontSize="10.5">{row.sub}</text>
                    <line x1={X0} y1={top + ROW_H} x2={X1} y2={top + ROW_H} stroke="rgba(255,255,255,0.16)" />
                    {row.curves.map((c, i) => {
                      const pts = curvePath(c.fn, top)
                      return (
                        <g key={i}>
                          {c.deck === "b" && (
                            <polygon points={`${X0},${top + ROW_H} ${pts.join(" ")} ${X1},${top + ROW_H}`} fill="rgba(255,255,255,0.06)" />
                          )}
                          <polyline
                            points={pts.join(" ")}
                            fill="none"
                            stroke={c.deck === "a" ? FAINT : INK}
                            strokeWidth={c.deck === "a" ? 1.5 : 1.75}
                            strokeDasharray={c.deck === "v" ? "4 3" : undefined}
                            strokeLinejoin="round"
                          />
                        </g>
                      )
                    })}
                  </g>
                )
              })}

              <line x1={bx(16)} y1={ROW_TOP - 4} x2={bx(16)} y2={h} stroke={ACCENT} strokeDasharray="3 3" />
              <text x={bx(16) + 6} y={18} fill={ACCENT} fontSize="10.5">bass swap on the downbeat</text>
            </svg>
          </div>
        </>
      ) : (
        <pre className="overflow-x-auto bg-white/[0.04] p-4 text-[12.5px] leading-relaxed text-white/80 md:p-5">
          <code>{SAMPLE_PLAN_JSON}</code>
        </pre>
      )}
    </Figure>
  )
}

const TH = "whitespace-nowrap pb-2.5 pr-4 text-[12px] font-normal text-white/45 last:pr-0"
const TD = "py-2.5 pr-4 align-top last:pr-0"

type BenchmarkRow = { metric: string; target: string; jdawginator: string; appleAutoMix: string; spotify: string }

const EXTERNAL_BENCHMARK_ROWS: BenchmarkRow[] = [
  { metric: "Overall composite score (0–100)", target: "higher is better", jdawginator: "TBD", appleAutoMix: "TBD", spotify: "TBD" },
  { metric: "Technical QA pass rate", target: "0 defect flags", jdawginator: "TBD", appleAutoMix: "TBD", spotify: "TBD" },
  { metric: "Beat drift, sub-160 Hz kick", target: "≤ 45.0 ms", jdawginator: "TBD", appleAutoMix: "TBD", spotify: "TBD" },
  { metric: "Loudness continuity, LUFS jump", target: "≤ 3.5 dB", jdawginator: "TBD", appleAutoMix: "TBD", spotify: "TBD" },
  { metric: "Low-band bass clash, below 250 Hz", target: "≤ 1.6 dB", jdawginator: "TBD", appleAutoMix: "TBD", spotify: "TBD" },
  { metric: "Dual-drum transient ratio", target: "≤ 1.38×", jdawginator: "TBD", appleAutoMix: "TBD", spotify: "TBD" },
  { metric: "Vocal-on-vocal clash ratio", target: "≤ 0.25", jdawginator: "TBD", appleAutoMix: "TBD", spotify: "TBD" },
  { metric: "Phrase-grid alignment", target: "bar-1 aligned", jdawginator: "TBD", appleAutoMix: "TBD", spotify: "TBD" },
  { metric: "Plomp-Levelt roughness excess", target: "lower is better", jdawginator: "TBD", appleAutoMix: "TBD", spotify: "TBD" },
]

function Cell({ v, ours }: { v: string; ours?: boolean }) {
  if (v === "TBD") return <span className="text-white/25">—</span>
  return <span className={ours ? "font-medium text-white" : "text-white/65"}>{v}</span>
}

export function ExternalBenchmarkTable() {
  return (
    <Figure
      label="Table 2"
      title="JDAWGINATOR vs. Apple Music AutoMix vs. Spotify"
      aside={<span className="text-[12px] text-white/40">Scores pending final run</span>}
      caption={
        <>
          Every system is scored by the same single-mix DSP and psychoacoustic evaluator on final stereo output, with no internal-stem privilege given to JDAWGINATOR. Empty cells will be filled once the final benchmark sweep finishes.
        </>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] border-collapse text-left text-[14px] tabular-nums">
          <thead>
            <tr className="border-b border-white/20">
              <th className={TH}>Metric</th>
              <th className={TH}>QA gate</th>
              <th className={`${TH} text-right !text-white/90`}>JDAWGINATOR</th>
              <th className={`${TH} text-right`}>Apple AutoMix</th>
              <th className={`${TH} text-right`}>Spotify</th>
            </tr>
          </thead>
          <tbody>
            {EXTERNAL_BENCHMARK_ROWS.map((row, i) => (
              <tr key={row.metric} className="border-b border-white/[0.08]">
                <td className={`${TD} ${i === 0 ? "font-medium text-white" : "text-white/85"}`}>{row.metric}</td>
                <td className={`${TD} whitespace-nowrap text-white/45`}>{row.target}</td>
                <td className={`${TD} bg-white/[0.03] text-right`}><Cell v={row.jdawginator} ours /></td>
                <td className={`${TD} text-right`}><Cell v={row.appleAutoMix} /></td>
                <td className={`${TD} text-right`}><Cell v={row.spotify} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Figure>
  )
}

const DRIFT_GATE = 45
const HELD_OUT_PAIRS = [
  { pair: "Thinking About You → Nanana", bpm: "128 → 128", drift: 0, lufs: "0.43", score: "0.800", unit: "QA", notes: "Bar-1 cues (b481 → b33), 8-beat loop tighten + HPF echo-out" },
  { pair: "Thinking About You → World Hold On (FISHER Rework)", bpm: "128 → 126", drift: 11.6, lufs: "0.35", score: "0.780", unit: "QA", notes: "Phrase-aligned rework entry, clean sub-180 Hz bass swap" },
  { pair: "Nanana → Thinking About You", bpm: "128 → 128", drift: 11.6, lufs: "0.54", score: "0.942", unit: "reward", notes: "Zero vocal clash, smooth progressive 3-band drum morph" },
  { pair: "My Place → I Need You", bpm: "128 → 142", drift: 0, lufs: "0.64", score: "−10%", unit: "stretch", notes: "Failure: beat-locked by over-stretching B instead of a tempo-jump cut", fail: true },
]

export function HeldOutResultsTable() {
  return (
    <Figure
      label="Table 1"
      title="Held-out commercial pairs"
      aside={<span className="text-[12px] text-white/40">base-dj-v4 · T = 0 · 44.1 kHz</span>}
      caption={
        <>
          One-shot model outputs with zero manual cue adjustments. Bars show beat drift against the 45 ms gate. On the 128 → 142 BPM stress test, pure RL hit 0.0 ms drift by stretching Track B −10% rather than choosing a tempo-jump cut, an explicit failure mode motivating v5.
        </>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-[14px] tabular-nums">
          <thead>
            <tr className="border-b border-white/20">
              <th className={TH}>Transition</th>
              <th className={`${TH} text-right`}>BPM</th>
              <th className={TH}>Beat drift</th>
              <th className={`${TH} text-right`}>LUFS jump</th>
              <th className={`${TH} text-right`}>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {HELD_OUT_PAIRS.map((row) => (
              <tr key={row.pair} className="border-b border-white/[0.08]">
                <td className={TD}>
                  <div className="text-white/90">{row.pair}</div>
                  <div className={`mt-0.5 text-[12.5px] ${row.fail ? "text-[#ff8a8a]/80" : "text-white/45"}`}>{row.notes}</div>
                </td>
                <td className={`${TD} whitespace-nowrap text-right text-white/60`}>{row.bpm}</td>
                <td className={`${TD} whitespace-nowrap`}>
                  <div className="flex items-center gap-2.5">
                    <span className="w-14 text-right text-white/90">{row.drift.toFixed(1)} ms</span>
                    <span className="relative block h-1.5 w-14 bg-white/10" aria-hidden="true">
                      <span className="absolute inset-y-0 left-0 bg-white/80" style={{ width: `${Math.max(2, (row.drift / DRIFT_GATE) * 100)}%` }} />
                    </span>
                  </div>
                </td>
                <td className={`${TD} whitespace-nowrap text-right text-white/90`}>{row.lufs} dB</td>
                <td className={`${TD} whitespace-nowrap text-right`}>
                  <span className={row.fail ? "text-[#ff8a8a]" : "text-white"}>{row.score}</span>{" "}
                  <span className="text-white/40">{row.unit}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Figure>
  )
}
