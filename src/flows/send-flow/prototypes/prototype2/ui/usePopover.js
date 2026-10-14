import { useCallback, useRef, useState } from 'react';
import useDismiss from './useDismiss';

/** Must match --sail-pop-out-ms in theme.css. */
const POPOVER_OUT_MS = 100;

/**
 * Open/close state for a popover, with an exit phase so it can fade out rather
 * than vanish.
 *
 * Owns two refs: `ref` wraps the trigger (and is what the panel is positioned
 * against), `panelRef` is attached to the portalled panel. Dismissal checks both,
 * since the panel isn't a DOM descendant of the trigger.
 *
 * `aria-expanded` reports false as soon as closing begins, so the sheet's Escape
 * handler doesn't treat a departing menu as still open.
 */
export default function usePopover() {
  const ref = useRef(null);
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const timer = useRef(null);

  const close = useCallback(() => {
    if (!open || closing) return;
    setClosing(true);
    timer.current = window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, POPOVER_OUT_MS);
  }, [open, closing]);

  const toggle = useCallback(() => {
    if (open) close();
    else {
      window.clearTimeout(timer.current);
      setClosing(false);
      setOpen(true);
    }
  }, [open, close]);

  useDismiss([ref, panelRef], close, open && !closing);

  return {
    ref,
    panelRef,
    open,
    closing,
    expanded: open && !closing,
    toggle,
    close,
    animation: closing ? 'sail-pop-out' : 'sail-pop-in',
  };
}
