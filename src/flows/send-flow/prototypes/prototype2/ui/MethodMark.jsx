import React from 'react';
import { Icon } from '../../../icons/SailIcons';
import FlagIcon from './FlagIcon';

/**
 * Leading mark for a payout method — 429:221907.
 *
 * The logo stands on its own with NO panel tile behind it (the Apple Pay and
 * Wells Fargo artwork each carry their own background), and a flag badges the
 * lower-left corner to show where the account is based.
 *
 * Falls back to an icon tile when a method has no artwork, which is the only
 * case that needs a container.
 */
/** Glyph per kind of thing being paid into, when there's no artwork to use. */
const GLYPHS = { card: 'card', wallet: 'wallet', bank: 'bank' };

/**
 * The Stripe mark, used for the two things that live on Stripe rather than at a
 * bank: one of your own financial accounts (`account`) and a recipient's Stripe
 * profile (`profile`). Both hold money on the network, so both wear its mark.
 */
const STRIPE_MARK = '/logos/stripe.svg';
const ON_STRIPE = new Set(['account', 'profile']);

export default function MethodMark({
  logo,
  country,
  group = 'bank',
  size = 28,
}) {
  const box = { width: size, height: size };
  // Without this, both fell back to the bank tile — saying "bank account" about
  // balances that never leave Stripe.
  const mark = logo ?? (ON_STRIPE.has(group) ? STRIPE_MARK : null);

  return (
    <span className="relative shrink-0" style={box}>
      {mark ? (
        <img
          src={mark}
          alt=""
          style={box}
          className="rounded-control object-contain"
        />
      ) : (
        <span
          style={box}
          className="flex items-center justify-center rounded-control bg-panel"
        >
          <Icon
            name={GLYPHS[group] ?? 'bank'}
            size="small"
            className="text-ink-muted"
          />
        </span>
      )}

      {country && (
        // Bottom-RIGHT corner of the mark, half overlapping it (429:221907).
        // Cropped to the flag itself: the artwork is 16x12 inside a 16x16 viewBox,
        // so an uncropped box measures 24px tall and throws the offset out. The
        // -2px shift pulls the flag flush to the top of its 16x12 box.
        // 429:223838: a 16x12 flag at radius 2 with a 2px panel-coloured border,
        // which separates it from whatever artwork it overlaps. The artwork is
        // 16x12 inside a 16x16 viewBox, so the box is cropped and the -2px shift
        // pulls the flag flush to the top of it.
        <span className="absolute -bottom-1.5 -right-1.5 block h-3 w-4 overflow-hidden rounded-[2px] outline outline-2 outline-panel">
          <FlagIcon code={country} className="-mt-0.5 block h-4 w-4" />
        </span>
      )}
    </span>
  );
}
