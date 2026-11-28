"use client"

import { useState } from "react"

export function ArchitectureDiagram() {
  return (
    <figure className="my-8 border border-white/15 bg-[#070709]">
      <div className="flex items-center justify-between border-b border-white/15 px-4 py-2.5">
        <span className="text-[11px] uppercase tracking-[0.16em] text-white/60">
          Figure 1 · System Architecture
        </span>
        <span className="text-[11px] uppercase tracking-[0.12em] text-white/40">
          Planner (Probabilistic) / Decks (Deterministic)
        </span>
      </div>
      <div className="overflow-x-auto p-4 md:p-6">
        <svg
          viewBox="0 0 760 390"
          className="h-auto w-full min-w-[600px]"
          role="img"
          aria-label="JDAWGINATOR architecture separating audio-native planning from the deterministic CDJ harness and verifiable QA loop"
        >
          <defs>
            <marker id="jd-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="rgba(255,255,255,0.55)" />
            </marker>
            <marker id="jd-arrow-accent" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
            </marker>
          </defs>

          {/* Band 1: MIR + Multimodal Planner */}
          <rect x="16" y="16" width="728" height="106" fill="#0c0d11" stroke="rgba(255,255,255,0.16)" />
          <text x="28" y="36" fill="rgba(255,255,255,0.45)" fontSize="10" letterSpacing="1.6">
            LAYER 1 · PERCEPTION &amp; PLANNING (MODEL = EARS + TASTE)
          </text>

          <rect x="28" y="48" width="196" height="60" fill="#050507" stroke="rgba(255,255,255,0.28)" />
          <text x="40" y="68" fill="#ffffff" fontSize="12" fontWeight="600">MIR &amp; Phrase Analyzer</text>
          <text x="40" y="84" fill="rgba(255,255,255,0.62)" fontSize="10.5">Beat grid · bar-1 phrase phase</text>
          <text x="40" y="98" fill="rgba(255,255,255,0.62)" fontSize="10.5">6-label TrackSection timeline</text>

          <line x1="224" y1="78" x2="254" y2="78" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" markerEnd="url(#jd-arrow)" />

          <rect x="256" y="48" width="214" height="60" fill="#050507" stroke="rgba(255,255,255,0.28)" />
          <text x="268" y="68" fill="#ffffff" fontSize="12" fontWeight="600">Audio-Native Prompt</text>
          <text x="268" y="84" fill="rgba(255,255,255,0.62)" fontSize="10.5">16 kHz WAV cue clips (DmelChunk)</text>
          <text x="268" y="98" fill="rgba(255,255,255,0.62)" fontSize="10.5">Deck A exit + Deck B entry cards</text>

          <line x1="470" y1="78" x2="500" y2="78" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" markerEnd="url(#jd-arrow)" />

          <rect x="502" y="48" width="228" height="60" fill="#10151c" stroke="#60a5fa" strokeWidth="1.2" />
          <text x="514" y="68" fill="#ffffff" fontSize="12" fontWeight="600">Inkling-Small (Tinker LoRA)</text>
          <text x="514" y="84" fill="rgba(255,255,255,0.75)" fontSize="10.5">One-shot JSON mix plan (temp=0.0)</text>
          <text x="514" y="98" fill="#93c5fd" fontSize="10.5">cues · stem timing · loops · exit FX</text>

          {/* Arrow down from Planner to Harness */}
          <line x1="616" y1="108" x2="616" y2="146" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" markerEnd="url(#jd-arrow)" />
          <text x="626" y="133" fill="rgba(255,255,255,0.55)" fontSize="10">CDJProgram JSON</text>

          {/* Band 2: Deterministic CDJ Harness */}
          <rect x="16" y="148" width="728" height="114" fill="#0c0d11" stroke="rgba(255,255,255,0.16)" />
          <text x="28" y="168" fill="rgba(255,255,255,0.45)" fontSize="10" letterSpacing="1.6">
            LAYER 2 · DETERMINISTIC CDJ HARNESS (ZERO HALLUCINATED AUDIO)
          </text>

          <rect x="28" y="182" width="162" height="66" fill="#050507" stroke="rgba(255,255,255,0.28)" />
          <text x="40" y="202" fill="#ffffff" fontSize="12" fontWeight="600">1. Sync &amp; Lock</text>
          <text x="40" y="218" fill="rgba(255,255,255,0.62)" fontSize="10.5">WSOLA tempo stretch</text>
          <text x="40" y="232" fill="rgba(255,255,255,0.62)" fontSize="10.5">&lt;160 Hz kick phase lock</text>

          <line x1="190" y1="215" x2="212" y2="215" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" markerEnd="url(#jd-arrow)" />

          <rect x="214" y="182" width="174" height="66" fill="#050507" stroke="rgba(255,255,255,0.28)" />
          <text x="226" y="202" fill="#ffffff" fontSize="12" fontWeight="600">2. Stem Separation</text>
          <text x="226" y="218" fill="rgba(255,255,255,0.62)" fontSize="10.5">Demucs htdemucs (4-stem)</text>
          <text x="226" y="232" fill="rgba(255,255,255,0.62)" fontSize="10.5">3-band drum split (180/4k Hz)</text>

          <line x1="388" y1="215" x2="410" y2="215" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" markerEnd="url(#jd-arrow)" />

          <rect x="412" y="182" width="164" height="66" fill="#050507" stroke="rgba(255,255,255,0.28)" />
          <text x="424" y="202" fill="#ffffff" fontSize="12" fontWeight="600">3. CDJ DSL Compiler</text>
          <text x="424" y="218" fill="rgba(255,255,255,0.62)" fontSize="10.5">6-stem cosine keyframes</text>
          <text x="424" y="232" fill="rgba(255,255,255,0.62)" fontSize="10.5">Loops (16→8→4) + StemFX</text>

          <line x1="576" y1="215" x2="598" y2="215" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" markerEnd="url(#jd-arrow)" />

          <rect x="600" y="182" width="130" height="66" fill="#050507" stroke="rgba(255,255,255,0.45)" />
          <text x="612" y="202" fill="#ffffff" fontSize="12" fontWeight="600">4. Master Render</text>
          <text x="612" y="218" fill="rgba(255,255,255,0.62)" fontSize="10.5">44.1 kHz stereo WAV</text>
          <text x="612" y="232" fill="rgba(255,255,255,0.62)" fontSize="10.5">LUFS norm + limiter</text>

          {/* Arrow down from Harness to Verifier */}
          <line x1="665" y1="248" x2="665" y2="286" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" markerEnd="url(#jd-arrow)" />

          {/* Band 3: Verification & RL Loop */}
          <rect x="16" y="288" width="728" height="86" fill="#0c0d11" stroke="rgba(255,255,255,0.16)" />
          <text x="28" y="308" fill="rgba(255,255,255,0.45)" fontSize="10" letterSpacing="1.6">
            LAYER 3 · VERIFIABLE REWARD ENGINE (GRPO TRAINING LOOP)
          </text>

          <rect x="28" y="318" width="332" height="44" fill="#050507" stroke="rgba(255,255,255,0.28)" />
          <text x="40" y="336" fill="#ffffff" fontSize="11.5" fontWeight="600">Technical DSP Verifier</text>
          <text x="40" y="352" fill="rgba(255,255,255,0.62)" fontSize="10">beat drift · phrase lock · LUFS jump · &lt;250 Hz excess · vocal/drum clash</text>

          <rect x="376" y="318" width="354" height="44" fill="#050507" stroke="rgba(255,255,255,0.28)" />
          <text x="388" y="336" fill="#ffffff" fontSize="11.5" fontWeight="600">Psychoacoustic Mix Critic</text>
          <text x="388" y="352" fill="rgba(255,255,255,0.62)" fontSize="10">Plomp-Levelt roughness · 12×12 cross-chroma clash · Bark masking</text>

          {/* Feedback loop arrow back up to Inkling-Small */}
          <path
            d="M 194 318 L 194 274 L 540 274 L 540 110"
            fill="none"
            stroke="#34d399"
            strokeWidth="1.2"
            strokeDasharray="4 3"
            markerEnd="url(#jd-arrow-accent)"
          />
          <rect x="280" y="264" width="184" height="18" fill="#070709" />
          <text x="288" y="276" fill="#34d399" fontSize="10" letterSpacing="0.6">
            GRPO REWARD (0..1) → LORA UPDATE
          </text>
        </svg>
      </div>
      <figcaption className="border-t border-white/15 px-4 py-2.5 text-[12px] leading-relaxed text-white/55">
        The model never synthesizes audio samples. It hears 16 kHz cue snippets alongside structural section cards and emits a structured <code className="text-white/80">CDJProgram</code>; the harness executes the signal processing deterministically and scores the rendered stereo mix.
      </figcaption>
    </figure>
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

export function StemAutomationDiagram() {
  const [tab, setTab] = useState<"curves" | "json">("curves")

  return (
    <figure className="my-8 border border-white/15 bg-[#070709]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 px-4 py-2.5">
        <span className="text-[11px] uppercase tracking-[0.16em] text-white/60">
          Figure 2 · Compiled 32-Beat CDJProgram
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setTab("curves")}
            className={`cursor-pointer border px-2.5 py-0.5 text-[11px] uppercase tracking-[0.12em] transition-colors ${
              tab === "curves"
                ? "border-white bg-white text-black"
                : "border-white/20 text-white/65 hover:border-white/50"
            }`}
          >
            Stem Curves
          </button>
          <button
            type="button"
            onClick={() => setTab("json")}
            className={`cursor-pointer border px-2.5 py-0.5 text-[11px] uppercase tracking-[0.12em] transition-colors ${
              tab === "json"
                ? "border-white bg-white text-black"
                : "border-white/20 text-white/65 hover:border-white/50"
            }`}
          >
            Model JSON
          </button>
        </div>
      </div>

      {tab === "curves" ? (
        <div className="overflow-x-auto p-4 md:p-6">
          <svg
            viewBox="0 0 760 320"
            className="h-auto w-full min-w-[600px]"
            role="img"
            aria-label="32-beat CDJ DSL stem automation diagram showing progressive 3-band drum morph, downbeat kick and bass swap, 8-beat loop tightening, and HPF echo-out"
          >
            {/* Background grid: beats 0, 8, 16, 24, 32 */}
            {[
              { b: 0, x: 110 },
              { b: 8, x: 265 },
              { b: 16, x: 420 },
              { b: 24, x: 575 },
              { b: 32, x: 730 },
            ].map((g) => (
              <g key={g.b}>
                <line
                  x1={g.x}
                  y1={28}
                  x2={g.x}
                  y2={278}
                  stroke={g.b === 16 ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.12)"}
                  strokeDasharray={g.b === 16 ? "3 3" : undefined}
                />
                <text x={g.x} y={18} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10">
                  Beat {g.b}
                </text>
              </g>
            ))}

            {/* Highlight zones */}
            {/* Loop tighten 24 -> 32 */}
            <rect x="575" y="28" width="155" height="250" fill="rgba(251,191,36,0.06)" />
            <text x="652" y="42" textAnchor="middle" fill="#fbbf24" fontSize="9.5" letterSpacing="0.8">
              LOOP 8→4 + HPF ECHO-OUT
            </text>

            {/* Downbeat swap label */}
            <rect x="358" y="30" width="124" height="16" fill="#070709" />
            <text x="420" y="42" textAnchor="middle" fill="#ffffff" fontSize="9.5" letterSpacing="0.8">
              DOWNBEAT SWAP (0.50)
            </text>

            {/* Row 1: Hi-hats (>4 kHz) */}
            <text x="16" y="76" fill="rgba(255,255,255,0.8)" fontSize="11">Hats &gt;4 kHz</text>
            <text x="16" y="90" fill="rgba(255,255,255,0.4)" fontSize="9.5">glide 0→14b</text>
            <line x1="110" y1="96" x2="730" y2="96" stroke="rgba(255,255,255,0.08)" />
            {/* Deck A hats: 1.0 -> 0.0 by beat 14.4 (x=389) */}
            <path d="M 110 62 C 210 62, 290 94, 389 94 L 730 94" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" />
            {/* Deck B hats: 0.0 -> 1.0 by beat 14.4 */}
            <path d="M 110 94 C 210 94, 290 62, 389 62 L 730 62" fill="none" stroke="#60a5fa" strokeWidth="2" />

            {/* Row 2: Claps/Snares (180-4k Hz) */}
            <text x="16" y="128" fill="rgba(255,255,255,0.8)" fontSize="11">Claps 180–4k</text>
            <text x="16" y="142" fill="rgba(255,255,255,0.4)" fontSize="9.5">morph 8→20b</text>
            <line x1="110" y1="148" x2="730" y2="148" stroke="rgba(255,255,255,0.08)" />
            <path d="M 110 114 L 265 114 C 340 114, 410 146, 497 146 L 730 146" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" />
            <path d="M 110 146 L 265 146 C 340 146, 410 114, 497 114 L 730 114" fill="none" stroke="#60a5fa" strokeWidth="2" />

            {/* Row 3: Kick (<180 Hz) + Bass */}
            <text x="16" y="180" fill="rgba(255,255,255,0.8)" fontSize="11">Kick + Bass</text>
            <text x="16" y="194" fill="rgba(255,255,255,0.4)" fontSize="9.5">swap @ beat 16</text>
            <line x1="110" y1="200" x2="730" y2="200" stroke="rgba(255,255,255,0.08)" />
            <path d="M 110 166 L 408 166 C 414 166, 418 198, 424 198 L 730 198" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" />
            <path d="M 110 198 L 416 198 C 422 198, 426 166, 432 166 L 730 166" fill="none" stroke="#34d399" strokeWidth="2.2" />

            {/* Row 4: Harmony + Vocals */}
            <text x="16" y="232" fill="rgba(255,255,255,0.8)" fontSize="11">Harmony / Vox</text>
            <text x="16" y="246" fill="rgba(255,255,255,0.4)" fontSize="9.5">non-overlapping</text>
            <line x1="110" y1="252" x2="730" y2="252" stroke="rgba(255,255,255,0.08)" />
            {/* Deck A harmony/loop held then HPF-echoed out */}
            <path d="M 110 218 L 420 218 C 495 218, 535 234, 575 234 C 630 234, 675 250, 730 250" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" />
            {/* Deck B harmony enters beat 8, vocals beat 17.6 */}
            <path d="M 110 250 L 265 250 C 340 250, 390 218, 458 218 L 730 218" fill="none" stroke="#60a5fa" strokeWidth="2" />
            <path d="M 110 250 L 451 250 C 500 250, 535 224, 585 224 L 730 224" fill="none" stroke="#c084fc" strokeWidth="1.8" strokeDasharray="4 2" />

            {/* Legend */}
            <g transform="translate(110, 294)">
              <line x1="0" y1="6" x2="18" y2="6" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
              <text x="24" y="10" fill="rgba(255,255,255,0.65)" fontSize="10.5">Deck A (outgoing)</text>

              <line x1="145" y1="6" x2="163" y2="6" stroke="#60a5fa" strokeWidth="2" />
              <text x="169" y="10" fill="rgba(255,255,255,0.65)" fontSize="10.5">Deck B (hats/claps/harmony)</text>

              <line x1="342" y1="6" x2="360" y2="6" stroke="#34d399" strokeWidth="2.2" />
              <text x="366" y="10" fill="rgba(255,255,255,0.65)" fontSize="10.5">Deck B kick + bass</text>

              <line x1="485" y1="6" x2="503" y2="6" stroke="#c084fc" strokeWidth="1.8" strokeDasharray="4 2" />
              <text x="509" y="10" fill="rgba(255,255,255,0.65)" fontSize="10.5">Deck B vocals</text>
            </g>
          </svg>
        </div>
      ) : (
        <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-white/85 md:p-6">
          <code>{SAMPLE_PLAN_JSON}</code>
        </pre>
      )}
      <figcaption className="border-t border-white/15 px-4 py-2.5 text-[12px] leading-relaxed text-white/55">
        Instead of fading two full-spectrum tracks on top of each other, the harness compiles the model&apos;s JSON into cosine-eased per-stem keyframes: hats glide first, claps morph across bars 3–5, and the &lt;180 Hz kick + bass swap instantaneously on the beat-16 downbeat while Deck A loops and exits through a beat-synced high-pass echo.
      </figcaption>
    </figure>
  )
}

type BenchmarkRow = {
  metric: string
  target: string
  jdawginator: string
  appleAutoMix: string
  spotify: string
}

const EXTERNAL_BENCHMARK_ROWS: BenchmarkRow[] = [
  {
    metric: "Overall Composite Score (0–100)",
    target: "Higher is better",
    jdawginator: "TBD",
    appleAutoMix: "TBD",
    spotify: "TBD",
  },
  {
    metric: "Technical QA Pass Rate",
    target: "0 defect flags",
    jdawginator: "TBD",
    appleAutoMix: "TBD",
    spotify: "TBD",
  },
  {
    metric: "Beat Drift (<160 Hz kick)",
    target: "≤ 45.0 ms",
    jdawginator: "TBD",
    appleAutoMix: "TBD",
    spotify: "TBD",
  },
  {
    metric: "Loudness Continuity (LUFS Jump)",
    target: "≤ 3.5 dB",
    jdawginator: "TBD",
    appleAutoMix: "TBD",
    spotify: "TBD",
  },
  {
    metric: "Low-Band Bass Clash (<250 Hz)",
    target: "≤ 1.6 dB",
    jdawginator: "TBD",
    appleAutoMix: "TBD",
    spotify: "TBD",
  },
  {
    metric: "Dual-Drum Transient Ratio",
    target: "≤ 1.38×",
    jdawginator: "TBD",
    appleAutoMix: "TBD",
    spotify: "TBD",
  },
  {
    metric: "Vocal-on-Vocal Clash Ratio",
    target: "≤ 0.25",
    jdawginator: "TBD",
    appleAutoMix: "TBD",
    spotify: "TBD",
  },
  {
    metric: "Phrase-Grid Alignment",
    target: "Bar-1 aligned",
    jdawginator: "TBD",
    appleAutoMix: "TBD",
    spotify: "TBD",
  },
  {
    metric: "Plomp-Levelt Roughness Excess",
    target: "Lower is better",
    jdawginator: "TBD",
    appleAutoMix: "TBD",
    spotify: "TBD",
  },
]

export function ExternalBenchmarkTable() {
  return (
    <figure className="my-8 border border-white/15 bg-[#070709]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 px-4 py-2.5">
        <span className="text-[11px] uppercase tracking-[0.16em] text-white/60">
          Table 1 · JDAWGINATOR vs. Apple Music AutoMix vs. Spotify
        </span>
        <span className="border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-white/55">
          Scores pending final run
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] border-collapse text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-white/15 text-[11px] uppercase tracking-[0.12em] text-white/50">
              <th className="px-4 py-3 font-medium">Metric</th>
              <th className="px-4 py-3 font-medium">QA Gate</th>
              <th className="px-4 py-3 font-medium text-white">JDAWGINATOR</th>
              <th className="px-4 py-3 font-medium">Apple Music AutoMix</th>
              <th className="px-4 py-3 font-medium">Spotify</th>
            </tr>
          </thead>
          <tbody>
            {EXTERNAL_BENCHMARK_ROWS.map((row, idx) => (
              <tr
                key={row.metric}
                className={
                  idx === 0
                    ? "border-b border-white/20 bg-white/[0.04] font-medium text-white"
                    : "border-b border-white/10 text-white/75 last:border-b-0"
                }
              >
                <td className="px-4 py-2.5 text-white/90">{row.metric}</td>
                <td className="px-4 py-2.5 text-white/45">{row.target}</td>
                <td className="px-4 py-2.5 font-medium text-white/90">{row.jdawginator}</td>
                <td className="px-4 py-2.5 text-white/60">{row.appleAutoMix}</td>
                <td className="px-4 py-2.5 text-white/60">{row.spotify}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="border-t border-white/15 px-4 py-2.5 text-[12px] leading-relaxed text-white/55">
        Every system is scored by the exact same single-mix DSP &amp; psychoacoustic evaluator on final stereo output, with no internal-stem privilege given to JDAWGINATOR. Placeholder cells will be populated once the final benchmark sweep finishes.
      </figcaption>
    </figure>
  )
}

const HELD_OUT_PAIRS = [
  {
    pair: "Thinking About You → Nanana",
    bpm: "128 → 128",
    drift: "0.0 ms",
    lufs: "0.43 dB",
    score: "0.800 QA",
    notes: "Bar-1 cues (b481 → b33), 8-beat loop tighten + HPF echo-out",
  },
  {
    pair: "Thinking About You → World Hold On (FISHER Rework)",
    bpm: "128 → 126",
    drift: "11.6 ms",
    lufs: "0.35 dB",
    score: "0.780 QA",
    notes: "Phrase-aligned rework entry, clean <180 Hz bass swap",
  },
  {
    pair: "Nanana → Thinking About You",
    bpm: "128 → 128",
    drift: "11.6 ms",
    lufs: "0.54 dB",
    score: "0.942 reward",
    notes: "Zero vocal clash, smooth progressive 3-band drum morph",
  },
  {
    pair: "My Place → I Need You (Stress Test)",
    bpm: "128 → 142",
    drift: "0.0 ms",
    lufs: "0.64 dB",
    score: "Stretch −10%",
    notes: "Failure mode: beat-locked by over-stretching B instead of tempo-jump cut",
  },
]

export function HeldOutResultsTable() {
  return (
    <figure className="my-8 border border-white/15 bg-[#070709]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 px-4 py-2.5">
        <span className="text-[11px] uppercase tracking-[0.16em] text-white/60">
          Table 2 · Held-Out Commercial Pairs (base-dj-v4, temp=0.0, 44.1 kHz)
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-white/15 text-[11px] uppercase tracking-[0.12em] text-white/50">
              <th className="px-4 py-3 font-medium">Transition Pair</th>
              <th className="px-4 py-3 font-medium">BPM</th>
              <th className="px-4 py-3 font-medium">Beat Drift</th>
              <th className="px-4 py-3 font-medium">LUFS Jump</th>
              <th className="px-4 py-3 font-medium">Outcome</th>
            </tr>
          </thead>
          <tbody>
            {HELD_OUT_PAIRS.map((row) => (
              <tr key={row.pair} className="border-b border-white/10 text-white/75 last:border-b-0">
                <td className="px-4 py-2.5">
                  <div className="text-white/90">{row.pair}</div>
                  <div className="mt-0.5 text-[12px] text-white/45">{row.notes}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-white/65">{row.bpm}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-white/90">{row.drift}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-white/90">{row.lufs}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-white/80">{row.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="border-t border-white/15 px-4 py-2.5 text-[12px] leading-relaxed text-white/55">
        One-shot model outputs with zero manual cue adjustments. On the 128 → 142 BPM stress test, pure RL hit 0.0 ms drift by stretching Track B −10% rather than choosing a tempo-jump cut—an explicit failure mode motivating v5.
      </figcaption>
    </figure>
  )
}
