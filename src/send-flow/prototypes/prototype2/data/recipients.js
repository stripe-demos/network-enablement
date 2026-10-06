import { GENERATED_ENTITIES } from './entities.js';

/**
 * Recipient fixtures, modelled on 429:226230 (section 7, the canonical recipient
 * screen) and trimmed from the original's 100 entries (SendModal2.jsx:18-111).
 *
 * `stripeId` exists because the frames match on email AND on acct_/cus_ ids.
 * `entity` backs the chip filter and decides which identifier a row shows.
 *
 * Design data slips corrected here, and worth raising with the designer:
 *  - "Avon Barksdale" showed initials JD; "Keema Greggs" showed AC.
 *  - "Baltimore city council" showed £4,920.45 against a US flag.
 *  - "Stringer Bell" showed $5029.33, missing its thousands separator.
 *  - "B&B Enterprises" showed Dh30,000.00 (AED) against an SA flag; the flag set
 *    has no SA artwork either, so that row is now a CH recipient in CHF.
 */
const FEATURED = [
  // One of each entity type, so the fixtures exercise every identifier format. Only
  // the recipients and Stripe profiles among them are payable, so a search for "John"
  // now returns those and skips the connected account and the customer.
  {
    id: 'rec_john_burns',
    name: 'John Burns',
    initials: 'JB',
    email: 'john.burns@example.com',
    stripeId: 'cus_JbRnS1FqNZlRT',
    entity: 'recipient',
    country: 'US',
    currency: 'USD',
    lastAmount: 240,
    lastPaidOn: '2027-03-11',
    methodIds: ['pm_johnburns_bank'],
  },
  {
    id: 'rec_john_clothings',
    name: 'John Clothings',
    initials: 'JC',
    email: 'ap@clothings.example.com',
    stripeId: 'acct_1SxpAKFvIIGJJI',
    entity: 'connected',
    country: 'US',
    currency: 'USD',
    lastAmount: 1875.4,
    lastPaidOn: '2027-03-10',
    methodIds: ['pm_johnclothings_bank'],
  },
  {
    id: 'rec_john_smith',
    name: 'John Smith',
    initials: 'JS',
    email: 'john.smith@example.com',
    stripeId: 'cus_UCVSCIfFqNZlRT',
    entity: 'customer',
    country: 'US',
    currency: 'USD',
    lastAmount: 86.5,
    lastPaidOn: '2027-03-07',
    methodIds: ['pm_johnsmith_bank'],
  },
  {
    id: 'rec_avon',
    name: 'Avon Barksdale',
    initials: 'AB',
    email: 'avon@barksdale.example.com',
    stripeId: 'cus_NffrFeUfNV2Hib',
    entity: 'recipient',
    country: 'US',
    currency: 'USD',
    lastAmount: 523.83,
    lastPaidOn: '2027-03-12',
    methodIds: ['pm_avon_bank'],
  },
  {
    id: 'rec_baltimore',
    name: 'Baltimore city council',
    initials: 'B',
    email: 'payments@baltimorecc.example.org',
    stripeId: 'cus_PqR3tYuI0pLmNb',
    entity: 'customer',
    country: 'US',
    currency: 'USD',
    lastAmount: 4920.45,
    lastPaidOn: '2027-03-09',
    methodIds: ['pm_baltimore_bank'],
  },
  {
    id: 'rec_stringer',
    name: 'Stringer Bell',
    initials: 'SB',
    email: 'stringer@bnb.example.com',
    stripeId: 'cus_LmN0pQrStUvWxY',
    entity: 'recipient',
    country: 'US',
    currency: 'USD',
    lastAmount: 5029.33,
    lastPaidOn: '2027-03-08',
    methodIds: ['pm_stringer_bank'],
  },
  {
    id: 'rec_marlo',
    name: 'Marlo Stanfield',
    initials: 'MS',
    email: 'marlo@stanfield.example.com',
    stripeId: 'cus_ZxYwVuTsRqPoNm',
    entity: 'recipient',
    country: 'CH',
    currency: 'CHF',
    lastAmount: 13892.53,
    lastPaidOn: '2027-03-03',
    methodIds: ['pm_marlo_bank'],
  },
  {
    id: 'rec_bnb',
    name: 'B&B Enterprises',
    initials: 'B',
    email: 'accounts@bnbenterprises.example.com',
    stripeId: 'acct_1QwErTyUiOpAsDf',
    entity: 'connected',
    country: 'CH',
    currency: 'CHF',
    lastAmount: 30000,
    lastPaidOn: '2027-03-03',
    methodIds: ['pm_bnb_bank'],
  },
  {
    id: 'rec_bunk',
    name: 'Bunk Moreland',
    initials: 'BM',
    email: 'bunk@bpd.example.org',
    stripeId: 'cus_AsDfGhJkLzXcVb',
    entity: 'recipient',
    country: 'US',
    currency: 'USD',
    lastAmount: 53.21,
    lastPaidOn: '2027-03-03',
    methodIds: ['pm_bunk_bank'],
  },
  {
    id: 'rec_keema',
    name: 'Keema Greggs',
    initials: 'KG',
    email: 'keema@greggs.example.org',
    stripeId: 'cus_QwErTyUiOpAsDf',
    entity: 'recipient',
    country: 'FR',
    currency: 'EUR',
    lastAmount: 100,
    lastPaidOn: '2027-03-01',
    methodIds: ['pm_keema_bank'],
  },
  {
    id: 'rec_omar',
    name: 'Omar Little',
    initials: 'OL',
    email: 'omar@little.example.org',
    stripeId: 'cus_TyUiOpAsDfGhJk',
    entity: 'recipient',
    country: 'GB',
    currency: 'GBP',
    lastAmount: 1240,
    lastPaidOn: '2027-02-24',
    methodIds: ['pm_omar_bank'],
  },
  /**
   * A UK recipient whose name doesn't quite match the name on their account — the
   * Confirmation of Payee case. The sender has "Brother Mouzon"; the bank holds
   * "Brother Mouzone", so the check comes back a close match and the payout is
   * blocked until it's resolved. See data/vop.js.
   */
  {
    id: 'rec_mouzone',
    name: 'Brother Mouzone',
    initials: 'BM',
    email: 'b.mouzone@example.com',
    stripeId: 'cus_MzNe7rQvKpLd2',
    entity: 'recipient',
    country: 'GB',
    currency: 'GBP',
    lastAmount: 1450,
    lastPaidOn: '2027-03-04',
    methodIds: ['pm_mouzone_bank'],
  },
  /**
   * A US recipient with no address on file — the additional-KYC case. Paying them by
   * ACH asks for nothing extra; choosing RTP does, because the scheme carries the
   * payee's address. See data/kyc.js.
   */
  {
    id: 'rec_clay',
    name: 'Clay Davis',
    initials: 'CD',
    email: 'clay.davis@example.com',
    stripeId: 'cus_ClYDvS4xTbN1p',
    entity: 'recipient',
    country: 'US',
    currency: 'USD',
    lastAmount: 3200,
    lastPaidOn: '2027-02-27',
    // Every other fixture has been paid before and has their address held; this one
    // has only ever been paid over a rail that didn't ask for it.
    addressOnFile: false,
    methodIds: ['pm_clay_bank'],
  },
];

/**
 * FEATURED rows reproduce specific design frames; GENERATED_ENTITIES supplies
 * bulk volume (100 recipients, 20 customers, 30 connected accounts, 100 Stripe
 * profiles) so search and the chip filters have something real to chew on.
 */
export const RECIPIENTS = [...FEATURED, ...GENERATED_ENTITIES];

/**
 * Every entity type in the fixtures. Each identifies itself differently in search
 * results, which is the whole point of distinguishing them: you recognise a
 * connected account by its acct_ id and a Stripe profile by its @handle.
 *
 * Only some are payable from this flow — see PAYABLE_ENTITY_IDS below, which is what
 * the chips and the search actually draw on. Chip order matches the frame, with
 * "All" first.
 */
export const ENTITY_TYPES = [
  {
    id: 'recipient',
    label: 'Recipients',
    singular: 'Recipient',
    collective: 'recipients',
  },
  {
    id: 'connected',
    label: 'Connected accounts',
    singular: 'Connected account',
    collective: 'connected accounts',
  },
  // Chip and search-result heading say the same word: "Stripe network" here and
  // "Stripe profiles" over the results named one concept two ways.
  {
    id: 'profile',
    label: 'Stripe profiles',
    singular: 'Stripe profile',
    collective: 'Stripe profiles',
  },
  {
    id: 'customer',
    label: 'Customers',
    singular: 'Customer',
    collective: 'customers',
  },
];

/**
 * The only two kinds of thing this flow can pay: a recipient you've saved, and a
 * business's Stripe profile.
 *
 * Connected accounts and customers stay in ENTITY_TYPES — `identifierFor` still
 * knows how to label an acct_ or cus_ id, and the fixtures still carry them — but
 * they're neither offered as a filter nor returned by a search. Sending to them is
 * a different product surface, and a chip that filtered to rows the flow can't pay
 * is a dead end dressed up as a choice.
 */
export const PAYABLE_ENTITY_IDS = new Set(['recipient', 'profile']);

export function isPayable(r) {
  return PAYABLE_ENTITY_IDS.has(r.entity);
}

const PAYABLE_TYPES = ENTITY_TYPES.filter((t) => PAYABLE_ENTITY_IDS.has(t.id));

export const ENTITY_FILTERS = [{ id: null, label: 'All' }, ...PAYABLE_TYPES];

/**
 * The identifier shown as the secondary line in search results.
 *   recipient → email          connected → acct_…
 *   profile   → @handle        customer  → cus_…
 */
export function identifierFor(r) {
  switch (r.entity) {
    case 'connected':
      return r.stripeId;
    case 'profile':
      return r.handle ?? r.email;
    case 'customer':
      return r.stripeId;
    default:
      return r.email;
  }
}

/**
 * The Recent list: 20 rows, both payable entity types represented.
 *
 * Taking the 20 most recent outright would be dominated by whichever type
 * happens to have the freshest dates, so this picks round-robin across the types
 * (newest first within each) and then re-sorts the winners by date — so it still
 * reads as "Recent" while always showing the mix.
 */
export function recentEntities(list, limit = 20) {
  const byType = new Map();
  for (const type of PAYABLE_TYPES) {
    byType.set(
      type.id,
      list
        .filter((r) => r.entity === type.id && r.lastPaidOn)
        .sort((a, b) => b.lastPaidOn.localeCompare(a.lastPaidOn)),
    );
  }

  const picked = [];
  for (let round = 0; picked.length < limit; round += 1) {
    let addedThisRound = false;
    for (const type of PAYABLE_TYPES) {
      if (picked.length >= limit) break;
      const candidate = byType.get(type.id)[round];
      if (candidate) {
        picked.push(candidate);
        addedThisRound = true;
      }
    }
    if (!addedThisRound) break; // every type exhausted
  }

  return picked.sort((a, b) => b.lastPaidOn.localeCompare(a.lastPaidOn));
}

/** Search matches name, email, @handle and Stripe id. */
export function searchRecipients(list, query, entity) {
  const q = query.trim().toLowerCase();
  return list.filter((r) => {
    // Connected accounts and customers aren't payable from this flow, so they never
    // surface — not under "All", and not by typing an acct_ or cus_ id either.
    if (!isPayable(r)) return false;
    if (entity && r.entity !== entity) return false;
    if (!q) return true;
    return [r.name, r.email, r.handle, r.stripeId]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(q));
  });
}

/** Anything that isn't an unsaved Stripe profile is yours. */
export function isSaved(r) {
  return r.saved !== false;
}

/**
 * Search results split into what you've saved and what's merely discoverable.
 *
 * Stripe profiles are public: any business on Stripe can be found and paid, but
 * only some are in your list. Showing them in one flat list would imply you have
 * a relationship with all of them, so the two are separate sections — saved
 * first, since that's what most searches are looking for.
 */
export function searchGrouped(list, query, entity) {
  const matches = searchRecipients(list, query, entity);
  return {
    saved: matches.filter(isSaved),
    discoverable: matches.filter((r) => !isSaved(r)),
  };
}
