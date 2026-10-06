import { payoutFee } from './pricing.js';

/**
 * Email-invite constants.
 *
 * The sender is the business making the payout — "Rocket rides" in the frames,
 * which is also the name on the rocketrides.svg asset in public/.
 */
export const SENDER = { name: 'Rocket Rides' };

/** How long the accept link stays valid. The frame writes this as a placeholder. */
export const acceptWindowDays = 3;

/**
 * Methods the recipient may use to accept.
 *
 * The secondary line is speed, rail and cheapest fee. Fees come from
 * data/pricing.js rather than being written out here, so the menu can't quote a
 * number the fee ladder contradicts. Stablecoin isn't in the published pricing
 * table at all, hence "Free" — the same treatment quote.js gives it.
 */
export const PAYOUT_METHOD_CHOICES = [
  {
    id: 'bank',
    label: 'Bank account',
    icon: 'bank',
    eta: 'Instant',
    rail: 'Local bank transfer',
    fee: payoutFee('local'),
  },
  {
    id: 'card',
    label: 'Debit card',
    icon: 'card',
    eta: 'Instant',
    rail: 'Card payout',
    fee: payoutFee('card'),
  },
  {
    id: 'wallet',
    label: 'Stablecoin wallet',
    icon: 'wallet',
    eta: 'Instant',
    rail: 'Stablecoin transfer',
    fee: 0,
  },
];

export const ALL_PAYOUT_METHOD_IDS = PAYOUT_METHOD_CHOICES.map((m) => m.id);

/**
 * Trigger label: the destinations currently selected, named.
 *
 * Every selection spells itself out, the full set included. "All" was shorter but told
 * the sender nothing about what their recipient will actually be offered — and it's the
 * default, so the one state they most need to read was the one state that hid itself.
 */
export function methodsSummary(ids) {
  if (ids.length === 0) return 'None selected';
  return PAYOUT_METHOD_CHOICES.filter((m) => ids.includes(m.id))
    .map((m) => m.label)
    .join(', ');
}
