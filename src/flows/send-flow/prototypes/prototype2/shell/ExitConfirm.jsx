import React from 'react';
import Button from '../../../components/Button';

/**
 * Exit confirmation, as the reference dialog draws it
 * (mmui-prototype/src/components/PayoutDialog.tsx:509-528).
 *
 * Deliberately NOT a dialog stacked on the sheet. It's a 75% white wash INSIDE
 * the panel, with the copy sitting on a white glow rather than in a bordered
 * card — so the sheet is still legible underneath and you can see the progress
 * you're about to lose. A second modal over the first darkened everything twice
 * and hid exactly that.
 *
 * `borderRadius: inherit` keeps the wash inside the panel's 12px corners; the
 * flooding white box-shadow is what dissolves the block's own edges into it.
 */
export default function ExitConfirm({ onKeepEditing, onExit }) {
  return (
    <div
      className="sail-overlay-in absolute inset-0 z-[200] flex items-center justify-center"
      style={{
        background: 'rgba(255, 255, 255, 0.75)',
        borderRadius: 'inherit',
      }}
      role="alertdialog"
      aria-modal="true"
      aria-label="Exit send?"
    >
      <div
        className="flex w-full max-w-[480px] flex-col items-start gap-1 p-10"
        style={{
          borderRadius: 9999,
          background: '#FFF',
          boxShadow: '0 4px 50px 40px #FFF',
        }}
      >
        {/* The reference says "transfer" because it lives in PayoutDialog; this
            flow is Send throughout, header included, so the noun follows suit. */}
        <span className="text-sail-heading-medium text-ink">Exit send?</span>
        <span className="text-sail-label-medium text-ink">
          Your progress on this send will be lost.
        </span>
        <div className="mt-3 flex items-center gap-2">
          {/* No autoFocus: it lands a visible focus ring on the button the moment
              the wash appears, which the reference doesn't draw. */}
          <Button variant="secondary" size="md" onClick={onKeepEditing}>
            Continue editing
          </Button>
          <Button variant="danger" size="md" onClick={onExit}>
            Exit
          </Button>
        </div>
      </div>
    </div>
  );
}
