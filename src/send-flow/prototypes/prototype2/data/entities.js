import { deliveryMethodsFor } from './deliveryMethods.js';
import { USD_RATES } from './fx.js';

const ZERO_DECIMAL = new Set(['JPY']);

/**
 * Bulk mock entities: 100 recipients, 20 customers, 30 connected accounts and
 * 100 Stripe network profiles.
 *
 * Generated deterministically from compact word lists rather than written out as
 * 250 literals — so the file stays readable and the data is stable across
 * renders and test runs (no Math.random anywhere).
 *
 * LOGOS: the Sail library in Figma carries brand glyphs (wellsfargo, hsbc,
 * mailchimp, openai…), but this repo's SailIcons bundle is 200 UI icons only —
 * no brand artwork. So the real PNGs in public/logos are assigned to the
 * companies they actually belong to, and everything else uses initials on a
 * panel fill, which is what most rows in the designs do anyway.
 */

const FIRST = [
  'John',
  'Amara',
  'Luca',
  'Priya',
  'Mateo',
  'Ingrid',
  'Hassan',
  'Yuki',
  'Sofia',
  'Dmitri',
  'Chiara',
  'Kwame',
  'Elena',
  'Tomas',
  'Aisha',
  'Bjorn',
  'Nadia',
  'Rafael',
  'Mei',
  'Oscar',
  'Fatima',
  'Henrik',
  'Camila',
  'Arjun',
  'Lena',
  'Diego',
  'Zara',
  'Noah',
  'Anouk',
  'Idris',
];

const LAST = [
  'Burns',
  'Okafor',
  'Ferrari',
  'Raman',
  'Alvarez',
  'Lindqvist',
  'Nasser',
  'Tanaka',
  'Moreau',
  'Volkov',
  'Rossi',
  'Mensah',
  'Petrova',
  'Novak',
  'Rahman',
  'Eriksen',
  'Haddad',
  'Costa',
  'Chen',
  'Lindgren',
  'Bakri',
  'Sorensen',
  'Duarte',
  'Kapoor',
  'Fischer',
  'Salazar',
  'Ahmed',
  'Whitfield',
  'De Vries',
  'Balogun',
];

const COMPANY_A = [
  'Northwind',
  'Cobalt',
  'Lantern',
  'Harbour',
  'Meridian',
  'Foxglove',
  'Ardent',
  'Copperleaf',
  'Bright',
  'Ironwood',
  'Verdant',
  'Juniper',
  'Solstice',
  'Kestrel',
  'Onyx',
  'Palisade',
  'Quarry',
  'Riverbend',
  'Sable',
  'Thistle',
  'Umber',
  'Vantage',
  'Wayfare',
  'Yardley',
  'Zephyr',
  'Alder',
  'Bramble',
  'Cinder',
  'Dovetail',
  'Ember',
];

const COMPANY_B = [
  'Studio',
  'Labs',
  'Collective',
  'Supply',
  'Works',
  'Group',
  'Trading',
  'Foods',
  'Logistics',
  'Media',
  'Health',
  'Robotics',
  'Interiors',
  'Freight',
  'Analytics',
  'Brewing',
];

/**
 * The Wire set.
 *
 * recipients.js already hand-writes eight of these (Avon Barksdale, Stringer
 * Bell, B&B Enterprises...) because the frames use them, and a list where those
 * eight sit among 240 procedurally-named strangers reads like two datasets
 * stapled together. These extend the joke far enough that the Recent list and a
 * search both land on it. Names already used in recipients.js are omitted.
 *
 * All Baltimore, so all US — `build` takes a place override for this reason.
 */
const WIRE_PEOPLE = [
  'Jimmy McNulty',
  'Lester Freamon',
  'Cedric Daniels',
  'Rhonda Pearlman',
  'Ellis Carver',
  'Wee-Bey Brice',
  'Chris Partlow',
  'Slim Charles',
  'Frank Sobotka',
  'Clay Davis',
  'Bodie Broadus',
  'Michael Lee',
];

const WIRE_BUSINESSES = [
  'Baltimore funeral home',
  "Orlando's",
  'Barksdale Property Management',
  'Prop Joe Appliance Repair',
  'Sobotka Stevedoring',
  'IBS Local 1514',
  'New Day Co-Op',
  'Hamsterdam Holdings',
];

/** Countries limited to those with flag artwork in ui/FlagIcon.jsx. */
const PLACES = [
  { country: 'US', currency: 'USD' },
  { country: 'GB', currency: 'GBP' },
  { country: 'FR', currency: 'EUR' },
  { country: 'DE', currency: 'EUR' },
  { country: 'CH', currency: 'CHF' },
  { country: 'JP', currency: 'JPY' },
  { country: 'BR', currency: 'BRL' },
  { country: 'IN', currency: 'INR' },
];

/**
 * Banks a payout method can be held at, by the country the account is in.
 *
 * Keyed by country rather than one flat cycling list: the old version assigned
 * `BANKS[k % BANKS.length]`, which put Monzo on Japanese accounts and Deutsche
 * Bank on American ones. A bank is licensed somewhere, so where the account is
 * held has to pick the bank.
 *
 * Only US/GB/DE artwork exists in public/logos/banks, so banks outside those
 * markets carry no logo and fall back to MethodMark's bank tile. A real local
 * name with a generic mark reads honestly; a foreign brand mark does not.
 *
 * ABN AMRO is Dutch and Cartes Bancaires is a card scheme, so neither is a bank
 * in any market this prototype sends to — their artwork is left unused.
 */
const BANKS_BY_COUNTRY = {
  US: [
    { label: 'Bank of America', logo: '/logos/banks/boa.png' },
    { label: 'Capital One', logo: '/logos/banks/capitalone.png' },
    { label: 'Goldman Sachs', logo: '/logos/banks/goldmansachs.png' },
    { label: 'Navy Federal', logo: '/nfcu-logo.png' },
    { label: 'Chase' },
    { label: 'Citibank' },
  ],
  GB: [
    { label: 'Monzo', logo: '/logos/banks/monzo.png' },
    { label: 'Revolut', logo: '/logos/banks/revolut.png' },
    { label: 'Barclays' },
    { label: 'Lloyds Bank' },
    { label: 'NatWest' },
  ],
  FR: [
    { label: 'BNP Paribas' },
    { label: 'Société Générale' },
    { label: 'Crédit Agricole' },
  ],
  DE: [
    { label: 'Deutsche Bank', logo: '/logos/banks/deutschebank.png' },
    { label: 'Commerzbank' },
    { label: 'N26' },
  ],
  CH: [
    { label: 'UBS' },
    { label: 'PostFinance' },
    { label: 'Zürcher Kantonalbank' },
  ],
  JP: [
    { label: 'MUFG Bank' },
    { label: 'Mizuho Bank' },
    { label: 'Sumitomo Mitsui' },
  ],
  BR: [
    { label: 'Itaú Unibanco' },
    { label: 'Nubank' },
    { label: 'Banco do Brasil' },
  ],
  IN: [
    { label: 'HDFC Bank' },
    { label: 'ICICI Bank' },
    { label: 'State Bank of India' },
  ],
};

/** Falls back to a name that claims no market rather than the wrong one. */
const GENERIC_BANK = [{ label: 'Local bank account' }];

function banksFor(country) {
  return BANKS_BY_COUNTRY[country] ?? GENERIC_BANK;
}

/**
 * Card schemes. Visa and Mastercard are everywhere; Amex is issued in the
 * markets here but is far rarer, so it sits last and gets picked least. Cartes
 * Bancaires is the French domestic debit scheme, so it's offered only in France.
 */
const CARDS = [
  { label: 'Visa debit', logo: '/logos/banks/visa.png' },
  { label: 'Mastercard debit', logo: '/logos/banks/mastercard.png' },
  { label: 'Amex', logo: '/logos/banks/amex.png' },
];

const CARDS_BY_COUNTRY = {
  FR: [
    ...CARDS.slice(0, 2),
    { label: 'Cartes Bancaires', logo: '/logos/banks/cartesbancaires.png' },
  ],
};

function cardsFor(country) {
  return CARDS_BY_COUNTRY[country] ?? CARDS;
}

/**
 * Brand icons exported from the Sail BrandIcon library in Figma
 * (zFxwLo0kgHg1YuHVOOX7lB, node 456:248218) into public/logos/brands.
 *
 * Deliberately real businesses rather than payment methods or banks — the Stripe
 * network profiles are named for the company whose icon they carry, so the row
 * and the mark always agree. Handles are the companies' real ones.
 */
const BRAND_ICONS = {
  Airtable: 'airtable',
  Anthropic: 'anthropic',
  Cloudflare: 'cloudflare',
  GitHub: 'github',
  Google: 'google',
  Notion: 'notion',
  OpenAI: 'openai',
  Shopify: 'shopify',
  Slack: 'slack',
  Stripe: 'stripe',
};

/** The recognisable brands you've already saved; the rest are public-only. */
const SAVED_BRANDS = new Set(['OpenAI', 'Airtable', 'Notion']);

const REAL_LOGOS = Object.fromEntries(
  Object.entries(BRAND_ICONS).map(([name, file]) => [
    name,
    `/logos/brands/${file}.svg`,
  ]),
);

/** Rails come from the delivery-method table, so adding a market is one edit. */
function railsFor(country) {
  return deliveryMethodsFor(country).map((d) => d.id);
}

/**
 * Stable index into a list from a string key.
 *
 * Indexing by position put the same bank on every US profile: profiles sit
 * consecutively in the source list, and the stride between the saved ones
 * happened to be a multiple of the list length.
 */
function pickBy(key, list) {
  let h = 0;
  for (let i = 0; i < key.length; i++)
    h = (h * 31 + key.charCodeAt(i)) % 100003;
  return list[h % list.length];
}

/** Deterministic pseudo-id so rows look like real Stripe objects. */
function idSuffix(prefix, n) {
  const alphabet =
    'ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789';
  let out = '';
  let x = (n + 7) * 2654435761;
  for (let i = 0; i < 16; i += 1) {
    x = (x * 48271 + 11) % 2147483647;
    out += alphabet[x % alphabet.length];
  }
  return `${prefix}${out}`;
}

/**
 * Pairing the two word lists as (i mod n, i div n) guarantees a unique
 * combination for every i below n * m — an earlier formula multiplied the index
 * into both halves and collided 93 times out of 250.
 */
function personName(i) {
  return `${FIRST[i % FIRST.length]} ${LAST[Math.floor(i / FIRST.length) % LAST.length]}`;
}

function companyName(i) {
  return `${COMPANY_A[i % COMPANY_A.length]} ${COMPANY_B[Math.floor(i / COMPANY_A.length) % COMPANY_B.length]}`;
}

function initialsOf(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function emailFor(name, i) {
  const [first, ...rest] = name.split(/\s+/);
  // Every domain is under example.com / example.org — RFC 2606 reserved, so
  // undeliverable. The previous list (mail.com, inbox.co, post.io) were real
  // domains, which makes a mock address one that could reach a real person.
  // example.net is reserved too but isn't on the PII scanner's allowlist.
  const domain = [
    'example.com',
    'example.org',
    'mail.example.com',
    'ap.example.org',
  ][i % 4];
  // Both halves go through slug, and the dot only appears when there's something
  // after it: the first word used to be inserted raw, so "Orlando's" produced
  // "orlando's.@example.com" — an apostrophe and a trailing dot in a local part.
  const surname = slug(rest.join(''));
  return `${slug(first)}${surname ? `.${surname}` : ''}@${domain}`;
}

/**
 * Amounts and dates vary but are fixed per index — no randomness at runtime.
 *
 * The base figure is USD-ish, then converted into the entity's own currency so a
 * Japanese recipient shows ¥ thousands rather than ¥12 and a Swiss one shows
 * plausible CHF. Rounded to whole units for zero-decimal currencies.
 */
function lastPayout(i, currency) {
  const baseUsd = (((i * 977) % 9400) + 60) / 1 + ((i % 7) * 13) / 100;
  const converted = baseUsd * (USD_RATES[currency] ?? 1);
  const amount = ZERO_DECIMAL.has(currency)
    ? Math.round(converted)
    : Math.round(converted * 100) / 100;

  // Spread across ~120 days back from a fixed anchor. The previous formula used
  // small moduli, so dozens of entities collided on one date and the Recent list
  // showed ten identical days.
  const daysAgo = (i * 7919) % 120;
  const d = new Date(Date.UTC(2027, 2, 22) - daysAgo * 86400000);
  return { lastAmount: amount, lastPaidOn: d.toISOString().slice(0, 10) };
}

function build({
  count,
  entity,
  offset,
  naming,
  idPrefix,
  withHandle = false,
  country,
}) {
  return Array.from({ length: count }, (_, k) => {
    const i = offset + k;
    const name = naming(i);
    // Spread across markets unless the caller pins one — the Wire set is all
    // Baltimore, and a Barksdale front holding a Swiss account misses the point.
    const place = country
      ? PLACES.find((pl) => pl.country === country)
      : PLACES[i % PLACES.length];
    const logo = REAL_LOGOS[name];

    return {
      id: `${entity}_${i}`,
      name,
      initials: initialsOf(name),
      ...(logo ? { logo } : {}),
      email: emailFor(name, i),
      ...(withHandle ? { handle: `@${slug(name)}` } : {}),
      stripeId: idSuffix(idPrefix, i),
      entity,
      ...place,
      ...lastPayout(i, place.currency),
      // Profiles are publicly discoverable; only a few are in your saved list.
      // Rare on purpose: 1-in-4 put ~25 saved profiles above the public results,
      // which buries the section it exists to reveal. Deterministic so results
      // don't reshuffle between renders.
      saved: entity !== 'profile' || i % 30 === 0,
      methodIds: [`pm_${entity}_${i}`],
    };
  });
}

/**
 * Featured brands come first among the profiles so the recognisable logos are
 * visible without scrolling.
 */
const FEATURED_PROFILES = Object.keys(REAL_LOGOS).map((name, k) => {
  const i = 900 + k;
  const place = PLACES[k % 3]; // US / GB / FR — the well-covered rails
  return {
    id: `profile_featured_${k}`,
    name,
    initials: initialsOf(name),
    logo: REAL_LOGOS[name],
    email: `ap@${slug(name)}.com`,
    handle: `@${slug(name)}`,
    stripeId: idSuffix('acct_1', i),
    entity: 'profile',
    ...place,
    ...lastPayout(i, place.currency),
    // Named rather than derived from the index: which brands you've saved is a
    // content decision, and a modulo silently reshuffles it when a logo is added.
    saved: SAVED_BRANDS.has(name),
    methodIds: [`pm_profile_featured_${k}`],
  };
});

/**
 * Counts are the target totals MINUS the hand-written frame-parity rows in
 * recipients.js (7 recipients, 2 connected accounts, 2 customers), so the merged
 * lists land on exactly 100 / 20 / 30 / 100.
 *
 * Recipients start at offset 1: offset 0 generates "John Burns", which is one of
 * the hand-written rows.
 */
export const GENERATED_ENTITIES = [
  // The Wire set comes first within each type so it's visible in Recent, not
  // buried 60 rows down. Counts below are reduced by however many land here, so
  // the totals still come out at 100 / 20 / 30 / 100.
  ...build({
    count: 8,
    entity: 'recipient',
    offset: 500,
    naming: (i) => WIRE_PEOPLE[i - 500],
    idPrefix: 'cus_',
    country: 'US',
  }),
  ...build({
    count: 4,
    entity: 'customer',
    offset: 520,
    naming: (i) => WIRE_PEOPLE[i - 520 + 8],
    idPrefix: 'cus_',
    country: 'US',
  }),
  ...build({
    count: 4,
    entity: 'connected',
    offset: 540,
    naming: (i) => WIRE_BUSINESSES[i - 540],
    idPrefix: 'acct_1',
    country: 'US',
  }),
  ...build({
    count: 4,
    // 570 rather than 560 so the first of them lands on the `i % 30` saved rule —
    // one Wire profile you've paid before, to exercise the multi-method dropdown.
    entity: 'profile',
    offset: 570,
    naming: (i) => WIRE_BUSINESSES[i - 570 + 4],
    idPrefix: 'acct_1',
    withHandle: true,
    country: 'US',
  }),

  ...build({
    count: 85,
    entity: 'recipient',
    offset: 1,
    naming: personName,
    idPrefix: 'cus_',
  }),
  ...build({
    count: 14,
    entity: 'customer',
    offset: 200,
    naming: personName,
    idPrefix: 'cus_',
  }),
  ...build({
    count: 24,
    entity: 'connected',
    offset: 300,
    naming: companyName,
    idPrefix: 'acct_1',
  }),
  ...FEATURED_PROFILES,
  ...build({
    count: 100 - FEATURED_PROFILES.length - 4,
    entity: 'profile',
    offset: 400,
    naming: companyName,
    idPrefix: 'acct_1',
    withHandle: true,
  }),
];

/**
 * Payout methods per entity: cards for customers, the profile plus any accounts
 * on file for Stripe profiles, bank accounts otherwise.
 *
 * A Stripe profile is always payable over the network — the money never leaves
 * Stripe, so the profile itself is a method and its only rail is the instant
 * transfer. But a profile you've actually paid before will usually have a bank
 * account on file too, and the flow needs to show that a profile is not a dead
 * end with exactly one way to pay it.
 *
 * So the saved profiles carry a bank account (and one a debit card) alongside
 * the profile. The unsaved, publicly-discoverable ones don't: you've never paid
 * them, so there'd be no account of theirs on your books.
 *
 * Badges: the profile is `recommended` — instant and free beats every bank rail —
 * while the account you used last carries `lastUsed` and is what opens selected.
 * The recommendation is advice; the default is history, and the two disagreeing
 * on purpose is what makes the alternative visible.
 *
 * The same idea one level down: a destination you've paid before carries
 * `lastDeliveryId`, the rail it went over, which the Delivery control defaults to
 * and tags "Last used". It's the market's slower local rail rather than its
 * instant one, so the recommendation stays visible on a different row. Anything
 * without the `lastUsed` badge has never been paid, so it gets no
 * `lastDeliveryId` and Delivery falls back to recommending.
 */
export const GENERATED_PAYOUT_METHODS = GENERATED_ENTITIES.flatMap((e, k) => {
  if (e.entity === 'profile') {
    const profile = {
      id: e.methodIds[0],
      recipientId: e.id,
      group: 'profile',
      // Not the profile's name: the Recipient row above already says who this is,
      // so repeating it says nothing. The method row names the destination type.
      label: 'Stripe profile',
      // No entity logo. The mark says where the money GOES — MethodMark falls back
      // to the Stripe mark for `profile`, which is what "Stripe profile" means.
      // The recipient's own brand mark belongs on the Recipient row above.
      currency: e.currency,
      country: e.country,
      // The handle is the identifier, so it stands in for an account number.
      last4: null,
      handle: e.handle,
    };

    // Nothing else on file, so there's nothing to recommend it over — a badge on
    // a list of one is noise.
    if (!e.saved) return [profile];
    profile.badge = 'recommended';

    const held = pickBy(e.id, banksFor(e.country));
    const bank = {
      id: `${e.methodIds[0]}_bank`,
      recipientId: e.id,
      group: 'bank',
      label: held.label,
      logo: held.logo,
      currency: e.currency,
      country: e.country,
      last4: String(1000 + ((k * 53) % 8999)),
      badge: 'lastUsed',
      // The market's standard rail, not its instant one — so "Last used" and
      // "Recommended" land on different rows.
      lastDeliveryId: railsFor(e.country)[1] ?? railsFor(e.country)[0],
    };

    // Every other saved profile also has a card, so the dropdown shows all three
    // groups rather than implying a profile only ever has these two.
    if (k % 2) return [profile, bank];

    const scheme = pickBy(`${e.id}-card`, cardsFor(e.country));
    return [
      profile,
      bank,
      {
        id: `${e.methodIds[0]}_card`,
        recipientId: e.id,
        group: 'card',
        label: scheme.label,
        logo: scheme.logo,
        currency: e.currency,
        country: e.country,
        last4: String(1000 + ((k * 71) % 8999)),
      },
    ];
  }

  const isCard = e.entity === 'customer';
  // The account's country picks the institution, then the index picks which one
  // — so the bank is always licensed where the account is held.
  const options = isCard ? cardsFor(e.country) : banksFor(e.country);
  const source = options[k % options.length];
  const rails = railsFor(e.country);

  // Cards only ever offer the instant rail.
  const instant = rails[0];

  return {
    id: e.methodIds[0],
    recipientId: e.id,
    group: isCard ? 'card' : 'bank',
    label: source.label,
    logo: source.logo,
    currency: e.currency,
    country: e.country, // where the account is based — drives the flag badge
    last4: String(1000 + ((k * 37) % 8999)),
    // Paid before, so it has a rail history too. A card offers only the instant
    // rail, so its history can't help but agree with the recommendation.
    ...(k % 3 === 0
      ? {
          badge: 'lastUsed',
          lastDeliveryId: isCard ? instant : (rails[1] ?? instant),
        }
      : {}),
  };
});
