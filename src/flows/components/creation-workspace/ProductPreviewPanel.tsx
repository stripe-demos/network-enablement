'use client'

import { useMemo } from "react"
import { billingLabel, getCurrencySymbol, getPriceDisplay, parseNum, periodLabel, TABULAR_NUMS_STYLE } from "@/components/creation-workspace/previewUtils"

type PriceTier = {
  id: number
  firstUnit: string
  lastUnit: string
  perUnit: string
  flatFee: string
}

type PriceChip = {
  id: string
  name?: string
  amount?: string
  pricingCategory?: string
  pricingModel?: string
  chargeType?: string
  tierMode?: string
  billingPeriod?: string
  currency?: string
  priceType?: string
  usageType?: string
  unitLabel?: string
  packageSize?: string
  taxBehavior?: string
  currencyOptions?: { id: string; currency: string; amount: string }[]
  meterName?: string
  tiers?: PriceTier[]
}

type PreviewRate = PriceChip & { id: string }

type EditorItem = PriceChip & {
  kind?: "price" | "rate-card" | "rate" | "subscription-fee" | "credit-grant"
  expiry?: string
  rates?: PreviewRate[]
}

type ProductPreviewPanelProps = {
  data: Record<string, any>
  allObjects?: any[]
  config?: any
}

// ── Formatting ──────────────────────────────────────────────────────

function formatMoney(value: number, currency = "USD", fractionDigits = 2) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value)
  } catch {
    return `${getCurrencySymbol(currency)}${value.toFixed(fractionDigits)}`
  }
}

/** More decimal places for tiny per-unit prices (e.g. $0.002500). */
function unitPrecision(value: number) {
  const amount = Math.abs(value)
  if (amount > 0 && amount < 0.001) return 6
  if (amount > 0 && amount < 0.01) return 4
  return 2
}

function usageBilledLabel(period?: string) {
  switch (period) {
    case "yearly": return "Usage billed annually"
    case "weekly": return "Usage billed weekly"
    case "daily": return "Usage billed daily"
    default: return "Usage billed monthly"
  }
}

/** Meter display name → key form ("API requests" → "API_requests"). */
function meterKey(name?: string) {
  const trimmed = name?.trim()
  return trimmed ? trimmed.replace(/\s+/g, "_") : ""
}

function unitNoun(price: { unitLabel?: string; chargeType?: string }) {
  if (price.chargeType === "per_package") return "package"
  return price.unitLabel?.trim() || "unit"
}

// ── Normalized structure model ──────────────────────────────────────

type FeeRow = {
  id: string
  label: string
  model: string
  amount: number
  currency: string
  oneTime: boolean
  period?: string
  muted?: boolean
}

type RateRow = {
  id: string
  name: string
  meter: string
  currency: string
  tiered: boolean
  volume: boolean
  perLabel: string
  tiers: PriceTier[]
}

type RateGroup = {
  id: string
  title?: string
  count: number
  billingText: string
  rates: RateRow[]
}

type CreditRow = { id: string; amount: string; name: string }

type Structure = { fees: FeeRow[]; groups: RateGroup[]; credits: CreditRow[] }

function isUsagePrice(price: PriceChip) {
  return price.usageType === "metered"
    || price.pricingCategory === "usage_based"
    || price.pricingCategory === "tiered"
    || price.pricingModel === "graduated"
    || price.pricingModel === "volume"
    || price.chargeType === "per_package"
    || Boolean(price.unitLabel?.trim())
}

function isTieredPrice(price: PriceChip) {
  return price.pricingModel === "graduated" || price.pricingModel === "volume"
}

function toFeeRow(price: PriceChip): FeeRow {
  const oneTime = price.priceType === "one_time"
  const presentation = getPriceDisplay(price)
  return {
    id: price.id,
    label: presentation.title,
    model: presentation.model,
    amount: parseNum(price.amount),
    currency: price.currency ?? "USD",
    oneTime,
    period: price.billingPeriod,
  }
}

function toRateRow(price: PriceChip, fallbackName: string): RateRow {
  const currency = price.currency ?? "USD"
  const tiered = isTieredPrice(price)
  const unitAmount = parseNum(price.amount)
  const noun = unitNoun(price)
  const perLabel = tiered
    ? `Price per ${noun}`
    : `${formatMoney(unitAmount, currency, unitPrecision(unitAmount))} per ${noun}`
  return {
    id: price.id,
    name: price.unitLabel?.trim() || price.meterName?.trim() || fallbackName,
    meter: price.unitLabel?.trim() ? meterKey(price.meterName) : "",
    currency,
    tiered,
    volume: price.pricingModel === "volume",
    perLabel,
    tiers: price.tiers ?? [],
  }
}

function tierRows(rate: RateRow) {
  const currency = rate.currency
  return rate.tiers.map((tier, index) => {
    const lastUnit = (tier.lastUnit ?? "").trim()
    const from = Math.max(0, parseInt(tier.firstUnit ?? "", 10) || 0)
    const infinite = lastUnit === "∞" || lastUnit === ""
    const to = infinite ? null : Math.max(0, parseInt(lastUnit, 10) || 0)

    let label: string
    if (rate.volume) {
      label = infinite
        ? `If total quantity is ${from.toLocaleString()} or more`
        : `If total quantity is ${from.toLocaleString()}–${to!.toLocaleString()}`
    } else if (index === 0) {
      label = infinite
        ? `For the first ${from.toLocaleString()} or more`
        : `For the first ${from.toLocaleString()}–${to!.toLocaleString()}`
    } else {
      label = infinite
        ? `For the next ${from.toLocaleString()} or more`
        : `For the next ${from.toLocaleString()}–${to!.toLocaleString()}`
    }

    const per = parseNum(tier.perUnit)
    const flat = parseNum(tier.flatFee)
    const price = flat > 0
      ? `${formatMoney(per, currency, unitPrecision(per))} + ${formatMoney(flat, currency)} flat`
      : formatMoney(per, currency, unitPrecision(per))

    return { id: tier.id, label, price }
  })
}

// The inline single-price fields the Simple form edits directly.
function inlinePriceFromData(data: Record<string, any>): PriceChip {
  return {
    id: "price-inline-preview",
    name: "Primary price",
    amount: data._inlineAmount ?? "",
    currency: data._inlineCurrency ?? "USD",
    billingPeriod: data._inlineBillingPeriod ?? "monthly",
    taxBehavior: data._inlineTaxBehavior ?? "auto",
    priceType: data._pricingType === "one_off" ? "one_time" : "recurring",
    pricingCategory: "flat_rate",
    pricingModel: "standard",
    usageType: "licensed",
  }
}

function productPricesFromData(data: Record<string, any>): PriceChip[] {
  const prices = Array.isArray(data._prices) ? (data._prices as PriceChip[]) : []
  const hasInlineFields = data._inlineAmount !== undefined || data._pricingType !== undefined || data._inlineCurrency !== undefined
  if (hasInlineFields) return [inlinePriceFromData(data), ...prices.filter((price) => price.id !== "price-inline-preview")]
  if (prices.length > 0) return prices
  return [inlinePriceFromData(data)]
}

/** Product prices → fixed fees + a single usage group. */
function structureFromPrices(data: Record<string, any>): Structure {
  const prices = productPricesFromData(data)
  const configured = prices.some((price) =>
    parseNum(price.amount) > 0 || (price.tiers ?? []).some((tier) => parseNum(tier.perUnit) > 0 || parseNum(tier.flatFee) > 0)
  )

  const fees = prices.filter((price) => !isUsagePrice(price)).map(toFeeRow)
  if (!configured) fees.forEach((fee) => { fee.muted = true })

  const groups = prices.filter(isUsagePrice).map((price) => ({
    id: price.id,
    title: getPriceDisplay(price).title,
    count: 1,
    billingText: usageBilledLabel(price.billingPeriod),
    rates: [toRateRow(price, price.chargeType === "per_package" ? "Packages" : "Units")],
  }))

  return { fees, groups, credits: [] }
}

/** Full-editor items (subscription fees / credit grants / rate cards) → same model. */
function structureFromItems(items: EditorItem[]): Structure {
  const fees: FeeRow[] = []
  const groups: RateGroup[] = []
  const credits: CreditRow[] = []

  items.forEach((item) => {
    if (item.kind === "subscription-fee") {
      fees.push({
        id: item.id,
        label: item.name?.trim() || "Subscription fee",
        model: "Subscription fee",
        amount: parseNum(item.amount),
        currency: item.currency ?? "USD",
        oneTime: false,
        period: item.billingPeriod,
      })
    } else if (item.kind === "credit-grant") {
      credits.push({
        id: item.id,
        amount: formatMoney(parseNum(item.amount), item.currency ?? "USD", 0),
        name: item.name?.trim() || "included credits",
      })
    } else if (item.kind === "rate-card") {
      const rates = (item.rates ?? []).map((rate, index) => toRateRow(rate, `Rate ${index + 1}`))
      groups.push({
        id: item.id,
        title: item.name?.trim() || "Rate card",
        count: rates.length,
        billingText: usageBilledLabel(item.billingPeriod),
        rates,
      })
    } else if (item.kind === "rate" || item.kind === "price") {
      if (isUsagePrice(item)) {
        const presentation = getPriceDisplay(item)
        groups.push({
          id: item.id,
          title: presentation.title,
          count: 1,
          billingText: usageBilledLabel(item.billingPeriod),
          rates: [toRateRow(item, item.chargeType === "per_package" ? "Packages" : "Units")],
        })
      } else {
        fees.push(toFeeRow(item))
      }
    }
  })

  return { fees, groups, credits }
}

// ── Presentational pieces ───────────────────────────────────────────

function FeeInner({ fee }: { fee: FeeRow }) {
  const color = fee.muted ? "#8796A8" : "#142234"
  const billed = fee.oneTime ? "Billed once" : billingLabel(fee.period)
  const per = fee.oneTime ? "One-time" : periodLabel(fee.period)

  return (
    <div className="flex w-full min-w-0 flex-col gap-[4px]">
      <div className="flex items-center justify-between gap-[12px]">
        <div className="flex min-w-0 items-center gap-[6px]">
          <p className="truncate text-[14px] font-[600] leading-[20px] tracking-[-0.15px]" style={{ color }}>
            {fee.label}
          </p>
          {fee.label !== fee.model ? (
            <span className="shrink-0 rounded-full bg-[#F1F6FB] px-[6px] py-[1px] text-[10px] font-[500] leading-[16px] text-[#526378]">
              {fee.model}
            </span>
          ) : null}
        </div>
        <p className="shrink-0 text-right text-[16px] font-[600] leading-[24px] tracking-[-0.31px]" style={{ color, ...TABULAR_NUMS_STYLE }}>
          {formatMoney(fee.amount, fee.currency)}
        </p>
      </div>
      <div className="flex items-center justify-between text-[12px] font-[400] leading-[16px] text-[#526378]">
        <p>{billed}</p>
        <p>{per}</p>
      </div>
    </div>
  )
}

function FeeLine({ fee, railed }: { fee: FeeRow; railed?: boolean }) {
  if (!railed) return <FeeInner fee={fee} />
  return (
    <div className="flex items-stretch gap-[12px]">
      <div className="w-[2px] shrink-0 rounded-full bg-[#D5DEE7]" />
      <FeeInner fee={fee} />
    </div>
  )
}

function RateLine({ rate }: { rate: RateRow }) {
  const rows = rate.tiered ? tierRows(rate) : []
  return (
    <div className="flex items-stretch gap-[12px]">
      <div className="w-[2px] shrink-0 rounded-full bg-[#D5DEE7]" />
      <div className="flex min-w-0 flex-1 flex-col gap-[10px]">
        <div className="flex items-start justify-between gap-[16px]">
          <div className="flex min-w-0 flex-col gap-[4px]">
            <p className="truncate text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#142234]">{rate.name}</p>
            {rate.meter ? <p className="truncate text-[11px] font-[400] leading-[16px] text-[#526378]">{rate.meter}</p> : null}
          </div>
          <p className="shrink-0 whitespace-nowrap text-right text-[12px] font-[400] leading-[16px] text-[#142234]">{rate.perLabel}</p>
        </div>
        {rows.length > 0 && (
          <div className="flex flex-col gap-[2px] pl-[8px]">
            {rows.map((tier) => (
              <div key={tier.id} className="flex items-start justify-between gap-[16px] pt-[4px]">
                <p className="min-w-0 flex-1 overflow-hidden text-ellipsis text-[12px] font-[400] leading-[20px] tracking-[-0.15px] text-[#142234]">{tier.label}</p>
                <p className="shrink-0 whitespace-nowrap pl-[20px] text-right text-[12px] font-[400] leading-[20px] tracking-[-0.15px] text-[#142234]" style={TABULAR_NUMS_STYLE}>{tier.price}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RateGroupBlock({ group }: { group: RateGroup }) {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-[4px] px-[24px] pb-[8px] pt-[16px]">
        {group.title ? (
          <div className="flex items-start justify-between gap-[12px]">
            <p className="truncate text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#142234]">{group.title}</p>
            {group.count > 1 && (
              <span className="shrink-0 whitespace-nowrap rounded-[10px] bg-[#F1F6FB] px-[6px] py-[2px] text-center text-[11px] font-[400] leading-[16px] text-[#526378]">
                {group.count} rates
              </span>
            )}
          </div>
        ) : null}
        <p className="text-[12px] font-[400] leading-[16px] text-[#526378]">{group.billingText}</p>
      </div>
      <div className="flex flex-col gap-[16px] px-[24px] pb-[8px] pt-[16px]">
        {group.rates.map((rate) => <RateLine key={rate.id} rate={rate} />)}
      </div>
    </div>
  )
}

function IncludedCard({ credits }: { credits: CreditRow[] }) {
  return (
    <div className="flex flex-col gap-[8px] rounded-[6px] bg-[#F1F6FB] p-[12px]">
      <div className="flex items-center gap-[4px]">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
          <rect x="1" y="4" width="10" height="7" rx="1.5" stroke="#526378" strokeWidth="1.2" fill="none" />
          <path d="M6 4v7M1 7h10" stroke="#526378" strokeWidth="1.2" fill="none" />
          <circle cx="4.5" cy="2.5" r="1.2" stroke="#526378" strokeWidth="1" fill="none" />
          <circle cx="7.5" cy="2.5" r="1.2" stroke="#526378" strokeWidth="1" fill="none" />
        </svg>
        <p className="text-[12px] font-[500] leading-[20px] tracking-[-0.15px] text-[#142234]">Included</p>
      </div>
      <div className="flex flex-col gap-[4px]">
        {credits.map((credit) => (
          <p key={credit.id} className="text-[12px] font-[400] leading-[20px] tracking-[-0.15px] text-[#142234]" style={TABULAR_NUMS_STYLE}>
            {credit.amount} of {credit.name}
          </p>
        ))}
      </div>
    </div>
  )
}

function ProductIcon({ imageUrl }: { imageUrl?: string | null }) {
  return imageUrl
    ? <img src={imageUrl} alt="" className="h-[32px] w-[32px] shrink-0 rounded-[7px] object-cover" />
    : null
}

// ── Panel ───────────────────────────────────────────────────────────

export function ProductPreviewPanel({ data }: ProductPreviewPanelProps) {
  const items = Array.isArray(data._items) ? (data._items as EditorItem[]) : undefined
  const { fees, groups, credits } = useMemo(
    () => (items ? structureFromItems(items) : structureFromPrices(data)),
    [items, data],
  )

  const productName = data.name?.trim() || "Untitled product"
  const description = typeof data.description === "string" ? data.description.trim() : ""

  // A single fee sits in the header (like a subscription line); extra fees drop to the body.
  const showFeesInHeader = fees.length <= 1
  const headerFees = showFeesInHeader ? fees : []
  const bodyFees = showFeesInHeader ? [] : fees
  const isEmpty = fees.length === 0 && groups.length === 0 && credits.length === 0
  const hasBody = groups.length > 0 || bodyFees.length > 0

  return (
    <div className="h-full w-full min-w-0 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-[24px]">
        <div className="w-full max-w-[480px]">
          {/* Header — product lockup + fixed price + included credits */}
          <div className={`flex flex-col gap-[24px] border border-[#D5DEE7] bg-white p-[24px] ${hasBody ? "rounded-t-[12px] border-b-0" : "rounded-[12px]"}`}>
            <div className="flex min-w-0 items-center gap-[12px]">
              <ProductIcon imageUrl={data.imageUrl} />
              <div className="flex min-w-0 flex-col">
                <p className="truncate text-[20px] font-[600] leading-[24px] tracking-[-0.3px] text-[#142234]">{productName}</p>
                {description ? (
                  <p className="truncate text-[12px] font-[400] leading-[16px] tracking-[-0.1px] text-[#526378]">{description}</p>
                ) : null}
              </div>
            </div>

            {headerFees.map((fee) => <FeeLine key={fee.id} fee={fee} />)}

            {isEmpty && (
              <p className="text-[12px] font-[400] leading-[16px] text-[#526378]">Add a price to preview it here.</p>
            )}

            {credits.length > 0 && <IncludedCard credits={credits} />}
          </div>

          {/* Body — additional fixed fees + usage rates */}
          {hasBody && (
            <div className="flex flex-col overflow-clip rounded-b-[12px] border border-[#D5DEE7] bg-white py-[8px]">
              {bodyFees.length > 0 && (
                <div className="flex flex-col gap-[16px] px-[24px] py-[8px]">
                  {bodyFees.map((fee) => <FeeLine key={fee.id} fee={fee} railed />)}
                </div>
              )}
              {groups.map((group) => <RateGroupBlock key={group.id} group={group} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
