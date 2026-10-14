import React from 'react';

/**
 * The fee ladder's groups — the arithmetic between two amounts, built once for every screen
 * that shows it.
 *
 * Payout details and Review used to build their own: the input screen grouped the charges
 * under a collapsible "Fees" row, and Review listed them flat. Same numbers, two shapes, and
 * two places to keep the operators right. This is the one shape, so the breakdown a sender
 * opens on the input screen is the breakdown they confirm on Review.
 *
 * @param rows            pre-formatted fee rows (flow/quote.feeRows)
 * @param format          money formatter for the source currency
 */
export function ladderGroups({ q, rows, format }) {
  if (rows.length === 0 && !q.isFx) return [];

  const groups = [
    {
      id: 'fees',
      /**
       * Always "−", whichever side the sender typed.
       *
       * It used to flip to "+" when they fixed the recipient's amount, on the reasoning that
       * the fees are being added to reach the debit. But the figure at the TOP of this ladder
       * is the debit in both directions — the quote solves for it — so the column always
       * reads downward: what leaves, less the charges, is what converts. "+ Fees" under a
       * total that already includes them said the opposite.
       */
      op: '−',
      // One line by default, itemised on demand: the sum is the number being weighed, and
      // three charges stacked between the two amounts pushed the recipient's figure out of
      // the first glance.
      summary: {
        label: 'Fees',
        // "Included" rather than a zero: when the allowance is the only reason this comes to
        // nothing, the summary has to say so, or the row reads as a fee that doesn't exist.
        value:
          q.included && q.totalFees === 0 ? 'Included' : format(q.totalFees),
      },
      rows: rows.map((r) => ({
        ...r,
        // An included row shows the word, not the amount — the amount is zero, and "$0.00"
        // hides that the allowance runs out.
        value: r.display ?? format(r.value),
      })),
    },
  ];

  if (q.isFx) {
    groups.push({
      id: 'convert',
      // A result, not a term: it's what survives the fees above it.
      op: '=',
      // "Amount we'll convert", not "Amount to convert": it names who does the converting,
      // which is the question a sender has at the point money changes currency.
      rows: [
        {
          key: 'convert',
          label: "Amount we'll convert",
          value: format(q.sendAmount),
        },
      ],
    });
    groups.push({
      id: 'rate',
      op: '×',
      rows: [
        {
          key: 'rate',
          label: 'Exchange rate',
          /**
           * The bare rate, and no currency-pair chip.
           *
           * "$1.00 = £0.7336" restated a pair the two amount fields already name, in a row
           * whose own operator (×) says what the number does to the figure above it. What was
           * left was 30 characters to express one multiplier.
           */
          value: q.rate.toFixed(4),
        },
      ],
    });
  }

  // No total row at either end. Whichever side the sender didn't type is showing in its own
  // field — a closing row would restate a number 40px away.
  return groups;
}
