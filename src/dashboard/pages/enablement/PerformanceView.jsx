// Enablement › Performance — how connected accounts are doing. Six metric cards
// under a filter row; ported from the unbundle-connect prototype.
import { useState } from 'react'
import {
  BarChart, Card, CardHeader, FilterPill, FilterPillValue, FunnelMeter, Icon, IconButton, Legend, LineChart,
  MeterBar, PlusCircleIcon, SelectMenu, color, type, useToast,
} from '@dashboard/ui'
import {
  EMAIL_BAND_HIGH, EMAIL_BAND_LOW, EMAIL_BAND_MID, EMAIL_SERIES, FEATURE_ADOPTION, FUNNEL_STAGES,
  HEALTH_SEGMENTS, SESSION_BARS, SUPPORT_CASES,
} from './enablementData'

const RANGES = [
  { value: 'ytd', label: 'Year to date' },
  { value: 'last12', label: 'Last 12 months' },
  { value: 'last90', label: 'Last 90 days' },
  { value: 'last30', label: 'Last 30 days' },
]
const INTERVALS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

const CHART = { xStart: 'Jan', xEnd: 'Today', height: 128 }
const dashed = { borderStyle: 'dashed' }

export default function PerformanceView() {
  const toast = useToast()
  const [range, setRange] = useState('ytd')
  const [cadence, setCadence] = useState('weekly')
  const labelOf = (options, value) => options.find(o => o.value === value).label

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-wrap items-center gap-[6px]">
        <SelectMenu
          label="Date range"
          value={range}
          options={RANGES}
          onChange={setRange}
          trigger={<FilterPill chevron><FilterPillValue label="Date range" value={labelOf(RANGES, range)} /></FilterPill>}
        />
        <SelectMenu
          label="Interval"
          value={cadence}
          options={INTERVALS}
          onChange={setCadence}
          trigger={<FilterPill chevron>{labelOf(INTERVALS, cadence)}</FilterPill>}
        />
        <FilterPill icon={<PlusCircleIcon />} style={dashed} onClick={() => toast('Group by')}>Group</FilterPill>
        <FilterPill icon={<PlusCircleIcon />} style={dashed} onClick={() => toast('Add filter')}>Filter</FilterPill>
      </div>

      <div className="grid gap-[24px]" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <MetricCard title="Account health" value="86" caption="Good">
          <MeterBar
            height={12}
            segments={HEALTH_SEGMENTS.map((s, i) => ({ ...s, color: color.chartCategorical[i], display: String(s.value) }))}
          />
          <div style={{ marginTop: 8 }}>
            <Legend
              divided
              items={HEALTH_SEGMENTS.map((s, i) => ({ color: color.chartCategorical[i], label: s.label, value: s.value }))}
            />
          </div>
        </MetricCard>

        <MetricCard title="Dashboard activity: sessions count" value="1,121" caption="Year to date">
          <BarChart data={SESSION_BARS} color={color.chartCategorical[0]} yMax={100} yLabels={['100', '50', '0']} {...CHART} />
        </MetricCard>

        <MetricCard title="Support cases" value="30" caption="Year to date">
          <LineChart
            data={SUPPORT_CASES}
            yMax={30}
            rows={3}
            yLabels={['30', '20', '10', '0']}
            stroke={color.chartCategorical[0]}
            strokeWidth={2.5}
            {...CHART}
          />
        </MetricCard>

        <MetricCard
          title="Email / SMS conversion"
          value="3,495"
          delta={<span style={{ fontSize: 13, lineHeight: '16px', fontWeight: 500, color: color.positive }}>51st percentile</span>}
          caption="Open rate"
        >
          <LineChart
            data={EMAIL_SERIES}
            bands={[
              { data: EMAIL_BAND_HIGH, color: color.neutral100, dashed: true },
              { data: EMAIL_BAND_MID, color: color.neutral300, dashed: true },
              { data: EMAIL_BAND_LOW, color: color.neutral100, dashed: true },
            ]}
            yMax={100}
            rows={2}
            yLabels={['100%', '50%', '0']}
            stroke={color.chartCategorical[0]}
            strokeWidth={2.5}
            {...CHART}
          />
        </MetricCard>

        <MetricCard
          title="Onboarding funnel"
          action={<FilterPill active chevron onClick={() => toast('1 recommendation: shorten the payment step')}>1 recommendation</FilterPill>}
        >
          <FunnelMeter stages={FUNNEL_STAGES} scaleLabels={['0%', '50%', '100%']} color={color.chartCategorical[0]} />
        </MetricCard>

        <MetricCard title="Feature adoption rate" value="51%" caption="Year to date">
          <LineChart
            data={FEATURE_ADOPTION}
            yMax={100}
            rows={2}
            yLabels={['100', '50', '0']}
            stroke={color.chartCategorical[0]}
            strokeWidth={2.5}
            {...CHART}
          />
        </MetricCard>
      </div>
    </div>
  )
}

/** Bordered card: title, ↗ open button, big value with caption, then the chart pinned to the bottom. */
function MetricCard({ title, value, delta, caption, action, children }) {
  const toast = useToast()
  return (
    <Card bordered style={{ padding: '16px 20px 20px' }}>
      <CardHeader
        title={title}
        action={
          <div className="flex items-center gap-[6px]">
            {action}
            <IconButton
              variant="ghost"
              label={`Open ${title}`}
              icon={<Icon name="arrowRight12" style={{ transform: 'rotate(-45deg)' }} />}
              onClick={() => toast(`Opened ${title}`)}
            />
          </div>
        }
      />
      {value != null && (
        <div style={{ marginTop: 4 }}>
          <div className="flex items-baseline gap-[8px]">
            <span style={type.pageTitle}>{value}</span>
            {delta}
          </div>
          {caption && <div style={type.caption}>{caption}</div>}
        </div>
      )}
      <div style={{ marginTop: 'auto', paddingTop: 16 }}>{children}</div>
    </Card>
  )
}
