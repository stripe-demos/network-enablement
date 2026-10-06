import React from 'react';
import { Icon } from '../../../../icons/SailIcons';
import { useFlow } from '../../flow/FlowProvider';
import { payoutMethod } from '../../data/payoutMethods';
import { payeeName, suggestedName, vopCheck } from '../../data/vop';
import GroupedCard from '../../ui/GroupedCard';

/**
 * Recipient verification — the sub-flow the Destination step's blocker opens.
 *
 * Two names side by side: the one the sender holds, and the one the bank returned. That
 * comparison IS the screen, so it replaced the editable name fields that used to be here —
 * the sender isn't correcting a typo of their own, they're deciding whether to accept what the
 * bank says, and a pair of text inputs asked them to retype it instead.
 *
 * The glyph marks the disputed row, so which of the two is in question doesn't depend on
 * reading both labels.
 */
export default function VerifyPayeeStep() {
  const { state } = useFlow();
  const method = payoutMethod(state.vop.methodId);
  const check = vopCheck(method);

  // Seeded into the sub-flow when it opened, so the row keeps saying what was provided even
  // after the suggestion is accepted.
  const provided =
    [state.vop.firstName, state.vop.lastName].filter(Boolean).join(' ') ||
    payeeName(method);

  return (
    <div className="space-y-5">
      <p className="text-sail-label-medium text-ink-muted">
        The recipient details closely match their bank account details. Click
        accept suggestion to match and update the recipient.
      </p>

      <GroupedCard>
        <Row label="Name provided" value={provided} flagged />
        <Row label="Name on account" value={suggestedName(check)} />
      </GroupedCard>
    </div>
  );
}

function Row({ label, value, flagged = false }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-sail-label-medium text-ink-muted">{label}</span>
      <span className="flex shrink-0 items-center gap-2">
        {/* Emphasized on both rows: the two names are the comparison, and muting either would
            say which to prefer before the sender has decided. */}
        <span className="text-sail-label-medium-emphasized text-ink">
          {value}
        </span>
        {flagged && (
          <Icon
            name="warningCircle"
            size="small"
            className="shrink-0 text-action-link"
          />
        )}
      </span>
    </div>
  );
}
