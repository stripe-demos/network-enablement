// Growth › Performance, from Figma "Connect Growth Studio": Volume, Earnings
// and Account growth sections, each with its own period pills and charts.
import { useState } from 'react'
import { Button, Icon, SectionHeader, TextLink, color, formatShortDate, getPresetRange } from '@dashboard/ui'
import MetricChart from './performance/MetricChart'
import PeriodPills from './performance/PeriodPills'
import { MARGIN_METRICS, NEW_ACCOUNTS_METRIC, REVENUE_METRIC, VOLUME_METRICS, getPeriod } from './performance/performanceData'

export function PerformanceActions() {
  return (
    <>
      <Button icon={<Icon name="customizeBrand" size={14} />}>Customize</Button>
      <Button icon={<Icon name="chat" size={14} />}>Feedback</Button>
    </>
  )
}

const twoUp = { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: 40 }

/* A section's header and pills; children get the period its charts plot. */
function Section({ title, defaultRange, withInterval = false, children }) {
  const [range, setRange] = useState(() => getPresetRange(defaultRange))
  const [interval, setChartInterval] = useState(withInterval ? 'daily' : null)
  const [compare, setCompare] = useState('previousPeriod')
  const period = getPeriod(range, interval ?? 'monthly', compare)

  return (
    <section>
      <SectionHeader
        divider={false}
        title={title}
        actions={(
          <PeriodPills
            range={range} onRangeChange={setRange}
            interval={interval} onIntervalChange={setChartInterval}
            compare={compare} onCompareChange={setCompare}
          />
        )}
      />
      <div className="flex flex-col gap-[32px]" style={{ marginTop: 24 }}>{children(period)}</div>
    </section>
  )
}

export default function PerformanceTab() {
  return (
    <div className="flex flex-col gap-[40px]">
      <Section title="Volume" defaultRange="last7days" withInterval>
        {(period) => (
          <div className="grid" style={twoUp}>
            {VOLUME_METRICS.map((m) => <MetricChart key={m.id} metric={m} period={period} />)}
          </div>
        )}
      </Section>

      <Section title="Earnings" defaultRange="last12months">
        {(period) => (
          <>
            <MetricChart metric={REVENUE_METRIC} period={period} />
            <div>
              <div className="grid" style={twoUp}>
                {MARGIN_METRICS.map((m) => <MetricChart key={m.id} metric={m} period={period} />)}
              </div>
              <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
                <TextLink style={{ fontWeight: 400 }}>View margin report</TextLink>
                <span style={{ fontSize: 12, lineHeight: '16px', color: color.subdued }}>Updated {formatShortDate(new Date())}, 1:15 PM</span>
              </div>
            </div>
          </>
        )}
      </Section>

      <Section title="Account growth" defaultRange="last12months">
        {(period) => <MetricChart metric={NEW_ACCOUNTS_METRIC} period={period} />}
      </Section>
    </div>
  )
}
