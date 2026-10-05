'use client'

import { useEffect, useRef } from "react"
import useMicAnalyser from "./useMicAnalyser"

/**
 * A live voice visual — the "glow" counterpart to the "line" VoiceWaveViz.
 *
 * Instead of a drawn wave ribbon, this overlays blurred, colorful light in the
 * bottom-right corner of its container that trails up the right edge and fades
 * out toward the top: a soft bloom that brightens with the voice and settles to
 * a low idle glow when quiet. The bloom holds its footprint — `SPIKE` caps growth
 * at 8% over rest — and expresses the voice through colour instead: opacity ramps
 * `REST`→`PEAK` and the layers' `saturate()` ramps `SAT.rest`→`SAT.peak`, so a
 * spike reads as the glow lighting up and going vivid rather than swelling.
 * Independently of loudness, the layers sway (`SWAY`) and a bright band drifts
 * up and down the trail, so the light reads as a slow wave climbing the edge.
 * It's driven by the real microphone through `useMicAnalyser` (or its simulated
 * envelope when the mic is denied). Nothing re-renders per frame — the layer
 * <div>s are mutated directly via refs, the same approach VoiceWaveViz uses to
 * update its SVG path. Under prefers-reduced-motion the analyser emits a single
 * frame, so the glow paints once and holds.
 *
 * The container should span the full height of the card: the corner bloom lives
 * in a `CORNER_HEIGHT` box at the bottom, and the trail runs the full height,
 * its gradient fading out about halfway up so the top of the edge stays clear.
 *
 * `origin` picks where the light comes from: 'corner' (bottom-right, trailing
 * up the right edge — the layers below) or 'center' (a symmetric bloom in the
 * middle of the bottom edge: base / lobe / core centred, flanked by pink and
 * orange side lobes that breathe outward, and no edge trail).
 *
 * Corner layers, back to front (all blurred):
 *   1. base   — a low multi-hue wash tucked into the corner
 *   2. lobe   — a purple radial lobe at the corner, jittered by a spectrum bar
 *   3. trail  — a continuous gradient hugging the right edge, dense at the
 *               bottom and dissolving toward the top, with a drifting bright band
 *   4. wisp   — a thinner, hotter line inside the trail, right against the edge
 *   5. core   — a small, bright hot spot in the corner where the trail starts
 */

// Stripe-hued palette, matching VoiceWaveViz's gradients.
const PINK = '#FF80B5';
const ORANGE = '#FF8A3D';
const PURPLE = '#B06AFF';

// A single-hue lobe. `at` places the gradient's hot spot so the lobes can sit
// at different points instead of all radiating from the same corner — softer,
// wider ellipse with a long transparent tail so neighbours blend into one
// another rather than reading as separate blobs. The stops stay fairly saturated;
// softness at rest comes from the layer's low opacity and `SAT.rest`, which keeps
// the per-frame `saturate()` ramp something to amplify.
const lobeBg = (color: string, at = "100% 100%") =>
  `radial-gradient(ellipse 150% 150% at ${at}, ${color}ff 0%, ${color}99 40%, ${color}00 78%)`

// The trail up the right edge. Every gradient is centred on the exact
// bottom-right corner (`100% 100%`), so the light bends from vertical to
// horizontal at the corner itself — an earlier version was a masked rectangle,
// which put a visible elbow at its inner edge instead. Layers, top to bottom:
//   - a soft pink band at `bandY` (% from the top) that drifts along the edge
//   - a tall, narrow ellipse: the trail proper, fading out about halfway up
//   - a wide, short ellipse filling the elbow so the two arms merge smoothly
const trailBg = (bandY: number | string = 70) =>
  `radial-gradient(ellipse 14% 12% at 100% ${bandY}%, ${PINK}bb 0%, ${PINK}00 100%), ` +
  `radial-gradient(ellipse 16% 58% at 100% 100%, ${PURPLE}ff 0%, ${ORANGE}cc 18%, ${PINK}99 42%, ${PINK}44 70%, ${PINK}00 100%), ` +
  `radial-gradient(ellipse 42% 30% at 100% 100%, ${PURPLE}cc 0%, ${ORANGE}88 40%, ${PINK}00 100%)`;

// How far the glow may GROW: at full volume each layer scales and rises by at
// most 8% over rest, so the bloom never visibly expands its footprint. Brightness
// is deliberately not held to this ceiling — an 8% opacity lift is imperceptible,
// so the voice reads through `REST`→`PEAK` instead.
const SPIKE = 0.08;

// Opacity range per layer: soft and dim at rest, rich and saturated at full
// voice. The bloom stays in place and lights up rather than swelling.
const REST = { base: 0.1, lobe: 0.12, trail: 0.12, wisp: 0.08, core: 0.1 }
const PEAK = { base: 0.6, lobe: 0.78, trail: 0.72, wisp: 0.6, core: 0.66 }
type GlowLayer = keyof typeof REST

// Blur per layer, in px. Held here rather than inline because the per-frame
// filter has to rebuild the whole string to animate `saturate()` alongside it.
const BLUR = { base: 40, lobe: 22, side: 30, trail: 22, wisp: 10, core: 16 };

// Height of the corner bloom's box, in px. The trail spans the full container.
const CORNER_HEIGHT = 44;

// Colour intensity range. Quiet is slightly desaturated so the glow reads as a
// soft grey-tinted wash; at full voice the hues push past 1 into vivid Stripe
// pink/orange/purple, which is what makes a spike feel like it "lights up".
const SAT = { rest: 0.85, peak: 2.1 };

/**
 * Perceptual response curve. Conversational speech only pushes the analyser's
 * RMS level to roughly 0.2–0.6, so driving opacity off the raw value leaves the
 * top of the range unused and the glow looks dead. This lifts the mid-range and
 * eases into 1 with a soft knee — a hard `min(1, …)` clip made loud speech pin
 * at full and then visibly drop off the ceiling.
 */
const response = (a: number) => (1 - Math.exp(-3 * a)) / (1 - Math.exp(-3))

// Envelope timing, in ms (time constants, so ~63% of the way per constant).
// Time-based rather than per-frame so it feels the same at 60Hz and 120Hz.
// Attack is quick enough to track syllables but no longer snaps; release is
// long so the glow breathes down. The second, symmetric stage rounds off the
// corners of the first so each swell eases in as well as out.
const ATTACK_MS = 110;
const RELEASE_MS = 480;
const ROUND_MS = 90;
// Per-lobe shimmer smoothing — slower than the envelope so the lobes drift out
// of sync with each other instead of flickering frame to frame.
const SHIMMER_MS = 200;

// Sway — the layers drift out of the corner like a slow wave. `amp` is the max
// travel in px away from the corner (left for the corner layers, inward for the
// trail); `lag` is a phase offset in radians growing with distance from the
// corner, so the motion ripples outward instead of the layers moving as one.
const SWAY = {
  core: { amp: 10, lag: 0 },
  lobe: { amp: 22, lag: 0.4 },
  base: { amp: 18, lag: 0.7 },
  wisp: { amp: 4, lag: 0.9 },
  trail: { amp: 8, lag: 1.3 },
  side: { amp: 26, lag: 1.1 },
};
// The bright band on the trail: its centre drifts between these heights (% up
// the trail from the bottom) on the same sway phase, so light seems to flow up
// and back down the edge.
const BAND = { low: 16, high: 42 };
// Sway speed, in radians/sec at rest; speaking speeds it up by up to
// `SWAY_VOICE_BOOST` and widens the swing, so the glow feels livelier while you talk.
const SWAY_SPEED = 0.9;
const SWAY_VOICE_BOOST = 0.7;

export default function VoiceGlowViz({
  active,
  origin = "corner",
  className = "",
  capture = true,
}: {
  active: boolean
  origin?: "corner" | "center"
  className?: string
  capture?: boolean
}) {
  const centered = origin === "center"
  const baseRef = useRef<HTMLDivElement>(null)
  const lobeRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<HTMLDivElement>(null)
  const wispRef = useRef<HTMLDivElement>(null)
  const sideLeftRef = useRef<HTMLDivElement>(null)
  const sideRightRef = useRef<HTMLDivElement>(null)
  const coreRef = useRef<HTMLDivElement>(null)
  const envRef = useRef(0)
  const smoothRef = useRef(0)
  const shimmerRef = useRef<Record<number, number>>({})
  const lastTimeRef = useRef<number | null>(null)
  const swayPhaseRef = useRef(0)

  // Start each session fresh so the first frame snaps rather than easing in
  // from a stale value (and a reduced-motion single frame paints its level).
  useEffect(() => {
    if (!active) lastTimeRef.current = null;
  }, [active]);

  const onFrame = ({ level, bars }: { level: number; bars: Float32Array }) => {
    const now = performance.now()
    const first = lastTimeRef.current == null
    const dt = first ? 0 : Math.min(64, now - (lastTimeRef.current ?? now))
    lastTimeRef.current = now
    const k = (ms: number) => (first ? 1 : 1 - Math.exp(-dt / ms))

    const target = response(level ?? 0)
    envRef.current += (target - envRef.current) * k(target > envRef.current ? ATTACK_MS : RELEASE_MS)
    smoothRef.current += (envRef.current - smoothRef.current) * k(ROUND_MS)

    const b = bars && bars.length ? bars : null
    const sample = (i: number) => {
      let raw = 0.4
      if (b) {
        let acc = 0
        let n = 0
        for (let j = Math.max(0, i - 2); j <= Math.min(b.length - 1, i + 2); j += 1) {
          acc += b[j] || 0
          n += 1
        }
        raw = acc / n
      }
      const prev = shimmerRef.current[i] ?? raw
      const next = prev + (raw - prev) * k(SHIMMER_MS)
      shimmerRef.current[i] = next
      return next
    }

    const e = smoothRef.current
    const grow = 1 + SPIKE * e
    const glow = (layer: GlowLayer) => (REST[layer] + (PEAK[layer] - REST[layer]) * e).toFixed(3)
    const sat = SAT.rest + (SAT.peak - SAT.rest) * e
    const filterFor = (blurPx: number) => `blur(${blurPx}px) saturate(${sat.toFixed(3)})`

    swayPhaseRef.current += (dt / 1000) * SWAY_SPEED * (1 + SWAY_VOICE_BOOST * e)
    const p = swayPhaseRef.current
    const sway = (layer: keyof typeof SWAY) => {
      const { amp, lag } = SWAY[layer]
      const s = 0.62 * Math.sin(p + lag) + 0.38 * Math.sin(p * 0.57 + lag * 1.6 + 1.1)
      const reach = amp * (0.75 + 0.25 * e)
      return (centered ? 0.6 * reach * s : -0.35 * reach + 0.65 * reach * s).toFixed(2)
    }

    if (baseRef.current) {
      baseRef.current.style.opacity = glow("base")
      baseRef.current.style.transform = `translateX(${sway("base")}px) scale(${grow.toFixed(4)})`
      baseRef.current.style.filter = filterFor(BLUR.base)
    }

    const shimmerFor = (barIndex: number) => e * (0.55 + 0.45 * sample(barIndex))
    const opacityFor = (layerKey: GlowLayer, shimmer: number) =>
      (REST[layerKey] + (PEAK[layerKey] - REST[layerKey]) * Math.min(1, shimmer * 1.15)).toFixed(3)

    // Corner lobe: lights up and rises a hair, inside the 8% growth budget.
    if (lobeRef.current) {
      const shimmer = shimmerFor(42);
      const sy = 1 + SPIKE * shimmer;
      const ty = -(SPIKE * shimmer * 80);
      lobeRef.current.style.opacity = opacityFor('lobe', shimmer);
      lobeRef.current.style.transform = `translate(${sway('lobe')}px, ${ty.toFixed(2)}%) scaleX(${grow.toFixed(4)}) scaleY(${sy.toFixed(4)})`;
      lobeRef.current.style.filter = filterFor(BLUR.lobe);
    }

    // Trail: reaches a little higher with the voice (still within the growth
    // budget) and sways inward. Its background is rebuilt so the bright band's
    // position can drift along it — the "wave" climbing the edge.
    if (trailRef.current) {
      const shimmer = shimmerFor(50);
      const { lag } = SWAY.trail;
      const t = 0.5 + 0.5 * (0.62 * Math.sin(p + lag) + 0.38 * Math.sin(p * 0.57 + lag * 1.6 + 1.1));
      const bandY = 100 - (BAND.low + (BAND.high - BAND.low) * t);
      trailRef.current.style.opacity = opacityFor('trail', shimmer);
      trailRef.current.style.transform = `translateX(${sway('trail')}px) scaleY(${grow.toFixed(4)})`;
      trailRef.current.style.filter = filterFor(BLUR.trail);
      trailRef.current.style.background = trailBg(bandY.toFixed(1));
    }

    if (wispRef.current) {
      const shimmer = shimmerFor(58);
      wispRef.current.style.opacity = opacityFor('wisp', shimmer);
      wispRef.current.style.transform = `translateX(${sway('wisp')}px) scaleY(${grow.toFixed(4)})`;
      wispRef.current.style.filter = filterFor(BLUR.wisp);
    }

    // Centred side lobes: mirror each other — one sway value pushes them apart
    // or draws them together — so the bloom breathes outward from the middle.
    const setSide = (el: HTMLDivElement | null, dir: number, barIndex: number) => {
      if (!el) return;
      const shimmer = shimmerFor(barIndex);
      const sy = 1 + SPIKE * shimmer;
      const spread = Math.abs(Number(sway('side'))) * dir;
      el.style.opacity = opacityFor('lobe', shimmer);
      el.style.transform = `translateX(${spread.toFixed(2)}px) scaleX(${grow.toFixed(4)}) scaleY(${sy.toFixed(4)})`;
      el.style.filter = filterFor(BLUR.side);
    };
    setSide(sideLeftRef.current, -1, 18);
    setSide(sideRightRef.current, 1, 34);

    // Hot core: the brightest, most saturated point at the right end.
    if (coreRef.current) {
      coreRef.current.style.opacity = glow('core');
      coreRef.current.style.transform = `translateX(${sway('core')}px) scale(${grow.toFixed(4)})`;
      coreRef.current.style.filter = filterFor(BLUR.core);
    }
  };

  useMicAnalyser(active, onFrame, { capture });

  if (!active) return null;

  if (centered) {
    // Centred variant — same layer roles, but anchored to the middle of the
    // bottom edge and scaling from the bottom centre.
    const cLayer = 'pointer-events-none absolute bottom-0 origin-bottom rounded-full';
    return (
      <div className={className} aria-hidden="true">
        <div className="absolute inset-x-0 bottom-0" style={{ height: CORNER_HEIGHT }}>
          {/* 1. Ambient halo — a wide, low wash centred on the bottom edge. */}
          <div
            ref={baseRef}
            className={`${cLayer} bottom-[-8%] left-[12%] h-[104%] w-[76%]`}
            style={{
              background: `radial-gradient(ellipse 60% 120% at 50% 100%, ${PURPLE}ff 0%, ${ORANGE}cc 30%, ${PINK}aa 54%, ${PINK}00 88%)`,
              filter: `blur(${BLUR.base}px) saturate(${SAT.rest})`,
              opacity: REST.base,
            }}
          />

          {/* 2. Side lobes — pink left, orange right, breathing outward. */}
          <div
            ref={sideLeftRef}
            className={`${cLayer} bottom-[-4%] left-[20%] h-[86%] w-[30%]`}
            style={{ background: lobeBg(PINK, '60% 100%'), filter: `blur(${BLUR.side}px) saturate(${SAT.rest})`, opacity: REST.lobe }}
          />
          <div
            ref={sideRightRef}
            className={`${cLayer} bottom-[-4%] right-[20%] h-[86%] w-[30%]`}
            style={{ background: lobeBg(ORANGE, '40% 100%'), filter: `blur(${BLUR.side}px) saturate(${SAT.rest})`, opacity: REST.lobe }}
          />

          {/* 3. Centre lobe — the densest colour, in the middle. */}
          <div
            ref={lobeRef}
            className={`${cLayer} bottom-[-6%] left-[34%] h-[96%] w-[32%]`}
            style={{ background: lobeBg(PURPLE, '50% 100%'), filter: `blur(${BLUR.lobe}px) saturate(${SAT.rest})`, opacity: REST.lobe }}
          />

          {/* 4. Hot core — the brightest point, small and low at the centre. */}
          <div
            ref={coreRef}
            className={`${cLayer} bottom-[-4%] left-[42%] h-[58%] w-[16%]`}
            style={{
              background: `radial-gradient(ellipse 110% 110% at 50% 100%, #FFFFFFee 0%, ${ORANGE}cc 32%, ${PINK}99 58%, ${PINK}00 82%)`,
              filter: `blur(${BLUR.core}px) saturate(${SAT.rest})`,
              opacity: REST.core,
            }}
          />
        </div>
      </div>
    );
  }

  // Shared layer base — anchored to the bottom-right corner, blurred, blooming
  // up and to the left from the edge.
  const layer = 'pointer-events-none absolute bottom-0 origin-bottom-right';

  return (
    <div className={className} aria-hidden="true">
      {/* Corner box — the bloom's layers are sized against this, not the full
          height, so they stay tucked into the corner. */}
      <div className="absolute right-0 bottom-0 w-full" style={{ height: CORNER_HEIGHT }}>
        {/* 1. Ambient halo — a low wash weighted into the corner. */}
        <div
          ref={baseRef}
          className={`${layer} right-[-4%] bottom-[-8%] h-[104%] w-[100%] rounded-full`}
          style={{
            background: `radial-gradient(ellipse 160% 120% at 100% 100%, ${PURPLE}ff 0%, ${ORANGE}cc 30%, ${PINK}aa 54%, ${PINK}00 88%)`,
            filter: `blur(${BLUR.base}px) saturate(${SAT.rest})`,
            opacity: REST.base,
          }}
        />

        {/* 2. Corner lobe — the densest colour, where the trail starts. */}
        <div
          ref={lobeRef}
          className={`${layer} right-[-3%] bottom-[-6%] h-[96%] w-[55%] rounded-full`}
          style={{ background: lobeBg(PURPLE, '100% 100%'), filter: `blur(${BLUR.lobe}px) saturate(${SAT.rest})`, opacity: REST.lobe }}
        />
      </div>

      {/* 3. Trail — fills the whole container, but its gradients all radiate
          from the corner, so it climbs the right edge and dissolves about
          halfway up with no hard inner edge. */}
      <div
        ref={trailRef}
        className={`${layer} right-0 h-full w-full`}
        style={{
          background: trailBg(),
          filter: `blur(${BLUR.trail}px) saturate(${SAT.rest})`,
          opacity: REST.trail,
        }}
      />

      {/* 4. Wisp — a thinner, hotter line right on the edge, also radiating
          from the corner and fading out lower than the trail. */}
      <div
        ref={wispRef}
        className={`${layer} right-0 h-full w-full`}
        style={{
          background: `radial-gradient(ellipse 5% 44% at 100% 100%, #FFFFFFcc 0%, ${ORANGE}bb 22%, ${PINK}88 50%, ${PINK}00 100%)`,
          filter: `blur(${BLUR.wisp}px) saturate(${SAT.rest})`,
          opacity: REST.wisp,
        }}
      />

      {/* 5. Hot core — the brightest point, small and low in the corner. */}
      <div className="absolute right-0 bottom-0 w-full" style={{ height: CORNER_HEIGHT }}>
        <div
          ref={coreRef}
          className={`${layer} right-[-1%] bottom-[-4%] h-[58%] w-[24%] rounded-full`}
          style={{
            background: `radial-gradient(ellipse 130% 110% at 100% 100%, #FFFFFFee 0%, ${ORANGE}cc 32%, ${PINK}99 58%, ${PINK}00 82%)`,
            filter: `blur(${BLUR.core}px) saturate(${SAT.rest})`,
            opacity: REST.core,
          }}
        />
      </div>
    </div>
  );
}
