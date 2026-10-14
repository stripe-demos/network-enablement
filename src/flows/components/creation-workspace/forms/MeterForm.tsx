'use client'

import { MeterCalculator } from "../MeterCalculator"
import type { WorkflowObject } from "../useWorkflowState"
import { useInvoicePreviewMode } from "../invoicePreviewMode"
import { getFormTokens } from "./shared/formTokens"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"

type MeterFormProps = {
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
  errorFields?: Set<string>
}

export function MeterForm({ data, onChange, errorFields }: MeterFormProps) {
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)
  const { invoicePreviewMode } = useInvoicePreviewMode()
  const set = (key: string, value: string) => onChange({ [key]: value })

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[4px]">
        <label className={tokens.labelClass}>Event name {" · "}<a className="text-[#533AFD] transition-colors hover:text-[#4730E0]" href="https://docs.stripe.com/billing/subscriptions/usage-based" target="_blank" rel="noreferrer">Docs</a></label>
        <input
          className={errorFields?.has("name") ? tokens.errorInputClass : tokens.inputClass}
          placeholder="e.g. api_request"
          value={data.name ?? ""}
          onChange={(e) => set("name", e.target.value)}
        />
        {errorFields?.has("name") && <p className="text-[11px] text-[#DF1B41]">Enter an event name</p>}
        <p className={tokens.helperClass}>
          The event name your app sends to track usage.
        </p>
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={tokens.labelClass}>Display name</label>
        <input
          className={tokens.inputClass}
          placeholder="e.g. API Requests"
          value={data.displayName ?? ""}
          onChange={(e) => set("displayName", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={tokens.labelClass}>Aggregation method</label>
        <select
          className={tokens.selectClass}
          value={data.aggregation ?? "sum"}
          onChange={(e) => set("aggregation", e.target.value)}
        >
          <option value="sum">Sum</option>
          <option value="count">Count</option>
          <option value="max">Max</option>
          <option value="last_during_period">Last during period</option>
        </select>
        <p className={tokens.helperClass}>
          How events are combined within a billing period.
        </p>
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={tokens.labelClass}>Time window</label>
        <select
          className={tokens.selectClass}
          value={data.timeWindow ?? "none"}
          onChange={(e) => set("timeWindow", e.target.value)}
        >
          <option value="none">None (cumulative)</option>
          <option value="hour">Hourly</option>
          <option value="day">Daily</option>
        </select>
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={tokens.labelClass}>Filter expression</label>
        <textarea
          className={tokens.textareaClass}
          placeholder="e.g. model = 'gpt-4'"
          value={data.filterExpression ?? ""}
          onChange={(e) => set("filterExpression", e.target.value)}
        />
        <p className={tokens.helperClass}>
          Optional. Only count events matching this expression.
        </p>
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={tokens.labelClass}>Value key</label>
        <input
          className={tokens.inputClass}
          placeholder="e.g. token_count"
          value={data.valueKey ?? ""}
          onChange={(e) => set("valueKey", e.target.value)}
        />
        <p className={tokens.helperClass}>
          Payload key for the usage quantity. Required for sum/max.
        </p>
      </div>

      {invoicePreviewMode !== "pure-detail" && (
        <div className="border-t border-[#ECF1F6] pt-[12px]">
          <p className="mb-[4px] text-[11px] font-[600] uppercase tracking-[0.5px] text-[#9CA3B0]">Test this meter</p>
          <p className="mb-[10px] text-[11px] text-[#667691]">Send sample events to see how they aggregate.</p>
          <MeterCalculator
            meterName={data.name}
            displayName={data.displayName}
            aggregation={data.aggregation}
            unitPrice={(() => {
              const allObjects = (data._allObjects ?? []) as WorkflowObject[]
              const price = allObjects.find((o) => o.kind === "price" && o.data.usageType === "metered")
              return price?.data?.amount as string | undefined
            })()}
            currency={(() => {
              const allObjects = (data._allObjects ?? []) as WorkflowObject[]
              const price = allObjects.find((o) => o.kind === "price" && o.data.usageType === "metered")
              return price?.data?.currency as string | undefined
            })()}
          />
        </div>
      )}
    </div>
  )
}
