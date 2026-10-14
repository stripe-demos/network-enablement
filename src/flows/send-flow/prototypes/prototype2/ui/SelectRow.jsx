import React from 'react';
import { Icon } from '../../../icons/SailIcons';

/**
 * The one row shape used across the whole flow: recipient rows, payout-method
 * rows, delivery-method rows and account rows. Built once because it carries
 * most of the pixel surface in the design file.
 *
 *   leading   avatar / logo / icon slot
 *   primary   14/20 emphasized
 *   secondary 12/16 subdued
 *   badge     e.g. "Recommended", "Last used"
 *   trailing  e.g. CountryTag, a fee, a balance
 *   chevron   drill-in affordance
 *
 * Selected state is a panel fill, matching the selected rows in the frames —
 * there is no check mark or accent border in this design.
 */
export default function SelectRow({
  leading,
  primary,
  secondary,
  badge,
  trailing,
  chevron = false,
  selected = false,
  disabled = false,
  onClick,
  as,
  /**
   * The leading mark hangs outside its own box — a MethodMark with a flag badge does, below
   * it and 6px to the right of it. Pays both back as padding: the gap under the flag then
   * matches the gap above the mark, and the 8px between the mark and the text is 8px of
   * clear space rather than 8px with a flag sitting in 6px of it.
   */
  leadingOverhang = false,
  /**
   * The field's menu is open. Takes the brand outline for as long as it is — the same one an
   * amount box takes when it holds the caret, because it's the same statement: this is the
   * control you're working in. It used to take a panel fill instead, which said "inactive" in
   * a flow where grey is the surround colour.
   */
  active = false,
  /**
   * 'row'   bare list row, panel fill when selected (recipient / dropdown lists)
   * 'field' bordered form control showing the current selection
   * 'panel' read-only summary on a panel fill (e.g. "Recipient selected")
   */
  variant = 'row',
  className = '',
  ...rest
}) {
  const Tag = as ?? (onClick ? 'button' : 'div');
  const interactive = Boolean(onClick) && !disabled;

  const variants = {
    row: [
      'py-3', // 40px mark + 12px top/bottom = the 64px row height in the frames
      selected ? 'bg-panel' : 'bg-transparent',
      interactive ? 'hover:bg-panel' : '',
    ].join(' '),
    // The field is bounded by its two text lines (36px) at the 52px control height
    // in the frames. An overhanging mark reserves its overhang below itself (see
    // `leading` below), which makes the mark's box as tall as the text block — so
    // the padding stays symmetric and 12px clears the flag the way it clears the
    // top of the mark. The control grows to 60px, and text, badge and chevron all
    // stay centred because nothing about the box is lopsided.
    field: [
      leadingOverhang ? 'py-3' : 'py-2',
      'bg-canvas',
      active
        ? 'shadow-[0_0_0_1.5px_var(--color-action)]'
        : 'shadow-[0_0_0_1px_var(--color-border)]',
    ].join(' '),
    // 12px top and bottom around the 40px mark — a 64px row, matching the
    // reference's recipient-selected summary (SendDialog.tsx:540). This was py-1.5,
    // which squeezed the same mark into 52px and read as a denser row than the one
    // it summarises.
    panel: 'py-3 bg-panel',
  };

  return (
    <Tag
      {...(Tag === 'button' ? { type: 'button', disabled } : {})}
      onClick={interactive ? onClick : undefined}
      aria-pressed={
        Tag === 'button' && onClick && variant === 'row' ? selected : undefined
      }
      className={[
        // 8px to the text, per the design. The flag's overhang is reserved separately (see
        // `leadingOverhang`), so this is the gap the eye actually reads.
        'flex w-full items-center gap-2 rounded-card px-3 text-left transition-colors',
        variants[variant],
        interactive ? 'cursor-pointer' : '',
        disabled ? 'opacity-50' : '',
        className,
      ]
        .join(' ')
        .trim()}
      {...rest}
    >
      {/* The flag badge is absolutely positioned, so it contributes nothing to the
          mark's box and the row centres the mark as if the flag weren't there.
          `pb-2` reserves the 8px it hangs by, which is what lets the padding above
          and below the whole mark stay equal. */}
      {leadingOverhang ? (
        <span className="flex shrink-0 pb-2 pr-1.5">{leading}</span>
      ) : (
        leading
      )}

      <span className="min-w-0 flex-1">
        <span className="text-sail-label-medium-emphasized block truncate text-ink">
          {primary}
        </span>
        {secondary && (
          <span className="text-sail-label-small block truncate text-ink-faint">
            {secondary}
          </span>
        )}
      </span>

      {badge}
      {trailing}
      {chevron && (
        <Icon
          name="chevronRight"
          size="xxsmall"
          className="shrink-0 text-ink-faint"
        />
      )}
    </Tag>
  );
}
