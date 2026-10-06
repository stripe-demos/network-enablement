import { GENERATED_PAYOUT_METHODS } from './entities.js';

/**
 * Payout methods per recipient, grouped as the dropdown groups them on
 * 429:221632 (Cards / Bank accounts, then "Add payout method").
 *
 * `supportedDelivery` is what populates the Delivery control — a card method
 * offers no bank rails, which is why the two controls are coupled.
 *
 * `lastDeliveryId` is the rail this destination was last paid over, and only a
 * destination you've actually paid has one. It drives both the Delivery control's
 * default and its "Last used" tag; a destination without one falls back to the
 * recommended rail. Set deliberately to a rail that ISN'T the recommendation on
 * most of these, since "your habit differs from our advice" is the state worth
 * seeing — pm_johnclothings_bank is the exception, so the case where the two
 * agree (one tag, not two) is reachable too.
 */
const FEATURED_METHODS = [
  {
    id: 'pm_johnburns_bank',
    // On file, so the additional-details form opens on the account as it stands
    // rather than on empty fields — see steps/kyc/DestinationDetailsStep.
    routing: '021000021',
    account: '000123453391',
    recipientId: 'rec_john_burns',
    group: 'bank',
    label: 'Capital One',
    logo: '/logos/banks/capitalone.png',
    currency: 'USD',
    country: 'US',
    last4: '3391',
    badge: 'lastUsed',
    lastDeliveryId: 'standard', // RTP is the recommendation, so both tags show
  },
  {
    id: 'pm_johnclothings_bank',
    recipientId: 'rec_john_clothings',
    group: 'bank',
    label: 'Goldman Sachs',
    logo: '/logos/banks/goldmansachs.png',
    currency: 'USD',
    country: 'US',
    last4: '8814',
    badge: 'lastUsed',
    lastDeliveryId: 'rtp', // agrees with the recommendation — "Last used" only
  },
  {
    id: 'pm_johnsmith_bank',
    recipientId: 'rec_john_smith',
    group: 'card',
    label: 'Visa debit',
    logo: '/logos/banks/visa.png',
    currency: 'USD',
    country: 'US',
    last4: '2077',
  },
  {
    id: 'pm_avon_bank',
    // On file, so the additional-details form opens on the account as it stands
    // rather than on empty fields — see steps/kyc/DestinationDetailsStep.
    routing: '026009593',
    account: '000987654856',
    recipientId: 'rec_avon',
    group: 'bank',
    // The frame shows "Wells Fargo", but this repo has no Wells Fargo artwork
    // (and SailIcons has no brand glyph for it). Relabelled to a bank we can
    // render honestly rather than putting a BoA mark under a Wells Fargo name.
    label: 'Bank of America',
    logo: '/logos/banks/boa.png',
    currency: 'USD',
    country: 'US',
    last4: '4856',
    badge: 'lastUsed',
    lastDeliveryId: 'fedwire',
  },
  {
    id: 'pm_avon_card',
    recipientId: 'rec_avon',
    group: 'card',
    label: 'Visa debit',
    logo: '/logos/banks/visa.png',
    currency: 'USD',
    country: 'US',
    last4: '1092',
  },
  {
    id: 'pm_baltimore_bank',
    recipientId: 'rec_baltimore',
    group: 'bank',
    label: 'Bank of America',
    logo: '/logos/banks/boa.png',
    currency: 'USD',
    country: 'US',
    last4: '2210',
  },
  {
    id: 'pm_stringer_bank',
    recipientId: 'rec_stringer',
    group: 'bank',
    label: 'Capital One',
    logo: '/logos/banks/capitalone.png',
    currency: 'USD',
    country: 'US',
    last4: '9902',
  },
  {
    id: 'pm_marlo_bank',
    recipientId: 'rec_marlo',
    group: 'bank',
    // Was Deutsche Bank, which is licensed in Germany, not Switzerland. UBS has
    // no artwork here, so it renders as a bank tile rather than a foreign mark.
    label: 'UBS',
    currency: 'CHF',
    country: 'CH',
    last4: '4471',
  },
  {
    id: 'pm_bnb_bank',
    recipientId: 'rec_bnb',
    group: 'bank',
    // Was ABN AMRO — Dutch, and this account is Swiss.
    label: 'PostFinance',
    currency: 'CHF',
    country: 'CH',
    last4: '8120',
  },
  {
    id: 'pm_bunk_bank',
    recipientId: 'rec_bunk',
    group: 'bank',
    label: 'Navy Federal',
    logo: '/nfcu-logo.png',
    currency: 'USD',
    country: 'US',
    last4: '5540',
  },
  {
    id: 'pm_keema_bank',
    recipientId: 'rec_keema',
    group: 'bank',
    // Was Cartes Bancaires, which is France's domestic card scheme rather than a
    // bank — wrong on a group: 'bank' method. It's offered on French cards instead.
    label: 'BNP Paribas',
    currency: 'EUR',
    country: 'FR',
    last4: '6633',
  },
  {
    id: 'pm_omar_bank',
    // On file, so the additional-details form opens on the account as it stands
    // rather than on empty fields — see steps/kyc/DestinationDetailsStep.
    routing: '10-88-00',
    account: '00017024',
    recipientId: 'rec_omar',
    group: 'bank',
    label: 'Revolut',
    logo: '/logos/banks/revolut.png',
    currency: 'GBP',
    country: 'GB',
    last4: '7024',
  },
  {
    id: 'pm_mouzone_bank',
    // On file, so the additional-details form opens on the account as it stands
    // rather than on empty fields — see steps/kyc/DestinationDetailsStep.
    routing: '04-00-04',
    account: '00014856',
    recipientId: 'rec_mouzone',
    group: 'bank',
    // The frame shows Santander; this repo has no Santander artwork, so the account
    // is a Monzo one rather than a Santander name over someone else's mark — the same
    // substitution the Wells Fargo row above makes.
    label: 'Monzo',
    logo: '/logos/banks/monzo.png',
    currency: 'GBP',
    country: 'GB',
    last4: '4856',
    badge: 'lastUsed',
    lastDeliveryId: 'fps',
    /**
     * The name the sender holds for this payee, and what the UK payee check came back
     * with. `payee` is one letter off the account holder, which is exactly the case
     * Confirmation of Payee exists to catch — see data/vop.js.
     */
    payee: { firstName: 'Brother', lastName: 'Mouzon' },
    vop: {
      status: 'close_match',
      accountName: 'Brother Mouzone',
      suggestion: { firstName: 'Brother', lastName: 'Mouzone' },
    },
  },
  {
    id: 'pm_clay_bank',
    // On file, so the additional-details form opens on the account as it stands
    // rather than on empty fields — see steps/kyc/DestinationDetailsStep.
    routing: '110000000',
    account: '000123455517',
    recipientId: 'rec_clay',
    group: 'bank',
    // Named for the artwork the repo actually has, as the rows above are.
    label: 'Bank of America',
    logo: '/logos/banks/boa.png',
    currency: 'USD',
    country: 'US',
    last4: '5517',
    badge: 'lastUsed',
    // ACH, so the destination opens on a rail that asks for nothing extra: the
    // additional-KYC state is something the sender walks into by choosing RTP.
    lastDeliveryId: 'standard',
  },
];

export const PAYOUT_METHODS = [
  ...FEATURED_METHODS,
  ...GENERATED_PAYOUT_METHODS,
];

export const METHOD_GROUPS = [
  // The group names the KIND of destination, as every other group does ("Cards",
  // "Bank accounts"). It used to carry the profile's own name, which duplicated the
  // recipient row above it. Singular: a recipient has exactly one Stripe profile,
  // where the other two groups can hold several.
  { id: 'profile', label: 'Stripe profile' },
  { id: 'card', label: 'Cards' },
  { id: 'bank', label: 'Bank accounts' },
];

export function methodsForRecipient(recipientId) {
  return PAYOUT_METHODS.filter((m) => m.recipientId === recipientId);
}

export function payoutMethod(id) {
  return PAYOUT_METHODS.find((m) => m.id === id) ?? null;
}

/** "USD · ····4856" — the secondary line in the frames, less the kind word. */
export function methodSublabel(m) {
  // A Stripe profile has no account number — the handle is the identifier, and it
  // needs no explaining: the row above it already says "Stripe profile".
  if (m.group === 'profile') return `${m.currency} · ${m.handle ?? ''}`.trim();
  // The kind of account, then its last four digits: "USD · Account ····4856". The word
  // was dropped once on the grounds that the group heading above the row says it — but the
  // collapsed trigger has no heading above it, and four digits on their own don't say what
  // they identify.
  const kind = m.group === 'card' ? 'Card' : 'Account';
  return `${m.currency} · ${kind} ····${m.last4}`;
}

/**
 * "GBP · Monzo ····6180" — the sublabel plus the institution's name.
 *
 * For rows that have to confirm WHICH account, where the method's own label isn't
 * already on screen: Payout details and Review both show the recipient's name on
 * the line above, so without the bank name those rows offered four digits and
 * nothing to recognise. `methodSublabel` stays the shorter form, for rows sitting
 * under a group heading that already names the kind.
 */
export function methodLine(m, { currency = true } = {}) {
  if (!m) return null;
  // A profile has no institution and no account number — the handle is the whole
  // identifier, so the short form is already complete.
  if (m.group === 'profile') {
    const short = methodSublabel(m);
    return currency ? short : short.replace(/^\S+\s·\s/, '');
  }
  // A wallet is identified by its address, not by four digits — the sender's own
  // stablecoin wallets (data/externalAccounts.js) are the case that reaches this.
  if (m.address) {
    return currency
      ? `${m.currency} · ${m.label} ${m.address}`
      : `${m.label} ${m.address}`;
  }
  // `currency: false` where a currency selector sits beside the amount: the code
  // would then appear twice in one row, once as a fact and once as a control.
  return currency
    ? `${m.currency} · ${m.label} ····${m.last4}`
    : `${m.label} ····${m.last4}`;
}
