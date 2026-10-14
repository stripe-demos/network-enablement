'use client'

import { MeterPreviewPanel } from "@/components/creation-workspace/MeterPreviewPanel"

type MeterPreviewProps = {
  data: Record<string, any>
  allObjects?: any[]
  config?: any
}

/**
 * Workspace preview slot wrapper for the meter.
 * Derives the meter config from the active meter object's data and renders
 * the live simulation panel.
 */
export function MeterPreview({ data }: MeterPreviewProps) {
  const meters = [
    {
      name: data.name || "",
      displayName: data.displayName || "",
      aggregation: data.aggregation || "sum",
      valueKey: data.valueKey || "",
      timeWindow: data.timeWindow || "",
      filterExpression: data.filterExpression || "",
    },
  ]

  return (
    <div className="p-[16px]">
      <MeterPreviewPanel
        meters={meters}
        unitPrice={data._parentUnitPrice}
        currency={data._parentCurrency}
      />
    </div>
  )
}
