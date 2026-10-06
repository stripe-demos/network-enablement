import React from 'react';
import { COUNTRIES } from '../data/countries';
import FlagIcon from './FlagIcon';
import usePopover from './usePopover';
import PopoverPanel from './PopoverPanel';

/**
 * Country picker. The frame uses a two-chevron up/down stepper glyph rather than
 * the single chevron baked into the shared Select, so the affordance is drawn
 * here.
 */
export default function CountrySelect({ value, onChange }) {
  const { ref, panelRef, open, expanded, animation, toggle, close } =
    usePopover();

  const selected = COUNTRIES.find((c) => c.code === value) ?? COUNTRIES[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={expanded}
        className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-control bg-canvas px-3 text-left shadow-[0_0_0_1px_var(--color-border)]"
      >
        <FlagIcon
          code={selected.code}
          className="inline-flex h-4 w-4 shrink-0 items-center"
        />
        <span className="text-sail-label-medium flex-1 truncate text-ink">
          {selected.name}
        </span>
        <Stepper />
      </button>

      {open && (
        <PopoverPanel
          anchorRef={ref}
          panelRef={panelRef}
          animation={animation}
          className="p-1.5"
        >
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                onChange(c.code);
                close();
              }}
              className={`text-sail-label-medium flex w-full cursor-pointer items-center gap-2 rounded-card px-3 py-2 text-left transition-colors ${
                c.code === value
                  ? 'bg-panel text-ink'
                  : 'text-ink hover:bg-panel'
              }`}
            >
              <FlagIcon
                code={c.code}
                className="inline-flex h-4 w-4 shrink-0 items-center"
              />
              <span className="flex-1 truncate">{c.name}</span>
              <span className="text-sail-label-small text-ink-faint">
                {c.currency}
              </span>
            </button>
          ))}
        </PopoverPanel>
      )}
    </div>
  );
}

/** Up/down stepper chevrons, per the frame. */
function Stepper() {
  return (
    <svg
      width="12"
      height="16"
      viewBox="0 0 12 16"
      fill="none"
      className="shrink-0"
    >
      <path
        d="M2.5 6.5 6 3l3.5 3.5M2.5 9.5 6 13l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-ink-muted"
      />
    </svg>
  );
}
