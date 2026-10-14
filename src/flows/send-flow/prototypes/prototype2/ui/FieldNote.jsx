import React from 'react';
import { Icon } from '../../../icons/SailIcons';

/**
 * A requirement note: brand glyph, then one line saying why the field below is being
 * asked for.
 *
 * The plain-panel callout this replaced sat at the top of the form, furthest from the
 * field it explained. This sits directly above that field, and keeps the glyph so the line
 * still reads as the system asking for something rather than as body copy.
 */
export default function FieldNote({ children, className = '' }) {
  return (
    <p
      className={`text-sail-label-medium flex items-start gap-2 text-action-link ${className}`.trim()}
    >
      {/* Glyph and copy in the same brand ink: the line is one object, and two colours
          across it read as an icon labelling a sentence someone else wrote. */}
      <Icon
        name="warningCircle"
        size="small"
        // Optically centred against the 20px line, as the info note on the personal form is.
        className="mt-0.5 shrink-0"
      />
      <span>{children}</span>
    </p>
  );
}
