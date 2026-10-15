// Drives the satisfaction chips under the step 1 textarea.
// MAX_LENGTH and the two chip labels are from the design; the keyword lists were
// authored here as a prototype heuristic and are meant to be tuned by hand.

export const MAX_LENGTH = 10000;

// A description has to be at least this long before any check can pass, so a
// single stray keyword doesn't light up a chip.
export const MIN_LENGTH = 20;

const OFFER_KEYWORDS = [
  'marketplace',
  'market',
  'sell',
  'sells',
  'selling',
  'sale',
  'sales',
  'offer',
  'offers',
  'provide',
  'provides',
  'service',
  'services',
  'platform',
  'product',
  'products',
  'ticket',
  'tickets',
  'ticketing',
  'subscription',
  'subscriptions',
  'saas',
  'software',
  'app',
  'rental',
  'rentals',
  'rent',
  'booking',
  'bookings',
  'delivery',
  'deliver',
  'courses',
  'events',
  'store',
  'shop',
];

const PAYMENT_KEYWORDS = [
  'pay',
  'pays',
  'paid',
  'paying',
  'payment',
  'payments',
  'charge',
  'charges',
  'charged',
  'collect',
  'collects',
  'checkout',
  'split',
  'splits',
  'revenue',
  'commission',
  'payout',
  'payouts',
  'fee',
  'fees',
  'invoice',
  'invoices',
  'billing',
  'bill',
  'transfer',
  'transfers',
  'cut',
  'take rate',
];

export const CHECKS = [
  { id: 'offer', label: 'What you offer' },
  { id: 'payment', label: 'Who collects payment' },
];

const KEYWORDS_BY_CHECK = {
  offer: OFFER_KEYWORDS,
  payment: PAYMENT_KEYWORDS,
};

function containsKeyword(text, keywords) {
  return keywords.some((keyword) => new RegExp(`\\b${keyword}\\b`).test(text));
}

export function evaluateChecks(description) {
  const text = (description || '').toLowerCase().trim();
  const longEnough = text.length >= MIN_LENGTH;

  return CHECKS.map((check) => ({
    ...check,
    satisfied: longEnough && containsKeyword(text, KEYWORDS_BY_CHECK[check.id]),
  }));
}

export function isDescriptionValid(description) {
  return evaluateChecks(description).every((check) => check.satisfied);
}
