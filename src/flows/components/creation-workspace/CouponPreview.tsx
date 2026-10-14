'use client'

import { EXISTING_PRODUCTS } from "@/components/creation-workspace/forms/shared/mockEntities"

// A live preview of the coupon being built — a discount "ticket" card that updates
// as the CouponForm data changes. Takes the same `data` object the form writes to.
// Neutral, style-agnostic styling (like BuyButtonPreview): the preview is the result,
// not form chrome, so it doesn't track the UI-style toggle.

type CouponPreviewProps = {
  data: Record<string, any>
}

const CURRENCY_SYMBOL: Record<string, string> = { USD: "$", CAD: "$", EUR: "€", GBP: "£", JPY: "¥" }

function discountHeadline(data: Record<string, any>): { text: string; muted: boolean } {
  const isFixed = (data.discountType ?? "Percentage off") === "Fixed amount off"
  const amount = (data.amount ?? "").toString().trim()
  if (isFixed) {
    const sym = CURRENCY_SYMBOL[data.currency ?? "USD"] ?? "$"
    return amount ? { text: `${sym}${amount} off`, muted: false } : { text: `${sym}0 off`, muted: true }
  }
  return amount ? { text: `${amount}% off`, muted: false } : { text: "0% off", muted: true }
}

function durationLabel(data: Record<string, any>): string {
  const d = data.duration ?? "once"
  if (d === "forever") return "Forever"
  if (d === "repeating") {
    const months = (data.durationMonths ?? "").toString().trim()
    return months ? `${months} months` : "Multiple months"
  }
  return "Once"
}

function scopeLabel(data: Record<string, any>): string {
  if (!data.appliesToProducts) return "All products"
  const scopes: { productId: string }[] = data.productScopes ?? []
  const named = scopes
    .map((s) => EXISTING_PRODUCTS.find((p) => p.id === s.productId)?.name)
    .filter(Boolean) as string[]
  if (named.length === 0) return "Select products"
  if (named.length === 1) return named[0]
  return `${named.length} products`
}

function codeLabel(data: Record<string, any>): { text: string; isCode: boolean } {
  if (!data.hasCouponCodes) return { text: "Applied automatically", isCode: false }
  const first = (data.codes ?? [])[0]?.code?.toString().trim()
  return first ? { text: first.toUpperCase(), isCode: true } : { text: "No code yet", isCode: false }
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-[12px]">
      <span className="shrink-0 text-[12px] font-[400] leading-[16px] text-[#8792A2]">{label}</span>
      <span className="min-w-0 truncate text-right text-[12px] font-[500] leading-[16px] text-[#3C4257]">{children}</span>
    </div>
  )
}

export function CouponPreview({ data }: CouponPreviewProps) {
  const headline = discountHeadline(data)
  const name = (data.name ?? "").toString().trim() || "Coupon name"
  const nameIsPlaceholder = !((data.name ?? "").toString().trim())
  const code = codeLabel(data)
  const redeemBy = data.limitDateRange ? (data.redeemByDate ?? "").toString().trim() : ""

  return (
    <div className="flex w-full items-center justify-center">
      <div className="w-[264px] overflow-hidden rounded-[14px] border border-[#E3E8EF] bg-white shadow-[0_12px_32px_rgba(20,34,52,0.12)]">
        {/* Discount headline */}
        <div className="flex flex-col items-center gap-[3px] px-[20px] pt-[22px] pb-[18px]">
          <span
            className="text-[28px] font-[680] leading-[32px] tracking-[-0.5px]"
            style={{ color: headline.muted ? "#B4BECB" : "#1A2C44" }}
          >
            {headline.text}
          </span>
          <span
            className="max-w-full truncate text-[13px] font-[500] leading-[18px]"
            style={{ color: nameIsPlaceholder ? "#A3ACB9" : "#68778B" }}
          >
            {name}
          </span>
        </div>

        {/* Perforated divider — reads as a redeemable ticket */}
        <div className="border-t border-dashed border-[#D5DEE7]" />

        {/* Details */}
        <div className="flex flex-col gap-[11px] px-[20px] py-[16px]">
          <DetailRow label="Code">
            {code.isCode ? (
              <span className="inline-block rounded-[5px] border border-[#E3E8EF] bg-[#F6F8FA] px-[8px] py-[2px] font-mono text-[11px] font-[500] tracking-[0.3px] text-[#1A2C44]">
                {code.text}
              </span>
            ) : (
              <span className="text-[#8792A2]">{code.text}</span>
            )}
          </DetailRow>
          <DetailRow label="Duration">{durationLabel(data)}</DetailRow>
          <DetailRow label="Applies to">{scopeLabel(data)}</DetailRow>
          {redeemBy && <DetailRow label="Redeem by">{redeemBy}</DetailRow>}
        </div>
      </div>
    </div>
  )
}
