// DashboardHome — Console home page, faithfully recreated from Figma
// node 2428:262181 ("Console-home-01").
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DashboardHomeSearch from '../components/DashboardHomeSearch'
import { HOME_CONTENT_GUTTER, HOME_HERO_ALIGN_TOP, cappedGutter, HOME_TOOLBAR_SEARCH_TOP } from '../constants/layout'
import { useSearchPrototypeControls } from '../prototype/useSearchPrototypeControls'
import { getTimeOfDayGreeting } from '../prototype/searchPrototypeControls'
import { AddIcon, Badge, Button, Card, CardFooterLink, CardGrid, CardHeader, CardMetric, DatePicker, DateRangePicker, EditIcon, FilterPill, FilterPillValue, KeyValueList, Legend, LineChart, LineChartHover, LiveDot, MeterBar, PlusCircleIcon, SectionHeader, SelectMenu, Stat, StatDropdown, TextLink, addDays, addMonths, color, formatDateRange, formatShortDate, getPresetRange, isSameDay, startOfDay, type, useDashboardConsole } from "@dashboard/ui"

const SEARCH_UI_COPY = {
  en: {
    greeting: 'Good afternoon',
    today: 'Your overview',
    overview: 'Performance',
    payOutFunds: 'Pay out funds',
    netVolume: 'Net volume',
    yesterday: 'Yesterday',
    todayLine: 'Today',
    usdBalance: 'USD Balance',
    view: 'View',
    availableToPayOut: 'Available to pay out',
    payouts: 'Payouts',
    expectedToday: 'Expected today',
    dateRange: 'Date range',
    last7Days: 'Last 7 days',
    daily: 'Daily',
    compare: 'Compare',
    add: 'Add',
    edit: 'Edit',
    nowAt: 'Now, 2:00 PM',
    midnight: '12:00 AM',
    endOfDay: '11:59 PM',
    payments: 'Payments',
    succeeded: 'Succeeded',
    uncaptured: 'Uncaptured',
    refunded: 'Refunded',
    disputed: 'Disputed',
    failed: 'Failed',
    grossVolume: 'Gross volume',
    netVolumeFromSales: 'Net volume from sales',
    failedPayments: 'Failed payments',
    cardDeclined: 'Card declined',
    insufficientFunds: 'Insufficient funds',
    lostOrStolenCard: 'Lost or stolen card',
    expiredCard: 'Expired card',
    other: 'Other',
    newCustomers: 'New customers',
    topCustomersBySpend: 'Top customers by spend',
    allTime: 'All time',
    canceled: 'Canceled',
    viewAll: 'View all',
    updatedYesterday: 'Updated yesterday',
  },
  ja: {
    greeting: 'こんにちは',
    today: '概要',
    overview: 'パフォーマンス',
    payOutFunds: '資金を入金',
    netVolume: '純取引高',
    yesterday: '昨日',
    todayLine: '今日',
    usdBalance: 'USD 残高',
    view: '表示',
    availableToPayOut: '入金可能',
    payouts: '入金',
    expectedToday: '本日予定',
    dateRange: '日付範囲',
    last7Days: '過去 7 日間',
    daily: '日次',
    compare: '比較',
    add: '追加',
    edit: '編集',
    nowAt: '現在、午後 2:00',
    midnight: '午前 12:00',
    endOfDay: '午後 11:59',
    payments: '支払い',
    succeeded: '成功',
    uncaptured: '未キャプチャ',
    refunded: '返金済み',
    disputed: '不審請求申請',
    failed: '失敗',
    grossVolume: '総取引高',
    netVolumeFromSales: '売上の純取引高',
    failedPayments: '失敗した支払い',
    cardDeclined: 'カード拒否',
    insufficientFunds: '残高不足',
    lostOrStolenCard: '紛失または盗難カード',
    expiredCard: '期限切れカード',
    other: 'その他',
    newCustomers: '新規顧客',
    topCustomersBySpend: '支出上位の顧客',
    allTime: '全期間',
    canceled: 'キャンセル済み',
    viewAll: 'すべて表示',
    updatedYesterday: '昨日更新',
  },
  de: {
    greeting: 'Guten Tag',
    today: 'Ihre Übersicht',
    overview: 'Leistung',
    payOutFunds: 'Auszahlung starten',
    netVolume: 'Nettovolumen',
    yesterday: 'Gestern',
    todayLine: 'Heute',
    usdBalance: 'USD-Saldo',
    view: 'Anzeigen',
    availableToPayOut: 'Zur Auszahlung verfügbar',
    payouts: 'Auszahlungen',
    expectedToday: 'Heute erwartet',
    dateRange: 'Datumsbereich',
    last7Days: 'Letzte 7 Tage',
    daily: 'Täglich',
    compare: 'Vergleichen',
    add: 'Hinzufügen',
    edit: 'Bearbeiten',
    nowAt: 'Jetzt, 14:00 Uhr',
    midnight: '00:00 Uhr',
    endOfDay: '23:59 Uhr',
    payments: 'Zahlungen',
    succeeded: 'Erfolgreich',
    uncaptured: 'Nicht erfasst',
    refunded: 'Erstattet',
    disputed: 'Angefochten',
    failed: 'Fehlgeschlagen',
    grossVolume: 'Bruttovolumen',
    netVolumeFromSales: 'Nettovolumen aus Verkäufen',
    failedPayments: 'Fehlgeschlagene Zahlungen',
    cardDeclined: 'Karte abgelehnt',
    insufficientFunds: 'Unzureichende Deckung',
    lostOrStolenCard: 'Verlorene oder gestohlene Karte',
    expiredCard: 'Abgelaufene Karte',
    other: 'Sonstige',
    newCustomers: 'Neue Kunden',
    topCustomersBySpend: 'Top-Kunden nach Umsatz',
    allTime: 'Gesamter Zeitraum',
    canceled: 'Storniert',
    viewAll: 'Alle anzeigen',
    updatedYesterday: 'Gestern aktualisiert',
  },
}

function getStickyEaseCurve(type) {
  if (type === 'ease-out') return 'cubic-bezier(0.16, 1, 0.3, 1)'
  if (type === 'framer-smooth') return 'cubic-bezier(0.22, 1, 0.36, 1)'
  if (type === 'framer-soft-slow') return 'cubic-bezier(0.22, 1, 0.36, 1)'
  if (type === 'framer-snappy') return 'cubic-bezier(0.16, 1, 0.3, 1)'
  if (type === 'framer-back') return 'cubic-bezier(0.34, 1.56, 0.64, 1)'
  if (type === 'spring') return 'cubic-bezier(0.34, 1.56, 0.64, 1)'
  if (type === 'framer-spring') return 'cubic-bezier(0.34, 1.2, 0.64, 1)'
  if (type === 'framer-bouncy') return 'cubic-bezier(0.22, 1.65, 0.36, 1)'
  return 'cubic-bezier(0.25, 0.1, 0.25, 1)'
}

const T = color

function getFormattedMonthDay(date = new Date(), language = 'en') {
  if (language !== 'en') {
    return date.toLocaleString(language === 'ja' ? 'ja-JP' : 'de-DE', {
      month: 'short',
      day: 'numeric',
    })
  }
  const day = date.getDate()
  const suffix = day % 10 === 1 && day % 100 !== 11
    ? 'st'
    : day % 10 === 2 && day % 100 !== 12
      ? 'nd'
      : day % 10 === 3 && day % 100 !== 13
        ? 'rd'
        : 'th'
  return `${date.toLocaleString('en-US', { month: 'long' })} ${day}${suffix}`
}

function getFormattedWeekdayMonthDay(date = new Date(), language = 'en') {
  return date.toLocaleString(language === 'ja' ? 'ja-JP' : language === 'de' ? 'de-DE' : 'en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

/* ══════════════════════════════════════════════════════════════════════════
   HERO LINE CHART — static SVG matching the Figma "Home Hero Chart"
   ══════════════════════════════════════════════════════════════════════════ */
const NET_VOLUME_START = 406.39
const USD_BALANCE_START = 9257.51

/* Simulated live sales: every 3–9s net volume (and the USD balance with it)
   goes up by $4–$48. `ticks` counts the increases. */
function useLiveNetVolume() {
  const [live, setLive] = useState({ added: 0, ticks: 0 })
  useEffect(() => {
    let id
    const schedule = () => {
      id = setTimeout(() => {
        const amount = Math.round((4 + Math.random() * 44) * 100) / 100
        setLive((prev) => ({ added: prev.added + amount, ticks: prev.ticks + 1 }))
        schedule()
      }, 3000 + Math.random() * 6000)
    }
    schedule()
    return () => clearTimeout(id)
  }, [])
  return { added: live.added, usdBalance: USD_BALANCE_START + live.added, ticks: live.ticks }
}

/* Metrics the hero can chart. `start` is today's value at 2:00 PM before any
   live sales; `compare` is yesterday's. Volumes grow with each live sale's
   amount, counts by `perSale` per sale. */
const HERO_METRICS = [
  { id: 'grossVolume', label: (ui) => ui.grossVolume, start: 452.8, compare: 161.02 },
  { id: 'newCustomers', label: (ui) => ui.newCustomers, start: 12, compare: 9, perSale: 1 / 3 },
  { id: 'successfulPayments', label: () => 'Successful payments', start: 38, compare: 29, perSale: 1 },
  { id: 'netVolume', label: (ui) => ui.netVolume, start: NET_VOLUME_START, compare: 144.37 },
  { id: 'connectPaymentVolume', label: () => 'Connect payment volume', start: 1284.5, compare: 1020.11 },
  { id: 'connectTransferVolume', label: () => 'Connect transfer volume', start: 968.2, compare: 801.45 },
]
/* Only USD grows with the live sales; the other balances hold steady. */
const BALANCES = [
  { id: 'usd', label: (ui) => ui.usdBalance, currency: 'USD', start: USD_BALANCE_START, live: true },
  { id: 'eur', label: () => 'EUR balance', currency: 'EUR', start: 4120.88 },
  { id: 'gbp', label: () => 'GBP balance', currency: 'GBP', start: 2318.4 },
]
const formatCurrency = (n, currency) => n.toLocaleString('en-US', { style: 'currency', currency })

const formatCount = (n) => Math.round(n).toLocaleString('en-US')
const heroFormat = (metric) => (metric.perSale ? formatCount : formatUsd)
const heroLiveValue = (metric, live) =>
  metric.perSale ? metric.start + Math.floor(live.ticks * metric.perSale) : metric.start + live.added

/* A stable stand-in for a past day's total: yesterday's value scaled 0.6–1.4× by date. */
function heroCompareValue(metric, date) {
  const yesterday = addDays(new Date(), -1)
  if (isSameDay(date, yesterday)) return metric.compare
  const factor = 0.6 + ((date.getDate() * 37 + date.getMonth() * 11 + date.getFullYear()) % 80) / 100
  return metric.perSale ? Math.round(metric.compare * factor) : metric.compare * factor
}

function HeroLineChart({ ui = SEARCH_UI_COPY.en, value, baseline, format, compareLabel, pulseKey }) {
  const w = 671, h = 134
  const chartH = 110
  const yesterdayPath = 'M0,95 L28,92 L56,90 L84,88 L112,86 L140,83 L168,80 L196,76 L224,72 L252,68 L280,65 L308,63 L336,61 L364,59 L392,56 L420,53 L448,51 L476,48 L504,45 L532,42 L560,40 L588,38 L616,36 L644,34 L671,32'
  /* Hourly points from midnight; heights scale so 2:00 PM today reads the metric's starting value. */
  const perPx = baseline / (chartH - 48)
  /* The SVG stretches horizontally only (rendered height === viewBox height),
     so the end dot lives outside it, placed by percentage, to stay round.
     It climbs with the live value, leaving space at the top of the chart. */
  const now = { x: 392, y: Math.max(20, chartH - value / perPx) }
  const todayPath = `M0,98 L28,96 L56,94 L84,92 L112,88 L140,82 L168,76 L196,70 L224,65 L252,62 L280,60 L308,58 L336,56 L364,54 L392,${now.y.toFixed(2)}`
  const nowLeft = `${(now.x / w) * 100}%`
  const hourly = (path, label) => path.match(/[\d.]+,[\d.]+/g).map((pair) => {
    const y = Number(pair.split(',')[1])
    return { y, label, value: format((chartH - y) * perPx) }
  })
  const hoverSeries = [
    { color: T.brand500, points: hourly(todayPath, ui.todayLine) },
    { color: T.neutral100, points: hourly(yesterdayPath, compareLabel) },
  ]
  const hourLabel = (i) => (i === 24 ? '11:59 PM' : `${i % 12 || 12}:00 ${i < 12 ? 'AM' : 'PM'}`)

  return (
    <div className="relative w-full" style={{ height: h }} data-wireframe-role="chart">
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="block">
        <path d={yesterdayPath} fill="none" stroke={T.neutral100} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <path d={todayPath} style={{ d: `path('${todayPath}')`, transition: 'd 400ms ease-out' }} fill="none" stroke={T.brand500} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {Array.from({ length: 25 }).map((_, i) => {
          const x = (i / 24) * w
          return <line key={i} x1={x} y1={chartH} x2={x} y2={chartH + 4} stroke={T.neutral50} strokeWidth="1" vectorEffect="non-scaling-stroke" />
        })}
      </svg>
      <LiveDot pulseKey={pulseKey} style={{ left: nowLeft, top: now.y }} />
      <div className="absolute left-0 right-0 top-0" style={{ height: chartH }}>
        <LineChartHover series={hoverSeries} count={25} title={hourLabel} />
      </div>

      <div className="absolute left-0 flex justify-between w-full" style={{ top: chartH + 8, fontSize: 12, lineHeight: '16px', fontWeight: 400 }}>
        <span style={{ color: T.subdued }}>{ui.midnight}</span>
        <span style={{ color: T.actionPrimary, position: 'absolute', left: nowLeft, transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>{ui.nowAt}</span>
        <span style={{ color: T.subdued, marginLeft: 'auto' }}>{ui.endOfDay}</span>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   OVERVIEW CARDS — built from the shared component library (@dashboard/ui)
   ══════════════════════════════════════════════════════════════════════════ */

const COMPARE_OPTIONS = [
  { value: 'previousPeriod', label: 'Previous period' },
  { value: 'previousMonth', label: 'Previous month' },
  { value: 'previousYear', label: 'Previous year' },
  { value: 'custom', label: 'Custom' },
]
const CHART_POINTS = 7
const DAY_MS = 86400000

function getComparisonRange(range, compare, customRange) {
  const { start, end } = range
  if (compare === 'previousPeriod') {
    const days = Math.round((end - start) / DAY_MS) + 1
    return { start: addDays(start, -days), end: addDays(start, -1) }
  }
  if (compare === 'previousMonth') return { start: addMonths(start, -1), end: addMonths(end, -1) }
  if (compare === 'previousYear') return { start: addMonths(start, -12), end: addMonths(end, -12) }
  if (compare === 'custom') return customRange
  return null
}

const spreadDates = ({ start, end }) =>
  Array.from({ length: CHART_POINTS }, (_, i) => new Date(start.getTime() + ((end - start) * i) / (CHART_POINTS - 1)))

/* What the Performance pills feed the cards: axis + hover labels, whether to
   draw the comparison line, and the range as Ask Console phrases it (prompts
   stay in English, Console's language). */
function getPerformancePeriod(range, interval, comparison) {
  const label = (d) => (interval === 'weekly' ? `Week of ${formatShortDate(d)}` : formatShortDate(d))
  const rangeLabel = formatDateRange(range)
  const phrase = range.preset === 'today' ? 'today'
    : range.preset === 'allTime' ? 'all time'
      : range.preset ? `the ${rangeLabel.toLowerCase()}` : rangeLabel
  return {
    phrase,
    xStart: formatShortDate(range.start),
    xEnd: formatShortDate(range.end),
    labels: spreadDates(range).map(label),
    compareLabels: comparison ? spreadDates(comparison).map(label) : null,
  }
}

const describeDelta = (delta) => `${delta.startsWith('+') ? 'up' : 'down'} ${delta.slice(1)}`

// Ask Console sends the card's contextual prompt to the canonical Console.
function useCardMenu({ title, card, prompt, promptShort, kind = 'chart', listHref }) {
  const { askConsole } = useDashboardConsole()
  const navigate = useNavigate()
  const menu = [
    { label: 'Ask Console', onSelect: () => askConsole({ prompt, shortPrompt: promptShort, card }) },
    { divider: true },
    kind === 'list'
      ? { label: 'View full list', onSelect: listHref ? () => navigate(listHref) : undefined }
      : { label: 'Open chart detail' },
    { label: 'Analyze with Sigma' },
  ]
  return { menu, menuLabel: title }
}

/* `view` is the Transactions › Payments quick-filter chip (by label) each row opens. */
const PAYMENT_SEGMENTS = [
  { share: 65, value: '$130k', color: color.paymentStatus.succeeded, label: (ui) => ui.succeeded, view: 'succeeded' },
  { share: 10, value: '$12k', color: color.paymentStatus.uncaptured, label: (ui) => ui.uncaptured, view: 'uncaptured' },
  { share: 8, value: '$3.2k', color: color.paymentStatus.refunded, label: (ui) => ui.refunded, view: 'refunded' },
  { share: 6, value: '$920', color: color.paymentStatus.disputed, label: (ui) => ui.disputed, view: 'disputed' },
  { share: 4, value: '$1.4k', color: color.paymentStatus.failed, label: (ui) => ui.failed, view: 'failed' },
]

function PaymentsCard({ ui = SEARCH_UI_COPY.en, period }) {
  const navigate = useNavigate()
  const cardMenu = useCardMenu({
    title: ui.payments,
    card: 'payments',
    prompt: `How did my payments break down over ${period.phrase}? $1.4k failed and $920 is disputed`,
    promptShort: 'How did payments break down this week? $1.4k failed, $920 disputed',
  })
  return (
    <Card {...cardMenu}>
      <CardHeader title={ui.payments} />
      <div style={{ marginTop: 15 }}>
        <MeterBar segments={PAYMENT_SEGMENTS.map((s) => ({ value: s.share, color: s.color, label: s.label(ui), display: s.value }))} />
        <div style={{ marginTop: 8 }}>
          <Legend divided items={PAYMENT_SEGMENTS.map((s) => ({ color: s.color, label: s.label(ui), value: s.value, onClick: () => navigate(`/transactions/payments?view=${s.view}`) }))} />
        </div>
      </div>
      <CardFooterLink note={ui.updatedYesterday} href="/transactions/payments">{ui.viewAll}</CardFooterLink>
    </Card>
  )
}

/* Turning Compare off drops the comparison line, its hover row, and the delta. */
function MetricChartCard({ title, value, delta, path1, path2, yLabels, card, prompt, promptShort, hover, period }) {
  const cardMenu = useCardMenu({ title, card, prompt, promptShort })
  const comparing = Boolean(period.compareLabels)
  return (
    <Card {...cardMenu}>
      <CardHeader title={title} />
      <CardMetric value={value} delta={comparing ? delta : undefined} />
      <div style={{ marginTop: 12 }}>
        <LineChart
          path1={path1}
          path2={comparing ? path2 : undefined}
          yLabels={yLabels}
          xStart={period.xStart}
          xEnd={period.xEnd}
          hover={{ ...hover, labels: period.labels, compareLabels: period.compareLabels }}
        />
      </div>
    </Card>
  )
}

const VOLUME_Y_LABELS = ['$40k', '$30k', '$20k', '$10k', '0']

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const formatUsd = (n) => usd.format(n)
const VOLUME_HOVER = { yMax: 40000, format: formatUsd }

function GrossVolumeCard({ ui = SEARCH_UI_COPY.en, period }) {
  return (
    <MetricChartCard
      title={ui.grossVolume} value="$160k" delta="+1.2%" yLabels={VOLUME_Y_LABELS} hover={VOLUME_HOVER} period={period}
      card="grossVolume"
      prompt={`What's driving gross volume over ${period.phrase}? It's at $160k, ${describeDelta('+1.2%')}`}
      promptShort={`What's driving gross volume this week? $160k, ${describeDelta('+1.2%')}`}
      path1="M0,170 L16.67,163 L33.33,153 L50,142 L66.67,125 L83.33,104 L100,80"
      path2="M0,175 L16.67,172 L33.33,168 L50,160 L66.67,150 L83.33,141 L100,130"
    />
  )
}

function NetVolumeFromSalesCard({ ui = SEARCH_UI_COPY.en, period }) {
  return (
    <MetricChartCard
      title={ui.netVolumeFromSales} value="$148k" delta="+1.0%" yLabels={VOLUME_Y_LABELS} hover={VOLUME_HOVER} period={period}
      card="netVolumeFromSales"
      prompt={`What's driving net volume from sales over ${period.phrase}? It's at $148k, ${describeDelta('+1.0%')}`}
      promptShort={`What's driving net sales volume this week? $148k, ${describeDelta('+1.0%')}`}
      path1="M0,170 L16.67,167 L33.33,157 L50,143 L66.67,125 L83.33,108 L100,85"
      path2="M0,172 L16.67,169 L33.33,163 L50,153 L66.67,141 L83.33,130 L100,118"
    />
  )
}

const FAILED_PAYMENTS = [
  { amount: '$1.00', date: 'Oct 3, 6:35 AM', email: 'jenny@example.com', status: 'failed' },
  { amount: '$1.00', date: 'Oct 3, 4:30 AM', email: 'jenny@example.com', status: 'canceled' },
  { amount: '$1.23', date: 'Oct 2, 12:12 AM', email: 'alex@example.com', status: 'canceled' },
  { amount: '₹199.00', date: 'Sep 25, 10:35 PM', email: 'priya@example.com', status: 'canceled' },
]

function FailedPaymentsCard({ ui = SEARCH_UI_COPY.en, period }) {
  const navigate = useNavigate()
  const cardMenu = useCardMenu({
    title: ui.failedPayments,
    card: 'failedPayments',
    kind: 'list',
    listHref: '/transactions/payments',
    prompt: `Why are payments failing over ${period.phrase}? I've had 50 failed, 28 of them card declines`,
    promptShort: 'Why are payments failing this week? 50 failed, 28 declined',
  })
  return (
    <Card {...cardMenu}>
      <CardHeader title={ui.failedPayments} />
      <KeyValueList
        style={{ marginTop: 12 }}
        rows={FAILED_PAYMENTS.map((p) => ({
          label: p.amount,
          description: `${p.date} • ${p.email}`,
          badge: <Badge tone={p.status === 'failed' ? 'critical' : 'default'}>{ui[p.status]}</Badge>,
          onClick: () => navigate('/transactions/payments?view=failed'),
        }))}
      />
      <CardFooterLink align="right" href="/transactions/payments?view=failed">{ui.viewAll}</CardFooterLink>
    </Card>
  )
}

function NewCustomersCard({ ui = SEARCH_UI_COPY.en, period }) {
  return (
    <MetricChartCard
      title={ui.newCustomers} value="65" delta="+1.1%" yLabels={['20', '15', '10', '5', '0']}
      hover={{ yMax: 20, format: (n) => String(Math.round(n)) }} period={period}
      card="newCustomers"
      prompt={`Where did my 65 new customers come from over ${period.phrase}, and how does that compare to the week before?`}
      promptShort="Where did 65 new customers come from, vs. the week before?"
      path1="M0,140 L16.67,151 L33.33,127 L50,110 L66.67,90 L83.33,64 L100,50"
      path2="M0,145 L16.67,139 L33.33,133 L50,123 L66.67,111 L83.33,97 L100,80"
    />
  )
}

const TOP_CUSTOMERS = [
  { name: 'Jenny Rosen', detail: 'jenny.rosen@example.com', spend: '$1,000,000.00' },
  { name: 'alex.smith@example.com', detail: 'cus_TKpdx0GY74TW4R', spend: '$24,200.00' },
  { name: 'Peter Parker', detail: 'spiderman@example.com', spend: '$6,255.00' },
  { name: 'Sam Jones', detail: 'sam.jones@example.com', spend: '$6,168.20' },
]

function TopCustomersCard({ ui = SEARCH_UI_COPY.en, period }) {
  const navigate = useNavigate()
  const cardMenu = useCardMenu({
    title: ui.topCustomersBySpend,
    card: 'topCustomersBySpend',
    kind: 'list',
    listHref: '/customers/all-customers',
    prompt: `Who are my top customers by spend over ${period.phrase}, and what are they buying? Jenny Rosen leads with $1,000,000.00`,
    promptShort: 'What are top spenders buying? Jenny Rosen leads, $1M',
  })
  return (
    <Card {...cardMenu}>
      <CardHeader title={ui.topCustomersBySpend} action={<span style={{ ...type.body, color: color.subdued }}>{ui.allTime}</span>} />
      <KeyValueList
        style={{ marginTop: 12 }}
        rows={TOP_CUSTOMERS.map((c) => ({
          label: c.name,
          description: c.detail,
          value: c.spend,
          onClick: () => navigate('/customers/all-customers'),
        }))}
      />
      <CardFooterLink note={ui.updatedYesterday} href="/customers/all-customers">{ui.viewAll}</CardFooterLink>
    </Card>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN HOME PAGE
   ══════════════════════════════════════════════════════════════════════════ */
export default function DashboardHome() {
  const location = useLocation()
  const searchControls = useSearchPrototypeControls()
  const prototypeView = new URLSearchParams(location.search).get('prototypeView')
  const searchUiLanguage = prototypeView === 'search' ? searchControls.uiLanguage : 'en'
  const ui = SEARCH_UI_COPY[searchUiLanguage] || SEARCH_UI_COPY.en
  const stickyEaseCurve = getStickyEaseCurve(searchControls.stickyEasing)
  const liveVolume = useLiveNetVolume()

  const [heroMetricId, setHeroMetricId] = useState('grossVolume')
  const heroMetric = HERO_METRICS.find((m) => m.id === heroMetricId)
  const heroMetricOptions = HERO_METRICS.map((m) => ({ value: m.id, label: m.label(ui) }))
  const formatHero = heroFormat(heroMetric)
  const heroValue = heroLiveValue(heroMetric, liveVolume)
  const [compareDay, setCompareDay] = useState(() => addDays(startOfDay(new Date()), -1))
  const [compareDayOpen, setCompareDayOpen] = useState(false)
  const closeCompareDay = useCallback(() => setCompareDayOpen(false), [setCompareDayOpen])
  const compareDayRef = useRef(null)
  const today = startOfDay(new Date())
  const compareDayLabel = isSameDay(compareDay, addDays(today, -1)) ? ui.yesterday
    : isSameDay(compareDay, today) ? ui.todayLine
      : formatShortDate(compareDay)

  const [balanceId, setBalanceId] = useState('usd')
  const balance = BALANCES.find((b) => b.id === balanceId)
  const balanceOptions = BALANCES.map((b) => ({ value: b.id, label: b.label(ui) }))
  const balanceValue = balance.live ? liveVolume.usdBalance : balance.start

  const [range, setRange] = useState(() => getPresetRange('last7days'))
  const [chartInterval, setChartInterval] = useState('daily')
  const [compare, setCompare] = useState('previousPeriod')
  const [compareCustom, setCompareCustom] = useState(null)
  const [rangeOpen, setRangeOpen] = useState(false)
  const [compareCustomOpen, setCompareCustomOpen] = useState(false)
  const closeRange = useCallback(() => setRangeOpen(false), [setRangeOpen])
  const closeCompareCustom = useCallback(() => setCompareCustomOpen(false), [setCompareCustomOpen])
  const rangePillRef = useRef(null)
  const comparePillRef = useRef(null)
  const comparison = getComparisonRange(range, compare, compareCustom)
  const period = getPerformancePeriod(range, chartInterval, comparison)
  const intervalOptions = [{ value: 'daily', label: ui.daily }, { value: 'weekly', label: 'Weekly' }]
  const compareValue = compare === 'custom'
    ? formatDateRange(compareCustom)
    : COMPARE_OPTIONS.find((o) => o.value === compare)?.label

  return (
    <div
      className="dashboard-home"
      data-prototype-search-sticky-style={searchControls.stickyStyle}
      data-prototype-search-input-grow-on-click={searchControls.inputGrowOnClick ? 'true' : 'false'}
      data-prototype-search-chrome-shadow={searchControls.chromeSearchShadow ? 'true' : 'false'}
      style={{
        width: '100%',
        padding: `0 ${cappedGutter(HOME_CONTENT_GUTTER)} 80px`,
        fontFamily: "'SF Pro Text', 'SF Pro', system-ui, -apple-system, sans-serif",
        ['--home-search-sticky-top']: `${HOME_TOOLBAR_SEARCH_TOP}px`,
        ['--home-hero-align-top']: `${HOME_HERO_ALIGN_TOP}px`,
        ['--prototype-search-sticky-transition-ms']: `${searchControls.stickyTransitionMs}ms`,
        ['--prototype-search-sticky-easing-curve']: stickyEaseCurve,
      }}
    >

      <div className="dashboard-home-hero-heading">
        <div className="flex items-baseline gap-[8px]">
          <h1 style={type.pageTitle}>
            {searchUiLanguage === 'en' ? (searchControls.greetingCopy || getTimeOfDayGreeting()) : ui.greeting}
          </h1>
          {searchControls.greetingDateEnabled ? (
            <span
              style={{
                ...type.pageTitle,
                fontWeight: 400,
                color: T.neutral400,
                transform: 'translateY(1px)',
              }}
            >
              {searchControls.greetingWeekdayEnabled ? getFormattedWeekdayMonthDay(new Date(), searchUiLanguage) : getFormattedMonthDay(new Date(), searchUiLanguage)}
            </span>
          ) : null}
        </div>
      </div>

      {/* Console stays with the greeting; dashboard Search lives in the toolbar. */}
      <div className="dashboard-home-scroll-context">
        <div className="dashboard-home-search-spacer" aria-hidden="true" />
        <div
          className="dashboard-home-console-input"
        >
          <DashboardHomeSearch fixedMode="console" />
        </div>

        <div className="dashboard-home-page-content">
      {/* ─── Section 2: Account Snapshot ─────────────────────────────── */}
      <div style={{ marginBottom: 40, marginTop: 48 }}>
        <SectionHeader
          title={searchUiLanguage === 'en' ? (searchControls.todayCopy || 'Your overview') : ui.today}
          actions={<Button variant="action">{ui.payOutFunds}</Button>}
        />

        {/* Two-column: chart + sidebar */}
        <div className="flex gap-[40px]" style={{ marginTop: 40 }}>
          <div className="flex-1 min-w-0">
            <div className="flex gap-[40px]">
              <Stat
                style={{ minWidth: 141 }}
                label={<SelectMenu label="Chart metric" value={heroMetricId} options={heroMetricOptions} onChange={setHeroMetricId} trigger={<StatDropdown>{heroMetric.label(ui)}</StatDropdown>} />}
                live
                value={formatHero(heroValue)}
                caption="2:00 PM"
              />
              <Stat
                style={{ minWidth: 141 }}
                label={<StatDropdown ref={compareDayRef} aria-haspopup="dialog" aria-expanded={compareDayOpen} onClick={() => setCompareDayOpen((o) => !o)}>{compareDayLabel}</StatDropdown>}
                value={formatHero(heroCompareValue(heroMetric, compareDay))}
                size="md"
              />
              <DatePicker anchorRef={compareDayRef} open={compareDayOpen} onClose={closeCompareDay} value={compareDay} onChange={setCompareDay} label="Compare with day" />
            </div>
            <div style={{ marginTop: 8 }}>
              <HeroLineChart
                key={heroMetricId}
                ui={ui}
                value={heroValue}
                baseline={heroMetric.start}
                format={formatHero}
                compareLabel={compareDayLabel}
                pulseKey={liveVolume.ticks}
              />
            </div>
          </div>

          <div className="flex flex-col justify-between" style={{ width: 277 }}>
            <Stat
              label={<SelectMenu label="Balance currency" value={balanceId} options={balanceOptions} onChange={setBalanceId} trigger={<StatDropdown>{balance.label(ui)}</StatDropdown>} />}
              live={balance.live}
              value={formatCurrency(balanceValue, balance.currency)}
              caption={ui.availableToPayOut}
              action={<TextLink>{ui.view}</TextLink>}
            />
            <Stat label={ui.payouts} value="$11,633.07" caption={ui.expectedToday} action={<TextLink>{ui.view}</TextLink>} />
          </div>
        </div>
      </div>

      {/* ─── Section 3: Your Overview ────────────────────────────────── */}
      <div>
        <SectionHeader
          divider={false}
          title={searchUiLanguage === 'en' ? (searchControls.overviewCopy || 'Your overview') : ui.overview}
        />

        {/* Time controls row */}
        <div className="flex items-center justify-between" style={{ marginTop: 12 }}>
          <div className="flex items-center gap-[6px]">
            <FilterPill ref={rangePillRef} chevron aria-haspopup="dialog" aria-expanded={rangeOpen} onClick={() => setRangeOpen((o) => !o)}>
              <FilterPillValue label={ui.dateRange} value={range.preset === 'last7days' ? ui.last7Days : formatDateRange(range)} />
            </FilterPill>
            <DateRangePicker anchorRef={rangePillRef} open={rangeOpen} onClose={closeRange} value={range} onApply={setRange} />

            <SelectMenu
              label="Interval"
              value={chartInterval}
              options={intervalOptions}
              onChange={setChartInterval}
              trigger={<FilterPill chevron><FilterPillValue value={intervalOptions.find((o) => o.value === chartInterval).label} /></FilterPill>}
            />

            <span ref={comparePillRef} className="inline-flex">
              <SelectMenu
                label={ui.compare}
                value={compare}
                options={COMPARE_OPTIONS}
                onChange={(next) => (next === 'custom' ? setCompareCustomOpen(true) : setCompare(next))}
                trigger={compare
                  ? <FilterPill chevron onClear={() => setCompare(null)} clearLabel="Remove comparison"><FilterPillValue label={ui.compare} value={compareValue} /></FilterPill>
                  : <FilterPill icon={<PlusCircleIcon />} chevron>{ui.compare}</FilterPill>}
              />
            </span>
            <DateRangePicker
              label="Custom comparison"
              anchorRef={comparePillRef}
              open={compareCustomOpen}
              onClose={closeCompareCustom}
              presets={[]}
              maxDate={addDays(range.start, -1)}
              value={compareCustom ?? { preset: null, ...getComparisonRange(range, 'previousPeriod') }}
              onApply={(next) => { setCompareCustom(next); setCompare('custom') }}
            />
          </div>

          <div className="flex items-center gap-[8px]">
            <Button variant="action" icon={<AddIcon size={12} />}>{ui.add}</Button>
            <Button variant="action" icon={<EditIcon size={12} />}>{ui.edit}</Button>
          </div>
        </div>

        <CardGrid columns={3} variant="tray" style={{ marginTop: 16 }}>
          <PaymentsCard ui={ui} period={period} />
          <GrossVolumeCard ui={ui} period={period} />
          <NetVolumeFromSalesCard ui={ui} period={period} />
          <FailedPaymentsCard ui={ui} period={period} />
          <NewCustomersCard ui={ui} period={period} />
          <TopCustomersCard ui={ui} period={period} />
        </CardGrid>
      </div>
      </div>
      </div>
    </div>
  )
}
