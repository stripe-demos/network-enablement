import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

/**
 * The scripted dictation fallback `LiveVoiceMode` renders when the browser has
 * no speech recognition API (Firefox, Safari).
 *
 * Dictation is simulated: a canned transcript is revealed one word at a time and
 * pushed straight back out through `onTranscriptChange`, so the parent's
 * `description` — and with it the strength chips — grows exactly as if the words
 * were typed.
 *
 * Timing is Figma's (`1568:376828`, cohort `1568:370636`): `word-0` lands at
 * 290ms and each following word 200ms later. Figma's own timeline runs out at
 * word-9 and pins the rest at full opacity, so the 200ms cadence is continued
 * through all 24 words — the stagger is clearly the intent.
 *
 * // motion: voice-to-text
 */
export default function VoiceMode({
  transcript,
  baseText = '',
  onTranscriptChange,
  onFinish,
  leadInMs = 290,
  wordStaggerMs = 200,
  tailMs = 800,
  className = '',
}) {
  const words = useMemo(() => transcript.trim().split(/\s+/).filter(Boolean), [transcript]);
  const [revealed, setRevealed] = useState(0);

  // Captured once: the text the user had before recording started. Reading it
  // from props on every tick would feed our own output back in.
  const [base] = useState(() => baseText.trim());
  const emit = useRef(onTranscriptChange);
  const finish = useRef(onFinish);
  useLayoutEffect(() => {
    emit.current = onTranscriptChange;
    finish.current = onFinish;
  });

  const reduceMotion =
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  // Drive the reveal.
  useEffect(() => {
    if (words.length === 0) return undefined;

    if (reduceMotion) {
      const jump = setTimeout(() => setRevealed(words.length), leadInMs);
      return () => clearTimeout(jump);
    }

    let step;
    const first = setTimeout(() => {
      setRevealed(1);
      step = setInterval(() => {
        setRevealed((prev) => {
          if (prev >= words.length) {
            clearInterval(step);
            return prev;
          }
          return prev + 1;
        });
      }, wordStaggerMs);
    }, leadInMs);

    return () => {
      clearTimeout(first);
      clearInterval(step);
    };
  }, [words.length, reduceMotion, leadInMs, wordStaggerMs]);

  // Push each new word into the parent, then hand control back once the
  // transcript has run out — a real mic would keep listening, but for the demo
  // the settle beat reads better than an open mic with nothing left to say.
  useEffect(() => {
    if (revealed === 0) return undefined;

    const spoken = words.slice(0, revealed).join(' ');
    emit.current?.(base ? `${base} ${spoken}` : spoken);

    if (revealed < words.length) return undefined;

    const done = setTimeout(() => finish.current?.(), tailMs);
    return () => clearTimeout(done);
  }, [revealed, words, tailMs, base]);

  return (
    <div className={`flex items-start ${className}`}>
      <p className="text-body-medium text-default" aria-live="polite">
        {/* The pre-recording text, if any, leads as a plain run. */}
        {base ? `${base} ` : ''}
        {/* The space sits outside the span — a trailing space inside an
            inline-block collapses, and the words would run together. */}
        {words.slice(0, revealed).map((word, index) => (
          <Fragment key={`${index}-${word}`}>
            <span className="inline-block animate-[wordIn_200ms_ease-out_both]">{word}</span>{' '}
          </Fragment>
        ))}
        {/* A blinking text caret sits at the end, reading as "waiting for input". */}
        <span
          aria-hidden="true"
          className="ml-[1px] inline-block h-[1.1em] w-[2px] translate-y-[0.18em] bg-current animate-[caretBlink_1.06s_step-end_infinite]"
        />
      </p>
    </div>
  );
}
