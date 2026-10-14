'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { getFormTokens } from "./shared/formTokens"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { useInputFill } from "@/components/creation-workspace/inputFill"
import { CustomSelect } from "./shared/CustomSelect"
import { EntityDropdown } from "./EntityDropdown"
import { AddressFields, CountrySelect, formatAddressSummary, phoneCountryFromBillingCountry } from "./shared/AddressFields"
import type { CustomerFormLayout } from "@/components/creation-workspace/customerFormLayout"
import { TrashIcon, LargeChevronIcon } from "@/components/ProductCatalogIcons"
import { OptionalGroups, type OptionalGroup } from "./shared/ComposeGroup"
import { useAccountConflictNudgeMode } from "@/components/creation-workspace/accountConflictNudgeMode"
import { AccountSummaryCard, DuplicateAccountNudge, NetworkAccountOption, Toggle } from "../account-configuration/AccountConfigurationPrimitives"
import { EMAIL_PATTERN, findMatchingNetworkAccount, getDisplayedNetworkAccount, NETWORK_ACCOUNTS, type NetworkAccount } from "../account-configuration/model"

const ACCOUNT_TYPE_OPTIONS = ["Company", "Individual"] as const
const COMPOSE_ACCOUNTS = NETWORK_ACCOUNTS.map((account) => getDisplayedNetworkAccount(account, "direct"))

export function isComposeAccountReady(data: Record<string, unknown>) {
  const accountType = data.accountType === "Individual" ? "Individual" : "Company"
  const hasName = accountType === "Company"
    ? Boolean(String(data.registeredName ?? "").trim())
    : Boolean(String(data.firstName ?? "").trim() && String(data.lastName ?? "").trim())
  const email = String(data.accountEmail ?? data.email ?? "").trim()
  const country = String(data.accountCountry ?? data.country ?? "").trim()
  return hasName && EMAIL_PATTERN.test(email) && Boolean(country)
}

type CustomerFormProps = {
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
  errorFields?: Set<string>
  layout?: CustomerFormLayout | "compose" | "single-config"
  onOpenInvoiceEditor?: () => void
  onUseExistingAccount?: (account: NetworkAccount) => void
}

type CustomerSection = {
  id: string
  title: string
  content: ReactNode
  errorFieldKeys?: string[]
}

const linkClass = "text-[12px] font-[500] leading-[16px] text-[#533AFD] transition-colors hover:text-[#4730E0]"

function toCountryName(value?: string) {
  if (value === "CA" || value === "Canada") return "Canada"
  if (value === "GB" || value === "UK" || value === "United Kingdom") return "United Kingdom"
  return "United States"
}

function Field({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: ReactNode
}) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  return (
    <div className="flex flex-col gap-[4px]">
      <label className={tokens.labelClass}>{label}</label>
      {description && <p className={`${tokens.helperClass} ${productFormStyle === "refresh" ? "mt-[-2px]" : ""}`}>{description}</p>}
      {children}
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  const { productFormStyle } = useProductFormStyle()
  const titleClass = getFormTokens(productFormStyle).sectionTitle

  return (
    <section className="flex flex-col gap-[12px]">
      <h3 className={titleClass}>{title}</h3>
      {children}
    </section>
  )
}

function CustomerSectionNav({
  sections,
  activeSectionId,
  onSelectSection,
  errorSectionIds,
}: {
  sections: CustomerSection[]
  activeSectionId: string
  onSelectSection: (id: string) => void
  errorSectionIds: Set<string>
}) {
  return (
    <aside className="w-[184px] self-stretch shrink-0 bg-white px-[12px] py-[12px]">
      <nav className="flex flex-col gap-[2px]">
        {sections.map((section) => {
          const selected = section.id === activeSectionId
          const hasError = errorSectionIds.has(section.id)
          return (
            <button
              key={section.id}
              type="button"
              className={`flex w-full items-center gap-[6px] rounded-[6px] px-[8px] py-[5px] text-left text-[12px] font-[500] leading-[16px] tracking-[-0.024px] transition-colors ${
                hasError
                  ? "bg-[#FFF5F5] text-[#DF1B41] hover:bg-[#FFF0F0]"
                  : selected
                  ? "bg-[#F7F5FD] text-[#1A2C44]"
                  : "text-[#50617A] hover:bg-[#F4F7FA]"
              }`}
              onClick={() => onSelectSection(section.id)}
            >
              <span className="whitespace-nowrap">{section.title}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

export function CustomerForm({ data, onChange, errorFields, layout = "stacked", onOpenInvoiceEditor, onUseExistingAccount }: CustomerFormProps) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const { accountConflictNudgeMode } = useAccountConflictNudgeMode()
  const isSail = productFormStyle === "sail"
  const isRefresh = productFormStyle === "refresh"
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  const set = (key: string, value: string | boolean) => onChange({ [key]: value })
  const ic = (field: string) => errorFields?.has(field) ? tokens.errorInputClass : tokens.inputClass
  const emailHasError = Boolean(errorFields?.has("email"))
  const [shakeEmail, setShakeEmail] = useState(false)
  const [activeSectionId, setActiveSectionId] = useState("account")
  const [dismissedMatchId, setDismissedMatchId] = useState("")
  const [selectedNetworkAccountId, setSelectedNetworkAccountId] = useState("")
  const networkAccounts = useMemo(() => (
    NETWORK_ACCOUNTS
      .map((account) => getDisplayedNetworkAccount(account))
      .sort((left, right) => Number(Boolean(right.inNetwork)) - Number(Boolean(left.inNetwork)))
  ), [])
  const additionalBillingEmails = Array.isArray(data.additionalBillingEmails) ? data.additionalBillingEmails as string[] : []
  const additionalTaxIds = Array.isArray(data.taxIds) ? data.taxIds as { taxIdType?: string; taxId?: string }[] : []
  const accountEmailForMatch = String(data.accountEmail ?? data.email ?? "")
  const matchingAccount = accountConflictNudgeMode === "off"
    ? undefined
    : accountConflictNudgeMode === "always" && accountEmailForMatch.trim()
      ? COMPOSE_ACCOUNTS.find((account) => account.id === "acct_juniper")
      : (() => {
          const match = findMatchingNetworkAccount(accountEmailForMatch)
          return match ? COMPOSE_ACCOUNTS.find((account) => account.id === match.id) ?? match : undefined
        })()

  const fillFromNetworkAccount = (account: NetworkAccount) => {
    const country = account.country === "UK" ? "United Kingdom" : account.country === "CA" ? "Canada" : "United States"
    const isCompany = !account.directName
    onChange({
      customerId: account.id,
      name: account.name,
      displayName: account.name,
      registeredName: isCompany ? account.name : "",
      firstName: "",
      lastName: "",
      accountType: isCompany ? "Company" : "Individual",
      accountEmail: account.email,
      email: account.email,
      accountCountry: country,
      country,
    })
  }

  const applyExistingAccount = (account: NetworkAccount) => {
    fillFromNetworkAccount(account)
    onUseExistingAccount?.(account)
  }

  const duplicateNudge = matchingAccount && dismissedMatchId !== matchingAccount.id && data.customerId !== matchingAccount.id ? (
    <DuplicateAccountNudge
      account={matchingAccount}
      description="This email matches an existing account in your Network. Continue with it instead of creating a duplicate."
      actionLabel={layout === "single-config" ? "View existing account" : "Use existing account"}
      dense
      onUseExisting={() => applyExistingAccount(matchingAccount)}
      onDismiss={() => setDismissedMatchId(matchingAccount.id)}
    />
  ) : null

  useEffect(() => {
    if (!data.customerId) setSelectedNetworkAccountId("")
  }, [data.customerId])

  useEffect(() => {
    if (!isRefresh || !emailHasError) return
    setShakeEmail(false)
    const frame = requestAnimationFrame(() => setShakeEmail(true))
    const timer = setTimeout(() => setShakeEmail(false), 320)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [emailHasError, isRefresh])

  const updateAdditionalBillingEmail = (index: number, value: string) => {
    onChange({
      additionalBillingEmails: additionalBillingEmails.map((email, i) => i === index ? value : email),
    })
  }

  const removeAdditionalBillingEmail = (index: number) => {
    onChange({
      additionalBillingEmails: additionalBillingEmails.filter((_, i) => i !== index),
    })
  }

  const updateAdditionalTaxId = (index: number, patch: { taxIdType?: string; taxId?: string }) => {
    onChange({
      taxIds: additionalTaxIds.map((taxId, i) => i === index ? { ...taxId, ...patch } : taxId),
    })
  }

  const removeAdditionalTaxId = (index: number) => {
    onChange({
      taxIds: additionalTaxIds.filter((_, i) => i !== index),
    })
  }

  const sections: CustomerSection[] = [
    {
      id: "account",
      title: "Account information",
      errorFieldKeys: ["name", "email"],
      content: (
        <>
          <Field label="Name" description="Customer display name; appears on invoices.">
            <input
              className={ic("name")}
              placeholder="e.g. Acme Corporation"
              value={data.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
            />
            {errorFields?.has("name") && (
              <p className="text-[11px] text-[#DF1B41]">Enter a customer name</p>
            )}
          </Field>

          <div className="flex flex-col gap-[6px]">
            <Field label="Email">
              <input
                type="email"
                className={ic("email")}
                placeholder="e.g. jenny@example.com"
                value={data.email ?? ""}
                onChange={(e) => set("email", e.target.value)}
              />
              {errorFields?.has("email") && (
                <p className="text-[11px] text-[#DF1B41]">Enter an email address</p>
              )}
            </Field>
            {duplicateNudge}
          </div>

          <button
            type="button"
            className="flex items-center gap-[4px] self-start rounded-[6px] px-[8px] py-[4px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#533AFD] transition-colors hover:bg-[#F7F5FD]"
            onClick={() => onChange({ additionalBillingEmails: [...additionalBillingEmails, ""] })}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            Additional billing emails
          </button>

          {additionalBillingEmails.map((email, index) => (
            <div key={index} className="flex items-center gap-[8px]">
              <input
                type="email"
                className={tokens.inputClass}
                placeholder="e.g. billing@example.com"
                value={email}
                onChange={(e) => updateAdditionalBillingEmail(index, e.target.value)}
              />
              <button
                type="button"
                className={`group flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[6px] border ${isRefresh ? "border-[#C1CCD7]" : "border-[#D4DEE9]"} bg-white text-[#3C4F69] hover:border-[#FAA9B8] hover:bg-[#FEF4F6] hover:text-[#E61947]`}
                aria-label="Remove billing email"
                onClick={() => removeAdditionalBillingEmail(index)}
              >
                <TrashIcon className="shrink-0" />
              </button>
            </div>
          ))}

          <CustomSelect
            label="Language"
            value={data.language ?? "en-US"}
            onChange={(v) => set("language", v)}
            options={[
              { value: "en-US", label: "English (United States)" },
              { value: "en-GB", label: "English (United Kingdom)" },
              { value: "fr-FR", label: "French" },
              { value: "de-DE", label: "German" },
              { value: "es-ES", label: "Spanish" },
            ]}
          />

          <Field label="Business name">
            <input
              className={tokens.inputClass}
              placeholder="e.g. Stripe, Inc."
              value={data.businessName ?? ""}
              onChange={(e) => set("businessName", e.target.value)}
            />
          </Field>
          <Field label="Individual name">
            <input
              className={tokens.inputClass}
              placeholder="e.g. Jenny Rosen"
              value={data.individualName ?? ""}
              onChange={(e) => set("individualName", e.target.value)}
            />
          </Field>
          <Field label="Description">
            <textarea
              className={tokens.textareaClass}
              placeholder="e.g. Enterprise tier, annual contract"
              value={data.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>

          <CustomSelect
            label="Default invoice template"
            description="Apply this template to future invoices for this customer."
            value={data.invoiceTemplate ?? ""}
            onChange={(v) => set("invoiceTemplate", v)}
            options={[
              { value: "", label: "Select a template..." },
              { value: "standard", label: "Standard invoice" },
              { value: "enterprise", label: "Enterprise services" },
              { value: "usage", label: "Usage invoice" },
            ]}
            footerAction={{
              label: "Create invoice",
              onClick: () => onOpenInvoiceEditor?.(),
            }}
          />
        </>
      ),
    },
    {
      id: "billing",
      title: "Billing details",
      errorFieldKeys: ["country", "billingLine1", "phone", "currency", "timezone"],
      content: (
        <>
          <div className="flex flex-col gap-[6px]">
            <p className={tokens.labelClass}>Billing address</p>
            <AddressFields
              showCountry={false}
              value={{
                country: toCountryName(data.billingCountry || data.accountCountry || data.country),
                line1: data.billingLine1 ?? "",
                line2: data.billingLine2 ?? "",
                city: data.billingCity ?? "",
                state: data.billingState ?? "",
                postalCode: data.billingPostalCode ?? "",
                phone: data.phone ?? "",
                phoneCountry: phoneCountryFromBillingCountry(data.phoneCountry || data.billingCountry || data.accountCountry || data.country || "United States"),
              }}
              tokens={tokens}
              onChange={(patch) => onChange({
                billingCountry: patch.country ?? data.billingCountry ?? toCountryName(data.country),
                billingLine1: patch.line1 ?? data.billingLine1 ?? "",
                billingLine2: patch.line2 ?? data.billingLine2 ?? "",
                billingCity: patch.city ?? data.billingCity ?? "",
                billingState: patch.state ?? data.billingState ?? "",
                billingPostalCode: patch.postalCode ?? data.billingPostalCode ?? "",
                phone: patch.phone ?? data.phone ?? "",
                phoneCountry: patch.phoneCountry ?? data.phoneCountry ?? "US",
              })}
            />
          </div>

          <CustomSelect
            label="Currency"
            value={data.currency ?? ""}
            onChange={(v) => set("currency", v)}
            options={[
              { value: "", label: "Choose a currency..." },
              { value: "USD", label: "USD - US dollar" },
              { value: "CAD", label: "CAD - Canadian dollar" },
              { value: "EUR", label: "EUR - Euro" },
              { value: "GBP", label: "GBP - British pound" },
            ]}
          />

          <CustomSelect
            label="Time zone"
            description="Used for invoice dates and times"
            value={data.timezone ?? ""}
            onChange={(v) => set("timezone", v)}
            options={[
              { value: "", label: "Choose a time zone..." },
              { value: "America/Los_Angeles", label: "Pacific Time" },
              { value: "America/New_York", label: "Eastern Time" },
              { value: "America/Toronto", label: "Toronto" },
              { value: "Europe/London", label: "London" },
            ]}
          />
        </>
      ),
    },
    {
      id: "shipping",
      title: "Shipping details",
      errorFieldKeys: ["shippingName", "shippingCountry", "shippingPhone"],
      content: (
        <>
          <div className="flex items-center justify-between gap-[12px]">
            <p className="text-[12px] font-[400] text-[#273951]">Same as billing details</p>
            <Toggle
              checked={data.sameAsBilling !== false}
              label="Same as billing details"
              onChange={(sameAsBilling) => set("sameAsBilling", sameAsBilling)}
            />
          </div>
          {data.sameAsBilling === false ? (
            <AddressFields
              value={{
                name: data.shippingName ?? "",
                country: toCountryName(data.shippingCountry),
                line1: data.shippingLine1 ?? "",
                line2: data.shippingLine2 ?? "",
                city: data.shippingCity ?? "",
                state: data.shippingState ?? "",
                postalCode: data.shippingPostalCode ?? "",
                phone: data.shippingPhone ?? "",
                phoneCountry: phoneCountryFromBillingCountry(data.shippingPhoneCountry || data.shippingCountry || "United States"),
              }}
              tokens={tokens}
              onChange={(patch) => onChange({
                shippingName: patch.name ?? data.shippingName ?? "",
                shippingCountry: patch.country ?? data.shippingCountry ?? toCountryName(data.country),
                shippingLine1: patch.line1 ?? data.shippingLine1 ?? "",
                shippingLine2: patch.line2 ?? data.shippingLine2 ?? "",
                shippingCity: patch.city ?? data.shippingCity ?? "",
                shippingState: patch.state ?? data.shippingState ?? "",
                shippingPostalCode: patch.postalCode ?? data.shippingPostalCode ?? "",
                shippingPhone: patch.phone ?? data.shippingPhone ?? "",
                shippingPhoneCountry: patch.phoneCountry ?? data.shippingPhoneCountry ?? "US",
              })}
            />
          ) : null}
        </>
      ),
    },
    {
      id: "tax",
      title: "Tax and exemptions",
      errorFieldKeys: ["taxStatus", "taxId", "taxIdType"],
      content: (
        <>
          <div className="flex flex-col gap-[4px]">
            <div className="flex items-center gap-[6px]">
              <label className={tokens.labelClass}>Tax status</label>
              <span className="text-[#9CA3B0]">·</span>
              <a href="https://docs.stripe.com/billing/taxes/tax-ids" target="_blank" rel="noreferrer" className={linkClass}>Docs</a>
            </div>
            <CustomSelect
              label=""
              value={data.taxStatus ?? "taxable"}
              onChange={(v) => set("taxStatus", v)}
              options={[
                { value: "taxable", label: "Taxable" },
                { value: "exempt", label: "Exempt" },
                { value: "reverse", label: "Reverse charge" },
              ]}
            />
          </div>

          <div className="flex flex-col gap-[4px]">
            <label className={tokens.labelClass}>Tax ID</label>
            <div className="flex items-center gap-[8px]">
              <div className="w-[132px] shrink-0">
                <CustomSelect
                  label=""
                  value={data.taxIdType ?? ""}
                  onChange={(v) => set("taxIdType", v)}
                  options={[
                    { value: "", label: "ID type" },
                    { value: "us_ein", label: "US EIN" },
                    { value: "eu_vat", label: "EU VAT" },
                    { value: "gb_vat", label: "GB VAT" },
                  ]}
                />
              </div>
              <input
                className={tokens.inputClass}
                placeholder="e.g. 12-3456789"
                value={data.taxId ?? ""}
                onChange={(e) => set("taxId", e.target.value)}
              />
              <button
                type="button"
                className={`group flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[6px] border ${isRefresh ? "border-[#C1CCD7]" : "border-[#D4DEE9]"} bg-white text-[#3C4F69] hover:border-[#FAA9B8] hover:bg-[#FEF4F6] hover:text-[#E61947]`}
                aria-label="Remove tax ID"
                onClick={() => onChange({ taxIdType: "", taxId: "" })}
              >
                <TrashIcon className="shrink-0" />
              </button>
            </div>
          </div>

          {additionalTaxIds.map((taxId, index) => (
            <div key={index} className="flex items-center gap-[8px]">
              <div className="w-[132px] shrink-0">
                <CustomSelect
                  label=""
                  value={taxId.taxIdType ?? ""}
                  onChange={(v) => updateAdditionalTaxId(index, { taxIdType: v })}
                  options={[
                    { value: "", label: "ID type" },
                    { value: "us_ein", label: "US EIN" },
                    { value: "eu_vat", label: "EU VAT" },
                    { value: "gb_vat", label: "GB VAT" },
                  ]}
                />
              </div>
              <input
                className={tokens.inputClass}
                placeholder="e.g. EU123456789"
                value={taxId.taxId ?? ""}
                onChange={(e) => updateAdditionalTaxId(index, { taxId: e.target.value })}
              />
              <button
                type="button"
                className={`group flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[6px] border ${isRefresh ? "border-[#C1CCD7]" : "border-[#D4DEE9]"} bg-white text-[#3C4F69] hover:border-[#FAA9B8] hover:bg-[#FEF4F6] hover:text-[#E61947]`}
                aria-label="Remove tax ID"
                onClick={() => removeAdditionalTaxId(index)}
              >
                <TrashIcon className="shrink-0" />
              </button>
            </div>
          ))}

          <button
            type="button"
            className="flex items-center gap-[4px] self-start rounded-[6px] px-[8px] py-[4px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#533AFD] transition-colors hover:bg-[#F7F5FD]"
            onClick={() => onChange({ taxIds: [...additionalTaxIds, { taxIdType: "", taxId: "" }] })}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            Add another ID
          </button>
        </>
      ),
    },
  ]
  const errorSectionIds = new Set(
    sections
      .filter((section) => section.errorFieldKeys?.some((field) => errorFields?.has(field)))
      .map((section) => section.id)
  )

  const [showMoreSettings, setShowMoreSettings] = useState(false)

  useEffect(() => {
    const firstErrorSection = sections.find((section) => errorSectionIds.has(section.id))
    if (firstErrorSection) setActiveSectionId(firstErrorSection.id)
  }, [errorFields])

  // Tabs layout: measure the active tab and lock the panel's min-height to the
  // tallest tab seen so switching to a shorter tab never shrinks the modal.
  const tabPanelRef = useRef<HTMLDivElement>(null)
  const [maxTabHeight, setMaxTabHeight] = useState(0)
  useLayoutEffect(() => {
    if (layout !== "tabs") return
    const h = tabPanelRef.current?.offsetHeight ?? 0
    if (h > 0) setMaxTabHeight((prev) => (h > prev ? h : prev))
  }, [activeSectionId, layout])

  if (layout === "tree") {
    const activeSection = sections.find((section) => section.id === activeSectionId) ?? sections[0]

    return (
      <div className="flex h-full min-h-full flex-1">
        <CustomerSectionNav
          sections={sections}
          activeSectionId={activeSection.id}
          onSelectSection={setActiveSectionId}
          errorSectionIds={errorSectionIds}
        />
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-[20px] py-[16px]">
          <div className="max-w-[368px]">
            <Section title={activeSection.title}>{activeSection.content}</Section>
          </div>
        </div>
      </div>
    )
  }

  if (layout === "tabs") {
    const activeSection = sections.find((section) => section.id === activeSectionId) ?? sections[0]
    const tabsClass = isRefresh
      ? "flex w-full shrink-0 gap-[24px] border-b border-[#EAF0F6] pl-[20px]"
      : isSail
        ? "flex w-full shrink-0 gap-[24px] border-b border-[#ECF1F6] pl-[20px]"
        : "flex w-full shrink-0 gap-[24px] border-b border-[#ECF1F6] pl-[24px]"
    const tabButtonClass = (selected: boolean, hasError: boolean) => {
      const colorClass = hasError
        ? "text-[#DF1B41]"
        : selected
          ? isRefresh ? "text-[#142234]" : "text-[#533AFD]"
          : isRefresh ? "text-[#526378] hover:text-[#142234]" : isSail ? "text-[#6A7383] hover:text-[#353A44]" : "text-[#6A7383] hover:text-[#273951]"
      const typeClass = isRefresh
        ? "py-[11px] text-[13px] font-[500] leading-[20px] tracking-[-0.065px]"
        : isSail
          ? "py-[16px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px]"
          : "py-[4px] text-[12px] font-[600] leading-[16px] tracking-[-0.2px]"
      return `relative shrink-0 whitespace-nowrap ${typeClass} ${colorClass}`
    }
    const activeTabBarClass = isRefresh ? "bg-[#2C219E]" : "bg-[#533AFD]"
    const tabsContentClass = isSail
      ? "min-h-0 min-w-0 flex-1 overflow-y-auto px-[20px] pt-[16px] pb-[24px]"
      : isRefresh
        ? "min-h-0 min-w-0 flex-1 overflow-y-auto px-[20px] pt-[16px] pb-[16px]"
        : "min-h-0 min-w-0 flex-1 overflow-y-auto px-[24px] py-[16px]"

    return (
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <div className={tabsClass}>
          {sections.map((section) => {
            const selected = section.id === activeSection.id
            const hasError = errorSectionIds.has(section.id)
            return (
              <button
                key={section.id}
                type="button"
                className={tabButtonClass(selected, hasError)}
                onClick={() => setActiveSectionId(section.id)}
              >
                {section.title}
                {selected && (
                  <span className={`absolute bottom-0 left-0 right-0 h-[2px] ${activeTabBarClass}`} />
                )}
              </button>
            )
          })}
        </div>
        <div className={tabsContentClass}>
          {/* Render only the active tab for a crisp, instant swap (no cross-tab
              overlap). min-height is locked to the tallest tab visited so the
              modal never shrinks/jumps when switching to a shorter tab. */}
          <div style={{ minHeight: maxTabHeight ? `${maxTabHeight}px` : undefined }}>
            <div ref={tabPanelRef} className="flex flex-col gap-[12px]">
              {activeSection.content}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const remainingSections = sections.filter(s => s.id !== "account")

  if (layout === "compose" || layout === "single-config") {
    const billingSection = sections.find((section) => section.id === "billing")
    const taxSection = sections.find((section) => section.id === "tax")
    const shippingSection = sections.find((section) => section.id === "shipping")
    const billingSummary = formatAddressSummary([data.billingLine1, data.billingCity, data.billingState, data.billingPostalCode])
      || data.phone
      || data.currency
      || "Not added"
    const extraTaxId = additionalTaxIds.find((taxId) => taxId.taxId?.trim())?.taxId
    const taxSummary = data.taxStatus === "exempt"
      ? (data.taxId ? `Exempt · ${data.taxId}` : "Exempt")
      : data.taxStatus === "reverse"
        ? (data.taxId ? `Reverse charge · ${data.taxId}` : "Reverse charge")
        : (data.taxId || extraTaxId)
          ? `Tax ID · ${data.taxId || extraTaxId}`
          : "Not added"
    const shippingSummary = data.sameAsBilling !== false
      ? "Same as billing details"
      : formatAddressSummary([data.shippingLine1, data.shippingCity, data.shippingState, data.shippingPostalCode])
        || data.shippingName
        || "Not added"
    const optionalGroups: OptionalGroup[] = [
      {
        id: "billing",
        title: "Billing details",
        summary: billingSummary,
        render: () => <div className="flex flex-col gap-[12px]">{billingSection?.content}</div>,
      },
      {
        id: "shipping",
        title: "Shipping details",
        summary: shippingSummary,
        render: () => <div className="flex flex-col gap-[12px]">{shippingSection?.content}</div>,
      },
      {
        id: "tax",
        title: "Tax and exemptions",
        summary: taxSummary,
        render: () => <div className="flex flex-col gap-[12px]">{taxSection?.content}</div>,
      },
    ]

    const isSingleConfig = layout === "single-config"
    const accountType = data.accountType === "Individual" ? "Individual" : "Company"
    const accountEmail = data.accountEmail ?? data.email ?? ""
    const registeredName = data.registeredName ?? ""
    const firstName = data.firstName ?? ""
    const lastName = data.lastName ?? ""
    const accountCountry = data.accountCountry ?? ""
    const syncIdentity = (patch: Record<string, unknown>) => {
      const nextType = patch.accountType ?? accountType
      const nextRegistered = String(patch.registeredName ?? registeredName)
      const nextFirst = String(patch.firstName ?? firstName)
      const nextLast = String(patch.lastName ?? lastName)
      const nextEmail = String(patch.accountEmail ?? accountEmail)
      const name = nextType === "Individual" ? `${nextFirst} ${nextLast}`.trim() : nextRegistered.trim()
      onChange({ ...patch, email: nextEmail, name })
    }

    const typeField = (
      <CustomSelect
        label="Account type"
        value={accountType}
        onChange={(type) => syncIdentity({ accountType: type })}
        options={ACCOUNT_TYPE_OPTIONS.map((type) => ({ value: type, label: type }))}
      />
    )
    const nameField = accountType === "Company" ? (
      <Field label="Company name">
        <input
          className={ic("name")}
          placeholder="Example Corp Inc"
          value={registeredName}
          onChange={(e) => syncIdentity({ registeredName: e.target.value })}
        />
        {errorFields?.has("name") && (
          <p className="text-[11px] text-[#DF1B41]">Enter a company name</p>
        )}
      </Field>
    ) : (
      <Field label="Legal name">
        <span className="grid gap-[6px]">
          <input
            aria-label="First name"
            className={ic("name")}
            placeholder="First name"
            value={firstName}
            onChange={(e) => syncIdentity({ firstName: e.target.value })}
          />
          <input
            aria-label="Last name"
            className={tokens.inputClass}
            placeholder="Last name"
            value={lastName}
            onChange={(e) => syncIdentity({ lastName: e.target.value })}
          />
        </span>
      </Field>
    )
    const emailField = (
      <div className="flex flex-col gap-[6px]">
        <Field label="Account email">
          <span className="group relative block">
            <input
              type="email"
              className={`${ic("email")}${!accountEmail.trim() ? " pr-[62px]" : ""}`}
              placeholder="email@example.com"
              value={accountEmail}
              onChange={(e) => syncIdentity({ accountEmail: e.target.value })}
            />
            {!accountEmail.trim() ? (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => syncIdentity({ accountEmail: "accounts@juniperyoga.example" })}
                className="pointer-events-none absolute right-[6px] top-1/2 flex h-[20px] -translate-y-1/2 items-center rounded-[5px] bg-[#EFECFC] px-[6px] text-[11px] font-[600] leading-[14px] text-[#533AFD] opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
              >
                Autofill
              </button>
            ) : null}
          </span>
          {errorFields?.has("email") && (
            <p className="text-[11px] text-[#DF1B41]">Enter an email address</p>
          )}
        </Field>
        {duplicateNudge}
      </div>
    )
    const countryField = (
      <div className="flex flex-col gap-[6px]">
        <span className={tokens.labelClass}>Country</span>
        <CountrySelect
          className={tokens.selectClass}
          value={accountCountry}
          onChange={(country) => syncIdentity({ accountCountry: country, country })}
        />
      </div>
    )
    const selectedNetworkAccount = networkAccounts.find((account) => account.id === selectedNetworkAccountId)
    const accountSearch = isSingleConfig ? (
      <>
        <EntityDropdown
          label="Account"
          placeholder="Find or add an account"
          searchPlaceholder="Search for all account in Stripe's Network"
          items={networkAccounts.map((account) => ({ id: account.id, name: account.name, detail: account.email }))}
          getSearchText={(item) => {
            const account = networkAccounts.find((candidate) => candidate.id === item.id)
            return account
              ? `${account.name} ${account.email} ${account.handle ?? ""} ${account.id} ${account.country}`
              : item.name
          }}
          getGroup={(item) => {
            const account = networkAccounts.find((candidate) => candidate.id === item.id)
            return account?.inNetwork ? "Your Network" : "Stripe's Network"
          }}
          renderOption={(item) => {
            const account = networkAccounts.find((candidate) => candidate.id === item.id)
            return account ? <NetworkAccountOption account={account} compact /> : null
          }}
          groupClassName="text-[11px] font-[400] leading-[14px] text-[#6C7688]"
          addNewClassName="flex w-full items-center gap-[6px] rounded-[4px] px-[6px] py-[6px] text-left text-[12px] font-[500] leading-[16px] text-[#533AFD] transition-colors hover:bg-[#F5F6F8]"
          noResultsClassName="px-[10px] py-[6px] text-[12px] font-[400] leading-[16px] text-[#6C7688]"
          insetOptionHover
          selectedId={selectedNetworkAccountId}
          selectedLabel={!selectedNetworkAccountId && (registeredName || accountEmail) ? registeredName || "New account" : undefined}
          selectedIsPlaceholder={!selectedNetworkAccountId && !registeredName}
          onSelect={(id) => {
            const account = networkAccounts.find((candidate) => candidate.id === id)
            if (!account) return
            setSelectedNetworkAccountId(id)
            fillFromNetworkAccount(account)
          }}
          addNewLabel="Create new account"
          listClassName="max-h-[280px]"
          onAddNew={() => {
            setSelectedNetworkAccountId("")
            onChange({
              customerId: "",
              name: "",
              displayName: "",
              registeredName: "",
              firstName: "",
              lastName: "",
              accountEmail: "",
              email: "",
            })
          }}
        />
        {selectedNetworkAccount ? (
          <AccountSummaryCard account={selectedNetworkAccount} />
        ) : null}
      </>
    ) : null

    return (
      <div className="flex flex-col gap-[16px]">
        <div className="flex flex-col gap-[16px]">
          {isSingleConfig ? (
            <>
              {accountSearch}
              {selectedNetworkAccount ? null : (
                <>
                  {emailField}
                  {typeField}
                  {nameField}
                  {countryField}
                </>
              )}
            </>
          ) : (
            <>
              {emailField}
              {typeField}
              {nameField}
              {countryField}
            </>
          )}
        </div>
        <div>
          <button
            type="button"
            aria-expanded={showMoreSettings}
            aria-controls="account-more-settings"
            className="flex w-full cursor-pointer items-center justify-between py-[4px]"
            onClick={() => setShowMoreSettings((prev) => !prev)}
          >
            <span className="text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#1A2C44]">
              More settings
            </span>
            <LargeChevronIcon rotated={showMoreSettings} size="sm" />
          </button>
          <div
            id="account-more-settings"
            aria-hidden={!showMoreSettings}
            className={`grid min-h-0 min-w-0 transition-[grid-template-rows,opacity] duration-200 ease-out ${
              showMoreSettings ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="min-h-0 overflow-hidden pt-[12px]">
              <OptionalGroups groups={optionalGroups} hideHeader />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[16px]">
      {/* Primary fields: Name, Email, Language */}
      <div className="flex flex-col gap-[12px]">
        <Field label="Name" description="Customer display name; appears on invoices.">
          <input
            className={ic("name")}
            placeholder="e.g. Acme Corporation"
            value={data.name ?? ""}
            onChange={(e) => set("name", e.target.value)}
          />
          {errorFields?.has("name") && (
            <p className="text-[11px] text-[#DF1B41]">Enter a customer name</p>
          )}
        </Field>

        <Field label="Email">
          <input
            type="email"
            className={`${ic("email")} ${isRefresh ? "t-input" : ""} ${isRefresh && emailHasError ? "is-error" : ""} ${isRefresh && shakeEmail ? "is-shaking" : ""}`}
            placeholder="e.g. jenny@example.com"
            value={data.email ?? ""}
            onChange={(e) => set("email", e.target.value)}
          />
          {errorFields?.has("email") && (
            <p className="text-[11px] text-[#DF1B41]">Enter an email address</p>
          )}
        </Field>

        <button
          type="button"
          className="flex items-center gap-[4px] self-start rounded-[6px] px-[8px] py-[4px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#533AFD] transition-colors hover:bg-[#F7F5FD]"
          onClick={() => onChange({ additionalBillingEmails: [...additionalBillingEmails, ""] })}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          Additional billing emails
        </button>

        {additionalBillingEmails.map((email, index) => (
          <div key={index} className="flex items-center gap-[8px]">
            <input
              type="email"
              className={tokens.inputClass}
              placeholder="e.g. billing@example.com"
              value={email}
              onChange={(e) => updateAdditionalBillingEmail(index, e.target.value)}
            />
            <button
              type="button"
              className={`group flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[6px] border ${isRefresh ? "border-[#C1CCD7]" : "border-[#D4DEE9]"} bg-white text-[#3C4F69] hover:border-[#FAA9B8] hover:bg-[#FEF4F6] hover:text-[#E61947]`}
              aria-label="Remove billing email"
              onClick={() => removeAdditionalBillingEmail(index)}
            >
              <TrashIcon className="shrink-0" />
            </button>
          </div>
        ))}

        <CustomSelect
          label="Language"
          value={data.language ?? "en-US"}
          onChange={(v) => set("language", v)}
          options={[
            { value: "en-US", label: "English (United States)" },
            { value: "en-GB", label: "English (United Kingdom)" },
            { value: "fr-FR", label: "French" },
            { value: "de-DE", label: "German" },
            { value: "es-ES", label: "Spanish" },
          ]}
        />
      </div>

      {/* More settings accordion */}
      <div>
      <button
        type="button"
        aria-expanded={showMoreSettings}
        aria-controls="customer-more-settings"
        className={`flex w-full cursor-pointer items-center justify-between rounded-[8px] px-4 py-[4px] transition-colors duration-150 ${showMoreSettings ? (isRefresh ? "bg-[#F6F9FC]" : "bg-[#F5F6F8]") : (isRefresh ? "hover:bg-[#F6F9FC]" : "hover:bg-[#F5F6F8]")}`}
        onClick={() => setShowMoreSettings((prev) => !prev)}
      >
        <span className="text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#1A2C44]">
          More settings
        </span>
        <LargeChevronIcon rotated={showMoreSettings} />
      </button>
      <div
        id="customer-more-settings"
        aria-hidden={!showMoreSettings}
        className={`grid min-h-0 min-w-0 transition-[grid-template-rows,opacity] duration-200 ease-out ${
          showMoreSettings ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-[16px] pt-[12px] pb-[8px]">
            {/* Additional account fields */}
            <div className="flex flex-col gap-[12px]">
              <Field label="Business name">
                <input
                  className={tokens.inputClass}
                  placeholder="e.g. Stripe, Inc."
                  value={data.businessName ?? ""}
                  onChange={(e) => set("businessName", e.target.value)}
                />
              </Field>
              <Field label="Individual name">
                <input
                  className={tokens.inputClass}
                  placeholder="e.g. Jenny Rosen"
                  value={data.individualName ?? ""}
                  onChange={(e) => set("individualName", e.target.value)}
                />
              </Field>
              <Field label="Description">
                <textarea
                  className={tokens.textareaClass}
                  placeholder="e.g. Enterprise tier, annual contract"
                  value={data.description ?? ""}
                  onChange={(e) => set("description", e.target.value)}
                />
              </Field>
            </div>

            {/* Remaining sections */}
            {remainingSections.map((section) => (
              <Section key={section.id} title={section.title}>
                {section.content}
              </Section>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
