import React from 'react';

/**
 * Panel card used on Review — three of them stack with a 16px gap (429:224598).
 * Radius 8, panel fill, no border.
 */
export default function GroupedCard({ children, className = '' }) {
  return (
    <div className={`rounded-card bg-panel p-4 ${className}`}>{children}</div>
  );
}
