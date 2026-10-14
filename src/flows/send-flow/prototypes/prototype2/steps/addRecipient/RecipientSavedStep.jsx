import React, { useEffect } from 'react';
import { useFlow } from '../../flow/FlowProvider';
import SuccessMark from '../../ui/SuccessMark';

/**
 * How long the screen holds before continuing on its own.
 *
 * Long enough to read two lines and register the name, short enough that nobody
 * wonders whether the flow has stalled. The ring closes over exactly this, so the
 * wait is visible rather than a surprise — and Continue is still there for anyone
 * who doesn't want to wait for it.
 */
const HOLD_MS = 5000;

/**
 * Recipient saved — 464:263845.
 *
 * Sits between Save and returning to the payout, so the sub-flow confirms itself
 * rather than silently teleporting the user back into the main flow.
 *
 * The name is read from the scratch `newRecipient` rather than from the committed
 * list: the commit happens on Continue (EXIT_SUBFLOW), which keeps a single
 * commit point in the reducer.
 */
export default function RecipientSavedStep() {
  const { state, next } = useFlow();

  useEffect(() => {
    const t = setTimeout(next, HOLD_MS);
    // Clearing on unmount is what makes pressing Continue safe: the step leaves,
    // the timer dies, and `next` can't fire a second time from the next screen.
    return () => clearTimeout(t);
  }, [next]);

  return (
    <div className="space-y-6">
      <SuccessMark countdown={HOLD_MS} />
      <div className="space-y-1">
        {state.newRecipient.attachTo ? (
          <>
            <p className="text-sail-heading-large text-ink">
              Destination added
            </p>
            <p className="text-sail-label-medium text-ink-muted">
              Saved to {displayName(state.newRecipient) || 'this recipient'}
            </p>
          </>
        ) : (
          <>
            <p className="text-sail-heading-large text-ink">
              {displayName(state.newRecipient)} added
            </p>
            <p className="text-sail-label-medium text-ink-muted">
              Saved to your recipients list
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function displayName(n) {
  if (n.type === 'company') return n.companyName.trim() || 'Recipient';
  return (
    [n.firstName, n.lastName].filter(Boolean).join(' ').trim() || 'Recipient'
  );
}
