import { useEffect, useRef } from 'react';
import OptionCard from './OptionCard';

/**
 * A single recommended setting — the design's `.tradit_box`, with three states:
 * Default → Editing → Edited.
 *
 * Collapsed it reads as label + chosen value. The card itself is a static box:
 * a brand "Edit"/"Done" text link in the top-right (revealed on hover, always
 * shown while editing) is the only thing that toggles the editor. Editing opens
 * a row of equal-width option cards below the value line, which stays visible.
 * There is no Save or Cancel — picking an option commits immediately.
 *
 * Once the value differs from Stripe's recommendation the title gains a regular
 * weight, subdued " (edited)" suffix.
 *
 * An expanded row closes on "Done" or Escape; outside pointer-down does not
 * collapse it. Nothing is committed on close — `onChange` already fired when the
 * option was picked — so closing only dismisses the editor.
 */
export default function SettingCard({
  setting,
  value,
  expanded,
  edited = false,
  onToggle,
  onChange,
  className = '',
  disabledValues = [],
  disabledReason,
}) {
  const options = setting.options ?? [];
  const selected = options.find((option) => option.value === value);

  // Held in a ref so re-registering the listener doesn't depend on a fresh
  // `onToggle` identity each render.
  const onToggleRef = useRef(onToggle);
  useEffect(() => {
    onToggleRef.current = onToggle;
  });

  useEffect(() => {
    if (!expanded) return undefined;

    const onEscape = (event) => {
      if (event.key !== 'Escape') return;
      // Don't let the dialog close too — this only dismisses the editor.
      event.stopPropagation();
      onToggleRef.current?.();
    };

    document.addEventListener('keydown', onEscape, true);
    return () => document.removeEventListener('keydown', onEscape, true);
  }, [expanded]);

  return (
    <div className={`group rounded-[8px] border border-hairline bg-surface p-4 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-label-small-emphasized text-default">
          {setting.label}
          {edited ? <span className="text-label-small text-subdued"> (edited)</span> : null}
        </div>

        {/* motion: row-hover-edit — the affordance that makes the row look
            editable at all. 120ms ease-out per the motion inventory. */}
        <button
          type="button"
          onClick={() => onToggle?.()}
          className={`text-label-small-emphasized text-brand hover:underline shrink-0 cursor-pointer transition-opacity duration-[120ms] ease-out ${
            expanded
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
          }`}
        >
          {expanded ? 'Done' : 'Edit'}
        </button>
      </div>

      <div className="mt-1 text-body-small text-subdued">{selected?.label ?? ''}</div>

      {/* motion: card-expand — a gentle spring open/close. The grid-rows
          0fr↔1fr trick animates the auto height; the inner row adds a soft
          overshoot (easeOutBack) on transform + opacity. */}
      <div
        className={`grid transition-[grid-template-rows] duration-[260ms] ease-out motion-reduce:transition-none ${
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div
            role="radiogroup"
            aria-label={setting.label}
            aria-hidden={!expanded}
            className={`mt-2 flex items-stretch gap-3 transition-[transform,opacity] duration-[340ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none ${
              expanded
                ? 'translate-y-0 opacity-100'
                : 'pointer-events-none translate-y-[6px] opacity-0'
            }`}
          >
            {options.map((option) => {
              const disabled = disabledValues.includes(option.value);
              return (
                <OptionCard
                  key={option.value}
                  option={option}
                  selected={option.value === value}
                  disabled={disabled}
                  disabledReason={disabled ? disabledReason : undefined}
                  onSelect={() => onChange?.(option.value)}
                  className="flex-1 basis-0"
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
