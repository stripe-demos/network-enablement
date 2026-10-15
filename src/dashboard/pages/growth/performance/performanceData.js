// Simulated Performance tab metrics, with values and axis labels from Figma.
// Series are 0–1 shapes scaled between each chart's y labels.
import { addDays, addMonths, formatShortDate } from '@dashboard/ui'

const compactUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 })
const formatUsd = (n) => compactUsd.format(n)
const formatBps = (n) => `${n.toFixed(1)}bps`
const formatCount = (n) => Math.round(n).toLocaleString('en-US')

const VOLUME_SHAPE = [0.08, 0.12, 0.22, 0.27, 0.18, 0.37, 0, 0.03, 0.4, 0.45, 0.3, 0.5, 0.7, 0.62, 0.4, 0.33, 0.75, 0.6, 0.38, 0.45, 1, 0.75, 0.47, 0.75, 0.68]
const VOLUME_COMPARE = [0.1, 0.18, 0.28, 0.32, 0.22, 0.47, 0.1, 0.13, 0.55, 0.35, 0.4, 0.36, 0.6, 0.52, 0.48, 0.42, 0.9, 0.7, 0.45, 0.4, 0.44, 0.5, 0.6, 0.38, 0.25]
const REVENUE_SHAPE = [0.1, 0.13, 0.22, 0.25, 0.17, 0.35, 0, 0.04, 0.4, 0.43, 0.35, 0.53, 0.7, 0.65, 0.42, 0.33, 0.62, 0.48, 0.3, 0.38, 1, 0.73, 0.52, 0.71, 0.66]
const REVENUE_COMPARE = [0.14, 0.2, 0.3, 0.33, 0.24, 0.45, 0.02, 0.04, 0.53, 0.25, 0.4, 0.37, 0.6, 0.48, 0.5, 0.42, 0.88, 0.73, 0.5, 0.42, 0.44, 0.52, 0.52, 0.33, 0.25]
const ACCOUNTS_SHAPE = [0, 0.06, 0.12, 0, 0.3, 0.36, 0.82, 0.7, 0.62, 0.52, 0.72, 0.9]
const ACCOUNTS_COMPARE = [0, 0.1, 0.34, 0.3, 0.17, 0, 0.45, 0.5, 0.92, 0.6, 0.66, 0.8]

const scale = (shape, min, max) => shape.map((v) => min + v * (max - min))
const metric = ({ shape, compare, min, max, ...rest }) => ({ ...rest, min, max, data: scale(shape, min, max), compareData: scale(compare, min, max) })

export const VOLUME_METRICS = [
  metric({ id: 'gpv', title: 'Gross payment volume', value: '$9.49M', delta: '+20%', yLabels: ['$9.5M', '$8.0M'], min: 8e6, max: 9.5e6, format: formatUsd, shape: VOLUME_SHAPE, compare: VOLUME_COMPARE }),
  metric({ id: 'gtv', title: 'Gross transfer volume', value: '$1.26M', delta: '+9.4%', yLabels: ['$3.0M', '$1.0M'], min: 1e6, max: 3e6, format: formatUsd, shape: VOLUME_SHAPE, compare: VOLUME_COMPARE }),
]

export const REVENUE_METRIC = metric({ id: 'revenue', title: 'Revenue', value: '$673.4K', delta: '+10.7%', yLabels: ['$800K', '$500K'], min: 5e5, max: 8e5, format: formatUsd, shape: REVENUE_SHAPE, compare: REVENUE_COMPARE })

export const MARGIN_METRICS = [
  metric({ id: 'margin', title: 'Margin', value: '$43.59K', delta: '-6.5%', yLabels: ['$50K', '$10K'], min: 1e4, max: 5e4, format: formatUsd, shape: VOLUME_SHAPE, compare: VOLUME_COMPARE }),
  metric({ id: 'takeRate', title: 'Payment take rate', value: '40bps', delta: '-4.7%', yLabels: ['45bps', '35bps'], min: 35, max: 45, format: formatBps, shape: VOLUME_SHAPE, compare: VOLUME_COMPARE }),
]

export const NEW_ACCOUNTS_METRIC = metric({ id: 'newAccounts', title: 'New accounts', value: '427', delta: '+20.5%', yLabels: ['90', '60', '30', '0'], rows: 3, height: 126, min: 0, max: 90, format: formatCount, shape: ACCOUNTS_SHAPE, compare: ACCOUNTS_COMPARE })

export const COMPARE_OPTIONS = [
  { value: 'previousPeriod', label: 'Previous period' },
  { value: 'previousMonth', label: 'Previous month' },
  { value: 'previousYear', label: 'Previous year' },
]

export const INTERVAL_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

const DAY_MS = 86400000

export function getComparisonRange({ start, end }, compare) {
  if (compare === 'previousPeriod') {
    const days = Math.round((end - start) / DAY_MS) + 1
    return { start: addDays(start, -days), end: addDays(start, -1) }
  }
  if (compare === 'previousMonth') return { start: addMonths(start, -1), end: addMonths(end, -1) }
  if (compare === 'previousYear') return { start: addMonths(start, -12), end: addMonths(end, -12) }
  return null
}

const withHour = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric' })
const monthYear = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' })

/* One hover label per point, spread evenly across the range. Ranges shorter
   than the series (Last 7 days) label points by hour so they stay distinct. */
export function spreadLabels({ start, end }, count, interval) {
  const span = end - start + DAY_MS
  const short = span / DAY_MS < count
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start.getTime() + (span * i) / count)
    if (short) return withHour.format(d)
    if (interval === 'monthly') return monthYear.format(d)
    return interval === 'weekly' ? `Week of ${formatShortDate(d)}` : formatShortDate(d)
  })
}

/* Axis ends, hover labels and the comparison toggle for a section's charts. */
export function getPeriod(range, interval, compare) {
  const comparison = getComparisonRange(range, compare)
  return {
    xStart: formatShortDate(range.start, { withYear: true }),
    xEnd: formatShortDate(range.end, { withYear: true }),
    labels: (count) => spreadLabels(range, count, interval),
    compareLabels: comparison ? (count) => spreadLabels(comparison, count, interval) : null,
  }
}
