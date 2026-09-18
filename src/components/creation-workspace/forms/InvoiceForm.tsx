'use client'

import { useState, useRef, useEffect, type KeyboardEvent, type ReactNode } from "react"
import { EntityDropdown, type EntityItem } from "./EntityDropdown"
import type { WorkflowObject } from "../useWorkflowState"
import { AccountSummaryCard, NetworkAccountOption } from "../account-configuration/AccountConfigurationPrimitives"
import { accountViewDraft, getAccountRoles, getDisplayedNetworkAccount, networkAccountFromCreated, NETWORK_ACCOUNTS } from "../account-configuration/model"

import { EXISTING_PRODUCTS as EXISTING_ITEMS, CURRENCY_OPTIONS } from "./shared/mockEntities"

const INVOICE_ACCOUNTS = NETWORK_ACCOUNTS.map((account) => getDisplayedNetworkAccount(account, "direct"))

function getInvoiceAccountItems(created: EntityItem[] = []) {
  return [
    ...INVOICE_ACCOUNTS.map((account) => ({ id: account.id, name: account.name, detail: account.email })),
    ...created,
  ]
}

function invoiceAccountSearchText(item: EntityItem) {
  const account = INVOICE_ACCOUNTS.find((candidate) => candidate.id === item.id)
  return account
    ? `${account.name} ${account.email} ${account.id} ${account.country} ${getAccountRoles(account).join(" ")}`
    : `${item.name} ${item.detail ?? ""} ${item.id}`
}

function InvoiceAccountOption({ item }: { item: EntityItem }) {
  const account = INVOICE_ACCOUNTS.find((candidate) => candidate.id === item.id)
  if (account) return <NetworkAccountOption account={account} />
  return (
    <span className="flex min-w-0 flex-1 flex-col py-[2px]">
      <span className="truncate text-[12px] font-[600] text-[#1A2C44]">{item.name}</span>
      {item.detail ? <span className="mt-[1px] truncate text-[11px] leading-[16px] text-[#6C7688]">{item.detail}</span> : null}
    </span>
  )
}

const DUE_OPTIONS = [
  { value: "30", label: "Within 30 days" },
  { value: "14", label: "Within 14 days" },
  { value: "7", label: "Within 7 days" },
  { value: "0", label: "Due on receipt" },
  { value: "60", label: "Within 60 days" },
  { value: "90", label: "Within 90 days" },
]

import { getFormTokens } from "./shared/formTokens"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { SegmentedControl } from "@/components/SegmentedControl"
import { useInputFill } from "@/components/creation-workspace/inputFill"
import { useNarrowFormWidth } from "@/components/creation-workspace/narrowFormWidth"
import { ChevronIcon } from "./shared/CustomSelect"
import { OptionalGroups, type OptionalGroup } from "./shared/ComposeGroup"
import { useFocusedField } from "@/components/product-catalog/FocusedFieldContext"

function CustomSelect({ label, value, onChange, options, prefix }: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string; prefix?: string }[]
  prefix?: string
}) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const isRefresh = productFormStyle === "refresh"
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef(new Map<string, HTMLButtonElement>())
  const useFloatingLabel = isRefresh && Boolean(label)
  const floatingControlClass = useFloatingLabel ? "!h-[48px] !rounded-[8px] !pb-[7px] !pt-[19px]" : ""
  const selectedIndex = Math.max(options.findIndex((o) => o.value === value), 0)

  useEffect(() => {
    if (!isOpen) return
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    setActiveIndex(selectedIndex)
    requestAnimationFrame(() => {
      const selected = options[selectedIndex]
      const selectedNode = selected ? optionRefs.current.get(selected.value) : null
      if (listRef.current && selectedNode) listRef.current.scrollTop = selectedNode.offsetTop
    })
  }, [isOpen, selectedIndex, options])

  const selected = options.find((o) => o.value === value)

  const chooseOption = (nextValue: string) => {
    onChange(nextValue)
    setIsOpen(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        return
      }
      setActiveIndex((index) => (index + 1) % options.length)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        return
      }
      setActiveIndex((index) => (index - 1 + options.length) % options.length)
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        return
      }
      const active = options[activeIndex]
      if (active) chooseOption(active.value)
    } else if (event.key === "Escape") {
      event.preventDefault()
      setIsOpen(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    const active = options[activeIndex]
    if (!active) return
    optionRefs.current.get(active.value)?.scrollIntoView({ block: "nearest" })
  }, [isOpen, activeIndex, options])

  return (
    <div className="flex flex-col gap-[4px]">
      {!useFloatingLabel && <label className={tokens.labelClass}>{label}</label>}
      <div ref={containerRef} className="relative">
        {useFloatingLabel && (
          <span className="pointer-events-none absolute left-[11px] top-[6px] z-10 text-[11px] font-[500] leading-[14px] tracking-[-0.04px] text-[#526378]">
            {label}
          </span>
        )}
        <button
          type="button"
          className={`${tokens.inputClass} ${floatingControlClass} flex items-center justify-between`}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
        >
          <span className="flex items-center gap-[6px]">
            {prefix && <span>{prefix}</span>}
            {selected?.prefix && <span>{selected.prefix}</span>}
            {selected?.label ?? value}
          </span>
          <ChevronIcon className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div ref={listRef} role="listbox" className={`absolute left-0 top-[calc(100%+4px)] z-50 max-h-[240px] w-full overflow-y-auto rounded-[8px] border ${isRefresh ? "border-[#EAF0F6]" : "border-[#EBEEF1]"} bg-white py-[4px] shadow-[0px_4px_16px_rgba(0,0,0,0.08)]`}>
            {options.map((opt, index) => (
              <button
                key={opt.value}
                ref={(node) => {
                  if (node) {
                    optionRefs.current.set(opt.value, node)
                  } else {
                    optionRefs.current.delete(opt.value)
                  }
                }}
                type="button"
                role="option"
                aria-selected={opt.value === value}
                className={`flex w-full items-center gap-[6px] px-[10px] py-[6px] text-left text-[12px] transition-colors ${isRefresh ? "hover:bg-[#F6F9FC]" : "hover:bg-[#F5F6F8]"} ${isRefresh && index === activeIndex ? "bg-[#F6F9FC] shadow-[inset_0_0_0_1px_#EAF0F6]" : ""} ${opt.value === value ? "font-[500] text-[#1A2C44]" : `font-[400] ${isRefresh ? "text-[#142234]" : "text-[#353A44]"}`}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => chooseOption(opt.value)}
              >
                {opt.prefix && <span>{opt.prefix}</span>}
                {opt.label}
                {opt.value === value && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-auto shrink-0">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#533AFD" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PaymentMethodChips({ methods, onRemove, onAdd }: {
  methods: string[]
  onRemove: (method: string) => void
  onAdd: () => void
}) {
  const { productFormStyle } = useProductFormStyle()
  const isRefresh = productFormStyle === "refresh"
  const isSail = productFormStyle === "sail"
  const chipHeight = isRefresh ? "h-[26px]" : "h-[24px]"
  const textClass = isRefresh
    ? "text-[13px] font-[575] leading-[20px] tracking-[-0.065px] text-[#142234]"
    : isSail
      ? "text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]"
      : "text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#1A2C44]"
  const addTextClass = isRefresh
    ? "text-[13px] font-[575] leading-[20px] tracking-[-0.065px] text-[#1C1E54]"
    : isSail
      ? "text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#533AFD]"
      : "text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#533AFD]"
  const borderColor = isRefresh ? "border-[#D8E1EA]" : "border-[#D4DEE9]"
  const addIconColor = isRefresh ? "#1C1E54" : "#533AFD"

  return (
    <div className="flex flex-wrap items-center gap-[8px]">
      {methods.map((method) => (
        <span
          key={method}
          className={`flex ${chipHeight} items-center gap-[4px] rounded-full border ${borderColor} pl-[2px] pr-[8px]`}
        >
          <button
            type="button"
            className="flex h-full items-center justify-center pl-[4px]"
            onClick={() => onRemove(method)}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6" cy="6" r="5" stroke="#667691" strokeWidth="1"/>
              <path d="M4 4L8 8M8 4L4 8" stroke="#667691" strokeWidth="1" strokeLinecap="round"/>
            </svg>
          </button>
          <span className={textClass}>{method}</span>
        </span>
      ))}
      <button
        type="button"
        className={`flex ${chipHeight} items-center gap-[6px] rounded-full border ${borderColor} px-[8px]`}
        onClick={onAdd}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="6" cy="6" r="5" stroke={addIconColor} strokeWidth="1"/>
          <path d="M6 3.5V8.5M3.5 6H8.5" stroke={addIconColor} strokeWidth="1" strokeLinecap="round"/>
        </svg>
        <span className={addTextClass}>Add method</span>
      </button>
    </div>
  )
}

function InvoiceFieldRegion({ field, children }: { field: string; children: ReactNode }) {
  const { productFormStyle } = useProductFormStyle()
  const { setFocusedField, setHoveredField } = useFocusedField()
  const isRefresh = productFormStyle === "refresh"
  if (!isRefresh) return <>{children}</>
  return (
    <div
      onMouseEnter={() => setHoveredField(field)}
      onMouseLeave={() => setHoveredField(null)}
      onFocusCapture={() => setFocusedField(field)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusedField(null)
      }}
    >
      {children}
    </div>
  )
}

function RefreshFloatingInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: "text" | "email"
}) {
  const [focused, setFocused] = useState(false)
  const floated = focused || value.trim().length > 0
  return (
    <div className="relative h-[48px] w-full rounded-[8px] bg-white">
      <span
        className="pointer-events-none absolute left-[11px] z-10 text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#68778B] transition-[top,transform,font-size] duration-[170ms] ease-[cubic-bezier(0.2,0,0,1)]"
        style={{
          top: floated ? 6 : 14,
          transform: floated ? "scale(0.846)" : "scale(1)",
          transformOrigin: "top left",
        }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete="off"
        className="h-full w-full rounded-[8px] border border-[#D5DEE7] bg-transparent px-[10px] pb-[7px] pt-[19px] text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#142234] outline-none transition-all hover:border-[#C1CCD7] focus:border-[#A0C8F0] focus:shadow-[0_0_0_4px_rgba(8,142,249,0.2)]"
      />
    </div>
  )
}

function RefreshCustomFieldsToggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  const [hasInteracted, setHasInteracted] = useState(false)
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] font-[500] leading-[20px] tracking-[-0.065px] text-[#142234]">Custom fields</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        data-on={checked ? "true" : "false"}
        className={`t-toggle relative h-[20px] w-[36px] rounded-full border ${checked ? "border-[#142234] bg-[#142234]" : "border-[#D5DEE7] bg-[#F1F6FB]"} ${hasInteracted ? "is-init" : ""} [--toggle-travel:16px]`}
        onClick={() => {
          setHasInteracted(true)
          onChange(!checked)
        }}
      >
        <span className="t-toggle-thumb absolute left-0 top-0 h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_2px_rgba(20,34,52,0.18)]" />
      </button>
    </div>
  )
}

// ── Line items section ─────────────────────────────────────────────────

type Tier = { id: number; firstUnit: string; lastUnit: string; perUnit: string; flatFee: string }

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

function LineItemsSection({
  allObjects,
  lineItemConfigs,
  onChange,
}: {
  allObjects: WorkflowObject[]
  lineItemConfigs: Record<string, { quantity: number }>
  onChange: (configs: Record<string, { quantity: number }>) => void
}) {
  const { productFormStyle } = useProductFormStyle()
  const isRefresh = productFormStyle === "refresh"
  const products = allObjects.filter((o) => o.kind === "product")
  const prices = allObjects.filter((o) => o.kind === "price")
  const meters = allObjects.filter((o) => o.kind === "meter")

  if (products.length === 0 && prices.length === 0) return null

  const setQuantity = (priceId: string, qty: number) => {
    onChange({ ...lineItemConfigs, [priceId]: { quantity: Math.max(0, qty) } })
  }

  const formatAmount = (price: WorkflowObject) => {
    const amount = price.data.amount as string | undefined
    const model = price.data.pricingModel as string | undefined
    const billingPeriod = price.data.billingPeriod as string | undefined
    const periodLabel = billingPeriod ? billingPeriod.replace("ly", "").replace("dai", "day") : null
    const currency = price.data.currency === "EUR" ? "€" : price.data.currency === "GBP" ? "£" : "$"

    if (model === "graduated" || model === "volume") return `${model} tiered`
    if (amount) return `${currency}${amount}${periodLabel ? `/${periodLabel}` : ""}`
    return "—"
  }

  const lineItems: { product: WorkflowObject; price: WorkflowObject | null; meter: WorkflowObject | null; priceCount: number }[] = []
  for (const product of products) {
    const productPriceIds = new Set(((product.data._prices ?? []) as any[]).map((p: any) => p.id))
    const productPrices = prices.filter((p) => productPriceIds.has(p.id))
    const firstPrice = productPrices[0] ?? null
    const isMetered = firstPrice?.data.usageType === "metered"
    const meter = isMetered ? meters.find(() => true) ?? null : null
    lineItems.push({ product, price: firstPrice, meter, priceCount: productPrices.length })
  }

  return (
    <div className="-mt-[4px]">
      <div className="overflow-hidden rounded-[8px] border border-[#ECF1F6]">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[#ECF1F6] bg-[#F8FAFB]">
              <th className="px-[10px] py-[6px] text-left font-[500] text-[#667691]">Item</th>
              <th className="px-[10px] py-[6px] text-right font-[500] text-[#667691]">Price</th>
              <th className="w-[72px] px-[10px] py-[6px] text-right font-[500] text-[#667691]">Qty</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map(({ product, price, meter, priceCount }, idx) => {
              const isTiered = price && (price.data.pricingModel === "graduated" || price.data.pricingModel === "volume")
              const isMetered = price?.data.usageType === "metered"
              const needsQuantity = isTiered || isMetered
              const qty = price ? (lineItemConfigs[price.id]?.quantity ?? 0) : 0
              const tiers = price ? ((price.data.tiers ?? []) as Tier[]) : []

              return (
                <tr key={`${product.id}-${price?.id ?? "no-price"}`} className={idx < lineItems.length - 1 ? "border-b border-[#ECF1F6]" : ""}>
                  <td className="px-[10px] py-[7px]">
                    <p className="font-[600] leading-[16px] text-[#1A2C44]">
                      {product.data.name || "Untitled product"}
                    </p>
                    {price && (
                      <p className="mt-[1px] leading-[14px] text-[#667691]">
                        {price.data.name || "Price"}
                        {priceCount > 1 && <span className="text-[#9CA3B0]"> +{priceCount - 1}</span>}
                        {isMetered && <span className="ml-[4px] text-[#533AFD]">metered</span>}
                        {meter && <span className="text-[#667691]"> · {(meter.data.name as string) || "meter"}</span>}
                      </p>
                    )}
                    {!price && <p className="mt-[1px] leading-[14px] text-[#667691]">No price</p>}
                    {isTiered && qty > 0 && tiers.length > 0 && (() => {
                      const { breakdown, total } = calculateTieredCost(qty, tiers)
                      return (
                        <div className="mt-[4px] flex flex-col gap-[1px]">
                          {breakdown.map((b, i) => (
                            <span key={i} className={`text-[10px] ${isRefresh ? "text-[#526378]" : "text-[#596171]"}`}>
                              {b.label}: {b.units.toLocaleString()} × ${parseFloat(String(b.cost / b.units)).toFixed(3)} = ${b.cost.toFixed(2)}
                            </span>
                          ))}
                          <span className="text-[10px] font-[600] text-[#1A2C44]">Subtotal: ${total.toFixed(2)}</span>
                        </div>
                      )
                    })()}
                  </td>
                  <td className="px-[10px] py-[7px] text-right align-top font-[500] tabular-nums text-[#1A2C44]">
                    {price ? formatAmount(price) : "—"}
                  </td>
                  <td className="px-[10px] py-[7px] text-right align-top">
                    {needsQuantity ? (
                      <input
                        type="number"
                        value={qty || ""}
                        placeholder="0"
                        onChange={(e) => setQuantity(price.id, parseInt(e.target.value) || 0)}
                        className={`w-[56px] rounded-[4px] border ${isRefresh ? "border-[#D5DEE7]" : "border-[#D8DEE4]"} px-[6px] py-[3px] text-right text-[12px] tabular-nums text-[#1A2C44] outline-none ${isRefresh ? "hover:border-[#C1CCD7]" : "hover:border-[#B6C0CD]"} focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7] transition-all placeholder:text-[#9CA3B0]`}
                      />
                    ) : (
                      <span className="tabular-nums text-[#667691]">1</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

type InvoiceFormProps = {
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
  errorFields?: Set<string>
  onAddObject?: (kind: string, existingId?: string, initialData?: Record<string, any>) => void
}

export function InvoiceForm({ data, onChange, errorFields, onAddObject }: InvoiceFormProps) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const isRefresh = productFormStyle === "refresh"
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  // In the narrow standard-small column (~280px) the 3-option Payment collection segmented
  // control overflows and clips its labels, so fall back to a dropdown there (same control as
  // the "Due" field below). Full-screen presentations keep the segmented control.
  const { narrowFormWidth } = useNarrowFormWidth()
  // Advanced settings use the compose pattern: instead of one big "Advanced settings" block,
  // the optional settings are grouped into focused sections rendered by <OptionalGroups>, which
  // discloses them as "+ …" chips or defaulted review rows per the Options-panel setting.
  const set = (key: string, value: unknown) => onChange({ [key]: value })
  const selectedInvoiceAccount = data.customerId && data.customerId !== "_new"
    ? INVOICE_ACCOUNTS.find((account) => account.id === data.customerId)
      ?? (() => {
        const created = (data._createdCustomers as { id: string; name: string; detail?: string; email?: string; country?: string }[] | undefined)
          ?.find((account) => account.id === data.customerId)
        return created ? networkAccountFromCreated(created) : undefined
      })()
    : undefined

  const paymentMethods: string[] = data.paymentMethods ?? ["Card", "Klarna", "Link"]
  const customFieldsEnabled = data.customFieldsEnabled === true || data.customFieldsEnabled === "true"

  // Custom fields (array model so rows can be added / removed)
  const customFields: { name: string; value: string }[] =
    Array.isArray(data.customFields) && data.customFields.length > 0
      ? data.customFields
      : [{ name: "", value: "" }]
  const updateCustomField = (index: number, patch: { name?: string; value?: string }) => {
    onChange({ customFields: customFields.map((f, i) => (i === index ? { ...f, ...patch } : f)) })
  }
  const addCustomField = () => onChange({ customFields: [...customFields, { name: "", value: "" }] })
  const removeCustomField = (index: number) => {
    onChange({ customFields: customFields.filter((_, i) => i !== index) })
  }

  // Attachments
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachments: string[] = Array.isArray(data.attachments) ? data.attachments : []
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return
    onChange({ attachments: [...attachments, ...Array.from(files).map((f) => f.name)] })
  }
  const removeAttachment = (index: number) => {
    onChange({ attachments: attachments.filter((_, i) => i !== index) })
  }

  // Fields for each advanced-settings group, keyed by the group id.
  const renderAdvancedGroup = (id: string) => {
    switch (id) {
      case "template":
        return (
          <div className="flex flex-col gap-[16px]">
            <CustomSelect
              label="Template"
              value={data.template ?? ""}
              onChange={(v) => set("template", v)}
              options={[
                { value: "", label: "Select a template" },
                { value: "default", label: "Default" },
                { value: "minimal", label: "Minimal" },
              ]}
            />
            <div className="flex flex-col gap-[6px]">
              <label className={tokens.labelClass}>PDF page size</label>
              <div className="relative">
                <select
                  className={tokens.selectClass}
                  value={data.pdfPageSize ?? "letter"}
                  onChange={(e) => set("pdfPageSize", e.target.value)}
                >
                  <option value="letter">Letter</option>
                  <option value="a4">A4</option>
                </select>
                <ChevronIcon className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        )
      case "notes":
        return (
          <div className="flex flex-col gap-[16px]">
            <div className="flex flex-col gap-[6px]">
              <label className={tokens.labelClass}>Memo</label>
              <textarea
                className={tokens.textareaClass}
                placeholder="e.g. Thanks for your business!"
                value={data.memo ?? ""}
                onChange={(e) => set("memo", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-[6px]">
              <label className={tokens.labelClass}>Footer</label>
              <textarea
                className={tokens.textareaClass}
                placeholder="e.g. Payment due within 30 days"
                value={data.footer ?? ""}
                onChange={(e) => set("footer", e.target.value)}
              />
            </div>
          </div>
        )
      case "customFields":
        return (
          <div className="flex flex-col gap-[6px]">
            {customFields.map((field, index) => (
              <div key={index} className="flex items-center gap-[8px]">
                <input
                  className={tokens.inputClass}
                  placeholder="Name"
                  value={field.name}
                  onChange={(e) => updateCustomField(index, { name: e.target.value })}
                />
                <input
                  className={tokens.inputClass}
                  placeholder="Value"
                  value={field.value}
                  onChange={(e) => updateCustomField(index, { value: e.target.value })}
                />
                <button
                  type="button"
                  aria-label="Remove custom field"
                  onClick={() => removeCustomField(index)}
                  className={`shrink-0 p-[4px] text-[#667691] ${isRefresh ? "hover:text-[#142234]" : "hover:text-[#353A44]"}`}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.5 3H9.5M4.5 5V8.5M7.5 5V8.5M3 3L3.5 10C3.5 10.5523 3.94772 11 4.5 11H7.5C8.05228 11 8.5 10.5523 8.5 10L9 3M5 3V1.5H7V3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addCustomField}
              className="flex items-center gap-[4px] self-start text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#533AFD]"
            >
              <span>+</span> Add custom field
            </button>
          </div>
        )
      case "attachments":
        return (
          <div className="flex flex-col gap-[6px]">
            {attachments.map((name, index) => (
              <div
                key={index}
                className={`flex h-[28px] items-center justify-between gap-[8px] rounded-[6px] border ${isRefresh ? "border-[#EAF0F6]" : "border-[#D8DEE4]"} bg-white px-[10px] text-[12px] ${isRefresh ? "text-[#142234]" : "text-[#353A44]"}`}
              >
                <span className="truncate">{name}</span>
                <button
                  type="button"
                  aria-label="Remove attachment"
                  onClick={() => removeAttachment(index)}
                  className={`shrink-0 p-[2px] text-[#667691] ${isRefresh ? "hover:text-[#142234]" : "hover:text-[#353A44]"}`}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ))}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFilesSelected(e.target.files)
                e.target.value = ""
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex h-[28px] w-full items-center justify-center gap-[6px] rounded-[6px] border ${isRefresh ? "border-[#C1CCD7]" : "border-[#D4DEE9]"} bg-white text-[12px] font-[500] ${isRefresh ? "text-[#142234]" : "text-[#353A44]"} transition-colors ${isRefresh ? "hover:bg-[#F6F9FC]" : "hover:bg-[#F5F6F8]"}`}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 2V10M6 2L3 5M6 2L9 5" stroke="#667691" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Upload file
            </button>
          </div>
        )
      case "taxId":
        return (
          <div className="flex flex-col gap-[6px]">
            <label className={tokens.labelClass}>Tax ID</label>
            <div className="relative">
              <select
                className={tokens.selectClass}
                value={data.taxId ?? ""}
                onChange={(e) => set("taxId", e.target.value)}
              >
                <option value="">Find or add a tax ID</option>
              </select>
              <ChevronIcon className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2" />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  // One-line summaries so a collapsed group / review row reads as done-vs-not-done.
  const memo = (data.memo ?? "").trim()
  const footer = (data.footer ?? "").trim()
  const templateLabel = data.template
    ? ({ default: "Default", minimal: "Minimal" } as Record<string, string>)[data.template] ?? data.template
    : isRefresh ? "Default" : null
  const pdfPageSizeLabel = (data.pdfPageSize ?? "letter") === "a4" ? "A4" : "Letter"
  const cfCount = customFieldsEnabled
    ? customFields.filter((f) => (f.name ?? "").trim() || (f.value ?? "").trim()).length
    : 0
  const advancedGroups: OptionalGroup[] = [
    {
      id: "template",
      title: "Template and appearance",
      summary: templateLabel ? `${templateLabel} · ${pdfPageSizeLabel}` : "Not set",
      render: () => renderAdvancedGroup("template"),
    },
    {
      id: "notes",
      title: "Memo and footer",
      summary: memo && footer ? "Memo + footer" : memo ? "Memo added" : footer ? "Footer added" : "Not added",
      render: () => renderAdvancedGroup("notes"),
    },
    {
      id: "customFields",
      title: "Custom fields",
      summary: cfCount ? `${cfCount} field${cfCount > 1 ? "s" : ""}` : "Not added",
      render: () => renderAdvancedGroup("customFields"),
    },
    {
      id: "attachments",
      title: "Attachments",
      summary: attachments.length ? `${attachments.length} file${attachments.length > 1 ? "s" : ""}` : "None",
      render: () => renderAdvancedGroup("attachments"),
    },
    {
      id: "taxId",
      title: isRefresh ? "Tax" : "Tax ID",
      summary: data.taxId ? String(data.taxId) : "Not added",
      render: () => renderAdvancedGroup("taxId"),
    },
  ].filter((group) => !isRefresh || group.id !== "customFields")

  return (
    <div className={isRefresh ? "flex flex-col gap-[24px]" : "flex flex-col gap-[16px]"}>
      <InvoiceFieldRegion field="invoice.customer">
        <div className="flex flex-col gap-[12px]">
          <EntityDropdown
            label="Account"
            placeholder="Find or add an account"
            searchPlaceholder="Search by name, email, or account ID"
            items={getInvoiceAccountItems(data._createdCustomers ?? [])}
            getSearchText={invoiceAccountSearchText}
            renderOption={(item) => <InvoiceAccountOption item={item} />}
            insetOptionHover
            selectedId={data.customerId ?? ""}
            selectedLabel={data.customerName}
            selectedIsPlaceholder={data.customerId === "_new" && (!data.customerName || data.customerName === "New account")}
            onSelect={(id) => {
              const account = getInvoiceAccountItems(data._createdCustomers ?? []).find((candidate) => candidate.id === id)
              onChange({ customerId: id, customerName: account?.name ?? "" })
            }}
            addNewLabel="Create new account"
            onAddNew={() => {
              onAddObject?.("customer")
              onChange({ customerId: "_new", customerName: "New account" })
            }}
            editLabel="View account"
            onEdit={data.customerId && data.customerId !== "_new" ? () => {
              const created = (data._createdCustomers as { id: string; name: string; detail?: string; country?: string; draft?: Record<string, unknown> }[] | undefined)
                ?.find((account) => account.id === data.customerId)
              const network = INVOICE_ACCOUNTS.find((account) => account.id === data.customerId)
              const source = created ?? (network
                ? { id: network.id, name: network.name, email: network.email, country: network.country }
                : undefined)
              if (!source) return
              onAddObject?.("customer", source.id, accountViewDraft(source))
            } : undefined}
            hasError={errorFields?.has("customerId")}
            errorMessage="Select an account"
            autoFocus={isRefresh}
          />
          {selectedInvoiceAccount ? <AccountSummaryCard account={selectedInvoiceAccount} /> : null}
        </div>
      </InvoiceFieldRegion>

      {isRefresh && (
        <InvoiceFieldRegion field="invoice.email">
          <RefreshFloatingInput
            label="Email"
            type="email"
            value={data.email ?? ""}
            onChange={(v) => set("email", v)}
          />
        </InvoiceFieldRegion>
      )}

      <InvoiceFieldRegion field="invoice.currency">
        <CustomSelect
          label="Currency"
          value={data.currency ?? "USD"}
          onChange={(v) => set("currency", v)}
          options={CURRENCY_OPTIONS}
        />
      </InvoiceFieldRegion>

      <InvoiceFieldRegion field="invoice.items">
        <EntityDropdown
          label="Items"
          placeholder="Find or add an item"
          searchPlaceholder="Search items..."
          items={[...EXISTING_ITEMS, ...(data._createdProducts ?? [])]}
          selectedId={data.productId ?? ""}
          selectedLabel={data.productName}
          selectedIsPlaceholder={data.productId === "_new" && (!data.productName || data.productName === "New product")}
          onSelect={(id) => {
            const allItems = [...EXISTING_ITEMS, ...(data._createdProducts ?? [])]
            const product = allItems.find((p) => p.id === id)
            onChange({ productId: id, productName: product?.name ?? "" })
          }}
          addNewLabel="Add new item"
          onAddNew={() => {
            onAddObject?.("product")
            onChange({ productId: "_new", productName: "New product" })
          }}
          onEdit={() => {
            const existingProduct = ((data._allObjects ?? []) as WorkflowObject[]).find((o) => o.kind === "product")
            if (existingProduct) {
              onAddObject?.("product", existingProduct.id)
            } else {
              const selectedName = data.productName && data.productName !== "New product" ? data.productName : ""
              onAddObject?.("product", undefined, selectedName ? { name: selectedName } : undefined)
            }
          }}
          hasError={errorFields?.has("productId")}
          errorMessage="Select an item"
          highlight={!!data._highlightItems}
        />
      </InvoiceFieldRegion>


      {narrowFormWidth ? (
        <InvoiceFieldRegion field="invoice.paymentCollection">
          <CustomSelect
            label="Payment collection"
            value={data.paymentCollection ?? "request_full"}
            onChange={(v) => set("paymentCollection", v)}
            options={[
              { value: "request_full", label: "Request full" },
              { value: "request_multiple", label: "Request multiple" },
              { value: "charge_now", label: "Charge now" },
            ]}
          />
        </InvoiceFieldRegion>
      ) : (
        <InvoiceFieldRegion field="invoice.paymentCollection">
        <div className="flex flex-col gap-[8px]">
          <label className={tokens.labelClass}>Payment collection</label>
          <SegmentedControl
            value={data.paymentCollection ?? "request_full"}
            onChange={(v) => set("paymentCollection", v)}
            options={["request_full", "request_multiple", "charge_now"]}
            variantOverride={isRefresh ? "segmented" : undefined}
            getDisplayValue={(v) =>
              v === "request_full" ? "Request full" : v === "request_multiple" ? "Request multiple" : "Charge now"
            }
          />
        </div>
        </InvoiceFieldRegion>
      )}

      <InvoiceFieldRegion field="invoice.due">
        <CustomSelect
          label="Due"
          value={data.due ?? "30"}
          onChange={(v) => set("due", v)}
          options={DUE_OPTIONS}
        />
      </InvoiceFieldRegion>

      {isRefresh ? (
        <>
          <InvoiceFieldRegion field="invoice.customFields">
            <RefreshCustomFieldsToggle checked={customFieldsEnabled} onChange={(checked) => set("customFieldsEnabled", checked)} />
          </InvoiceFieldRegion>
          {customFieldsEnabled && (
            <div className="-mt-[12px] rounded-[8px] bg-[#F6F9FC] p-[12px]">
              {renderAdvancedGroup("customFields")}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-[6px]">
          <label className={tokens.labelClass}>Payment methods</label>
          <PaymentMethodChips
            methods={paymentMethods}
            onRemove={(method) => {
              onChange({ paymentMethods: paymentMethods.filter((m) => m !== method) })
            }}
            onAdd={() => {
              /* placeholder — could open a method picker */
            }}
          />
        </div>
      )}

      {/* Advanced settings — compose pattern via the shared renderer: "+ …" chips or defaulted
          review rows depending on the Options-panel disclosure setting. */}
      <OptionalGroups groups={advancedGroups} />
    </div>
  )
}
