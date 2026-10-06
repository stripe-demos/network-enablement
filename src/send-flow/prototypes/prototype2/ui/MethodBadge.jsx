import React from 'react';
import Badge from '../../../components/Badge';

/**
 * Right-hand badge on a destination row.
 *
 * `recommended` marks the Stripe profile — instant and free beats every bank rail —
 * and `lastUsed` marks whatever the sender reached for last, which is what the
 * picker opens selected. They sit on different rows on purpose: the advice and the
 * default disagreeing is what makes the alternative worth a look.
 *
 * Neutral, not green. Green belongs to the Delivery control's "Recommended"
 * (429:222803), where it flags the rail the payout will actually take. Here it's
 * advice about one of several destinations, and two green badges stacked on one
 * screen read as two statuses rather than one recommendation.
 *
 * Shared by every control that lists destinations — Destination and Payout details —
 * so the same row can't wear different badges depending on which screen it's on.
 */
export default function MethodBadge({ method }) {
  if (method?.badge === 'recommended')
    return <Badge variant="default">Recommended</Badge>;
  if (method?.badge === 'lastUsed')
    return <Badge variant="default">Last used</Badge>;
  return null;
}
