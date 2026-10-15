import { useEffect, useLayoutEffect, useRef } from 'react';

/**
 * Real microphone analysis for voice mode.
 *
 * While `active`, requests mic access and runs a Web Audio `AnalyserNode`,
 * calling `onFrame({ level, pitchHz, bars })` once per animation frame:
 *   - `level` — 0..1 loudness (RMS of the time-domain signal, gained up so
 *     normal speech spans a useful range).
 *   - `pitchHz` — a rough dominant frequency (peak FFT bin), for hue reactivity.
 *   - `bars` — a `BAR_COUNT`-length Float32Array of 0..1 magnitudes across the
 *     voice band, for drawing a spectrum/waveform. The array is reused each
 *     frame, so read/copy it synchronously.
 *
 * If the mic is unavailable or the user denies permission, it falls back to a
 * simulated speech-like envelope so the visual still animates. `onFrame` is held
 * in a ref so its identity never re-runs the setup. Everything is torn down
 * (tracks stopped, context closed) when `active` goes false or on unmount.
 *
 * Returns a ref whose `.current` is the mic error (or null) for optional UI.
 */
export const BAR_COUNT = 64;

export default function useMicAnalyser(active, onFrame) {
  const onFrameRef = useRef(onFrame);
  useLayoutEffect(() => {
    onFrameRef.current = onFrame;
  });
  const errorRef = useRef(null);
  const barsRef = useRef(new Float32Array(BAR_COUNT));

  useEffect(() => {
    if (!active) return undefined;

    let cancelled = false;
    let raf = null;
    let stream = null;
    let ctx = null;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // Fallback: a speech-like envelope when there's no usable mic.
    const runSimulated = () => {
      const start = performance.now();
      const loop = (now) => {
        if (cancelled) return;
        const t = (now - start) / 1000;
        const raw =
          0.55 + 0.28 * Math.sin(t * 3.1) + 0.14 * Math.sin(t * 7.9 + 1.3) + 0.07 * Math.sin(t * 15.5 + 2.7);
        const level = Math.min(1, Math.max(0, raw));
        const pitchHz = 180 + 120 * Math.sin(t * 1.7);
        const bars = barsRef.current;
        for (let i = 0; i < bars.length; i += 1) {
          const hump = Math.sin((Math.PI * (i + 0.5)) / bars.length); // center-weighted
          const flutter = 0.7 + 0.3 * Math.sin(t * 6 + i * 0.9);
          bars[i] = Math.min(1, level * (0.35 + 0.65 * hump) * flutter);
        }
        onFrameRef.current?.({ level, pitchHz, bars });
        if (!reduceMotion) raf = requestAnimationFrame(loop);
      };
      if (reduceMotion) {
        const bars = barsRef.current;
        for (let i = 0; i < bars.length; i += 1) {
          bars[i] = 0.5 * Math.sin((Math.PI * (i + 0.5)) / bars.length);
        }
        onFrameRef.current?.({ level: 0.6, pitchHz: 200, bars });
      } else {
        raf = requestAnimationFrame(loop);
      }
    };

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia || !(window.AudioContext || window.webkitAudioContext)) {
        runSimulated();
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        errorRef.current = null;
        const Ctx = window.AudioContext || window.webkitAudioContext;
        ctx = new Ctx();
        if (ctx.state === 'suspended') await ctx.resume();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        // Only affects `getByteFrequencyData` (the `bars` output), not the RMS
        // `level`. The default 0.8 smears each bin over a few hundred ms, which
        // makes bar-style visuals lag noticeably behind the voice; 0.6 still
        // suppresses per-frame jitter while tracking syllables.
        analyser.smoothingTimeConstant = 0.6;
        source.connect(analyser);

        const timeData = new Uint8Array(analyser.fftSize);
        const freqData = new Uint8Array(analyser.frequencyBinCount);
        const nyquist = ctx.sampleRate / 2;

        // Log-spaced band edges over the voice range, precomputed once.
        //
        // A linear split of the spectrum wastes most of the row: at a 48kHz rate
        // each of 64 linear bars spans ~190Hz, but speech energy is concentrated
        // below ~4kHz, so only the first handful of bars ever move. Spacing the
        // bands logarithmically between VOICE_MIN and VOICE_MAX spreads the vowels
        // and formants across the whole array, the way the ear hears them.
        const VOICE_MIN = 80;
        const VOICE_MAX = 5000;
        const edges = new Uint16Array(BAR_COUNT + 1);
        const ratio = VOICE_MAX / VOICE_MIN;
        for (let i = 0; i <= BAR_COUNT; i += 1) {
          const hz = VOICE_MIN * Math.pow(ratio, i / BAR_COUNT);
          edges[i] = Math.min(freqData.length - 1, Math.round((hz / nyquist) * freqData.length));
        }

        const loop = () => {
          if (cancelled) return;
          analyser.getByteTimeDomainData(timeData);
          analyser.getByteFrequencyData(freqData);

          let sumSquares = 0;
          for (let i = 0; i < timeData.length; i += 1) {
            const v = (timeData[i] - 128) / 128;
            sumSquares += v * v;
          }
          const rms = Math.sqrt(sumSquares / timeData.length);
          const level = Math.min(1, rms * 4.8);

          let peakBin = 0;
          let peakVal = 0;
          for (let i = 0; i < freqData.length; i += 1) {
            if (freqData[i] > peakVal) {
              peakVal = freqData[i];
              peakBin = i;
            }
          }
          const pitchHz = (peakBin / freqData.length) * nyquist;

          // Fold the spectrum into BAR_COUNT log-spaced voice-band bars.
          const bars = barsRef.current;
          for (let i = 0; i < bars.length; i += 1) {
            const startBin = edges[i];
            const endBin = Math.max(startBin + 1, edges[i + 1]);
            let acc = 0;
            for (let b = startBin; b < endBin; b += 1) acc += freqData[b];
            // Speech rolls off steeply with frequency, so the upper bands would
            // sit near-flat against the lower ones. A mild tilt (1x → ~2.2x across
            // the row) evens them out without inventing signal.
            const tilt = 1 + 1.2 * (i / (bars.length - 1));
            bars[i] = Math.min(1, (acc / (endBin - startBin) / 255) * tilt);
          }

          onFrameRef.current?.({ level, pitchHz, bars });
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      } catch (error) {
        errorRef.current = error;
        runSimulated();
      }
    };

    start();

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (ctx && ctx.state !== 'closed') ctx.close();
    };
  }, [active]);

  return errorRef;
}
