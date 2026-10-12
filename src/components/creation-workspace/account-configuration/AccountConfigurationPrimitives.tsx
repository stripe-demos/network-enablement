'use client'

import Image from "next/image"
import { useId, useLayoutEffect, useRef, type ReactNode } from "react"

import { getFormTokens } from "@/components/creation-workspace/forms/shared/formTokens"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { cn } from "@/lib/utils"
import CountryTag from "@/send-flow/prototypes/prototype2/ui/CountryTag"

import { type NetworkAccount } from "./model"

export function useCardCreateTypeScale() {
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)
  const matchCard = productFormStyle === "sail"
  return {
    matchCard,
    tokens,
    sectionTitle: matchCard
      ? "text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#273951]"
      : cn(tokens.sectionTitle, "font-[400]"),
    fieldLabel: matchCard
      ? "text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#273951]"
      : cn(tokens.sectionTitle, "font-[400]"),
    helper: matchCard ? tokens.helperClass : "text-[11px] leading-[16px] text-[#6C7688]",
    rowTitle: matchCard
      ? "text-[14px] font-[500] leading-[20px] tracking-[-0.08px]"
      : "text-[12px] font-[600] leading-[16px]",
    rowDetail: matchCard ? tokens.helperClass : "text-[11px] leading-[16px] text-[#6C7688]",
    link: matchCard
      ? "text-[13px] font-[600] leading-[18px] text-[#533AFD] hover:text-[#4730E0]"
      : "text-[11px] font-[600] leading-[16px] text-[#533AFD] hover:text-[#4730E0]",
    edit: matchCard
      ? "shrink-0 rounded-[5px] p-[4px] text-[13px] font-[500] leading-[18px] text-[#533AFD] outline-none transition-colors hover:bg-[#F0EDFF]"
      : "shrink-0 rounded-[6px] p-[4px] text-[11px] font-[600] leading-[16px] text-[#533AFD] outline-none transition-colors hover:bg-[#F4F4FE]",
    stack: matchCard ? "flex flex-col gap-[24px] pb-[16px]" : "flex flex-col gap-[18px] pb-[64px]",
    section: matchCard ? "flex flex-col gap-[16px]" : "flex flex-col gap-[12px]",
    headingHelper: matchCard ? "mt-[6px]" : "mt-[3px]",
    cardStack: matchCard ? "flex flex-col gap-[8px]" : "flex flex-col gap-[8px]",
    rowPad: matchCard ? "min-h-[60px] px-[16px] py-[12px]" : "min-h-[48px] px-[12px] py-[10px]",
    reviewPad: matchCard ? "min-h-[60px] px-[16px] py-[12px]" : "min-h-[58px] p-[12px]",
    reviewBody: matchCard ? "p-[16px]" : "p-[12px]",
    previewName: matchCard
      ? "text-[16px] font-[600] leading-[24px] tracking-[-0.31px] text-[#1A2C44]"
      : "text-[16px] font-[650] leading-[22px] tracking-[-0.18px] text-[#1A2C44]",
    previewMeta: matchCard
      ? "text-[13px] font-[400] leading-[18px] tracking-[-0.08px]"
      : "text-[12px] leading-[17px]",
    previewSection: matchCard
      ? "text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#273951]"
      : "text-[13px] font-[600] leading-[22px] text-[#1A2C44]",
    previewEmpty: matchCard
      ? "text-[13px] font-[400] leading-[18px] tracking-[-0.08px] text-[#596171]"
      : "text-[12px] leading-[17px] text-[#818DA0]",
    previewConfig: matchCard
      ? "text-[14px] font-[500] leading-[20px] tracking-[-0.08px] text-[#2C219E]"
      : "text-[12px] font-[600] leading-[16px] text-[#2C219E]",
    previewCapability: matchCard
      ? "text-[13px] font-[400] leading-[18px] tracking-[-0.08px] text-[#3C4F69]"
      : "text-[12px] leading-[18px] text-[#3C4F69]",
    previewToggle: matchCard
      ? "text-[13px] font-[500] leading-[18px] tracking-[-0.08px]"
      : "text-[12px] leading-[16px] tracking-[-0.02px]",
  }
}

export function Field({ label, description, children }: { label: string; description?: ReactNode; children: ReactNode }) {
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)

  if (productFormStyle === "sail" || description) {
    return (
      <div>
        <label className={productFormStyle === "sail"
          ? "form-field-label block text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#273951]"
          : tokens.labelClass}
        >
          {label}
        </label>
        {description ? (
          <p className={`mt-[6px] mb-[8px] form-field-helper ${tokens.helperClass}`}>{description}</p>
        ) : (
          <div className="h-[6px]" />
        )}
        {children}
      </div>
    )
  }

  return (
    <label className="flex flex-col gap-[4px]">
      <span className={tokens.labelClass}>{label}</span>
      {children}
    </label>
  )
}

export function SelectControl({
  className,
  value,
  onChange,
  children,
  ariaLabel,
}: {
  className: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
  ariaLabel?: string
}) {
  return (
    <div className="relative">
      <select
        aria-label={ariaLabel}
        className={cn(className, !value && "font-[400] text-[#6C7688]")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        data-styled-select
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-[9px] top-1/2 -translate-y-1/2 text-[#6C7688]"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
      >
        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function AvatarInitials({ initials }: { initials: string }) {
  return (
    <span className="absolute inset-0 grid place-items-center leading-none">
      <span className="translate-y-[0.1em]">{initials}</span>
    </span>
  )
}

function avatarLoopPath(size: number, stroke: number, radius: number) {
  const inset = stroke / 2
  const r = Math.max(0.5, radius - inset)
  const x1 = inset
  const y1 = inset
  const x2 = size - inset
  const y2 = size - inset
  const midX = size / 2
  return [
    `M ${midX} ${y1}`,
    `H ${x2 - r}`,
    `A ${r} ${r} 0 0 1 ${x2} ${y1 + r}`,
    `V ${y2 - r}`,
    `A ${r} ${r} 0 0 1 ${x2 - r} ${y2}`,
    `H ${x1 + r}`,
    `A ${r} ${r} 0 0 1 ${x1} ${y2 - r}`,
    `V ${y1 + r}`,
    `A ${r} ${r} 0 0 1 ${x1 + r} ${y1}`,
    `H ${midX}`,
  ].join(" ")
}

export function AccountAvatar({
  account,
  size = 40,
  awaken,
}: {
  account: Pick<NetworkAccount, "name" | "initials" | "hasBrandIcon">
  size?: 40 | 44
  awaken?: boolean
}) {
  const gradientId = `avatar-rim-${useId().replace(/:/g, "")}`
  const typeClass = size === 44 ? "h-[44px] w-[44px] rounded-[8px] text-[14px] font-[650]" : "h-[40px] w-[40px] rounded-[6px] text-[12px] font-[650]"
  const radius = size === 44 ? 8 : 6

  if (account.hasBrandIcon) {
    return (
      <Image
        src="/unified-account-icon.png"
        alt=""
        width={size}
        height={size}
        className={`${typeClass} shrink-0`}
      />
    )
  }

  if (awaken === undefined) {
    return (
      <span
        data-account-avatar="initials"
        className={`${typeClass} relative flex shrink-0 items-center justify-center border border-[#D8D0FF] bg-[#EEEAFE] leading-none text-[#2C219E]`}
      >
        <AvatarInitials initials={account.initials} />
      </span>
    )
  }

  const stroke = 1
  const loop = avatarLoopPath(size, stroke, radius)

  return (
    <span
      data-account-avatar="initials"
      data-state={awaken ? "in" : "idle"}
      className={`t-account-avatar ${typeClass} relative flex shrink-0 items-center justify-center leading-none`}
    >
      <span className="t-account-avatar-fill absolute inset-0">
        <AvatarInitials initials={account.initials} />
      </span>
      <svg
        className="t-account-avatar-svg pointer-events-none absolute inset-0"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2={size} y2={size} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F29BC4" />
            <stop offset="35%" stopColor="#F0B07A" />
            <stop offset="65%" stopColor="#E8C878" />
            <stop offset="100%" stopColor="#C09AE8" />
          </linearGradient>
        </defs>
        <path className="t-account-avatar-rest" d={loop} />
        <path className="t-account-avatar-settled" d={loop} />
        <path className="t-account-avatar-ring" d={loop} pathLength={1} stroke={`url(#${gradientId})`} />
      </svg>
    </span>
  )
}

export function NetworkAccountOption({ account }: { account: NetworkAccount }) {
  return (
    <span className="flex min-w-0 flex-1 items-center justify-between gap-[10px] py-[2px]">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[12px] font-[600] text-[#1A2C44]">{account.name}</span>
        <span className="mt-[1px] truncate text-[11px] leading-[16px] text-[#6C7688]">{account.email}</span>
      </span>
      <CountryBadge country={account.country} size="sm" />
    </span>
  )
}

function countryTagCode(country: string) {
  if (country === "United Kingdom" || country === "UK" || country === "GB") return "GB"
  if (country === "United States" || country === "US") return "US"
  if (country === "Canada" || country === "CA") return "CA"
  return ""
}

export function CountryBadge({
  country,
  size = "default",
  tone,
}: {
  country: string
  size?: "default" | "sm" | "md" | "flow"
  tone?: "default" | "deep"
}) {
  const code = countryTagCode(country)
  if (!code) return null
  const onPanel = tone === "deep" || size === "md" || size === "flow"
  return <CountryTag code={code} size={size === "sm" ? "sm" : "default"} tone={onPanel ? "deep" : "default"} />
}

export function AccountSummaryCard({
  account,
  actionLabel,
  onAction,
  revealActionOnHover = false,
  subtitle,
  size = "default",
}: {
  account: NetworkAccount
  actionLabel?: string
  onAction?: () => void
  revealActionOnHover?: boolean
  subtitle?: string
  size?: "default" | "flow"
}) {
  const type = useCardCreateTypeScale()
  const isFlow = type.matchCard || size === "flow"
  return (
    <div data-account-summary-card className={`${revealActionOnHover ? "group " : ""}flex items-center gap-[10px] rounded-[8px] bg-[#F6F8FA] ${isFlow ? "p-[12px]" : "p-[10px]"}`}>
      {account.hasBrandIcon ? (
        <Image
          src="/unified-account-icon.png"
          alt=""
          width={32}
          height={32}
          className="h-[32px] w-[32px] shrink-0 rounded-[6px]"
        />
      ) : (
        <span className={`relative flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[6px] border border-[#D8D0FF] bg-[#EEEAFE] leading-none text-[#2C219E] ${isFlow ? "text-[13px] font-[500]" : "text-[12px] font-[650]"}`}>
          <AvatarInitials initials={account.initials} />
        </span>
      )}
      <div className={`flex min-w-0 flex-1 flex-col justify-center ${isFlow ? "leading-[20px]" : "leading-[16px]"}`}>
        <div className="flex items-center gap-[8px]">
          <p className={`min-w-0 flex-1 truncate text-[#1A2C44] ${isFlow ? "text-[14px] font-[500] leading-[20px] tracking-[-0.08px]" : "text-[13px] font-[600] leading-[16px] tracking-[-0.08px]"}`}>
            {account.name}
          </p>
          <span className="relative shrink-0">
            <span className={revealActionOnHover && actionLabel && onAction
              ? "block transition-opacity group-hover:opacity-0 group-focus-within:opacity-0"
              : "block"}
            >
              <CountryBadge country={account.country} size={isFlow ? "default" : "sm"} tone="deep" />
            </span>
            {revealActionOnHover && actionLabel && onAction ? (
              <button
                type="button"
                className={`absolute inset-y-0 right-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 ${type.edit}`}
                onClick={onAction}
              >
                {actionLabel}
              </button>
            ) : null}
          </span>
        </div>
        <p className={isFlow ? "truncate text-[13px] font-[400] leading-[18px] tracking-[-0.08px] text-[#596171]" : "truncate text-[11px] font-[400] leading-[16px] text-[#6C7688]"}>
          {subtitle ?? account.email}
        </p>
      </div>
      {actionLabel && onAction && !revealActionOnHover ? (
        <button type="button" className={`shrink-0 self-start ${type.edit}`} onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}

export function DuplicateAccountNudge({
  account,
  onUseExisting,
  onDismiss,
  description = "This email is linked to an existing account in your Network. Continue with it to add configurations instead of creating a duplicate.",
  actionLabel = "Use existing account",
}: {
  account: NetworkAccount
  onUseExisting: () => void
  onDismiss: () => void
  description?: string
  actionLabel?: string
}) {
  return (
    <div
      className="overflow-hidden rounded-[8px] border border-[#D4DEE9] bg-white shadow-[0_8px_24px_rgba(26,44,68,0.12)]"
      data-duplicate-account-nudge
      role="region"
      aria-label="Existing account found"
    >
      <div className="p-[12px]">
        <AccountSummaryCard account={account} subtitle={account.id} size="flow" />
        <p className="px-[8px] pb-[4px] pt-[12px] text-[13px] font-[400] leading-[18px] tracking-[-0.08px] text-[#596171]">
          {description}
        </p>
      </div>
      <div className="flex justify-end gap-[6px] border-t border-[#ECF1F6] bg-[#F8FAFB] p-[12px]">
        <button
          type="button"
          className="rounded-[6px] px-[8px] py-[4px] text-[12px] font-[500] leading-[16px] text-[#526378] hover:bg-[#EEF2F6]"
          onClick={onDismiss}
        >
          Create new anyway
        </button>
        <button
          type="button"
          className="rounded-[6px] bg-[#675DFF] px-[10px] py-[6px] text-[12px] font-[600] leading-[16px] text-white hover:bg-[#5B52F0]"
          onClick={onUseExisting}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  )
}

export function CheckIcon({ muted = false }: { muted?: boolean }) {
  return (
    <span className={`flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full ${muted ? "bg-[#D4DEE9]" : "bg-[#675DFF]"} text-white`}>
      <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden="true">
        <path d="M1 3.5L3.4 5.7L8 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle).toggle

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`group relative shrink-0 rounded-full border transition-colors ${tokens.trackClass} ${checked ? tokens.onClass : tokens.offClass}`}
      onClick={() => onChange(!checked)}
    >
      <span className={`absolute rounded-full bg-white shadow-[0_1px_1px_rgba(33,37,44,0.16)] transition-all ${tokens.knobClass} ${checked ? `${tokens.knobOnPos} ${tokens.knobOnBorder}` : `${tokens.knobOffPos} ${tokens.knobOffBorder}`}`} />
    </button>
  )
}

function getScrollParent(node: HTMLElement | null) {
  let current = node?.parentElement
  while (current) {
    const overflowY = getComputedStyle(current).overflowY
    if (overflowY === "auto" || overflowY === "scroll") return current
    current = current.parentElement
  }
  return document.scrollingElement as HTMLElement | null
}

export function ReviewRow({
  title,
  summary,
  open,
  onToggle,
  closedLabel = "Edit",
  openLabel = "Done",
  children,
}: {
  title: string
  summary: string
  open: boolean
  onToggle: () => void
  closedLabel?: string
  openLabel?: string
  children: ReactNode
}) {
  const type = useCardCreateTypeScale()
  const cardRef = useRef<HTMLDivElement>(null)
  const wasOpen = useRef(open)

  useLayoutEffect(() => {
    const card = cardRef.current
    const collapsing = wasOpen.current && !open
    wasOpen.current = open
    if (!collapsing || !card) return

    const parent = getScrollParent(card)
    if (!parent) return
    const keepTop = card.getBoundingClientRect().top
    const started = performance.now()

    const pin = (now: number) => {
      const nextTop = card.getBoundingClientRect().top
      if (nextTop !== keepTop) parent.scrollTop += nextTop - keepTop
      if (now - started < 420) requestAnimationFrame(pin)
    }
    requestAnimationFrame(pin)
  }, [open])

  const header = (
    <>
      <span className="min-w-0 flex-1">
        <span className={`block text-[#1A2C44] ${type.rowTitle}`}>{title}</span>
        <span className={`mt-[2px] block font-[400] ${type.rowDetail}`}>{summary}</span>
      </span>
    </>
  )

  return (
    <div ref={cardRef} className="overflow-hidden rounded-[8px] border border-[#E3E8EF] bg-white [overflow-anchor:none]">
      <div className={`flex w-full items-center gap-[12px] [overflow-anchor:auto] ${type.reviewPad}`}>
        {header}
        <button
          type="button"
          className={type.edit}
          aria-expanded={open}
          onClick={onToggle}
        >
          {open ? openLabel : closedLabel}
        </button>
      </div>
      <div
        className="grid [overflow-anchor:none] transition-[grid-template-rows] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className={`border-t border-[#ECF1F6] bg-[#F8FAFB] ${type.reviewBody}`}>{children}</div>
        </div>
      </div>
    </div>
  )
}

export function BackButton({ onClick }: { onClick: () => void }) {
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)

  return (
    <button type="button" className={`${tokens.secondaryButtonClass} self-start`} onClick={onClick}>
      Back
    </button>
  )
}
