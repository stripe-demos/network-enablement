import { dashboardStorage } from '../lib/storage';
import { useSyncExternalStore } from 'react'

/** ConsoleIcon variants, in catalog order. The chosen one (saved per browser) is what every <ConsoleIcon> without a `variant` prop draws. */
export const CONSOLE_ICON_VARIANTS = ['cube', 'base', 'blob']
const CONSOLE_ICON_VARIANT_KEY = 'dui-console-icon-variant'
const consoleIconListeners = new Set()
const readConsoleIconVariant = () => {
  try {
    const saved = dashboardStorage.getItem(CONSOLE_ICON_VARIANT_KEY)
    return CONSOLE_ICON_VARIANTS.includes(saved) ? saved : CONSOLE_ICON_VARIANTS[0]
  } catch { return CONSOLE_ICON_VARIANTS[0] }
}
const subscribeConsoleIconVariant = (fn) => {
  consoleIconListeners.add(fn)
  window.addEventListener('storage', fn)
  return () => { consoleIconListeners.delete(fn); window.removeEventListener('storage', fn) }
}
export function setConsoleIconVariant(variant) {
  try { dashboardStorage.setItem(CONSOLE_ICON_VARIANT_KEY, variant) } catch { /* storage unavailable */ }
  consoleIconListeners.forEach((fn) => fn())
}
export const useConsoleIconVariant = () => useSyncExternalStore(subscribeConsoleIconVariant, readConsoleIconVariant, () => CONSOLE_ICON_VARIANTS[0])

/** Common status label → badge tone mapping. Pass `map` to StatusBadge to override per page. */
export const DEFAULT_STATUS_TONES = {
  Succeeded: 'success', Paid: 'success', Active: 'success', Enabled: 'success', Won: 'success', Available: 'success',
  Pending: 'warning', 'Past due': 'warning', 'In transit': 'info', Open: 'info', Draft: 'default',
  Failed: 'critical', Blocked: 'critical', Lost: 'critical', Disputed: 'critical',
  Refunded: 'default', Canceled: 'default', Archived: 'default', Inactive: 'default',
}

/** Names of the SVGs in /public/icons (without extension), for <Icon name="..." />. */
export const ICON_NAMES = [
  'add', 'add12', 'arrowDown', 'arrowLeft', 'arrowRight', 'arrowRight12', 'arrowUpDown12', 'arrowsLoop',
  'balance', 'barChart12', 'chat', 'check', 'checkCircleFilled', 'chevronDown12', 'chevronRight8',
  'chevronUp12', 'clipboard12', 'export', 'export12', 'external12', 'filter-icon', 'folder', 'freeze12',
  'guide', 'Help', 'hide16', 'home', 'info', 'info12', 'lab', 'link', 'more12', 'more-16', 'Notifications',
  'person', 'pin12', 'platform', 'product', 'product16', 'search-12', 'Settings', 'slack', 'table-controls',
]

/** Date-range presets for <DateRangePicker>, in menu order. */
export const DATE_RANGE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'last7days', label: 'Last 7 days' },
  { id: 'last4weeks', label: 'Last 4 weeks' },
  { id: 'last6months', label: 'Last 6 months' },
  { id: 'last12months', label: 'Last 12 months' },
  { id: 'monthToDate', label: 'Month to date' },
  { id: 'quarterToDate', label: 'Quarter to date' },
  { id: 'yearToDate', label: 'Year to date' },
  { id: 'allTime', label: 'All time' },
]

/** Earliest date "All time" reaches back to (the prototype account's first activity). */
export const ALL_TIME_START = new Date(2020, 0, 1)

export const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
export const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, d.getDate())
export const isSameDay = (a, b) => Boolean(a && b) && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/** `{ preset, start, end }` for a DATE_RANGE_PRESETS id, ending today. */
export function getPresetRange(id, today = new Date()) {
  const end = startOfDay(today)
  const starts = {
    today: end,
    last7days: addDays(end, -6),
    last4weeks: addDays(end, -27),
    last6months: addDays(addMonths(end, -6), 1),
    last12months: addDays(addMonths(end, -12), 1),
    monthToDate: new Date(end.getFullYear(), end.getMonth(), 1),
    quarterToDate: new Date(end.getFullYear(), end.getMonth() - (end.getMonth() % 3), 1),
    yearToDate: new Date(end.getFullYear(), 0, 1),
    allTime: ALL_TIME_START,
  }
  return { preset: id, start: starts[id] ?? end, end }
}

/** "Sep 10", or "Sep 10, 2025" outside the current year. */
const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const shortDateWithYear = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export function formatShortDate(d, { withYear = d.getFullYear() !== new Date().getFullYear() } = {}) {
  return (withYear ? shortDateWithYear : shortDate).format(d)
}

/** Pill label for a range: the preset's name, or "Sep 10 – Oct 7". */
export function formatDateRange(range, presets = DATE_RANGE_PRESETS) {
  const preset = range?.preset && presets.find((p) => p.id === range.preset)
  if (preset) return preset.label
  if (!range?.start || !range?.end) return ''
  if (isSameDay(range.start, range.end)) return formatShortDate(range.start)
  const withYear = range.start.getFullYear() !== range.end.getFullYear() || range.end.getFullYear() !== new Date().getFullYear()
  return `${formatShortDate(range.start, { withYear })} – ${formatShortDate(range.end, { withYear })}`
}

/** Turn a list of numbers into an SVG path across a 0–100 wide viewBox. */
export function valuesToPath(values, height, max = Math.max(...values), min = 0) {
  const span = max - min || 1
  return values
    .map((v, i) => {
      const x = values.length === 1 ? 0 : (i / (values.length - 1)) * 100
      const y = height - ((v - min) / span) * height
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
}
