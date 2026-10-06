import React, { useState } from 'react';
import { Icon } from '../../../icons/SailIcons';
import Reveal from './Reveal';
import Spinner from './Spinner';

/**
 * Fee ladder between "You will pay" and "They will receive" — 429:223599
 * (domestic) and 429:223890 (cross-border), restructured per Option B.
 *
 * A dotted rail runs down the operator column; each group hangs an operator badge
 * (+ − × =) beside its first row. Neither end of the ladder carries a total: the
 * two amount fields it sits between are the totals, so a row repeating one of them
 * would be a sum with the answer already on screen.
 *
 * groups: [{ id, op, rows: [{ key, label, value, pill }], summary }]
 *
 * A group with a `summary` collapses: the summary row shows the combined figure
 * with a disclosure chevron, and `rows` become its itemisation, hidden until asked
 * for and sharing the summary's left edge once shown. That keeps the ladder to one line per operation by
 * default while the individual charges stay one click away.
 *
 * `value` is pre-formatted text — this component does no money maths.
 */
/**
 * `variant` places the rail.
 *
 * 'field'   between two form fields, where the badge column is its own gutter (the default)
 * 'ledger'  between two 28px marks on Review, where the rail has to run through their centres
 */
const RAIL = {
  /**
   * The rail runs through this padding, so the lead-in above the badge is what makes the dots
   * visible. `-mt-4 pt-6` reaches up INTO the 20px the stack already leaves above the ladder
   * rather than adding to it: the badge barely moves, the gap stays as tight as it was asked to
   * be, and the dots get 24px to run through. Needs the Reveal's clip box widened to match —
   * see its `bleed`.
   */
  field: { pad: '-mt-4 pb-6 pl-4 pt-6', left: 'left-[25px]' },
  ledger: { pad: 'py-4 pl-1', left: 'left-[13px]' },
};

export default function FeeLadder({
  groups,
  loading = false,
  variant = 'field',
}) {
  const visible = groups.filter((g) => g.rows.length > 0);
  if (visible.length === 0) return null;

  return (
    // The padding lives here rather than on the Reveal wrapper because the rail
    // runs through it — 429:223846 leads in above the first badge and out below
    // the last.
    //
    // Asymmetric on purpose. Above, the previous field's space-y-5 margin adds
    // 20px, so 12px here makes the frame's 32px. Below, Reveal zeroes its own
    // margin, so the group's 20px never lands and the full 24px lead-out has to
    // come from here.
    <div className={`relative ${RAIL[variant].pad}`}>
      {/* Rail: dotted the full height, fading out at both ends. The component
          fades it per-dot (neutral-0 → 25 → 50 → 100 going down, and back out
          again at the bottom); a mask is the same intent without five hard-coded
          colour stops. */}
      <span
        aria-hidden="true"
        className={`absolute bottom-0 top-0 w-0.5 ${RAIL[variant].left}`}
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, var(--color-neutral-100) 1px, transparent 1.1px)',
          backgroundSize: '2px 7px',
          backgroundRepeat: 'repeat-y',
          // 3px of fade at the top, not 7: a 7px ramp swallowed the first dot whole, which is
          // why the rail looked like it began at the badge.
          maskImage:
            'linear-gradient(to bottom, transparent, #000 3px, #000 calc(100% - 14px), transparent)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent, #000 3px, #000 calc(100% - 14px), transparent)',
        }}
      />

      {/* While the quote is being worked out, one line in place of the arithmetic: the
          figures on screen belong to the old currency pair, and holding them up as if they
          were current is worse than showing nothing. The rail and the padding stay, so
          nothing below the ladder moves when the answer arrives. */}
      {loading ? (
        <div className="flex items-center gap-[13px]">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center text-sail-label-small">
            <Spinner />
          </span>
          <span className="text-sail-label-small text-ink-muted">
            Recalculating fees
          </span>
        </div>
      ) : (
        <div className="space-y-3.5">
          {visible.map((group) =>
            group.summary ? (
              <CollapsibleGroup key={group.id} group={group} />
            ) : (
              <div key={group.id} className="space-y-2">
                {group.rows.map((row, i) => (
                  <LadderRow
                    key={row.key}
                    row={row}
                    // Only the group's first row carries the badge; the rest align to it.
                    badge={i === 0 ? <OperatorBadge op={group.op} /> : null}
                  />
                ))}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

/**
 * One line of the ladder: badge (or its empty slot), label, right-aligned figure.
 *
 * `quiet` is an itemised charge sitting under a collapsible total — "ACH payout fee" beneath
 * "Fees". Its figure takes the regular weight so the sum it belongs to stays the bolder of the
 * two; at the same weight the four numbers read as one flat list and the total stopped being
 * the total.
 */
function LadderRow({ row, badge, quiet = false }) {
  return (
    // `items-start`, not `items-center`: a row carrying a note is two lines tall, and
    // centring would drop the badge to the middle of the pair instead of aligning it
    // with the label.
    <div className="flex items-start gap-[13px]">
      {badge ?? <span className="w-5 shrink-0" />}

      {/* Full-strength ink on every line, itemisation included: the rows are all the
          same kind of fact, and muting the breakdown made the charges harder to read
          than the sum they add up to. They keep the label column's left edge too, so
          every line of the ladder starts on the same axis. */}
      <span className="min-w-0 flex-1">
        <span className="text-sail-label-small flex min-w-0 items-center gap-2 text-ink">
          <span className="truncate">{row.label}</span>
          {row.pill}
        </span>
        {/* What's left of the monthly allowance, on its own line under the fee it
            explains. On a panel fill so it reads as a note about that row rather than
            as another charge.
            `w-fit`: the fill hugs the sentence instead of running to the value column,
            where the empty tail read as an unfinished field. */}
        {row.note && (
          <span className="text-sail-label-small mt-1.5 block w-fit max-w-full rounded-card bg-panel px-3 py-2 text-ink-muted">
            {row.note}
          </span>
        )}
      </span>

      {/* Emphasized: the figures are what the sender is scanning, and the labels tell
          them which figure is which. */}
      <span
        className={`shrink-0 tabular-nums text-ink ${
          quiet ? 'text-sail-label-small' : 'text-sail-label-small-emphasized'
        }`}
      >
        {row.value}
      </span>
    </div>
  );
}

/**
 * "Fees ⌄ $2.00", with the individual charges underneath once opened.
 *
 * Collapsed by default: the sum is what the sender is deciding on, and three fee
 * rows between the two amounts pushed the recipient's figure off the first glance.
 * The whole summary row is the control, so the hit target is the line rather than
 * the chevron alone.
 */
function CollapsibleGroup({ group }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-[13px] text-left"
      >
        <OperatorBadge op={group.op} />

        <span className="text-sail-label-small flex min-w-0 items-center gap-1 text-ink">
          <span className="truncate">{group.summary.label}</span>
          <Icon
            name="chevronDown"
            size="xxsmall"
            className={`shrink-0 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </span>

        <span className="text-sail-label-small-emphasized ml-auto shrink-0 tabular-nums text-ink">
          {group.summary.value}
        </span>
      </button>

      {/* Reveal rather than a conditional: the rows stay mounted, so opening slides
          them down while they fade in, and closing runs the same animation in reverse
          — which a `&&` can't do, because the node is gone before it could animate
          out. Everything below the ladder ("They will receive" and the rest of the
          form) moves with it, since the ladder's height is what changes.

          `gap="pt-2"` replaces the row spacing this group's `space-y-2` would have
          applied: margin outside the animated area survives the collapse and would
          leave 8px of dead space behind a closed group. */}
      <Reveal show={open} gap="pt-2" className="space-y-2">
        {group.rows.map((row) => (
          <LadderRow key={row.key} row={row} badge={null} quiet />
        ))}
      </Reveal>
    </div>
  );
}

/**
 * Operator badge — 481:28423 ("Fee icons"). A 20px white circle with a hairline
 * border and 6px of padding around an 8px glyph in Icon/Subdued.
 *
 * The glyphs are built from 1.5px round-capped bars, matching the component
 * (which draws them as rounded rectangles rather than as a text character).
 */
export function OperatorBadge({ op }) {
  return (
    <span
      aria-hidden="true"
      className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-hairline bg-canvas"
    >
      <svg
        viewBox="0 0 8 8"
        className="h-2 w-2 text-icon-subdued"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        {op === '+' && <path d="M4 .75v6.5M.75 4h6.5" />}
        {op === '−' && <path d="M.75 4h6.5" />}
        {op === '×' && <path d="M1.4 1.4l5.2 5.2M6.6 1.4L1.4 6.6" />}
        {/* The component spaces the equals bars unusually wide: centres at 1.75
            and 6.75 of 8, not the 2.5/5.5 you'd expect. */}
        {op === '=' && <path d="M.75 1.75h6.5M.75 6.25h6.5" />}
      </svg>
    </span>
  );
}

/** "USD ⇆ GBP" chip beside the Exchange rate label. */
export function CurrencyPairPill({ from, to }) {
  return (
    <span className="text-sail-label-small flex h-5 shrink-0 items-center gap-1.5 rounded-full bg-panel px-2 text-ink">
      {from}
      <svg
        width="10"
        height="10"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M1.5 4h8L7.5 2M10.5 8h-8L4.5 10"
          stroke="var(--color-action-link)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {to}
    </span>
  );
}
