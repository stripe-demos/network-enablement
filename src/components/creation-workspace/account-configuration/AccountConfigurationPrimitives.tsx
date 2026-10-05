'use client'

import Image from "next/image"
import { useLayoutEffect, useRef, type ReactNode } from "react"

import { getFormTokens } from "@/components/creation-workspace/forms/shared/formTokens"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { cn } from "@/lib/utils"

import { type NetworkAccount } from "./model"

export function Field({ label, children }: { label: string; children: ReactNode }) {
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)

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
        width="10"
        height="10"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

export function AccountAvatar({ account, size = 40 }: { account: Pick<NetworkAccount, "name" | "initials" | "hasBrandIcon">; size?: 40 | 44 }) {
  if (account.hasBrandIcon) {
    return (
      <Image
        src="/unified-account-icon.png"
        alt=""
        width={size}
        height={size}
        className={size === 44 ? "h-[44px] w-[44px] shrink-0 rounded-[8px]" : "h-[40px] w-[40px] shrink-0 rounded-[6px]"}
      />
    )
  }

  return (
    <span
      data-account-avatar="initials"
      className={`${size === 44 ? "h-[44px] w-[44px] rounded-[8px] text-[14px] font-[650]" : "h-[40px] w-[40px] rounded-[6px] text-[12px] font-[650]"} relative flex shrink-0 items-center justify-center border border-[#D8D0FF] bg-[#EEEAFE] leading-none text-[#2C219E]`}
    >
      <AvatarInitials initials={account.initials} />
    </span>
  )
}

const COUNTRY_FLAG_SRC: Record<string, string> = {
  UK: "/flags/gb.svg",
  US: "/flags/us.svg",
  CA: "/flags/ca.svg",
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

const COUNTRY_BADGE_SIZE = {
  sm: { width: 10, height: 10, flagClass: "h-[10px] w-[10px]", gap: "gap-[3px]", label: "text-[10px] font-[600] leading-[14px] text-[#1A2C44]" },
  md: { width: 16, height: 16, flagClass: "h-[16px] w-[16px]", gap: "gap-[3px]", label: "text-[10px] font-[600] leading-[10px] text-[#1A2C44]" },
  default: { width: 14, height: 14, flagClass: "h-[14px] w-[14px]", gap: "gap-[4px] rounded-[6px] px-[6px] py-[4px]", label: "text-[12px] font-[600] leading-[16px] text-[#1A2C44]" },
} as const

export function CountryBadge({ country, size = "default" }: { country: string; size?: "default" | "sm" | "md" }) {
  const countryCode = country === "United Kingdom" ? "UK" : country === "United States" ? "US" : country === "Canada" ? "CA" : country
  if (!countryCode) return null
  const flagSrc = COUNTRY_FLAG_SRC[countryCode]
  const badge = COUNTRY_BADGE_SIZE[size]

  return (
    <span className={`flex shrink-0 items-center ${badge.gap}`}>
      {flagSrc ? (
        <Image src={flagSrc} alt="" width={badge.width} height={badge.height} className={badge.flagClass} />
      ) : null}
      <span className={badge.label}>{countryCode || "—"}</span>
    </span>
  )
}

export function AccountSummaryCard({
  account,
  actionLabel,
  onAction,
  subtitle,
}: {
  account: NetworkAccount
  actionLabel?: string
  onAction?: () => void
  subtitle?: string
}) {
  return (
    <div data-account-summary-card className="flex items-center gap-[10px] rounded-[8px] bg-[#F6F8FA] p-[10px]">
      {account.hasBrandIcon ? (
        <Image
          src="/unified-account-icon.png"
          alt=""
          width={32}
          height={32}
          className="h-[32px] w-[32px] shrink-0 rounded-[6px]"
        />
      ) : (
        <span className="relative flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[6px] border border-[#D8D0FF] bg-[#EEEAFE] text-[12px] font-[650] leading-none text-[#2C219E]">
          <AvatarInitials initials={account.initials} />
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-center leading-[16px]">
        <p className="truncate text-[13px] font-[600] leading-[16px] tracking-[-0.08px] text-[#1A2C44]">{account.name}</p>
        <p className="truncate text-[11px] font-[400] leading-[16px] text-[#6C7688]">{subtitle ?? account.email}</p>
      </div>
      <CountryBadge country={account.country} size="md" />
      {actionLabel && onAction ? (
        <button type="button" className="text-[11px] font-[600] leading-[16px] text-[#533AFD] hover:text-[#4730E0]" onClick={onAction}>
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
  description = "This email matches an existing account in your Network. Continue with it to add configurations instead of creating a duplicate.",
}: {
  account: NetworkAccount
  onUseExisting: () => void
  onDismiss: () => void
  description?: string
}) {
  return (
    <div
      className="overflow-hidden rounded-[8px] border border-[#D4DEE9] bg-white shadow-[0_8px_24px_rgba(26,44,68,0.12)]"
      data-duplicate-account-nudge
      role="region"
      aria-label="Existing account found"
    >
      <div className="p-[8px]">
        <AccountSummaryCard account={account} subtitle={account.id} />
        <p className="px-[8px] pb-[4px] pt-[8px] text-[12px] leading-[16px] text-[#3C4F69]">
          {description}
        </p>
      </div>
      <div className="flex justify-end gap-[6px] border-t border-[#ECF1F6] bg-[#F8FAFB] p-[8px]">
        <button type="button" className="rounded-[6px] px-[8px] py-[5px] text-[11px] font-[600] text-[#526378] hover:bg-[#EEF2F6]" onClick={onDismiss}>Create new anyway</button>
        <button type="button" className="rounded-[6px] bg-[#675DFF] px-[8px] py-[5px] text-[11px] font-[600] text-white hover:bg-[#5B52F0]" onClick={onUseExisting}>Use existing account</button>
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
        <span className="block text-[12px] font-[600] leading-[16px] text-[#1A2C44]">{title}</span>
        <span className="mt-[2px] block text-[11px] font-[400] leading-[16px] text-[#6C7688]">{summary}</span>
      </span>
    </>
  )

  return (
    <div ref={cardRef} className="overflow-hidden rounded-[8px] border border-[#E3E8EF] bg-white [overflow-anchor:none]">
      <div className="flex min-h-[58px] w-full items-center gap-[12px] p-[12px] [overflow-anchor:auto]">
        {header}
        <button
          type="button"
          className="shrink-0 rounded-[6px] px-[8px] py-[4px] text-[11px] font-[600] leading-[16px] text-[#533AFD] outline-none transition-colors hover:bg-[#F4F4FE]"
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
          <div className="border-t border-[#ECF1F6] bg-[#F8FAFB] p-[12px]">{children}</div>
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
