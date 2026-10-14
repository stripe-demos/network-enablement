import { normaliseCurrency, rate as fxRate } from '../data/fx.js'; // explicit extension: node --test runs this file directly
import { deliveryMethod, railFee } from '../data/deliveryMethods.js';
import { allowanceApplies, allowanceRow } from '../data/allowance.js';
import {
  crossBorderRate,
  fxFeeRate,
  isPublishedCrossBorder,
  payoutFee,
  payoutFeeLabel,
} from '../data/pricing.js';

/**
 * The fee/FX engine — the only genuinely non-trivial logic in the flow.
 *
 * Rates come from the published Global Payouts pricing (data/pricing.js), not
 * from the original prototype, which duplicated the calculation inline at nine
 * sites with a different invented table at each (SendModal2.jsx:3399, 3569, 4126,
 * 4352, 4474, 4805, 4828, 5834, 5972).
 *
 * Three charges, all in the sender's currency:
 *   payout fee    per payout, by rail tier — local 1.50, wire 25.00,
 *                 card 1.50 + 0.75% (min 2.00)
 *   cross-border  a share of the amount, by recipient country; none when sender
 *                 and recipient are in the same country
 *   FX            0.50% between USD/EUR/GBP, otherwise 1% for a US sender
 *
 * Locked by quote.test.mjs against the number the frames commit to:
 * US -> US, Standard ACH, $100.00 receive => $101.50 total.
 */

/**
 * Which side of the payout the sender fixed decides which way the fees run.
 *
 *   anchor 'receive'  they said what the recipient gets, so the fees are ADDED to
 *                     the debit: pay 401.50 for 400.00 to land.
 *   anchor 'pay'      they said what they're willing to pay, so the fees come OUT
 *                     of it: pay 400.00 and 398.50 lands.
 *
 * Both directions quote the same fee schedule; only the unknown differs. The
 * 'pay' direction is the harder one — see `sendWithin`.
 */

/**
 * @param {object} input
 * @param {'receive'|'pay'} input.anchor       which amount the sender typed
 * @param {number|string} input.receiveAmount  amount the recipient receives, when anchor is 'receive'
 * @param {number|string} input.payAmount      total debited, fees included, when anchor is 'pay'
 * @param {string} input.receiveCurrency
 * @param {string} input.sourceCurrency        currency of the funding account
 * @param {string} input.deliveryMethodId
 * @param {string} input.recipientCountry
 */
export function quote({
  anchor = 'receive',
  receiveAmount,
  payAmount,
  receiveCurrency = 'USD',
  sourceCurrency = 'USD',
  deliveryMethodId = null,
  recipientCountry = 'US',
}) {
  const normSource = normaliseCurrency(sourceCurrency);
  const normReceive = normaliseCurrency(receiveCurrency);
  const isFx = normSource !== normReceive;

  const rate = fxRate(sourceCurrency, normReceive);
  const reverseRate = rate === 0 ? 0 : 1 / rate;

  const rail = deliveryMethod(deliveryMethodId);
  const railKind = rail?.kind ?? 'local';
  const xBorderRate = crossBorderRate(recipientCountry);
  const fxFee = isFx ? fxFeeRate(normSource, normReceive) : 0;
  const isUsdcToUsdc = sourceCurrency === 'USDC' && receiveCurrency === 'USDC';

  /**
   * Is the payout fee covered by the monthly allowance? Decided once, before the fee
   * function closes over it, so every pass of `sendWithin` agrees.
   */
  const included = allowanceApplies({
    rail,
    isCrossBorder: xBorderRate > 0,
    isFx,
  });

  /**
   * Every charge on a given converting amount, in the sender's currency.
   *
   * Stablecoin isn't in the published pricing table at all. Kept free end to end,
   * as the original had it — flagged as unpriced rather than guessed at.
   */
  const feesFor = (send) =>
    isUsdcToUsdc
      ? { payout: 0, crossBorder: 0, fx: 0 }
      : {
          // `railFee` so this agrees with the Delivery menu to the cent: a rail can
          // price itself below its tier (ACH at 0.50) or be free outright (USDC). The
          // allowance is the other way a fee comes to nothing, and the breakdown says
          // that one out loud, because it runs out.
          payout: included
            ? 0
            : rail
              ? railFee(rail, send)
              : payoutFee(railKind, send),
          crossBorder: send * xBorderRate,
          fx: isFx ? send * fxFee : 0,
        };

  const anchoredPay = anchor === 'pay';
  const typedReceive = Number(receiveAmount) || 0;
  const typedPay = Number(payAmount) || 0;

  // `sendAmount` is always the money that actually converts and travels: the
  // debit less the fees. Anchoring the debit makes it the unknown; anchoring the
  // recipient's amount makes it the direct conversion of what they asked for.
  const sendAmount = anchoredPay
    ? sendWithin(typedPay, feesFor)
    : isFx
      ? typedReceive / rate
      : typedReceive;

  const fees = feesFor(sendAmount);
  const totalFees = sumFees(fees);

  return {
    anchor,
    isFx,
    rate,
    reverseRate,
    sendAmount,
    // Anchoring the recipient's amount keeps their figure exactly as typed;
    // dividing and re-multiplying by the rate would land a cent off.
    receiveAmount: anchoredPay
      ? isFx
        ? sendAmount * rate
        : sendAmount
      : typedReceive,
    railKind,
    railLabel: rail?.label ?? null, // names the payout-fee row after the chosen rail
    // Set when the allowance covered the payout fee. `stickerPayout` is what it would
    // otherwise have cost, which every disclosure of the coverage needs.
    included,
    stickerPayout: isUsdcToUsdc
      ? 0
      : rail
        ? railFee(rail, sendAmount)
        : payoutFee(railKind, sendAmount),
    crossBorderRate: xBorderRate,
    crossBorderPublished: isPublishedCrossBorder(recipientCountry),
    fxRate: fxFee,
    fees,
    totalFees,
    // Anchoring the debit means the sender pays exactly what they typed — deriving
    // it back from sendAmount would show them a number they didn't ask for.
    totalPay: anchoredPay ? typedPay : sendAmount + totalFees,
  };
}

function sumFees(fees) {
  return fees.payout + fees.crossBorder + fees.fx;
}

/**
 * The converting amount hidden inside a total: solve `send` where
 * send + fees(send) === total.
 *
 * Fixed-point rather than algebra because the card tier isn't linear in the amount
 * (1.50 + 0.75%, floored at 2.00), so there's no single formula to invert. Every
 * percentage rate is far below 1, which makes each pass shrink the error by that
 * factor — it settles well inside a cent in a few passes, and the loop bound is
 * only a backstop.
 *
 * Clamped at zero: a total smaller than the flat payout fee can't cover it, so
 * nothing converts and the fee rows still show what was charged.
 */
function sendWithin(total, feesFor) {
  let send = total;
  for (let i = 0; i < 32; i += 1) {
    const next = total - sumFees(feesFor(send));
    if (Math.abs(next - send) < 1e-9) {
      send = next;
      break;
    }
    send = next;
  }
  return Math.max(0, send);
}

/**
 * Percentage for a row label: 0.0025 -> "0.25%", 0.005 -> "0.50%".
 *
 * Two decimals always, so the fee rows stacked against each other carry the same precision —
 * "Cross-border fee (0.25%)" above "Conversion fee (0.5%)" read as two different kinds of
 * figure. Whole rates lose the decimals: "1%", not "1.00%".
 */
function percent(rate) {
  const pct = rate * 100;
  return `${Number.isInteger(pct) ? pct : pct.toFixed(2)}%`;
}

/**
 * Rows for the fee breakdown, shared by Payout details and Review so the two
 * can't drift. Labels name the published fees, and the percentage rows disclose
 * their rate — the rate varies by country and currency pair, so a bare amount
 * would be unexplainable.
 */
export function feeRows(q) {
  const rows = [];

  // A covered fee still gets a row: `display` carries the word where the amount would
  // be, and `note` carries what's left of the allowance.
  if (q.included) {
    const { value, note } = allowanceRow();
    rows.push({
      key: 'payout',
      label: payoutFeeLabel(q.railKind, q.railLabel),
      value: q.fees.payout,
      included: true,
      display: value,
      note,
    });
  } else if (q.fees.payout) {
    rows.push({
      key: 'payout',
      label: payoutFeeLabel(q.railKind, q.railLabel),
      value: q.fees.payout,
    });
  }
  if (q.fees.crossBorder) {
    rows.push({
      key: 'crossBorder',
      label: `Cross-border fee (${percent(q.crossBorderRate)})`,
      value: q.fees.crossBorder,
    });
  }
  if (q.fees.fx) {
    rows.push({
      key: 'fx',
      // "Conversion fee", not "Foreign exchange fee": the row below it says
      // "Amount to convert", and one operation shouldn't have two names.
      label: `Conversion fee (${percent(q.fxRate)})`,
      value: q.fees.fx,
    });
  }
  return rows;
}
