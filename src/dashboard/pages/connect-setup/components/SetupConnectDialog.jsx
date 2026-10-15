import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { font } from '@dashboard/ui';
import { Icon } from './Icon';
import StepRail from './StepRail';

// Same layer as the network onboarding dialog: above Drawer (10011), toasts
// (10002) and the app chrome, below the prototype controls (10040).
const Z_INDEX = 10020;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The near-fullscreen "Set up Connect" shell (ported from connect-onboarding
 * prototype4): dimmed backdrop, panel, small title label, close affordance,
 * persistent left step rail, and a footer that splits actions left and right.
 *
 * This is deliberately its own shell rather than the Dashboard's dialog: the
 * design needs a subdued title label, a two-column body, and a left/right
 * footer. Rendered in a portal on <body>, like the network onboarding dialog.
 */
export default function SetupConnectDialog({
  title = 'Set up Connect',
  steps = [],
  showRail = true,
  showFooter = true,
  // Changing this re-keys the content pane so it soft-fades between steps.
  transitionKey,
  onClose,
  footerLeft,
  footerRight,
  children,
}) {
  const dialogRef = useRef(null);

  // Lock page scroll and move focus into the dialog while open; on close, hand
  // focus back to whatever opened it.
  useLayoutEffect(() => {
    const previouslyFocused = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = overflow;
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, []);

  // Escape to dismiss (steps can call e.preventDefault() to keep it open).
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !event.defaultPrevented) onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Keep Tab / Shift+Tab inside the dialog.
  const trapFocus = (event) => {
    if (event.key !== 'Tab') return;
    const dialog = dialogRef.current;
    const nodes = [...dialog.querySelectorAll(FOCUSABLE)].filter(
      (node) => node.offsetParent !== null || node === document.activeElement
    );
    if (!nodes.length) {
      event.preventDefault();
      return;
    }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const inside = dialog.contains(document.activeElement);
    if (event.shiftKey && (document.activeElement === first || !inside || document.activeElement === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !inside)) {
      event.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      // Opened from Home's setup guide, which stays real while the page is wireframed.
      data-wireframe-show=""
      className="fixed inset-0 flex animate-[fadeIn_150ms_ease-out] items-center justify-center text-default"
      style={{ zIndex: Z_INDEX, fontFamily: font.text, WebkitFontSmoothing: 'antialiased' }}
    >
      <div className="absolute inset-0 bg-overlay-backdrop" onClick={onClose} />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onKeyDown={trapFocus}
        className="relative flex h-[calc(100%-48px)] w-[88%] flex-col overflow-hidden rounded-xl bg-surface shadow-xl outline-none animate-[scaleIn_150ms_ease-out]"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between px-6 pt-5">
          <span className="text-label-medium text-default">{title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mt-1 flex size-7 cursor-pointer items-center justify-center rounded text-icon-subdued transition-colors hover:bg-offset"
          >
            <Icon name="cancel" size="small" fill="currentColor" />
          </button>
        </div>

        {/* Body: rail + content. The inference state drops both the rail and the
            footer and centres its content instead. */}
        {showRail ? (
          <div className="flex min-h-0 flex-1 gap-8 px-6 pt-10">
            <StepRail steps={steps} className="w-[250px] shrink-0 animate-soft-rise" />
            <div className="-ml-1 min-h-0 flex-1 overflow-y-auto pb-6 pl-1 pr-2">
              {/* motion: step-transition — re-keying replays the stagger, so each
                  step's sections float up and fade in top to bottom. */}
              <div key={transitionKey} className="stagger-rise max-w-[580px]">
                {children}
              </div>
            </div>
          </div>
        ) : (
          <div
            key={transitionKey}
            className="stagger-rise flex min-h-0 flex-1 items-center justify-center px-6"
          >
            {children}
          </div>
        )}

        {showFooter && (
          <div
            className="flex shrink-0 animate-soft-rise items-center justify-between gap-3 px-6 py-5"
            style={{ animationDelay: '240ms' }}
          >
            <div className="flex items-center gap-2">{footerLeft}</div>
            <div className="flex items-center gap-2">{footerRight}</div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
