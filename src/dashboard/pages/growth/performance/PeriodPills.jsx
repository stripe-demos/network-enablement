// Date range / interval / compare pills for a Performance section, wired like
// Home's Performance row. Interval shows only when the section passes one.
import { useCallback, useRef, useState } from 'react'
import { DateRangePicker, FilterPill, FilterPillValue, SelectMenu, formatDateRange } from '@dashboard/ui'
import { COMPARE_OPTIONS, INTERVAL_OPTIONS } from './performanceData'

export default function PeriodPills({ range, onRangeChange, interval, onIntervalChange, compare, onCompareChange }) {
  const [rangeOpen, setRangeOpen] = useState(false)
  const closeRange = useCallback(() => setRangeOpen(false), [])
  const rangePillRef = useRef(null)
  const labelOf = (options, value) => options.find((o) => o.value === value)?.label

  return (
    <div className="flex items-center gap-[8px]">
      <FilterPill ref={rangePillRef} chevron aria-haspopup="dialog" aria-expanded={rangeOpen} onClick={() => setRangeOpen((o) => !o)}>
        <FilterPillValue label="Date range" value={formatDateRange(range)} />
      </FilterPill>
      <DateRangePicker anchorRef={rangePillRef} open={rangeOpen} onClose={closeRange} value={range} onApply={onRangeChange} align="right" />

      {interval && (
        <SelectMenu
          label="Interval"
          value={interval}
          options={INTERVAL_OPTIONS}
          onChange={onIntervalChange}
          align="right"
          trigger={<FilterPill chevron><FilterPillValue value={labelOf(INTERVAL_OPTIONS, interval)} /></FilterPill>}
        />
      )}

      <SelectMenu
        label="Compare"
        value={compare}
        options={COMPARE_OPTIONS}
        onChange={onCompareChange}
        align="right"
        trigger={<FilterPill chevron><FilterPillValue label="Compare" value={labelOf(COMPARE_OPTIONS, compare)} /></FilterPill>}
      />
    </div>
  )
}
