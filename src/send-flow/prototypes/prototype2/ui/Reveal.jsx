import React from 'react';

/**
 * Animated disclosure for a field revealed by a checkbox or by a delivery-rail
 * choice: fades in while sliding down, and out while sliding up.
 *
 * Uses the grid-template-rows 0fr→1fr technique so the height animates without
 * measuring anything in JS, and — because the wrapper is always mounted — the
 * exit animation runs for free with no unmount timer to keep in sync.
 *
 * The collapsed content stays in the DOM, so it's marked `inert` and hidden from
 * assistive tech; otherwise a hidden input would still take tab focus.
 */
export default function Reveal({
  show,
  children,
  className = '',
  gap = '',
  bleed = 6,
}) {
  return (
    <div
      inert={!show}
      aria-hidden={!show}
      // A collapsed Reveal must take up no room at all. Tailwind v4 implements
      // `space-y-*` as margin-block-end on every child but the last, and that
      // external margin survives the row collapsing to 0fr — so each hidden
      // Reveal was still costing a full gap. Margin is therefore dropped here,
      // and any spacing the Reveal genuinely owns is passed as `gap` padding
      // *inside* the animated area, where it collapses along with the height.
      //
      // Which side to pass depends on position, so there's no useful default:
      //   mid-stack  -> `pb-*`, replacing the margin removed below it
      //   last child -> nothing; the previous sibling's margin does the work
      //   own <div>  -> `pt-*`, since no sibling margin exists at all
      style={{ margin: 0 }}
      // Tailwind v4 emits translate-y via the `translate` property, not `transform`,
      // so `translate` must be in the transition list or the slide won't animate.
      className={`grid transition-[grid-template-rows,opacity,translate] duration-200 ease-out motion-reduce:transition-none ${
        show
          ? 'grid-rows-[1fr] translate-y-0 opacity-100'
          : 'grid-rows-[0fr] -translate-y-1 opacity-0'
      }`}
    >
      {/* Inputs draw their border as an outset box-shadow ring which lives outside
          the element's box, so a flush `overflow-hidden` shaves it off. The clip
          box is grown on every side and pulled back by an equal negative margin:
          same position, same collapsed height (the padding sits inside the grid
          row, so it collapses with it), but the ring now has room.

          6px, not the 2px this used to be: --shadow-form-focus is a 5px outset
          (1px hairline + the 4px halo), so 2px of slack clipped 3px off the bottom
          of every focused field inside a Reveal. Keep this ≥ the widest ring. */}
      {/* `bleed` widens the clip box for content that deliberately sits outside its own box:
          the fee ladder's dotted rail starts above the row it hangs from, and at the default
          6px the first dots were being shaved off. */}
      <div
        style={{ margin: -bleed, padding: bleed }}
        className="overflow-hidden"
      >
        <div className={`${gap} ${className}`}>{children}</div>
      </div>
    </div>
  );
}
