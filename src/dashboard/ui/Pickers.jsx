import { cloneElement, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'
import { CheckCircleIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from './icons'
import { color, ease } from './tokens'
import { DATE_RANGE_PRESETS, addMonths, getPresetRange, isSameDay, startOfDay } from './helpers'

const POPOVER_GAP = 6
const POPOVER_EDGE = 8
const SLIDE_DISTANCE = 8
const SLIDE_DURATION = 200

function prefersReducedMotion() {
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
}

/**
 * Panel anchored to `anchorRef`, portalled to <body>. Opens below the anchor
 * and flips above when there's no room, follows it on scroll and resize, and
 * closes on outside click or Escape. Controlled with `open` / `onClose`.
 *
 * align:  'left' | 'right' edge of the anchor to line up with, or 'center'
 * motion: 'pop' (quick scale-in) | 'slide' (200ms ease-in-out slide down, reversed on close)
 * gap:    px between anchor and panel
 */
export function Popover({ anchorRef, open, onClose, align = 'left', motion = 'pop', gap = POPOVER_GAP, label, role = 'dialog', children, style }) {
  const panelRef = useRef(null)
  const [pos, setPos] = useState(null)
  const [shown, setShown] = useState(open)
  const slide = motion === 'slide'
  const animateExit = slide && !prefersReducedMotion()
  if (open && !shown) setShown(true)
  if (!open && shown && !animateExit) setShown(false)

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!animateExit || open || !shown || !panel) return
    const dy = pos?.above ? SLIDE_DISTANCE : -SLIDE_DISTANCE
    const exit = panel.animate(
      [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateY(${dy}px)` }],
      { duration: SLIDE_DURATION, easing: ease.inOut, fill: 'forwards' },
    )
    exit.onfinish = () => setShown(false)
    return () => exit.cancel()
  }, [animateExit, open, shown, pos?.above])

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const anchor = anchorRef.current?.getBoundingClientRect()
      const panel = panelRef.current
      if (!anchor || !panel) return
      const { clientWidth: vw, clientHeight: vh } = document.documentElement
      // offset sizes ignore the entry animation's scale.
      const w = panel.offsetWidth
      const h = panel.offsetHeight
      const fitsBelow = anchor.bottom + gap + h <= vh - POPOVER_EDGE
      const above = !fitsBelow && anchor.top - gap - h >= POPOVER_EDGE
      const top = above
        ? anchor.top - gap - h
        : Math.max(POPOVER_EDGE, Math.min(anchor.bottom + gap, vh - POPOVER_EDGE - h))
      const x = align === 'right' ? anchor.right - w : align === 'center' ? anchor.left + anchor.width / 2 - w / 2 : anchor.left
      const left = Math.max(POPOVER_EDGE, Math.min(x, vw - POPOVER_EDGE - w))
      setPos((prev) => (prev && prev.top === top && prev.left === left && prev.above === above ? prev : { top, left, above }))
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open, anchorRef, align, gap])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (panelRef.current?.contains(e.target) || anchorRef.current?.contains(e.target)) return
      onClose()
    }
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      onClose()
      const anchor = anchorRef.current
      ;(anchor?.matches('button') ? anchor : anchor?.querySelector('button'))?.focus()
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose, anchorRef])

  if (!shown) return null
  return createPortal(
    <div
      ref={panelRef}
      role={role}
      aria-label={label}
      className={`dui-popover${slide ? ' dui-popover--slide' : ''}${pos?.above ? ' dui-popover--above' : ''}`}
      style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? 'visible' : 'hidden', ...style }}
    >
      {children}
    </div>,
    document.body,
  )
}

/**
 * Single-choice dropdown anchored to `trigger` (a single element, e.g. a
 * FilterPill). The selected option shows a check. Arrow keys move, Enter picks.
 *
 * options: [{ value, label }]
 */
export function SelectMenu({ trigger, value, options, onChange, align = 'left', label }) {
  const anchorRef = useRef(null)
  const listRef = useRef(null)
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => {
      const items = listRef.current?.querySelectorAll('[role="option"]')
      const selected = listRef.current?.querySelector('[aria-selected="true"]')
      ;(selected ?? items?.[0])?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [open])

  const onKeyDown = (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const items = Array.from(listRef.current.querySelectorAll('[role="option"]'))
    const step = e.key === 'ArrowDown' ? 1 : -1
    const next = (items.indexOf(document.activeElement) + step + items.length) % items.length
    items[next].focus()
  }

  return (
    <>
      {cloneElement(trigger, {
        ref: anchorRef,
        onClick: () => setOpen((o) => !o),
        'aria-haspopup': 'listbox',
        'aria-expanded': open,
      })}
      <Popover anchorRef={anchorRef} open={open} onClose={close} align={align} role="presentation" style={{ padding: 4, borderRadius: 8, minWidth: 128 }}>
        <div ref={listRef} role="listbox" aria-label={label} onKeyDown={onKeyDown}>
          {options.map((o) => {
            const selected = o.value === value
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={selected}
                className="dui-select-option"
                onClick={() => { close(); onChange?.(o.value) }}
              >
                <span>{o.label}</span>
                {selected && <span style={{ color: color.text, display: 'inline-flex' }}><CheckCircleIcon /></span>}
              </button>
            )
          })}
        </div>
      </Popover>
    </>
  )
}

/* ── DateRangePicker ─────────────────────────────────────────────────────── */

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const CELL_W = 44
const CELL_H = 36
const MONTH_OPTIONS = 36

const firstOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1)
const monthKey = (d) => d.getFullYear() * 12 + d.getMonth()
const pad2 = (n) => String(n).padStart(2, '0')
const formatInput = (d) => (d ? `${pad2(d.getMonth() + 1)} / ${pad2(d.getDate())} / ${d.getFullYear()}` : '')

function parseInput(text) {
  const parts = text.match(/\d+/g)
  if (!parts || parts.length !== 3) return null
  const [m, d, y] = parts.map(Number)
  const date = new Date(y < 100 ? 2000 + y : y, m - 1, d)
  return date.getMonth() === m - 1 && date.getDate() === d ? date : null
}

function orderRange(a, b) {
  return a <= b ? { start: a, end: b } : { start: b, end: a }
}

function DateInput({ label, date, onCommit, inputStyle }) {
  const [editing, setEditing] = useState(null)
  const commit = () => {
    if (editing === null) return
    const parsed = parseInput(editing)
    if (parsed && !isSameDay(parsed, date)) onCommit(parsed)
    setEditing(null)
  }
  return (
    <label className="flex items-center gap-[8px]" style={{ fontSize: 14, lineHeight: '20px', color: color.text }}>
      {label}
      <input
        className="dui-date-input"
        aria-label={label ? undefined : 'Date'}
        style={inputStyle}
        value={editing ?? formatInput(date)}
        placeholder="MM / DD / YYYY"
        onFocus={(e) => { setEditing(formatInput(date)); e.target.select() }}
        onChange={(e) => setEditing(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
    </label>
  )
}

function MonthTitle({ month, maxMonth, onPick }) {
  const options = Array.from({ length: MONTH_OPTIONS }, (_, i) => addMonths(maxMonth, i - MONTH_OPTIONS + 1))
  return (
    <div className="dui-month-title">
      <span>{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
      <ChevronDownIcon size={8} />
      <select
        aria-label="Choose month"
        value={monthKey(month)}
        onChange={(e) => {
          const key = Number(e.target.value)
          onPick(new Date(Math.floor(key / 12), key % 12, 1))
        }}
      >
        {options.map((m) => (
          <option key={monthKey(m)} value={monthKey(m)}>{m.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</option>
        ))}
      </select>
    </div>
  )
}

function MonthGrid({ month, start, end, max, onPick, onHover }) {
  const offset = month.getDay()
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ]
  const hasRange = start && end && !isSameDay(start, end)
  const today = startOfDay(new Date())

  return (
    <div role="grid" aria-label={month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}>
      <div className="grid" style={{ gridTemplateColumns: `repeat(7, ${CELL_W}px)`, marginBottom: 8 }}>
        {WEEKDAYS.map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 12, lineHeight: '16px', color: color.subdued }}>{d}</div>
        ))}
      </div>
      <div className="grid" style={{ gridTemplateColumns: `repeat(7, ${CELL_W}px)`, rowGap: 8 }} onMouseLeave={() => onHover(null)}>
        {cells.map((day, i) => {
          if (!day) return <div key={`blank-${i}`} />
          const disabled = day > max
          const isStart = isSameDay(day, start)
          const isEnd = isSameDay(day, end)
          const inRange = hasRange && day >= start && day <= end
          const weekday = day.getDay()
          // The band runs across a week; it rounds off at week edges and range ends,
          // and stays square at month edges so it reads as continuing.
          const roundLeft = isStart || weekday === 0
          const roundRight = isEnd || weekday === 6
          const band = inRange && {
            background: color.brand50,
            borderTopLeftRadius: roundLeft ? CELL_H / 2 : 0,
            borderBottomLeftRadius: roundLeft ? CELL_H / 2 : 0,
            borderTopRightRadius: roundRight ? CELL_H / 2 : 0,
            borderBottomRightRadius: roundRight ? CELL_H / 2 : 0,
          }
          const endpoint = isStart || isEnd
          return (
            <div key={day.getDate()} style={{ height: CELL_H, display: 'flex', justifyContent: 'center', ...band }}>
              <button
                type="button"
                role="gridcell"
                aria-selected={endpoint || Boolean(inRange)}
                aria-label={day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                disabled={disabled}
                className={`dui-calendar-day${endpoint ? ' dui-calendar-day--endpoint' : ''}${isSameDay(day, today) ? ' dui-calendar-day--today' : ''}`}
                style={{ color: endpoint ? '#FFFFFF' : disabled ? color.placeholder : inRange ? color.actionPrimary : color.text }}
                onClick={() => onPick(day)}
                onMouseEnter={() => onHover(day)}
              >
                {day.getDate()}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Single-date popover: a typed date field above one month. Picking a day (or
 * committing the field) calls `onChange(date)` and closes. Controlled with
 * `open` / `onClose` and anchored to `anchorRef`. Future dates are disabled.
 */
export function DatePicker({ anchorRef, open, onClose, value, onChange, maxDate, align = 'left', label = 'Choose date' }) {
  const max = startOfDay(maxDate ?? new Date())
  const maxMonth = firstOfMonth(max)
  const [viewMonth, setViewMonth] = useState(() => firstOfMonth(value ?? max))

  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setViewMonth(firstOfMonth(value ?? max))
  }

  const month = monthKey(viewMonth) > monthKey(maxMonth) ? maxMonth : viewMonth
  const choose = (d) => {
    const day = d > max ? max : startOfDay(d)
    onChange?.(day)
    onClose()
  }

  return (
    <Popover anchorRef={anchorRef} open={open} onClose={onClose} align={align} label={label} style={{ borderRadius: 12, padding: 16 }}>
      <DateInput date={value} onCommit={choose} inputStyle={{ width: '100%' }} />
      <div className="flex items-center justify-between" style={{ height: 28, margin: '16px 0' }}>
        <MonthTitle month={month} maxMonth={maxMonth} onPick={setViewMonth} />
        <div className="flex items-center">
          <button type="button" aria-label="Previous month" className="dui-btn dui-btn--ghost dui-btn--icon" style={{ color: color.subdued }} onClick={() => setViewMonth(addMonths(month, -1))}><ChevronLeftIcon /></button>
          <button type="button" aria-label="Next month" disabled={monthKey(month) >= monthKey(maxMonth)} className="dui-btn dui-btn--ghost dui-btn--icon" style={{ color: color.subdued }} onClick={() => setViewMonth(addMonths(month, 1))}><ChevronRightIcon /></button>
        </div>
      </div>
      <MonthGrid month={month} start={value} end={value} max={max} onPick={choose} onHover={() => {}} />
    </Popover>
  )
}

/**
 * Two-month date-range popover with presets, typed Start/End fields, and
 * Clear / Apply. Edits a draft; `onApply` receives `{ preset, start, end }`
 * (`preset` is null for a hand-picked range). Controlled with `open` / `onClose`
 * and anchored to `anchorRef`. Pass `presets={[]}` to hide the preset list.
 */
export function DateRangePicker({ anchorRef, open, onClose, value, onApply, presets = DATE_RANGE_PRESETS, maxDate, align = 'left', label = 'Date range' }) {
  const max = startOfDay(maxDate ?? new Date())
  const maxMonth = firstOfMonth(max)
  const [draft, setDraft] = useState(value)
  const [hover, setHover] = useState(null)
  const [viewMonth, setViewMonth] = useState(() => firstOfMonth(value?.end ?? max))

  // Re-seed the draft each time the picker opens.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setDraft(value)
      setHover(null)
      setViewMonth(firstOfMonth(value?.end ?? max))
    }
  }

  const rightMonth = monthKey(viewMonth) > monthKey(maxMonth) ? maxMonth : viewMonth
  const leftMonth = addMonths(rightMonth, -1)
  const canGoNext = monthKey(rightMonth) < monthKey(maxMonth)

  const showMonthOf = (d) => setViewMonth(firstOfMonth(d))
  const selecting = draft?.start && !draft?.end
  const preview = selecting && hover ? orderRange(draft.start, hover) : draft

  const pickDay = (day) => {
    if (!draft?.start || draft.end) setDraft({ preset: null, start: day, end: null })
    else setDraft({ preset: null, ...orderRange(draft.start, day) })
  }

  const commitField = (field) => (date) => {
    const d = date > max ? max : startOfDay(date)
    const other = field === 'start' ? draft?.end : draft?.start
    setDraft({ preset: null, ...(other ? orderRange(d, other) : { start: d, end: null }) })
    showMonthOf(d)
  }

  return (
    <Popover anchorRef={anchorRef} open={open} onClose={onClose} align={align} label={label} style={{ borderRadius: 12, padding: 20 }}>
      <div className="flex" style={{ gap: 24 }}>
        {presets.length > 0 && (
          <div className="flex flex-col" style={{ width: 128, gap: 4 }}>
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                className="dui-preset"
                aria-pressed={draft?.preset === p.id}
                onClick={() => {
                  const range = getPresetRange(p.id, max)
                  setDraft(range)
                  showMonthOf(range.end)
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        <div>
          <div className="flex items-center gap-[24px]" style={{ marginBottom: 20 }}>
            <DateInput label="Start" date={draft?.start} onCommit={commitField('start')} />
            <DateInput label="End" date={draft?.end} onCommit={commitField('end')} />
          </div>

          <div className="flex" style={{ gap: 48 }}>
            {[leftMonth, rightMonth].map((month, i) => (
              <div key={monthKey(month)}>
                <div className="flex items-center justify-between" style={{ height: 28, marginBottom: 16 }}>
                  {i === 0
                    ? <button type="button" aria-label="Previous month" className="dui-btn dui-btn--ghost dui-btn--icon" style={{ color: color.subdued }} onClick={() => setViewMonth(addMonths(rightMonth, -1))}><ChevronLeftIcon /></button>
                    : <span style={{ width: 28 }} />}
                  <MonthTitle month={month} maxMonth={maxMonth} onPick={(m) => setViewMonth(i === 0 ? addMonths(m, 1) : m)} />
                  {i === 1
                    ? <button type="button" aria-label="Next month" disabled={!canGoNext} className="dui-btn dui-btn--ghost dui-btn--icon" style={{ color: color.subdued }} onClick={() => setViewMonth(addMonths(rightMonth, 1))}><ChevronRightIcon /></button>
                    : <span style={{ width: 28 }} />}
                </div>
                <MonthGrid month={month} start={preview?.start} end={preview?.end} max={max} onPick={pickDay} onHover={setHover} />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-[8px]" style={{ marginTop: 20 }}>
            <Button onClick={() => setDraft({ preset: null, start: null, end: null })}>Clear</Button>
            <Button
              variant="primary"
              disabled={!draft?.start || !draft?.end}
              onClick={() => { onApply?.(draft); onClose() }}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </Popover>
  )
}
