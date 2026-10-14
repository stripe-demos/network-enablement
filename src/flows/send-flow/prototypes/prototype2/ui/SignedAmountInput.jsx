import React, { useState } from 'react';

/**
 * The right half of a SplitField: a sign, a currency symbol, and a right-aligned
 * amount. "−" on the money leaving the source account, "+" on the money arriving
 * with the recipient (2026-08-24 revision).
 *
 * Focus/blur decimal normalisation is the same behaviour ported from the
 * original (SendModal2.jsx:4185-4205): "100" -> "100.00", "100." -> "100.00",
 * "100.5" -> "100.50".
 */
export default function SignedAmountInput({
  sign,
  symbol,
  value,
  onChange,
  onFocus,
  ariaLabel,
  autoFocus = false,
  leading = null,
  derived = false,
  /** Rendered after the number — the currency this amount is denominated in. */
  trailing = null,
}) {
  const display = groupThousands(value);
  const empty = !value;
  const [focused, setFocused] = useState(false);

  // Either side can be typed into: the user decides whether they're defining what
  // they send or what the recipient gets, which is the whole point of the pair on
  // a cross-border payout. So `derived` is presentation only — it dims the side
  // the user did NOT define — and it lifts as soon as this field is focused, or it
  // would read as disabled.
  // `!empty` matters: an empty field has no derived value to play down, and the
  // placeholder is painted by `placeholder:text-ink-placeholder` regardless of `tone`.
  // Without it the two halves of the pair disagreed while both were empty — the
  // numbers matched (both placeholders) but the sign and symbol did not, one pair
  // at ink-faint and the other at hairline.
  const dimmed = derived && !focused && !empty;

  const handleChange = (e) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    if (/^\d*\.?\d{0,2}$/.test(raw)) onChange(raw);
  };

  const handleBlur = () => {
    if (!value) return;
    if (!value.includes('.')) onChange(`${value}.00`);
    else if (value.endsWith('.')) onChange(`${value}00`);
    else if (/\.\d$/.test(value)) onChange(`${value}0`);
  };

  /**
   * Per 429:223844 the three parts are weighted differently, not just coloured:
   * the sign is 20px regular in a lighter grey, the currency symbol is 20px
   * regular in full-strength ink, and only the number is bold. A dimmed field
   * drops the whole group to neutral-100, as 429:223886 draws the mirrored side.
   */
  // Empty and dimmed share one tone: ink-placeholder. 429:223886 draws the mirrored
  // side at neutral-100, but that is border ink — on the amount itself it read as
  // switched off rather than as waiting for input, so this sits one step darker
  // while still staying clear of the filled sign at ink-subtle.
  const quiet = dimmed || empty;
  const tone = quiet ? 'text-ink-placeholder' : 'text-ink';
  const affix = quiet ? 'text-ink-placeholder' : 'text-ink-subtle';
  const symbolTone = quiet ? 'text-ink-placeholder' : 'text-ink';

  return (
    // The chip leads and the figure trails, pinned to opposite ends of the box: the chip is a
    // control about the amount, and sitting it against the number made the two read as one
    // run. `leading` is that slot; `trailing` stays for the single-line fields that have no box
    // of their own to spread into.
    <div className="flex w-full items-center justify-end gap-2.5">
      {leading}
      {/* A label, so the target is the whole cell rather than the glyphs themselves.
          The number is sized to its content and sits at the right edge, which left a
          wide dead strip beside it — clicking there did nothing, and before the
          account picker was confined to its own cell it opened that menu instead.
          `cursor-text` says what the click will do. */}
      <label className="flex min-w-0 flex-1 cursor-text items-center justify-end gap-2">
        <span className={`text-sail-heading-medium-subdued shrink-0 ${affix}`}>
          {sign}
        </span>
        <span
          className={`text-sail-heading-medium-subdued shrink-0 ${symbolTone}`}
        >
          {symbol}
        </span>
        {/* Sized to its content, not flex-1. The frame sets "- $ 100" as one
          right-aligned run, so the sign, symbol and number sit together at the
          right edge; a flexible input pushes all the slack between the symbol and
          the number instead. `field-sizing` does it natively where supported, and
          `size` covers the rest. */}
        <input
          type="text"
          inputMode="decimal"
          aria-label={ariaLabel}
          value={display}
          onChange={handleChange}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={() => {
            setFocused(false);
            handleBlur();
          }}
          // "0.00", not "0": the field is a money field, and the minor units are part of
          // what it looks like before anything is typed.
          placeholder="0.00"
          autoFocus={autoFocus}
          size={Math.max((display || '0').length, 1)}
          style={{ fieldSizing: 'content' }}
          className={`text-sail-heading-medium min-w-0 max-w-full bg-transparent text-right outline-none placeholder:text-ink-placeholder ${tone}`}
        />
      </label>
      {trailing}
    </div>
  );
}

function groupThousands(v) {
  if (!v) return '';
  const [int, dec] = String(v).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+$)/g, ',');
  return dec !== undefined ? `${grouped}.${dec}` : grouped;
}
