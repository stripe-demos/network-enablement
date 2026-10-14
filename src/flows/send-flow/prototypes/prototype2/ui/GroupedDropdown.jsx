import React from 'react';
import { Icon } from '../../../icons/SailIcons';
import SelectRow from './SelectRow';
import usePopover from './usePopover';
import PopoverPanel from './PopoverPanel';

/**
 * One grouped popover serving every "pick a thing" control in the flow:
 * the payout-method picker (Cards / Bank accounts / Add payout method,
 * 429:221632), the Delivery picker, and the Pay-from account picker
 * (Primary / Financial / Operational, 429:224264).
 *
 * `groups` is an array of { id, label, items }, each item shaped for SelectRow.
 * `footer` renders a pinned action below the list ("+ Add payout method"), and a group can
 * carry its own `action` — the external-account picker adds a bank and a wallet by different
 * routes, so one shared action at the bottom couldn't say which it meant.
 *
 * With a single option and no footer action there is nothing to choose, so the
 * trigger stops being a control: no chevron, no menu, no focus stop. Opening a
 * popover to show the row already on screen is a dead end — and it reads as one,
 * since the panel is an exact copy of the trigger above it.
 *
 * `renderTrigger(value, open, { interactive })` — the third argument is how the
 * caller knows whether to draw the chevron.
 */
export default function GroupedDropdown({
  label,
  value,
  groups,
  onSelect,
  footer,
  renderTrigger,
  emptyMessage = 'Nothing available',
  disabled = false,
  /** Lets the caller stretch the control into the cell it occupies. */
  className = '',
  /**
   * Hang the panel off a bigger box than the trigger.
   *
   * The account picker occupies the left half of a split field, and a menu the width of that
   * half squeezed a name, a balance and a currency into 272px. Anchoring to the whole field
   * gives the rows the room the field already has, and keeps the panel's left edge on the
   * field's — which is where the eye expects it.
   */
  panelAnchorRef = null,
}) {
  const { ref, panelRef, open, expanded, animation, toggle, close } =
    usePopover();

  const hasItems = groups.some((g) => g.items.length > 0);
  const itemCount = groups.reduce((n, g) => n + g.items.length, 0);
  // A footer keeps it interactive even at one item: "Add payout method" is a
  // second thing you can do, it just isn't a row.
  const interactive = !disabled && (itemCount > 1 || Boolean(footer));

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && (
        <p className="text-sail-label-small-emphasized mb-1.5 text-ink">
          {label}
        </p>
      )}

      {/* Both handlers ignore events that originated from a nested control. The
          amount field no longer lives inside this trigger — each of the three targets
          in a split field owns its own area now — but a trigger can still carry a
          button or input, and a click on one of those isn't a request to open the
          menu. */}
      <div
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : -1}
        aria-haspopup={interactive ? 'listbox' : undefined}
        aria-expanded={interactive ? expanded : undefined}
        onClick={(e) => {
          if (!interactive) return;
          if (
            e.target !== e.currentTarget &&
            e.target.closest('input, textarea, button, select')
          ) {
            return;
          }
          toggle();
        }}
        onKeyDown={(e) => {
          if (!interactive) return;
          if (e.target !== e.currentTarget) return; // came from a nested control
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        }}
        // Fills the wrapper in both axes: the hit area is the cell the control was
        // given, not the width its text happens to occupy.
        className={`h-full w-full ${
          disabled
            ? 'pointer-events-none opacity-50'
            : interactive
              ? 'cursor-pointer'
              : ''
        }`}
      >
        {renderTrigger(value, open, { interactive })}
      </div>

      {open && interactive && (
        <PopoverPanel
          anchorRef={panelAnchorRef ?? ref}
          panelRef={panelRef}
          animation={animation}
          // Matches whatever it's anchored to: the trigger by default, or the whole field
          // where the caller gave it one — see `panelAnchorRef`. `content` isn't used here
          // because the rows truncate rather than push, so there is no content width to
          // measure.
          className="py-1.5"
        >
          <div>
            {!hasItems && (
              <p className="text-sail-label-medium px-3 py-3 text-ink-faint">
                {emptyMessage}
              </p>
            )}

            {groups.map((group) =>
              group.items.length ? (
                <div key={group.id} className="px-1.5">
                  {(group.label || group.action) && (
                    // Full-strength ink and the emphasized weight: these head the
                    // sections a reader scans by, so they were the one thing on the
                    // panel too faint to scan.
                    <div className="flex items-center justify-between gap-3 px-1.5 pb-1 pt-1.5">
                      <p className="text-sail-label-small-emphasized text-ink">
                        {group.label}
                      </p>
                      {group.action && (
                        <button
                          type="button"
                          onClick={(e) => {
                            // The header isn't a row, so a click here must not read as a pick.
                            e.stopPropagation();
                            group.action.onClick();
                            close();
                          }}
                          className="text-sail-label-small-emphasized cursor-pointer text-action-link underline-offset-2 hover:underline"
                        >
                          {group.action.label}
                        </button>
                      )}
                    </div>
                  )}
                  {group.items.map((item) => (
                    <SelectRow
                      key={item.id}
                      // No fill on the row that's already chosen: the trigger above the panel
                      // is showing it, and a grey row inside a menu reads as hover or as
                      // disabled rather than as "this one". Hover still highlights.
                      selected={false}
                      onClick={() => {
                        onSelect(item);
                        close();
                      }}
                      leading={item.leading}
                      // Set by the pickers whose rows use a MethodMark: the flag badge hangs
                      // outside the mark's box and would otherwise sit in the text's gap.
                      leadingOverhang={Boolean(item.leadingOverhang)}
                      primary={item.primary}
                      secondary={item.secondary}
                      badge={item.badge}
                      trailing={item.trailing}
                    />
                  ))}
                </div>
              ) : null,
            )}
          </div>

          {/* A lighter rule than the hairline: it separates the action from the list rather
              than boxing it, and at hairline weight it read as the panel's own edge. */}
          {footer && (
            <div className="mt-1 border-t border-panel px-1.5 pt-1.5">
              <button
                type="button"
                onClick={() => {
                  footer.onClick();
                  close();
                }}
                // Regular weight, not emphasized: the blue already marks it as the
                // action, and bold on top of that outweighed the rows it sits under.
                className="text-sail-label-medium flex w-full cursor-pointer items-center gap-2 rounded-card px-3 py-2.5 text-left text-action-link transition-colors hover:bg-panel"
              >
                <Icon name="add" size="xsmall" fill="currentColor" />
                {footer.label}
              </button>
            </div>
          )}
        </PopoverPanel>
      )}
    </div>
  );
}
