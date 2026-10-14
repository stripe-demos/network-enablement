/**
 * The step graph — the ONLY place step order and step chrome live.
 *
 * Deliberately contains no JSX and imports no components: the reducer imports
 * this file, and the step components import the flow context, so pulling
 * components in here would close a require cycle. Component lookup lives in
 * registry.jsx instead.
 *
 * The shell reads only this. That's what keeps header/footer generic — the
 * original built its header from ~75 lines of nested ternaries over step ids
 * (SendModal2.jsx:1270-1345) and repeated its exit-confirm list verbatim three
 * times (1218, 1262, 1339).
 */

import { deliveryMethod, railFormKeys } from '../data/deliveryMethods';
import { bankFieldsFor } from '../data/countries';
import {
  addressRequired,
  effectiveMethod,
  kycPendingFor,
  recipientComplete,
} from '../data/kyc';
import { RECIPIENTS } from '../data/recipients';
import { vopPending } from '../data/vop';

/** Method names as they read in a heading. */
const METHOD_TITLES = {
  bank: 'Bank account',
  card: 'Debit card',
  wallet: 'Stablecoin wallet',
};

/**
 * Display name of the recipient a payout method is being attached to.
 *
 * The attach path knows who it's for — that's the whole difference from adding a
 * recipient from scratch — so its headings can say so. Falls back to the seeded
 * first/last name, which is all a moderator's `?step=ar.form` jump has.
 */
function attachRecipientName(s) {
  const id = s.newRecipient.attachTo;
  if (!id) return null;
  const found =
    s.addedRecipients.find((r) => r.id === id) ??
    RECIPIENTS.find((r) => r.id === id);
  if (found?.name) return found.name;
  return (
    [s.newRecipient.firstName, s.newRecipient.lastName]
      .filter(Boolean)
      .join(' ') || null
  );
}

/**
 * The sub-flow breadcrumb. Attaching a method to someone who already exists is
 * not "Add recipient" — the recipient is already there — so the crumb names what
 * is actually being added.
 */
/**
 * "Bank account details for Clay Davis" — shared by the two screens that collect details
 * about a destination: adding one from scratch, and supplying the identifiers a rail asks
 * for later. They ask for different fields, but they're the same kind of screen, and the
 * heading is what says so.
 */
function methodDetailsHeading(s) {
  const label = METHOD_TITLES[s.newRecipient.method] ?? 'Destination';
  const name = attachRecipientName(s);
  return name ? `${label} details for ${name}` : `${label} details`;
}

function addRecipientCrumbs(s) {
  return [
    'Send',
    attachingToExistingRecipient(s) ? 'Add destination' : 'Add recipient',
  ];
}

/**
 * Has the sender committed to a number on either side?
 *
 * `amount.edited` says which field they typed into, and that field is the only one
 * holding a real value — the other is derived by the quote, so reading it here
 * would gate Continue on arithmetic rather than on input.
 */
function amountEntered(s) {
  const { edited, value, sendRaw } = s.draft.amount;
  return Number(edited === 'send' ? sendRaw : value) > 0;
}

/** Every non-optional field the chosen country and method ask for. */
function newRecipientFormReady(s) {
  const n = s.newRecipient;
  if (!n.country || !n.method) return false;
  return bankFieldsFor(n.country, n.method)
    .filter((f) => !f.optional)
    .every((f) => String(n[f.key] ?? '').trim());
}

/**
 * The recipient as the flow sees them: the session copy first, since satisfying the
 * extra KYC writes an updated copy there.
 */
function selectedRecipient(s) {
  return (
    s.addedRecipients.find((r) => r.id === s.draft.recipientId) ??
    RECIPIENTS.find((r) => r.id === s.draft.recipientId) ??
    null
  );
}

/**
 * The additional-details form: every field the account needs, plus whatever the rail is
 * waiting on. A field the account form calls optional is not optional when the rail can't
 * move without it, which is the one difference from `newRecipientFormReady` above.
 */
function destinationFormReady(s) {
  const n = s.newRecipient;
  const needed = new Set(railFormKeys(n.railId));
  return bankFieldsFor(n.country, n.method)
    .filter((f) => !f.optional || needed.has(f.key))
    .every((f) => String(n[f.key] ?? '').trim());
}

/** Does the chosen rail need an address this recipient hasn't supplied? */
export function kycPending(s) {
  return kycPendingFor(selectedRecipient(s), s.draft.deliveryMethodId);
}

/**
 * Same question from inside the sub-flow, where the rail comes from the scratch copy —
 * it's what decides whether the destination step is the last one.
 */
function personalDetailsPending(s) {
  return kycPendingFor(
    selectedRecipient(s),
    s.newRecipient.railId ?? s.draft.deliveryMethodId,
  );
}

/**
 * Payout-method readiness. Lives here rather than in the step component so the
 * footer and the step can't disagree about whether the form is complete.
 */
function payoutMethodReady(s) {
  const { payoutMethodId, deliveryMethodId } = s.draft;
  if (!payoutMethodId || !deliveryMethodId) return false;

  /**
   * An unresolved payee check blocks the payout outright: the UK scheme doesn't let the
   * money leave on a name the receiving bank disputes, so this is the one gate on this
   * step that isn't the sender's judgement call.
   *
   * A checked-but-empty "Modify reference" is NOT a gate: 429:222803 draws Continue
   * disabled in that state, but the reference is optional, so blocking on it strands
   * anyone who ticks the box out of curiosity. Deliberate divergence from the frame.
   */
  return !vopPending(s);
}

/**
 * Payout-details readiness.
 *
 * An amount, an account to pay from, and everything the RAIL needs — its own required
 * fields (a SWIFT code, a wire routing number) and any recipient details it raises.
 * Those last two used to gate the Destination step; they moved when the Delivery control
 * did, because a requirement has to be enforced on the screen where the choice that
 * raises it is made.
 */
function payoutDetailsReady(s) {
  if (!amountEntered(s) || !s.draft.sourceAccountId) return false;
  // Scheduled with no date is an unfinished decision, not a payout.
  if (s.draft.timing.when === 'later' && !s.draft.timing.date) return false;
  if (kycPending(s)) return false;

  const requires = deliveryMethod(s.draft.deliveryMethodId)?.requires ?? [];
  return requires.every((f) => String(s.draft[f] ?? '').trim());
}

/**
 * Adding a payout method to someone who already exists (502:28886) skips Personal
 * details: their name, email and country are already on file.
 *
 * The exception is KYC. A new method can raise the requirements — a wire to a US
 * individual needs an address where a local transfer doesn't — and no address is
 * held for existing recipients, so that case still has to ask.
 */
export function attachingToExistingRecipient(s) {
  return Boolean(s.newRecipient.attachTo);
}

export function attachNeedsMoreKyc(s) {
  const n = s.newRecipient;
  return addressRequired({
    country: n.country,
    type: n.type,
    method: effectiveMethod(n),
  });
}

/**
 * The add-recipient rail used to draw a vertical stepper in the left gutter
 * (Sail TaskList, 429:225878). Removed to follow the reference dialog's sub-flow
 * pattern, which carries no progress rail — the breadcrumb in the header is the
 * only "where am I", and the content column sits on its own. So these steps use
 * the plain 'column' layout like every other step.
 */
export const RAILS = {
  main: ['recipient', 'payoutMethod', 'payoutDetails', 'review', 'success'],
  addRecipient: ['ar.method', 'ar.form', 'ar.personal', 'ar.saved'],
  vop: ['vop.verify'],
  // Destination details first, then personal: the rail's identifiers are about the
  // account, and a sender who has just chosen that rail has the account in mind.
  kyc: ['kyc.destination', 'kyc.details'],
  // Paying yourself: its own rail, because the recipient steps have nothing to ask. Review
  // and the confirmation are the same two screens as the main rail, declared again here
  // rather than shared, since a step belongs to exactly one rail.
  external: ['external.details', 'external.review', 'external.success'],
  email: ['email.compose', 'email.sent'],
};

/**
 * Per-step declaration.
 *
 *  heading       Heading/Large text in the content column; null when the step
 *                draws its own heading row (e.g. recipient, which has buttons
 *                on the heading line).
 *  layout        'column' | 'split' | 'centered' — see ContentColumn.
 *  canContinue   (state) => boolean. Load-bearing: the frames show a real
 *                disabled Continue, so this drives the footer.
 *  primaryLabel  (state) => string.
 *  next / back   (state) => stepId, overriding index ±1 within the rail.
 *  isSubmit      the primary action submits rather than navigates.
 */
export const STEPS = {
  recipient: {
    id: 'recipient',
    rail: 'main',
    headerLabel: 'Send',
    heading: null, // owns its heading row (Send by email / + Add recipient)
    layout: 'column',
    canContinue: (s) => Boolean(s.draft.recipientId),
    primaryLabel: () => 'Continue',
    showBack: false, // first step of the flow — nothing to go back to
    // No footer at all: picking a recipient advances immediately, so there is
    // nothing for a Continue button to do (2026-08-24 revision).
    footer: 'none',
    confirmOnExit: false,
  },

  payoutMethod: {
    id: 'payoutMethod',
    rail: 'main',
    headerLabel: 'Send',
    // "Recipient", not "Destination": the screen opens on who is being paid, and
    // "Destination" is the label on the control below — one word doing both jobs made the
    // heading read as a repeat of the field.
    heading: 'Recipient',
    layout: 'column',
    // Gated on the rail's `requires` fields and on a checked-but-empty
    // reference — which is exactly why Continue is disabled on 429:222803
    // despite both controls being resolved.
    canContinue: payoutMethodReady,
    primaryLabel: () => 'Continue',
    showBack: true,
    confirmOnExit: true,
  },

  payoutDetails: {
    id: 'payoutDetails',
    rail: 'main',
    headerLabel: 'Send',
    heading: 'Payout details',
    layout: 'column',
    // Either side counts as an amount: the sender can fix the debit or the
    // recipient's figure, and only the one they typed is authoritative. The rail's own
    // requirements are checked here too, since its control lives on this step now.
    canContinue: payoutDetailsReady,
    primaryLabel: () => 'Continue',
    showBack: true,
    confirmOnExit: true,
  },

  review: {
    id: 'review',
    // Header reads "Transfer" on 429:224598. Treated as a copy slip and kept as
    // "Send" for consistency — flagged for the designer. The shell supports a
    // per-step label, so this is a one-word change if it was intentional.
    rail: 'main',
    headerLabel: 'Send',
    heading: 'Review and pay', // names the terminal action, as the primary button does
    layout: 'column',
    canContinue: () => true,
    primaryLabel: (s, sel) => (sel ? `Pay ${sel.formatTotal(s)}` : 'Pay'),
    showBack: true,
    confirmOnExit: true,
    isSubmit: true,
  },

  success: {
    id: 'success',
    rail: 'main',
    headerLabel: 'Send',
    heading: null,
    layout: 'centered',
    canContinue: () => true,
    // "Done", not "Finish": the work is already complete, and "Finish" implies
    // something still outstanding. Kept in the primary slot — "View payout" stays
    // secondary, which is the arrangement the frame draws.
    primaryLabel: () => 'Done',
    secondaryLabel: () => 'View payout',
    footer: 'dual',
    // End of the flow: the primary closes the sheet rather than advancing.
    // `footer: 'dual'` only says "two buttons" — ar.saved shares the shape but
    // continues into the payout.
    terminal: true,
    showBack: false,
    confirmOnExit: false,
  },

  // ---- Add recipient sub-flow -------------------------------------------------
  'ar.method': {
    id: 'ar.method',
    rail: 'addRecipient',
    breadcrumb: addRecipientCrumbs,
    heading: (s) => {
      if (!attachingToExistingRecipient(s)) return 'Recipient email and destination';
      const name = attachRecipientName(s);
      return name ? `Add a destination for ${name}` : 'Add a destination';
    },
    layout: 'column',
    canContinue: (s) => Boolean(s.newRecipient.method),
    primaryLabel: () => 'Continue',
    showBack: true,
    backLabel: 'Cancel', // first sub-flow step: Back cancels out of the sub-flow
    // Cancel only. Picking a method from the list drills straight into its form
    // (MethodPickerStep calls next() on click), so a Continue button has nothing
    // to do — the same reason the recipient step has no footer at all.
    footer: 'back',
    confirmOnExit: true,
  },

  'ar.form': {
    id: 'ar.form',
    rail: 'addRecipient',
    breadcrumb: addRecipientCrumbs,
    // "[Payout method] details for [recipient name]" — the form names the method
    // it's collecting, which is what lets the step drop the drill-out row that
    // used to repeat it above the fields.
    heading: methodDetailsHeading,
    layout: 'column',
    canContinue: newRecipientFormReady,
    // 502:28886: attaching to an existing recipient ends here unless the method
    // raises a KYC requirement, so the button commits rather than continuing.
    primaryLabel: (s) =>
      attachingToExistingRecipient(s) && !attachNeedsMoreKyc(s)
        ? 'Add'
        : 'Continue',
    next: (s) =>
      attachingToExistingRecipient(s) && !attachNeedsMoreKyc(s)
        ? 'ar.saved'
        : 'ar.personal',
    showBack: true,
    confirmOnExit: true,
  },

  'ar.personal': {
    id: 'ar.personal',
    rail: 'addRecipient',
    breadcrumb: addRecipientCrumbs,
    heading: 'Recipient personal details',
    layout: 'column',
    // Requirements come from the Global Payouts KYC table (data/kyc.js): a name
    // always, plus an address for some country/type/rail combinations. Email is
    // collected on the destination step.
    canContinue: (s) => recipientComplete(s.newRecipient),
    primaryLabel: () => 'Save', // 429:225650
    showBack: true,
    confirmOnExit: true,
  },

  // 464:263845 — confirmation between saving the recipient and returning to the
  // payout. No stepper (centred layout), no Back: the recipient is saved.
  'ar.saved': {
    id: 'ar.saved',
    rail: 'addRecipient',
    headerLabel: 'Send',
    heading: null,
    layout: 'centered',
    canContinue: () => true,
    primaryLabel: () => 'Continue',
    // 464:263845 draws a "View payout" secondary. Dropped: at this point there is
    // no payout — a recipient has been saved, and the payout is still being built
    // on the step this screen returns to. The frame also gives it no destination.
    footer: 'single',
    showBack: false,
    confirmOnExit: false,
    // Commits the recipient and lands one step past the interrupt (464:264637
    // shows the payout method step with the new recipient selected).
    exitsSubflow: true,
  },

  // ---- Confirmation of Payee sub-flow -----------------------------------------
  // One step, so Back cancels it (see NAVIGATE_BACK) and the primary commits — the
  // same shape as the add-recipient rail, minus the steps it doesn't need.
  'vop.verify': {
    id: 'vop.verify',
    rail: 'vop',
    breadcrumb: () => ['Send', 'Recipient verification'],
    heading: 'Recipient verification',
    layout: 'column',
    canContinue: () => true,
    // Names both halves of what the button does: the bank's version is adopted AND the
    // recipient's record is changed to match. "Accept suggestion" alone left the second half
    // to be discovered afterwards.
    primaryLabel: () => 'Accept & update',
    showBack: true,
    // Nothing is lost by leaving — the check is still there when they come back — so
    // no exit confirmation.
    confirmOnExit: false,
    exitsSubflow: true,
  },

  // ---- Additional KYC sub-flow ------------------------------------------------
  // The same form the add-recipient rail uses for personal details, entered from the
  // Destination step instead: the recipient already exists, and what's missing is a
  // field their chosen rail asks for. One step, so Back cancels and Save commits.
  /**
   * The rail's own identifiers — a SWIFT code, a wire routing number.
   *
   * Continues to the personal form only when the address is missing too; otherwise Save
   * commits and returns to the payout. `exitsSubflow` is a function for exactly that:
   * whether this is the last step depends on what's still outstanding.
   */
  'kyc.destination': {
    id: 'kyc.destination',
    rail: 'kyc',
    headerLabel: 'Recipient details',
    // Names the screen rather than the account: the account itself is summarised in the first
    // row, and repeating "Bank account details for Brother Mouzone" above a row that says the
    // same thing was the heading twice.
    heading: 'Recipient destination',
    layout: 'column',
    canContinue: destinationFormReady,
    primaryLabel: (s) => (personalDetailsPending(s) ? 'Continue' : 'Save'),
    next: () => 'kyc.details',
    exitsSubflow: (s) => !personalDetailsPending(s),
    showBack: true,
    confirmOnExit: true,
  },

  'kyc.details': {
    id: 'kyc.details',
    rail: 'kyc',
    // A label rather than a breadcrumb: this is not a detour inside building the
    // payout the way adding a recipient is — it's the payout's own requirement.
    headerLabel: 'Recipient details',
    heading: 'Recipient details',
    layout: 'column',
    canContinue: (s) => recipientComplete(s.newRecipient),
    primaryLabel: () => 'Save',
    showBack: true,
    confirmOnExit: true,
    exitsSubflow: true,
  },

  // ---- External-account rail ---------------------------------------------------
  'external.details': {
    id: 'external.details',
    rail: 'external',
    headerLabel: 'Send',
    heading: 'Pay out to external account',
    layout: 'column',
    canContinue: (s) =>
      amountEntered(s) &&
      Boolean(s.draft.sourceAccountId) &&
      Boolean(s.draft.externalAccountId),
    primaryLabel: () => 'Continue',
    // Back returns to the recipient screen this was launched from.
    showBack: true,
    confirmOnExit: true,
  },

  'external.review': {
    id: 'external.review',
    rail: 'external',
    headerLabel: 'Send',
    heading: 'Review and pay',
    layout: 'column',
    canContinue: () => true,
    primaryLabel: (s, sel) => (sel ? `Pay ${sel.formatTotal(s)}` : 'Pay'),
    showBack: true,
    confirmOnExit: true,
    isSubmit: true,
  },

  'external.success': {
    id: 'external.success',
    rail: 'external',
    headerLabel: 'Send',
    heading: null,
    layout: 'centered',
    canContinue: () => true,
    primaryLabel: () => 'Done',
    secondaryLabel: () => 'View payout',
    footer: 'dual',
    terminal: true,
    showBack: false,
    confirmOnExit: false,
  },

  // ---- Email rail -------------------------------------------------------------
  'email.compose': {
    id: 'email.compose',
    rail: 'email',
    headerLabel: 'Pay by email',
    // No h1: the sheet header already says "Pay by email", and a heading repeating it
    // 60px lower named the screen twice before the first field.
    heading: null,
    layout: 'split',
    canContinue: (s) =>
      Boolean(
        s.emailInvite.email.trim() &&
        Number(s.emailInvite.amount) > 0 &&
        s.emailInvite.sourceAccountId &&
        // An invite that offers no way to accept can't be sent.
        s.emailInvite.methods.length > 0,
      ),
    primaryLabel: () => 'Send email',
    // 429:225139 draws no Back, but the step is reachable two ways — "Invite by
    // email" from the recipient screen and "Collect with email" from mid-way
    // through the add-recipient rail — and neither has an exit that isn't
    // abandoning the whole sheet. Back pops the history stack, so it returns to
    // whichever of the two you came from. Flagged as a departure from the frame.
    showBack: true,
    confirmOnExit: true,
    isSubmit: true,
  },

  'email.sent': {
    id: 'email.sent',
    rail: 'email',
    headerLabel: 'Pay by email',
    heading: null,
    layout: 'centered',
    canContinue: () => true,
    primaryLabel: () => 'Finish',
    secondaryLabel: () => 'View invite',
    footer: 'dual',
    terminal: true,
    showBack: false,
    confirmOnExit: false,
  },
};

export function getStep(cursor) {
  const step = STEPS[cursor.stepId];
  if (!step) throw new Error(`Unknown step: ${cursor.stepId}`);
  return step;
}

/** Next/previous step id within a rail, or null at the boundary. */
export function siblingStep(cursor, offset) {
  const rail = RAILS[cursor.rail];
  const i = rail.indexOf(cursor.stepId);
  if (i === -1)
    throw new Error(`Step ${cursor.stepId} is not in rail ${cursor.rail}`);
  return rail[i + offset] ?? null;
}

export function stepPosition(cursor) {
  const rail = RAILS[cursor.rail];
  return { index: rail.indexOf(cursor.stepId), total: rail.length };
}
