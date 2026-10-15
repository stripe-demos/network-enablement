import { useEffect, useRef, useState } from 'react';

/**
 * The step-1 placeholder, which cycles through the example descriptions by
 * sliding vertically — each string sits in a fixed-height slot and the stack
 * translates up by one slot at a time.
 *
 * A native `placeholder` attribute can't animate, so this renders as an overlay
 * behind the caret. It is `pointer-events-none` so clicks and typing still land
 * on the textarea underneath.
 *
 * Seamless looping: the first item is duplicated at the end of the stack. When
 * the slide reaches that clone the transition is switched off and the offset
 * snaps back to zero, so the wrap is invisible.
 *
 * Each string is held for 3000ms, per the designer, with the 400ms slide on top.
 * `slotHeight` must be a whole number of rendered line-heights or strings clip —
 * see the note on the default below.
 */
export default function ShufflingPlaceholder({
  items = [],
  active = true,
  // 3 × 24px line-height. `text-body-medium` is 16px/24, and nine of the eleven
  // example descriptions wrap to three lines at this width, so a two-line slot
  // would cut them off mid-sentence.
  slotHeight = 72,
  holdMs = 3000,
  slideMs = 400,
  className = '',
}) {
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(true);
  const timers = useRef([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  const reduceMotion =
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    if (!active || reduceMotion || items.length < 2) {
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
  }, [active, reduceMotion, items.length, holdMs, slideMs]);

  // The snap back to the top is driven from an effect rather than from inside the
  // `setIndex` updater: updaters are double-invoked under StrictMode, so
  // scheduling a timer in there queued two snap-backs per lap.
  useEffect(() => {
    if (index !== items.length) return undefined;
    const settle = setTimeout(() => {
      setAnimating(false);
      setIndex(0);
    }, slideMs);
    return () => clearTimeout(settle);
  }, [index, items.length, slideMs]);

  // Re-enable the transition on the next painted frame, so the jump itself is
  // never animated. rAF is exact where a guessed timeout was not.
  useEffect(() => {
    if (animating) return undefined;
    const frame = requestAnimationFrame(() => setAnimating(true));
    return () => cancelAnimationFrame(frame);
  }, [animating]);

  if (items.length === 0) return null;

  // Clone the first item so the last slide has somewhere to go.
  const stack = items.length > 1 ? [...items, items[0]] : items;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none overflow-hidden ${className}`}
      style={{ height: slotHeight }}
    >
      <div
        style={{
          transform: `translateY(-${index * slotHeight}px)`,
          transition: animating ? `transform ${slideMs}ms ease-out` : 'none',
        }}
      >
        {stack.map((item, i) => (
          <p
            key={`${i}-${item.slice(0, 12)}`}
            className="text-body-medium text-placeholder"
            style={{ height: slotHeight }}
          >
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}
