import React from 'react';

/**
 * Delivery-rail glyphs that aren't in the SailIcons bundle.
 *
 * 555:36910 gives the instant-transfer mark as a 32x32 tile: a panel-coloured
 * rounded square behind a 12x11.5 outlined glyph in Text/subdued at 1.5 stroke.
 * Only the glyph lives here — the tile is `IconTile`, whose 32px box, 6px radius,
 * `bg-panel` and `text-ink-muted` already match the frame exactly. Baking the
 * background into the artwork would have put two hex literals outside the token
 * layer for a container that already exists.
 *
 * Drawn in the frame's own 32-unit coordinate space rather than re-centred into a
 * 16px box, so the glyph sits where the design puts it inside the tile.
 */
export const RAIL_GLYPHS = {
  stripeTransfer: (
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10 20.7657C10 21.4015 10.5855 21.8758 11.2075 21.7439L21.2075 19.6232C21.6695 19.5252 22 19.1173 22 18.645V11.2373C22 10.6006 21.4128 10.126 20.7902 10.2596L10.7902 12.405C10.3293 12.5039 10 12.9114 10 13.3828V20.7657Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  ),
};

/** Renders one of the above at the tile's full 32px, or null if unknown. */
export default function RailGlyph({ name, className = '' }) {
  const glyph = RAIL_GLYPHS[name];
  if (!glyph) return null;

  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={`block shrink-0 ${className}`.trim()}
    >
      {glyph}
    </svg>
  );
}
