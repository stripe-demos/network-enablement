import React from 'react';
import FlagIcon from './FlagIcon';

/**
 * Trailing country pill: flag + 2-letter code on a panel fill (429:226230).
 *
 * `tone="deep"` for a pill on a panel-filled row — same reason as Avatar's
 * (SendDialog.tsx:549).
 */
export default function CountryTag({ code, tone = 'default' }) {
  // The designs label GB as "UK"; FlagIcon accepts either.
  const label = code === 'GB' ? 'UK' : code;
  return (
    <span
      className={`flex h-6 shrink-0 items-center gap-1 rounded-control px-2 ${
        tone === 'deep' ? 'bg-panel-deep' : 'bg-panel'
      }`}
    >
      <FlagIcon
        code={code}
        className="inline-flex h-4 w-4 shrink-0 items-center"
      />
      <span className="text-sail-label-small-emphasized text-ink">{label}</span>
    </span>
  );
}
