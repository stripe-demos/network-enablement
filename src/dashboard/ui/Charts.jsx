import { useState } from 'react'
import { color } from './tokens'
import { valuesToPath } from './helpers'
import { FloatingChartHoverCard, LineChartHover } from './ChartHover'

const pathPoints = (d) => (d.match(/-?[\d.]+,-?[\d.]+/g) ?? []).map((pair) => Number(pair.split(',')[1]))

/**
 * Small line chart for metric cards: brand-colored current series, optional
 * grey comparison series, 4 grid rows, right-hand y labels.
 *
 * Pass either `data` / `compareData` (number arrays) or raw `path1` / `path2`
 * SVG paths drawn in a `0 0 100 {height}` viewBox (points evenly spaced in x).
 *
 * `hover` turns on the hover needle and card:
 *   { labels, compareLabels?, format?, yMax? } — one label per point (e.g.
 *   dates); values come from `data`, or from a path's height scaled to `yMax`.
 */
export function LineChart({ data, compareData, path1, path2, yLabels = [], xStart = 'Dec 1', xEnd = 'Dec 7', height = 188, hover }) {
  const rowH = height / 4
  const labelW = 40
  const gap = 8
  const max = data ? Math.max(...data, ...(compareData ?? [])) : undefined
  const primary = path1 ?? (data ? valuesToPath(data, height, max) : '')
  const secondary = path2 ?? (compareData ? valuesToPath(compareData, height, max) : null)

  const hoverSeries = hover && [
    { path: primary, values: data, color: color.brand500, labels: hover.labels },
    secondary && { path: secondary, values: compareData, color: color.neutral100, labels: hover.compareLabels ?? hover.labels.map(() => 'Previous period') },
  ].filter(Boolean).map(({ path, values, color: c, labels }) => ({
    color: c,
    points: pathPoints(path).map((y, i) => {
      const value = values ? values[i] : (hover.yMax ?? 0) * (1 - y / height)
      return { y, label: labels[i], value: hover.format ? hover.format(value) : String(value) }
    }),
  }))

  return (
    <div className="relative w-full" style={{ height: height + 32 }} data-wireframe-role="chart">
      <div className="flex" style={{ height }}>
        <div className="flex-1 min-w-0 relative" style={{ marginRight: gap }}>
          <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="block">
            {[0, 1, 2, 3, 4].map(i => (
              <line key={i} x1="0" y1={i * rowH} x2="100" y2={i * rowH} stroke={color.neutral50} strokeWidth="1" vectorEffect="non-scaling-stroke" />
            ))}
            {secondary && <path d={secondary} fill="none" stroke={color.neutral100} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
            <path d={primary} fill="none" stroke={color.brand500} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>
          {hoverSeries && <LineChartHover series={hoverSeries} count={hoverSeries[0].points.length} />}
        </div>
        <div className="flex flex-col justify-between shrink-0" style={{ width: labelW, textAlign: 'right' }}>
          {yLabels.map((label, i) => (
            <span key={i} style={{ fontSize: 11, color: color.subdued, lineHeight: '11px' }}>{label}</span>
          ))}
        </div>
      </div>
      <div className="flex justify-between w-full" style={{ marginTop: 8, fontSize: 11, color: color.subdued, paddingRight: labelW + gap }}>
        <span>{xStart}</span>
        <span>{xEnd}</span>
      </div>
    </div>
  )
}

/**
 * Horizontal stacked bar. segments: [{ value, color?, label?, display? }] —
 * colors default to the chart palette in order. Segments with a `label` show a
 * hover card (label and `display`, e.g. '$130k') and dim the rest of the bar.
 */
export function MeterBar({ segments, height = 16 }) {
  const [hover, setHover] = useState(null)
  const segmentColor = (s, i) => s.color ?? color.chart[i % color.chart.length]
  const hovered = hover && segments[hover.index]
  return (
    <>
      <div className="flex w-full rounded-[3px] overflow-hidden" style={{ height }} onPointerLeave={() => setHover(null)} data-wireframe-role="chart">
        {segments.map((s, i) => (
          <div
            key={i}
            onPointerMove={s.label ? (e) => {
              const r = e.currentTarget.getBoundingClientRect()
              setHover({ index: i, anchor: { x: e.clientX, y: r.bottom, top: r.top } })
            } : () => setHover(null)}
            style={{
              flex: s.value,
              backgroundColor: segmentColor(s, i),
              opacity: hover && hover.index !== i ? 0.4 : 1,
              transition: 'opacity 120ms ease-out',
            }}
          />
        ))}
      </div>
      {hovered && (
        <FloatingChartHoverCard
          side="below"
          anchor={hover.anchor}
          swatch="square"
          rows={[{ color: segmentColor(hovered, hover.index), label: hovered.label, value: hovered.display ?? String(hovered.value) }]}
        />
      )}
    </>
  )
}

/**
 * The "now" dot at the end of a live line. A ring pulses out from it each time
 * `pulseKey` changes (e.g. when the value goes up). Position it with `style`;
 * it's centred on that point.
 */
export function LiveDot({ color: dotColor = color.brand500, size = 6, pulseKey, style }) {
  return (
    <div className="dui-live-dot" style={{ width: size, height: size, '--dui-live-dot-color': dotColor, ...style }}>
      {pulseKey ? <span key={pulseKey} className="dui-live-dot__pulse" /> : null}
    </div>
  )
}

/**
 * Color-swatch legend rows: [{ color, label, value, onClick? }]. `divided` is the
 * Dashboard table style (Payments card): KeyValueList-spaced rows with a
 * hairline under each. Rows with `onClick` get a hover background and are
 * keyboard-activatable.
 */
export function Legend({ items, divided = false }) {
  return (
    <div className={divided ? 'flex flex-col' : 'flex flex-col gap-[8px]'} data-wireframe-role="chart">
      {items.map((r, i) => (
        <div
          key={i}
          className={`flex items-center justify-between${r.onClick ? ' dui-legend-row--interactive' : ''}`}
          style={divided ? { padding: '8px 0', borderBottom: `1px solid ${color.borderSubtle}` } : undefined}
          onClick={r.onClick}
          role={r.onClick ? 'button' : undefined}
          tabIndex={r.onClick ? 0 : undefined}
          onKeyDown={r.onClick ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              r.onClick()
            }
          } : undefined}
        >
          <div className="flex items-center gap-[8px]">
            <div className="rounded-[3px]" style={{ width: divided ? 12 : 10, height: divided ? 12 : 10, backgroundColor: r.color ?? color.chart[i % color.chart.length] }} />
            <span style={{ fontSize: divided ? 13 : 14, fontWeight: 400, color: divided ? color.textStrong : color.subdued }}>{r.label}</span>
          </div>
          <span style={{ fontSize: divided ? 13 : 14, fontWeight: 500, color: divided ? color.textStrong : color.text, fontVariantNumeric: 'tabular-nums' }}>{r.value}</span>
        </div>
      ))}
    </div>
  )
}

/** Tiny inline trend line (no axes) for table cells or stat blocks. */
export function Sparkline({ data, width = 64, height = 20, stroke = color.brand500 }) {
  return (
    <svg width={width} height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
      <path d={valuesToPath(data, height - 2, undefined, Math.min(...data))} transform="translate(0,1)" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
