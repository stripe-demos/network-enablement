import React from 'react';
import { Icon } from '../../../icons/SailIcons';

/**
 * Segmented control — 429:225910.
 *
 * An inset track rather than bordered halves: the track sits on the offset fill
 * with 4px padding, and the selected option is a white chip that lifts slightly.
 * Unselected options are transparent over the track, so there's no divider.
 */
export default function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="flex h-10 gap-1 rounded-card bg-neutral-50 p-1">
      {options.map((o) => {
        const selected = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={selected}
            className={`text-sail-label-medium-emphasized flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-control transition-colors ${
              selected
                ? 'bg-canvas text-ink shadow-chip'
                : 'bg-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {o.icon && <Icon name={o.icon} size="small" className="shrink-0" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
