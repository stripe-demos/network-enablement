import React, {
  createContext,
  useContext,
  useMemo,
  useReducer,
  useCallback,
  useRef,
} from 'react';
import { reducer, initialState } from './reducer';
import { getStep } from './graph';
import { buildPayoutRecord } from './payoutRecord';

const FlowContext = createContext(null);

/** Fake latency on submit. Instant success reads as broken to test participants;
 *  this is new work, not in the designs. */
const SUBMIT_LATENCY_MS = 750;

export function FlowProvider({ children, onClose }) {
  const [state, dispatch] = useReducer(
    reducer,
    initialState,
    seedFromQueryParam,
  );

  // `stateRef` so the snapshot is taken from the state at submit time rather than
  // from whatever this callback closed over.
  const stateRef = useRef(state);
  stateRef.current = state;

  const submit = useCallback(() => {
    dispatch({ type: 'SUBMIT_PENDING' });
    const payoutId = `po_${Math.random().toString(36).slice(2, 12)}`;
    const sentAt = new Date().toISOString();
    window.setTimeout(() => {
      const current = stateRef.current;
      dispatch({
        type: 'SUBMIT_DONE',
        payoutId,
        sentAt,
        // Only the payout rail has a record to show; the email rail sends an invite.
        snapshot:
          current.cursor.rail === 'email'
            ? null
            : buildPayoutRecord(current, { payoutId, sentAt }),
      });
    }, SUBMIT_LATENCY_MS);
  }, []);

  const value = useMemo(() => {
    const step = getStep(state.cursor);
    return {
      state,
      dispatch,
      step,
      submit,
      onClose,
      next: () =>
        step.isSubmit ? submit() : dispatch({ type: 'NAVIGATE_NEXT' }),
      back: () => dispatch({ type: 'NAVIGATE_BACK' }),
      goto: (stepId, rail) => dispatch({ type: 'GOTO', stepId, rail }),
      enterSubflow: (rail, stepId, seed) =>
        dispatch({ type: 'ENTER_SUBFLOW', rail, stepId, seed }),
      /** Abandon the sub-flow and return to the step that opened it. What the
       *  first breadcrumb crumb does. */
      exitSubflow: () => dispatch({ type: 'EXIT_SUBFLOW', commit: false }),
      setUi: (path, v) => dispatch({ type: 'SET_UI', path, value: v }),
      patchDraft: (path, v) =>
        dispatch({ type: 'PATCH_DRAFT', path, value: v }),
      patchNewRecipient: (path, v) =>
        dispatch({ type: 'PATCH_NEW_RECIPIENT', path, value: v }),
      patchVop: (path, v) => dispatch({ type: 'PATCH_VOP', path, value: v }),
      patchEmailInvite: (path, v) =>
        dispatch({ type: 'PATCH_EMAIL_INVITE', path, value: v }),
      reset: () => dispatch({ type: 'RESET' }),
    };
  }, [state, submit, onClose]);

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

export function useFlow() {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error('useFlow must be used inside a FlowProvider');
  return ctx;
}

/**
 * Moderator step jump: /prototype2?step=email.compose
 *
 * There are no dashboard entry points (no frame draws a dashboard), so without
 * this the email rail and the sub-flow are unreachable during a session.
 */
function seedFromQueryParam(base) {
  if (typeof window === 'undefined') return base;
  const requested = new URLSearchParams(window.location.search).get('step');
  if (!requested) return base;
  try {
    const step = getStep({ stepId: requested });
    return { ...base, cursor: { rail: step.rail, stepId: step.id } };
  } catch {
    console.warn(`[prototype2] Unknown ?step= value: ${requested}`);
    return base;
  }
}
