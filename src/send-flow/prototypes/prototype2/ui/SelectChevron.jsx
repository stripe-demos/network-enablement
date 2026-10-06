import React from 'react';
import { Icon } from '../../../icons/SailIcons';

/**
 * The picker affordance: a single down chevron.
 *
 * One glyph for every control that opens a list of options — accounts, destinations, delivery
 * rails, currencies, countries — and the same one the currency chip and the Fees disclosure
 * already use. A double arrow distinguished "there are other values" from "expand this", but it
 * made the pickers the loudest thing in a field whose job is to show the value, and the Sail
 * chevron is what the rest of the dashboard sets beside a select.
 *
 * It doesn't rotate when the menu opens: the panel appearing is the state change, and the
 * trigger's own fill already says it's the open one.
 */
export default function SelectChevron({ size = 'xxsmall', className = '' }) {
  return (
    <Icon
      name="chevronDown"
      size={size}
      className={`shrink-0 ${className}`.trim()}
    />
  );
}
