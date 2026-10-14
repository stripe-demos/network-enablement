import React, { forwardRef } from 'react';

/**
 * The two halves of an amount row: who the money moves between, and how much.
 *
 * A panel-filled surround holding two white boxes. The surround is what groups them as one
 * row; the white boxes are what say each half is its own control — a picker and a number —
 * and that separation is what lets the amount show focus on its own, with a purple outline
 * around the half being typed into rather than a ring inside a shared box.
 */
// forwardRef so a control inside can measure the whole field — the account menu hangs off
// it rather than off the cell it sits in.
const SplitField = forwardRef(function SplitField(
  {
    left,
    right,
    /**
     * The account cell's width — 314px, per the frame.
     *
     * A maximum, not a fixed width, and the amount box is content-sized against a 192px
     * floor. Fixed one way or the other, something had to be cut: a fixed left cell cut
     * long amounts mid-digit, and a fixed amount box truncated "Primary account" to fit a
     * balance beside it. So the amount box takes what its figure needs and the account cell
     * takes the rest, which is the frame's split for every amount a sender actually types.
     */
    leftWidth = 314,
    /** The amount box's floor — the frame's 192px, which holds "− $ 100.00" with room. */
    rightMin = 192,
    /**
     * Hand the left cell's padding to whatever is inside it.
     *
     * A dropdown filling that cell draws its own focus ring and its open-state fill, and both
     * were landing inset from the cell's edges — a rounded box floating inside a bigger box,
     * with a strip along the border that looked clickable and wasn't.
     */
    leftPadded = true,
    /** The amount box, so a control inside it can hang a panel off the whole box. */
    rightRef = null,
  },
  ref,
) {
  return (
    // 68px fixed: Figma draws the border inside the frame, so letting content set the height
    // overshoots by the 2px of border and leaves the two fields disagreeing by a pixel or two.
    // p-0.5 + gap-0.5 — the panel reads as a 2px border around and between the white boxes,
    // which is the weight it has in the mock; at 4px it read as a tray they sat in.
    <div
      ref={ref}
      className="flex h-17 items-stretch gap-0.5 rounded-card bg-panel p-0.5"
    >
      {/* pl-3, matching every other field in the flow: the mark's left edge lands
          12px inside the border rather than the 14px an 8px pad plus a wider-than-
          the-mark slot was producing, which read as a dent beside the fields above
          and below. */}
      <div
        style={{ maxWidth: leftWidth }}
        className={`flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-control bg-canvas ${
          leftPadded ? 'py-2 pl-3 pr-3' : ''
        }`}
      >
        {left}
      </div>
      {/* `focus-within` rather than a prop: the box containing the caret is the one that should
          show it, and only this box can know. A solid brand outline, no halo — the two boxes sit
          2px apart, and a soft ring would close the gap between them. */}
      {/* `focus-within` rather than a prop: the box holding the caret is the one that should
          show it, and only this box can know. A 1.5px brand outline drawn as a shadow, so it
          doesn't move the content the way a border change would. */}
      <div
        ref={rightRef}
        style={{ minWidth: rightMin }}
        className="flex shrink-0 grow-0 items-center justify-between gap-2 rounded-control bg-canvas px-3 py-2 transition-shadow focus-within:shadow-[0_0_0_1.5px_var(--color-action)]"
      >
        {right}
      </div>
    </div>
  );
});

export default SplitField;
