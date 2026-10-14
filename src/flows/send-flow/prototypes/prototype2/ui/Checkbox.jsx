import React from 'react';

/**
 * The checkbox element — 501:28443 (Sail's `Checkbox element`, node 1:4774).
 *
 * A 14px box at radius 4. Checked is the brand fill with a one-step-darker
 * border and the `_top-shadow/form-accent` lift; unchecked is white with the
 * form border. Disabled fills with neutral-100.
 *
 * The tick is the component's own 14px path rather than SailIcons' `check`,
 * which is a 12px glyph and sat slightly heavy and low inside the box.
 *
 * Presentational only — it renders no input, so whatever wraps it must be
 * focusable. Used directly by rows that already own their hit area (the
 * multi-select menu in the email rail); everything else should use `Checkbox`.
 */
export function CheckboxBox({ checked, disabled = false, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`relative flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
        disabled
          ? 'border-hairline bg-neutral-100'
          : checked
            ? 'border-action-link bg-action shadow-check'
            : 'border-border bg-canvas'
      } ${className}`}
    >
      {checked && <CheckGlyph />}
    </span>
  );
}

/**
 * The component's `checked-svg`. Drawn at the box's full 14px, which means
 * spanning the 1px border too — hence the absolute -1px inset rather than
 * sitting in the 12px content box, where flex would shrink it.
 */
function CheckGlyph() {
  return (
    <svg
      viewBox="0 0 14 14"
      className="absolute -inset-px h-3.5 w-3.5"
      fill="none"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.84567 3.80145C9.9327 3.70645 10.0385 3.63059 10.1565 3.5787C10.2744 3.5268 10.4018 3.5 10.5307 3.5C10.6595 3.5 10.7869 3.5268 10.9049 3.5787C11.0228 3.63059 11.1286 3.70645 11.2157 3.80145C11.3981 4 11.4993 4.25981 11.4993 4.52945C11.4993 4.79909 11.3981 5.0589 11.2157 5.25745L6.57567 10.1975C6.48863 10.2925 6.38279 10.3683 6.26487 10.4202C6.14694 10.4721 6.01951 10.4989 5.89067 10.4989C5.76183 10.4989 5.63439 10.4721 5.51647 10.4202C5.39854 10.3683 5.2927 10.2925 5.20567 10.1975L2.78367 7.62345C2.60124 7.4249 2.5 7.16509 2.5 6.89545C2.5 6.62581 2.60124 6.366 2.78367 6.16745C2.8707 6.07245 2.97654 5.99659 3.09447 5.9447C3.21239 5.8928 3.33983 5.866 3.46867 5.866C3.59751 5.866 3.72494 5.8928 3.84287 5.9447C3.96079 5.99659 4.06663 6.07245 4.15367 6.16745L5.88967 8.01345L9.84567 3.80145Z"
        fill="white"
      />
    </svg>
  );
}

/**
 * Checkbox with a title and description — 429:223074 ("Check box").
 *
 * The real input is kept for keyboard and assistive tech but visually replaced,
 * since a native checkbox can't take the brand fill, the 4px radius or the lift
 * shadow. The input sits immediately before the painted box so
 * `peer-focus-visible` can put the focus halo on it.
 *
 * Spec: 8px gap to the label, 2px between title and description, 2px top padding
 * so the box aligns with the title's cap height.
 *
 * The frame draws the revealed input inside this component's right-hand column,
 * but it stays a sibling here: an input nested in a <label> would toggle the
 * checkbox on every click. Callers indent it by 22px (14px box + 8px gap) to
 * land in the same column.
 */
export default function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}) {
  return (
    <label
      className={`flex items-start gap-2 ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
    >
      <span className="flex shrink-0 items-center pt-0.5">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <CheckboxBox
          checked={checked}
          disabled={disabled}
          className="peer-focus-visible:shadow-focus"
        />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`text-sail-label-medium-emphasized block ${disabled ? 'text-ink-faint' : 'text-ink'}`}
        >
          {label}
        </span>
        {description && (
          <span className="text-sail-label-medium mt-0.5 block text-ink-muted">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
