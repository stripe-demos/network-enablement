'use client'

import { motion } from "framer-motion"
import Image from "next/image"
import type { ReactNode } from "react"

import { getFormTokens } from "@/components/creation-workspace/forms/shared/formTokens"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"

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
        className={className}
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
      className={`${size === 44 ? "h-[44px] w-[44px] rounded-[8px] text-[13px]" : "h-[40px] w-[40px] rounded-[6px] text-[12px]"} flex shrink-0 items-center justify-center border border-[#D8D0FF] bg-[#EEEAFE] font-[650] text-[#2C219E]`}
    >
      {account.initials}
    </span>
  )
}

const COUNTRY_FLAG_SRC: Record<string, string> = {
  UK: "/flag-gb.svg",
  US: "/flag-us.svg",
  CA: "/flag-ca.svg",
}

export function CountryBadge({ country, size = "default" }: { country: string; size?: "default" | "sm" }) {
  const countryCode = country === "United Kingdom" ? "UK" : country === "United States" ? "US" : country === "Canada" ? "CA" : country
  if (!countryCode) return null
  const flagSrc = COUNTRY_FLAG_SRC[countryCode]
  const compact = size === "sm"

  return (
    <span className={`flex shrink-0 items-center ${compact ? "gap-[3px]" : "gap-[4px] rounded-[6px] px-[6px] py-[4px]"}`}>
      {flagSrc ? (
        <Image src={flagSrc} alt="" width={compact ? 12 : 16} height={compact ? 9 : 12} className={compact ? "h-[9px] w-[12px]" : "h-[12px] w-[16px]"} />
      ) : null}
      <span className={compact ? "text-[10px] font-[600] leading-[14px] text-[#1A2C44]" : "text-[11px] font-[600] leading-[16px] text-[#1A2C44]"}>{countryCode || "—"}</span>
    </span>
  )
}

export function AccountSummaryCard({
  account,
  actionLabel,
  onAction,
}: {
  account: NetworkAccount
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div data-account-summary-card className="flex items-start gap-[10px] rounded-[8px] bg-[#F4F7FA] p-[10px]">
      <AccountAvatar account={account} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-[600] leading-[18px] tracking-[-0.08px] text-[#1A2C44]">{account.name}</p>
        <p className="truncate text-[11px] font-[400] leading-[16px] text-[#596171]">{account.email}</p>
        <p className="truncate font-mono text-[11px] leading-[16px] text-[#596171]">{account.id}</p>
      </div>
      <CountryBadge country={account.country} />
      {actionLabel && onAction ? (
        <button type="button" className="text-[11px] font-[600] leading-[16px] text-[#533AFD] hover:text-[#4730E0]" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
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
  return (
    <div className={`rounded-[8px] border border-[#D4DEE9] bg-white ${open ? "overflow-visible" : "overflow-hidden"}`}>
      <button
        type="button"
        className="flex min-h-[58px] w-full items-center gap-[12px] p-[12px] text-left transition-colors hover:bg-[#F8FAFB]"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-[600] leading-[18px] tracking-[-0.08px] text-[#1A2C44]">{title}</span>
          <span className="mt-[2px] block text-[11px] font-[400] leading-[16px] text-[#596171]">{summary}</span>
        </span>
        <span className="text-[11px] font-[600] leading-[16px] text-[#533AFD]">{open ? openLabel : closedLabel}</span>
      </button>
      <motion.div
        initial={false}
        animate={open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={open ? "overflow-visible" : "overflow-hidden"}
      >
        <div className="border-t border-[#ECF1F6] bg-[#F8FAFB] p-[12px]">{children}</div>
      </motion.div>
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
