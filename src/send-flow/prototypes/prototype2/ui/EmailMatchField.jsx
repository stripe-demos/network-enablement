import React from 'react';
import TextInput from './TextInput';

/**
 * Email field that collapses into a contact pill when the value is an exact
 * Network-account match — same token treatment as a resolved recipient chip.
 */
export default function EmailMatchField({
  value,
  onChange,
  match,
  placeholder,
  autofill,
  ariaLabel,
  type = 'email',
}) {
  if (!match) {
    return (
      <TextInput
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autofill={autofill}
        ariaLabel={ariaLabel}
      />
    );
  }

  return (
    <div className="flex h-10 items-center rounded-control bg-canvas px-2 shadow-form">
      <span className="flex h-7 max-w-full items-center gap-1.5 rounded-full bg-panel pl-1 pr-1.5">
        {match.hasBrandIcon ? (
          <img
            src="/unified-account-icon.png"
            alt=""
            className="h-5 w-5 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="text-sail-label-small-emphasized flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-panel-deep text-ink">
            {match.initials}
          </span>
        )}
        <span className="text-sail-label-medium min-w-0 truncate text-ink">{value}</span>
        <button
          type="button"
          aria-label="Clear email"
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-ink-faint hover:bg-panel-deep hover:text-ink"
          onClick={() => onChange('')}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
            <path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      </span>
    </div>
  );
}
