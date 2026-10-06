import { getStep, siblingStep } from './graph';
import { bankFieldsFor, country as countryByCode } from '../data/countries';
import { deliveryMethodsFor } from '../data/deliveryMethods';
import { TOKEN, network as networkById } from '../data/networks';
import { RECIPIENTS } from '../data/recipients';
import { methodsForRecipient } from '../data/payoutMethods';
import { ALL_PAYOUT_METHOD_IDS } from '../data/emailInvite';

const METHOD_LABELS = {
  bank: 'Bank account',
  card: 'Debit card',
  wallet: 'Stablecoin wallet',
};

const recipientById = (id) => RECIPIENTS.find((r) => r.id === id) ?? null;

function initialsFor(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/**
 * Turn the just-entered details into a selectable payout method.
 *
 * `supportedDelivery` comes from the recipient country's rails so the Delivery
 * control is populated; last4 is taken from whichever account-ish field was
 * filled, matching how the saved fixtures read ("Account ····4856").
 */
function methodFromNewRecipient(n, recipientId) {
  const isWallet = n.method === 'wallet';
  const place = countryByCode(n.country);

  const digits = bankFieldsFor(n.country, n.method)
    .map((f) => String(n[f.key] ?? '').replace(/\s+/g, ''))
    .filter(Boolean)
    .join('');

  return {
    id: `pm_new_${recipientId}`,
    recipientId,
    group: n.method ?? 'bank',
    label: isWallet
      ? networkById(n.network).label
      : (METHOD_LABELS[n.method] ?? 'Bank account'),
    logo: null, // no brand to show: these details were typed, not linked
    currency: isWallet ? TOKEN.currency : place.currency,
    country: n.country,
    last4: digits.slice(-4) || '0000',
    badge: null,
    supportedDelivery: deliveryMethodsFor(n.country).map((d) => d.id),
  };
}

/**
 * One reducer replacing 159 useState hooks.
 *
 * Rules that keep it honest:
 *  - Nothing derived is stored. Fees, totals, canContinue and the "Pay $101.50"
 *    label are computed in selectors on render. The original stored derived
 *    values and recomputed them inline at nine sites with three different rate
 *    tables — that duplication was the actual bug farm.
 *  - Cross-rail Back pops a history stack rather than reversing a formula. The
 *    original's goBack was a 65-line if/else chain (SendModal2.jsx:788-853)
 *    with three setTimeout overlay dances, and it's where its behaviour was
 *    least trustworthy.
 */

/** Where a committed sub-flow lands you: one step past the interrupt.
 *  Kept as a single constant so a moderator can flip it mid-session. */
const RETURN_ONE_STEP_PAST_INTERRUPT = true;

export const initialState = {
  cursor: { rail: 'main', stepId: 'recipient' },
  history: [],
  interrupt: null, // { returnTo: cursor, rail }

  draft: {
    recipientId: null,
    payoutMethodId: null,
    /**
     * One of the sender's OWN linked accounts, when they're paying themselves rather than a
     * recipient (data/externalAccounts.js). Mutually exclusive with recipientId in practice:
     * the two are different entry points from the first screen.
     */
    externalAccountId: null,
    deliveryMethodId: null,
    reference: { enabled: false, value: '' },
    swiftCode: '',
    wireNumber: '',
    sourceAccountId: null, // frame shows "Select an account" until chosen
    // `edited` discriminates which side of the FX pair the user typed into, and
    // `sendRaw` holds the in-progress "you send" text so it isn't reformatted
    // mid-keystroke. Ported deliberately — see SendModal2.jsx:4185-4205.
    amount: { value: '', currency: 'USD', edited: 'receive', sendRaw: '' },
    /**
     * The currency the recipient is paid in, when the sender has overridden it.
     *
     * Null means "whatever the destination holds", which is the usual case — a US
     * bank account is paid in USD. Set only by the currency selector beside the
     * receive amount, and cleared whenever the destination changes, since the new
     * account's own currency is the right default again.
     */
    receiveCurrency: null,
    timing: { when: 'now', date: null },
    note: { enabled: false, value: '' },
  },

  /**
   * Destinations whose payee name has been verified in this session (data/vop.js).
   *
   * Session state rather than fixture state: the fixture describes what the bank came
   * back with, and this records what the sender did about it. Resetting the flow puts
   * the unresolved check back, which is the state the prototype exists to show.
   */
  verifiedPayees: [],

  /** Scratch for the Confirmation of Payee sub-flow, seeded from the destination. */
  vop: { methodId: null, firstName: '', lastName: '' },

  newRecipient: {
    country: 'US',
    method: null, // 'bank' | 'card' | 'wallet'
    // Set when adding a method to someone who already exists (see ENTER_SUBFLOW).
    attachTo: null,
    /**
     * The rail the payout will take, when the form was opened because that rail asks
     * for something extra (RTP wants the payee's address). Null in the add-recipient
     * rail, where no rail has been chosen yet.
     */
    railId: null,
    routing: '',
    account: '',
    swift: '',
    wire: '',
    /**
     * The rail's own identifiers, when the form was opened to collect them — a SWIFT
     * code or a wire routing number. Distinct from `swift`/`wire` above, which are the
     * account details typed when ADDING a destination; these belong to the payout being
     * built, and commit straight back into the draft.
     */
    swiftCode: '',
    wireNumber: '',
    // Stablecoin wallet only. Preselected, as the frame shows BASE already chosen.
    network: 'base',
    type: 'individual', // 'individual' | 'company'
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    // Collected only when the recipient's country + type + payout method require
    // it — see data/kyc.js.
    addressLine1: '',
    addressLine2: '',
    addressCity: '',
    addressPostal: '',
  },

  emailInvite: {
    country: 'US',
    email: '',
    sourceAccountId: null, // frame shows "Select an account" until chosen
    amount: '',
    methods: [...ALL_PAYOUT_METHOD_IDS],
    note: { enabled: false, value: '' },
  },

  // `railSwitch` explains a rail the flow changed on the sender's behalf, when the
  // currency they chose took the selected one off the list — see PayoutDetailsStep.
  ui: {
    search: '',
    filterChip: null,
    openDropdown: null,
    feeExpanded: false,
    railSwitch: null,
  },

  // Recipients added during the session are appended here so they show in Recent.
  addedRecipients: [],

  balances: { USD: 124350, GBP: 48720, EUR: 67890, USDC: 32500 },

  pending: false,
  result: null, // { payoutId, sentAt, kind: 'payout' | 'invite' }
};

/** Immutable set at a dotted path: patch(obj, 'amount.value', '100') */
function patch(obj, path, value) {
  const [head, ...rest] = path.split('.');
  if (!rest.length) return { ...obj, [head]: value };
  return { ...obj, [head]: patch(obj[head] ?? {}, rest.join('.'), value) };
}

function advance(state, targetStepId, targetRail = state.cursor.rail) {
  return {
    ...state,
    history: [...state.history, state.cursor],
    cursor: { rail: targetRail, stepId: targetStepId },
  };
}

export function reducer(state, action) {
  switch (action.type) {
    case 'NAVIGATE_NEXT': {
      const step = getStep(state.cursor);

      // Last step of a sub-flow returns to the interrupted step instead of falling off
      // the end of its rail. A function when WHICH step is last depends on the state —
      // the additional-details rail asks for destination details, then personal ones only
      // if those are missing too.
      const exits =
        typeof step.exitsSubflow === 'function'
          ? step.exitsSubflow(state)
          : step.exitsSubflow;
      if (exits) return reducer(state, { type: 'EXIT_SUBFLOW', commit: true });

      const target = step.next
        ? step.next(state)
        : siblingStep(state.cursor, 1);
      if (!target) return state;
      return advance(state, target);
    }

    case 'NAVIGATE_BACK': {
      const step = getStep(state.cursor);

      // Back out of the step a sub-flow STARTED on cancels it, discarding scratch. Not
      // always the first step of the rail: the additional-details rail can open straight
      // on its personal form when only an address is missing, and Back there has to leave
      // the sub-flow rather than pop into a step the sender never saw.
      const previous = state.history[state.history.length - 1];
      const startedHere =
        previous &&
        state.interrupt &&
        previous.rail === state.interrupt.returnTo.rail &&
        previous.stepId === state.interrupt.returnTo.stepId;
      const isSubflowEntry =
        state.interrupt &&
        (siblingStep(state.cursor, -1) === null || startedHere);
      if (isSubflowEntry)
        return reducer(state, { type: 'EXIT_SUBFLOW', commit: false });

      if (state.history.length) {
        const history = state.history.slice(0, -1);
        return {
          ...state,
          cursor: state.history[state.history.length - 1],
          history,
        };
      }

      const target = step.back
        ? step.back(state)
        : siblingStep(state.cursor, -1);
      if (!target) return state;
      return { ...state, cursor: { ...state.cursor, stepId: target } };
    }

    case 'GOTO':
      return advance(state, action.stepId, action.rail ?? state.cursor.rail);

    case 'ENTER_SUBFLOW': {
      // `seed` carries what's already known. Entering from a recipient's payout
      // method dropdown means the person exists, so their country and name come
      // along — which is what lets the rail skip Personal details.
      const seeded =
        action.rail === 'addRecipient' || action.rail === 'kyc'
          ? {
              ...state,
              newRecipient: { ...initialState.newRecipient, ...action.seed },
            }
          : action.rail === 'vop'
            ? // The payee check seeds the name the sender holds, so the form opens on the
              // detail that failed rather than on empty fields.
              { ...state, vop: { ...initialState.vop, ...action.seed } }
            : state;
      return {
        ...advance(seeded, action.stepId, action.rail),
        interrupt: { returnTo: state.cursor, rail: action.rail },
      };
    }

    case 'EXIT_SUBFLOW': {
      // A moderator's ?step=ar.* jump lands mid-rail with no interrupt recorded.
      // Without a fallback the confirmation's Continue would be a no-op and the
      // sub-flow would dead-end, so treat it as if entered from the recipient step.
      const interrupt = state.interrupt ?? {
        rail: state.cursor.rail,
        returnTo: { rail: 'main', stepId: 'recipient' },
      };

      // Unwind history back to the interrupt so Back doesn't walk into the
      // abandoned sub-flow.
      const i = state.history.findIndex(
        (c) =>
          c.rail === interrupt.returnTo.rail &&
          c.stepId === interrupt.returnTo.stepId,
      );
      const history = i === -1 ? [] : state.history.slice(0, i);

      /**
       * Confirmation of Payee returns to the step that opened it either way — the
       * destination is still being chosen, so there is nothing past it to land on.
       * Committing marks the payee verified, which is what releases Continue.
       */
      if (interrupt.rail === 'vop') {
        const methodId = state.vop.methodId;
        const base = {
          ...state,
          cursor: interrupt.returnTo,
          history,
          interrupt: null,
          vop: initialState.vop,
        };
        if (!action.commit || !methodId) return base;
        return {
          ...base,
          verifiedPayees: [...new Set([...state.verifiedPayees, methodId])],
        };
      }

      /**
       * Additional KYC: the recipient already exists, so committing updates the session
       * copy of them rather than creating anything. Returns to the step that opened it,
       * where the payout is still being configured.
       */
      if (interrupt.rail === 'kyc') {
        const n = state.newRecipient;
        const id = n.attachTo;
        const base = {
          ...state,
          cursor: interrupt.returnTo,
          history,
          interrupt: null,
          newRecipient: initialState.newRecipient,
        };
        if (!action.commit || !id) return base;

        const existing =
          state.addedRecipients.find((r) => r.id === id) ?? recipientById(id);
        const methods = existing?.methods ?? methodsForRecipient(id);
        const updated = {
          ...existing,
          /**
           * The form showed the whole account, so an edit to it has to land somewhere: the
           * destination being paid keeps what was typed, and its last four digits follow
           * the account number rather than going stale against it.
           */
          methods: methods.map((m) =>
            m.id === state.draft.payoutMethodId
              ? {
                  ...m,
                  routing: n.routing,
                  account: n.account,
                  swift: n.swift,
                  wire: n.wire,
                  last4: String(n.account ?? '').slice(-4) || m.last4,
                }
              : m,
          ),
          email: n.email || existing?.email,
          addressOnFile: true,
          address: {
            country: n.country,
            line1: n.addressLine1,
            line2: n.addressLine2,
            city: n.addressCity,
            postal: n.addressPostal,
          },
        };

        return {
          ...base,
          addedRecipients: [
            updated,
            ...state.addedRecipients.filter((r) => r.id !== id),
          ],
          // The rail's identifiers belong to this payout, and the account details the form
          // showed belong to the destination — so both are written back, each to its own
          // place. `swift`/`wire` are the form's names for the same two numbers.
          draft: { ...state.draft, swiftCode: n.swift, wireNumber: n.wire },
          /**
           * The rail-changed explanation is spent: it exists to account for a change the
           * sender didn't make, and once they've been through the form that change asked for,
           * they've dealt with it — repeating the reason on the way back reads as though
           * something had changed again.
           *
           * Acknowledged rather than dropped. The record of WHICH rail was displaced is what
           * lets the switch be undone if the currency goes back (see PayoutDetailsStep), and
           * forgetting that would leave the payout on a $25 wire nobody chose.
           */
          ui: state.ui.railSwitch
            ? {
                ...state.ui,
                railSwitch: { ...state.ui.railSwitch, acknowledged: true },
              }
            : state.ui,
        };
      }

      if (!action.commit) {
        return {
          ...state,
          cursor: interrupt.returnTo,
          history,
          interrupt: null,
          newRecipient: initialState.newRecipient,
        };
      }

      // Attaching a method to someone who already exists: no new recipient, just
      // a new method on theirs. Fixture recipients aren't mutable, so the
      // session-local copy in addedRecipients carries the extra method.
      const attachTo = state.newRecipient.attachTo;
      if (action.commit && attachTo) {
        const existing =
          state.addedRecipients.find((r) => r.id === attachTo) ??
          recipientById(attachTo);
        const method = methodFromNewRecipient(state.newRecipient, attachTo);
        const updated = {
          ...existing,
          methods: [
            method,
            ...(existing?.methods ?? methodsForRecipient(attachTo)),
          ],
        };

        const landingStep = RETURN_ONE_STEP_PAST_INTERRUPT
          ? interrupt.returnTo.stepId
          : interrupt.returnTo.stepId;

        return {
          ...state,
          // Attaching returns to the payout method step it was launched from — the
          // point was to pick the new method, not to move on.
          cursor: { rail: interrupt.returnTo.rail, stepId: landingStep },
          history,
          interrupt: null,
          addedRecipients: [
            updated,
            ...state.addedRecipients.filter((r) => r.id !== attachTo),
          ],
          draft: {
            ...state.draft,
            payoutMethodId: method.id,
            deliveryMethodId: null,
          },
          newRecipient: initialState.newRecipient,
        };
      }

      // Commit: materialise the recipient, select it, and land past the interrupt.
      const committed =
        interrupt.rail === 'addRecipient'
          ? {
              id: `rec_new_${state.addedRecipients.length + 1}`,
              name:
                state.newRecipient.type === 'company'
                  ? state.newRecipient.companyName || 'New company'
                  : [state.newRecipient.firstName, state.newRecipient.lastName]
                      .filter(Boolean)
                      .join(' ') || 'New recipient',
              email: state.newRecipient.email,
              country: state.newRecipient.country,
              method: state.newRecipient.method,
              isNew: true,
            }
          : null;

      // 464:264637 lands on Payout method with the method already selected, so
      // the details just entered have to become a real payout method — otherwise
      // a brand-new recipient arrives with an empty dropdown and a dead Delivery
      // control.
      if (committed) {
        committed.initials = initialsFor(committed.name);
        committed.methods = [
          methodFromNewRecipient(state.newRecipient, committed.id),
        ];
      }

      const landing = RETURN_ONE_STEP_PAST_INTERRUPT
        ? (siblingStep(interrupt.returnTo, 1) ?? interrupt.returnTo.stepId)
        : interrupt.returnTo.stepId;

      return {
        ...state,
        cursor: { rail: interrupt.returnTo.rail, stepId: landing },
        history: [...history, interrupt.returnTo],
        interrupt: null,
        addedRecipients: committed
          ? [committed, ...state.addedRecipients]
          : state.addedRecipients,
        draft: committed
          ? {
              ...state.draft,
              recipientId: committed.id,
              payoutMethodId: committed.methods[0].id,
            }
          : state.draft,
        newRecipient: initialState.newRecipient,
      };
    }

    case 'SELECT_RECIPIENT':
      return {
        ...state,
        draft: {
          ...state.draft,
          recipientId: action.recipientId,
          // A different recipient invalidates the method chosen for the old one.
          payoutMethodId: null,
          deliveryMethodId: null,
        },
      };

    case 'ADOPT_RECIPIENT': {
      const recipient = action.recipient;
      return {
        ...state,
        addedRecipients: [
          recipient,
          ...state.addedRecipients.filter((item) => item.id !== recipient.id),
        ],
        draft: {
          ...state.draft,
          recipientId: recipient.id,
          payoutMethodId: recipient.methods?.[0]?.id ?? null,
          deliveryMethodId: null,
        },
        cursor: { rail: 'main', stepId: 'payoutMethod' },
        history: [{ rail: 'main', stepId: 'recipient' }],
        interrupt: null,
        newRecipient: initialState.newRecipient,
      };
    }

    case 'PATCH_DRAFT':
      return { ...state, draft: patch(state.draft, action.path, action.value) };

    case 'PATCH_NEW_RECIPIENT':
      return {
        ...state,
        newRecipient: patch(state.newRecipient, action.path, action.value),
      };

    case 'PATCH_VOP':
      return { ...state, vop: patch(state.vop, action.path, action.value) };

    case 'PATCH_EMAIL_INVITE':
      return {
        ...state,
        emailInvite: patch(state.emailInvite, action.path, action.value),
      };

    case 'SET_UI':
      return { ...state, ui: patch(state.ui, action.path, action.value) };

    case 'SUBMIT_PENDING':
      return { ...state, pending: true };

    case 'SUBMIT_DONE': {
      const kind = state.cursor.rail === 'email' ? 'invite' : 'payout';
      const target = kind === 'invite' ? 'email.sent' : 'success';
      return {
        ...advance(state, target),
        pending: false,
        // `snapshot` is the payout as sent: a detail page is a record of what
        // happened, not a live read of the draft. Without it, going back and
        // editing the amount would rewrite history.
        result: {
          payoutId: action.payoutId,
          sentAt: action.sentAt,
          kind,
          snapshot: action.snapshot ?? null,
        },
      };
    }

    case 'RESET':
      return initialState;

    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}
