import { useEffect } from 'react';

/**
 * One click-outside + Escape hook for every popover in the flow.
 *
 * Takes a LIST of refs because popover panels render in a portal at body level:
 * the panel is not a DOM descendant of its trigger, so a single containment
 * check would treat clicking a menu item as an outside click and dismiss before
 * the item's handler ran.
 *
 * The original had roughly fifteen near-identical useRef + useEffect
 * click-outside blocks (SendModal2.jsx:1043-1176), each subtly different.
 */
export default function useDismiss(refs, onDismiss, active = true) {
  useEffect(() => {
    if (!active) return;

    const list = Array.isArray(refs) ? refs : [refs];
    const inside = (target) => list.some((r) => r.current?.contains(target));

    const onPointerDown = (e) => {
      if (!inside(e.target)) onDismiss();
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onDismiss();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [refs, onDismiss, active]);
}
