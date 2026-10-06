import React, { useMemo } from 'react';
import { useFlow } from '../flow/FlowProvider';
import { deliveryMethod } from '../data/deliveryMethods';
import { methodLine } from '../data/payoutMethods';
import { feeRows } from '../flow/quote';
import {
  currencySymbol,
  exchangeRateLine,
  formatMoney,
  methodFor,
  quoteFor,
  receiveCurrencyFor,
} from '../flow/selectors';
import GroupedCard from '../ui/GroupedCard';
import KVRow from '../ui/KVRow';
import TransferSummary from '../ui/TransferSummary';
import FeeLadder from '../ui/FeeLadder';
import { ladderGroups } from '../ui/ladderGroups';

/**
 * Review — one ledger, then the facts.
 *
 * The three stacked cards this replaced (429:224598) split the transfer across a
 * headline amount, a From/To pair and a fee breakdown, which meant the debit, the
 * charges and the landing amount were each in a different box. They're one block now:
 * the account the money leaves with its total, the deductions on the rail beneath it,
 * and the destination with what arrives.
 *
 * Everything that isn't the arithmetic — rail, arrival, references — sits below as
 * plain rows. It's confirmation detail, and a panel around it competed with the ledger
 * for the same glance.
 */
export default function ReviewStep() {
  const { state } = useFlow();
  const { q, source, recipient } = useMemo(() => quoteFor(state), [state]);

  const method = methodFor(state);
  const rail = deliveryMethod(state.draft.deliveryMethodId);
  const receiveCurrency = receiveCurrencyFor(state);

  /**
   * The same ladder the input screen shows, built by the same helper: one breakdown, one set
   * of operators, one collapsible Fees row. Review used to list the charges flat, which meant
   * a sender who opened "Fees" on the previous screen met a different shape here.
   */
  const groups = useMemo(
    () =>
      ladderGroups({
        q,
        rows: feeRows(q),
        format: (n) => formatMoney(n, source.currency),
      }),
    [q, source.currency, receiveCurrency],
  );

  const reference = state.draft.reference;
  const note = state.draft.note;
  const scheduled =
    state.draft.timing.when !== 'now' && state.draft.timing.date;

  return (
    <div>
      <GroupedCard>
        <TransferSummary
          from={{
            ...split(q.totalPay, source.currency),
            sign: '−',
            name: source.name,
            detail: source.currency,
            country: source.country,
            group: 'account',
          }}
          to={{
            ...split(q.receiveAmount, receiveCurrency),
            sign: '+',
            name: recipient?.name ?? 'Recipient',
            detail: method ? methodLine(method) : null,
            logo: method?.logo ?? recipient?.logo,
            country: method?.country ?? recipient?.country,
            group: method?.group,
          }}
        >
          {groups.length > 0 && <FeeLadder groups={groups} variant="ledger" />}
        </TransferSummary>
      </GroupedCard>

      {/* No card: these are the facts of the transfer, not part of its arithmetic. */}
      <div className="mt-5 px-1">
        <KVRow label="Delivery method" value={rail?.label ?? '—'} />
        {/* The frame reads "Instantly" against Standard ACH, which contradicts
            itself. Using the selected rail's real ETA instead. */}
        <KVRow label="Estimated arrival" value={rail?.eta ?? '—'} />
        {/* Only when the sender moved the payout off today — "today" is the default,
            and a row confirming the default is a row they read past. */}
        {scheduled && (
          <KVRow label="Payout date" value={state.draft.timing.date} />
        )}
        {reference.enabled && reference.value && (
          <KVRow label="Recipient reference" value={reference.value} />
        )}
        {note.enabled && note.value && (
          <KVRow label="Internal note" value={note.value} />
        )}
      </div>
    </div>
  );
}

/**
 * An amount split into its symbol and its digits, so the ledger can set the symbol in
 * the regular weight beside bold figures.
 */
function split(value, currency) {
  const symbol = currencySymbol(currency);
  const formatted = formatMoney(value, currency);
  return { symbol, digits: formatted.slice(symbol.length).trim() };
}
