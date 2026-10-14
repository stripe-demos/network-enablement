import React from 'react';
import MethodMark from './MethodMark';

/**
 * The transfer, read as a ledger: what leaves the account at the top, what lands at
 * the bottom, and the arithmetic that connects them in between.
 *
 * Replaces Review's three-card stack, where the amount, the parties and the fees were
 * each in their own box and the sender had to carry a figure from one to the next. One
 * block instead — From, the deductions, To — with the dotted rail and operator badges
 * from Payout details, so the same arithmetic looks the same on both screens.
 *
 * Always reads downward, whichever amount the sender typed: the debit is the largest
 * figure on the screen and every row below it takes something away. That direction is
 * a property of money moving, not of which field was anchored, so the operators don't
 * flip here the way they do on Payout details.
 *
 * No total row. The two figures ARE the totals — a third would restate one of them.
 *
 * The lead column is 28px wide (the mark's own width) and the badges centre in it, so
 * the rail runs straight through the middle of both marks.
 */
export default function TransferSummary({ from, to, children }) {
  return (
    <div>
      <Party label="From" party={from} />

      {/* The deductions are the caller's: Review renders the same FeeLadder the input screen
          does, so the breakdown a sender opened there is the one they confirm here — with the
          same collapsible Fees row and the same operators. The ladder brings its own dotted
          rail, aligned to these marks by its 'ledger' variant. */}
      {children}

      <Party label="To" party={to} className={children ? '' : 'mt-5'} />
    </div>
  );
}

function Party({ label, party, className = '' }) {
  return (
    <div className={className}>
      <p className="text-sail-label-small mb-1.5 text-ink-faint">{label}</p>
      <div className="flex items-center gap-3">
        <MethodMark
          logo={party.logo}
          country={party.country}
          group={party.group}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sail-label-large-emphasized truncate text-ink">
            {party.name}
          </p>
          {party.detail && (
            <p className="text-sail-label-medium truncate text-ink-faint">
              {party.detail}
            </p>
          )}
        </div>
        <SignedAmount
          sign={party.sign}
          symbol={party.symbol}
          digits={party.digits}
        />
      </div>
    </div>
  );
}

/**
 * The sign and the currency symbol in the regular weight, the digits in bold: the
 * figure is what the sender is checking, and "−" and "$" are grammar around it.
 */
function SignedAmount({ sign, symbol, digits }) {
  return (
    <span className="flex shrink-0 items-baseline gap-1">
      <span className="text-sail-heading-medium-subdued text-ink-muted">
        {sign}
      </span>
      {symbol && (
        <span className="text-sail-heading-medium-subdued text-ink-muted">
          {symbol}
        </span>
      )}
      <span className="text-sail-heading-medium tabular-nums text-ink">
        {digits}
      </span>
    </span>
  );
}
