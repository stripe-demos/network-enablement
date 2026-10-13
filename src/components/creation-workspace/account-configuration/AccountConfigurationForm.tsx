'use client'

import { motion } from "framer-motion"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"

import { SegmentedControl } from "@/components/SegmentedControl"
import { Checkbox } from "@/components/creation-workspace/forms/shared/Checkbox"
import { getFormTokens } from "@/components/creation-workspace/forms/shared/formTokens"
import { useInputFill } from "@/components/creation-workspace/inputFill"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { useAccountConflictNudgeMode, type AccountConflictNudgeMode } from "@/components/creation-workspace/accountConflictNudgeMode"
import type { AccountOnboardingStyle } from "@/components/creation-workspace/accountOnboardingStyle"
import { useAccountPropertiesLayout } from "@/components/creation-workspace/accountPropertiesLayout"
import type { AccountSelectionStyle } from "@/components/creation-workspace/accountSelectionStyle"

import { EntityDropdown } from "@/components/creation-workspace/forms/EntityDropdown"
import { AddressFields, CountrySelect, formatAddressSummary, phoneCountryFromBillingCountry, type AddressValue } from "@/components/creation-workspace/forms/shared/AddressFields"
import { CreationModalShell } from "@/components/creation-workspace/CreationModalShell"
import { DescribeAccountModal } from "./DescribeAccountModal"
import {
  AccountSummaryCard,
  DuplicateAccountNudge,
  Field,
  ReviewRow,
  SelectControl,
  Toggle,
  useCardCreateTypeScale,
} from "./AccountConfigurationPrimitives"
import {
  ACCOUNT_ONBOARDING_LINK,
  CAPABILITY_GROUPS,
  CONFIGURATION_OPTIONS,
  EMAIL_PATTERN,
  NETWORK_ACCOUNTS,
  PAYOUT_METHODS,
  findMatchingNetworkAccount,
  getCapabilities,
  getCapabilitiesForGroup,
  getConfigurationOptions,
  getDisplayedNetworkAccount,
  getDraftName,
  getRecommendedConfigurations,
  isNewAccountIdentityValid,
  type AccountDetailsDraft,
  type AccountSource,
  type CapabilityItem,
  type ConfigurationKind,
  type ConfigurationOption,
  type NetworkAccount,
  type PayoutMethod,
  type PayoutMethodDetailDraft,
  type UserPath,
} from "./model"

const ACCOUNT_TYPE_OPTIONS = [
  { id: "Company", name: "Company", detail: "Recommended for businesses you onboard, like yoga studios." },
  { id: "Individual", name: "Individual", detail: "Generally used for freelancers, consultants, or solopreneurs." },
] as const
const ONBOARDING_ACTION_OPTIONS = ["send-email", "copy-link"] as const

export function FieldHint({ label, children }: { label: string; children: string }) {
  const tooltipId = `${label.replace(/\s+/g, "-").toLowerCase()}-hint`
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  const updatePosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    setCoords({ top: rect.bottom + 8, left: Math.min(rect.left, window.innerWidth - 256) })
  }

  useEffect(() => {
    if (!open) return
    const onReposition = () => updatePosition()
    window.addEventListener("scroll", onReposition, true)
    window.addEventListener("resize", onReposition)
    return () => {
      window.removeEventListener("scroll", onReposition, true)
      window.removeEventListener("resize", onReposition)
    }
  }, [open])

  return (
    <span className="inline-flex">
      <button
        ref={triggerRef}
        type="button"
        aria-describedby={open ? tooltipId : undefined}
        aria-label={`About ${label}`}
        className="flex h-[14px] w-[14px] items-center justify-center text-[#818DA0] outline-none hover:text-[#596171] focus-visible:ring-2 focus-visible:ring-[#675DFF]/25"
        onMouseEnter={() => {
          updatePosition()
          setOpen(true)
        }}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => {
          updatePosition()
          setOpen(true)
        }}
        onBlur={() => setOpen(false)}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="6" cy="3.75" r="0.7" fill="currentColor" />
          <path d="M6 5.5v3.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>
      {open
        ? createPortal(
            <span
              id={tooltipId}
              role="tooltip"
              className="t-tt text-[12px] font-[400] leading-[16px] tracking-[-0.024px]"
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                bottom: "auto",
                width: 240,
                maxWidth: "calc(100vw - 16px)",
                whiteSpace: "normal",
                opacity: 1,
                transform: "none",
                zIndex: 10000,
                pointerEvents: "none",
              }}
            >
              {children}
            </span>,
            document.body,
          )
        : null}
    </span>
  )
}

function getNetworkAccounts(userPath?: UserPath) {
  return NETWORK_ACCOUNTS.map((account) => getDisplayedNetworkAccount(account, userPath))
}

const EMAIL_SETTLE_MS = 120

function resolveEmailMatch(email: string, mode: AccountConflictNudgeMode) {
  if (mode === "off") return undefined
  if (mode === "always" && email.trim()) return NETWORK_ACCOUNTS.find((account) => account.id === "acct_juniper")
  return findMatchingNetworkAccount(email)
}

export function useRefinedEmailLookup(email: string, enabled: boolean) {
  const { accountConflictNudgeMode } = useAccountConflictNudgeMode()
  const [status, setStatus] = useState<"idle" | "checking" | "ready">("idle")
  const [match, setMatch] = useState<NetworkAccount | undefined>()
  const [dismissedMatchId, setDismissedMatchId] = useState("")
  const lookedUpEmailRef = useRef("")
  const statusRef = useRef(status)
  statusRef.current = status

  const startLookup = (value: string) => {
    const next = value.trim()
    if (!EMAIL_PATTERN.test(next)) {
      lookedUpEmailRef.current = ""
      setStatus("idle")
      setMatch(undefined)
      return
    }
    if (lookedUpEmailRef.current === next && statusRef.current !== "idle") return
    lookedUpEmailRef.current = next
    setMatch(resolveEmailMatch(next, accountConflictNudgeMode))
    setStatus("ready")
  }

  useEffect(() => {
    if (!enabled) {
      lookedUpEmailRef.current = ""
      setStatus("idle")
      setMatch(undefined)
      return
    }
    const next = email.trim()
    if (!EMAIL_PATTERN.test(next)) {
      lookedUpEmailRef.current = ""
      setStatus("idle")
      setMatch(undefined)
      return
    }
    if (lookedUpEmailRef.current === next && statusRef.current !== "idle") return
    setStatus("idle")
    setMatch(undefined)
    const timeout = window.setTimeout(() => startLookup(email), EMAIL_SETTLE_MS)
    return () => window.clearTimeout(timeout)
  }, [accountConflictNudgeMode, email, enabled])

  return {
    status,
    match,
    dismissedMatchId,
    dismissMatch: () => {
      if (match) setDismissedMatchId(match.id)
    },
    commitNow: () => startLookup(email),
  }
}

function AccountIdentityFields({
  details,
  onChange,
  onUseExisting,
  autoFocus = false,
  typeLabel = "Account type",
  emailFirst = false,
  lookupStatus = "idle",
  lookupMatch,
  dismissedMatchId = "",
  onDismissMatch,
  onCommitEmail,
}: {
  details: AccountDetailsDraft
  onChange: (patch: Partial<AccountDetailsDraft>) => void
  onUseExisting: (account: NetworkAccount) => void
  autoFocus?: boolean
  typeLabel?: string
  emailFirst?: boolean
  lookupStatus?: "idle" | "checking" | "ready"
  lookupMatch?: NetworkAccount
  dismissedMatchId?: string
  onDismissMatch?: () => void
  onCommitEmail?: () => void
}) {
  const [localDismissedMatchId, setLocalDismissedMatchId] = useState("")
  const firstInputRef = useRef<HTMLInputElement>(null)
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const { accountConflictNudgeMode } = useAccountConflictNudgeMode()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  const typeScale = useCardCreateTypeScale()
  const matchingAccount = emailFirst
    ? lookupMatch
    : accountConflictNudgeMode === "off"
      ? undefined
      : accountConflictNudgeMode === "always" && details.accountEmail.trim()
        ? NETWORK_ACCOUNTS.find((account) => account.id === "acct_juniper")
        : findMatchingNetworkAccount(details.accountEmail)
  const resolvedDismissedId = emailFirst ? dismissedMatchId : localDismissedMatchId
  const lookupReady = !emailFirst || lookupStatus === "ready"
  const showMatch = Boolean(lookupReady && matchingAccount && resolvedDismissedId !== matchingAccount.id)

  useEffect(() => {
    if (!autoFocus) return
    requestAnimationFrame(() => firstInputRef.current?.focus({ preventScroll: true }))
  }, [autoFocus])

  const typeField = (
    <Field label={typeLabel}>
      {typeScale.matchCard ? (
        <EntityDropdown
          label=""
          placeholder="Select account type"
          searchPlaceholder="Search"
          hideSearch
          insetOptionHover
          items={ACCOUNT_TYPE_OPTIONS.map((option) => ({ id: option.id, name: option.name, detail: option.detail }))}
          selectedId={details.type}
          onSelect={(id) => onChange({ type: id as AccountDetailsDraft["type"] })}
          optionNameClassName="block truncate text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#273951]"
          renderOption={(item) => (
            <span className="flex min-w-0 flex-col py-[2px]">
              <span className="text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#273951]">{item.name}</span>
              {item.detail ? (
                <span className="mt-[2px] text-[13px] font-[400] leading-[18px] tracking-[-0.08px] text-[#596171]">{item.detail}</span>
              ) : null}
            </span>
          )}
        />
      ) : (
        <SelectControl
          className={tokens.selectClass}
          value={details.type}
          ariaLabel={typeLabel}
          onChange={(next) => onChange({ type: next as AccountDetailsDraft["type"] })}
        >
          <option value="">Select account type</option>
          {ACCOUNT_TYPE_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>{option.name}</option>
          ))}
        </SelectControl>
      )}
    </Field>
  )
  const nameField = !details.type ? null : details.type === "Company" ? (
    <Field label="Company name">
      <input
        ref={emailFirst ? undefined : firstInputRef}
        className={tokens.inputClass}
        placeholder="Example Corp Inc"
        value={details.registeredName}
        onChange={(event) => onChange({ registeredName: event.target.value })}
      />
    </Field>
  ) : (
    <Field label="Legal name">
      <span className="grid gap-[6px]">
        <input ref={emailFirst ? undefined : firstInputRef} aria-label="First name" className={tokens.inputClass} placeholder="First name" value={details.firstName} onChange={(event) => onChange({ firstName: event.target.value })} />
        <input aria-label="Last name" className={tokens.inputClass} placeholder="Last name" value={details.lastName} onChange={(event) => onChange({ lastName: event.target.value })} />
      </span>
    </Field>
  )
  const emailField = (
    <div className="flex flex-col gap-[6px]">
      <Field label="Account email">
        {matchingAccount ? (
          <div className={`${tokens.inputClass} flex items-center px-[6px]`}>
            <span className="flex h-[22px] max-w-full items-center gap-[6px] rounded-full bg-[#F4F6F8] pl-[3px] pr-[6px]">
              {matchingAccount.hasBrandIcon ? (
                <img src="/unified-account-icon.png" alt="" className="h-[16px] w-[16px] shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full bg-[#ECF1F6] text-[9px] font-[600] leading-none text-[#1A2C44]">
                  {matchingAccount.initials}
                </span>
              )}
              <span className="min-w-0 truncate text-[14px] font-[400] leading-[20px] text-[#353A44]">{matchingAccount.name}</span>
              <button
                type="button"
                aria-label="Clear email"
                className="flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-full text-[#6C7688] hover:bg-[#E8EDF3] hover:text-[#1A2C44]"
                onClick={() => onChange({ accountEmail: "" })}
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                  <path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          </div>
        ) : (
        <span className="group relative block">
          <input
            ref={emailFirst ? firstInputRef : undefined}
            type="email"
            className={`${tokens.inputClass}${!details.accountEmail.trim() && !(emailFirst && lookupStatus === "checking") ? " pr-[62px]" : ""}${emailFirst && lookupStatus === "checking" ? " pr-[32px]" : ""}`}
            placeholder="email@example.com"
            value={details.accountEmail}
            onChange={(event) => onChange({ accountEmail: event.target.value })}
            onBlur={() => onCommitEmail?.()}
            aria-invalid={details.accountEmail.length > 0 && !EMAIL_PATTERN.test(details.accountEmail)}
            aria-busy={emailFirst && lookupStatus === "checking"}
          />
          {!details.accountEmail.trim() && !(emailFirst && lookupStatus === "checking") ? (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange({ accountEmail: "accounts@juniperyoga.example" })
                onCommitEmail?.()
              }}
              className="pointer-events-none absolute right-[6px] top-1/2 flex h-[20px] -translate-y-1/2 items-center rounded-[5px] bg-[#EFECFC] px-[6px] text-[11px] font-[600] leading-[14px] text-[#533AFD] opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
            >
              Autofill
            </button>
          ) : null}
          {emailFirst && lookupStatus === "checking" ? (
            <span className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2 text-[#6C7688]" aria-hidden="true">
              <svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" />
                <path d="M10.5 6a4.5 4.5 0 0 0-4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
          ) : null}
        </span>
        )}
      </Field>
      {showMatch && matchingAccount ? (
        <DuplicateAccountNudge
          account={matchingAccount}
          onUseExisting={() => onUseExisting(matchingAccount)}
          onDismiss={() => {
            if (emailFirst) onDismissMatch?.()
            else setLocalDismissedMatchId(matchingAccount.id)
          }}
        />
      ) : null}
    </div>
  )
  const countryField = (
    <Field label="Country">
      <CountrySelect
        className={typeScale.matchCard ? tokens.inputClass : tokens.selectClass}
        value={details.country}
        onChange={(country) => onChange({ country, billingCountry: details.billingCountry || country })}
      />
    </Field>
  )

  return (
    <div className={typeScale.section} data-new-account-fields>
      {emailFirst ? (
        <>
          {emailField}
          {typeField}
          {nameField}
          {countryField}
        </>
      ) : (
        <>
          {typeField}
          {nameField}
          {emailField}
          {countryField}
        </>
      )}
    </div>
  )
}

function SelectedAccountSummary({ account }: { account: NetworkAccount }) {
  return (
    <div data-selected-account-summary>
      <AccountSummaryCard account={account} />
    </div>
  )
}

function AccountSelector({
  style,
  source,
  selectedAccountId,
  details,
  userPath,
  onSelectExisting,
  onDetailsChange,
  lookupStatus,
  lookupMatch,
  dismissedMatchId,
  onDismissMatch,
  onCommitEmail,
}: {
  style: AccountSelectionStyle
  source: AccountSource
  selectedAccountId: string
  details: AccountDetailsDraft
  userPath?: UserPath
  onChooseExisting: () => void
  onPrepareNew: () => void
  onChooseNew: () => void
  onSelectExisting: (account: NetworkAccount) => void
  onDetailsChange: (patch: Partial<AccountDetailsDraft>) => void
  lookupStatus?: "idle" | "checking" | "ready"
  lookupMatch?: NetworkAccount
  dismissedMatchId?: string
  onDismissMatch?: () => void
  onCommitEmail?: () => void
}) {
  const type = useCardCreateTypeScale()
  const selectedAccount = source === "existing"
    ? getNetworkAccounts(userPath).find((account) => account.id === selectedAccountId)
    : undefined

  const identityFields = (
    <AccountIdentityFields
      details={details}
      onChange={onDetailsChange}
      onUseExisting={onSelectExisting}
      autoFocus
      typeLabel="Account type"
      emailFirst={style === "refined" || style === "repeat"}
      lookupStatus={lookupStatus}
      lookupMatch={lookupMatch}
      dismissedMatchId={dismissedMatchId}
      onDismissMatch={onDismissMatch}
      onCommitEmail={onCommitEmail}
    />
  )

  return (
    <section className={type.section} data-account-selection-style={style}>
      {source === "existing" && selectedAccount ? (
        <div className={type.headingContent}>
          <h3 className={type.sectionTitle}>Selected account</h3>
          <SelectedAccountSummary account={selectedAccount} />
        </div>
      ) : identityFields}
    </section>
  )
}

function capabilityListLabel(names: string[]) {
  if (names.length === 0) return "No capabilities"
  if (names.length <= 3) return names.join(", ")
  const extra = names.length - 3
  return `${names.slice(0, 3).join(", ")} + ${extra} more`
}

function ConfigurationNestedCapabilities({
  names,
  onEdit,
  columnsClass,
}: {
  names: string[]
  onEdit?: () => void
  columnsClass: string
}) {
  const type = useCardCreateTypeScale()
  return (
    <div
      className={`grid items-center bg-[#F4F6F8] py-[12px] ${columnsClass}`}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <span aria-hidden="true" />
      <div className="flex min-w-0 items-center justify-between gap-[12px]">
        <p className="min-w-0 truncate text-[13px] font-[400] leading-[18px] text-[#1A2C44]">{capabilityListLabel(names)}</p>
        {onEdit ? (
          <button
            type="button"
            className={type.edit}
            onClick={(event) => {
              event.stopPropagation()
              onEdit()
            }}
          >
            Edit
          </button>
        ) : null}
      </div>
    </div>
  )
}

function ConfigurationRow({
  option,
  checked,
  locked,
  capabilityNames,
  separate,
  onToggle,
  onOpen,
}: {
  option: ConfigurationOption
  checked: boolean
  locked?: boolean
  capabilityNames?: string[]
  separate?: boolean
  onToggle?: () => void
  onOpen?: () => void
}) {
  const type = useCardCreateTypeScale()
  const canEdit = Boolean(onOpen) && checked && !locked
  const showNested = Boolean(separate) && checked && capabilityNames !== undefined
  const showInlineEdit = !separate && checked && capabilityNames !== undefined

  const label = locked
    ? `${option.title} is on this account`
    : checked ? `Remove ${option.title} configuration` : `Add ${option.title} configuration`
  const activate = () => {
    if (locked) return
    onToggle?.()
  }

  const checkbox = (
    <Checkbox
      checked={checked}
      label={label}
      decorative
      className={locked ? "opacity-55" : undefined}
      onChange={() => {}}
    />
  )

  const title = option.title
  const capabilityCount = capabilityNames?.length ?? 0
  const inlineEdit = showInlineEdit ? (
    <div className={`flex h-[28px] shrink-0 items-stretch overflow-hidden rounded-[8px] bg-[#F4F6F8] ${canEdit ? "" : "px-[10px]"}`}>
      <span className={`flex items-center text-[13px] font-[400] leading-[18px] text-[#273951] ${canEdit ? "pl-[10px] pr-[8px]" : ""}`}>
        {capabilityCount === 1 ? "1 capability" : `${capabilityCount} capabilities`}
      </span>
      {canEdit ? (
        <button
          type="button"
          className="px-[10px] text-[13px] font-[500] leading-[18px] text-[#533AFD] outline-none transition-colors hover:bg-[#F0EDFF] hover:text-[#4730E0]"
          onClick={(event) => {
            event.stopPropagation()
            onOpen?.()
          }}
        >
          Edit
        </button>
      ) : null}
    </div>
  ) : null

  const rowProps = {
    role: "button" as const,
    tabIndex: locked ? -1 : 0,
    "aria-pressed": checked,
    "aria-label": label,
    onClick: activate,
    onKeyDown: (event: { key: string; preventDefault: () => void }) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        activate()
      }
    },
  }

  const columnsClass = type.matchCard
    ? "grid-cols-[16px_minmax(0,1fr)] gap-[12px] px-[16px]"
    : "grid-cols-[14px_minmax(0,1fr)] gap-[8px] px-[12px]"

  const nested = showNested ? (
    <ConfigurationNestedCapabilities
      names={capabilityNames ?? []}
      onEdit={canEdit ? onOpen : undefined}
      columnsClass={columnsClass}
    />
  ) : null

  if (type.matchCard) {
    return (
      <div
        data-configuration={option.id}
        data-selected={checked ? "true" : "false"}
        data-existing={locked ? "true" : "false"}
        className={`overflow-hidden rounded-[8px] border border-[#E3E8EF] bg-white ${locked ? "opacity-55" : ""}`}
      >
        <div
          className={`grid min-h-[60px] items-start py-[12px] text-left outline-none ${columnsClass} ${
            locked ? "cursor-default" : "cursor-pointer"
          } ${checked || locked ? "" : "transition-colors hover:bg-[#FAFBFC]"}`}
          onClick={rowProps.onClick}
          onKeyDown={rowProps.onKeyDown}
          role="button"
          tabIndex={rowProps.tabIndex}
          aria-pressed={checked}
          aria-label={label}
        >
          <span className="mt-[2px] flex h-[20px] items-center">{checkbox}</span>
          <span className="flex min-w-0 items-center justify-between gap-[12px]">
            <span className="min-w-0">
              <span className="block text-[14px] font-[500] leading-[20px] tracking-[-0.08px] text-[#1A2C44]">{title}</span>
              <span className="mt-[2px] block text-[13px] font-[400] leading-[18px] text-[#596171]">{option.relationship}</span>
            </span>
            {inlineEdit}
          </span>
        </div>
        {nested}
      </div>
    )
  }

  return (
    <div
      data-configuration={option.id}
      data-selected={checked ? "true" : "false"}
      data-existing={locked ? "true" : "false"}
    >
      <div
        className={`grid items-start py-[10px] outline-none ${columnsClass} ${
          locked ? "bg-[#F8FAFB]" : "hover:bg-[#F8FAFB]"
        } ${locked ? "cursor-default" : "cursor-pointer"}`}
        onClick={rowProps.onClick}
        onKeyDown={rowProps.onKeyDown}
        role="button"
        tabIndex={rowProps.tabIndex}
        aria-pressed={checked}
        aria-label={label}
      >
        <span className="mt-[2px]">{checkbox}</span>
        <span className="flex min-w-0 items-center justify-between gap-[12px]">
          <span className="flex min-w-0 flex-col gap-[2px]">
            <span className={`${type.rowTitle} ${locked ? "text-[#596171]" : "text-[#1A2C44]"}`}>{title}</span>
            <span className={type.rowDetail}>{option.relationship}</span>
          </span>
          {inlineEdit}
        </span>
      </div>
      {nested}
    </div>
  )
}

function ConfigurationPicker({
  selected,
  existing,
  userPath,
  details,
  onChange,
  onDetailsChange,
  isNewAccount,
  isRepeat,
}: {
  selected: ConfigurationKind[]
  existing: ConfigurationKind[]
  userPath?: UserPath
  details: AccountDetailsDraft
  onChange: (next: ConfigurationKind[]) => void
  onDetailsChange: (patch: Partial<AccountDetailsDraft>) => void
  isNewAccount?: boolean
  isRepeat?: boolean
}) {
  const { productFormStyle } = useProductFormStyle()
  const { accountPropertiesLayout } = useAccountPropertiesLayout()
  const tokens = getFormTokens(productFormStyle)
  const type = useCardCreateTypeScale()
  const separate = accountPropertiesLayout === "separate"
  const options = getConfigurationOptions(userPath)
  const existingOptions = options.filter((option) => existing.includes(option.id))
  const addableOptions = options.filter((option) => !existing.includes(option.id))
  const activeConfigurations = Array.from(new Set([...existing, ...selected]))
  const [describeMode, setDescribeMode] = useState<"describe" | "recommend" | null>(null)
  const [editingGroup, setEditingGroup] = useState<"merchant" | "recipient" | null>(null)
  const toggle = (option: ConfigurationOption) => {
    onChange(selected.includes(option.id) ? selected.filter((item) => item !== option.id) : [...selected, option.id])
  }
  const canOpen = (id: ConfigurationKind): id is "merchant" | "recipient" => id === "merchant" || id === "recipient"
  const capabilityNamesFor = (id: "merchant" | "recipient") => (
    getCapabilitiesForGroup(id, activeConfigurations, details.disabledCapabilities, details.additionalCapabilities)
  )
  const closeCapabilities = () => setEditingGroup(null)
  return (
    <section className={type.headingContent} data-configuration-picker>
      <div>
        <h3 className={type.fieldLabel}>Configurations</h3>
        <p className={`mt-[6px] ${type.helper}`}>
          {isNewAccount && !isRepeat ? (
            <>
              Select all roles that apply to this account. Unsure?{" "}
              <button
                type="button"
                className="font-[500] text-[#533AFD] hover:text-[#4730E0]"
                onClick={() => setDescribeMode("recommend")}
              >
                View recommendation
              </button>
            </>
          ) : (
            <>
              Select all roles that apply to this account. Unsure?{" "}
              <button
                type="button"
                className="font-[500] text-[#533AFD] hover:text-[#4730E0]"
                onClick={() => setDescribeMode("describe")}
              >
                Tell us about the account
              </button>
              .
            </>
          )}
        </p>
      </div>
      <div className={existingOptions.length > 0 && addableOptions.length > 0 ? "flex flex-col gap-[16px]" : type.cardStack}>
      {existingOptions.length > 0 ? (
        <div className={type.cardStack}>
          <p className={type.helper}>On this account</p>
          <HoverTip text="You can deactivate configurations from the account details page.">
            <div className={type.matchCard ? type.cardStack : "divide-y divide-[#ECF1F6] overflow-hidden rounded-[8px] border border-[#E3E8EF] bg-white"}>
              {existingOptions.map((option) => {
                const groupId = canOpen(option.id) ? option.id : null
                return (
                  <ConfigurationRow
                    key={option.id}
                    option={option}
                    checked
                    locked
                    capabilityNames={groupId ? capabilityNamesFor(groupId) : undefined}
                    separate={separate}
                    onOpen={groupId ? () => setEditingGroup(groupId) : undefined}
                  />
                )
              })}
            </div>
          </HoverTip>
        </div>
      ) : null}
      {addableOptions.length > 0 ? (
        <div className={type.cardStack}>
          {existingOptions.length > 0 ? (
            <p className={type.helper}>Add</p>
          ) : null}
          <div className={type.matchCard ? type.cardStack : "divide-y divide-[#ECF1F6] overflow-hidden rounded-[8px] border border-[#E3E8EF] bg-white"}>
            {addableOptions.map((option) => {
              const groupId = canOpen(option.id) ? option.id : null
              return (
                <ConfigurationRow
                  key={option.id}
                  option={option}
                  checked={selected.includes(option.id)}
                  capabilityNames={groupId ? capabilityNamesFor(groupId) : undefined}
                  separate={separate}
                  onToggle={() => toggle(option)}
                  onOpen={groupId ? () => setEditingGroup(groupId) : undefined}
                />
              )
            })}
          </div>
        </div>
      ) : null}
      </div>
      <DescribeAccountModal
        isOpen={describeMode !== null}
        userPath={userPath}
        existing={existing}
        selected={selected}
        initialStep={describeMode === "recommend" ? "recommend" : "describe"}
        initialRecommended={describeMode === "recommend" ? getRecommendedConfigurations(userPath) : undefined}
        onClose={() => setDescribeMode(null)}
        onApply={onChange}
      />
      <CreationModalShell
        isOpen={Boolean(editingGroup)}
        onClose={closeCapabilities}
        title={editingGroup === "recipient" ? "Recipient capabilities" : "Merchant capabilities"}
        subtitle="Select all the capabilities you want to enable."
        modalWidth="w-[520px]"
        headerActions={
          <button
            type="button"
            aria-label="Close"
            className={`${tokens.closeButtonClass} shrink-0 self-start`}
            onClick={closeCapabilities}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        }
        footer={
          <div className="flex items-center justify-end border-t border-[#ECF1F6] bg-white px-[20px] py-[12px]">
            <button type="button" className={tokens.primaryButtonClass} onClick={closeCapabilities}>
              Save
            </button>
          </div>
        }
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-[20px] py-[16px]">
          {editingGroup ? (
            <CapabilitiesEditor
              groupId={editingGroup}
              configurations={[...existing, ...selected]}
              details={details}
              onChange={onDetailsChange}
            />
          ) : null}
        </div>
      </CreationModalShell>
    </section>
  )
}

function PayoutMethodFields({
  method,
  details,
  onChange,
}: {
  method: PayoutMethod
  details: PayoutMethodDetailDraft
  onChange: (patch: Partial<PayoutMethodDetailDraft>) => void
}) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })

  if (method === "bank-account") {
    return <div className="grid gap-[10px]"><Field label="Account holder"><input className={tokens.inputClass} placeholder="Account holder name" value={details.primary} onChange={(event) => onChange({ primary: event.target.value })} /></Field><Field label="Account number"><input className={tokens.inputClass} placeholder="Account number" value={details.secondary} onChange={(event) => onChange({ secondary: event.target.value })} /></Field></div>
  }
  return <div className="grid gap-[10px]"><Field label="Cardholder"><input className={tokens.inputClass} placeholder="Cardholder name" value={details.primary} onChange={(event) => onChange({ primary: event.target.value })} /></Field><Field label="Card number"><input className={tokens.inputClass} placeholder="Card number" value={details.secondary} onChange={(event) => onChange({ secondary: event.target.value })} /></Field></div>
}

function payoutMethodSummary(method: PayoutMethod, details: PayoutMethodDetailDraft, fallback: string) {
  if (method === "stripe-balance") return fallback
  const lastFour = details.secondary.replace(/\s/g, "").slice(-4)
  if (method === "bank-account") return lastFour ? `Account ending ${lastFour}` : details.primary || "No details added"
  return lastFour ? `Card ending ${lastFour}` : details.primary || "No details added"
}

function HoverTip({ text, children }: { text: string; children: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  const updatePosition = () => {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    setCoords({
      top: rect.top + 18,
      left: Math.min(Math.max(rect.left + rect.width / 2, 128), window.innerWidth - 128),
    })
  }

  useEffect(() => {
    if (!open) return
    const onReposition = () => updatePosition()
    window.addEventListener("scroll", onReposition, true)
    window.addEventListener("resize", onReposition)
    return () => {
      window.removeEventListener("scroll", onReposition, true)
      window.removeEventListener("resize", onReposition)
    }
  }, [open])

  return (
    <div
      ref={wrapRef}
      onMouseEnter={() => {
        updatePosition()
        setOpen(true)
      }}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {open
        ? createPortal(
            <span
              role="tooltip"
              className="t-tt text-[12px] font-[400] leading-[16px] tracking-[-0.024px]"
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                right: "auto",
                bottom: "auto",
                width: "max-content",
                maxWidth: "min(240px, calc(100vw - 16px))",
                whiteSpace: "normal",
                background: "#1A2234",
                color: "#FFFFFF",
                opacity: 1,
                transform: "translate(-50%, -100%)",
                transformOrigin: "50% 100%",
                zIndex: 10000,
                pointerEvents: "none",
              }}
            >
              {text}
            </span>,
            document.body,
          )
        : null}
    </div>
  )
}

function PayoutInformationSection({
  configurations,
  existingConfigurations,
  details,
  userPath,
  onChange,
}: {
  configurations: ConfigurationKind[]
  existingConfigurations: ConfigurationKind[]
  details: AccountDetailsDraft
  userPath?: UserPath
  onChange: (patch: Partial<AccountDetailsDraft>) => void
}) {
  const [openMethod, setOpenMethod] = useState<PayoutMethod | null>(null)
  const type = useCardCreateTypeScale()
  const isDirect = userPath === "direct"
  const merchantSelected = configurations.includes("merchant") || existingConfigurations.includes("merchant")
  const payoutMethods = isDirect ? PAYOUT_METHODS.filter((method) => method.id !== "stripe-balance") : PAYOUT_METHODS

  useEffect(() => {
    if ((!isDirect && merchantSelected) || !details.payoutMethods.includes("stripe-balance")) return
    onChange({ payoutMethods: details.payoutMethods.filter((method) => method !== "stripe-balance") })
    if (openMethod === "stripe-balance") setOpenMethod(null)
  }, [isDirect, merchantSelected, details.payoutMethods, onChange, openMethod])

  const toggleMethod = (method: PayoutMethod, checked: boolean) => {
    onChange({
      payoutMethods: checked
        ? Array.from(new Set([...details.payoutMethods, method]))
        : details.payoutMethods.filter((candidate) => candidate !== method),
      ...(!checked
        ? {
            payoutMethodDetails: {
              ...details.payoutMethodDetails,
              [method]: { primary: "", secondary: "" },
            },
          }
        : {}),
    })
    if (checked && method !== "stripe-balance") setOpenMethod(method)
    else if (!checked && openMethod === method) setOpenMethod(null)
  }

  const toggleEditor = (method: PayoutMethod) => {
    if (openMethod === method) {
      const methodDetails = details.payoutMethodDetails[method]
      if (!details.payoutMethods.includes(method) && (methodDetails.primary || methodDetails.secondary)) {
        onChange({ payoutMethods: [...details.payoutMethods, method] })
      }
      setOpenMethod(null)
      return
    }
    setOpenMethod(method)
  }

  const updatePayoutMethod = (method: PayoutMethod, patch: Partial<PayoutMethodDetailDraft>) => {
    onChange({
      payoutMethodDetails: {
        ...details.payoutMethodDetails,
        [method]: { ...details.payoutMethodDetails[method], ...patch },
      },
    })
  }

  return (
    <section className={type.headingContent} data-payout-information>
      <div>
        <h3 className={type.sectionTitle}>Payout methods</h3>
        <p className={`mt-[6px] ${type.helper}`}>Don’t have payout details? You can choose to have Stripe email the account to collect them later.</p>
      </div>
      <div className={type.cardStack}>
        {payoutMethods.map((method) => {
          const checked = details.payoutMethods.includes(method.id)
          const methodDetails = details.payoutMethodDetails[method.id]
          const canAddDetails = method.id !== "stripe-balance"
          const locked = method.id === "stripe-balance" && !merchantSelected
          const open = openMethod === method.id
          const card = (
            <div
              className={`overflow-hidden rounded-[8px] border border-[#E3E8EF] bg-white ${locked ? "opacity-55" : ""}`}
            >
              <div className="flex min-h-[60px] items-start">
                {open ? (
                  <div className="flex min-w-0 flex-1 items-start gap-[12px] px-[16px] py-[12px]">
                    <span className="mt-[2px] flex h-[20px] items-center">
                      <Checkbox
                        checked={checked}
                        label={method.label}
                        onChange={(next) => {
                          if (locked) return
                          toggleMethod(method.id, next)
                        }}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block ${type.rowTitle} text-[#1A2C44]`}>
                        {method.label}
                      </span>
                      <span className={`mt-[2px] block font-[400] ${type.rowDetail}`}>
                        {payoutMethodSummary(method.id, methodDetails, method.description)}
                      </span>
                    </span>
                  </div>
                ) : (
                  <div
                    role="button"
                    tabIndex={locked ? -1 : 0}
                    aria-pressed={checked}
                    aria-label={method.label}
                    className={`flex min-w-0 flex-1 items-start gap-[12px] px-[16px] py-[12px] text-left outline-none ${locked ? "cursor-default" : "cursor-pointer"}`}
                    onClick={() => {
                      if (locked) return
                      toggleMethod(method.id, !checked)
                    }}
                    onKeyDown={(event) => {
                      if (locked) return
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        toggleMethod(method.id, !checked)
                      }
                    }}
                  >
                    <span className="mt-[2px] flex h-[20px] items-center">
                      <Checkbox
                        checked={checked}
                        label={method.label}
                        decorative
                        onChange={() => {}}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block ${type.rowTitle} text-[#1A2C44]`}>
                        {method.label}
                      </span>
                      <span className={`mt-[2px] block font-[400] ${type.rowDetail}`}>
                        {payoutMethodSummary(method.id, methodDetails, method.description)}
                      </span>
                    </span>
                  </div>
                )}
                {canAddDetails && checked ? (
                  <div className="flex items-center self-center pr-[16px]">
                    <button
                      type="button"
                      className={type.edit}
                      aria-expanded={open}
                      onClick={() => toggleEditor(method.id)}
                    >
                      {open ? "Done" : "Edit"}
                    </button>
                  </div>
                ) : null}
              </div>
              {canAddDetails ? (
                <motion.div
                  initial={false}
                  animate={open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-[#ECF1F6] bg-[#F8FAFB] p-[12px]">
                    <PayoutMethodFields method={method.id} details={methodDetails} onChange={(patch) => updatePayoutMethod(method.id, patch)} />
                  </div>
                </motion.div>
              ) : null}
            </div>
          )
          return locked ? (
            <HoverTip key={method.id} text="Select the merchant configuration to enable this.">
              {card}
            </HoverTip>
          ) : (
            <div key={method.id}>{card}</div>
          )
        })}
      </div>
    </section>
  )
}

function billingDetailsSummary(details: AccountDetailsDraft) {
  const address = formatAddressSummary([details.billingLine1, details.billingCity, details.billingState, details.billingPostalCode])
  if (address) return address
  if (!details.useAccountEmailForBilling && details.billingEmail?.trim()) return details.billingEmail.trim()
  return "Not added"
}

function shippingDetailsSummary(details: AccountDetailsDraft) {
  if (details.sameAsBilling) return "Same as billing details"
  return formatAddressSummary([details.shippingLine1, details.shippingCity, details.shippingState, details.shippingPostalCode])
    || details.shippingAddress
    || "Not added"
}

function taxDetailsSummary(details: AccountDetailsDraft) {
  if (details.taxStatus === "exempt") return details.taxId ? `Exempt · ${details.taxId}` : "Exempt"
  if (details.taxStatus === "reverse") return details.taxId ? `Reverse charge · ${details.taxId}` : "Reverse charge"
  return details.taxId ? `Tax ID · ${details.taxId}` : "Not added"
}

function billingAddressValue(details: AccountDetailsDraft): AddressValue {
  const country = details.billingCountry || details.country || "United States"
  return {
    country,
    line1: details.billingLine1,
    line2: details.billingLine2,
    city: details.billingCity,
    state: details.billingState,
    postalCode: details.billingPostalCode,
    phone: details.billingPhone,
    phoneCountry: details.billingPhoneCountry || phoneCountryFromBillingCountry(country),
  }
}

function shippingAddressValue(details: AccountDetailsDraft): AddressValue {
  if (details.sameAsBilling) {
    return { ...billingAddressValue(details), name: getDraftName(details) }
  }
  const country = details.shippingCountry || details.billingCountry || details.country || "United States"
  return {
    name: details.shippingName,
    country,
    line1: details.shippingLine1,
    line2: details.shippingLine2,
    city: details.shippingCity,
    state: details.shippingState,
    postalCode: details.shippingPostalCode,
    phone: details.shippingPhone,
    phoneCountry: details.shippingPhoneCountry || phoneCountryFromBillingCountry(country),
  }
}

function CustomerDetailsSection({ details, onChange }: { details: AccountDetailsDraft; onChange: (patch: Partial<AccountDetailsDraft>) => void }) {
  const [openRow, setOpenRow] = useState<"billing" | "tax" | "shipping" | null>(null)
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  const type = useCardCreateTypeScale()

  return (
    <section className={type.headingContent}>
      <h3 className={type.sectionTitle}>Billing and shipping</h3>
      <div className={type.cardStack}>
        <ReviewRow title="Billing details" summary={billingDetailsSummary(details)} open={openRow === "billing"} onToggle={() => setOpenRow(openRow === "billing" ? null : "billing")}>
          <div className="flex flex-col gap-[12px]">
            <div className="flex items-center justify-between gap-[12px]"><div><p className={`${type.rowTitle} text-[#1A2C44]`}>Use account email</p><p className={`mt-[2px] ${type.helper}`}>Send billing notices to the account address.</p></div><Toggle checked={details.useAccountEmailForBilling} label="Use account email for billing" onChange={(useAccountEmailForBilling) => onChange({ useAccountEmailForBilling, billingEmail: useAccountEmailForBilling ? "" : details.billingEmail })} /></div>
            {!details.useAccountEmailForBilling ? <Field label="Billing email"><input type="email" className={tokens.inputClass} placeholder={details.accountEmail || "billing@example.com"} value={details.billingEmail} onChange={(event) => onChange({ billingEmail: event.target.value })} /></Field> : null}
            <Field label="Billing address">
              <AddressFields
                showCountry={false}
                value={billingAddressValue(details)}
                tokens={tokens}
                onChange={(patch) => onChange({
                  billingCountry: patch.country ?? (details.billingCountry || details.country || "United States"),
                  billingLine1: patch.line1 ?? details.billingLine1,
                  billingLine2: patch.line2 ?? details.billingLine2,
                  billingCity: patch.city ?? details.billingCity,
                  billingState: patch.state ?? details.billingState,
                  billingPostalCode: patch.postalCode ?? details.billingPostalCode,
                  billingPhone: patch.phone ?? details.billingPhone,
                  billingPhoneCountry: patch.phoneCountry ?? details.billingPhoneCountry,
                })}
              />
            </Field>
          </div>
        </ReviewRow>
        <ReviewRow title="Shipping details" summary={shippingDetailsSummary(details)} open={openRow === "shipping"} onToggle={() => setOpenRow(openRow === "shipping" ? null : "shipping")}>
          <div className="flex flex-col gap-[12px]">
            <div className="flex items-center justify-between gap-[12px]">
              <p className={`${type.rowTitle} text-[#1A2C44]`}>Same as billing details</p>
              <Toggle checked={details.sameAsBilling} label="Same as billing details" onChange={(sameAsBilling) => onChange({ sameAsBilling })} />
            </div>
            {details.sameAsBilling ? null : (
              <AddressFields
                value={shippingAddressValue(details)}
                tokens={tokens}
                onChange={(patch) => onChange({
                  shippingName: patch.name ?? details.shippingName,
                  shippingCountry: patch.country ?? (details.shippingCountry || details.country || "United States"),
                  shippingLine1: patch.line1 ?? details.shippingLine1,
                  shippingLine2: patch.line2 ?? details.shippingLine2,
                  shippingCity: patch.city ?? details.shippingCity,
                  shippingState: patch.state ?? details.shippingState,
                  shippingPostalCode: patch.postalCode ?? details.shippingPostalCode,
                  shippingPhone: patch.phone ?? details.shippingPhone,
                  shippingPhoneCountry: patch.phoneCountry ?? details.shippingPhoneCountry,
                  shippingAddress: formatAddressSummary([
                    patch.line1 ?? details.shippingLine1,
                    patch.city ?? details.shippingCity,
                    patch.state ?? details.shippingState,
                    patch.postalCode ?? details.shippingPostalCode,
                  ]),
                })}
              />
            )}
          </div>
        </ReviewRow>
        <ReviewRow title="Tax and exemptions" summary={taxDetailsSummary(details)} open={openRow === "tax"} onToggle={() => setOpenRow(openRow === "tax" ? null : "tax")}>
          <div className="flex flex-col gap-[12px]">
            <Field label="Tax status">
              <SelectControl className={tokens.selectClass} value={details.taxStatus} onChange={(taxStatus) => onChange({ taxStatus: taxStatus as AccountDetailsDraft["taxStatus"] })}>
                <option value="taxable">Taxable</option>
                <option value="exempt">Exempt</option>
                <option value="reverse">Reverse charge</option>
              </SelectControl>
            </Field>
            <Field label="Tax ID">
              <input className={tokens.inputClass} placeholder="GB123456789" value={details.taxId} onChange={(event) => onChange({ taxId: event.target.value })} />
            </Field>
          </div>
        </ReviewRow>
      </div>
    </section>
  )
}

function groupCapabilitySections(items: CapabilityItem[], defaultTitle: string) {
  const sections: { id: string; title: string; items: CapabilityItem[] }[] = []
  const indexById = new Map<string, number>()
  for (const item of items) {
    const id = item.section ?? "default"
    const title = id === "local" ? "Local payment methods" : defaultTitle
    let index = indexById.get(id)
    if (index === undefined) {
      index = sections.length
      indexById.set(id, index)
      sections.push({ id, title, items: [] })
    }
    sections[index].items.push(item)
  }
  return sections
}

function groupItemsByCountry(items: CapabilityItem[]) {
  const groups: { country: string; items: CapabilityItem[] }[] = []
  const indexByCountry = new Map<string, number>()
  for (const item of items) {
    const country = item.country ?? "Other"
    let index = indexByCountry.get(country)
    if (index === undefined) {
      index = groups.length
      indexByCountry.set(country, index)
      groups.push({ country, items: [] })
    }
    groups[index].items.push(item)
  }
  return groups
}

function CapabilitiesEditor({
  configurations,
  details,
  onChange,
  groupId,
}: {
  configurations: ConfigurationKind[]
  details: AccountDetailsDraft
  onChange: (patch: Partial<AccountDetailsDraft>) => void
  groupId: "merchant" | "recipient"
}) {
  const type = useCardCreateTypeScale()
  const requested = new Set(getCapabilities(configurations, details.disabledCapabilities, details.additionalCapabilities))
  const visibleGroups = CAPABILITY_GROUPS.filter((group) => group.id === groupId)

  const isChecked = (name: string) => requested.has(name)
  const toggleCapability = (name: string, required: boolean, checked: boolean) => {
    if (required) return
    const defaults = new Set(
      CONFIGURATION_OPTIONS
        .filter((option) => configurations.includes(option.id))
        .flatMap((option) => option.capabilities),
    )
    if (defaults.has(name)) {
      onChange({
        disabledCapabilities: checked
          ? details.disabledCapabilities.filter((capability) => capability !== name)
          : [...details.disabledCapabilities, name],
      })
      return
    }
    onChange({
      additionalCapabilities: checked
        ? Array.from(new Set([...details.additionalCapabilities, name]))
        : details.additionalCapabilities.filter((capability) => capability !== name),
    })
  }
  const toggleItems = (names: string[], checked: boolean) => {
    if (checked) {
      onChange({
        additionalCapabilities: Array.from(new Set([...details.additionalCapabilities, ...names])),
        disabledCapabilities: details.disabledCapabilities.filter((capability) => !names.includes(capability)),
      })
      return
    }
    onChange({
      additionalCapabilities: details.additionalCapabilities.filter((capability) => !names.includes(capability)),
    })
  }

  return (
    <div className="flex flex-col">
        {visibleGroups.map((group) => {
          const items = group.items
          const sections = groupCapabilitySections(items, group.id === "merchant" ? "Core capabilities" : "Capabilities")
          return (
            <div key={group.id} className="flex flex-col">
              {sections.map((section, index) => {
                const optional = section.items.filter((item) => !item.required).map((item) => item.name)
                const allOptionalChecked = optional.length > 0 && optional.every((name) => isChecked(name))
                const countryGroups = section.id === "local" ? groupItemsByCountry(section.items) : [{ country: "", items: section.items }]
                const helper = section.id === "local"
                  ? "Payment options commonly used in a specific country or region."
                  : group.id === "merchant"
                    ? "The standard way to accept payments in most countries."
                    : null
                const renderItem = (item: CapabilityItem) => {
                  const checked = isChecked(item.name)
                  return (
                    <div
                      key={item.name}
                      className={`flex h-[28px] items-center gap-[8px] text-[14px] font-[400] leading-[20px] tracking-[-0.15px] ${
                        item.required ? "text-[#818DA0]" : "text-[#273951]"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        label={`${checked ? "Remove" : "Add"} ${item.name}`}
                        className={item.required ? "pointer-events-none opacity-55" : undefined}
                        onChange={(next) => toggleCapability(item.name, Boolean(item.required), next)}
                      />
                      {item.name}
                    </div>
                  )
                }
                return (
                  <div
                    key={`${group.id}-${section.id}`}
                    className={index > 0 ? "mt-[16px] border-t border-[#ECF1F6] pt-[16px]" : undefined}
                  >
                    <p className={type.fieldLabel}>{section.title}</p>
                    {helper ? (
                      <p className={`mt-[4px] ${type.helper}`}>{helper}</p>
                    ) : null}
                    <div className="mt-[8px] flex flex-col">
                      {optional.length > 0 ? (
                        <div className="flex h-[28px] items-center gap-[8px] text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#273951]">
                          <Checkbox
                            checked={allOptionalChecked}
                            label={allOptionalChecked ? "Clear all local payment methods" : "Select all local payment methods"}
                            onChange={(next) => toggleItems(optional, next)}
                          />
                          Select all
                        </div>
                      ) : null}
                      {countryGroups.map((countryGroup) => (
                        <div key={countryGroup.country || "default"} className={countryGroup.country ? "mt-[12px]" : undefined}>
                          {countryGroup.country ? (
                            <p className="mb-[4px] text-[12px] font-[500] leading-[16px] text-[#818DA0]">{countryGroup.country}</p>
                          ) : null}
                          {countryGroup.items.map(renderItem)}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
    </div>
  )
}

function OnboardingSection({ details, onChange }: { details: AccountDetailsDraft; onChange: (patch: Partial<AccountDetailsDraft>) => void }) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  const type = useCardCreateTypeScale()

  return (
    <section className={type.headingContent} data-onboarding-placement="pre-save">
      <div><h3 className={type.sectionTitle}>After creation</h3><p className={`${type.headingHelper} ${type.helper}`}>Choose how the account will finish providing any remaining information.</p></div>
      <div className={type.section}>
        <SegmentedControl
          value={details.onboardingAction}
          options={ONBOARDING_ACTION_OPTIONS}
          getDisplayValue={(value) => value === "send-email" ? "Send email" : "Copy link"}
          onChange={(onboardingAction) => onChange({ onboardingAction })}
          variantOverride="segmented"
        />
      {details.onboardingAction === "send-email" ? (
        <div className="rounded-[8px] border border-[#D4DEE9] bg-[#F8FAFB] p-[12px]">
          <div className="flex items-center justify-between gap-[12px]"><div><p className={`${type.rowTitle} text-[#1A2C44]`}>Use account email</p><p className={`mt-[2px] ${type.helper}`}>Send the secure onboarding link after creation.</p></div><Toggle checked={details.useAccountEmailForOnboarding} label="Use account email for onboarding" onChange={(useAccountEmailForOnboarding) => onChange({ useAccountEmailForOnboarding })} /></div>
          {!details.useAccountEmailForOnboarding ? <div className="mt-[10px]"><Field label="Onboarding email"><input type="email" className={tokens.inputClass} placeholder="account@example.com" value={details.onboardingEmail} onChange={(event) => onChange({ onboardingEmail: event.target.value })} aria-invalid={details.onboardingEmail.length > 0 && !EMAIL_PATTERN.test(details.onboardingEmail)} /></Field></div> : null}
        </div>
      ) : (
        <div className="rounded-[8px] border border-[#D4DEE9] bg-[#F8FAFB] p-[12px]"><p className={type.helper}>The secure link will be copied after the account is created.</p><p className="mt-[4px] truncate font-mono text-[10px] text-[#818DA0]">{ACCOUNT_ONBOARDING_LINK}</p></div>
      )}
      </div>
    </section>
  )
}

export function AccountConfigurationForm({
  selectionStyle,
  onboardingStyle,
  source,
  selectedAccountId,
  details,
  configurations,
  existingConfigurations,
  userPath,
  onChooseExisting,
  onPrepareNew,
  onChooseNew,
  onClearSelected,
  onSelectExisting,
  onDetailsChange,
  onConfigurationsChange,
}: {
  selectionStyle: AccountSelectionStyle
  onboardingStyle: AccountOnboardingStyle
  source: AccountSource
  selectedAccountId: string
  details: AccountDetailsDraft
  configurations: ConfigurationKind[]
  existingConfigurations: ConfigurationKind[]
  userPath?: UserPath
  onChooseExisting: () => void
  onPrepareNew: () => void
  onChooseNew: () => void
  onClearSelected?: () => void
  onSelectExisting: (account: NetworkAccount) => void
  onDetailsChange: (patch: Partial<AccountDetailsDraft>) => void
  onConfigurationsChange: (next: ConfigurationKind[]) => void
}) {
  const type = useCardCreateTypeScale()
  const refinedLookup = useRefinedEmailLookup(details.accountEmail, (selectionStyle === "refined" || selectionStyle === "repeat") && source === "new")
  const canConfigure = source === "new" || Boolean(selectedAccountId)
  return (
    <div className={type.stack}>
      <AccountSelector
        style={selectionStyle}
        source={source}
        selectedAccountId={selectedAccountId}
        details={details}
        userPath={userPath}
        onChooseExisting={onChooseExisting}
        onPrepareNew={onPrepareNew}
        onChooseNew={onChooseNew}
        onSelectExisting={onSelectExisting}
        onDetailsChange={onDetailsChange}
        lookupStatus={refinedLookup.status}
        lookupMatch={refinedLookup.match}
        dismissedMatchId={refinedLookup.dismissedMatchId}
        onDismissMatch={refinedLookup.dismissMatch}
        onCommitEmail={refinedLookup.commitNow}
      />
      {canConfigure ? (
        <ConfigurationPicker
          selected={configurations}
          existing={existingConfigurations}
          userPath={userPath}
          details={details}
          onChange={onConfigurationsChange}
          onDetailsChange={onDetailsChange}
          isNewAccount={source === "new"}
          isRepeat={selectionStyle === "repeat"}
        />
      ) : null}
      {configurations.includes("customer") ? <CustomerDetailsSection details={details} onChange={onDetailsChange} /> : null}
      {configurations.includes("recipient") ? <PayoutInformationSection configurations={configurations} existingConfigurations={existingConfigurations} details={details} userPath={userPath} onChange={onDetailsChange} /> : null}
      {source === "new" && configurations.length > 0 && onboardingStyle === "pre-save" ? <OnboardingSection details={details} onChange={onDetailsChange} /> : null}
    </div>
  )
}
