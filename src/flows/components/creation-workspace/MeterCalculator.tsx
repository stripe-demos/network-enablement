'use client'

import { useState, useMemo } from "react"
import { getCurrencySymbol } from "./previewUtils"

export { getCurrencySymbol }

type ExampleEvent = { id: number; value: number }

const DEFAULT_EVENTS: ExampleEvent[] = [
  { id: 1, value: 15 },
  { id: 2, value: 8 },
  { id: 3, value: 22 },
]

export function computeResult(events: ExampleEvent[], aggregation: string): number {
  if (events.length === 0) return 0
  switch (aggregation) {
    case "sum": return events.reduce((acc, e) => acc + e.value, 0)
    case "count": return events.length
    case "max": return Math.max(...events.map((e) => e.value))
    case "last_during_period": return events[events.length - 1].value
    default: return events.reduce((acc, e) => acc + e.value, 0)
  }
}

export function MeterCalculator({
  meterName,
  displayName,
  aggregation,
  unitPrice,
  currency,
  className,
}: {
  meterName?: string
  displayName?: string
  aggregation?: string
  unitPrice?: string
  currency?: string
  className?: string
}) {
  const [events, setEvents] = useState<ExampleEvent[]>(DEFAULT_EVENTS)
  const [nextId, setNextId] = useState(4)

  const agg = aggregation || "sum"
  const name = displayName || meterName || "api_request"

  const result = useMemo(() => computeResult(events, agg), [events, agg])
  const price = parseFloat(unitPrice || "0")
  const sym = getCurrencySymbol(currency)

  const addEvent = () => {
    const value = Math.floor(Math.random() * 20) + 1
    setEvents((prev) => [...prev, { id: nextId, value }])
    setNextId((n) => n + 1)
  }

  const removeEvent = (id: number) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  const updateEventValue = (id: number, value: number) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, value } : e)))
  }

  const sentence = (() => {
    switch (agg) {
      case "sum":
        return <>With <strong className="font-[600]">sum</strong>, {events.length} values &rarr; <strong className="font-[600]">{result}</strong> units</>
      case "count":
        return <>With <strong className="font-[600]">count</strong>, {events.length} events &rarr; <strong className="font-[600]">{result}</strong></>
      case "max":
        return <>With <strong className="font-[600]">max</strong>, highest value is <strong className="font-[600]">{result}</strong></>
      case "last_during_period":
        return <>With <strong className="font-[600]">last</strong>, final value is <strong className="font-[600]">{result}</strong></>
      default:
        return <>{events.length} values &rarr; <strong className="font-[600]">{result}</strong> units</>
    }
  })()

  return (
    <div className={`flex flex-col gap-[8px] ${className ?? ""}`}>
      <div className="flex items-center gap-[6px]">
        <span className="text-[11px] font-[500] text-[#667691]">Meter: {name}</span>
        <span className="rounded-[10px] bg-[#F3F0FF] px-[5px] py-[1px] text-[9px] font-[500] text-[#533AFD]">
          {agg}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-[4px]">
        {events.map((evt) => (
          <div key={evt.id} className="group relative">
            <input
              type="number"
              className="h-[26px] w-[40px] rounded-[4px] border border-[#D4DEE9] bg-white text-center text-[11px] font-[500] tabular-nums text-[#1A2C44] outline-none transition-colors focus:border-[#533AFD] focus:ring-1 focus:ring-[#533AFD]/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              value={evt.value}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                updateEventValue(evt.id, isNaN(v) ? 0 : v)
              }}
            />
            {events.length > 1 && (
              <button
                type="button"
                className="absolute -right-[3px] -top-[3px] hidden h-[12px] w-[12px] items-center justify-center rounded-full bg-[#E5E7EB] text-[#6B7280] group-hover:flex"
                onClick={() => removeEvent(evt.id)}
              >
                <svg width="6" height="6" viewBox="0 0 8 8" fill="none"><path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="flex h-[26px] w-[26px] items-center justify-center rounded-[4px] border border-dashed border-[#D4DEE9] text-[#9CA3B0] transition-colors hover:border-[#533AFD] hover:text-[#533AFD]"
          onClick={addEvent}
        >
          <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
        </button>
      </div>

      <p className="text-[11px] font-[400] leading-[16px] text-[#3C4F69]">{sentence}</p>

      {price > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-[400] text-[#3C4F69]">Billable amount</span>
          <span className="text-[12px] font-[600] tabular-nums text-[#1A2C44]" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>
            {sym}{(result * price).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  )
}
