import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { color, shadow } from './tokens'

const GAP = 12

/**
 * White data card shown while hovering a chart (Sail's chart tooltip).
 *
 * rows: [{ color, label, value }]
 * swatch: 'line' (line series) | 'square' (bars, meter segments)
 */
export function ChartHoverCard({ title, rows, swatch = 'line', style }) {
  return (
    <div
      style={{
        background: color.surface,
        borderRadius: 8,
        boxShadow: shadow.popover,
        padding: '8px 12px',
        minWidth: 160,
        fontSize: 12,
        lineHeight: '16px',
        ...style,
      }}
    >
      {title && <div style={{ fontWeight: 600, color: color.text, marginBottom: 6 }}>{title}</div>}
      <div className="flex flex-col gap-[6px]">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between gap-[16px]">
            <div className="flex items-center gap-[8px] min-w-0">
              <span
                style={swatch === 'line'
                  ? { width: 10, height: 2, borderRadius: 1, background: r.color, flexShrink: 0 }
                  : { width: 8, height: 8, borderRadius: 2, background: r.color, flexShrink: 0 }}
              />
              <span className="truncate" style={{ color: color.subdued }}>{r.label}</span>
            </div>
            <span style={{ fontWeight: 600, color: color.text, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Places a ChartHoverCard from document.body (so card grids can't clip it)
 * beside an anchor point in viewport px, flipping to the other side when it
 * would leave the screen. side: 'right' (beside a needle) | 'below'.
 */
export function FloatingChartHoverCard({ anchor, side = 'right', ...card }) {
  const ref = useRef(null)
  const [pos, setPos] = useState(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    const vw = window.innerWidth, vh = window.innerHeight
    let left, top
    if (side === 'below') {
      left = Math.min(Math.max(8, anchor.x - width / 2), vw - width - 8)
      top = anchor.y + GAP + height > vh ? anchor.top - GAP - height : anchor.y + GAP
    } else {
      left = anchor.x + GAP + width > vw - 8 ? anchor.x - GAP - width : anchor.x + GAP
      top = Math.min(Math.max(8, anchor.y), vh - height - 8)
    }
    setPos((prev) => (prev && prev.left === left && prev.top === top ? prev : { left, top }))
  }, [anchor.x, anchor.y, anchor.top, side])
  return createPortal(
    <div
      ref={ref}
      aria-hidden="true"
      data-wireframe-role="chart-hover"
      style={{ position: 'fixed', zIndex: 10000, pointerEvents: 'none', left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? 'visible' : 'hidden' }}
    >
      <ChartHoverCard {...card} />
    </div>,
    document.body,
  )
}

/**
 * Hover layer for a line chart: snaps a vertical needle to the nearest x,
 * dots each series there, and shows a ChartHoverCard beside it. Fill a
 * `position: relative` plot box with it.
 *
 * series: [{ color, points: [{ y, value, label }] }] — points are index-aligned
 *   to `count` evenly spaced x positions (a series can stop early, like
 *   today's line); `y` is px from the top of the box.
 * title: (index) => string, e.g. the hovered date or time
 */
export function LineChartHover({ series, count, title }) {
  const ref = useRef(null)
  const [hover, setHover] = useState(null)

  const onPointerMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    const frac = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
    const index = Math.round(frac * (count - 1))
    setHover((prev) => (prev?.index === index && prev.rect.top === r.top && prev.rect.left === r.left ? prev : { index, rect: r }))
  }

  const index = hover?.index
  const x = index != null ? index / (count - 1) : 0
  const live = index != null ? series.filter((s) => s.points[index]) : []

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setHover(null)}
      style={{ position: 'absolute', inset: 0, cursor: 'crosshair' }}
    >
      {hover && live.length > 0 && (
        <>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${x * 100}%`, width: 1, marginLeft: -0.5, background: color.neutral100, pointerEvents: 'none' }} />
          {live.map((s, i) => (
            <div
              key={i}
              style={{
                position: 'absolute', left: `${x * 100}%`, top: s.points[index].y,
                width: 8, height: 8, borderRadius: '50%', transform: 'translate(-50%, -50%)',
                background: s.color, boxShadow: `0 0 0 2px ${color.surface}`, pointerEvents: 'none',
              }}
            />
          ))}
          <FloatingChartHoverCard
            anchor={{ x: hover.rect.left + x * hover.rect.width, y: hover.rect.top }}
            title={title?.(index)}
            rows={live.map((s) => ({ color: s.color, label: s.points[index].label, value: s.points[index].value }))}
          />
        </>
      )}
    </div>
  )
}
