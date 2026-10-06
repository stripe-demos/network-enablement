import React, { useRef } from 'react';
import useScrollShadow from './useScrollShadow';

/**
 * The task sheet: a near-full-bleed panel over a translucent scrim.
 *
 * Geometry, radius, shadow and lifecycle are the reference dialog's, verbatim
 * (mmui-prototype/src/components/SendDialog.tsx:436-459):
 *
 *   overlay   fixed inset-0, centred, fades in over 200ms
 *   wrapper   32px padding, scales up from 0.95 over 300ms
 *   panel     h-full w-full max-w-[1376px], rounded 12px, two-drop shadow
 *
 * The panel therefore fills the viewport less 32px on every side rather than
 * being pinned to the 1248x840 Figma frame — the reference dialog scales with
 * the viewport and caps at 1376px, and matching it is the point.
 *
 * Clicking the scrim asks to close, exactly as the reference does; `onRequestClose`
 * routes through SendSheet so mid-flow it raises the confirmation rather than
 * discarding silently.
 */
export default function TaskSheet({
  header,
  footer,
  children,
  overlay,
  stepId,
  transitioning = false,
  closing = false,
  onRequestClose,
}) {
  const scrollRef = useRef(null);
  // Re-measure on step change: each step has its own content height.
  const measured = useScrollShadow(scrollRef, [stepId]);
  // The hook already refuses to report anything until the incoming step has
  // settled. This additionally covers the sheet's own closing animation, where
  // `leaving` is true and no step change follows to disarm the hook.
  const overflowing = measured && !transitioning;

  return (
    // data-step is the stable hook the verification harness reads, so tests
    // don't depend on step content that changes as screens get built.
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        closing ? 'sail-overlay-out' : 'sail-overlay-in'
      }`}
      data-step={stepId}
      onClick={onRequestClose}
    >
      <div className="absolute inset-0 bg-scrim" />

      {/* The scale lives on the wrapper, not the panel: scaling the panel itself
          would scale its 12px radius and its shadow along with it. */}
      <div
        className={`relative flex h-full w-full items-center justify-center p-8 ${
          closing ? 'sail-panel-out' : 'sail-panel-in'
        }`}
      >
        {/* stopPropagation belongs on the PANEL, not on this wrapper. The wrapper
            is w-full h-full, so guarding it swallows every click in the 32px
            gutter and either side of the 1376px cap — which is the whole of
            "outside". The reference guards the wrapper and its own scrim click is
            consequently dead; this keeps its structure and makes the behaviour
            work. */}
        <div
          className="relative flex h-full w-full max-w-[1376px] flex-col overflow-hidden rounded-sheet bg-canvas shadow-sheet"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          {header}

          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
            {children}
          </div>

          {/* Lifts the footer off the content while there's more to scroll to.
              Without it a half-visible field reads as the end of the form.

              A radial pool centred on the sheet rather than a box-shadow: an
              edge-to-edge shadow draws a hard line right across the sheet and
              reads as a divider. This fades out towards both edges, so it reads
              as depth under the content instead. */}
          <div
            className="relative z-10 shrink-0"
            data-overflowing={overflowing ? '' : undefined}
          >
            {/* Keyed on the step so a step change REMOUNTS this rather than
                transitioning it. The hook clears `overflowing` before paint, but a
                200ms opacity transition still has to run down from 1 — so leaving
                a tall step left the cue fading out over the incoming short one,
                which is the flash. A fresh element starts at opacity-0 with
                nothing to animate from; within a step, scrolling still fades. */}
            <span
              key={stepId}
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 bottom-full h-4 transition-opacity duration-200 motion-reduce:transition-none ${
                overflowing ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ background: 'var(--gradient-scroll-cue)' }}
            />
            {footer}
          </div>

          {/* Washes over the whole panel, chrome included — so it has to be a
              child of the panel rather than a sibling of the sheet. */}
          {overlay}
        </div>
      </div>
    </div>
  );
}
