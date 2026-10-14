import React, { useRef } from 'react';

/**
 * Text input (or textarea) with an Autofill affordance.
 *
 * Prototype convenience: filling out bank details by hand is the slowest part of
 * a walkthrough, so every free-text field offers a one-click plausible value.
 * The value comes from `autofill` when given, otherwise from the placeholder —
 * most placeholders are already realistic sample data ("110000000",
 * "BOFAUS3NXXX", "name@example.com"), so they double as the fill. Fields whose
 * placeholder is an instruction rather than an example ("Paste address here")
 * pass `autofill` explicitly.
 *
 * The button only shows while the field is empty: once there's a value it would
 * be clutter, and clicking it would destroy what was typed.
 */
export default function TextInput({
  value,
  onChange,
  placeholder,
  autofill,
  type = 'text',
  ariaLabel,
  multiline = false,
  rows = 3,
  autoFocus = false,
  disabled = false,
  className = '',
}) {
  const ref = useRef(null);
  const fill = autofill ?? placeholder;
  // Nothing to offer on a field that can't be typed into.
  const showAutofill =
    Boolean(fill) && !String(value ?? '').trim() && !disabled;

  /**
   * When the placeholder IS the sample data, it reads as a filled field — a
   * routing number of "110000000" in placeholder grey looks like a value, so an
   * empty form looks complete and a disabled Continue looks broken. Prefixing
   * makes it unmistakably an example while Autofill still inserts the bare value.
   *
   * Fields that pass an explicit `autofill` already have an instructional
   * placeholder ("Paste address here", "Address line 1"), so they're left alone.
   */
  const shown =
    autofill === undefined && placeholder ? `e.g. ${placeholder}` : placeholder;

  // Resting hairline plus a 4px halo on focus, per the reference form control —
  // the hairline stays put rather than being replaced by a heavier accent ring.
  const base =
    'text-sail-label-medium w-full rounded-control px-3 outline-none transition-shadow duration-150 placeholder:text-ink-faint';

  /**
   * Disabled reads as "on file", not as "broken": panel fill and muted ink, the same
   * treatment as the read-only Token field on the add-destination form, and no focus ring
   * or border — there's nothing here to act on.
   */
  const tone = disabled
    ? 'bg-panel text-ink-muted cursor-not-allowed'
    : 'bg-canvas text-ink shadow-form focus:shadow-form-focus';

  const shared = {
    ref,
    value: value ?? '',
    onChange: (e) => onChange(e.target.value),
    placeholder: shown,
    'aria-label': ariaLabel,
    autoFocus,
    disabled,
  };

  return (
    <div className={`group relative ${className}`}>
      {multiline ? (
        <textarea
          {...shared}
          rows={rows}
          className={`${base} ${tone} resize-none py-2`}
        />
      ) : (
        <input
          {...shared}
          type={type}
          className={`${base} ${tone} h-10 ${showAutofill ? 'pr-[74px]' : ''}`}
        />
      )}

      {showAutofill && (
        <button
          type="button"
          // Keep focus off the button so the caret lands in the field afterwards.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onChange(fill);
            ref.current?.focus();
          }}
          // Revealed on hover, and on focus-within so it's reachable by keyboard.
          // pointer-events are dropped while invisible, otherwise it stays a dead
          // click target sitting over the right end of the field.
          className={`text-sail-label-small-emphasized pointer-events-none absolute right-1.5 flex h-6 cursor-pointer items-center rounded-control bg-action-tint px-2 text-action-link opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 motion-reduce:transition-none ${
            multiline ? 'bottom-2' : 'top-1/2 -translate-y-1/2'
          }`}
        >
          Autofill
        </button>
      )}
    </div>
  );
}
