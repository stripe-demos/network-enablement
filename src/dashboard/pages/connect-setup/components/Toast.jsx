import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

/**
 * A confirmation toast, centered along the bottom edge of the viewport.
 *
 * Rendered through a portal on `document.body` so it escapes the dialog's
 * stacking/clipping and sits above it (the setup dialog is z-[10020]). It's an
 * inverted surface — dark background, light text — matching the Sail toast, so
 * the color values are intentionally fixed rather than themed. Auto-dismisses
 * after `duration` ms; `role="status"` announces it to screen readers.
 * `data-wireframe-show` keeps it at full fidelity on wireframed pages.
 */
export default function Toast({ open, message, onClose, duration = 4000 }) {
  useEffect(() => {
    if (!open) return undefined;
    const timer = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      data-wireframe-show=""
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[10040] flex justify-center px-4"
    >
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto flex min-h-[44px] animate-[toastIn_200ms_ease-out] items-center rounded-[6px] pl-4 shadow-[0px_15px_35px_0px_rgba(48,49,61,0.08),0px_5px_15px_0px_rgba(0,0,0,0.12)]"
        style={{ backgroundColor: '#273951' }}
      >
        <div className="flex items-center gap-2 py-2 pr-4">
          <Icon name="checkCircleFilled" size="medium" fill="currentColor" className="shrink-0 text-white" />
          <span className="text-body-small text-white">{message}</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
