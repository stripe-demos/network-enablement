/**
 * The monthly allowance: the first 50 domestic bank transfers carry no fee.
 *
 * Scoped to the rails that carry `allowanceEligible` in the delivery registry, which
 * today means RTP — a US domestic real-time payout. It deliberately does NOT cover:
 *
 *   ACH        already free outright, so there's nothing to cover.
 *   wires      a different fee tier, and not what the allowance is for.
 *   SWIFT      international, so never "domestic".
 *   anything   crossing a border or converting currency, even over an eligible rail.
 *
 * "Included" rather than "Free": it means the payout costs $0 because the plan
 * already paid for it, which is the wording UB's shipped Plans-and-fees designs use
 * for the same idea. "Free" reads as promotional and gets confusing at transfer 51.
 */

export const ALLOWANCE_TOTAL = 50;

/**
 * Transfers used this month. A stand-in for a real counter — there's no billing API
 * behind this prototype — set so the screen shows 23 remaining, matching the frame.
 */
export const ALLOWANCE_USED_DEFAULT = 27;

/**
 * Mutable so the state can be driven from outside: `quote.test.mjs` exhausts the
 * allowance to assert published pricing, then restores it to assert the coverage. A
 * module constant would have made one of those two untestable.
 */
let used = ALLOWANCE_USED_DEFAULT;

export function setAllowanceUsed(n) {
  used = Math.max(0, Math.min(ALLOWANCE_TOTAL, n));
}

export function allowanceRemaining() {
  return Math.max(0, ALLOWANCE_TOTAL - used);
}

/**
 * Is this payout covered?
 *
 * Every condition has to hold: an eligible rail, no border crossed, no conversion,
 * and allowance left. Running out mid-month is the state that matters most — the
 * sender sees the real fee again, with no explanation owed beyond the count.
 */
export function allowanceApplies({ rail, isCrossBorder, isFx }) {
  if (!rail?.allowanceEligible) return false;
  if (isCrossBorder || isFx) return false;
  return allowanceRemaining() > 0;
}

/**
 * How a covered fee reads in the breakdown: the word in place of the amount, and the
 * count underneath it.
 *
 * The row stays in the list rather than disappearing. A fee that vanishes can't tell
 * you it was covered, which is the entire point of showing the allowance.
 */
export function allowanceRow() {
  return {
    value: 'Included',
    note: `${allowanceRemaining()}/${ALLOWANCE_TOTAL} remaining monthly included domestic bank transfers.`,
  };
}
