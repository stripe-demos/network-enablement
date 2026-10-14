'use client'

import { useMemo } from "react"
import { usePricePreviewStyle } from "@/components/creation-workspace/pricePreviewStyle"
import { parseNum, getCurrencySymbol, billingLabel, periodLabel } from "@/components/creation-workspace/previewUtils"

type PriceTier = {
  id: number
  firstUnit: string
  lastUnit: string
  perUnit: string
  flatFee: string
}

type PricePreviewPanelProps = {
  data: Record<string, any>
  allObjects?: any[]
  config?: any
}

function formatTierRange(from: string, to: string): string {
  const f = parseInt(from, 10) || 0
  if (to === "∞") return `For the next ${new Intl.NumberFormat().format(f)} or more`
  const t = parseInt(to, 10) || 0
  if (f === 0 || f === 1) return `For the first 0–${new Intl.NumberFormat().format(t)}`
  return `For the next ${new Intl.NumberFormat().format(f)}–${new Intl.NumberFormat().format(t)}`
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col overflow-hidden rounded-[12px] border border-[#D4DEE9]">
      <div className="flex flex-col gap-[16px] bg-white p-[24px]">
        <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#667691]">Price preview</p>
        <p className="text-[12px] font-[400] leading-[16px] text-[#667691]">
          Set an amount or choose a tiered pricing model to see how this price will appear on invoices.
        </p>
      </div>
    </div>
  )
}

// ─── Simple variant (structure preview like the pricing plan) ────────────────

function SimpleVariant({ data }: { data: Record<string, any> }) {
  const pricingModel = data.pricingModel ?? "standard"
  const isTiered = pricingModel === "graduated" || pricingModel === "volume"
  const currency = getCurrencySymbol(data.currency ?? "USD")
  const billingPeriod = data.billingPeriod ?? "monthly"
  const unitLabel = (data.unitLabel ?? "unit").trim() || "unit"
  const productName = data._productName ?? "Product"
  const amount = parseNum(data.amount)
  const tiers: PriceTier[] = data.tiers ?? []
  const isRecurring = (data.priceType ?? "recurring") === "recurring"

  return (
    <div className="flex flex-col overflow-hidden rounded-[12px] border border-[#D4DEE9]">
      {/* Header */}
      <div className="flex flex-col gap-[16px] border-b border-[#D4DEE9] bg-white p-[24px]">
        <p className="text-[20px] font-[600] leading-[24px] tracking-[-0.3px] text-[#1A2C44]">{productName}</p>

        {/* Standard/Package pricing line */}
        {!isTiered && (
          <div className="flex flex-col gap-[4px]">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
                {isRecurring ? "Subscription" : "One-time"} price
              </p>
              <p className="text-[16px] font-[600] leading-[24px] tracking-[-0.31px] text-[#1A2C44]" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>
                {currency}{amount.toFixed(2)}
              </p>
            </div>
            <div className="flex items-center justify-between text-[12px] font-[400] leading-[16px] text-[#3C4F69]">
              <p>{isRecurring ? billingLabel(billingPeriod) : "One-time charge"}</p>
              {isRecurring && <p>{periodLabel(billingPeriod)}</p>}
            </div>
            {unitLabel !== "unit" && (
              <p className="text-[11px] font-[400] leading-[16px] text-[#667691]">Per {unitLabel}</p>
            )}
          </div>
        )}
      </div>

      {/* Tiered rates section */}
      {isTiered && tiers.length > 0 && (
        <div className="flex flex-col bg-white px-[24px] py-[16px]">
          <div className="flex flex-col gap-[4px]">
            <div className="flex items-start justify-between gap-[12px]">
              <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
                {pricingModel === "graduated" ? "Graduated" : "Volume"} pricing
              </p>
              <span className="shrink-0 whitespace-nowrap rounded-[10px] bg-[#ECF1F6] px-[6px] py-[2px] text-center text-[11px] font-[400] leading-[16px] text-[#3C4F69]">
                {tiers.length} {tiers.length === 1 ? "tier" : "tiers"}
              </span>
            </div>
            <p className="text-[12px] font-[400] leading-[16px] text-[#3C4F69]">
              {isRecurring ? billingLabel(billingPeriod) : "One-time charge"}
            </p>
          </div>

          <div className="mt-[12px] flex flex-col gap-[8px] pl-[12px] border-l border-[#C3B6FB]">
            {tiers.map((tier) => (
              <div key={tier.id} className="flex items-center justify-between">
                <p className="text-[12px] font-[400] leading-[16px] text-[#1A2C44]">
                  {formatTierRange(tier.firstUnit, tier.lastUnit)}
                </p>
                <p className="text-[12px] font-[500] tabular-nums text-[#1A2C44]" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>
                  {currency}{parseNum(tier.perUnit).toFixed(2)}/{unitLabel}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Invoice variant ─────────────────────────────────────────────────────────

function InvoiceVariant({ data }: { data: Record<string, any> }) {
  const pricingModel = data.pricingModel ?? "standard"
  const isTiered = pricingModel === "graduated" || pricingModel === "volume"
  const currency = getCurrencySymbol(data.currency ?? "USD")
  const billingPeriod = data.billingPeriod ?? "monthly"
  const unitLabel = (data.unitLabel ?? "unit").trim() || "unit"
  const productName = data._productName ?? "Product"
  const amount = parseNum(data.amount)
  const tiers: PriceTier[] = data.tiers ?? []
  const isRecurring = (data.priceType ?? "recurring") === "recurring"
  const quantity = 100

  const total = useMemo(() => {
    if (!isTiered) return amount * quantity
    let sum = 0
    let remaining = quantity
    if (pricingModel === "volume") {
      const activeTier = tiers.find((t) => quantity <= (t.lastUnit === "∞" ? Infinity : parseNum(t.lastUnit))) ?? tiers[tiers.length - 1]
      if (activeTier) sum = quantity * parseNum(activeTier.perUnit) + parseNum(activeTier.flatFee)
    } else {
      for (const tier of tiers) {
        if (remaining <= 0) break
        const from = parseNum(tier.firstUnit)
        const to = tier.lastUnit === "∞" ? Infinity : parseNum(tier.lastUnit)
        const tierUnits = Math.min(remaining, to - from + 1)
        sum += tierUnits * parseNum(tier.perUnit) + parseNum(tier.flatFee)
        remaining -= tierUnits
      }
    }
    return sum
  }, [isTiered, amount, tiers, quantity, pricingModel])

  return (
    <div className="flex flex-col overflow-hidden rounded-[12px] border border-[#D4DEE9]">
      {/* Header */}
      <div className="flex flex-col gap-[4px] border-b border-[#D4DEE9] bg-white p-[24px]">
        <p className="text-[20px] font-[600] leading-[24px] tracking-[-0.3px] text-[#1A2C44]">{productName}</p>
        <p className="text-[12px] font-[400] leading-[16px] text-[#3C4F69]">
          Sample invoice for {quantity} {unitLabel}s
        </p>
      </div>

      {/* Line items */}
      <div className="flex flex-col bg-white">
        <div className="flex items-center justify-between border-b border-[#F0F2F5] px-[24px] py-[12px]">
          <div>
            <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
              {productName}
            </p>
            {!isTiered && (
              <p className="text-[12px] font-[400] leading-[16px] text-[#3C4F69]">
                {quantity} {unitLabel}s × {currency}{amount.toFixed(2)}
              </p>
            )}
            {isTiered && (
              <p className="text-[12px] font-[400] leading-[16px] text-[#3C4F69]">
                {pricingModel} pricing · {quantity} {unitLabel}s
              </p>
            )}
          </div>
          <p className="text-[14px] font-[600] tabular-nums text-[#1A2C44]" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>
            {currency}{total.toFixed(2)}
          </p>
        </div>

        {/* Tiered breakdown */}
        {isTiered && tiers.length > 0 && (
          <div className="border-b border-[#F0F2F5] px-[24px] py-[10px]">
            <div className="flex flex-col gap-[4px] pl-[12px] border-l border-[#C3B6FB]">
              {tiers.map((tier) => (
                <div key={tier.id} className="flex items-center justify-between">
                  <p className="text-[12px] font-[400] leading-[16px] text-[#596171]">
                    {formatTierRange(tier.firstUnit, tier.lastUnit)}
                  </p>
                  <p className="text-[12px] tabular-nums text-[#353A44]" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>
                    {currency}{parseNum(tier.perUnit).toFixed(6)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="flex flex-col gap-[4px] px-[24px] py-[12px]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-[400] text-[#3C4F69]">Subtotal</span>
            <span className="text-[12px] font-[500] tabular-nums text-[#1A2C44]" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>{currency}{total.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-[400] text-[#3C4F69]">Tax</span>
            <span className="text-[12px] tabular-nums text-[#9CA3B0]">—</span>
          </div>
          <div className="flex items-center justify-between border-t border-[#EBEEF1] pt-[8px]">
            <span className="text-[14px] font-[600] text-[#1A2C44]">Total {isRecurring ? periodLabel(billingPeriod).toLowerCase() : ""}</span>
            <span className="text-[16px] font-[600] tabular-nums text-[#1A2C44]" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>{currency}{total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Receipt variant ─────────────────────────────────────────────────────────

function ReceiptVariant({ data }: { data: Record<string, any> }) {
  const pricingModel = data.pricingModel ?? "standard"
  const isTiered = pricingModel === "graduated" || pricingModel === "volume"
  const currency = getCurrencySymbol(data.currency ?? "USD")
  const billingPeriod = data.billingPeriod ?? "monthly"
  const unitLabel = (data.unitLabel ?? "unit").trim() || "unit"
  const productName = data._productName ?? "Product"
  const amount = parseNum(data.amount)
  const tiers: PriceTier[] = data.tiers ?? []
  const isRecurring = (data.priceType ?? "recurring") === "recurring"
  const quantity = 1000

  const total = useMemo(() => {
    if (!isTiered) return amount * quantity
    let sum = 0
    let remaining = quantity
    if (pricingModel === "volume") {
      const activeTier = tiers.find((t) => quantity <= (t.lastUnit === "∞" ? Infinity : parseNum(t.lastUnit))) ?? tiers[tiers.length - 1]
      if (activeTier) sum = quantity * parseNum(activeTier.perUnit) + parseNum(activeTier.flatFee)
    } else {
      for (const tier of tiers) {
        if (remaining <= 0) break
        const from = parseNum(tier.firstUnit)
        const to = tier.lastUnit === "∞" ? Infinity : parseNum(tier.lastUnit)
        const tierUnits = Math.min(remaining, to - from + 1)
        sum += tierUnits * parseNum(tier.perUnit) + parseNum(tier.flatFee)
        remaining -= tierUnits
      }
    }
    return sum
  }, [isTiered, amount, tiers, quantity, pricingModel])

  const taxRate = 0.05
  const tax = total * taxRate

  return (
    <div className="flex flex-col overflow-hidden rounded-[12px] border border-[#D4DEE9]">
      {/* Header */}
      <div className="flex flex-col gap-[4px] border-b border-[#D4DEE9] bg-white p-[24px]">
        <p className="text-[20px] font-[600] leading-[24px] tracking-[-0.3px] text-[#1A2C44]">{productName}</p>
        <p className="text-[12px] font-[400] leading-[16px] text-[#3C4F69]">
          Estimated receipt for {new Intl.NumberFormat().format(quantity)} {unitLabel}s
        </p>
      </div>

      {/* Breakdown */}
      <div className="flex flex-col bg-white px-[24px] py-[16px]">
        {/* Main charge */}
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
            {productName}
          </p>
          <p className="text-[14px] font-[600] tabular-nums text-[#1A2C44]" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>
            {currency}{total.toFixed(2)}
          </p>
        </div>
        <p className="text-[12px] font-[400] leading-[16px] text-[#3C4F69]">
          {new Intl.NumberFormat().format(quantity)} {unitLabel}s · {!isTiered ? `${currency}${amount.toFixed(2)} each` : `${pricingModel} pricing`}
        </p>

        {/* Tiers */}
        {isTiered && tiers.length > 0 && (
          <div className="mt-[12px] flex flex-col gap-[6px] pl-[12px] border-l border-[#C3B6FB]">
            {tiers.map((tier) => (
              <div key={tier.id} className="flex items-center justify-between">
                <p className="text-[12px] font-[400] leading-[16px] text-[#596171]">
                  {formatTierRange(tier.firstUnit, tier.lastUnit)}
                </p>
                <p className="text-[12px] tabular-nums text-[#353A44]" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>
                  {currency}{parseNum(tier.perUnit).toFixed(6)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        <div className="mt-[16px] flex flex-col gap-[4px] border-t border-[#EBEEF1] pt-[12px]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-[400] text-[#3C4F69]">Subtotal</span>
            <span className="text-[12px] font-[500] tabular-nums text-[#1A2C44]" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>{currency}{total.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-[400] text-[#3C4F69]">Tax (5%)</span>
            <span className="text-[12px] tabular-nums text-[#353A44]" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>{currency}{tax.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-[#EBEEF1] pt-[8px]">
            <span className="text-[14px] font-[600] text-[#1A2C44]">
              Total {isRecurring ? periodLabel(billingPeriod).toLowerCase() : ""}
            </span>
            <span className="text-[16px] font-[600] tabular-nums text-[#1A2C44]" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>
              {currency}{(total + tax).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main export ────────────────────────────────────────────────────────────────

export function PricePreviewPanel({ data }: PricePreviewPanelProps) {
  const { pricePreviewStyle } = usePricePreviewStyle()

  const hasData = data.amount || (data.tiers && data.tiers.length > 0)

  if (!hasData && (data.pricingModel ?? "standard") === "standard") {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState />
      </div>
    )
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-full max-w-[360px]">
        {pricePreviewStyle === "simple" && <SimpleVariant data={data} />}
        {pricePreviewStyle === "invoice" && <InvoiceVariant data={data} />}
        {pricePreviewStyle === "receipt" && <ReceiptVariant data={data} />}
      </div>
    </div>
  )
}
