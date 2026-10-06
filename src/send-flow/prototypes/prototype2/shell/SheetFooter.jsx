import React from 'react';
import Button from '../../../components/Button';

/**
 * Footer action bar: Back bottom-left, primary bottom-right.
 *
 * `Continue` has a real disabled state in the frames (light purple), so
 * `canContinue` is load-bearing rather than decorative — it comes from the step
 * registry, not from inside a step component.
 *
 * variant 'default' → Back / primary
 * variant 'dual'    → secondary / primary, used by the success screen
 *                     (View payout / Finish), which has no Back.
 * variant 'back'    → Back (or Cancel) alone, for a step whose content advances
 *                     itself — a drill-in list has nothing for a primary to do.
 *
 * 24px on all four sides with the height following the buttons, matching the
 * reference dialog footer (SendDialog.tsx:634, 645) rather than a fixed 72px row.
 */
export default function SheetFooter({
  variant = 'default',
  showBack = true,
  backLabel = 'Back',
  primaryLabel = 'Continue',
  secondaryLabel,
  canContinue = true,
  pending = false,
  onBack,
  onPrimary,
  onSecondary,
}) {
  // Steps where selecting an item is itself the action have no footer.
  if (variant === 'none') return null;

  // Drill-in step: the way forward is in the content, so only the way out is here.
  if (variant === 'back') {
    return (
      <div className="flex shrink-0 items-center p-6">
        {showBack && (
          <Button
            variant="secondary"
            size="lg"
            className="text-sail-label-large-emphasized"
            onClick={onBack}
          >
            {backLabel}
          </Button>
        )}
      </div>
    );
  }

  // On the success screens both actions sit together bottom-right (429:227684),
  // rather than the split Back-left / primary-right of the form steps.
  if (variant === 'dual') {
    return (
      <div className="flex shrink-0 items-center justify-end gap-2 p-6">
        {secondaryLabel && (
          <Button
            variant="secondary"
            size="lg"
            className="text-sail-label-large-emphasized"
            onClick={onSecondary}
          >
            {secondaryLabel}
          </Button>
        )}
        <Button
          variant="primary"
          size="lg"
          className="text-sail-label-large-emphasized"
          onClick={onPrimary}
        >
          {primaryLabel}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center justify-between p-6">
      <div>
        {showBack && (
          <Button
            variant="secondary"
            size="lg"
            className="text-sail-label-large-emphasized"
            onClick={onBack}
          >
            {backLabel}
          </Button>
        )}
      </div>

      <Button
        variant="primary"
        size="lg"
        className="text-sail-label-large-emphasized"
        disabled={!canContinue || pending}
        onClick={onPrimary}
      >
        {pending ? 'Sending…' : primaryLabel}
      </Button>
    </div>
  );
}
