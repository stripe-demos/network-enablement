import { payoutMethod } from './payoutMethods.js'; // explicit extension: node --test runs this directly

/**
 * Confirmation of Payee — the UK's payee-name check.
 *
 * Before a UK payment leaves, the sending bank asks the receiving bank whether the
 * name on the instruction matches the name on the account. Three answers matter:
 *
 *   match        the names agree — nothing to show the sender.
 *   close match  the account exists and the name is nearly right, and the bank
 *                returns the name it holds. This is the interesting one: the sender
 *                almost certainly has a typo, not the wrong account.
 *   no match     the name doesn't correspond to the account at all.
 *
 * Only "close match" is modelled here, because it's the only outcome with a decision
 * in it: the sender is shown what the bank holds and accepts it or edits their own.
 * The payment is blocked until they resolve it — an unresolved check is the one state
 * where continuing is not the sender's call.
 *
 * Scoped to GB destinations. The check is a UK scheme requirement; applying it to a US
 * or SEPA account would be inventing a control that doesn't exist there.
 */

/** Countries whose rails run the check. */
export const VOP_COUNTRIES = new Set(['GB']);

/** The check attached to a destination, or null where none applies. */
export function vopCheck(method) {
  if (!method?.vop) return null;
  if (!VOP_COUNTRIES.has(method.country)) return null;
  return method.vop;
}

/** The name as the sender has it — what the bank disagreed with. */
export function payeeName(method) {
  const p = method?.payee;
  if (!p) return null;
  return [p.firstName, p.lastName].filter(Boolean).join(' ');
}

/** The name the bank holds, per the check's suggestion. */
export function suggestedName(check) {
  if (!check?.suggestion) return null;
  return [check.suggestion.firstName, check.suggestion.lastName]
    .filter(Boolean)
    .join(' ');
}

/** Does this destination still owe a verification? */
export function vopPendingFor(method, verifiedPayees = []) {
  if (!vopCheck(method)) return false;
  return !verifiedPayees.includes(method.id);
}

/**
 * Same question, from flow state — used by the step graph to gate Continue, so the
 * footer and the banner can't disagree about whether the payout may proceed.
 */
export function vopPending(state) {
  return vopPendingFor(
    payoutMethod(state.draft.payoutMethodId),
    state.verifiedPayees,
  );
}
