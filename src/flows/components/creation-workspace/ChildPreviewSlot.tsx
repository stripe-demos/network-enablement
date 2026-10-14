'use client'

import { MeterPreviewPanel } from "@/components/creation-workspace/MeterPreviewPanel"
import { PricePreviewPanel } from "@/components/creation-workspace/PricePreviewPanel"

type ChildPreviewSlotProps = {
  kind: string | null
  data: Record<string, any>
  unitPrice?: string
  currency?: string
}

export function ChildPreviewSlot({ kind, data, unitPrice, currency }: ChildPreviewSlotProps) {
  if (kind === "meter") {
    return (
      <div className="flex-1 overflow-y-auto bg-[#F8FAFB] px-[20px] py-[16px]">
        <MeterPreviewPanel
          meters={[{
            name: data.name || "",
            displayName: data.displayName || "",
            aggregation: data.aggregation || "sum",
            valueKey: data.valueKey || "",
          }]}
          unitPrice={unitPrice}
          currency={currency}
        />
      </div>
    )
  }

  if (kind === "price") {
    return (
      <div className="flex-1 overflow-y-auto bg-[#F8FAFB] px-[20px] py-[16px]">
        <PricePreviewPanel data={data} />
      </div>
    )
  }

  return null
}
