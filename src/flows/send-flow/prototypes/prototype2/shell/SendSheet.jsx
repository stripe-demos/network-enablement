import React, { useCallback, useEffect, useRef, useState } from 'react';
import TaskSheet from './TaskSheet';
import SheetHeader from './SheetHeader';
import SheetFooter from './SheetFooter';
import ContentColumn from './ContentColumn';
import ExitConfirm from './ExitConfirm';
import { useFlow } from '../flow/FlowProvider';
import { RAILS } from '../flow/graph';
import { asideFor, componentFor } from '../flow/registry';
import { selectors } from '../flow/selectors';

/** Must match --sail-subflow-out-ms in theme.css. */
const SUBFLOW_OUT_MS = 300;
/** Must match --sail-panel-out-ms — the sheet's own fade before it's gone. */
const SHEET_OUT_MS = 200;

/**
 * Which way a step change moves, derived from the two steps alone.
 *
 * Direction is NOT stored in flow state deliberately: `next`, `back`, `goto` and
 * `enterSubflow` would each have to remember to set it, and the one that forgot
 * would animate the wrong way. Rail membership and rail order already say
 * everything needed.
 *
 * Crossing into any non-main rail (add recipient, email) is a sub-flow entry; the
 * only way back out is into `main`.
 */
function motionKind(from, to) {
  if (from.rail !== to.rail) {
    return to.rail === 'main' ? 'subflow-exit' : 'subflow-enter';
  }
  const rail = RAILS[to.rail];
  return rail.indexOf(to.id) < rail.indexOf(from.id) ? 'backward' : 'forward';
}

/** The animation the INCOMING content plays. */
const ENTER_CLASS = {
  forward: 'sail-step-in-right',
  backward: 'sail-step-in-left',
  'subflow-enter': 'sail-subflow-enter',
  'subflow-exit': 'sail-main-scale-up',
};

/**
 * The animation the OUTGOING content plays — sub-flow boundaries only. Main-flow
 * steps have no exit beat in the reference: the departing step is replaced at
 * once, which is what makes Back feel immediate. A kind missing from here is
 * therefore a same-rail move, and that's load-bearing below.
 */
const EXIT_CLASS = {
  'subflow-enter': 'sail-main-scale-down',
  'subflow-exit': 'sail-subflow-exit',
};

/**
 * Renders whatever the step registry declares. There is deliberately no
 * per-step branching here — that is what turned the original's header into ~75
 * lines of nested ternaries (SendModal2.jsx:1270-1345). The same applies to
 * motion: direction comes from the graph, never from a per-step flag.
 */
export default function SendSheet({ onViewPayout }) {
  const { state, step, next, back, exitSubflow, onClose } = useFlow();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const contentRef = useRef(null);

  /**
   * `shown` is what's rendered; `step` is where the flow actually is. They differ
   * only during a sub-flow boundary's exit beat, where the departing side has to
   * stay mounted long enough to recede.
   *
   * Chrome (header, footer) follows `step` immediately — its disabled state and
   * labels should tell the truth about the current step, not the departing one.
   */
  const [shown, setShown] = useState(step);
  const [motion, setMotion] = useState(null);

  useEffect(() => {
    if (step.id === shown.id) return;
    const kind = motionKind(shown, step);

    // Same-rail move: swap now, slide the new step in from the side.
    if (!EXIT_CLASS[kind]) {
      setShown(step);
      setMotion({ kind, phase: 'in' });
      return;
    }

    // Sub-flow boundary: let the departing side recede first, then swap.
    setMotion({ kind, phase: 'out' });
    const t = window.setTimeout(() => {
      setShown(step);
      setMotion({ kind, phase: 'in' });
    }, SUBFLOW_OUT_MS);
    return () => window.clearTimeout(t);
  }, [step, shown]);

  const leaving = motion?.phase === 'out';
  const motionClass = motion
    ? (leaving ? EXIT_CLASS : ENTER_CLASS)[motion.kind]
    : '';

  const StepComponent = componentFor(shown.id);
  /**
   * Any step field may be declared as a function of state rather than a constant.
   * The attach path uses all three: it retitles ar.method/ar.form with the
   * recipient's name, renames the breadcrumb to "Add payout method", and drops
   * ar.method's Continue.
   */
  const resolve = (v) => (typeof v === 'function' ? v(state) : v);
  const headingOf = (st) => resolve(st.heading);
  const Aside = asideFor(shown.id);

  const canContinue = step.canContinue(state);
  const footerVariant = resolve(step.footer) ?? 'default';
  // Whether there's a primary action at all — 'back' draws only the way out, so
  // Enter must not try to advance from it.
  const hasPrimary = footerVariant !== 'none' && footerVariant !== 'back';

  // Derived, not stored: show the exit confirmation whenever there's progress to
  // lose. The original kept an identical `confirmSteps` array in three places.
  const shouldConfirmExit =
    step.confirmOnExit && state.history.length > 0 && !state.result;

  /**
   * Play the sheet out, then actually close. The reference dialog does the same
   * (SendDialog.tsx:429-432) — the panel scales back down to 0.95 as the scrim
   * fades, rather than vanishing on the frame the click lands.
   */
  const finishClose = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => onClose?.(), SHEET_OUT_MS);
  }, [onClose]);

  /**
   * Both the close X and a scrim click come through here, so clicking outside
   * mid-flow raises the confirmation rather than discarding the draft — the one
   * deliberate departure from the reference, which has no draft to lose.
   */
  const requestClose = useCallback(
    () => (shouldConfirmExit ? setConfirmOpen(true) : finishClose()),
    [shouldConfirmExit, finishClose],
  );

  /**
   * Move focus into the new step so keyboard and screen-reader users aren't left
   * on a button that no longer exists. Prefer the first text field; otherwise
   * focus the content region itself, which is labelled by the step heading.
   *
   * Skipped when a step already claimed focus via autoFocus (Payout details).
   */
  useEffect(() => {
    if (leaving) return; // wait for the incoming content
    if (closing) return; // nothing to focus in a sheet that's on its way out
    const root = contentRef.current;
    if (!root) return;
    if (
      root.contains(document.activeElement) &&
      document.activeElement !== root
    )
      return;

    const field = root.querySelector(
      'input:not([type=checkbox]):not([disabled]), textarea:not([disabled])',
    );
    (field ?? root).focus({ preventScroll: true });
  }, [shown.id]);

  /**
   * Enter advances, Escape closes.
   *
   * Two guards worth keeping: Enter must not hijack newlines in a textarea or
   * double-fire on a focused button, and Escape belongs to an open popover first
   * — dropdowns dismiss themselves via usePopover, so closing the whole sheet on
   * the same keypress would be destructive.
   */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (confirmOpen) return;

      const popoverOpen = Boolean(
        document.querySelector('[aria-expanded="true"]'),
      );
      const t = e.target;

      if (e.key === 'Escape') {
        if (popoverOpen) return;
        e.preventDefault();
        requestClose();
        return;
      }

      if (e.key === 'Enter') {
        if (popoverOpen) return;
        if (t instanceof HTMLTextAreaElement) return;
        if (t instanceof HTMLButtonElement || t instanceof HTMLAnchorElement)
          return;
        if (!hasPrimary || !canContinue || state.pending) return;
        e.preventDefault();
        next();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [confirmOpen, requestClose, next, canContinue, hasPrimary, state.pending]);

  return (
    <>
      <TaskSheet
        stepId={step.id}
        transitioning={leaving || step.id !== shown.id}
        closing={closing}
        onRequestClose={requestClose}
        overlay={
          confirmOpen ? (
            <ExitConfirm
              onKeepEditing={() => setConfirmOpen(false)}
              onExit={() => {
                setConfirmOpen(false);
                finishClose();
              }}
            />
          ) : null
        }
        header={
          <SheetHeader
            label={step.headerLabel}
            breadcrumb={resolve(step.breadcrumb)}
            onClose={requestClose}
            onExitSubflow={exitSubflow}
          />
        }
        footer={
          <SheetFooter
            variant={footerVariant}
            showBack={
              typeof step.showBack === 'function'
                ? step.showBack(state)
                : step.showBack
            }
            backLabel={step.backLabel}
            primaryLabel={step.primaryLabel(state, selectors)}
            secondaryLabel={step.secondaryLabel?.(state, selectors)}
            canContinue={canContinue}
            pending={state.pending}
            onBack={back}
            // A dual footer is just two buttons; only a `terminal` step closes
            // the sheet. ar.saved shares the shape but continues into the payout.
            onPrimary={step.terminal ? onClose : next}
            // "View payout" opens the detail page (502:68434) when there's a
            // payout to show; on the invite screen there isn't one, so it closes.
            onSecondary={
              step.terminal
                ? state.result?.snapshot && onViewPayout
                  ? onViewPayout
                  : onClose
                : next
            }
          />
        }
      >
        {/* Keyed so each step gets the entry animation; tabIndex -1 makes it a
            focus target when a step has no field to focus. */}
        <div
          key={shown.id}
          ref={contentRef}
          tabIndex={-1}
          role="group"
          aria-label={headingOf(shown) ?? shown.headerLabel ?? 'Step'}
          className={`${motionClass} h-full outline-none`}
        >
          <ContentColumn
            layout={shown.layout}
            heading={headingOf(shown)}
            gutter={Aside ? <Aside /> : null}
          >
            <StepComponent />
          </ContentColumn>
        </div>
      </TaskSheet>

      {/* Announce step changes to screen readers, which otherwise get no cue
          because the sheet never remounts. */}
      <p aria-live="polite" className="sr-only">
        {headingOf(step) ?? step.headerLabel}
      </p>
    </>
  );
}
