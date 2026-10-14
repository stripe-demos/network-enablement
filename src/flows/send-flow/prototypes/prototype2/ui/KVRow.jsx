import React from 'react';

/**
 * Label left, value right — the row shape in the Review cards.
 *
 * A local component rather than the shared KeyValuePair.jsx, whose `justified`
 * variant uses text-body-small where this design uses Label/Medium at -0.15.
 */
export default function KVRow({ label, value, note, emphasized = false }) {
  return (
    <div className="py-1">
      <div className="flex items-baseline justify-between gap-4">
        <span
          className={
            emphasized
              ? 'text-sail-label-medium-emphasized text-ink'
              : 'text-sail-label-medium text-ink-muted'
          }
        >
          {label}
        </span>
        <span
          className={
            emphasized
              ? 'text-sail-label-medium-emphasized shrink-0 text-ink'
              : 'text-sail-label-medium shrink-0 text-ink'
          }
        >
          {value}
        </span>
      </div>
      {/* A note about the row above it — what's left of the monthly allowance. Full
          width rather than in the value column: it's a sentence, not a figure. */}
      {note && (
        <p className="text-sail-label-small mt-1 text-ink-muted">{note}</p>
      )}
    </div>
  );
}
