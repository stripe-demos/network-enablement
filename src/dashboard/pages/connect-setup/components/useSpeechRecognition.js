import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Live speech-to-text for the freeform dictation mode.
 *
 * While `active`, runs the Web Speech API (`window.SpeechRecognition ||
 * window.webkitSpeechRecognition`) in continuous, interim-results mode and calls
 * `onResult({ finalText, interimText })` as recognition streams in:
 *   - `finalText` — the concatenation of every settled (`isFinal`) segment.
 *   - `interimText` — the still-updating tail the engine hasn't committed yet.
 *
 * Chrome ends a recognition session on its own after a pause, so `onend`
 * restarts it until the effect is torn down — that keeps the mic "open" for the
 * length of the recording. `onResult`/`onError` are held in refs so their
 * identity never re-runs the setup.
 *
 * Caveat: this runs alongside `useMicAnalyser`'s own `getUserMedia` stream (both
 * are live during recording), and it only works in a Chromium browser — Firefox
 * and Safari lack the API, in which case `supported` is false and the
 * caller should fall back to the canned reveal.
 *
 * Returns whether the API is supported.
 */
export default function useSpeechRecognition(active, { lang = 'en-US', onResult, onError } = {}) {
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  useLayoutEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  });

  const [supported] = useState(
    () =>
      typeof window !== 'undefined' &&
      !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );

  useEffect(() => {
    if (!active) return undefined;

    if (!supported) {
      onErrorRef.current?.(new Error('unsupported'));
      return undefined;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;

    let stopped = false;

    rec.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      onResultRef.current?.({ finalText, interimText });
    };

    rec.onerror = (event) => {
      onErrorRef.current?.(event);
    };

    // Chrome auto-stops after a lull; restart so listening survives until the
    // recording is torn down.
    rec.onend = () => {
      if (stopped) return;
      try {
        rec.start();
      } catch {
        // Already starting / stopping — safe to ignore.
      }
    };

    try {
      rec.start();
    } catch {
      // A start() while a prior session is still winding down throws; the
      // onend restart covers it.
    }

    return () => {
      stopped = true;
      try {
        rec.stop();
      } catch {
        // Nothing to stop.
      }
    };
  }, [active, lang, supported]);

  return supported;
}
