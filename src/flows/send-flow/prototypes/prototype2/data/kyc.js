import { deliveryMethod } from './deliveryMethods.js'; // explicit extension: node --test runs this directly

/**
 * Recipient KYC requirements.
 *
 * Source: https://docs.stripe.com/global-payouts/recipient-creation#requirements
 * (sender country: United States).
 *
 * The docs' shape is: requirements vary by recipient country × business type ×
 * payout method. Email and a name are always required; ADDRESS is the field that
 * comes and goes, so that's what this table encodes. Anything not listed falls
 * back to email + name, which is the least-strict row in the docs — flagged in
 * the UI rather than silently assumed.
 */

/**
 * Rails that require the recipient's address whatever the country table says.
 *
 * RTP is the case this models: the scheme carries the payee's address, so a recipient
 * the sender has only ever paid by ACH can be on file without one — and the address
 * becomes a requirement the moment they pick the instant rail. It's a property of the
 * RAIL, which is why it can't live in ADDRESS_RULES below: that table is keyed by
 * country x type x method, and the method is the same bank account either way.
 */
const ADDRESS_RAILS = new Set(['rtp']);

export function railRequiresAddress(railId) {
  return ADDRESS_RAILS.has(railId);
}

/**
 * Is this recipient's address already held?
 *
 * Absent by exception: every fixture recipient has been paid before, so their address
 * is on file unless the fixture says otherwise. Only the one that says `false` is
 * missing it — see data/recipients.js.
 */
export function addressOnFile(recipient) {
  return recipient?.addressOnFile !== false;
}

/** Countries where the docs list an address requirement, by type and method. */
const ADDRESS_RULES = {
  US: {
    individual: { bank: false, card: false, wire: true },
    company: { bank: true, card: true, wire: true },
  },
  GB: {
    individual: { bank: false, card: false, wire: true },
    company: { bank: false, card: true, wire: true },
  },
  FR: {
    individual: { bank: false, card: false, wire: true },
    company: { bank: true, card: true, wire: true },
  },
  DE: {
    individual: { bank: false, card: false, wire: true },
    company: { bank: false, card: true, wire: true },
  },
  CH: {
    individual: { bank: false, card: false, wire: true },
    company: { bank: false, card: true, wire: true },
  },
  JP: {
    // Japan is wire-only in the docs, and the address must not be a PO box.
    individual: { bank: true, card: true, wire: true },
    company: { bank: true, card: true, wire: true },
    noPoBox: true,
  },
  IN: {
    individual: { bank: false, card: false, wire: true },
    company: { bank: false, card: true, wire: true },
  },
};

/** Countries the docs table doesn't cover for this sender country. */
export function isDocumented(country) {
  return Object.prototype.hasOwnProperty.call(ADDRESS_RULES, country);
}

/**
 * A wire is a rail rather than a stored method, so a bank recipient counts as
 * "wire" once wire details have been supplied.
 */
export function effectiveMethod(newRecipient) {
  if (newRecipient.method === 'card') return 'card';
  if (newRecipient.method === 'wallet') return 'bank'; // no separate row in the docs
  return String(newRecipient.wire ?? '').trim() ? 'wire' : 'bank';
}

export function addressRequired({ country, type, method, railId = null }) {
  // The rail can demand it on its own — RTP does — so it's checked before the table,
  // which only knows about country, type and method.
  if (railRequiresAddress(railId)) return true;
  const rules = ADDRESS_RULES[country];
  if (!rules) return false;
  return Boolean(rules[type]?.[method]);
}

/**
 * Does this rail need an address the recipient hasn't supplied?
 *
 * The PERSONAL half of what a payout can be waiting on — collected on the recipient's
 * personal-details form, which is where their address belongs. The other half is the
 * rail's identifiers, below, which belong to the destination.
 */
export function kycPendingFor(recipient, railId) {
  if (!addressDemandedBy(recipient, railId)) return false;
  return !addressOnFile(recipient);
}

/**
 * Does this rail want the recipient's address?
 *
 * RTP, and only RTP: the scheme carries the payee's address, which is why choosing it can
 * raise a requirement mid-payout. A SWIFT wire asks for a SWIFT code and nothing else —
 * the published table does list an address against wires when a recipient is being CREATED,
 * but that's a different question from what this payout needs now, and conflating the two
 * had SWIFT demanding an address it never uses.
 */
function addressDemandedBy(recipient, railId) {
  return railRequiresAddress(railId);
}

/**
 * The rail's own identifiers that are still blank — a SWIFT code, a wire routing
 * number.
 *
 * These used to be inline fields on the payout form. They're collected in the
 * additional-details sub-flow instead, on the DESTINATION form: a SWIFT code identifies
 * the recipient's bank, so it sits with the account it belongs to rather than beside
 * their name — or beside the amount, where it used to be.
 */
export function missingRailFields(railId, values = {}) {
  const requires = deliveryMethod(railId)?.requires ?? [];
  return requires.filter((key) => !String(values[key] ?? '').trim());
}

/**
 * Everything the configured payout still needs and the sub-flow can collect: details
 * about the recipient, and identifiers for the rail.
 *
 * One predicate, so the banner on Payout details and the footer's gate can't disagree
 * about whether the payout may proceed.
 */
export function extraDetailsPending({ recipient, railId, draft = {} }) {
  return (
    kycPendingFor(recipient, railId) ||
    missingRailFields(railId, draft).length > 0
  );
}

export function noPoBox(country) {
  return Boolean(ADDRESS_RULES[country]?.noPoBox);
}

export const ADDRESS_FIELDS = [
  {
    key: 'addressLine1',
    label: 'Address line 1',
    placeholder: '185 Berry Street',
  },
  {
    key: 'addressLine2',
    label: 'Address line 2',
    placeholder: 'Suite 550',
    optional: true,
  },
  { key: 'addressCity', label: 'City', placeholder: 'San Francisco' },
  { key: 'addressPostal', label: 'Postal code', placeholder: '94107' },
];

/**
 * Every field the recipient must supply. One source of truth: both the form and
 * the footer's canContinue read this.
 */
export function requiredRecipientFields(newRecipient) {
  const method = effectiveMethod(newRecipient);
  const fields = [
    'email',
    newRecipient.type === 'company' ? 'companyName' : 'name',
  ];

  if (
    addressRequired({
      country: newRecipient.country,
      type: newRecipient.type,
      method,
      railId: newRecipient.railId ?? null,
    })
  ) {
    fields.push(...ADDRESS_FIELDS.filter((f) => !f.optional).map((f) => f.key));
  }
  // Rail identifiers are NOT here: they're destination details, collected on their own
  // step (see missingRailFields).
  return fields;
}

/** True when every required field has a value. `name` means first AND last. */
export function recipientComplete(n) {
  return requiredRecipientFields(n).every((key) => {
    if (key === 'name') return Boolean(n.firstName.trim() && n.lastName.trim());
    return Boolean(String(n[key] ?? '').trim());
  });
}

/** Human summary of what this combination requires, shown under the switcher. */
export function requirementSummary(n) {
  const method = effectiveMethod(n);
  const needsAddress = addressRequired({
    country: n.country,
    type: n.type,
    method,
    railId: n.railId ?? null,
  });
  const who = n.type === 'company' ? 'company name' : 'name';
  const parts = ['email', who];
  if (needsAddress)
    parts.push(n.type === 'company' ? 'company address' : 'address');
  return parts.join(', ');
}
