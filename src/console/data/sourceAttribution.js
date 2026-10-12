// A source item is { label, type, sqlId? } where type is one of:
//   'dashboard' — a named place or object in the product
//   'doc'       — a Stripe docs page
//   'code'      — a Sigma query (sqlId points at a canvas code tab)
//   'api'       — a Stripe API call
//
// deriveAttribution resolves the collapsed label from the items themselves so
// the five attribution types stay consistent everywhere sources are shown.
export function deriveAttribution(items) {
  if (!items || items.length === 0) return null;
  const types = new Set(items.map((i) => i.type));
  if (types.size > 1) return 'Multiple sources';
  const [only] = types;
  if (only === 'doc') return 'From Stripe docs';
  if (only === 'code') return 'From Sigma query';
  if (only === 'api') return 'From Stripe API';
  return `From ${items[0].label}`;
}
