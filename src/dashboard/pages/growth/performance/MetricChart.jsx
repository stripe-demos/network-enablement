// One Performance metric: title with info icon, value and delta, then a
// LineChart with a dashed comparison line. LineChart's own hover only knows
// solid comparisons, so the hover layer sits over its plot area here.
import { LineChart, LineChartHover, SailInfoIcon, color, type } from '@dashboard/ui'

const LABEL_GUTTER = 48 // LineChart's y-label column plus its gap

export default function MetricChart({ metric, period }) {
  const { title, value, delta, yLabels, min, max, data, compareData, format, rows = 1, height = 89 } = metric
  const comparing = Boolean(period.compareLabels)
  const span = max - min
  const toY = (v) => height - ((v - min) / span) * height
  const series = (values, c, labels) => ({ color: c, points: values.map((v, i) => ({ y: toY(v), value: format(v), label: labels[i] })) })
  const hoverSeries = [
    series(data, color.chartCategorical[0], period.labels(data.length)),
    comparing && series(compareData, color.neutral300, period.compareLabels(compareData.length)),
  ].filter(Boolean)
  const negative = delta.startsWith('-')

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-[6px]">
        <span style={type.label}>{title}</span>
        <span className="inline-flex" style={{ color: color.subdued }}><SailInfoIcon size={12} /></span>
      </div>
      <div className="flex items-baseline gap-[4px]">
        <span style={{ ...type.metricLarge, fontWeight: 700 }}>{value}</span>
        {comparing && <span style={{ fontSize: 14, fontWeight: 600, lineHeight: '16px', color: negative ? color.negative : color.positive }}>{delta}</span>}
      </div>
      <div className="relative" style={{ marginTop: 14 }}>
        <LineChart
          data={data.map((v) => v - min)}
          bands={comparing ? [{ data: compareData.map((v) => v - min), color: color.neutral300 }] : []}
          yMax={span}
          yLabels={yLabels}
          rows={rows}
          height={height}
          stroke={color.chartCategorical[0]}
          strokeWidth={2}
          xStart={period.xStart}
          xEnd={period.xEnd}
        />
        <div className="absolute" style={{ top: 0, left: 0, right: LABEL_GUTTER, height }}>
          <LineChartHover series={hoverSeries} count={data.length} />
        </div>
      </div>
    </div>
  )
}
