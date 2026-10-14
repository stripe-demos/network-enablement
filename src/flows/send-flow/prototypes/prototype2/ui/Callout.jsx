import React from 'react';
import { Icon } from '../../../icons/SailIcons';

/**
 * A panel-filled notice with a leading glyph: a title, a sentence or two, and an
 * optional action on the right.
 *
 * Used by the two halves of the Confirmation of Payee flow — the blocker on the
 * Destination step and the suggestion inside the sub-flow — so both read as the same
 * kind of message from the same source. Brand-tinted glyph rather than a warning
 * colour: nothing has gone wrong, there's something to confirm.
 *
 * Brand-tinted by default, which is what both Confirmation of Payee surfaces use: a
 * callout is never a field, and on a screen made of fields a grey panel reads as one.
 * `tone="panel"` is there for a callout that sits somewhere without that problem.
 */
const TONES = { panel: 'bg-panel', brand: 'bg-panel-brand' };

export default function Callout({
  icon = 'warningCircle',
  title,
  children,
  action,
  tone = 'brand',
  className = '',
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-card p-3 ${TONES[tone]} ${className}`.trim()}
    >
      <Icon
        name={icon}
        size="small"
        className="mt-0.5 shrink-0 text-action-link"
      />

      <div className="min-w-0 flex-1">
        <p className="text-sail-label-medium-emphasized text-ink">{title}</p>
        {children && (
          <div className="text-sail-label-medium text-ink-muted">
            {children}
          </div>
        )}
      </div>

      {/* Self-centred rather than aligned to the first line: the action is about the
          whole message, and two lines of copy would leave it hanging off the top. */}
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}
