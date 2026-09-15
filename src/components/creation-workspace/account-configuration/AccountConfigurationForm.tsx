'use client'

import { motion } from "framer-motion"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"

import { SegmentedControl } from "@/components/SegmentedControl"
import { CreationModalShell } from "@/components/creation-workspace/CreationModalShell"
import { EntityDropdown, type EntityDropdownHandle } from "@/components/creation-workspace/forms/EntityDropdown"
import { Checkbox } from "@/components/creation-workspace/forms/shared/Checkbox"
import { getFormTokens } from "@/components/creation-workspace/forms/shared/formTokens"
import { useInputFill } from "@/components/creation-workspace/inputFill"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { useAccountConflictNudgeMode } from "@/components/creation-workspace/accountConflictNudgeMode"
import type { AccountOnboardingStyle } from "@/components/creation-workspace/accountOnboardingStyle"
import type { AccountSelectionStyle } from "@/components/creation-workspace/accountSelectionStyle"

import {
  AccountSummaryCard,
  CountryBadge,
  Field,
  ReviewRow,
  SelectControl,
  Toggle,
} from "./AccountConfigurationPrimitives"
import {
  ACCOUNT_ONBOARDING_LINK,
  CAPABILITY_GROUPS,
  CONFIGURATION_OPTIONS,
  EMAIL_PATTERN,
  NETWORK_ACCOUNTS,
  PAYOUT_METHODS,
  getCapabilities,
  getAccountRoles,
  getDraftName,
  isNewAccountIdentityValid,
  type AccountDetailsDraft,
  type AccountSource,
  type ConfigurationKind,
  type ConfigurationOption,
  type DashboardAccess,
  type FeePayer,
  type NegativeBalanceLiability,
  type NetworkAccount,
  type PayoutMethod,
  type PayoutMethodDetailDraft,
} from "./model"

const ACCOUNT_TYPE_OPTIONS = ["Company", "Individual"] as const
const ACCOUNT_SOURCE_OPTIONS = ["existing", "new"] as const
const ONBOARDING_ACTION_OPTIONS = ["send-email", "copy-link"] as const

function FieldHint({ label, children }: { label: string; children: string }) {
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

function PropertyLabel({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex items-center gap-[6px]">
      <p className="text-[12px] font-[400] leading-[16px] text-[#273951]">{label}</p>
      <FieldHint label={label}>{hint}</FieldHint>
    </div>
  )
}
const NETWORK_ACCOUNT_ITEMS = NETWORK_ACCOUNTS.map((account) => ({ id: account.id, name: account.name, detail: account.email }))

function getNetworkAccountSearchText(item: { id: string; name: string }) {
  const account = NETWORK_ACCOUNTS.find((candidate) => candidate.id === item.id)
  return account ? `${account.name} ${account.email} ${account.id} ${account.country} ${getAccountRoles(account).join(" ")}` : item.name
}

function AccountPickerOption({ id }: { id: string }) {
  const account = NETWORK_ACCOUNTS.find((candidate) => candidate.id === id)
  if (!account) return null
  const configurations = CONFIGURATION_OPTIONS
    .filter((option) => account.configurations.includes(option.id))
    .map((option) => option.title)
    .join(", ")

  return (
    <span className="flex min-w-0 flex-1 flex-col py-[2px]">
      <span className="flex min-w-0 items-center justify-between gap-[10px]">
        <span className="truncate text-[12px] font-[600] text-[#1A2C44]">{account.name}</span>
        <CountryBadge country={account.country} size="sm" />
      </span>
      <span className="mt-[1px] truncate text-[11px] leading-[16px] text-[#6C7688]">{account.email} · {configurations}</span>
    </span>
  )
}

function findMatchingNetworkAccount(email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  if (!EMAIL_PATTERN.test(normalizedEmail)) return undefined

  const matches = NETWORK_ACCOUNTS.filter((account) => (
    account.email.toLowerCase() === normalizedEmail
  ))
  return matches.length === 1 ? matches[0] : undefined
}

function DuplicateAccountNudge({
  account,
  onUseExisting,
  onDismiss,
}: {
  account: NetworkAccount
  onUseExisting: () => void
  onDismiss: () => void
}) {
  return (
    <div
      className="overflow-hidden rounded-[8px] border border-[#D4DEE9] bg-white shadow-[0_8px_24px_rgba(26,44,68,0.12)]"
      data-duplicate-account-nudge
      role="region"
      aria-label="Existing account found"
    >
      <div className="p-[8px]">
        <AccountSummaryCard account={account} />
        <p className="px-[8px] pb-[4px] pt-[8px] text-[11px] leading-[16px] text-[#3C4F69]">
          This email matches an existing account in your network. Continue with it to add configurations and any remaining details instead of creating a duplicate.
        </p>
      </div>
      <div className="flex justify-end gap-[6px] border-t border-[#ECF1F6] bg-[#F8FAFB] p-[8px]">
        <button type="button" className="rounded-[6px] px-[8px] py-[5px] text-[11px] font-[600] text-[#526378] hover:bg-[#EEF2F6]" onClick={onDismiss}>Create new anyway</button>
        <button type="button" className="rounded-[6px] bg-[#675DFF] px-[8px] py-[5px] text-[11px] font-[600] text-white hover:bg-[#5B52F0]" onClick={onUseExisting}>Use existing account</button>
      </div>
    </div>
  )
}

function AccountIdentityFields({
  details,
  onChange,
  onUseExisting,
  autoFocus = false,
}: {
  details: AccountDetailsDraft
  onChange: (patch: Partial<AccountDetailsDraft>) => void
  onUseExisting: (account: NetworkAccount) => void
  autoFocus?: boolean
}) {
  const [dismissedMatchId, setDismissedMatchId] = useState("")
  const firstInputRef = useRef<HTMLInputElement>(null)
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const { accountConflictNudgeMode } = useAccountConflictNudgeMode()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  const matchingAccount = accountConflictNudgeMode === "off"
    ? undefined
    : accountConflictNudgeMode === "always" && details.accountEmail.trim()
      ? NETWORK_ACCOUNTS.find((account) => account.id === "acct_juniper")
      : findMatchingNetworkAccount(details.accountEmail)

  useEffect(() => {
    if (!autoFocus) return
    requestAnimationFrame(() => firstInputRef.current?.focus({ preventScroll: true }))
  }, [autoFocus])

  return (
    <div className="flex flex-col gap-[12px]" data-new-account-fields>
      <Field label="Account email">
        <input
          ref={firstInputRef}
          type="email"
          className={tokens.inputClass}
          placeholder="email@example.com"
          value={details.accountEmail}
          onChange={(event) => onChange({ accountEmail: event.target.value })}
          aria-invalid={details.accountEmail.length > 0 && !EMAIL_PATTERN.test(details.accountEmail)}
        />
      </Field>
      {matchingAccount && dismissedMatchId !== matchingAccount.id ? (
        <DuplicateAccountNudge
          account={matchingAccount}
          onUseExisting={() => onUseExisting(matchingAccount)}
          onDismiss={() => setDismissedMatchId(matchingAccount.id)}
        />
      ) : null}
      <div className="flex flex-col gap-[4px]">
        <span className={tokens.labelClass}>Account type</span>
        <SegmentedControl
          value={details.type}
          options={ACCOUNT_TYPE_OPTIONS}
          onChange={(type) => onChange({ type })}
          variantOverride="segmented"
        />
      </div>
      {details.type === "Company" ? (
        <Field label="Registered name">
          <input className={tokens.inputClass} placeholder="Example Corp Inc" value={details.registeredName} onChange={(event) => onChange({ registeredName: event.target.value })} />
        </Field>
      ) : (
        <Field label="Legal name">
          <span className="grid gap-[6px]">
            <input aria-label="First name" className={tokens.inputClass} placeholder="First name" value={details.firstName} onChange={(event) => onChange({ firstName: event.target.value })} />
            <input aria-label="Last name" className={tokens.inputClass} placeholder="Last name" value={details.lastName} onChange={(event) => onChange({ lastName: event.target.value })} />
          </span>
        </Field>
      )}
      <Field label="Country">
        <SelectControl
          className={tokens.selectClass}
          value={details.country}
          onChange={(country) => onChange({ country, billingCountry: details.billingCountry || country })}
        >
          <option value="">Select a country</option>
          <option>United Kingdom</option>
          <option>United States</option>
          <option>Canada</option>
        </SelectControl>
      </Field>
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
  onChooseExisting,
  onPrepareNew,
  onChooseNew,
  onSelectExisting,
  onDetailsChange,
}: {
  style: AccountSelectionStyle
  source: AccountSource
  selectedAccountId: string
  details: AccountDetailsDraft
  onChooseExisting: () => void
  onPrepareNew: () => void
  onChooseNew: () => void
  onSelectExisting: (account: NetworkAccount) => void
  onDetailsChange: (patch: Partial<AccountDetailsDraft>) => void
}) {
  const [newAccountModalOpen, setNewAccountModalOpen] = useState(false)
  const accountPickerRef = useRef<EntityDropdownHandle>(null)
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)
  const draftName = getDraftName(details)
  const selectedLabel = source === "new" ? draftName || "New account" : undefined
  const selectedAccount = source === "existing"
    ? NETWORK_ACCOUNTS.find((account) => account.id === selectedAccountId)
    : undefined

  useEffect(() => {
    const openTimer = window.setTimeout(() => accountPickerRef.current?.open(), 250)
    return () => window.clearTimeout(openTimer)
  }, [])

  const selectExisting = (id: string) => {
    const account = NETWORK_ACCOUNTS.find((candidate) => candidate.id === id)
    if (account) onSelectExisting(account)
  }

  const accountPicker = (
    <EntityDropdown
      ref={accountPickerRef}
      label="Account"
      placeholder="Find or add an account"
      searchPlaceholder="Search by name, email, or account ID"
      items={NETWORK_ACCOUNT_ITEMS}
      getSearchText={getNetworkAccountSearchText}
      renderOption={(item) => <AccountPickerOption id={item.id} />}
      insetOptionHover
      selectedId={source === "existing" ? selectedAccountId : ""}
      selectedLabel={selectedLabel}
      selectedIsPlaceholder={source === "new" && !draftName}
      onSelect={selectExisting}
      addNewLabel="Create new account"
      onAddNew={() => {
        if (source !== "new") onPrepareNew()
        if (style === "related-modal") setNewAccountModalOpen(true)
        else onChooseNew()
      }}
      onEdit={source === "new" && style === "related-modal" ? () => setNewAccountModalOpen(true) : undefined}
    />
  )

  return (
    <section className="flex flex-col gap-[12px]" data-account-selection-style={style}>
      {style === "source-toggle" ? (
        <>
          <div>
            <SegmentedControl
              value={source}
              options={ACCOUNT_SOURCE_OPTIONS}
              getDisplayValue={(value) => value === "existing" ? "Existing account" : "New account"}
              onChange={(value) => {
                if (value === "existing") onChooseExisting()
                else {
                  if (source !== "new") onPrepareNew()
                  onChooseNew()
                }
              }}
              variantOverride="segmented"
            />
          </div>
          {source === "existing" ? (
            <>
              {accountPicker}
              {selectedAccount ? <SelectedAccountSummary account={selectedAccount} /> : null}
            </>
          ) : <AccountIdentityFields details={details} onChange={onDetailsChange} onUseExisting={onSelectExisting} />}
        </>
      ) : (
        <>
          {accountPicker}
          {selectedAccount ? <SelectedAccountSummary account={selectedAccount} /> : null}
          {style === "picker" && source === "new" ? (
            <AccountIdentityFields
              details={details}
              onChange={onDetailsChange}
              onUseExisting={onSelectExisting}
              autoFocus
            />
          ) : null}
        </>
      )}

      <CreationModalShell
        isOpen={newAccountModalOpen}
        onClose={() => setNewAccountModalOpen(false)}
        title={source === "new" ? "Edit account" : "New account"}
        modalWidth="w-[460px]"
        footer={
          <div className="flex items-center justify-end gap-[8px] border-t border-[#ECF1F6] bg-white px-[20px] py-[12px]">
            <button type="button" className={tokens.secondaryButtonClass} onClick={() => setNewAccountModalOpen(false)}>Discard</button>
            <button
              type="button"
              disabled={!isNewAccountIdentityValid(details)}
              className={isNewAccountIdentityValid(details) ? tokens.primaryButtonClass : `${tokens.primaryButtonClass} cursor-not-allowed opacity-45`}
              onClick={() => {
                if (!isNewAccountIdentityValid(details)) return
                onChooseNew()
                setNewAccountModalOpen(false)
              }}
            >
              {source === "new" ? "Save" : "Create account"}
            </button>
          </div>
        }
      >
        <div className="overflow-y-auto px-[20px] py-[16px]">
          <AccountIdentityFields details={details} onChange={onDetailsChange} onUseExisting={(account) => { onSelectExisting(account); setNewAccountModalOpen(false) }} />
        </div>
      </CreationModalShell>
    </section>
  )
}

function ConfigurationRow({
  option,
  checked,
  locked,
  onToggle,
}: {
  option: ConfigurationOption
  checked: boolean
  locked?: boolean
  onToggle?: () => void
}) {
  return (
    <div
      data-configuration={option.id}
      data-selected={checked ? "true" : "false"}
      data-existing={locked ? "true" : "false"}
      className={`flex min-h-[48px] items-center gap-[9px] px-[11px] py-[9px] ${
        locked ? "bg-[#F8FAFB]" : checked ? "bg-[#F8F7FF]" : "hover:bg-[#F8FAFB]"
      }`}
    >
      <Checkbox
        checked={checked}
        label={locked ? `${option.title} is on this account` : checked ? `Remove ${option.title} configuration` : `Add ${option.title} configuration`}
        className={locked ? "pointer-events-none opacity-55" : undefined}
        onChange={() => {
          if (!locked) onToggle?.()
        }}
      />
      {locked ? (
        <div className="flex min-w-0 flex-1 items-center justify-between gap-[12px]">
          <span className="text-[12px] font-[600] leading-[16px] text-[#596171]">{option.title}</span>
          <span className="shrink-0 whitespace-nowrap text-right text-[11px] leading-[16px] text-[#6C7688]">{option.relationship}</span>
        </div>
      ) : (
        <button type="button" className="flex min-w-0 flex-1 items-center justify-between gap-[12px] text-left" onClick={onToggle}>
          <span className={`text-[12px] font-[600] leading-[16px] ${checked ? "text-[#533AFD]" : "text-[#1A2C44]"}`}>{option.title}</span>
          <span className="shrink-0 whitespace-nowrap text-right text-[11px] leading-[16px] text-[#6C7688]">{option.relationship}</span>
        </button>
      )}
    </div>
  )
}

function ConfigurationPicker({
  selected,
  existing,
  onChange,
}: {
  selected: ConfigurationKind[]
  existing: ConfigurationKind[]
  onChange: (next: ConfigurationKind[]) => void
}) {
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)
  const existingOptions = CONFIGURATION_OPTIONS.filter((option) => existing.includes(option.id))
  const addableOptions = CONFIGURATION_OPTIONS.filter((option) => !existing.includes(option.id))
  const toggle = (option: ConfigurationOption) => {
    onChange(selected.includes(option.id) ? selected.filter((item) => item !== option.id) : [...selected, option.id])
  }

  return (
    <section className="flex flex-col gap-[12px]" data-configuration-picker>
      <div>
        <h3 className={tokens.sectionTitle}>Configurations</h3>
        <p className="mt-[3px] text-[11px] leading-[16px] text-[#596171]">Specify what you want this account to do.</p>
      </div>
      {existingOptions.length > 0 ? (
        <div className="flex flex-col gap-[8px]">
          <p className="text-[11px] font-[500] leading-[16px] text-[#6C7688]">On this account</p>
          <HoverTip text="You can deactivate capabilities from this account’s page.">
            <div className="divide-y divide-[#ECF1F6] overflow-hidden rounded-[8px] border border-[#D4DEE9] bg-white">
              {existingOptions.map((option) => (
                <ConfigurationRow key={option.id} option={option} checked locked />
              ))}
            </div>
          </HoverTip>
        </div>
      ) : null}
      {addableOptions.length > 0 ? (
        <div className="flex flex-col gap-[8px]">
          {existingOptions.length > 0 ? (
            <p className="text-[11px] font-[500] leading-[16px] text-[#6C7688]">Add</p>
          ) : null}
          <div className="divide-y divide-[#ECF1F6] overflow-hidden rounded-[8px] border border-[#D4DEE9] bg-white">
            {addableOptions.map((option) => (
              <ConfigurationRow
                key={option.id}
                option={option}
                checked={selected.includes(option.id)}
                onToggle={() => toggle(option)}
              />
            ))}
          </div>
        </div>
      ) : null}
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
  details,
  onChange,
}: {
  configurations: ConfigurationKind[]
  details: AccountDetailsDraft
  onChange: (patch: Partial<AccountDetailsDraft>) => void
}) {
  const [openMethod, setOpenMethod] = useState<PayoutMethod | null>(null)
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)
  const merchantSelected = configurations.includes("merchant")

  useEffect(() => {
    if (merchantSelected || !details.payoutMethods.includes("stripe-balance")) return
    onChange({ payoutMethods: details.payoutMethods.filter((method) => method !== "stripe-balance") })
    if (openMethod === "stripe-balance") setOpenMethod(null)
  }, [merchantSelected, details.payoutMethods, onChange, openMethod])

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
    if (!checked && openMethod === method) setOpenMethod(null)
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

  const needsPayoutEmail = details.payoutMethods.some((method) => method === "bank-account" || method === "debit-card")

  return (
    <section className="flex flex-col gap-[12px]" data-payout-information>
      <div>
        <h3 className={tokens.sectionTitle}>Payout methods</h3>
        <p className="mt-[3px] text-[11px] leading-[16px] text-[#596171]">Select where funds should be deposited.</p>
      </div>
      <div className="flex flex-col gap-[7px]">
        {PAYOUT_METHODS.map((method) => {
          const checked = details.payoutMethods.includes(method.id)
          const methodDetails = details.payoutMethodDetails[method.id]
          const hasDetails = Boolean(methodDetails.primary || methodDetails.secondary)
          const canAddDetails = method.id !== "stripe-balance"
          const locked = method.id === "stripe-balance" && !merchantSelected
          const open = openMethod === method.id
          const card = (
            <div
              className={`rounded-[8px] border ${open ? "overflow-visible" : "overflow-hidden"} ${
                locked
                  ? "border-[#D4DEE9] bg-white opacity-55"
                  : checked
                    ? "border-[#C8C0FF] bg-[#F8F7FF]"
                    : "border-[#D4DEE9] bg-white"
              }`}
            >
              <div className="flex min-h-[58px] items-start gap-[8px] p-[12px]">
                <Checkbox
                  checked={checked}
                  label={method.label}
                  className={`mt-[2px] ${locked ? "pointer-events-none" : ""}`}
                  onChange={(next) => {
                    if (locked) return
                    toggleMethod(method.id, next)
                  }}
                />
                <span className="min-w-0 flex-1">
                  <span className={`block text-[12px] font-[600] leading-[16px] ${locked ? "text-[#1A2C44]" : checked ? "text-[#533AFD]" : "text-[#1A2C44]"}`}>
                    {method.label}
                  </span>
                  <span className="mt-[2px] block text-[11px] font-[400] leading-[16px] text-[#596171]">
                    {payoutMethodSummary(method.id, methodDetails, method.description)}
                  </span>
                </span>
                {canAddDetails && checked ? (
                  <button
                    type="button"
                    className="shrink-0 text-[11px] font-[600] leading-[16px] text-[#533AFD] hover:text-[#4730E0]"
                    aria-expanded={open}
                    onClick={() => toggleEditor(method.id)}
                  >
                    {open ? "Done" : hasDetails ? "Edit" : "Add"}
                  </button>
                ) : null}
              </div>
              {canAddDetails ? (
                <motion.div
                  initial={false}
                  animate={open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className={open ? "overflow-visible" : "overflow-hidden"}
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
      {needsPayoutEmail ? (
        <div className="rounded-[8px] border border-[#D4DEE9] bg-[#F4F7FA] px-[12px] py-[10px]">
          <p className="text-[12px] leading-[16px] text-[#3C4F69]">
            If you don’t have the recipient’s payout information, Stripe will email the account after creation to collect it.
          </p>
        </div>
      ) : null}
    </section>
  )
}

function CustomerDetailsSection({ details, onChange }: { details: AccountDetailsDraft; onChange: (patch: Partial<AccountDetailsDraft>) => void }) {
  const [openRow, setOpenRow] = useState<"billing" | "tax" | "shipping" | null>(null)
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })

  return (
    <section className="flex flex-col gap-[12px]">
      <h3 className={tokens.sectionTitle}>Billing and shipping</h3>
      <ReviewRow title="Billing details" summary={details.useAccountEmailForBilling ? "Same as account email" : details.billingEmail || "Not added"} open={openRow === "billing"} onToggle={() => setOpenRow(openRow === "billing" ? null : "billing")}>
        <div className="flex flex-col gap-[12px]">
          <div className="flex items-center justify-between gap-[12px]"><div><p className="text-[12px] font-[600] text-[#273951]">Use account email</p><p className="mt-[2px] text-[11px] leading-[15px] text-[#596171]">Send billing notices to the account address.</p></div><Toggle checked={details.useAccountEmailForBilling} label="Use account email for billing" onChange={(useAccountEmailForBilling) => onChange({ useAccountEmailForBilling, billingEmail: useAccountEmailForBilling ? "" : details.billingEmail })} /></div>
          {!details.useAccountEmailForBilling ? <Field label="Billing email"><input type="email" className={tokens.inputClass} placeholder={details.accountEmail || "billing@example.com"} value={details.billingEmail} onChange={(event) => onChange({ billingEmail: event.target.value })} /></Field> : null}
          <Field label="Billing country"><SelectControl className={tokens.selectClass} value={details.billingCountry || details.country} onChange={(billingCountry) => onChange({ billingCountry })}><option value="">Select a country</option><option>United Kingdom</option><option>United States</option><option>Canada</option></SelectControl></Field>
        </div>
      </ReviewRow>
      <ReviewRow title="Tax information" summary={details.taxId ? `Tax ID · ${details.taxId}` : "Not added"} open={openRow === "tax"} onToggle={() => setOpenRow(openRow === "tax" ? null : "tax")}>
        <Field label="Tax ID"><input className={tokens.inputClass} placeholder="GB123456789" value={details.taxId} onChange={(event) => onChange({ taxId: event.target.value })} /></Field>
      </ReviewRow>
      <ReviewRow title="Shipping details" summary={details.shippingAddress || "Not added"} open={openRow === "shipping"} onToggle={() => setOpenRow(openRow === "shipping" ? null : "shipping")}>
        <Field label="Shipping address"><textarea className={tokens.textareaClass} placeholder="Street, city, region, postal code" value={details.shippingAddress} onChange={(event) => onChange({ shippingAddress: event.target.value })} /></Field>
      </ReviewRow>
    </section>
  )
}

function CapabilitiesEditor({
  configurations,
  details,
  onChange,
}: {
  configurations: ConfigurationKind[]
  details: AccountDetailsDraft
  onChange: (patch: Partial<AccountDetailsDraft>) => void
}) {
  const [query, setQuery] = useState("")
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  const requested = new Set(getCapabilities(configurations, details.disabledCapabilities, details.additionalCapabilities))
  const normalizedQuery = query.trim().toLowerCase()
  const visibleGroups = CAPABILITY_GROUPS.filter((group) => group.id === "other" || configurations.includes(group.id))
  const previewLimit = 6

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
  const toggleGroup = (groupId: (typeof CAPABILITY_GROUPS)[number]["id"], checked: boolean) => {
    const group = CAPABILITY_GROUPS.find((candidate) => candidate.id === groupId)
    if (!group) return
    const optional = group.items.filter((item) => !item.required).map((item) => item.name)
    if (checked) {
      onChange({
        additionalCapabilities: Array.from(new Set([...details.additionalCapabilities, ...optional])),
        disabledCapabilities: details.disabledCapabilities.filter((capability) => !optional.includes(capability)),
      })
      return
    }
    onChange({
      additionalCapabilities: details.additionalCapabilities.filter((capability) => !optional.includes(capability)),
    })
  }

  return (
    <div className="flex flex-col gap-[12px]">
      <p className="text-[11px] leading-[16px] text-[#596171]">Select which capabilities to request for this account.</p>
      <input
        className={tokens.inputClass}
        placeholder="Search capabilities"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="flex flex-col gap-[14px]">
        {visibleGroups.map((group) => {
          const items = group.items.filter((item) => !normalizedQuery || item.name.toLowerCase().includes(normalizedQuery))
          if (items.length === 0) return null
          const expanded = Boolean(normalizedQuery) || expandedGroups.includes(group.id)
          const visibleItems = expanded ? items : items.slice(0, previewLimit)
          const hiddenCount = items.length - visibleItems.length
          const optional = items.filter((item) => !item.required)
          const allOptionalChecked = optional.length > 0 && optional.every((item) => isChecked(item.name))
          return (
            <div key={group.id}>
              <div className="mb-[8px] flex items-center justify-between gap-[8px]">
                <p className="text-[12px] font-[600] leading-[16px] text-[#273951]">{group.title}</p>
                {optional.length > 0 ? (
                  <button
                    type="button"
                    className="text-[11px] font-[600] leading-[16px] text-[#533AFD] hover:text-[#4730E0]"
                    onClick={() => toggleGroup(group.id, !allOptionalChecked)}
                  >
                    {allOptionalChecked ? "Clear" : "Select all"}
                  </button>
                ) : null}
              </div>
              <div className="flex flex-col gap-[8px]">
                {visibleItems.map((item) => {
                  const checked = isChecked(item.name)
                  return (
                    <div key={item.name} className={`flex items-center gap-[8px] text-[12px] leading-[16px] ${item.required ? "text-[#818DA0]" : "text-[#273951]"}`}>
                      <Checkbox
                        checked={checked}
                        label={`${checked ? "Remove" : "Add"} ${item.name}`}
                        className={item.required ? "pointer-events-none opacity-55" : undefined}
                        onChange={(next) => toggleCapability(item.name, Boolean(item.required), next)}
                      />
                      {item.name}
                    </div>
                  )
                })}
                {hiddenCount > 0 ? (
                  <button
                    type="button"
                    className="self-start text-[12px] font-[600] leading-[16px] text-[#533AFD] hover:text-[#4730E0]"
                    onClick={() => setExpandedGroups((current) => [...current, group.id])}
                  >
                    Show {hiddenCount} more
                  </button>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CapabilitiesSection({ configurations, details, onChange }: { configurations: ConfigurationKind[]; details: AccountDetailsDraft; onChange: (patch: Partial<AccountDetailsDraft>) => void }) {
  const [open, setOpen] = useState(false)
  const enabledCapabilities = getCapabilities(configurations, details.disabledCapabilities, details.additionalCapabilities)
  const capabilitySummary = enabledCapabilities.length <= 2
    ? enabledCapabilities.join(", ") || "None"
    : `${enabledCapabilities.slice(0, 2).join(", ")} · +${enabledCapabilities.length - 2} more`

  return (
    <ReviewRow title="Capabilities" summary={capabilitySummary} open={open} onToggle={() => setOpen((current) => !current)}>
      <CapabilitiesEditor configurations={configurations} details={details} onChange={onChange} />
    </ReviewRow>
  )
}

function MoreDetailsSection({ configurations, details, onChange }: { configurations: ConfigurationKind[]; details: AccountDetailsDraft; onChange: (patch: Partial<AccountDetailsDraft>) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [openRow, setOpenRow] = useState<"properties" | null>(null)
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)
  const traitSummary = [
    details.traits.feePayer === "platform" ? "Platform pays fees" : "Account pays fees",
    details.traits.negativeBalanceLiability === "stripe" ? "Stripe covers negative balances" : "Platform covers negative balances",
    details.traits.dashboardAccess === "stripe" ? "Stripe dashboard" : details.traits.dashboardAccess === "express" ? "Express dashboard" : "No dashboard",
  ].join(" · ")
  const propertiesEditor = (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[6px]">
        <PropertyLabel label="Who pays Stripe fees" hint="Choose whether this account or your platform is charged Stripe’s processing fees." />
        <SelectControl
          className={tokens.selectClass}
          value={details.traits.feePayer}
          onChange={(feePayer) => onChange({ traits: { ...details.traits, feePayer: feePayer as FeePayer } })}
        >
          <option value="connected-account">This account</option>
          <option value="platform">Your platform</option>
        </SelectControl>
        <div className="mt-[4px] flex items-center gap-[8px]">
          <Checkbox
            checked={details.traits.useLegacyFeeType}
            label="Use legacy fee type"
            onChange={(useLegacyFeeType) => onChange({ traits: { ...details.traits, useLegacyFeeType } })}
          />
          <span className="text-[12px] leading-[16px] text-[#273951]">Use legacy fee type</span>
        </div>
      </div>
      <div className="flex flex-col gap-[6px]">
        <PropertyLabel label="Negative balance liability" hint="Choose who is responsible if this account’s balance goes negative." />
        <SelectControl
          className={tokens.selectClass}
          value={details.traits.negativeBalanceLiability}
          onChange={(negativeBalanceLiability) => onChange({ traits: { ...details.traits, negativeBalanceLiability: negativeBalanceLiability as NegativeBalanceLiability } })}
        >
          <option value="stripe">Stripe</option>
          <option value="platform">Platform</option>
        </SelectControl>
      </div>
      <div className="flex flex-col gap-[6px]">
        <PropertyLabel label="Dashboard access" hint="Choose whether this account can use the full Stripe Dashboard, Express, or no dashboard." />
        <SelectControl
          className={tokens.selectClass}
          value={details.traits.dashboardAccess}
          onChange={(dashboardAccess) => onChange({ traits: { ...details.traits, dashboardAccess: dashboardAccess as DashboardAccess } })}
        >
          <option value="stripe">Stripe</option>
          <option value="express">Express</option>
          <option value="none">None</option>
        </SelectControl>
      </div>
      <div className="flex flex-col gap-[6px]">
        <PropertyLabel label="Requirement collection" hint="Stripe collects identity and compliance information for this account. This can’t be changed." />
        <div className="flex h-[30px] items-center rounded-[6px] border border-[#D8DEE4] bg-[#F4F7FA] px-[10px] text-[12px] font-[500] leading-[16px] text-[#596171]">
          Stripe
        </div>
      </div>
    </div>
  )

  const showProperties = configurations.includes("merchant")
  const showCapabilities = configurations.includes("merchant") || configurations.includes("recipient")

  return (
    <section className="flex flex-col">
      <button
        type="button"
        className="flex w-full items-center justify-between py-[4px] text-left"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
      >
        <h3 className={tokens.sectionTitle}>More settings</h3>
        <svg
          className={`shrink-0 text-[#6C7688] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${expanded ? "rotate-180" : ""}`}
          width="10"
          height="10"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <motion.div
        initial={false}
        animate={expanded ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={expanded ? "overflow-visible" : "overflow-hidden"}
      >
        <div className="flex flex-col gap-[12px] pt-[12px]">
          {showProperties ? (
            <ReviewRow title="Account properties" summary={traitSummary} open={openRow === "properties"} onToggle={() => setOpenRow(openRow === "properties" ? null : "properties")}>
              {propertiesEditor}
            </ReviewRow>
          ) : null}
          {showCapabilities ? <CapabilitiesSection configurations={configurations} details={details} onChange={onChange} /> : null}
        </div>
      </motion.div>
    </section>
  )
}

function OnboardingSection({ details, onChange }: { details: AccountDetailsDraft; onChange: (patch: Partial<AccountDetailsDraft>) => void }) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })

  return (
    <section className="flex flex-col gap-[9px]" data-onboarding-placement="pre-save">
      <div><h3 className={tokens.labelClass}>After creation</h3><p className="mt-[3px] text-[11px] leading-[16px] text-[#596171]">Choose how the account will finish providing any remaining information.</p></div>
      <SegmentedControl
        value={details.onboardingAction}
        options={ONBOARDING_ACTION_OPTIONS}
        getDisplayValue={(value) => value === "send-email" ? "Send email" : "Copy link"}
        onChange={(onboardingAction) => onChange({ onboardingAction })}
        variantOverride="segmented"
      />
      {details.onboardingAction === "send-email" ? (
        <div className="rounded-[8px] border border-[#D4DEE9] bg-[#F8FAFB] p-[11px]">
          <div className="flex items-center justify-between gap-[12px]"><div><p className="text-[12px] font-[600] text-[#273951]">Use account email</p><p className="mt-[2px] text-[11px] leading-[15px] text-[#596171]">Send the secure onboarding link after creation.</p></div><Toggle checked={details.useAccountEmailForOnboarding} label="Use account email for onboarding" onChange={(useAccountEmailForOnboarding) => onChange({ useAccountEmailForOnboarding })} /></div>
          {!details.useAccountEmailForOnboarding ? <div className="mt-[10px]"><Field label="Onboarding email"><input type="email" className={tokens.inputClass} placeholder="account@example.com" value={details.onboardingEmail} onChange={(event) => onChange({ onboardingEmail: event.target.value })} aria-invalid={details.onboardingEmail.length > 0 && !EMAIL_PATTERN.test(details.onboardingEmail)} /></Field></div> : null}
        </div>
      ) : (
        <div className="rounded-[8px] border border-[#D4DEE9] bg-[#F8FAFB] px-[11px] py-[10px]"><p className="text-[11px] leading-[16px] text-[#596171]">The secure link will be copied after the account is created.</p><p className="mt-[4px] truncate font-mono text-[10px] text-[#818DA0]">{ACCOUNT_ONBOARDING_LINK}</p></div>
      )}
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
  onChooseExisting,
  onPrepareNew,
  onChooseNew,
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
  onChooseExisting: () => void
  onPrepareNew: () => void
  onChooseNew: () => void
  onSelectExisting: (account: NetworkAccount) => void
  onDetailsChange: (patch: Partial<AccountDetailsDraft>) => void
  onConfigurationsChange: (next: ConfigurationKind[]) => void
}) {
  const canConfigure = source === "new" || Boolean(selectedAccountId)

  return (
    <div className="flex flex-col gap-[18px] pb-[64px]">
      <AccountSelector
        style={selectionStyle}
        source={source}
        selectedAccountId={selectedAccountId}
        details={details}
        onChooseExisting={onChooseExisting}
        onPrepareNew={onPrepareNew}
        onChooseNew={onChooseNew}
        onSelectExisting={onSelectExisting}
        onDetailsChange={onDetailsChange}
      />
      {canConfigure ? (
        <ConfigurationPicker
          selected={configurations}
          existing={existingConfigurations}
          onChange={onConfigurationsChange}
        />
      ) : null}
      {configurations.includes("customer") ? <CustomerDetailsSection details={details} onChange={onDetailsChange} /> : null}
      {configurations.includes("recipient") ? <PayoutInformationSection configurations={configurations} details={details} onChange={onDetailsChange} /> : null}
      {configurations.includes("merchant") || configurations.includes("recipient") ? (
        <MoreDetailsSection configurations={configurations} details={details} onChange={onDetailsChange} />
      ) : null}
      {source === "new" && configurations.length > 0 && onboardingStyle === "pre-save" ? <OnboardingSection details={details} onChange={onDetailsChange} /> : null}
    </div>
  )
}
