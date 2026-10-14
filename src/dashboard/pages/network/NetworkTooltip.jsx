// Dark Sail-style tooltip for the network onboarding dialog. The dialog sits at
// z-index 10020, above @dashboard/ui's Tooltip (9999), so this renders its own:
// portalled to <body> at 10030 with position: fixed, so the dialog's scroll
// container can't clip it, and re-placed above the trigger on scroll and resize.
//
// The trigger is a focusable span that opens the tooltip on hover and focus and
// is described by it (aria-describedby). Escape closes the tooltip and is
// prevented, so the dialog (which ignores prevented Escapes) stays open.
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { color } from '@dashboard/ui'

const TOOLTIP_Z_INDEX = 10030 // above the onboarding dialog (10020)
const ARROW = 5

/**
 * `content` is the tooltip body. `style` styles the trigger span. `updateKey`
 * re-places an open tooltip when it changes (for triggers whose size changes).
 * `onClick` runs on trigger clicks (e.g. to keep a surrounding <label> from
 * toggling).
 */
export default function NetworkTooltip({ content, children, style, textAlign = 'left', updateKey, onClick }) {
  const tooltipId = useId()
  const triggerRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)

  const place = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect()
    if (r) setPos({ top: r.top - ARROW - 4, left: r.left + r.width / 2 })
  }, [])

  useLayoutEffect(() => {
    if (open) place()
  }, [open, updateKey, place])
  useEffect(() => {
    if (!open) return undefined
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open, place])

  const onKeyDown = e => {
    // Dismiss the tooltip without closing the dialog (it ignores prevented Escapes).
    if (e.key === 'Escape' && open) {
      e.preventDefault()
      setOpen(false)
    }
  }

  return (
    <>
      <span
        ref={triggerRef}
        tabIndex={0}
        aria-describedby={tooltipId}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        onClick={onClick}
        style={{ cursor: 'default', ...style }}
      >
        {children}
      </span>
      {createPortal(
        <div
          id={tooltipId}
          role="tooltip"
          // Portalled outside the dialog, so it needs its own marker to stay
          // real on pages shown as wireframes (e.g. Enablement).
          data-wireframe-show=""
          style={{
            display: open && pos ? 'block' : 'none',
            position: 'fixed',
            top: pos?.top ?? 0,
            left: pos?.left ?? 0,
            transform: 'translate(-50%, -100%)',
            zIndex: TOOLTIP_Z_INDEX,
            maxWidth: 260,
            padding: '6px 10px',
            borderRadius: 6,
            background: color.tooltip,
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 400,
            lineHeight: '16px',
            letterSpacing: -0.06,
            textAlign,
            pointerEvents: 'none',
            boxSizing: 'border-box',
            width: 'max-content',
          }}
        >
          {content}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: `${ARROW}px solid transparent`,
              borderRight: `${ARROW}px solid transparent`,
              borderTop: `${ARROW}px solid ${color.tooltip}`,
            }}
          />
        </div>,
        document.body,
      )}
    </>
  )
}

const VERIFIED_CONTENT = (
  <>
    <span style={{ display: 'block', fontWeight: 600 }}>Verified on Stripe</span>
    <span style={{ display: 'block' }}>This business can onboard instantly once it accepts your invitation.</span>
  </>
)

// Keeps a click on the trigger from toggling a surrounding <label> or row.
const isolateClick = e => {
  e.preventDefault()
  e.stopPropagation()
}

/**
 * A business's @handle pill as a tooltip trigger explaining the verified badge.
 * `style` is the pill's own style; children are the handle and shield.
 */
export function VerifiedHandleTooltip({ style, children }) {
  return (
    <NetworkTooltip content={VERIFIED_CONTENT} style={style} onClick={isolateClick}>
      {children}
    </NetworkTooltip>
  )
}
