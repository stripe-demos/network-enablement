export function parseNum(v: string | undefined): number {
  if (!v) return 0
  const n = parseFloat(v.replace(/,/g, ""))
  return isNaN(n) ? 0 : n
}

export function getCurrencySymbol(currency: string | undefined): string {
  switch (currency) {
    case "EUR": return "€"
    case "GBP": return "£"
    case "JPY": return "¥"
    default: return "$"
  }
}

export type PriceDisplayData = {
  name?: string
  amount?: string
  currency?: string
  priceType?: string
  pricingCategory?: string
  pricingModel?: string
  chargeType?: string
  tierMode?: string
  billingPeriod?: string
  usageType?: string
  unitLabel?: string
  packageSize?: string
  tiers?: unknown[]
}

function compactPeriod(period?: string): string {
  switch (period) {
    case "daily": return "day"
    case "weekly": return "week"
    case "yearly": return "year"
    default: return "month"
  }
}

function isGenericPriceName(name?: string): boolean {
  return !name || ["price", "primary price", "subscription", "usage"].includes(name.trim().toLowerCase())
}

export function getPriceModelLabel(price: PriceDisplayData): string {
  const category = price.pricingCategory ?? "flat_rate"
  const chargeType = price.chargeType ?? "per_unit"
  const model = chargeType === "per_tier" ? (price.tierMode ?? price.pricingModel) : price.pricingModel
  const usageBased = category === "usage_based" || price.usageType === "metered"

  if (chargeType === "per_tier" || model === "graduated" || model === "volume") {
    return model === "volume" ? "Volume tiers" : "Graduated tiers"
  }
  if (chargeType === "per_package" || model === "package") {
    return usageBased ? "Package usage" : "Package price"
  }
  if (usageBased) return "Per-unit usage"
  if (category === "tiered") return "Per-unit price"
  return "Flat rate"
}

export function getPriceDisplay(price: PriceDisplayData): { title: string; detail: string; model: string } {
  const model = getPriceModelLabel(price)
  const title = isGenericPriceName(price.name) ? model : price.name!.trim()
  const amount = price.amount?.trim()
  const symbol = getCurrencySymbol(price.currency)
  const recurring = price.priceType !== "one_time" && price.priceType !== "one_off"
  const chargeType = price.chargeType ?? "per_unit"
  const tiered = model === "Graduated tiers" || model === "Volume tiers"
  let charge = "Not configured"

  if (tiered) {
    const count = price.tiers?.length ?? 0
    charge = count > 0 ? `${count} ${count === 1 ? "tier" : "tiers"}` : "Tiers not configured"
  } else if (amount) {
    if (chargeType === "per_package" || price.pricingModel === "package") {
      const size = price.packageSize?.trim()
      charge = `${symbol}${amount} / package${size ? ` of ${size}` : ""}`
    } else if (model === "Per-unit usage" || model === "Per-unit price") {
      charge = `${symbol}${amount} / ${price.unitLabel?.trim() || "unit"}`
    } else if (recurring) {
      charge = `${symbol}${amount} / ${compactPeriod(price.billingPeriod)}`
    } else {
      charge = `${symbol}${amount} one-time`
    }
  }

  const shouldAppendBilling = recurring && (tiered || model === "Per-unit usage" || model === "Per-unit price" || model === "Package usage" || model === "Package price")
  const detail = shouldAppendBilling ? `${charge} · ${billingLabel(price.billingPeriod)}` : charge
  return { title, detail, model }
}

export function getCompactPriceLabel(price: PriceDisplayData): string {
  const presentation = getPriceDisplay(price)
  const compactModel: Record<string, string> = {
    "Per-unit usage": "Per unit",
    "Per-unit price": "Per unit",
    "Graduated tiers": "Graduated",
    "Volume tiers": "Volume",
    "Package usage": "Package",
    "Package price": "Package",
  }
  const title = presentation.title === presentation.model
    ? (compactModel[presentation.model] ?? presentation.title)
    : presentation.title
  const amount = price.amount?.trim()
  const symbol = getCurrencySymbol(price.currency)
  const recurring = price.priceType !== "one_time" && price.priceType !== "one_off"
  const chargeType = price.chargeType ?? "per_unit"
  let detail = "$0.00"

  if (presentation.model === "Graduated tiers" || presentation.model === "Volume tiers") {
    const count = price.tiers?.length ?? 0
    detail = count > 0 ? `${count} ${count === 1 ? "tier" : "tiers"}` : "No tiers"
  } else if (amount) {
    if (chargeType === "per_package" || price.pricingModel === "package") detail = `${symbol}${amount}/pkg`
    else if (presentation.model === "Per-unit usage" || presentation.model === "Per-unit price") detail = `${symbol}${amount}/${price.unitLabel?.trim() || "unit"}`
    else if (!recurring) detail = `${symbol}${amount} once`
    else {
      const periods: Record<string, string> = { daily: "day", weekly: "wk", yearly: "yr", monthly: "mo" }
      detail = `${symbol}${amount}/${periods[price.billingPeriod ?? "monthly"] ?? "mo"}`
    }
  }

  return `${title} · ${detail}`
}

export function billingLabel(period: string | undefined): string {
  switch (period) {
    case "daily": return "Billed daily"
    case "weekly": return "Billed weekly"
    case "yearly": return "Billed annually"
    default: return "Billed monthly"
  }
}

export function periodLabel(period: string | undefined): string {
  switch (period) {
    case "daily": return "Per day"
    case "weekly": return "Per week"
    case "yearly": return "Per year"
    default: return "Per month"
  }
}

export const TABULAR_NUMS_STYLE = { fontFeatureSettings: "'lnum' 1, 'pnum' 1" } as const
