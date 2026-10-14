import React from 'react';
import { Icon } from '../../../icons/SailIcons';
import { currencySymbol } from '../flow/selectors';
import FlagIcon from './FlagIcon';
import usePopover from './usePopover';
import PopoverPanel from './PopoverPanel';

/**
 * "USD ⌄" beside an amount — which currency that amount is denominated in.
 *
 * Sits to the right of the number rather than in the row's subtext, where the code
 * was a fact about the account instead of a choice about the payout. Both halves of
 * the pair carry one: the sender picks what leaves their account and what lands with
 * the recipient, and the two together are what makes a payout cross-currency.
 *
 * With one option there is nothing to choose, so the trigger drops its chevron and
 * stops being a control — the same rule GroupedDropdown follows.
 */
/**
 * The country whose flag stands for a currency.
 *
 * A flag says "this is the currency of somewhere" faster than three letters do, and it's what
 * every other row in the flow uses to place an account. The euro takes the European flag; the
 * stablecoin takes none, because it isn't a country's money.
 */
/**
 * The currency's name, under its code.
 *
 * Three letters identify a currency to anyone who already knows it; the name is for everyone
 * else, and it's the difference between picking CHF deliberately and picking it by accident.
 */
const NAMES = {
  USD: 'United States Dollar',
  GBP: 'Great British Pound',
  EUR: 'Euro',
  JPY: 'Japanese Yen',
  CAD: 'Canadian Dollar',
  CHF: 'Swiss Franc',
  AUD: 'Australian Dollar',
  INR: 'Indian Rupee',
  BRL: 'Brazilian Real',
  AED: 'UAE Dirham',
  SGD: 'Singapore Dollar',
  USDC: 'USD Coin',
};

const FLAG_FOR = {
  USD: 'US',
  GBP: 'GB',
  EUR: 'EU',
  CHF: 'CH',
  JPY: 'JP',
  INR: 'IN',
  BRL: 'BR',
  CAD: 'CA',
  AUD: 'AU',
  SGD: 'SG',
  // The stablecoin's own mark, which sits in the flag slot so the rows keep one left edge.
  USDC: 'USDC',
};

export default function CurrencySelect({
  value,
  options,
  onSelect,
  ariaLabel,
  menuLabel,
  /**
   * Hang the panel off a bigger box than the chip.
   *
   * The chip sits at the LEFT of the amount box, so a panel anchored to it opens under the
   * chip and leaves the rest of the box uncovered; anchored to the box and right-aligned, the
   * menu lines up with the field it belongs to.
   */
  panelAnchorRef = null,
}) {
  const { ref, panelRef, open, expanded, animation, toggle, close } =
    usePopover();
  const interactive = options.length > 1;

  return (
    <span ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={interactive ? toggle : undefined}
        aria-label={ariaLabel}
        aria-haspopup={interactive ? 'listbox' : undefined}
        aria-expanded={interactive ? expanded : undefined}
        // Not disabled when there's one option: a disabled control implies the
        // choice exists but is barred, where in fact there is only one currency.
        //
        // 12px on a panel chip, per the design. Two things follow from the chip: the code
        // stops competing with the 20px number beside it, and it reads as its own control
        // rather than as a suffix on the amount — which is what it is, since a sender can
        // set the currency before deciding the figure.
        //
        // Full-strength ink, and one tone always — whether or not an amount has been typed.
        // The chip already sets the code apart from the figure, so the colour no longer has
        // to; muted on top of the fill made a live control look like a note about one.
        className={`text-sail-label-small flex items-center gap-1 rounded-control bg-panel px-2 py-1 text-ink ${
          interactive ? 'cursor-pointer' : ''
        }`}
      >
        {value}
        {/* A single chevron, not the double arrow the other pickers use: this one hangs off
            the amount rather than being a field of its own, and the paired glyph read as a
            second control sitting inside the first. */}
        {interactive && (
          <Icon
            name="chevronDown"
            size="xxsmall"
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {open && interactive && (
        <PopoverPanel
          anchorRef={panelAnchorRef ?? ref}
          panelRef={panelRef}
          animation={animation}
          // The width of the input it belongs to, not of the chip that opens it: every menu in
          // the flow matches its own field, which is what makes a menu read as that field
          // opening rather than as something floating over it.
          width="anchor"
          className="py-1.5"
        >
          {/* Says which side of the payout is being set. The chip is 57px of context at best,
              and the two menus on this screen are otherwise identical — "You pay in" against
              "Recipient receives in" is the difference. */}
          {menuLabel && (
            <p className="text-sail-label-small-emphasized px-3 pb-1 pt-1.5 text-ink">
              {menuLabel}
            </p>
          )}

          <div className="px-1.5">
            {options.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  onSelect(code);
                  close();
                }}
                // Flag, symbol, code — in that order, all in full-strength ink. The symbol is
                // part of the option rather than a note about it: it's what the sender will see
                // in front of every figure once they pick this.
                className={`text-sail-label-medium-emphasized flex w-full cursor-pointer items-center gap-2.5 rounded-card px-3 py-2 text-left text-ink transition-colors hover:bg-panel ${
                  code === value ? 'bg-panel' : ''
                }`}
              >
                <FlagIcon code={FLAG_FOR[code]} />
                <span className="min-w-0">
                  {/* Symbol and code as one token — "$ USD" — rather than two columns: the
                      symbol belongs to the code, and spacing them equally made them read as
                      separate facts. */}
                  <span className="flex items-center gap-1.5">
                    {/* Nothing to show when the symbol IS the code: "CHF CHF" read as a stutter,
                        and the currencies written as their own code are exactly the ones whose
                        symbol adds nothing. */}
                    {currencySymbol(code) && currencySymbol(code) !== code && (
                      <span>{currencySymbol(code)}</span>
                    )}
                    {code}
                  </span>
                  {NAMES[code] && (
                    <span className="text-sail-label-small block truncate text-ink-muted">
                      {NAMES[code]}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </PopoverPanel>
      )}
    </span>
  );
}
