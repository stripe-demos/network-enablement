import { deliveryMethod } from '../data/deliveryMethods';
import { country } from '../data/countries';
import { feeRows } from './quote';
import {
  exchangeRateLine,
  formatAmountBare,
  formatMoney,
  methodFor,
  quoteFor,
  receiveCountryFor,
  receiveCurrencyFor,
} from './selectors';

/**
 * A payout as sent — the record the detail page reads.
 *
 * Built once at submit and frozen into `result.snapshot`, so going Back and
 * editing the draft can't retroactively change a payout that has already been
 * made. Everything is pre-formatted here for the same reason: the record should
 * not re-derive money from live state.
 */
export function buildPayoutRecord(state, { payoutId, sentAt }) {
  const { q, source, recipient } = quoteFor(state);
  const method = methodFor(state);
  const rail = deliveryMethod(state.draft.deliveryMethodId);
  const receiveCurrency = receiveCurrencyFor(state);
  const place = country(receiveCountryFor(state));

  const sent = new Date(sentAt);
  const arrival = new Date(sent.getTime() + arrivalOffsetMs(rail));

  return {
    payoutId,
    sentAt,

    // Header
    status: rail?.eta === 'Instant' ? 'Posted' : 'In transit',
    // The header prints the currency code separately, so the amount omits an
    // alphabetic symbol to avoid "CHF 1,975.00 CHF".
    amount: formatAmountBare(q.receiveAmount, receiveCurrency),
    currency: receiveCurrency,
    recipientName: recipient?.name ?? 'Recipient',

    // Timeline, newest first as the frame draws it
    timeline: [
      ...(rail?.eta === 'Instant'
        ? [{ key: 'posted', label: 'Payout posted', at: stamp(sent) }]
        : []),
      {
        key: 'initiated',
        label: `Payout initiated to ${recipient?.name ?? 'recipient'}`,
        at: stamp(sent),
      },
    ],

    // Summary — the same feeRows the ladder and Review use
    summary: {
      totalPaid: formatMoney(q.totalPay, source.currency),
      fees: feeRows(q).map((r) => ({
        ...r,
        value: formatMoney(r.value, source.currency),
      })),
      converted: q.isFx
        ? {
            amount: formatMoney(q.sendAmount, source.currency),
            rate: exchangeRateLine(q, source.currency, receiveCurrency),
          }
        : null,
      received: formatMoney(q.receiveAmount, receiveCurrency),
    },

    // Details column
    recipient: {
      name: recipient?.name ?? 'Recipient',
      country: recipient?.country ?? 'US',
      countryName: place.name,
    },
    method: {
      last4: method?.last4 ?? '••••',
      logo: method?.logo ?? null,
      label: method?.label ?? 'Bank account',
      routing: state.draft.wireNumber || state.draft.swiftCode || '026009593',
      rail: rail?.label ?? '—',
    },
    source: { name: source.name, currency: source.currency, logo: source.logo },
    createdOn: dateOnly(sent),
    expectedArrival: dateOnly(arrival),
    description:
      state.draft.note.enabled && state.draft.note.value.trim()
        ? state.draft.note.value.trim()
        : null,
    statementDescriptor:
      state.draft.reference.enabled && state.draft.reference.value.trim()
        ? state.draft.reference.value.trim()
        : null,
  };
}

/** Rough arrival from the rail's own ETA copy — the record needs a real date. */
function arrivalOffsetMs(rail) {
  const day = 86400000;
  if (!rail || rail.eta === 'Instant') return 0;
  if (/same day/i.test(rail.eta)) return 0;
  const match = /(\d+)\D+(\d+)?/.exec(rail.eta);
  return match ? Number(match[2] ?? match[1]) * day : day;
}

function stamp(d) {
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function dateOnly(d) {
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
