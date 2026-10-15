import { useEffect, useRef } from 'react';
import useMicAnalyser from './useMicAnalyser';

/**
 * The live voice visual behind the composer card while recording: blurred,
 * colorful light blooming from the middle of the card's bottom edge. It
 * brightens with the voice and settles to a low idle glow when quiet. The bloom
 * holds its footprint — `SPIKE` caps growth at 8% over rest — and expresses the
 * voice through colour instead: opacity ramps `REST`→`PEAK` and the layers'
 * `saturate()` ramps `SAT.rest`→`SAT.peak`, so a spike reads as the glow lighting
 * up and going vivid rather than swelling. Independently of loudness, the layers
 * sway (`SWAY`), so the light breathes outward from the centre.
 * It's driven by the real microphone through `useMicAnalyser` (or its simulated
 * envelope when the mic is denied). Nothing re-renders per frame — the layer
 * <div>s are mutated directly via refs. Under prefers-reduced-motion the
 * analyser emits a single frame, so the glow paints once and holds.
 *
 * The container should span the card; the bloom lives in a `BLOOM_HEIGHT` box
 * along its bottom edge.
 *
 * Layers, back to front (all blurred):
 *   1. base   — a wide, low multi-hue wash centred on the bottom edge
 *   2. side   — pink (left) and orange (right) lobes that breathe outward,
 *               each jittered by a spectrum bar
 *   3. lobe   — a purple centre lobe, the densest colour
 *   4. core   — a small, bright hot spot low in the middle
 */

// Stripe-hued palette, matching the recording border's conic gradient.
const PINK = '#FF80B5';
const ORANGE = '#FF8A3D';
const PURPLE = '#B06AFF';

// A single-hue lobe. `at` places the gradient's hot spot so the lobes can sit
// at different points instead of all radiating from the same spot — softer,
// wider ellipse with a long transparent tail so neighbours blend into one
// another rather than reading as separate blobs. The stops stay fairly saturated;
// softness at rest comes from the layer's low opacity and `SAT.rest`, which keeps
// the per-frame `saturate()` ramp something to amplify.
const lobeBg = (color, at) =>
  `radial-gradient(ellipse 150% 150% at ${at}, ${color}ff 0%, ${color}99 40%, ${color}00 78%)`;

// How far the glow may GROW: at full volume each layer scales and rises by at
// most 8% over rest, so the bloom never visibly expands its footprint. Brightness
// is deliberately not held to this ceiling — an 8% opacity lift is imperceptible,
// so the voice reads through `REST`→`PEAK` instead.
const SPIKE = 0.08;

// Opacity range per layer: soft and dim at rest, rich and saturated at full
// voice. The bloom stays in place and lights up rather than swelling.
const REST = { base: 0.1, lobe: 0.12, core: 0.1 };
const PEAK = { base: 0.6, lobe: 0.78, core: 0.66 };

// Blur per layer, in px. Held here rather than inline because the per-frame
// filter has to rebuild the whole string to animate `saturate()` alongside it.
const BLUR = { base: 40, lobe: 22, side: 30, core: 16 };

// Height of the bloom's box along the bottom edge, in px.
const BLOOM_HEIGHT = 44;

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
const response = (a) => (1 - Math.exp(-3 * a)) / (1 - Math.exp(-3));

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

// Sway — the layers drift like a slow wave. `amp` is the max travel in px either
// side of rest; `lag` is a phase offset in radians growing with distance from the
// centre, so the motion ripples outward instead of the layers moving as one.
const SWAY = {
  core: { amp: 10, lag: 0 },
  lobe: { amp: 22, lag: 0.4 },
  base: { amp: 18, lag: 0.7 },
  side: { amp: 26, lag: 1.1 },
};
// Sway speed, in radians/sec at rest; speaking speeds it up by up to
// `SWAY_VOICE_BOOST` and widens the swing, so the glow feels livelier while you talk.
const SWAY_SPEED = 0.9;
const SWAY_VOICE_BOOST = 0.7;

export default function VoiceGlowViz({ active, className = '' }) {
  const baseRef = useRef(null);
  const lobeRef = useRef(null);
  const sideLeftRef = useRef(null);
  const sideRightRef = useRef(null);
  const coreRef = useRef(null);
  const envRef = useRef(0); // asymmetric attack/release stage, 0..1
  const smoothRef = useRef(0); // rounded envelope that drives the visual, 0..1
  const shimmerRef = useRef({}); // smoothed per-lobe spectrum samples
  const lastTimeRef = useRef(null);
  const swayPhaseRef = useRef(0); // accumulated sway phase, radians

  // Start each session fresh so the first frame snaps rather than easing in
  // from a stale value (and a reduced-motion single frame paints its level).
  useEffect(() => {
    if (!active) lastTimeRef.current = null;
  }, [active]);

  const onFrame = ({ level, bars }) => {
    const now = performance.now();
    const first = lastTimeRef.current == null;
    // Clamp dt so a dropped/backgrounded tab doesn't lurch on resume.
    const dt = first ? 0 : Math.min(64, now - lastTimeRef.current);
    lastTimeRef.current = now;
    const k = (ms) => (first ? 1 : 1 - Math.exp(-dt / ms));

    const target = response(level ?? 0);
    envRef.current += (target - envRef.current) * k(target > envRef.current ? ATTACK_MS : RELEASE_MS);
    smoothRef.current += (envRef.current - smoothRef.current) * k(ROUND_MS);

    const b = bars && bars.length ? bars : null;
    // Average a small neighbourhood of bars, then smooth over time, so one noisy
    // bin can't make a lobe flicker.
    const sample = (i) => {
      let raw = 0.4;
      if (b) {
        let acc = 0;
        let n = 0;
        for (let j = Math.max(0, i - 2); j <= Math.min(b.length - 1, i + 2); j += 1) {
          acc += b[j] || 0;
          n += 1;
        }
        raw = acc / n;
      }
      const prev = shimmerRef.current[i] ?? raw;
      const next = prev + (raw - prev) * k(SHIMMER_MS);
      shimmerRef.current[i] = next;
      return next;
    };

    // `e` (0..1) is the smoothed, curved envelope that drives brightness;
    // geometry still stays inside the 8% growth budget.
    const e = smoothRef.current;
    const grow = 1 + SPIKE * e;
    const glow = (layer) => (REST[layer] + (PEAK[layer] - REST[layer]) * e).toFixed(3);
    // Saturation ramps with the envelope, so louder reads as more colourful, not
    // just more opaque.
    const sat = SAT.rest + (SAT.peak - SAT.rest) * e;
    const filterFor = (blurPx) => `blur(${blurPx}px) saturate(${sat.toFixed(3)})`;

    // Phase is accumulated (not derived from wall time) so a speed change from
    // the voice bends the motion smoothly instead of jumping it.
    swayPhaseRef.current += (dt / 1000) * SWAY_SPEED * (1 + SWAY_VOICE_BOOST * e);
    const p = swayPhaseRef.current;
    // Two incommensurate sines so the path never visibly loops; with no edge to
    // clip against, it swings evenly either way.
    const sway = (layer) => {
      const { amp, lag } = SWAY[layer];
      const s = 0.62 * Math.sin(p + lag) + 0.38 * Math.sin(p * 0.57 + lag * 1.6 + 1.1);
      const reach = amp * (0.75 + 0.25 * e);
      return (0.6 * reach * s).toFixed(2);
    };

    // Base halo: barely swells, but brightens and saturates clearly with loudness.
    if (baseRef.current) {
      baseRef.current.style.opacity = glow('base');
      baseRef.current.style.transform = `translateX(${sway('base')}px) scale(${grow.toFixed(4)})`;
      baseRef.current.style.filter = filterFor(BLUR.base);
    }

    // Opacity for a spectrum-jittered layer: lights up with a per-layer bar
    // sample so the layers shimmer out of sync.
    const shimmerFor = (barIndex) => e * (0.55 + 0.45 * sample(barIndex));
    const opacityFor = (layerKey, shimmer) =>
      (REST[layerKey] + (PEAK[layerKey] - REST[layerKey]) * Math.min(1, shimmer * 1.15)).toFixed(3);

    // Centre lobe: lights up and rises a hair, inside the 8% growth budget.
    if (lobeRef.current) {
      const shimmer = shimmerFor(42);
      const sy = 1 + SPIKE * shimmer;
      const ty = -(SPIKE * shimmer * 80);
      lobeRef.current.style.opacity = opacityFor('lobe', shimmer);
      lobeRef.current.style.transform = `translate(${sway('lobe')}px, ${ty.toFixed(2)}%) scaleX(${grow.toFixed(4)}) scaleY(${sy.toFixed(4)})`;
      lobeRef.current.style.filter = filterFor(BLUR.lobe);
    }

    // Side lobes: mirror each other — one sway value pushes them apart
    // or draws them together — so the bloom breathes outward from the middle.
    const setSide = (el, dir, barIndex) => {
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

    // Hot core: the brightest, most saturated point, low in the middle.
    if (coreRef.current) {
      coreRef.current.style.opacity = glow('core');
      coreRef.current.style.transform = `translateX(${sway('core')}px) scale(${grow.toFixed(4)})`;
      coreRef.current.style.filter = filterFor(BLUR.core);
    }
  };

  useMicAnalyser(active, onFrame);

  if (!active) return null;

  // Every layer is anchored to the middle of the bottom edge and scales from
  // the bottom centre.
  const layer = 'pointer-events-none absolute bottom-0 origin-bottom rounded-full';
  return (
    <div className={className} aria-hidden="true">
      <div className="absolute inset-x-0 bottom-0" style={{ height: BLOOM_HEIGHT }}>
        {/* 1. Ambient halo — a wide, low wash centred on the bottom edge. */}
        <div
          ref={baseRef}
          className={`${layer} bottom-[-8%] left-[12%] h-[104%] w-[76%]`}
          style={{
            background: `radial-gradient(ellipse 60% 120% at 50% 100%, ${PURPLE}ff 0%, ${ORANGE}cc 30%, ${PINK}aa 54%, ${PINK}00 88%)`,
            filter: `blur(${BLUR.base}px) saturate(${SAT.rest})`,
            opacity: REST.base,
          }}
        />

        {/* 2. Side lobes — pink left, orange right, breathing outward. */}
        <div
          ref={sideLeftRef}
          className={`${layer} bottom-[-4%] left-[20%] h-[86%] w-[30%]`}
          style={{ background: lobeBg(PINK, '60% 100%'), filter: `blur(${BLUR.side}px) saturate(${SAT.rest})`, opacity: REST.lobe }}
        />
        <div
          ref={sideRightRef}
          className={`${layer} bottom-[-4%] right-[20%] h-[86%] w-[30%]`}
          style={{ background: lobeBg(ORANGE, '40% 100%'), filter: `blur(${BLUR.side}px) saturate(${SAT.rest})`, opacity: REST.lobe }}
        />

        {/* 3. Centre lobe — the densest colour, in the middle. */}
        <div
          ref={lobeRef}
          className={`${layer} bottom-[-6%] left-[34%] h-[96%] w-[32%]`}
          style={{ background: lobeBg(PURPLE, '50% 100%'), filter: `blur(${BLUR.lobe}px) saturate(${SAT.rest})`, opacity: REST.lobe }}
        />

        {/* 4. Hot core — the brightest point, small and low at the centre. */}
        <div
          ref={coreRef}
          className={`${layer} bottom-[-4%] left-[42%] h-[58%] w-[16%]`}
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
