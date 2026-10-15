import { useEffect, useRef } from 'react';
import OptionCard from './OptionCard';
import FundsFlowDiagram from './FundsFlowDiagram';
import { FUNDS_FLOW } from '../data/config';

/**
 * The funds-flow card: the illustrated lead-in for the "How payments move"
 * group. It stacks two regions inside the group's offset (grey) surface —
 *
 *   1. a diagram panel that sits directly on the grey dotted background (no
 *      card of its own), showing the funds flow for the current charge type; and
 *   2. a white selector card below it, which behaves exactly like a SettingCard
 *      — it reads as "Charge type" + the selected option's description, and a
 *      brand "Edit"/"Done" text link in the top-right toggles the row of
 *      OptionCards below the description. Picking one commits immediately.
 *
 * The heading stays "Charge type" in both states so the copy is consistent in
 * and out of editing. The diagram is a live reflection of the selected value,
 * so choosing "Destination charges" swaps the illustration above the editor.
 * The diagram is decorative, and an expanded selector closes on "Done" or
 * Escape only — outside pointer-down does not collapse it.
 */
export default function FundsFlowCard({ setting, value, expanded, edited = false, onToggle, onChange }) {
  const options = setting.options ?? [];
  const selected = options.find((option) => option.value === value);
  const flow = FUNDS_FLOW[value] ?? FUNDS_FLOW.direct;

  // Held in a ref so re-registering the listener doesn't depend on a fresh
  // `onToggle` identity each render (matches SettingCard).
  const onToggleRef = useRef(onToggle);
  useEffect(() => {
    onToggleRef.current = onToggle;
  });

  useEffect(() => {
    if (!expanded) return undefined;

    const onEscape = (event) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      onToggleRef.current?.();
    };

    document.addEventListener('keydown', onEscape, true);
    return () => document.removeEventListener('keydown', onEscape, true);
  }, [expanded]);

  return (
    <div className="flex flex-col gap-[4px]">
      {/* Diagram sits directly on the group's grey dotted surface. */}
      <div
        className="flex items-center justify-center px-4 py-6"
        style={{
          backgroundImage: 'radial-gradient(var(--color-hairline) 1px, transparent 1.5px)',
          backgroundSize: '16px 16px',
          backgroundPosition: 'center',
        }}
      >
        <FundsFlowDiagram diagram={flow.diagram} />
      </div>

      {/* White charge-type selector card, toggled only by the top-right text link. */}
      <div className="group rounded-[8px] border border-hairline bg-surface p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="text-label-small-emphasized text-default">
            {setting.label}
            {edited ? <span className="text-label-small text-subdued"> (edited)</span> : null}
          </div>

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

        <div className="mt-1 text-body-small text-subdued">{selected?.description ?? ''}</div>

        {/* motion: card-expand — gentle spring open/close (see SettingCard). */}
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
              {options.map((option) => (
                <OptionCard
                  key={option.value}
                  option={option}
                  selected={option.value === value}
                  onSelect={() => onChange?.(option.value)}
                  className="flex-1 basis-0"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
