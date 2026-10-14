import { payoutFee } from './pricing.js';
import { country } from './countries.js';

/**
 * The payout rails, and the rules that decide which of them a given destination can
 * actually use.
 *
 * Availability used to be a hand-written list per destination (`supportedDelivery` on
 * each fixture), which let a Swiss bank account offer invented rails like "SIC
 * Instant" and let any account offer any rail the fixture happened to name. It's now
 * derived from the registry below, the way the runtime derives it: from the
 * destination KIND, the recipient's country, and the currency the money arrives in.
 *
 * Three rules do most of the work:
 *
 *  1. A rail serves one kind of destination. A bank rail can't pay a card; Visa
 *     Direct can't pay a bank account; the Stripe network only reaches a profile.
 *  2. A local rail runs in exactly one corridor — ACH and RTP are US/USD, FPS is
 *     GB/GBP, SEPA is the SEPA zone in EUR, and so on.
 *  3. **Only SWIFT is permitted when the destination currency isn't local to the
 *     recipient's country.** Paying a US bank account in EUR is a SWIFT wire, not an
 *     ACH transfer, and that single rule is what keeps the list honest.
 *
 * `status` carries the rollout state from the rail registry: 'ga' is generally
 * available, 'gated' is behind a flag or a private preview, 'development' isn't
 * shippable yet. OFFERED_STATUSES decides which of those this prototype surfaces —
 * a 'development' rail is registered so the model is complete, but never offered.
 *
 * Two families from the registry are deliberately absent, both pending design rather
 * than missing by accident: Same-day ACH and Next-business-day ACH. The US menu in
 * the Delivery frames shows four options (instant, wire, ACH, SWIFT), and adding two
 * more ACH tiers changes that screen rather than this file.
 *
 * `requires` is the mechanism that makes the conditional-field behaviour in the
 * frames declarative instead of an if-tree: 429:222530 shows SWIFT revealing a
 * "SWIFT code" input, and it feeds canContinue directly.
 *
 * `supportsReference` is true for every bank rail, wires and SWIFT included —
 * remittance information is exactly what a wire carries. Only the rails that produce
 * no bank statement say false.
 */

/** Rollout states this prototype will offer. */
export const OFFERED_STATUSES = new Set(['ga', 'gated']);

/** SEPA, for the rails that serve the zone rather than one country. */
const SEPA = ['AT', 'BE', 'CH', 'DE', 'ES', 'FI', 'FR', 'IE', 'IT', 'NL', 'PT'];

export const DELIVERY_METHODS = [
  // ---- On the Stripe network ------------------------------------------------
  /**
   * Stripe profile to Stripe profile: stays on the network, so it arrives instantly
   * and costs nothing. The only rail a profile offers.
   */
  {
    id: 'stripe_instant',
    label: 'Stripe network',
    eta: 'Instant',
    etaLong: 'Arrives instantly',
    kind: 'network',
    destinations: ['profile'],
    corridor: 'any',
    status: 'ga',
    // 555:36910 gives this rail its own glyph, drawn in ui/RailGlyphs. It replaces
    // the Stripe logo the row used to carry: the logo said "Stripe" where every
    // other rail says what the transfer does.
    icon: 'stripeTransfer',
    requires: [],
    supportsReference: false,
  },

  // ---- US bank rails -------------------------------------------------------
  {
    id: 'rtp',
    label: 'RTP',
    eta: 'Instant',
    etaLong: 'Arrives instantly',
    kind: 'local',
    destinations: ['bank'],
    corridor: { countries: ['US'], currency: 'USD' },
    status: 'ga',
    icon: 'lightningBolt',
    badge: 'recommended',
    // The rail the monthly allowance covers — see data/allowance.js.
    allowanceEligible: true,
    requires: [],
    supportsReference: true,
  },
  {
    id: 'standard',
    label: 'ACH',
    eta: '2–3 business days',
    etaLong: 'Arrives in 2–3 business days',
    kind: 'local',
    destinations: ['bank'],
    corridor: { countries: ['US'], currency: 'USD' },
    status: 'ga',
    // Its own price, not the local tier's 1.50: ACH is the slow domestic option and is
    // priced as such. `fee` overrides the tier for this rail alone — RTP is local too
    // and charges the full 1.50 (before the allowance covers it).
    fee: 0.5,
    icon: 'bank',
    requires: [],
    supportsReference: true,
  },
  {
    id: 'fedwire',
    // "Wire" rather than "Fedwire": the menu's detail line names what the transfer
    // is, and the sender doesn't choose between Fedwire and any other US wire.
    label: 'Wire',
    eta: '1 business day',
    etaLong: 'Arrives in 1 business day',
    kind: 'wire',
    destinations: ['bank'],
    corridor: { countries: ['US'], currency: 'USD' },
    status: 'ga',
    icon: 'bankLightning',
    requires: ['wireNumber'],
    supportsReference: true,
  },
  {
    id: 'xb_ach',
    label: 'Cross-border ACH',
    eta: '2–3 business days',
    etaLong: 'Arrives in 2–3 business days',
    kind: 'local',
    destinations: ['bank'],
    // Non-US senders paying INTO a US bank account. This sender is US (see
    // pricing.SENDER_COUNTRY), so it never qualifies — registered for completeness.
    corridor: { countries: ['US'], currency: 'USD', senderIsNotUS: true },
    status: 'ga',
    icon: 'bank',
    requires: [],
    supportsReference: true,
  },

  // ---- Other local bank rails ----------------------------------------------
  {
    id: 'fps',
    label: 'FPS',
    eta: 'Instant',
    etaLong: 'Arrives instantly',
    kind: 'local',
    destinations: ['bank'],
    corridor: { countries: ['GB'], currency: 'GBP' },
    status: 'ga',
    icon: 'lightningBolt',
    badge: 'recommended',
    requires: [],
    supportsReference: true,
  },
  {
    id: 'sepa_instant',
    label: 'SEPA Instant',
    eta: 'Instant',
    etaLong: 'Arrives instantly',
    kind: 'local',
    destinations: ['bank'],
    corridor: { countries: SEPA, currency: 'EUR' },
    status: 'gated', // rollout is gated per the registry
    icon: 'lightningBolt',
    badge: 'recommended',
    requires: [],
    supportsReference: true,
  },
  {
    id: 'sepa_ct',
    label: 'SEPA Credit Transfer',
    eta: '1 business day',
    etaLong: 'Arrives in 1 business day',
    kind: 'local',
    destinations: ['bank'],
    corridor: { countries: SEPA, currency: 'EUR' },
    status: 'ga',
    icon: 'bank',
    requires: [],
    supportsReference: true,
  },
  {
    id: 'eft',
    label: 'EFT',
    eta: '1–2 business days',
    etaLong: 'Arrives in 1–2 business days',
    kind: 'local',
    destinations: ['bank'],
    corridor: { countries: ['CA'], currency: 'CAD' },
    status: 'gated', // private preview
    icon: 'bank',
    requires: [],
    supportsReference: true,
  },
  {
    id: 'npp',
    label: 'NPP',
    eta: 'Instant',
    etaLong: 'Arrives instantly',
    kind: 'local',
    destinations: ['bank'],
    corridor: { countries: ['AU'], currency: 'AUD' },
    status: 'development',
    icon: 'lightningBolt',
    requires: [],
    supportsReference: true,
  },
  {
    id: 'becs',
    label: 'BECS',
    eta: '1–3 business days',
    etaLong: 'Arrives in 1–3 business days',
    kind: 'local',
    destinations: ['bank'],
    corridor: { countries: ['AU'], currency: 'AUD' },
    status: 'development',
    icon: 'bank',
    requires: [],
    supportsReference: true,
  },
  {
    id: 'fast',
    label: 'FAST',
    eta: 'Instant',
    etaLong: 'Arrives instantly',
    kind: 'local',
    destinations: ['bank'],
    corridor: { countries: ['SG'], currency: 'SGD' },
    status: 'gated',
    icon: 'lightningBolt',
    badge: 'recommended',
    requires: [],
    supportsReference: true,
  },
  {
    id: 'xb_local',
    // Partner-routed local rails, for a country with no registered family of its own
    // — a Swiss or Japanese account paid in its own currency lands this way rather
    // than by a rail the runtime doesn't have.
    label: 'Local transfer',
    eta: '1–2 business days',
    etaLong: 'Arrives in 1–2 business days',
    kind: 'local',
    destinations: ['bank'],
    corridor: 'localCurrencyFallback',
    status: 'ga',
    icon: 'bank',
    requires: [],
    supportsReference: true,
  },
  {
    /**
     * A standard payout to the sender's OWN external account. Free, which is what the
     * frame shows: the two amounts on the form match.
     *
     * `destinations: ['external']` keeps it out of every recipient-facing menu — no
     * recipient destination has that group, so railsForDestination can never offer it.
     */
    id: 'external_standard',
    label: 'Standard payout',
    eta: '1–2 business days',
    etaLong: 'Arrives in 1–2 business days',
    kind: 'local',
    destinations: ['external'],
    corridor: 'any',
    status: 'ga',
    free: true,
    icon: 'bank',
    requires: [],
    supportsReference: true,
  },
  {
    id: 'swift',
    label: 'SWIFT',
    eta: '2–3 business days',
    etaLong: 'Arrives in 2–3 business days',
    kind: 'wire',
    destinations: ['bank'],
    // The only rail that crosses into a currency the recipient's country doesn't
    // use, and a fallback everywhere else.
    corridor: 'any',
    status: 'ga',
    icon: 'globe',
    requires: ['swiftCode'],
    supportsReference: true,
  },

  // ---- Card and wallet -----------------------------------------------------
  {
    id: 'card_push',
    // Visa Direct / Mastercard Send. One rail from the sender's point of view: the
    // scheme follows from the card, not from a choice on this screen.
    label: 'Card transfer',
    eta: 'Instant',
    etaLong: 'Arrives instantly',
    kind: 'card',
    destinations: ['card'],
    // Public for US- and UK-issued cards; eligible European cards are gated, which
    // this models as the same rail with a wider corridor at 'gated'.
    corridor: { countries: ['US', 'GB', ...SEPA] },
    status: 'ga',
    icon: 'card',
    badge: 'recommended',
    requires: [],
    supportsReference: false,
  },
  {
    id: 'usdc',
    label: 'USDC transfer',
    eta: 'Instant',
    etaLong: 'Arrives instantly',
    kind: 'network',
    destinations: ['wallet'],
    corridor: 'any',
    status: 'gated', // private preview
    free: true,
    icon: 'wallet',
    requires: [],
    supportsReference: false,
  },
];

/** Field metadata for anything a rail can require. Labels live here only. */
/**
 * Field metadata for anything a rail can require. Labels live here only.
 *
 * `formKey` is the same detail's key on the destination form (data/countries.js): a rail
 * asks for `swiftCode`, and the account form calls that field `swift`. They're the same
 * number, so the additional-details screen can show the whole account with the missing
 * one promoted to required instead of asking for it in isolation.
 */
export const CONDITIONAL_FIELDS = {
  swiftCode: {
    formKey: 'swift',
    label: 'SWIFT code',
    placeholder: 'BOFAUS3NXXX',
    help: 'The international code that identifies the recipient’s bank.',
  },
  wireNumber: {
    formKey: 'wire',
    label: 'Wire routing number',
    placeholder: '026009593',
    help: 'Wire transfers use a different routing number than ACH transfers.',
  },
};

/** The destination-form keys a rail's requirements map onto. */
export function railFormKeys(railId) {
  return (deliveryMethod(railId)?.requires ?? [])
    .map((key) => CONDITIONAL_FIELDS[key]?.formKey)
    .filter(Boolean);
}

export function deliveryMethod(id) {
  return DELIVERY_METHODS.find((m) => m.id === id) ?? null;
}

/** The currency a country's own rails settle in. */
export function localCurrencyFor(code) {
  return country(code)?.currency ?? 'USD';
}

const isOffered = (rail) => OFFERED_STATUSES.has(rail.status);

/**
 * Does this rail serve this corridor?
 *
 * `senderIsNotUS` rails are never eligible here: the prototype's sender is a US
 * business, which is what makes Cross-border ACH unreachable.
 */
function servesCorridor(rail, { countryCode, currency, hasLocalFamily }) {
  const c = rail.corridor;
  if (c === 'any') return true;
  if (c === 'localCurrencyFallback') return !hasLocalFamily;
  if (c.senderIsNotUS) return false;
  if (c.countries && !c.countries.includes(countryCode)) return false;
  if (c.currency && c.currency !== currency) return false;
  return true;
}

/**
 * The rails a destination can actually be paid over.
 *
 * @param {object} destination
 * @param {'bank'|'card'|'wallet'|'profile'} destination.group
 * @param {string} destination.country   where the destination is held
 * @param {string} destination.currency  what the destination is denominated in
 */
export function railsForDestination({
  group = 'bank',
  country: countryCode = 'US',
  currency,
}) {
  const local = localCurrencyFor(countryCode);
  const arriving = currency ?? local;
  const serves = (rail) => rail.destinations.includes(group);

  const candidates = DELIVERY_METHODS.filter(
    (rail) => serves(rail) && isOffered(rail),
  );

  // Rule 3: off its own currency, a bank account can only be reached by SWIFT.
  if (group === 'bank' && arriving !== local) {
    return candidates.filter((rail) => rail.id === 'swift');
  }

  // Whether the country has a registered local family decides if the partner-routed
  // fallback applies — so it's resolved before the fallback rail is considered.
  const hasLocalFamily = candidates.some(
    (rail) =>
      typeof rail.corridor === 'object' &&
      rail.corridor.countries?.includes(countryCode) &&
      (!rail.corridor.currency || rail.corridor.currency === arriving) &&
      !rail.corridor.senderIsNotUS,
  );

  return candidates.filter((rail) =>
    servesCorridor(rail, { countryCode, currency: arriving, hasLocalFamily }),
  );
}

/**
 * Bank rails for a country paid in its own currency — what the fixtures seed
 * `lastDeliveryId` from. Falls back to SWIFT, which reaches everywhere.
 */
export function deliveryMethodsFor(countryCode) {
  const rails = railsForDestination({ group: 'bank', country: countryCode });
  return rails.length ? rails : [deliveryMethod('swift')];
}

/**
 * The rails a destination offers.
 *
 * Derived from the destination itself — its kind, country and currency — rather than
 * from a list stored on the fixture. See the corridor rules at the top of this file.
 */
export function railsForMethod(
  method,
  fallbackCountry = 'US',
  currency = null,
) {
  if (!method) return [];
  return railsForDestination({
    group: method.group ?? 'bank',
    country: method.country ?? fallbackCountry,
    // The currency the money ARRIVES in, which the sender can override — paying a US
    // account in EUR is a SWIFT wire, not an ACH transfer (rule 3 above). Without this
    // the menu kept offering the destination's own local rails after the sender had
    // asked for a currency those rails can't carry.
    currency: currency ?? method.currency,
  });
}

/**
 * Which rail a destination should open on: history first, then the recommendation,
 * then whatever is on offer.
 *
 * Shared so that every screen which can change the destination re-resolves the rail
 * the same way. A rail left over from the previous destination is the bug this
 * prevents — "Bank account" delivered by "Instant", which is not a rail a bank
 * account has.
 */
export function preferredRailFor(method, rails) {
  const lastUsed = rails.find((d) => d.id === method?.lastDeliveryId);
  return (
    lastUsed ?? rails.find((d) => d.badge === 'recommended') ?? rails[0] ?? null
  );
}

/**
 * The fee shown against a rail in the Delivery control. Derived from the published
 * pricing (data/pricing.js) so the dropdown and the fee ladder always quote the same
 * number — the card tier is amount-dependent, hence the argument.
 */
export function railFee(rail, sendAmount = 0) {
  if (!rail || rail.free) return 0;
  // A per-rail price wins over its tier. Checked before the tier so a rail can be
  // cheaper (ACH) or dearer than the family it belongs to without a new tier.
  if (typeof rail.fee === 'number') return rail.fee;
  return payoutFee(rail.kind, sendAmount);
}
