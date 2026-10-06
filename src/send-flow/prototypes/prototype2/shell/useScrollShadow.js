import { useEffect, useLayoutEffect, useState } from 'react';

/** How long to keep re-measuring after a change, in ms. Covers the 200ms Reveal
 *  height transition with room to spare. */
const SETTLE_MS = 400;

/**
 * Overflow below this is ignored — subpixel slack only.
 *
 * This used to be 12px, to swallow the phantom overflow a step entry animation's
 * transform contributes (a transform DOES count towards scrollable overflow in
 * Chrome). Measuring is now gated on that animation having finished, so the
 * transform is gone by the time anything is read and the threshold no longer has
 * to hide it.
 */
const MIN_OVERFLOW = 2;

/**
 * The entry animations a step wrapper can play — one per direction of travel, see
 * SendSheet's ENTER_CLASS. Any of them finishing means the incoming step has
 * settled and its height is finally knowable.
 */
const STEP_ENTRY_ANIMATIONS = new Set([
  'sail-step-in-right',
  'sail-step-in-left',
  'sail-subflow-enter',
  'sail-main-scale-up',
]);

/**
 * True while the given scroll container has more content below the fold.
 *
 * The sheet's footer is opaque and sits flush against the scrolling content, so
 * without a cue a half-visible field reads as the end of the form — which is
 * exactly how the KYC address block got missed twice.
 *
 * ## Why this is gated rather than just measured
 *
 * The scroller is shared by every step, so its scrollHeight is only meaningful
 * once the step inside it has settled. Measuring continuously meant the cue
 * flickered on during step changes: the incoming step animates in from
 * `translateY(8px)`, its Reveals settle over 200ms, and a value read mid-flight
 * describes a layout that never existed.
 *
 * So the state is **armed**, not merely measured:
 *
 *   1. A step change disarms it and clears the cue *synchronously*, before paint.
 *      A step that overflows can therefore never leak its cue onto the next one.
 *   2. Nothing is read while disarmed.
 *   3. The step's entry animation ending re-arms it, at which point the transform
 *      is gone and the real height is knowable.
 *
 * The trade is a beat with no cue at the start of each step, which is the right
 * way round: a missing cue for 150ms goes unnoticed, a flashing one doesn't.
 *
 * Measuring reliably after that still needs more than scroll + resize. The
 * scroller's direct child is `h-full`, so it never changes size when content grows
 * inside it, and the things that DO change the scroll height are animated — a
 * Reveal expands over 200ms via grid-template-rows, and a MutationObserver fires
 * at the START of that, when the height hasn't moved yet. So every trigger starts
 * a short re-measure loop rather than measuring once.
 *
 * @param ref   the scroll container
 * @param deps  values that mean "different content" — the step id
 */
export default function useScrollShadow(ref, deps = []) {
  const [overflowing, setOverflowing] = useState(false);

  // Before paint, so the outgoing step's cue is never visible over the incoming
  // one. A plain useEffect here runs a frame late, which is the flash itself.
  useLayoutEffect(() => {
    setOverflowing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frame = null;
    let until = 0;
    // Disarmed until the incoming step has finished animating.
    let armed = false;

    const read = () =>
      el.scrollHeight - el.scrollTop - el.clientHeight > MIN_OVERFLOW;

    const tick = () => {
      if (armed) setOverflowing(read());
      frame = performance.now() < until ? requestAnimationFrame(tick) : null;
    };

    /** Measure now, then keep measuring until the layout settles. */
    const settle = () => {
      until = performance.now() + SETTLE_MS;
      if (frame === null) frame = requestAnimationFrame(tick);
    };

    const onScroll = () => armed && setOverflowing(read());

    const onAnimationEnd = (e) => {
      // Only the step wrapper's own entry animation arms it. Confetti, the
      // success ring and popover pops all bubble to here too, and none of them
      // says anything about whether the step has settled.
      if (STEP_ENTRY_ANIMATIONS.has(e.animationName)) armed = true;
      settle();
    };

    /**
     * Under `prefers-reduced-motion` the step animations are `animation: none`,
     * so `animationend` never fires and nothing would ever arm. Ask the wrapper
     * whether it's animating at all: if it isn't, the layout is already final and
     * there's nothing to wait for.
     */
    const fallback = requestAnimationFrame(() => {
      const wrapper = el.firstElementChild;
      const running =
        wrapper && getComputedStyle(wrapper).animationName !== 'none';
      if (!running) armed = true;
      settle();
    });

    el.addEventListener('scroll', onScroll, { passive: true });
    // A Reveal finishing is a definite end-of-change signal.
    el.addEventListener('transitionend', settle);
    el.addEventListener('animationend', onAnimationEnd);

    const resize = new ResizeObserver(settle);
    resize.observe(el);

    const mutations = new MutationObserver(settle);
    mutations.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      cancelAnimationFrame(fallback);
      if (frame !== null) cancelAnimationFrame(frame);
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('transitionend', settle);
      el.removeEventListener('animationend', onAnimationEnd);
      resize.disconnect();
      mutations.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, ...deps]);

  return overflowing;
}
