import React, { useMemo } from 'react';
import { useFlow } from '../flow/FlowProvider';
import { deliveryMethod } from '../data/deliveryMethods';
import {
  formatMoney,
  methodFor,
  quoteFor,
  receiveCurrencyFor,
} from '../flow/selectors';
import SuccessMark from '../ui/SuccessMark';

/**
 * Success — adapted from 429:227684, the only success screen in the file (it
 * sits in the FA-to-FA section). Reused for the main flow, which otherwise
 * dead-ends at Review. Flagged as an extrapolation.
 */
export default function SuccessStep() {
  const { state } = useFlow();
  const { q, recipient, source } = useMemo(() => quoteFor(state), [state]);
  const rail = deliveryMethod(state.draft.deliveryMethodId);

  /**
   * The headline is what LEFT, always in the sender's own currency.
   *
   * It used to switch to the arriving amount on a cross-currency payout, so the
   * screen read "£293.43 sent" when the sender had sent $400.00 — the two sides of
   * the transaction under one verb. The debit is also the figure that reconciles
   * against their statement.
   */
  const sent = formatMoney(q.sendAmount, source.currency);
  const receives = formatMoney(q.receiveAmount, receiveCurrencyFor(state));
  // Sent (before fees) and paid (with them) are different numbers, so the total
  // gets said out loud rather than left to be inferred from the headline.
  const paid = formatMoney(q.totalPay, source.currency);
  // Named on a self-payout, where the destination is the subject of the sentence.
  const method = methodFor(state);

  return (
    <div className="space-y-6">
      <SuccessMark />
      <div className="space-y-1">
        <p className="text-sail-heading-large text-ink">{sent} sent</p>
        <p className="text-sail-label-medium text-ink-muted">
          {subtitle(recipient, rail, receives, method)} You paid {paid}.
        </p>
        {/* Every payout to someone else, not just the ones to a Stripe profile: "has the
            recipient been told" is a question the sender otherwise has to answer by asking
            them, and the answer doesn't depend on the destination type.
            Nobody to notify on a payout to your own account, though — the sender is the
            recipient, and they're reading this. */}
        {!recipient?.isSelf && (
          <p className="text-sail-label-medium text-ink-muted">
            We&rsquo;ll email them to let them know.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Instant rails have already landed; slower ones are still in flight.
 *
 * Every variant names the arriving amount rather than "the funds", states its
 * timing in the same clause as the recipient (the old em-dash tail switched
 * subject halfway through the sentence), and ends in a period. No hedging on the
 * instant rail either: "should have received" invites the reader of a confirmation
 * screen to wonder what went wrong.
 */
function subtitle(recipient, rail, receives, method) {
  // Paying yourself: the destination is the subject, not the business — "Rocket Rides
  // receives" on a payout Rocket Rides made to itself says nothing about where it went.
  const name = recipient?.isSelf
    ? `Your ${method?.label ?? 'external'} account`
    : (recipient?.name ?? 'The recipient');
  // "Arrives in 1–3 business days" -> "in 1–3 business days", "Arrives same day"
  // -> "same day". Taken from etaLong because the short eta doesn't read as a
  // clause: "receives £293.43 same day" works, "receives £293.43 Same day" doesn't.
  const when = rail?.etaLong?.replace(/^Arrives\s+/i, '');
  if (!rail)
    return `${name} receives ${receives}. Arrival depends on their bank.`;
  if (rail.eta === 'Instant') return `${name} received ${receives}.`;
  return `${name} receives ${receives} ${when}.`;
}
