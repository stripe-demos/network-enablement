// Live count of businesses on the Stripe network, for the Welcome step heading.
// Simulated: starts at a fixed number and adds 1 at random 0.8–2.5s intervals.
// Ticks roll like an odometer (after the Framer "Counter FX" component): each
// changed digit is a wheel whose strip scrolls up from the old digit to the new
// one, with faded top and bottom edges while it moves. Unchanged digits stay
// still. With prefers-reduced-motion the number just updates.
//
// The number is focusable and shows a dark Sail-style tooltip on hover/focus.
// The onboarding dialog sits at z-index 10020, above @dashboard/ui's Tooltip
// (9999), so this renders its own tooltip, portalled to <body> at 10030 so the
// dialog's scroll container can't clip it.
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { color } from '@dashboard/ui'

const START = 1843772
const MIN_DELAY = 800
const MAX_DELAY = 2500
const TOOLTIP_Z_INDEX = 10030 // above the onboarding dialog (10020)
const TOOLTIP_TEXT = 'Businesses on the Stripe network right now. This number updates as new businesses join.'
const ARROW = 5

const ROLL_MS = 600
const ROLL_EASE = 'cubic-bezier(0, 0, 0.2, 1)' // Counter FX "smooth"
const CELL = '1.4em' // matches the heading's 28px line height at 20px
const EDGE_FADE = 'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)'

function randomDelay() {
  return MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY)
}

// Returns the current count and the previous one, so changed digits can animate.
function useLiveCount() {
  const [state, setState] = useState({ count: START, prev: START })
  useEffect(() => {
    let timer
    const tick = () => {
      timer = setTimeout(() => {
        setState(s => ({ count: s.count + 1, prev: s.count }))
        tick()
      }, randomDelay())
    }
    tick()
    return () => clearTimeout(timer)
  }, [])
  return state
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Digits from `from` up to `to`, wrapping 9 to 0 (counting up only).
function rollSequence(from, to) {
  const seq = [from]
  let d = from
  while (d !== to) {
    d = (d + 1) % 10
    seq.push(d)
  }
  return seq
}

// One wheel: renders the strip at the old digit, then on the next frame slides
// it up to the new one.
function DigitWheel({ from, to }) {
  const moving = from !== to && !reducedMotion()
  const seq = moving ? rollSequence(from, to) : [to]
  const [rolled, setRolled] = useState(!moving)
  useLayoutEffect(() => {
    if (!moving) return undefined
    const frame = requestAnimationFrame(() => setRolled(true))
    return () => cancelAnimationFrame(frame)
  }, [moving])
  const [settled, setSettled] = useState(!moving)
  return (
    <span
      style={{
        display: 'inline-block',
        height: CELL,
        overflow: 'hidden',
        verticalAlign: 'bottom',
        maskImage: settled ? undefined : EDGE_FADE,
        WebkitMaskImage: settled ? undefined : EDGE_FADE,
      }}
    >
      <span
        onTransitionEnd={() => setSettled(true)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          transform: `translateY(calc(-${rolled ? seq.length - 1 : 0} * ${CELL}))`,
          transition: rolled && moving ? `transform ${ROLL_MS}ms ${ROLL_EASE}` : 'none',
        }}
      >
        {seq.map((d, i) => (
          <span key={i} style={{ height: CELL, lineHeight: CELL }}>{d}</span>
        ))}
      </span>
    </span>
  )
}

// Splits the formatted number into characters keyed by position from the right.
// A digit that changed remounts as a wheel rolling from its previous value.
function Digits({ value, prev }) {
  const chars = value.toLocaleString('en-US').split('')
  const prevChars = prev.toLocaleString('en-US').split('')
  return chars.map((ch, i) => {
    const fromRight = chars.length - i
    const before = prevChars[prevChars.length - fromRight]
    if (ch === ',') return <span key={`${fromRight}-sep`}>,</span>
    const to = Number(ch)
    const from = before === undefined || before === ',' ? to : Number(before)
    // Changed digits get a fresh key per tick so the roll replays; still ones keep theirs.
    return <DigitWheel key={from !== to ? `${fromRight}-roll-${value}` : `${fromRight}-${to}`} from={from} to={to} />
  })
}

export default function LiveBusinessCount() {
  const { count, prev } = useLiveCount()
  const tooltipId = useId()
  const triggerRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)

  const place = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect()
    if (r) setPos({ top: r.top - ARROW - 4, left: r.left + r.width / 2 })
  }, [])

  // Keep the tooltip attached while open: the number's width can change on a tick,
  // and the dialog content scrolls.
  useLayoutEffect(() => {
    if (open) place()
  }, [open, count, place])
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
        style={{
          fontVariantNumeric: 'tabular-nums',
          cursor: 'default',
          borderRadius: 4,
          whiteSpace: 'nowrap',
        }}
      >
        <Digits value={count} prev={prev} />
      </span>
      {createPortal(
        <div
          id={tooltipId}
          role="tooltip"
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
            textAlign: 'center',
            pointerEvents: 'none',
            boxSizing: 'border-box',
            width: 'max-content',
          }}
        >
          {TOOLTIP_TEXT}
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
