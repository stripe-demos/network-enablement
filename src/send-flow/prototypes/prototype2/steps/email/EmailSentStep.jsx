import React from 'react';
import { useFlow } from '../../flow/FlowProvider';
import { acceptWindowDays } from '../../data/emailInvite';
import SuccessMark from '../../ui/SuccessMark';

/**
 * Invite sent.
 *
 * An extrapolation: the designs stop at compose, so the email rail would
 * otherwise dead-end. Follows the same success pattern as the other two terminal
 * screens rather than inventing a third shape.
 */
export default function EmailSentStep() {
  const { state } = useFlow();
  const email = state.emailInvite.email.trim();

  return (
    <div className="space-y-6">
      <SuccessMark />
      <div className="space-y-1">
        <p className="text-sail-heading-large text-ink">Invite sent</p>
        <p className="text-sail-label-medium text-ink-muted">
          {email || 'Your recipient'} has {acceptWindowDays} days to enter their
          details and accept the payout.
        </p>
      </div>
    </div>
  );
}
