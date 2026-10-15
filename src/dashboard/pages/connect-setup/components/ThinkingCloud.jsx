import { useEffect, useRef, useState } from 'react';

// Verbatim from the design (node `1568:417014`), in this order. Defaulted here so
// the component reads correctly on its own; the call site passes the identical
// `LOADING_LINES`.
const CAPTIONS = [
  'Contemplating onboarding...',
  'Pondering dashboards...',
  'Examining charge types...',
  'Studying fee collection...',
  'Weighing risk management...',
];

// The caption is a single line of `text-body-small` (14px/20), so the slot is
// exactly its 20px line-height — matching the 20px "Text clip" frame in the
// design. Sized off the rendered line-height rather than eyeballed, so no
// caption can ever be clipped or shift the block.
const SLOT_HEIGHT = 20;

/**
 * The "inferring your setup" state: the pre-rendered word-cloud loop from the
 * design (`public/dashboard-assets/connect-setup/loader-words.gif`, a 5.88s
 * forever-loop) with a single caption shuffling vertically underneath it.
 *
 * The caption uses the same mechanism as `ShufflingPlaceholder`: each string sits
 * in a fixed-height slot, the stack translates up one slot at a time, and the
 * first string is cloned at the end so the wrap back to the top happens with the
 * transition switched off and is therefore invisible.
 *
 * Cadence is deliberately NOT what decides when the flow advances — the caption
 * loops forever and `totalMs` decides when we move on, so the demo never has to
 * wait out a full cycle. `holdMs` is the 3s hold the designer specified (Figma's
 * own strip animation holds 3.6s); `slideMs` is the 0.4s slide from that node.
 */
export default function ThinkingCloud({
  lines = CAPTIONS,
  holdMs = 3000,
  slideMs = 400,
  totalMs = 8000,
  onDone,
  className = '',
}) {
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(true);
  const timers = useRef([]);
  const doneRef = useRef(false);

  // Held in a ref so a fresh `onDone` identity each render can't restart the
  // advance timer mid-loading.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  const reduceMotion =
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  // motion: thinking-caption — a 20px translateY step per caption, looping
  // infinitely, since the Figma animation is a loop rather than a one-shot.
  useEffect(() => {
    if (reduceMotion || lines.length < 2) {
      clearTimers();
      setIndex(0);
      setAnimating(true);
      return undefined;
    }

    const step = setInterval(() => {
      setIndex((prev) => prev + 1);
    }, holdMs + slideMs);

    return () => {
      clearInterval(step);
      clearTimers();
    };
  }, [reduceMotion, lines.length, holdMs, slideMs]);

  // Snap back from an effect, not from inside the `setIndex` updater — updaters
  // are double-invoked under StrictMode, which queued two snap-backs per lap.
  useEffect(() => {
    if (index !== lines.length) return undefined;
    const settle = setTimeout(() => {
      setAnimating(false);
      setIndex(0);
    }, slideMs);
    return () => clearTimeout(settle);
  }, [index, lines.length, slideMs]);

  // Re-enable the transition on the next painted frame so the jump isn't animated.
  useEffect(() => {
    if (animating) return undefined;
    const frame = requestAnimationFrame(() => setAnimating(true));
    return () => cancelAnimationFrame(frame);
  }, [animating]);

  // Advancing to step 2 is a separate clock from the caption cadence.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDoneRef.current?.();
    }, totalMs);
    return () => clearTimeout(timer);
  }, [totalMs]);

  // Clone the first caption so the last slide has somewhere to go.
  const stack = lines.length > 1 ? [...lines, lines[0]] : lines;

  return (
    <div className={`flex flex-col items-center justify-center gap-1 ${className}`}>
      {/* Decorative: the cloud carries no information the caption doesn't.
          Served from `public/`, so referenced by path rather than imported. */}
      <img
        src="/dashboard-assets/connect-setup/loader-words.gif"
        alt=""
        aria-hidden="true"
        className="pointer-events-none h-[200px] w-[198px] select-none"
      />

      <div className="py-3">
        {/* The stack holds every caption at once, so it is hidden from screen
            readers and the current one is announced from the live region below. */}
        <div aria-hidden="true" className="overflow-hidden" style={{ height: SLOT_HEIGHT }}>
          <div
            style={{
              transform: `translateY(-${index * SLOT_HEIGHT}px)`,
              transition: animating ? `transform ${slideMs}ms ease-out` : 'none',
            }}
          >
            {stack.map((line, i) => (
              <p
                key={`${i}-${line.slice(0, 12)}`}
                className="text-body-small text-center text-subdued whitespace-nowrap"
                style={{ height: SLOT_HEIGHT }}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
        <p className="sr-only" aria-live="polite">
          {lines[index % lines.length] ?? ''}
        </p>
      </div>
    </div>
  );
}
