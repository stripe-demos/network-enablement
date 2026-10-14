import React from 'react';

/**
 * Money input with thousands separators and the original's focus/blur decimal
 * normalisation ported verbatim (SendModal2.jsx:4185-4205):
 *
 *   "100"   -> "100.00" on blur
 *   "100."  -> "100.00"
 *   "100.5" -> "100.50"
 *
 * Deliberately not "improved": the feel of this field is something test
 * participants notice, and the two-way FX binding depends on its exact
 * behaviour.
 */
export default function AmountField({
  value,
  onChange,
  onFocus,
  currency,
  symbol,
  placeholder = '0',
  variant = 'field',
  autoFocus = false,
}) {
  const display = groupThousands(value);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    // At most two decimal places, one decimal point.
    if (/^\d*\.?\d{0,2}$/.test(raw)) onChange(raw);
  };

  const handleBlur = () => {
    if (!value) return;
    if (!value.includes('.')) onChange(`${value}.00`);
    else if (value.endsWith('.')) onChange(`${value}00`);
    else if (/\.\d$/.test(value)) onChange(`${value}0`);
  };

  return (
    <div
      className={`flex h-10 items-center gap-2 rounded-control px-3 ${
        variant === 'panel'
          ? 'bg-panel'
          : 'bg-canvas shadow-[0_0_0_1px_var(--color-border)]'
      }`}
    >
      <span className="text-sail-label-large-emphasized shrink-0 text-ink">
        {symbol}
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={display}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="text-sail-label-large-emphasized min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-faint"
      />
      {currency && (
        <span className="text-sail-label-small shrink-0 rounded-control bg-neutral-50 px-2 py-1 text-ink-muted">
          {currency}
        </span>
      )}
    </div>
  );
}

/** 1234.5 -> "1,234.5", leaving any in-progress decimal alone. */
function groupThousands(v) {
  if (!v) return '';
  const [int, dec] = String(v).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+$)/g, ',');
  return dec !== undefined ? `${grouped}.${dec}` : grouped;
}
