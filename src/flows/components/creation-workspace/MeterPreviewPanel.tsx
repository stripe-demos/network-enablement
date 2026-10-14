'use client'

import { useState, useMemo } from "react"
import { useMeterPreviewStyle } from "@/components/creation-workspace/meterPreviewStyle"
import { computeResult } from "@/components/creation-workspace/MeterCalculator"

type MeterConfig = {
  name: string
  displayName?: string
  aggregation: string
  valueKey?: string
  timeWindow?: string
  filterExpression?: string
}

type MeterPreviewPanelProps = {
  meters: MeterConfig[]
  unitPrice?: string
  currency?: string
}

type ExampleEvent = {
  id: number
  value: number
}

const DEFAULT_EVENTS: ExampleEvent[] = [
  { id: 1, value: 15 },
  { id: 2, value: 8 },
  { id: 3, value: 22 },
]

function useSharedState(meter: MeterConfig | undefined, unitPrice?: string, currency?: string) {
  const [events, setEvents] = useState<ExampleEvent[]>(DEFAULT_EVENTS)
  const [nextId, setNextId] = useState(4)

  const eventName = meter?.name || "api_request"
  const valueKey = meter?.valueKey || "value"
  const aggregation = meter?.aggregation || "sum"
  const displayName = meter?.displayName || eventName

  const result = useMemo(() => computeResult(events, aggregation), [events, aggregation])
  const price = parseFloat(unitPrice || "0")
  const currencySymbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$"

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

  return { events, eventName, valueKey, aggregation, displayName, result, price, currencySymbol, addEvent, removeEvent, updateEventValue }
}

// ─── Variant A: Calculator ─────────────────────────────────────────────────────

function CalculatorVariant({ meter, unitPrice, currency }: { meter: MeterConfig; unitPrice?: string; currency?: string }) {
  const { events, aggregation, displayName, result, price, currencySymbol, addEvent, removeEvent, updateEventValue } = useSharedState(meter, unitPrice, currency)

  const aggregationVerb = aggregation === "count" ? "count" : aggregation === "max" ? "max" : aggregation === "last_during_period" ? "last" : "sum"

  const sentence = (() => {
    switch (aggregation) {
      case "sum":
        return <>With <span className="font-[600]">sum</span>, these {events.length} values become <span className="font-[600]">{result}</span> on the invoice</>
      case "count":
        return <>With <span className="font-[600]">count</span>, these {events.length} events become <span className="font-[600]">{result}</span> on the invoice</>
      case "max":
        return <>With <span className="font-[600]">max</span>, the highest value (<span className="font-[600]">{result}</span>) goes on the invoice</>
      case "last_during_period":
        return <>With <span className="font-[600]">last</span>, only the final value (<span className="font-[600]">{result}</span>) goes on the invoice</>
      default:
        return <>These {events.length} values become <span className="font-[600]">{result}</span> on the invoice</>
    }
  })()

  return (
    <div className="flex flex-col overflow-hidden rounded-[12px] border border-[#D4DEE9]">
      <div className="flex flex-col gap-[16px] bg-white p-[24px]">
        {/* Header */}
        <div className="flex flex-col gap-[4px]">
          <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
            {displayName || "Meter"}
          </p>
          <p className="text-[12px] font-[400] leading-[16px] text-[#3C4F69]">
            Aggregation: {aggregationVerb}
          </p>
        </div>

        {/* Event values */}
        <div className="flex flex-wrap items-center gap-[6px]">
          {events.map((evt) => (
            <div key={evt.id} className="group relative">
              <input
                type="number"
                className="h-[32px] w-[48px] rounded-[6px] border border-[#D4DEE9] bg-white text-center text-[12px] font-[500] tabular-nums text-[#1A2C44] outline-none transition-colors focus:border-[#533AFD] focus:ring-1 focus:ring-[#533AFD]/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                value={evt.value}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10)
                  updateEventValue(evt.id, isNaN(v) ? 0 : v)
                }}
              />
              {events.length > 1 && (
                <button
                  type="button"
                  className="absolute -right-[4px] -top-[4px] hidden h-[14px] w-[14px] items-center justify-center rounded-full bg-[#E5E7EB] text-[#6B7280] group-hover:flex"
                  onClick={() => removeEvent(evt.id)}
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="flex h-[32px] w-[32px] items-center justify-center rounded-[6px] border border-dashed border-[#D4DEE9] text-[#9CA3B0] transition-colors hover:border-[#533AFD] hover:text-[#533AFD]"
            onClick={addEvent}
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Result */}
        <div className="flex items-center justify-between border-t border-[#EBEEF1] pt-[12px]">
          <p className="text-[12px] font-[400] leading-[16px] text-[#3C4F69]">
            {sentence}
          </p>
        </div>

        {price > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-[400] text-[#3C4F69]">Billable amount</span>
            <span className="text-[14px] font-[600] tabular-nums text-[#1A2C44]" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>
              {currencySymbol}{(result * price).toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Variant B: Invoice ─────────────────────────────────────────────────────────

function InvoiceVariant({ meter, unitPrice, currency }: { meter: MeterConfig; unitPrice?: string; currency?: string }) {
  const { events, aggregation, displayName, result, price, currencySymbol, addEvent, removeEvent, updateEventValue } = useSharedState(meter, unitPrice, currency)
  const [showEvents, setShowEvents] = useState(false)

  const aggregationLabel = aggregation === "sum" ? "all event values are added together"
    : aggregation === "count" ? "each event counts as 1"
    : aggregation === "max" ? "only the highest value is used"
    : "only the last value is used"

  return (
    <div className="flex flex-col gap-[16px]">
      {/* Invoice line item */}
      <div className="rounded-[8px] border border-[#EBEEF1] bg-white">
        <div className="border-b border-[#F0F2F5] px-[14px] py-[8px]">
          <p className="text-[10px] font-[600] uppercase tracking-[0.4px] text-[#9CA3B0]">Invoice preview</p>
        </div>
        <div className="flex items-center justify-between px-[14px] py-[12px]">
          <div>
            <p className="text-[13px] font-[500] text-[#1A2C44]">{displayName}</p>
            <p className="mt-[2px] text-[11px] text-[#9CA3B0]">
              {result} {aggregation === "count" ? "events" : "units"}{price > 0 ? ` × ${currencySymbol}${price}` : ""}
            </p>
          </div>
          {price > 0 ? (
            <p className="text-[16px] font-[600] tabular-nums text-[#1A2C44]">
              {currencySymbol}{(result * price).toFixed(2)}
            </p>
          ) : (
            <p className="text-[12px] text-[#9CA3B0]">No price set</p>
          )}
        </div>
      </div>

      {/* Event summary */}
      <div>
        <button
          type="button"
          className="flex items-center gap-[4px] text-[12px] text-[#596171] transition-colors hover:text-[#1A2C44]"
          onClick={() => setShowEvents(!showEvents)}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${showEvents ? "rotate-90" : ""}`}>
            <path d="M3 1.5l4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Based on <span className="font-[500]">{events.length} events</span> this period
        </button>

        {showEvents && (
          <div className="mt-[8px] flex flex-wrap gap-[4px]">
            {events.map((evt) => (
              <div key={evt.id} className="group relative">
                <input
                  type="number"
                  className="h-[28px] w-[44px] rounded-[4px] border border-[#EBEEF1] bg-[#FAFBFC] text-center text-[12px] font-[500] tabular-nums text-[#353A44] outline-none focus:border-[#533AFD] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                    <svg width="6" height="6" viewBox="0 0 6 6" fill="none"><path d="M1 1l4 4M5 1l-4 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="flex h-[28px] w-[28px] items-center justify-center rounded-[4px] border border-dashed border-[#D4DEE9] text-[#9CA3B0] hover:border-[#533AFD] hover:text-[#533AFD]"
              onClick={addEvent}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1.5v7M1.5 5h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            </button>
          </div>
        )}
      </div>

      {/* Aggregation explanation */}
      <p className="rounded-[6px] bg-[#F5F6F8] px-[10px] py-[8px] text-[11px] text-[#6C7688]">
        <span className="font-[600] capitalize text-[#353A44]">{aggregation === "last_during_period" ? "Last" : aggregation}</span>: {aggregationLabel}
      </p>
    </div>
  )
}

// ─── Variant C: Narrative ───────────────────────────────────────────────────────

function NarrativeVariant({ meter, unitPrice, currency }: { meter: MeterConfig; unitPrice?: string; currency?: string }) {
  const { events, aggregation, displayName, result, price, currencySymbol, addEvent, removeEvent, updateEventValue } = useSharedState(meter, unitPrice, currency)

  return (
    <div className="flex flex-col gap-[16px]">
      {/* Editable events as chips */}
      <div>
        <p className="mb-[6px] text-[11px] font-[500] text-[#6C7688]">Example events this period</p>
        <div className="flex flex-wrap gap-[4px]">
          {events.map((evt) => (
            <div key={evt.id} className="group relative flex items-center rounded-[14px] border border-[#EBEEF1] bg-white px-[2px]">
              <input
                type="number"
                className="h-[26px] w-[36px] rounded-[12px] bg-transparent text-center text-[12px] font-[500] tabular-nums text-[#1A2C44] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                value={evt.value}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10)
                  updateEventValue(evt.id, isNaN(v) ? 0 : v)
                }}
              />
              {events.length > 1 && (
                <button
                  type="button"
                  className="mr-[2px] hidden h-[16px] w-[16px] items-center justify-center rounded-full text-[#9CA3B0] hover:text-[#596171] group-hover:flex"
                  onClick={() => removeEvent(evt.id)}
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="flex h-[26px] items-center gap-[2px] rounded-[14px] border border-dashed border-[#D4DEE9] px-[8px] text-[11px] text-[#9CA3B0] transition-colors hover:border-[#533AFD] hover:text-[#533AFD]"
            onClick={addEvent}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M4 1v6M1 4h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            add
          </button>
        </div>
      </div>

      {/* Aggregation result */}
      <div className="rounded-[8px] bg-[#F8F5FF] px-[14px] py-[12px]">
        <p className="text-[12px] leading-[18px] text-[#4B3B8A]">
          {aggregation === "sum" && (
            <>Stripe <span className="font-[600]">sums</span> all values: {events.map((e) => e.value).join(" + ")} = <span className="font-[600]">{result}</span></>
          )}
          {aggregation === "count" && (
            <>Stripe <span className="font-[600]">counts</span> {events.length} events = <span className="font-[600]">{result}</span></>
          )}
          {aggregation === "max" && (
            <>Stripe takes the <span className="font-[600]">highest</span>: max({events.map((e) => e.value).join(", ")}) = <span className="font-[600]">{result}</span></>
          )}
          {aggregation === "last_during_period" && (
            <>Stripe uses the <span className="font-[600]">last</span> value: <span className="font-[600]">{result}</span></>
          )}
        </p>
      </div>

      {/* Invoice line */}
      {price > 0 && (
        <div className="flex items-center justify-between rounded-[6px] border border-[#EBEEF1] bg-white px-[12px] py-[8px]">
          <span className="text-[12px] text-[#6C7688]">{result} × {currencySymbol}{price}</span>
          <span className="text-[14px] font-[600] tabular-nums text-[#1A2C44]">{currencySymbol}{(result * price).toFixed(2)}</span>
        </div>
      )}
    </div>
  )
}

// ─── Variant D: Developer ───────────────────────────────────────────────────────

function DeveloperVariant({ meter, unitPrice, currency }: { meter: MeterConfig; unitPrice?: string; currency?: string }) {
  const { events, eventName, valueKey, aggregation, displayName, result, price, currencySymbol, addEvent, removeEvent, updateEventValue } = useSharedState(meter, unitPrice, currency)

  return (
    <div className="flex flex-col gap-[16px]">
      {/* API call preview */}
      <div>
        <p className="mb-[6px] text-[11px] font-[600] uppercase tracking-[0.5px] text-[#6C7688]">
          API call
        </p>
        <div className="rounded-[8px] border border-[#EBEEF1] bg-[#1B2332] px-[12px] py-[8px]">
          <pre className="text-[10px] leading-[16px] text-[#C4CCD8]">
            <span className="text-[#7B8EA8]">POST</span>{" "}
            <span className="text-[#E8ECF0]">/v1/billing/meter_events</span>
            {"\n"}
            <span className="text-[#7B8EA8]">{"{"}</span>
            {"\n"}
            {"  "}<span className="text-[#A78BFA]">&quot;event_name&quot;</span>: <span className="text-[#86EFAC]">&quot;{eventName}&quot;</span>,
            {"\n"}
            {"  "}<span className="text-[#A78BFA]">&quot;payload&quot;</span>: <span className="text-[#7B8EA8]">{"{"}</span>
            {"\n"}
            {"    "}<span className="text-[#A78BFA]">&quot;{valueKey}&quot;</span>: <span className="text-[#FCD34D]">{events[0]?.value ?? 0}</span>,
            {"\n"}
            {"    "}<span className="text-[#A78BFA]">&quot;stripe_customer_id&quot;</span>: <span className="text-[#86EFAC]">&quot;cus_...&quot;</span>
            {"\n"}
            {"  "}<span className="text-[#7B8EA8]">{"}"}</span>
            {"\n"}
            <span className="text-[#7B8EA8]">{"}"}</span>
          </pre>
        </div>
      </div>

      {/* Event list */}
      <div>
        <p className="mb-[4px] text-[11px] font-[600] uppercase tracking-[0.5px] text-[#6C7688]">
          Events ({events.length})
        </p>
        <div className="flex flex-col gap-[3px]">
          {events.map((evt) => (
            <div key={evt.id} className="flex items-center rounded-[4px] border border-[#EBEEF1] bg-white">
              <div className="h-[28px] w-[3px] shrink-0 rounded-l-[4px] bg-[#533AFD]" />
              <span className="px-[8px] text-[10px] text-[#9CA3B0]">{valueKey}:</span>
              <input
                type="number"
                className="h-[28px] w-[40px] border-none bg-transparent text-[12px] font-[500] tabular-nums text-[#1A2C44] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                value={evt.value}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10)
                  updateEventValue(evt.id, isNaN(v) ? 0 : v)
                }}
              />
              <div className="flex-1" />
              <button
                type="button"
                className="flex h-[28px] w-[28px] items-center justify-center text-[#9CA3B0] hover:text-[#596171]"
                onClick={() => removeEvent(evt.id)}
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-[4px] flex items-center gap-[3px] text-[10px] font-[500] text-[#533AFD] hover:text-[#4730E0]"
          onClick={addEvent}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M4 1v6M1 4h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          Add
        </button>
      </div>

      {/* Aggregation */}
      <div className="rounded-[6px] bg-[#F8F5FF] px-[12px] py-[8px]">
        <p className="text-[11px] leading-[16px] text-[#4B3B8A]">
          {aggregation === "sum" && <>{events.map((e) => e.value).join(" + ")} = <span className="font-[600]">{result}</span></>}
          {aggregation === "count" && <>{events.length} events = <span className="font-[600]">{result}</span></>}
          {aggregation === "max" && <>max({events.map((e) => e.value).join(", ")}) = <span className="font-[600]">{result}</span></>}
          {aggregation === "last_during_period" && <>last({events.map((e) => e.value).join(", ")}) = <span className="font-[600]">{result}</span></>}
        </p>
      </div>

      {/* Billing */}
      {price > 0 && (
        <div className="flex items-center justify-between rounded-[6px] border border-[#EBEEF1] px-[12px] py-[6px]">
          <span className="text-[11px] text-[#6C7688]">{result} × {currencySymbol}{price}</span>
          <span className="text-[14px] font-[600] tabular-nums text-[#1A2C44]">{currencySymbol}{(result * price).toFixed(2)}</span>
        </div>
      )}
    </div>
  )
}

// ─── Main export ────────────────────────────────────────────────────────────────

export function MeterPreviewPanel({ meters, unitPrice, currency = "USD" }: MeterPreviewPanelProps) {
  const { meterPreviewStyle } = useMeterPreviewStyle()

  if (meters.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-[360px]">
          <div className="flex flex-col overflow-hidden rounded-[12px] border border-[#D4DEE9]">
            <div className="flex flex-col gap-[16px] bg-white p-[24px]">
              <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#667691]">Meter preview</p>
              <p className="text-[12px] font-[400] leading-[16px] text-[#667691]">
                Configure a meter to see how usage events are aggregated into a billable quantity.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const meter = meters[0]

  const content = (() => {
    switch (meterPreviewStyle) {
      case "calculator":
        return <CalculatorVariant meter={meter} unitPrice={unitPrice} currency={currency} />
      case "invoice":
        return <InvoiceVariant meter={meter} unitPrice={unitPrice} currency={currency} />
      case "narrative":
        return <NarrativeVariant meter={meter} unitPrice={unitPrice} currency={currency} />
      case "developer":
        return <DeveloperVariant meter={meter} unitPrice={unitPrice} currency={currency} />
      default:
        return <CalculatorVariant meter={meter} unitPrice={unitPrice} currency={currency} />
    }
  })()

  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-full max-w-[360px]">
        {content}
      </div>
    </div>
  )
}
