import { RECIPIENTS } from '../data/recipients';
import { SELF_RECIPIENT, externalAccount } from '../data/externalAccounts';
import { ACCOUNTS, account } from '../data/accounts';
import { payoutMethod } from '../data/payoutMethods';
import { quote } from './quote';

/**
 * Derived values. Nothing here is stored in state.
 *
 * `quoteFor` is the ONE place that assembles quote inputs from flow state. The
 * original recomputed the same thing inline at nine sites with three different
 * rate tables, which is why its totals could disagree between the details screen
 * and the review screen.
 */

const SYMBOLS = {
  USD: '$',
  USDC: '$',
  GBP: '£',
  EUR: '€',
  JPY: '¥',
  INR: '₹',
  BRL: 'R$',
  CAD: 'CA$',
  CHF: 'CHF',
  AED: 'Dh',
};

/** Currencies conventionally written without minor units. */
const ZERO_DECIMAL = new Set(['JPY']);

export function currencySymbol(code) {
  return SYMBOLS[code] ?? '';
}

export function formatMoney(value, currency = 'USD') {
  const n = Number(value || 0);
  const digits = ZERO_DECIMAL.has(currency) ? 0 : 2;
  const symbol = currencySymbol(currency);
  // Glyph symbols sit flush ("$100.00"); alphabetic codes need a space, or
  // "CHF3,970.56" reads as one token.
  const gap = /[A-Za-z]$/.test(symbol) ? ' ' : '';
  return `${symbol}${gap}${n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function recipientFor(state) {
  // A payout to your own account has no recipient to look up — it's the business paying
  // itself, which is what Review's To row should say.
  if (state.draft.externalAccountId && !state.draft.recipientId)
    return SELF_RECIPIENT;

  const id = state.draft.recipientId;
  // addedRecipients first: attaching a payout method stores an updated copy
  // there, and the untouched fixture would otherwise shadow it.
  return (
    state.addedRecipients.find((r) => r.id === id) ??
    RECIPIENTS.find((r) => r.id === id) ??
    null
  );
}

export function sourceAccountFor(state) {
  return account(state.draft.sourceAccountId) ?? ACCOUNTS[0];
}

/**
 * An amount for a heading that already shows the currency code beside it
 * (the payout detail header: "$99.99 USD").
 *
 * Glyph symbols still prefix the number; alphabetic codes don't, or CHF reads
 * "CHF 1,975.00 CHF".
 */
export function formatAmountBare(value, currency = 'USD') {
  const symbol = currencySymbol(currency);
  const prefix = /[A-Za-z]$/.test(symbol) ? '' : symbol;
  const digits = ZERO_DECIMAL.has(currency) ? 0 : 2;
  return `${prefix}${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

/**
 * The two rows a conversion adds: what's being converted, and at what rate.
 *
 * Shared by the fee ladder on Payout details and the breakdown on Review — the
 * same numbers appear on both screens, so they come from one place. Empty when
 * no conversion is involved.
 */
export function conversionRows(state) {
  const { q, source } = quoteFor(state);
  if (!q.isFx) return [];

  return [
    {
      key: 'convert',
      label: 'Amount to convert',
      value: formatMoney(q.sendAmount, source.currency),
    },
    {
      key: 'rate',
      label: 'Exchange rate',
      value: exchangeRateLine(q, source.currency, receiveCurrencyFor(state)),
    },
  ];
}

/**
 * A rate, not an amount: more precision than money, and never the zero-decimal
 * treatment (a JPY *rate* of 159.24 is not "¥159").
 */
export function formatRate(value, currency) {
  const digits = value >= 10 ? 2 : 4;
  const symbol = currencySymbol(currency);
  const gap = /[A-Za-z]$/.test(symbol) ? ' ' : '';
  return `${symbol}${gap}${value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

/**
 * The exchange-rate row, always quoted as one unit of the sender's currency.
 *
 * 429:223890 shows "$1.33 = £1.00" — source per one unit received — and the line
 * used to follow that, inverting only where it would collapse (against JPY,
 * "$0.01 = ¥1"). Deliberate divergence: someone paying in dollars is asking what
 * their dollar buys, so the unit belongs on their side every time, and one
 * direction beats a rule the reader has to infer from the currency pair.
 */
export function exchangeRateLine(q, sourceCurrency, receiveCurrency) {
  return `${formatMoney(1, sourceCurrency)} = ${formatRate(q.rate, receiveCurrency)}`;
}

/**
 * The selected payout method. Recipients added in this session carry their own
 * methods (built at commit time) and aren't in the static fixtures, so every
 * screen has to look in both places — hence one selector rather than three
 * copies of the fallback.
 */
export function methodFor(state) {
  const own = recipientFor(state)?.methods;
  return (
    own?.find((m) => m.id === state.draft.payoutMethodId) ??
    payoutMethod(state.draft.payoutMethodId) ??
    // Paying yourself: the destination is one of your own linked accounts, shaped the same
    // way, so every screen downstream reads it without knowing the difference.
    externalAccount(state.draft.externalAccountId)
  );
}

/**
 * The currency the money arrives in, and the country it arrives in.
 *
 * These come from the selected PAYOUT METHOD, not the recipient. A recipient can
 * hold accounts in more than one currency — attaching a GBP account to a US
 * recipient is exactly the case that exposed this — and it's the account that
 * decides whether a conversion happens and what the cross-border rate is. The
 * recipient's own values are only a fallback for when no method is selected yet.
 */
export function receiveCurrencyFor(state) {
  // An explicit choice beats the destination's own currency: the sender can ask for
  // a US account to be paid in EUR, which is what makes the pair cross-currency.
  return (
    state.draft.receiveCurrency ??
    methodFor(state)?.currency ??
    recipientFor(state)?.currency ??
    'USD'
  );
}

export function receiveCountryFor(state) {
  return methodFor(state)?.country ?? recipientFor(state)?.country ?? 'US';
}

/** { q, source, recipient } — every screen that shows money uses this. */
export function quoteFor(state) {
  const recipient = recipientFor(state);
  const source = sourceAccountFor(state);
  const { value, sendRaw, edited } = state.draft.amount;
  const q = quote({
    // The side the sender typed into is the side that holds: anchoring the debit
    // takes the fees out of it, anchoring the recipient's amount adds them on top.
    anchor: edited === 'send' ? 'pay' : 'receive',
    payAmount: sendRaw,
    receiveAmount: value,
    receiveCurrency: receiveCurrencyFor(state),
    sourceCurrency: source.currency,
    deliveryMethodId: state.draft.deliveryMethodId,
    recipientCountry: receiveCountryFor(state),
  });
  return { q, source, recipient };
}

/** The "Pay $101.50" footer label on Review. */
export function formatTotal(state) {
  const { q, source } = quoteFor(state);
  return formatMoney(q.totalPay, source.currency);
}

export const selectors = {
  formatMoney,
  formatTotal,
  currencySymbol,
  quoteFor,
  methodFor,
  formatRate,
  formatAmountBare,
  exchangeRateLine,
  conversionRows,
  recipientFor,
  sourceAccountFor,
  receiveCurrencyFor,
  receiveCountryFor,
};
