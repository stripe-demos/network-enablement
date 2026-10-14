'use client'

import type { WorkflowObject } from "./useWorkflowState"
import type { WorkflowConfig } from "./workflowConfig"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { useFocusedField } from "@/components/product-catalog/FocusedFieldContext"

type InvoicePreviewProps = {
  data: Record<string, any>
  allObjects: WorkflowObject[]
  config: WorkflowConfig
  highlightUsageLine?: boolean
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00")
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return dateStr
  }
}

type Tier = { firstUnit: string; lastUnit: string; perUnit: string; flatFee: string }

function calculateTieredCost(quantity: number, tiers: Tier[]): { breakdown: { label: string; units: number; cost: number }[]; total: number } {
  let remaining = quantity
  const breakdown: { label: string; units: number; cost: number }[] = []
  let total = 0
  for (const tier of tiers) {
    if (remaining <= 0) break
    const from = parseInt(tier.firstUnit) || 0
    const to = tier.lastUnit === "∞" ? Infinity : (parseInt(tier.lastUnit) || 0)
    const tierSize = to === Infinity ? remaining : (to - from + 1)
    const units = Math.min(remaining, tierSize)
    const perUnit = parseFloat(tier.perUnit || "0")
    const flat = parseFloat(tier.flatFee || "0")
    const cost = units * perUnit + flat
    const rangeLabel = to === Infinity ? `${from.toLocaleString()}+` : `${from.toLocaleString()}–${to.toLocaleString()}`
    breakdown.push({ label: rangeLabel, units, cost })
    total += cost
    remaining -= units
  }
  return { breakdown, total }
}

export function InvoicePreview({ data, allObjects, highlightUsageLine }: InvoicePreviewProps) {
  const { productFormStyle } = useProductFormStyle()
  const { activeField, activeFieldMode } = useFocusedField()
  const customerObj = allObjects.find((o) => o.kind === "customer")
  const products = allObjects.filter((o) => o.kind === "product")
  const coupon = allObjects.find((o) => o.kind === "coupon")
  const lineItemConfigs = (data.lineItemConfigs ?? {}) as Record<string, { quantity: number }>

  const invoiceNumber = data.name || "INV-001"
  const dueDate = data.dueDate ? formatDate(data.dueDate) : "Not set"
  const description = data.description || ""

  const isNewCustomer = data.customerId === "_new"
  const resolvedCustomer = (() => {
    if (isNewCustomer && customerObj && !customerObj.isPlaceholder) {
      return {
        name: customerObj.data.name as string | undefined,
        email: customerObj.data.email as string | undefined,
        phone: customerObj.data.phone as string | undefined,
        address1: customerObj.data.address1 as string | undefined,
        address2: customerObj.data.address2 as string | undefined,
        city: customerObj.data.city as string | undefined,
        state: customerObj.data.state as string | undefined,
        zip: customerObj.data.zip as string | undefined,
      }
    }
    if (data.customerName) {
      return { name: data.customerName as string }
    }
    return null
  })()
  const hasCustomer = resolvedCustomer && resolvedCustomer.name?.trim()

  const prices = allObjects.filter((o) => o.kind === "price")

  type LineItem = {
    name: string
    amount: number
    isUsageBased?: boolean
    billingPeriod?: string
    quantity?: number
    tierBreakdown?: { label: string; units: number; cost: number }[]
  }

  const lineItems: LineItem[] = []
  for (const p of products) {
    const productPrices = prices.filter((pr) => pr.data.productId === p.id)
    const firstPrice = productPrices[0]
    const amount = firstPrice
      ? (parseFloat(firstPrice.data.amount) || parseFloat(p.data.unitPrice) || 0)
      : (parseFloat(p.data.unitPrice) || 0)
    lineItems.push({
      name: p.data.name || "New product",
      amount,
      billingPeriod: firstPrice?.data.billingPeriod as string | undefined,
      isUsageBased: firstPrice?.data.usageType === "metered",
    })
  }
  if (products.length === 0) {
    for (const pr of prices) {
      const model = pr.data.pricingModel as string | undefined
      const isTiered = model === "graduated" || model === "volume"
      const isMetered = pr.data.usageType === "metered"
      const tiers = (pr.data.tiers ?? []) as Tier[]
      const billingPeriod = pr.data.billingPeriod as string | undefined
      const qty = lineItemConfigs[pr.id]?.quantity ?? 0

      if (isTiered && tiers.length > 0) {
        const { breakdown, total } = qty > 0 ? calculateTieredCost(qty, tiers) : { breakdown: [], total: 0 }
        lineItems.push({
          name: pr.data.name || "Price",
          amount: total,
          isUsageBased: isMetered,
          billingPeriod,
          quantity: qty,
          tierBreakdown: breakdown,
        })
      } else if (pr.data.amount) {
        lineItems.push({
          name: pr.data.name || "Price",
          amount: parseFloat(pr.data.amount) || 0,
          isUsageBased: isMetered,
          billingPeriod,
        })
      } else if (isMetered || model) {
        lineItems.push({
          name: pr.data.name || "Price",
          amount: 0,
          isUsageBased: isMetered,
          billingPeriod,
          quantity: qty,
        })
      }
    }
  }

  const invoiceAmount = parseFloat(data.amount) || 0
  const subtotal = lineItems.length > 0
    ? lineItems.reduce((sum, item) => sum + item.amount, 0)
    : invoiceAmount

  const couponData = (() => {
    if (data.couponId === "_new" && coupon?.data.amount) {
      return { name: coupon.data.name, amount: coupon.data.amount, discountType: coupon.data.discountType }
    }
    if (data.couponAmount) {
      return { name: data.couponName, amount: data.couponAmount, discountType: data.couponDiscountType }
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

  const addressParts = [
    resolvedCustomer?.address1,
    resolvedCustomer?.address2,
    [resolvedCustomer?.city, resolvedCustomer?.state].filter(Boolean).join(", "),
    resolvedCustomer?.zip,
  ].filter(Boolean)

  const dueOptions: Record<string, string> = { "0": "On receipt", "7": "Within 7 days", "14": "Within 14 days", "30": "Within 30 days", "60": "Within 60 days", "90": "Within 90 days" }
  const dueLabel = data.due ? (dueOptions[data.due as string] ?? dueDate) : dueDate

  if (productFormStyle === "refresh") {
    return (
      <RefreshInvoiceDocumentPreview
        customerName={resolvedCustomer?.name || ""}
        customerEmail={(data.email as string | undefined) || resolvedCustomer?.email || ""}
        lineItems={lineItems}
        total={total}
        subtotal={subtotal}
        memo={data.memo as string | undefined}
        dueLabel={dueLabel}
        activeField={activeField}
        activeFieldMode={activeFieldMode}
      />
    )
  }

  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto">
      {/* Sizing guideline: never narrower than 420px; on wider screens grows to 50% of the
          column, capped at 640px — but content wider than 640px pushes it wider (up to the
          available column width). */}
      <div className="shrink-0 overflow-clip rounded-[12px] border border-[#D4DEE9] bg-white" style={{ width: "fit-content", minWidth: "clamp(420px, 50%, 640px)", maxWidth: "100%" }}>
        {/* Header + customer */}
        <div className="p-[24px]">
          <p className="text-[20px] font-[600] leading-[24px] tracking-[-0.3px] text-[#1A2C44]">
            {invoiceNumber}
          </p>
          {description && (
            <p className="mt-[2px] text-[12px] font-[400] leading-[16px] tracking-[-0.1px] text-[#3C4F69]">
              {description}
            </p>
          )}

          {hasCustomer && resolvedCustomer && (
            <div className="mt-[16px] flex flex-col gap-[2px]">
              <p className="text-[14px] font-[500] leading-[20px] text-[#1A2C44]">{resolvedCustomer.name}</p>
              {resolvedCustomer.email && (
                <p className="text-[12px] font-[400] leading-[16px] text-[#3C4F69]">{resolvedCustomer.email}</p>
              )}
              {resolvedCustomer.phone && (
                <p className="text-[12px] font-[400] leading-[16px] text-[#3C4F69]">{resolvedCustomer.phone}</p>
              )}
              {addressParts.length > 0 && (
                <p className="text-[12px] font-[400] leading-[16px] text-[#3C4F69]">{addressParts.join(", ")}</p>
              )}
            </div>
          )}
        </div>

        {/* Line items */}
        <div className="border-t border-[#D4DEE9] py-[8px]">
          <div className="flex flex-col">
            {lineItems.length > 0 ? (
              lineItems.map((item, i) => (
                <div key={i} className={`px-[24px] py-[8px] ${highlightUsageLine ? "relative rounded-[6px] bg-[#F9F8FF] ring-1 ring-[#533AFD]/15" : ""}`}>
                  <div className="flex items-start justify-between gap-[12px]">
                    <div className="min-w-0">
                      <div className="flex items-center gap-[6px]">
                        <p className="text-[14px] font-[600] leading-[20px] text-[#1A2C44]">
                          {item.name}
                        </p>
                        {item.isUsageBased && (
                          <span className="rounded-[10px] bg-[#F3F0FF] px-[6px] py-[1px] text-[10px] font-[500] text-[#533AFD]">Usage-based</span>
                        )}
                      </div>
                      <p className="mt-[2px] text-[12px] font-[400] text-[#3C4F69]">
                        {item.billingPeriod ? `Billed ${item.billingPeriod}` : ""}
                        {item.quantity != null && item.quantity > 0 ? `${item.billingPeriod ? " · " : ""}${item.quantity.toLocaleString()} units` : ""}
                        {item.tierBreakdown && item.tierBreakdown.length > 0 ? ` · Graduated pricing` : ""}
                        {!item.billingPeriod && !item.quantity && !item.tierBreakdown ? "Qty 1" : ""}
                      </p>
                    </div>
                    <p className="shrink-0 text-[16px] font-[600] leading-[24px] tracking-[-0.31px] text-[#1A2C44]" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                  {item.tierBreakdown && item.tierBreakdown.length > 0 && (
                    <div className="mt-[6px] flex flex-col gap-[3px] border-l-[2px] border-[#C3B6FB] pl-[12px]">
                      {item.tierBreakdown.map((b, ti) => (
                        <div key={ti} className="flex items-center justify-between">
                          <span className="text-[12px] font-[400] text-[#596171]">{b.label} · {b.units.toLocaleString()} units</span>
                          <span className="text-[12px] font-[500] tabular-nums text-[#1A2C44]">{formatCurrency(b.cost)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : invoiceAmount > 0 ? (
              <div className="flex items-start justify-between gap-[12px] px-[24px] py-[8px]">
                <p className="text-[14px] font-[500] leading-[20px] text-[#1A2C44]">
                  {description || "Invoice amount"}
                </p>
                <p className="shrink-0 text-[16px] font-[600] leading-[24px] tracking-[-0.31px] text-[#1A2C44]" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>
                  {formatCurrency(invoiceAmount)}
                </p>
              </div>
            ) : (
              <p className="px-[24px] py-[8px] text-[12px] font-[400] text-[#9CA3B0]">No line items yet</p>
            )}
          </div>
        </div>

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
            <span className="text-[12px] font-[500] text-[#1A2C44]">{dueLabel}</span>
          </div>
        </div>

        {/* Memo */}
        {data.memo && (
          <div className="border-t border-[#D4DEE9] px-[24px] py-[12px]">
            <p className="text-[12px] font-[400] text-[#3C4F69]">{data.memo}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function refreshPreviewHighlight(
  activeField: string | null,
  activeFieldMode: "focus" | "hover" | null,
  fields: string[],
) {
  if (!activeField || !fields.includes(activeField)) return ""
  const modeClass = activeFieldMode === "hover" ? "preview-field-highlight-hover" : "preview-field-highlight-focus"
  return `${modeClass} rounded-[6px] transition-[background-color,box-shadow] duration-150`
}

function RefreshInvoiceDocumentPreview({
  customerName,
  customerEmail,
  lineItems,
  total,
  subtotal,
  memo,
  dueLabel,
  activeField,
  activeFieldMode,
}: {
  customerName: string
  customerEmail: string
  lineItems: {
    name: string
    amount: number
    isUsageBased?: boolean
    billingPeriod?: string
    quantity?: number
    tierBreakdown?: { label: string; units: number; cost: number }[]
  }[]
  total: number
  subtotal: number
  memo?: string
  dueLabel: string
  activeField: string | null
  activeFieldMode: "focus" | "hover" | null
}) {
  const issueDate = "July 29, 2026"
  const dueDate = dueLabel === "Within 30 days" || dueLabel === "Not set" ? "August 28, 2026" : dueLabel
  const amount = formatCurrency(total)
  const billToName = customerName || "Full name"
  const customerHighlight = refreshPreviewHighlight(activeField, activeFieldMode, ["invoice.customer", "invoice.email"])
  const dateHighlight = refreshPreviewHighlight(activeField, activeFieldMode, ["invoice.due", "invoice.paymentCollection"])
  const itemHighlight = refreshPreviewHighlight(activeField, activeFieldMode, ["invoice.items"])
  const totalHighlight = refreshPreviewHighlight(activeField, activeFieldMode, ["invoice.currency", "invoice.items", "invoice.paymentCollection"])
  const footerHighlight = refreshPreviewHighlight(activeField, activeFieldMode, ["invoice.customFields"])

  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto py-[32px]">
      <div className="w-[540px] max-w-full shrink-0 overflow-hidden rounded-[8px] border border-[#D5DEE7] bg-white shadow-[0_1px_2px_rgba(20,34,52,0.04)]">
        <div className="h-[6px] bg-[#142234]" />
        <div className="px-[44px] pb-[34px] pt-[36px]">
          <div className="flex items-start justify-between gap-[32px]">
            <h2 className="text-[28px] font-[675] leading-[36px] tracking-[-0.35px] text-[#142234]">Invoice</h2>
            <p className="pt-[3px] text-right text-[22px] font-[650] leading-[28px] tracking-[-0.25px] text-[#9AA6B4]">Your business</p>
          </div>

          <div className={`mt-[24px] grid grid-cols-[136px_1fr] gap-x-[10px] gap-y-[4px] px-[2px] py-[2px] text-[13px] leading-[20px] ${dateHighlight}`}>
            <p className="font-[650] text-[#142234]">Invoice number</p>
            <p className="text-[#24364D]">EXAMPLE-0001</p>
            <p className="font-[650] text-[#142234]">Date of issue</p>
            <p className="text-[#24364D]">{issueDate}</p>
            <p className="font-[650] text-[#142234]">Date due</p>
            <p className="text-[#24364D]">{dueDate}</p>
          </div>

          <div className="mt-[24px] text-[13px] leading-[20px]">
            <p className="font-[650] text-[#142234]">Your business</p>
            <p className="mt-[6px] text-[#526378]">354 Oyster Point Blvd</p>
            <p className="mt-[4px] text-[#526378]">South San Francisco, California 94080</p>
            <p className="mt-[4px] text-[#526378]">United States</p>
            <p className="mt-[4px] text-[#526378]">+1 203-555-6789</p>
          </div>

          <div className={`mt-[24px] px-[2px] py-[2px] text-[13px] leading-[20px] ${customerHighlight}`}>
            <p className="font-[650] text-[#142234]">Bill to</p>
            <p className={`mt-[6px] ${customerName ? "text-[#24364D]" : "text-[#9AA6B4]"}`}>{billToName}</p>
            {customerEmail && <p className="mt-[4px] text-[#526378]">{customerEmail}</p>}
          </div>

          <div className={`mt-[30px] px-[2px] py-[2px] ${totalHighlight}`}>
            <p className="text-[23px] font-[675] leading-[30px] tracking-[-0.3px] text-[#142234]">
              {amount} due {dueDate}
            </p>
          </div>

          <div className={`mt-[24px] px-[2px] py-[2px] ${itemHighlight}`}>
            <div className="grid grid-cols-[1fr_56px_84px_84px] border-b border-[#D8E1EA] pb-[9px] text-[12px] font-[650] leading-[18px] text-[#142234]">
              <p>Description</p>
              <p className="text-right">Qty</p>
              <p className="text-right">Unit price</p>
              <p className="text-right">Amount</p>
            </div>
            {lineItems.length > 0 ? (
              lineItems.map((item, index) => (
                <div key={`${item.name}-${index}`} className="grid grid-cols-[1fr_56px_84px_84px] gap-x-[8px] border-b border-[#EEF1F6] py-[10px] text-[12px] leading-[18px]">
                  <div>
                    <p className="font-[600] text-[#142234]">{item.name}</p>
                    <p className="mt-[2px] text-[#526378]">{item.billingPeriod ? `Billed ${item.billingPeriod}` : "Invoice item"}</p>
                  </div>
                  <p className="text-right text-[#526378]">{item.quantity ?? 1}</p>
                  <p className="text-right tabular-nums text-[#526378]">{formatCurrency(item.amount)}</p>
                  <p className="text-right tabular-nums font-[600] text-[#142234]">{formatCurrency(item.amount)}</p>
                </div>
              ))
            ) : null}
          </div>

          <div className={`ml-auto mt-[12px] w-[240px] px-[2px] py-[2px] text-[13px] leading-[20px] ${totalHighlight}`}>
            <div className="flex justify-between text-[#526378]">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
            <div className="mt-[8px] flex justify-between text-[#526378]">
              <span>Total</span>
              <span className="tabular-nums">{amount}</span>
            </div>
            <div className="mt-[9px] flex justify-between border-t border-[#D8E1EA] pt-[9px] font-[675] text-[#142234]">
              <span>Amount due</span>
              <span className="tabular-nums">{amount} USD</span>
            </div>
          </div>

          <div className={`mt-[44px] border-t border-[#D8E1EA] pt-[18px] text-[12px] leading-[18px] text-[#526378] ${footerHighlight}`}>
            {memo ? <p>{memo}</p> : <p>EXAMPLE-0001 · {amount} USD due {dueDate}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
