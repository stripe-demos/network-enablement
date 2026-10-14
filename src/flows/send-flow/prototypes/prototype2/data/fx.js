/**
 * FX rates.
 *
 * One table: units of each currency per 1 USD. Every pair is derived from it, so
 * a rate and its inverse can't disagree.
 *
 * This replaces the original's arrangement (SendModal2.jsx:4126 and eight other
 * sites), which carried a hand-written 12-pair table alongside a USD cross-rate
 * table. The two drifted — USD-GBP was 0.79 while GBP-USD was 1.27, an implied
 * 0.3% spread that appeared or vanished depending on which direction the user
 * happened to send. Deriving both directions from one number removes that.
 *
 * Rates are the ECB reference rates for 2026-08-25 (via frankfurter.dev). A
 * prototype has no business calling a live FX API, so they're pinned: realistic
 * as of that date, and stable so screenshots and tests don't move underfoot.
 */
export const RATE_DATE = '2026-08-25';

/** Units of each currency per 1 USD. */
export const USD_RATES = {
  USD: 1,
  // Stablecoin, 1:1 with the dollar by construction rather than by market.
  USDC: 1,
  GBP: 0.73358,
  EUR: 0.85749,
  JPY: 159.24,
  CAD: 1.386,
  CHF: 0.80269,
  INR: 95.42,
  BRL: 5.158,
  // The ECB doesn't publish AED; it's pegged to the dollar at this rate.
  AED: 3.6725,
};

/** Derived through USD. Unknown currencies fall back to parity. */
export function rate(from, to) {
  if (from === to) return 1;

  const fromUsd = USD_RATES[from];
  const toUsd = USD_RATES[to];
  if (fromUsd && toUsd) return toUsd / fromUsd;

  return 1;
}

/** USDC settles as USD for the purposes of deciding whether a payout is FX. */
export function normaliseCurrency(code) {
  return code === 'USDC' ? 'USD' : code;
}
