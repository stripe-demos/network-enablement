import React from 'react';

/**
 * A small indeterminate spinner: a hairline ring with one brand-coloured quarter.
 *
 * Used where a control is briefly working something out — the Delivery field re-deriving
 * which rails a new currency allows. Sized in `em` so it tracks whatever text it sits
 * beside rather than needing a size prop.
 */
export default function Spinner({ className = '' }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block h-[1em] w-[1em] shrink-0 animate-spin rounded-full border-2 border-hairline border-t-action motion-reduce:animate-none ${className}`.trim()}
    />
  );
}
