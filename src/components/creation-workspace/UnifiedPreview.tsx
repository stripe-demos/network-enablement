'use client'

import type React from "react"
import type { WorkflowObject } from "./useWorkflowState"
import type { WorkflowConfig } from "./workflowConfig"
import { MeterCalculator } from "./MeterCalculator"
import { parseNum, getCurrencySymbol } from "./previewUtils"

type UnifiedPreviewProps = {
  allObjects: WorkflowObject[]
  activeObjectId: string | null
  activeObjectKind: string | null
  config: WorkflowConfig
  rootKind: string
}

// ── Utilities ──────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency?: string): string {
  const sym = getCurrencySymbol(currency)
  return `${sym}${amount.toFixed(2)}`
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00")
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return dateStr
  }
}

function billingLabel(period: string | undefined): string {
  switch (period) {
    case "daily": return "daily"
    case "weekly": return "weekly"
    case "yearly": return "annually"
    default: return "monthly"
  }
}

function formatTierRange(from: string, to: string): string {
  const f = parseInt(from, 10) || 0
  if (to === "∞") return `${new Intl.NumberFormat().format(f)}+`
  const t = parseInt(to, 10) || 0
  if (f === 0 || f === 1) return `0–${new Intl.NumberFormat().format(t)}`
  return `${new Intl.NumberFormat().format(f)}–${new Intl.NumberFormat().format(t)}`
}

// ── Section wrapper with active highlighting ───────────────────────────

function Section({
  isActive,
  children,
  className = "",
}: {
  isActive: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`transition-all duration-200 ${
        isActive
          ? "border-l-[2px] border-l-[#533AFD] bg-[#FAFAFF]"
          : "border-l-[2px] border-l-transparent"
      } ${className}`}
    >
      {children}
    </div>
  )
}

// ── Inline meter calculator (delegates to shared MeterCalculator) ──────

function MeterDetail({
  meter,
  unitPrice,
  currency,
  isActive,
}: {
  meter: WorkflowObject
  unitPrice?: string
  currency?: string
  isActive: boolean
}) {
  return (
    <Section isActive={isActive}>
      <MeterCalculator
        meterName={(meter.data.name as string) || undefined}
        displayName={(meter.data.displayName as string) || undefined}
        aggregation={(meter.data.aggregation as string) || undefined}
        unitPrice={unitPrice}
        currency={currency}
        className="px-[14px] py-[10px]"
      />
    </Section>
  )
}


// ── Main unified preview ───────────────────────────────────────────────

export function UnifiedPreview({
  allObjects,
  activeObjectId,
  activeObjectKind,
  config,
  rootKind,
}: UnifiedPreviewProps) {
  const rootObj = allObjects.find((o) => o.kind === rootKind)
  const customerObj = allObjects.find((o) => o.kind === "customer")
  const products = allObjects.filter((o) => o.kind === "product")
  const prices = allObjects.filter((o) => o.kind === "price")
  const meters = allObjects.filter((o) => o.kind === "meter")
  const coupon = allObjects.find((o) => o.kind === "coupon")

  const rootData = rootObj?.data ?? {}
  const isRootActive = activeObjectKind === rootKind

  // Invoice fields
  const invoiceNumber = rootData.name || "INV-001"
  const description = (rootData.description as string) || ""
  const dueDate = rootData.dueDate ? formatDate(rootData.dueDate as string) : "Not set"

  // Resolve customer
  const isNewCustomer = rootData.customerId === "_new"
  const isCustomerActive = customerObj?.id === activeObjectId

  // Calculate totals from prices
  const subtotal = prices.reduce((sum, p) => {
    const amt = parseFloat(p.data.amount as string) || 0
    return sum + amt
  }, 0) || (parseFloat(rootData.amount as string) || 0)

  const couponData = (() => {
    if (rootData.couponId === "_new" && coupon?.data.amount) {
      return { name: coupon.data.name, amount: coupon.data.amount, discountType: coupon.data.discountType }
    }
    if (rootData.couponAmount) {
      return { name: rootData.couponName, amount: rootData.couponAmount, discountType: rootData.couponDiscountType }
    }
    return null
  })()

  let discount = 0
  let discountLabel = ""
  if (couponData?.amount) {
    if (couponData.discountType === "percent") {
      const pct = parseFloat(couponData.amount) || 0
      discount = subtotal * (pct / 100)
      discountLabel = `${couponData.name || "Coupon"} (${pct}% off)`
    } else {
      discount = parseFloat(couponData.amount) || 0
      discountLabel = couponData.name || "Coupon"
    }
  }

  const total = Math.max(0, subtotal - discount)

  const rootLabel = config.objectKinds[rootKind]?.label?.toLowerCase() ?? "object"

  // Resolve full customer details
  const fullCustomer = (() => {
    if (isNewCustomer && customerObj && !customerObj.isPlaceholder) {
      const d = customerObj.data
      return {
        name: d.name as string | undefined,
        email: d.email as string | undefined,
        phone: d.phone as string | undefined,
        address1: d.address1 as string | undefined,
        address2: d.address2 as string | undefined,
        city: d.city as string | undefined,
        state: d.state as string | undefined,
        zip: d.zip as string | undefined,
      }
    }
    if (rootData.customerName) {
      return { name: rootData.customerName as string }
    }
    return null
  })()
  const hasCustomer = fullCustomer && fullCustomer.name?.trim()

  const addressParts = [
    fullCustomer?.address1,
    fullCustomer?.address2,
    [fullCustomer?.city, fullCustomer?.state].filter(Boolean).join(", "),
    fullCustomer?.zip,
  ].filter(Boolean)

  return (
    <div className="relative flex h-full items-center justify-center overflow-y-auto">
      <div className="w-full max-w-[432px] overflow-clip rounded-[12px] border border-[#D4DEE9] bg-white">

        {/* Invoice header + customer */}
        <Section isActive={isRootActive || (isCustomerActive ?? false)}>
          <div className="p-[24px]">
            <p className="text-[20px] font-[600] leading-[24px] tracking-[-0.3px] text-[#1A2C44]">
              {invoiceNumber}
            </p>
            {description && (
              <p className="mt-[2px] text-[12px] font-[400] leading-[16px] tracking-[-0.1px] text-[#3C4F69]">{description}</p>
            )}

            {/* Customer details */}
            {hasCustomer && fullCustomer && (
              <div className="mt-[16px] flex flex-col gap-[2px]">
                <p className="text-[14px] font-[500] leading-[20px] text-[#1A2C44]">{fullCustomer.name}</p>
                {fullCustomer.email && (
                  <p className="text-[12px] font-[400] leading-[16px] text-[#3C4F69]">{fullCustomer.email}</p>
                )}
                {fullCustomer.phone && (
                  <p className="text-[12px] font-[400] leading-[16px] text-[#3C4F69]">{fullCustomer.phone}</p>
                )}
                {addressParts.length > 0 && (
                  <p className="text-[12px] font-[400] leading-[16px] text-[#3C4F69]">{addressParts.join(", ")}</p>
                )}
              </div>
            )}
          </div>
        </Section>

        {/* Products with prices and meters — flat list */}
        {(products.length > 0 || prices.length > 0) && (
          <div className="flex flex-col border-t border-[#D4DEE9] py-[8px]">
            {products.map((productObj) => {
              const isActive = productObj.id === activeObjectId
              return (
                <div key={productObj.id}>
                  <Section isActive={isActive}>
                    <div className="flex flex-col gap-[4px] px-[24px] pt-[16px] pb-[8px]">
                      <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
                        {(productObj.data.name as string) || "Untitled product"}
                      </p>
                      {productObj.data.description && (
                        <p className="text-[12px] font-[400] leading-[16px] tracking-[-0.1px] text-[#3C4F69]">
                          {productObj.data.description as string}
                        </p>
                      )}
                    </div>
                  </Section>
                </div>
              )
            })}

            {/* Prices as flat rows */}
            {prices.map((priceObj) => {
              const isPriceActive = priceObj.id === activeObjectId
              const data = priceObj.data
              const sym = getCurrencySymbol(data.currency)
              const amount = parseNum(data.amount)
              const isTiered = data.pricingModel === "graduated" || data.pricingModel === "volume"
              const isRecurring = (data.priceType ?? "recurring") === "recurring"
              const isMetered = data.usageType === "metered"
              const tiers = (data.tiers ?? []) as { id: number; firstUnit: string; lastUnit: string; perUnit: string; flatFee: string }[]
              const label = data.name || (isTiered ? `${data.pricingModel} pricing` : isMetered ? "Usage-based" : "Fixed price")

              const meterForPrice = isMetered
                ? meters.find((m) => m.data.name === data.meterName) ?? meters[0]
                : undefined
              const isMeterActive = meterForPrice?.id === activeObjectId

              return (
                <div key={priceObj.id}>
                  <Section isActive={isPriceActive}>
                    <div className="flex flex-col gap-[4px] px-[24px] py-[8px]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-[6px]">
                          <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">{label}</p>
                          {isMetered && (
                            <span className="rounded-[10px] bg-[#F3F0FF] px-[6px] py-[1px] text-[10px] font-[500] text-[#533AFD]">Usage-based</span>
                          )}
                        </div>
                        {!isTiered && amount > 0 && (
                          <p className="text-[16px] font-[600] leading-[24px] tracking-[-0.31px] text-right text-[#1A2C44]" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>
                            {sym}{amount.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[12px] font-[400] leading-[16px] text-[#3C4F69]">
                        <p>{isRecurring ? `Billed ${billingLabel(data.billingPeriod)}` : "One-time charge"}</p>
                        {isRecurring && !isTiered && <p>Per {(data.billingPeriod as string || "month").replace("ly", "").replace("dai", "day")}</p>}
                        {isTiered && tiers.length > 0 && (
                          <span className="rounded-[10px] bg-[#ECF1F6] px-[6px] py-[1px] text-[11px] font-[400] text-[#3C4F69]">{tiers.length} {tiers.length === 1 ? "tier" : "tiers"}</span>
                        )}
                      </div>

                      {isTiered && tiers.length > 0 && (
                        <div className="mt-[4px] flex flex-col gap-[4px] border-l-[2px] border-[#C3B6FB] pl-[12px]">
                          {tiers.map((tier) => (
                            <div key={tier.id} className="flex items-center justify-between">
                              <p className="text-[12px] font-[400] leading-[16px] text-[#596171]">{formatTierRange(tier.firstUnit, tier.lastUnit)}</p>
                              <p className="text-[12px] font-[500] tabular-nums text-[#1A2C44]" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>{sym}{parseNum(tier.perUnit).toFixed(2)}/unit</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Section>

                  {/* Nested meter detail */}
                  {meterForPrice && (
                    <MeterDetail
                      meter={meterForPrice}
                      unitPrice={data.amount as string}
                      currency={data.currency as string}
                      isActive={isMeterActive}
                    />
                  )}
                </div>
              )
            })}

            {products.length === 0 && prices.length === 0 && (
              <div className="px-[24px] py-[12px]">
                <p className="text-[12px] italic text-[#9CA3B0]">No line items yet</p>
              </div>
            )}
          </div>
        )}

        {/* Empty state when no products or prices */}
        {products.length === 0 && prices.length === 0 && (
          <div className="border-t border-[#D4DEE9] px-[24px] py-[16px]">
            <p className="text-[12px] font-[400] text-[#9CA3B0]">Add products and prices to see how they appear on the invoice.</p>
          </div>
        )}

        {/* Discount */}
        {discount > 0 && (
          <div className="border-t border-[#D4DEE9] px-[24px] py-[12px]">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-[500] text-[#30B063]">{discountLabel}</p>
              <p className="text-[14px] font-[600] text-[#30B063]">-{formatCurrency(discount)}</p>
            </div>
          </div>
        )}

        {/* Total */}
        <div className="border-t border-[#D4DEE9] px-[24px] py-[16px]">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-[600] text-[#1A2C44]">Total due</p>
            <p className="text-[20px] font-[600] leading-[24px] tracking-[-0.3px] tabular-nums text-[#1A2C44]" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>
              {formatCurrency(total)}
            </p>
          </div>
          <div className="mt-[6px] flex items-center justify-between">
            <span className="text-[12px] font-[400] text-[#3C4F69]">Due date</span>
            <span className="text-[12px] font-[500] text-[#1A2C44]">{dueDate}</span>
          </div>
        </div>

        {/* Memo */}
        {rootData.memo && (
          <div className="border-t border-[#D4DEE9] px-[24px] py-[12px]">
            <p className="text-[12px] font-[400] text-[#3C4F69]">{rootData.memo as string}</p>
          </div>
        )}
      </div>
    </div>
  )
}
