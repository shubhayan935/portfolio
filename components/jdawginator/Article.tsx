import {
  ArchitectureDiagram,
  ExternalBenchmarkTable,
  HeldOutResultsTable,
  StemAutomationDiagram,
} from "./ArticleFigures"

export const ARTICLE = {
  date: "27 Nov 2026",
  readTime: "11 min read",
}

const SECTIONS = [
  { id: "architecture", label: "Architecture" },
  { id: "harness", label: "The CDJ Harness" },
  { id: "verification", label: "Verification" },
  { id: "post-training", label: "Audio-Native GRPO" },
  { id: "benchmarks", label: "Benchmarks" },
  { id: "failures", label: "What Still Breaks" },
  { id: "learnings", label: "Learnings" },
  { id: "header", label: "The Voxel Club" },
]

export default function Article() {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-40 pt-14 md:px-8">
      <div className="grid gap-10 md:grid-cols-[180px_1fr]">
        <aside className="space-y-6 border-t border-white/15 pt-4 text-[13px] text-white/55 md:sticky md:top-24 md:self-start">
          <div className="space-y-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">Published</div>
              <div className="mt-1 text-white/80">{ARTICLE.date}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">Author</div>
              <div className="mt-1 text-white/80">Shubhayan Srivastava</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">Reading time</div>
              <div className="mt-1 text-white/80">{ARTICLE.readTime}</div>
            </div>
          </div>

          <nav aria-label="Article sections" className="hidden border-t border-white/15 pt-4 md:block">
            <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">Contents</div>
            <ul className="mt-2.5 space-y-1.5 text-[12.5px]">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="block text-white/55 transition-colors hover:text-white"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <article className="jd-prose min-w-0 max-w-[700px] border-t border-white/15 pt-4">
          <p className="jd-lede">
            In AI right now, raw model intelligence is rarely the bottleneck anymore—the remaining
            gap in almost every domain is plumbing, harnesses, and verifiable feedback loops. I
            recently got into DJing, and it turned out to be the cleanest testbed I could find for
            that idea.
          </p>

          <p>
            Over the last two years, frontier models went from acing math competitions to shipping
            production software and running end-to-end research loops. The pattern behind every
            domain that actually unlocked is the same: you stop asking the model to brute-force
            everything from scratch, wrap it in a deterministic harness that encodes real domain
            know-how, and give it a verifier cheap enough to hill-climb against with RL.
          </p>

          <p>
            Learning to DJ made that split click immediately. A great club transition isn&apos;t
            generating audio from noise, and it isn&apos;t dragging a single volume fader across two
            tracks. It&apos;s two completely different skills stacked together: mechanical execution
            (beatmatching, phrase grids, EQ crossovers, beat-exact loops) and musical taste
            (hearing where a vocal clears, when to hold a hook, and where the drop should land).
            Hit play above and the set keeps running while you read—JDAWGINATOR is my attempt to
            build that exact split: an audio-native model that listens to candidate cue moments,
            plans a full transition one-shot at <code>temp=0.0</code>, and hands that plan to a
            deterministic DSP harness that executes it like a pair of{" "}
            <a
              href="https://www.pioneerdj.com/en/product/player/cdj-3000/black/overview/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Pioneer CDJ-3000s
            </a>
            .
          </p>

          <p>
            Most attempts at automated DJing fail at one of two extremes. End-to-end audio
            generators blur lyrics, smear transients, and destroy the fidelity of the original
            masters. Consumer auto-mixers swing the other way, leaning on rigid fade curves that
            either trainwreck phrasing or stack two competing drum kits until the low end collapses
            into mud. No human nudges the jog wheel here, and no generative audio model ever
            hallucinates a single sample.
          </p>

          <p>
            The rest of this post walks through how I split the problem in two, how I built the
            deterministic CDJ harness and psychoacoustic verifier from first principles, how
            audio-native GRPO trained the planner to use real DJ techniques on its own, and how
            JDAWGINATOR scores against Apple Music AutoMix and Spotify.
          </p>

          <h2 id="architecture">Architecture: Give the Model Only What Can&apos;t Be Deterministic</h2>

          <p>
            The single most important design decision in JDAWGINATOR was deciding what the model
            should <em>not</em> do. Time-stretching, beat phase-locking, stem separation, EQ
            crossovers, beat-exact looping, and loudness normalization all have exact mathematical
            implementations. Asking a neural network to approximate them inside raw waveforms is
            paying probabilistic error for work that deterministic DSP already solves cleanly.
          </p>

          <p>
            What genuinely requires a model is <strong>ears and taste</strong>: listening to two
            records, hearing whether a vocal hook clashes with an incoming synth line, picking the
            right bar-1 exit and entry points, and choosing how aggressively to strip stems or ride
            a loop into the drop. So I split the stack cleanly around three typed primitives:
          </p>

          <ul>
            <li>
              <strong><code>AudioTrackCard</code> &amp; <code>TrackSection</code></strong> — the
              deterministic MIR representation of a song: tempo, beat grid, Camelot key, timbre
              embeddings, vocal activity mask, and a full-song structural timeline
              (<code>intro</code>, <code>groove</code>, <code>buildup</code>, <code>drop</code>,{" "}
              <code>breakdown</code>, <code>outro</code>).
            </li>
            <li>
              <strong><code>CDJProgram</code></strong> — the contract between the planner and the
              decks: independent Deck A and Deck B 6-stem beat-indexed keyframe curves, beat-exact
              loops, and beat-windowed FX.
            </li>
            <li>
              <strong><code>TransitionQAReport</code></strong> — the deterministic technical and
              psychoacoustic audit of the rendered stereo mix, returning hard defect flags and a
              bounded <code>[0, 1]</code> reward for RL.
            </li>
          </ul>

          <ArchitectureDiagram />

          <h2 id="harness">Deep Dive: Building the Deterministic CDJ Harness</h2>

          <p>
            Every major jump in mix quality came from fixing a concrete failure I heard in the
            rendered audio and encoding the fix directly into the harness. Four pieces do the heavy
            lifting.
          </p>

          <h3>1. Novelty-Based Bar-1 Phrase-Phase Detection</h3>

          <p>
            My earliest prototypes sliced tracks on naive 64-beat multiples starting at beat 0. On
            real electronic records that almost never works: intros have pickup bars, DJ edits start
            mid-phrase, and radio masters have silent lead-ins. Cueing on beat 64 when the true
            8-bar phrase starts on beat 33 guarantees that Deck B&apos;s drop lands halfway through
            Deck A&apos;s verse.
          </p>

          <p>
            Instead of trusting beat 0, the analyzer computes per-beat broadband RMS and sub-200 Hz
            low-band energy, then runs a 16-beat bidirectional novelty filter across the entire
            track (<code>d_rms + 1.5 * d_low</code>, weighting bass drops 1.5× heavier than
            mid-range shifts). It evaluates every candidate phase offset <code>p ∈ [0, 31]</code>{" "}
            by summing novelty on the 32-beat lattice <code>p, p+32, p+64, …</code> and locks the
            song&apos;s phrase grid to the highest-scoring bar-1 phase. From there it segments the
            track into 32- or 64-beat sections—splitting 64-beat windows in half whenever midpoint
            novelty clears the 82nd percentile, and merging trailing tails shorter than 16 beats so
            the model never cues into a dead ending.
          </p>

          <h3>2. WSOLA Stretching and Sub-160 Hz Kick Phase Lock</h3>

          <p>
            Matching two tracks&apos; nominal BPMs is necessary, not sufficient. Even a 0.05% tempo
            estimate error or a 25 ms transient offset between beat trackers produces audible
            flamming—the unmistakable double-kick gallop of a bad beatmatch.
          </p>

          <p>
            During rendering, Deck B is time-stretched to Deck A&apos;s tempo via WSOLA, loudness-matched
            in LUFS, and then phase-locked directly in the kick band. I apply a 4th-order
            Butterworth low-pass filter at <code>160 Hz</code> to both decks&apos; overlap windows
            and cross-correlate their onset envelopes over <code>±0.5</code> beats to snap Deck B&apos;s
            sample offset directly onto Deck A&apos;s kick transient.
          </p>

          <p>
            One subtle bug here showed how tightly coupled the harness primitives are. Once I added
            beat-exact Deck A loops with <code>16→8→4</code> tightening rolls at the end of a
            transition, the phase-lock step started locking Deck B against the accelerated loop roll
            instead of the underlying 4/4 groove—pulling the entire transition off-beat. The fix was
            keeping an un-tightened copy of the looped Deck A overlap exclusively for kick-window
            correlation, so Deck B locks to the exact looped kicks that actually play without
            roll-induced bias.
          </p>

          <h3>3. Four-Stem Separation and Progressive 3-Band Drum Morphing</h3>

          <p>
            My first renderer used standard 3-band DJ EQ crossfades on full stereo tracks. Even when
            perfectly beat-locked, two house records playing full drum stems simultaneously sound
            congested: claps double up, snare tails smear, and competing kicks fight for headroom.
          </p>

          <p>
            I solved this by running Demucs (<code>htdemucs</code>) on the overlap window to split
            each deck into <code>drums</code>, <code>bass</code>, <code>vocals</code>, and{" "}
            <code>other</code>, and then splitting the drum stem itself into three frequency bands:{" "}
            <code>drums_low (&lt;180 Hz)</code> for kick punch,{" "}
            <code>drums_mid (180–4000 Hz)</code> for claps and snares, and{" "}
            <code>drums_high (&gt;4000 Hz)</code> for hi-hats and shakers. A transition no longer
            fades drums linearly—it morphs them top-down the way a club DJ works a mixer: Deck B&apos;s
            hi-hats glide in first, claps crossfade across the middle bars, and the sub-180 Hz kick
            and bass swap cleanly on a single quantized downbeat.
          </p>

          <h3>4. The Composable Beat-Indexed CDJ DSL</h3>

          <p>
            A monotonic crossfader caps how musical an automated DJ can ever sound. To let the
            model execute real club phrasing—holding an outgoing vocal over an incoming groove,
            looping an 8-bar hook, tightening it into a build, and washing it out with a beat-synced
            delay—I built a composable beat-indexed DSL (<code>CDJProgram</code>).
          </p>

          <p>
            Every transition compiles to independent Deck A and Deck B automation across all six
            stems (<code>drums_low</code>, <code>drums_mid</code>, <code>drums_high</code>,{" "}
            <code>bass</code>, <code>vocals</code>, <code>other</code>). Keyframes are evaluated
            with cosine smoothstep interpolation for equal-power feel and zero zipper noise. Decks
            also accept beat-exact <code>DeckLoop</code> blocks (8 ms splice crossfades, optional{" "}
            <code>16→8→4</code> tightening) and beat-windowed <code>StemFX</code> (
            <code>hpf_sweep</code>, <code>lpf_sweep</code>, <code>echo_out</code>,{" "}
            <code>reverb_wash</code>, <code>vinyl_brake</code>) targeted at individual stems rather
            than only the master bus.
          </p>

          <StemAutomationDiagram />

          <h2 id="verification">Verification: Autonomy Is Bounded by What You Can Score Cheaply</h2>

          <p>
            RL only works if the verifier is harder to fool than the policy. Early in training, a
            policy will happily discover every loophole in a loose reward—cutting out after 4 beats
            to avoid vocal overlap, locking kicks at the midpoint while drifting at the edges, or
            slamming loudness down during the overlap to avoid clipping.
          </p>

          <p>
            To close those loopholes, every rendered transition passes through a two-stage
            deterministic verifier before a single gradient step is taken:
          </p>

          <ul>
            <li>
              <strong>Beat Drift Across Sliding Windows:</strong> I measure <code>&lt;160 Hz</code>{" "}
              kick lag both globally and across sliding 2.5-second windows (taking{" "}
              <code>max(global, p75_window)</code>) so linear tempo drift can never hide behind a
              clean midpoint lock. Hard gate: <code>≤ 45.0 ms</code>.
            </li>
            <li>
              <strong>Loudness &amp; Step Continuity:</strong> Integrated LUFS across pre, overlap,
              and post segments must stay within <code>3.5 dB</code>, and no 0.5-second RMS step
              inside the overlap can jump more than <code>4.5 dB</code>. Digital peaks are gated at{" "}
              <code>≤ -0.15 dBFS</code> with fewer than 8 clipped samples.
            </li>
            <li>
              <strong>Frequency &amp; Vocal Collision:</strong> Low-band (<code>&lt;250 Hz</code>)
              overlap energy cannot exceed the louder solo track by more than <code>1.6 dB</code>{" "}
              (catching double-bass mud); onset flux ratio is capped at <code>1.38×</code> (catching
              dual-drum clash); and simultaneous vocal activity at 0.5 s resolution is gated at{" "}
              <code>≤ 0.25</code>.
            </li>
            <li>
              <strong>Psychoacoustic Mix Critic:</strong> On top of the technical gates, every
              overlap is scored with vectorized Sethares / Plomp-Levelt sensory roughness over the
              top spectral peaks (<code>60–6000 Hz</code>), a 12×12 semitone cross-chroma dissonance
              matrix (penalizing minor-second and tritone clashes), peak dual-drum overlap duration,
              and Bark-band masking.
            </li>
          </ul>

          <p>
            Every defect applies an explicit penalty to a bounded <code>[0, 1]</code> verifiable
            reward—<code>-0.35</code> for off-beat drift, <code>-0.25</code> for vocal clash or
            clipping, <code>-0.20</code> for bass clash, LUFS jump, sudden cut, harmonic clash, or
            dual-drum overlap. The policy can&apos;t average its way past a bad mix; a single
            trainwreck tanks the rollout.
          </p>

          <h2 id="post-training">Post-Training: From Blind Crossfades to Audio-Native GRPO</h2>

          <p>
            I built the training pipeline in stages to separate track-selection taste from
            audio-grounded execution, keeping strict leakage hygiene throughout:
          </p>

          <ul>
            <li>
              <strong>Transition Corpora:</strong> 4,611 train / 560 val / 744 test DJ-disjoint
              house transitions mined from MixesDB, plus 121 full Archive.org house sets (1,532
              transitions) for real-world phrasing and track-order priors.
            </li>
            <li>
              <strong>Stage 1 Audio Pool:</strong> 83 verified electronic/house tracks from
              MTG-Jamendo (69 train / 14 val, 118–135 BPM, zero track overlap between splits) used
              for live audio rendering during RL.
            </li>
          </ul>

          <p>
            Text-only track cards got surprisingly far on BPM and Camelot compatibility, but a model
            that can&apos;t actually hear the audio is guessing when it places cue points and vocal
            entries. In Phase 5, I switched to audio-native multimodal GRPO on{" "}
            <code>thinkingmachines/Inkling-Small</code> via Tinker LoRA. For each candidate Deck A
            exit and Deck B entry section, the harness slices a compact 16 kHz mono WAV snippet and
            passes it directly into the prompt as a <code>DmelChunk</code> audio span, preserved
            through every <code>importance_sampling</code> training datum alongside full-song
            structural section timelines.
          </p>

          <p>
            Over 16 audio-native GRPO steps on <code>base-dj-v4</code>, JSON schema validity held at{" "}
            <strong>100%</strong>, training mean reward rose from <strong>0.665 → 0.779</strong>,
            and DSP QA reward climbed from <strong>0.547 → 0.775</strong>. More interesting than the
            scalar curve was the behavior that emerged without being hard-coded: the policy began
            selecting real bar-1 phrase boundaries (<code>b33</code>, <code>b481</code>), engaging
            8-beat Deck A loops with <code>loop_a_tighten=true</code>, holding{" "}
            <code>loop_all</code> until Deck B&apos;s downbeat, and exiting cleanly through{" "}
            <code>hpf_echo_out</code>.
          </p>

          <HeldOutResultsTable />

          <h2 id="benchmarks">Benchmarks: JDAWGINATOR vs. Apple Music AutoMix vs. Spotify</h2>

          <p>
            Internal reward curves prove a policy fits its own training loop; they don&apos;t prove
            it beats what listeners already have on their phones. To measure where JDAWGINATOR
            actually stands, I score <strong>JDAWGINATOR</strong>,{" "}
            <strong>Apple Music AutoMix</strong>, and <strong>Spotify</strong> through the exact
            same single-mix DSP and psychoacoustic evaluator on final stereo output—no internal-stem
            privilege for my own renderer.
          </p>

          <ExternalBenchmarkTable />

          <h2 id="failures">What Still Breaks (and What I&apos;m Building for v5)</h2>

          <p>
            The quickest way to tell whether an ML write-up is real is whether it shows you where
            the policy still falls over. Three concrete failure modes stand out right now:
          </p>

          <ol>
            <li>
              <strong>Pure GRPO mode collapse:</strong> Left to optimize a single scalar reward,{" "}
              <code>base-dj-v4</code> discovered that <code>loop_a_beats=8</code> +{" "}
              <code>hpf_echo_out</code> scores reliably across almost every house pair and started
              using it everywhere. A great DJ varies their palette—quick drop swaps, long 64-beat
              hypnotic blends, acapella bridges, filter sweeps—depending on the room and the
              records. Fixing this requires balanced, diverse DSL SFT prior to audio-conditional
              GRPO (<code>v5</code>) and widening the model&apos;s listening clips from{" "}
              <code>3s</code> to <code>8s</code> (a full 4-bar phrase) so it can actually hear
              phrasing and vocal cadence before deciding.
            </li>
            <li>
              <strong>Large BPM gaps:</strong> On my <code>128 → 142 BPM</code> stress test (
              <em>My Place → I Need You</em>), pure RL achieved <code>0.0 ms</code> beat drift by
              time-stretching Track B down by <code>-10%</code>—technically beat-locked, musically
              sluggish. Above roughly <code>±6%</code> tempo delta, a real DJ stops beatmatching and
              uses a tempo-jump primitive: vinyl brake, echo-out into a cold drop, or a halftime
              bridge.
            </li>
            <li>
              <strong>Live-set exact inversion:</strong> My initial plan to distill live tech-house
              sets by linearly inverting each transition against studio masters broke immediately on
              modern club sets—half the tracklist in a real set consists of unreleased IDs, private
              edits, and live mashups with no studio reference. The cleaner path is set-only style
              calibration paired with crate-level energy and groove matching.
            </li>
          </ol>

          <h2 id="learnings">Engineering Learnings</h2>

          <ul>
            <li>
              <strong>Give the model only the irreducibly perceptual part.</strong> Everything
              deterministic—phase locking, stem crossovers, loudness matching, beat-exact looping—belongs
              in code. Keeping the model in the planning layer instead of the sample-generation path
              is what keeps studio fidelity intact.
            </li>
            <li>
              <strong>Autonomy is bounded by verification, not generation.</strong> Writing a
              plausible JSON mix plan was never the hard part. The leverage came from building a
              verifier that catches 25 ms kick drift, sub-250 Hz mud, and Plomp-Levelt harmonic
              roughness automatically.
            </li>
            <li>
              <strong>Every audio bug is a missing harness primitive.</strong> Dual-drum mud forced
              3-band drum separation; mid-phrase cuts forced novelty bar-1 detection; flat volume
              fades forced a composable CDJ DSL. You can&apos;t prompt-engineer your way out of an
              under-expressive action space.
            </li>
            <li>
              <strong>Benchmark against production baselines early.</strong> Hill-climbing on your
              own reward function hides mode collapse and stretch artifacts until you put the final
              stereo output next to real consumer systems under the same ruler.
            </li>
          </ul>

          <h2 id="header">About the Voxel Club Header</h2>

          <p>
            The club at the top of this page is a Three.js scene built entirely from instanced
            voxels—240 dancers, moving heads, lasers, haze, a mirror ball, an LED wall, CO₂ jets,
            and confetti. Nothing in it is keyframed. The browser runs a real-time{" "}
            <code>AudioEngine</code> over the Web Audio <code>AnalyserNode</code>, doing
            spectral-flux onset detection and adaptive BPM tracking while correcting beat phase
            gradually rather than snapping.
          </p>

          <p>
            The set&apos;s own structure drives the room: breakdowns drop the lights to the mirror
            ball and put the crowd into claps; drops fire the CO₂ jets, confetti, and full-white
            strobes; and the camera cuts across five angles on phrase boundaries—or lets you take
            over the booth view yourself while the mix keeps playing.
          </p>
        </article>
      </div>
    </main>
  )
}
