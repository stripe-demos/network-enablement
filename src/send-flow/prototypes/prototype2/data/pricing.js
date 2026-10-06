/**
 * Global Payouts pricing.
 *
 * Source: https://docs.stripe.com/global-payouts/pricing
 * Sender country is the United States throughout this prototype (same assumption
 * as data/kyc.js), so the sender-dependent figures below are the US rows.
 *
 * Fees are charged from the sender's financial account and are denominated in
 * that account's currency.
 */

export const SENDER_COUNTRY = 'US';

/**
 * Per-payout fee for a local bank transfer, by sender country. The published
 * table gives the same number in whichever currency the account holds, so this
 * is an amount, not a rate.
 */
const STANDARD_PAYOUT_FEE = { US: 1.5, GB: 0.5, EZ: 0.3 };

/** Wire payout, US senders only. */
const WIRE_PAYOUT_FEE = 25;

/** Debit card payout, US only: 1.50 + 0.75%, with a 2.00 floor on the total. */
const CARD_FEE_FIXED = 1.5;
const CARD_FEE_RATE = 0.0075;
const CARD_FEE_MIN = 2;

/** FX: 0.50% between the majors, otherwise 1% for a US sender (2% non-US). */
const FX_RATE_MAJORS = 0.005;
const FX_RATE_OTHER = 0.01;
const MAJORS = new Set(['USD', 'EUR', 'GBP']);

/**
 * Cross-border fee by recipient country, as a share of the amount. Only the
 * countries this prototype can actually send to are listed; the published table
 * covers ~100.
 *
 * Japan and Brazil are absent from the published table, so they fall through to
 * FALLBACK — flagged rather than invented, since 1% is the table's modal value
 * for countries outside Europe/North America.
 */
const CROSS_BORDER_RATE = {
  US: 0.0025,
  GB: 0.0025,
  FR: 0.0025, // 0% for Eurozone senders; ours is US
  DE: 0.0025,
  CH: 0.0025,
  IN: 0.0075,
};
const CROSS_BORDER_FALLBACK = 0.01;

export function isPublishedCrossBorder(country) {
  return Object.prototype.hasOwnProperty.call(CROSS_BORDER_RATE, country);
}

/** No cross-border fee when sender and recipient are in the same country. */
export function crossBorderRate(
  recipientCountry,
  senderCountry = SENDER_COUNTRY,
) {
  if (recipientCountry === senderCountry) return 0;
  return CROSS_BORDER_RATE[recipientCountry] ?? CROSS_BORDER_FALLBACK;
}

export function fxFeeRate(sourceCurrency, receiveCurrency) {
  if (sourceCurrency === receiveCurrency) return 0;
  return MAJORS.has(sourceCurrency) && MAJORS.has(receiveCurrency)
    ? FX_RATE_MAJORS
    : FX_RATE_OTHER;
}

/**
 * The payout fee for a rail. `kind` comes from the rail itself ('local' | 'wire'
 * | 'card'), so the pricing tier is a property of the rail rather than something
 * this function has to infer from an id.
 *
 * @param {'local'|'wire'|'card'} kind
 * @param {number} sendAmount  in the sender's currency, for the card percentage
 */
export function payoutFee(kind, sendAmount = 0) {
  // Staying on the Stripe network costs nothing — it never leaves Stripe, so
  // there's no rail to pay for. Not in the published table, which covers payouts
  // to external accounts.
  if (kind === 'network') return 0;
  if (kind === 'wire') return WIRE_PAYOUT_FEE;
  if (kind === 'card') {
    return Math.max(CARD_FEE_MIN, CARD_FEE_FIXED + sendAmount * CARD_FEE_RATE);
  }
  return STANDARD_PAYOUT_FEE[SENDER_COUNTRY];
}

/**
 * Label for the payout-fee row: "{rail} payout fee".
 *
 * Named after the rail the sender actually picked, so the breakdown echoes the
 * Delivery control rather than paraphrasing it — "ACH payout fee" under an option
 * that says ACH, "SEPA Credit Transfer payout fee" under one that says SEPA. The
 * kind alone can't do that: `local` covers ACH, Faster Payments, Pix, Zengin and
 * every other domestic rail, so it produced a vague "Standard payout fee" for all
 * of them. Every row now ends in "payout fee" — the network rail used to be the
 * odd one out at "Instant transfer fee".
 *
 * The kind branches survive as the fallback for a rail with no label.
 */
export function payoutFeeLabel(kind, railLabel) {
  if (railLabel) return `${railLabel} payout fee`;
  if (kind === 'network') return 'Instant payout fee';
  if (kind === 'wire') return 'Wire payout fee';
  if (kind === 'card') return 'Debit card payout fee';
  return 'Standard payout fee';
}
