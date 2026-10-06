import React from 'react';
import { Icon } from '../../../icons/SailIcons';

/**
 * Header carrying only a small label on the left and a close X on the right.
 * No title, no icon, no description — the step heading lives in the content column.
 *
 * Matched to the reference dialog header (PayoutDialog.tsx:261-278): 24px padding on
 * all four sides with the height following the content, rather than a fixed 72px
 * row; the label at Label/Large emphasized (16/24/600), not bold; and the close
 * button a 24px icon whose hover target is grown 8px past it on every side, so
 * the affordance is comfortable without a visible 28px chip.
 *
 * The label is per-step, not constant: the frames show "Send" on steps 1-3,
 * "Transfer" on Review (treated as a copy slip, see plan), "Pay by email" on the email
 * rail, and a breadcrumb on the add-recipient sub-flow. So this takes either a
 * `label` string or a `breadcrumb` array, never branches on step id.
 */
export default function SheetHeader({
  label,
  breadcrumb,
  onClose,
  onExitSubflow,
}) {
  return (
    <div className="flex shrink-0 items-center justify-between p-6">
      {breadcrumb?.length ? (
        <Breadcrumb crumbs={breadcrumb} onExitSubflow={onExitSubflow} />
      ) : (
        <span className="text-sail-label-large-emphasized text-ink">
          {label}
        </span>
      )}

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="group relative flex h-6 w-6 cursor-pointer items-center justify-center text-ink-muted"
      >
        {/* The hit area and the hover fill are the same inset-[-8px] box, so the
            target is 40px square while the glyph stays 24px. */}
        <span className="absolute inset-[-8px] rounded-card transition-colors group-hover:bg-panel" />
        <Icon
          name="cancel"
          size="small"
          fill="currentColor"
          className="relative z-10"
        />
      </button>
    </div>
  );
}

/**
 * The sub-flow breadcrumb, per the reference (PayoutDialog.tsx:266-273).
 *
 * The FIRST crumb is the link: it's the trunk you interrupted, painted brand
 * purple, and clicking it abandons the sub-flow and returns you there. The LAST
 * crumb is where you are now, in plain ink. Both are Label/Large emphasized, so
 * colour alone carries the difference — and it has to be this way round, since
 * purple on the current step reads as "this is a link" on the one thing that
 * isn't.
 *
 * Only the trailing crumbs animate: the first was already on screen as the plain
 * label, so sliding it too would move text that didn't change.
 */
function Breadcrumb({ crumbs, onExitSubflow }) {
  const last = crumbs.length - 1;

  return (
    <nav className="flex items-center gap-2" aria-label="Breadcrumb">
      {crumbs.map((crumb, i) =>
        i === last ? (
          <span
            key={crumb}
            aria-current="page"
            className="sail-breadcrumb-slide text-sail-label-large-emphasized text-ink"
          >
            {crumb}
          </span>
        ) : (
          <React.Fragment key={crumb}>
            <button
              type="button"
              onClick={onExitSubflow}
              className="text-sail-label-large-emphasized cursor-pointer text-action-link"
            >
              {crumb}
            </button>
            {/* A stroked 6x10 chevron, not the filled Sail glyph — the reference
                draws this one at 1.5px with round caps, and the filled icon reads
                noticeably heavier next to 16px text. */}
            <svg
              className="sail-breadcrumb-slide shrink-0 text-ink-muted"
              width="6"
              height="10"
              viewBox="0 0 6 10"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M1 1L5 5L1 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </React.Fragment>
        ),
      )}
    </nav>
  );
}
