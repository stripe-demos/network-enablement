import React, { useMemo } from 'react';
import SelectChevron from './SelectChevron';
import { Icon } from '../../../icons/SailIcons';
import Badge from '../../../components/Badge';
import { deliveryMethod, railFee } from '../data/deliveryMethods';
import { allowanceApplies } from '../data/allowance';
import { formatMoney } from '../flow/selectors';
import SelectRow from './SelectRow';
import GroupedDropdown from './GroupedDropdown';
import Spinner from './Spinner';
import RailGlyph, { RAIL_GLYPHS } from './RailGlyphs';

/**
 * The Delivery control — which rail carries the payout.
 *
 * Extracted from the Destination step when the control moved to Payout details, where
 * the sender is deciding the amount and the date: speed and fee belong with the money,
 * not with the account. One component rather than a copy per step, since the badges and
 * the fee text are the part that's easy to let drift.
 *
 * The offered rails come from the caller: which rails a destination can use depends
 * on the currency the money arrives in, and the step that owns that choice also has
 * to re-resolve the rail when it changes. Deriving the list here as well is how the
 * menu and that effect would come to disagree.
 */
export default function DeliverySelect({
  method,
  rails,
  railId,
  quote,
  onSelect,
  loading = false,
}) {
  const rail = deliveryMethod(railId);

  /**
   * The rail this destination was last paid over, if it's still on offer.
   *
   * Null for a destination you've never paid — a brand-new bank account, or any
   * recipient with no payout history — which is the case that falls back to the
   * recommendation.
   */
  const lastUsedRailId = useMemo(() => {
    const id = method?.lastDeliveryId;
    return id && rails.some((d) => d.id === id) ? id : null;
  }, [method, rails]);

  /**
   * The rail to advise, which every destination has one of.
   *
   * Not simply the rail flagged `recommended` in the data: that flag sits on the
   * market's instant rail, and a destination needn't offer it — Baltimore's bank
   * supports ACH, Fedwire and SWIFT but not RTP, so keying off the flag alone left that
   * destination with no advice at all in the very state that most needs it.
   *
   * Null when the destination offers one rail: recommending the only thing available
   * implies an alternative that was weighed and rejected.
   */
  const recommendedRailId = useMemo(() => {
    if (rails.length < 2) return null;
    return (
      (rails.find((d) => d.badge === 'recommended') ?? rails[0])?.id ?? null
    );
  }, [rails]);

  /**
   * Which rails the monthly allowance would cover, judged per rail rather than from the
   * one selected: the menu has to price every row correctly, and asking "is the CURRENT
   * payout covered" would price RTP at its sticker while a wire is selected. Border and
   * conversion come from the quote, since both disqualify an otherwise eligible rail.
   */
  const covers = (r) =>
    allowanceApplies({
      rail: r,
      isCrossBorder: quote.crossBorderRate > 0,
      isFx: quote.isFx,
    });

  const groups = [
    {
      id: 'rails',
      label: null,
      // Speed first, rail name in the detail. Choosing a delivery option is a choice
      // about WHEN the money lands; which rail carries it is the consequence, and a
      // sender who doesn't know RTP from ACH can still read "Instant" against
      // "2–3 business days". The collapsed trigger keeps the rail name up front, since
      // by then the choice is made and the rail is what identifies it.
      items: rails.map((d) => ({
        id: d.id,
        primary: d.eta,
        secondary: railDetail(d, covers(d)),
        leading: <IconTile name={d.icon} logo={d.logo} />,
        badge: railBadge(d, lastUsedRailId, recommendedRailId),
      })),
    },
  ];

  return (
    <GroupedDropdown
      label="Delivery"
      value={rail ? { id: rail.id } : null}
      groups={groups}
      // Closed and inert while the rails are being worked out: the list on screen is the
      // one for the OLD currency, and letting the sender pick from it would hand them a
      // rail that's about to be taken away.
      disabled={!method || loading}
      onSelect={(item) => onSelect(item.id)}
      // The options come from the destination, so the destination is the dependency to
      // name — "this method" pointed at the control the message sits inside.
      emptyMessage="No delivery options for this destination"
      renderTrigger={(_, open, { interactive }) =>
        loading ? (
          // The rail is the thing in question, so the row says what's happening instead of
          // naming a rail that may not survive the answer.
          <SelectRow
            variant="field"
            leading={
              <span className="flex h-8 w-8 shrink-0 items-center justify-center text-sail-label-large">
                <Spinner />
              </span>
            }
            primary="Checking delivery options"
            secondary="Working out which rails can pay in this currency"
          />
        ) : (
          <SelectRow
            variant="field"
            active={open}
            leading={
              rail ? <IconTile name={rail.icon} logo={rail.logo} /> : null
            }
            // Speed first, same as the rows in the menu: the trigger used to lead with the rail
            // name, so the field and the list it opens disagreed about what the choice was
            // about. The choice is when the money lands.
            primary={rail ? rail.eta : 'Select a delivery method'}
            secondary={rail ? railDetail(rail, covers(rail)) : null}
            badge={
              rail ? railBadge(rail, lastUsedRailId, recommendedRailId) : null
            }
            trailing={interactive ? <Chevron open={open} /> : null}
          />
        )
      }
    />
  );
}

/**
 * Right-hand badge on a delivery rail.
 *
 * One tag per row, and never two on the same row: the rail you last paid this
 * destination over takes "Last used", and "Recommended" is left for the advice when the
 * advice differs. If the two agree, the row wears "Last used" alone — stacking both
 * says one thing twice. A destination with no history puts "Recommended" back on the
 * advised rail, which is the only tag that state has.
 *
 * Green stays with "Recommended" (429:222803), where it flags the rail the payout will
 * take. "Last used" is neutral: it reports history rather than advising.
 */
export function railBadge(rail, lastUsedRailId, recommendedRailId) {
  if (rail.id === lastUsedRailId)
    return <Badge variant="default">Last used</Badge>;
  if (rail.id === recommendedRailId)
    return <Badge variant="success">Recommended</Badge>;
  return null;
}

/** The menu row's detail: "RTP · Included", "ACH · $0.50", "SWIFT · $25.00". */
function railDetail(rail, included) {
  return `${rail.label} · ${feeText(rail, included)}`;
}

/**
 * `included` is the monthly allowance covering this rail's fee — the word replaces the
 * amount, because "Free" would claim the rail never charges and "$0.00" would hide that
 * the allowance runs out. A rail that's free outright says "Free".
 */
function feeText(rail, included) {
  if (included && rail.allowanceEligible) return 'Included';
  const fee = railFee(rail);
  return fee ? formatMoney(fee) : 'Free';
}

/** A rail's mark: its own artwork where it has some, otherwise a glyph on a tile. */
export function IconTile({ name, logo }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt=""
        className="block h-8 w-8 shrink-0 rounded-control object-contain"
      />
    );
  }
  // A rail whose glyph isn't in SailIcons draws it at the tile's full 32px, in the
  // frame's own coordinates — see RailGlyphs.
  if (RAIL_GLYPHS[name]) {
    return (
      <span className="block h-8 w-8 shrink-0 rounded-control bg-panel">
        <RailGlyph name={name} className="text-ink-muted" />
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-panel">
      <Icon name={name} size="small" className="text-ink-muted" />
    </span>
  );
}

function Chevron({ open }) {
  return <SelectChevron className="text-ink-muted" />;
}
