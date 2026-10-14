import React from 'react';
import { NETWORKS, network as networkById } from '../data/networks';
import usePopover from './usePopover';
import PopoverPanel from './PopoverPanel';

/**
 * Network picker for the stablecoin wallet form. Same shape as CountrySelect —
 * 40px control, leading mark, two-chevron stepper affordance — with the network
 * logo in place of the flag.
 */
export default function NetworkSelect({ value, onChange }) {
  const { ref, panelRef, open, expanded, animation, toggle, close } =
    usePopover();

  const selected = networkById(value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={expanded}
        aria-label="Network"
        className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-control bg-canvas px-3 text-left shadow-[0_0_0_1px_var(--color-border)]"
      >
        <Mark network={selected} />
        <span className="text-sail-label-medium flex-1 truncate text-ink">
          {selected.label}
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
          {NETWORKS.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                onChange(n.id);
                close();
              }}
              className={`text-sail-label-medium flex w-full cursor-pointer items-center gap-2 rounded-card px-3 py-2 text-left transition-colors ${
                n.id === value ? 'bg-panel text-ink' : 'text-ink hover:bg-panel'
              }`}
            >
              <Mark network={n} />
              <span className="flex-1 truncate">{n.label}</span>
            </button>
          ))}
        </PopoverPanel>
      )}
    </div>
  );
}

function Mark({ network }) {
  return (
    <img
      src={network.logo}
      alt=""
      className="h-4 w-4 shrink-0 rounded-[4px] object-contain"
    />
  );
}

/** Up/down stepper chevrons, matching CountrySelect. */
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
