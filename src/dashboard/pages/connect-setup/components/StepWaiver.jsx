/**
 * Waiver / acknowledgment step for the Connect onboarding dialog.
 *
 * Renders the waiver heading, an independently-expandable list of "Your
 * responsibilities" rows, and an acknowledgment checkbox. Gating of the parent's
 * Continue button lives in the parent — this component only reports the checkbox
 * state via `onAcknowledgedChange`.
 */
import { useState } from 'react';
import StepHeading from '../steps/StepHeading';
import { Icon } from './Icon';
import { SetupCheckbox } from './SetupCheckbox';

export default function StepWaiver({ waiver, acknowledged = false, onAcknowledgedChange }) {
  const [openRows, setOpenRows] = useState(() => new Set());

  if (!waiver) return null;

  const toggleRow = (key) => {
    setOpenRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const responsibilities = waiver.responsibilities ?? [];

  return (
    <div className="flex flex-col gap-6">
      <StepHeading lead={waiver.title} rest={waiver.subtitle} />

      <div className="flex flex-col gap-1">
        <h3 className="text-heading-xsmall text-default">Your responsibilities</h3>
        <div>
          {responsibilities.map((item, index) => {
            const key = item.label ?? index;
            const open = openRows.has(key);
            return (
              <div key={key} className="border-b border-hairline">
                <button
                  type="button"
                  onClick={() => toggleRow(key)}
                  className="flex w-full items-center gap-2 py-3 text-left"
                >
                  <Icon
                    name="chevronRight"
                    size="xsmall"
                    fill="currentColor"
                    className={`shrink-0 text-icon-subdued transition-transform ${open ? 'rotate-90' : ''}`}
                  />
                  <span className="text-body-small text-default">{item.label}</span>
                </button>
                {open && (
                  <div className="pb-3 pl-6 text-body-small text-subdued">{item.detail}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <SetupCheckbox
        className="mt-2"
        checked={acknowledged}
        onChange={(e) => onAcknowledgedChange?.(e?.target?.checked ?? !acknowledged)}
        label={waiver.ackLabel}
      />
    </div>
  );
}
