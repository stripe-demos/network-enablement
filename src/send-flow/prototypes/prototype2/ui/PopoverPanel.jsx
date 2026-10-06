import React, { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const GAP = 6;
const VIEWPORT_MARGIN = 16;
/** Below this much room underneath, flip the panel above the trigger. */
const FLIP_THRESHOLD = 220;

/**
 * A popover panel rendered in a portal at body level.
 *
 * This exists because the sheet's content area scrolls (`overflow-y-auto`), and
 * a scroll container CLIPS absolutely-positioned descendants — so an in-flow
 * menu got cut off at the bottom of the sheet no matter how high its z-index
 * was. Portalling escapes the clip; the fixed position is measured from the
 * trigger and re-measured on scroll and resize.
 *
 * Flips above the trigger when there isn't room below.
 */
export default function PopoverPanel({
  anchorRef,
  panelRef,
  animation = '',
  className = '',
  /**
   * 'anchor'   match the trigger's width
   * 'content'  at least the trigger's width, growing to fit the rows — an account menu
   *            carries a name AND a balance, and at the trigger's width both truncated
   * number     a fixed width (the date picker's 312px panel, 507:83727)
   */
  width = 'anchor',
  /**
   * Which edge the panel lines up with.
   *
   * 'start'  the anchor's left edge (a field's menu opens under the field)
   * 'end'    the anchor's right edge — for a control that sits at the right of its row, where a
   *          left-aligned panel hangs off into the middle of the field
   *
   * Only meaningful with a fixed width: 'content' isn't measurable until it renders.
   */
  align = 'start',
  radius = 'rounded-card',
  children,
}) {
  const [style, setStyle] = useState(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const below = window.innerHeight - r.bottom;
      const above = r.top;
      const flip = below < FLIP_THRESHOLD && above > below;

      // `max-content` needs a floor and a ceiling: the floor keeps a narrow trigger's menu
      // from being narrower than the trigger, and the ceiling keeps a long row from running
      // off the sheet.
      const sizing =
        width === 'content'
          ? {
              width: 'max-content',
              minWidth: r.width,
              maxWidth: Math.min(
                560,
                window.innerWidth - r.left - VIEWPORT_MARGIN,
              ),
            }
          : { width: width === 'anchor' ? r.width : width };

      const left =
        align === 'end' && typeof width === 'number' ? r.right - width : r.left;

      setStyle(
        flip
          ? {
              position: 'fixed',
              left,
              bottom: window.innerHeight - r.top + GAP,
              ...sizing,
              maxHeight: Math.max(120, above - GAP - VIEWPORT_MARGIN),
            }
          : {
              position: 'fixed',
              left,
              top: r.bottom + GAP,
              ...sizing,
              maxHeight: Math.max(120, below - GAP - VIEWPORT_MARGIN),
            },
      );
    };

    measure();
    window.addEventListener('resize', measure);
    // capture phase so nested scroll containers are caught too
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [anchorRef, width, align]);

  if (!style) return null;

  return createPortal(
    <div
      ref={panelRef}
      style={style}
      // z-[200] clears the sheet (z-50) and the exit dialog (z-60).
      className={`${animation} z-[200] overflow-y-auto ${radius} bg-canvas shadow-popover ${className}`}
    >
      {children}
    </div>,
    document.body,
  );
}
