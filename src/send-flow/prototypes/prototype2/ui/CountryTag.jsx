import React from 'react';
import FlagIcon from './FlagIcon';

/**
 * Trailing country pill: flag + 2-letter code on a panel fill (429:226230).
 *
 * `tone="deep"` for a pill on a panel-filled row — same reason as Avatar's
 * (SendDialog.tsx:549).
 */
export default function CountryTag({ code, tone = 'default', size = 'default' }) {
  // The designs label GB as "UK"; FlagIcon accepts either.
  const label = code === 'GB' ? 'UK' : code;
  const compact = size === 'sm';
  return (
    <span
      className={`flex shrink-0 items-center ${
        tone === 'plain'
          ? compact ? 'gap-1' : 'gap-1.5'
          : compact ? 'h-5 gap-1 rounded-[4px] px-1.5' : 'h-6 gap-1 rounded-control px-2'
      } ${tone === 'deep' ? 'bg-panel-deep' : tone === 'plain' ? '' : 'bg-panel'}`}
    >
      <FlagIcon
        code={code}
        className={compact
          ? 'inline-flex h-3 w-3 shrink-0 items-center [&>svg]:h-full [&>svg]:w-full'
          : 'inline-flex h-4 w-4 shrink-0 items-center'}
      />
      <span className={compact ? 'text-[11px] font-[600] leading-[14px] text-ink' : 'text-sail-label-small-emphasized text-ink'}>
        {label}
      </span>
    </span>
  );
}
