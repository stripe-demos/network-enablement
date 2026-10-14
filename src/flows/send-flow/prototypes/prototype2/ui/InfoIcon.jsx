import React from 'react';

/**
 * 16px info glyph — a rounded square rather than SailIcons' circle, matching the
 * mark supplied for the hint under Recipient type.
 *
 * Filled with `currentColor` so it takes the colour of the text it sits beside;
 * the source artwork hardcoded #3C4F69, which is `--color-ink-muted` — the same
 * token the hint copy already uses, so nothing is lost by inheriting instead.
 */
export default function InfoIcon({ className = '' }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={`block shrink-0 ${className}`.trim()}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11 2.5H5C3.61929 2.5 2.5 3.61929 2.5 5V11C2.5 12.3807 3.61929 13.5 5 13.5H11C12.3807 13.5 13.5 12.3807 13.5 11V5C13.5 3.61929 12.3807 2.5 11 2.5ZM5 1C2.79086 1 1 2.79086 1 5V11C1 13.2091 2.79086 15 5 15H11C13.2091 15 15 13.2091 15 11V5C15 2.79086 13.2091 1 11 1H5Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.25 8C6.25 7.58579 6.58579 7.25 7 7.25H8.25C8.66421 7.25 9 7.58579 9 8V11.5C9 11.9142 8.66421 12.25 8.25 12.25C7.83579 12.25 7.5 11.9142 7.5 11.5V8.75H7C6.58579 8.75 6.25 8.41421 6.25 8Z"
        fill="currentColor"
      />
      <path
        d="M6.75 5C6.75 4.31075 7.31075 3.75 8 3.75C8.68925 3.75 9.25 4.31075 9.25 5C9.25 5.68925 8.68925 6.25 8 6.25C7.31075 6.25 6.75 5.68925 6.75 5Z"
        fill="currentColor"
      />
    </svg>
  );
}
