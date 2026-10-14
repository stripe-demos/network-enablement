'use client'

import { useState, useRef, useEffect, useMemo } from "react"
import { getFormTokens } from "./shared/formTokens"
import { ChevronIcon } from "./shared/CustomSelect"
import { Checkbox } from "./shared/Checkbox"
import { EXISTING_PRODUCTS } from "./shared/mockEntities"
import { SegmentedControl } from "@/components/SegmentedControl"
import { useSectionDividers } from "@/components/creation-workspace/sectionDividers"
import { useChildSettingStyle, getChildSettingContentClass, getChildSettingFillClass } from "@/components/creation-workspace/childSettingStyle"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { useInputFill } from "@/components/creation-workspace/inputFill"
import { filterPaymentLinkFields } from "./shared/paymentLinkFieldRegistry"
import { renderHighlightedText } from "./shared/highlightText"

type ActivePage = "link" | "payment" | "after"

type PaymentLinkFormProps = {
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
  errorFields?: Set<string>
  onAddObject?: (kind: string, existingId?: string) => void
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const { productFormStyle } = useProductFormStyle()
  const t = getFormTokens(productFormStyle).toggle
  const isRefresh = productFormStyle === "refresh"
  const [hasInteracted, setHasInteracted] = useState(false)

  if (isRefresh) {
    return (
      <button
        type="button"
        className={`t-toggle group relative shrink-0 rounded-full border ${t.trackClass} ${checked ? t.onClass : t.offClass} ${hasInteracted ? "is-init" : ""}`}
        data-on={checked ? "true" : "false"}
        onClick={() => {
          setHasInteracted(true)
          onChange(!checked)
        }}
        role="switch"
        aria-checked={checked}
      >
        <span className={`t-toggle-thumb absolute left-0 rounded-full bg-white shadow-[0_1px_1px_rgba(33,37,44,0.16)] ${t.knobClass}`} />
      </button>
    )
  }

  return (
    <button
      type="button"
      className={`group relative shrink-0 rounded-full border transition-colors ${t.trackClass} ${
        checked ? t.onClass : t.offClass
      }`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`absolute rounded-full bg-white shadow-[0_1px_1px_rgba(33,37,44,0.16)] transition-all ${t.knobClass} ${
          checked ? `${t.knobOnPos} ${t.knobOnBorder}` : `${t.knobOffPos} ${t.knobOffBorder}`
        }`}
      />
    </button>
  )
}

// Custom fields — array model so rows can be added / removed. Shared by the
// "Products or subscriptions" payment page and the "Customers choose" advanced options.
function CustomFieldsSection({
  data,
  onChange,
  isRefresh,
}: {
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
  isRefresh: boolean
}) {
  const fields: { type: string; label: string }[] =
    Array.isArray(data.customFields) && data.customFields.length > 0
      ? data.customFields
      : [{ type: "Text", label: "" }]
  const update = (i: number, patch: { type?: string; label?: string }) =>
    onChange({ customFields: fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)) })
  const add = () => onChange({ customFields: [...fields, { type: "Text", label: "" }] })
  const remove = (i: number) =>
    onChange({ customFields: fields.length <= 1 ? [{ type: "Text", label: "" }] : fields.filter((_, idx) => idx !== i) })

  const fieldText = isRefresh ? "text-[13px]" : "text-[12px]"
  const border = isRefresh ? "border-[#D5DEE7]" : "border-[#D8DEE4]"
  const hoverBorder = isRefresh ? "hover:border-[#C1CCD7]" : "hover:border-[#B6C0CD]"

  return (
    <div className="flex flex-col gap-[8px]">
      {fields.map((field, i) => (
        <div key={i} className="flex items-center gap-[6px] min-w-0">
          <div className="relative shrink-0">
            <select
              className={`h-[30px] w-[92px] appearance-none rounded-[6px] border ${border} bg-white pl-[8px] pr-[26px] ${fieldText} font-[500] text-[#1A2C44] outline-none transition-all ${hoverBorder} focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7]`}
              value={field.type}
              onChange={(e) => update(i, { type: e.target.value })}
            >
              <option>Text</option>
              <option>Numeric</option>
              <option>Dropdown</option>
            </select>
            <svg className={`pointer-events-none absolute right-[8px] top-1/2 -translate-y-1/2 ${isRefresh ? "text-[#68778B]" : "text-[#6C7688]"}`} width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <input
            className={`h-[30px] min-w-0 flex-1 rounded-[6px] border ${border} bg-white px-[8px] ${fieldText} font-[500] text-[#1A2C44] placeholder:text-[#9CA3B0] outline-none transition-all ${hoverBorder} focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7]`}
            placeholder="Label name"
            value={field.label}
            onChange={(e) => update(i, { label: e.target.value })}
          />
          {fields.length > 1 && (
            <button
              type="button"
              aria-label="Remove field"
              onClick={() => remove(i)}
              className={`shrink-0 p-[4px] text-[#667691] ${isRefresh ? "hover:text-[#142234]" : "hover:text-[#353A44]"}`}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 3H9.5M4.5 5V8.5M7.5 5V8.5M3 3L3.5 10C3.5 10.5523 3.94772 11 4.5 11H7.5C8.05228 11 8.5 10.5523 8.5 10L9 3M5 3V1.5H7V3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className={`-mx-[4px] self-start rounded-[6px] px-[4px] py-[4px] text-left font-[500] transition-colors ${isRefresh ? "text-[13px] text-[#2C219E] hover:bg-[#F1F6FB]" : "text-[11px] text-[#533AFD] hover:bg-[#F5F6F8]"}`}
      >
        + Add another field
      </button>
    </div>
  )
}

const PRODUCT_GRADIENTS: Record<string, string> = {
  prod_1: "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)",
  prod_2: "linear-gradient(135deg, #F093FB 0%, #F5576C 100%)",
  prod_3: "linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)",
}

function ProductCard({
  productId,
  settings,
  onRemove,
  onChangeSetting,
}: {
  productId: string
  settings: { quantity: string; adjustQuantity: boolean; minQty: string; maxQty: string }
  onRemove: () => void
  onChangeSetting: (key: string, value: string | boolean) => void
}) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const isRefresh = productFormStyle === "refresh"
  const fieldSurface = isRefresh
    ? inputFill
      ? "border-transparent bg-[#EAF0F6]"
      : "border-[#D5DEE7] bg-white"
    : "border-[#D8DEE4] bg-white"
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const product = EXISTING_PRODUCTS.find((p) => p.id === productId)

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [menuOpen])

  if (!product) return null

  return (
    <div className="rounded-[10px] border border-[#E3E8EF] bg-white overflow-hidden">
      {/* Card header with image and product info */}
      <div className="flex items-start gap-[12px] p-[12px] pb-[10px]">
        <div
          className="h-[40px] w-[40px] shrink-0 rounded-[8px]"
          style={{ background: PRODUCT_GRADIENTS[productId] ?? "linear-gradient(135deg, #A8EDEA 0%, #FED6E3 100%)" }}
        />
        <div className="flex flex-1 flex-col gap-[2px] min-w-0">
          <span className="text-[13px] font-[600] text-[#1A2C44] leading-[18px] truncate">{product.name}</span>
          <span className={`text-[12px] font-[400] ${isRefresh ? "text-[#68778B]" : "text-[#6C7688]"} leading-[16px]`}>{product.detail}</span>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className={`flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[6px] border ${isRefresh ? "border-[#C1CCD7]" : "border-[#D4DEE9]"} bg-white transition-colors ${menuOpen ? (isRefresh ? "bg-[#F6F9FC]" : "bg-[#F5F6F8]") : (isRefresh ? "hover:bg-[#F6F9FC]" : "hover:bg-[#F5F6F8]")}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="2.5" cy="6" r="1" fill="#3C4F69" />
              <circle cx="6" cy="6" r="1" fill="#3C4F69" />
              <circle cx="9.5" cy="6" r="1" fill="#3C4F69" />
            </svg>
          </button>
          {menuOpen && (
            <div className={`absolute right-0 top-[28px] z-50 w-[120px] rounded-[8px] border ${isRefresh ? "border-[#EAF0F6]" : "border-[#D8DEE4]"} bg-white py-[4px] shadow-[0_12px_32px_rgba(28,32,40,0.12)]`}>
              <button
                type="button"
                className={`flex w-full items-center px-[10px] py-[6px] text-left text-[12px] font-[500] text-[#DF1B41] transition-colors ${isRefresh ? "hover:bg-[#F6F9FC]" : "hover:bg-[#F5F6F8]"}`}
                onClick={() => {
                  onRemove()
                  setMenuOpen(false)
                }}
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editable fields */}
      <div className="flex flex-col gap-[8px] border-t border-[#F0F3F7] px-[12px] py-[10px]">
        <div className="flex items-center justify-between">
          <label className="text-[12px] font-[400] text-[#273951]">Quantity</label>
          <input
            className={`h-[26px] w-[48px] rounded-[6px] border ${fieldSurface} px-[8px] text-center text-[12px] font-[500] text-[#1A2C44] outline-none focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7]`}
            value={settings.quantity}
            onChange={(e) => onChangeSetting("quantity", e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-[400] text-[#273951]">Adjustable by customers</span>
          <Toggle checked={settings.adjustQuantity} onChange={(v) => onChangeSetting("adjustQuantity", v)} />
        </div>
        {settings.adjustQuantity && (
          <div className="flex items-center gap-[6px] pt-[2px]">
            <span className={`text-[11px] ${isRefresh ? "text-[#68778B]" : "text-[#6C7688]"}`}>Min</span>
            <input
              className={`h-[26px] w-[40px] rounded-[6px] border ${fieldSurface} px-[8px] text-center text-[12px] font-[500] text-[#1A2C44] outline-none focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7]`}
              value={settings.minQty}
              onChange={(e) => onChangeSetting("minQty", e.target.value)}
            />
            <span className={`text-[11px] ${isRefresh ? "text-[#68778B]" : "text-[#6C7688]"}`}>Max</span>
            <input
              className={`h-[26px] w-[40px] rounded-[6px] border ${fieldSurface} px-[8px] text-center text-[12px] font-[500] text-[#1A2C44] outline-none focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7]`}
              value={settings.maxQty}
              onChange={(e) => onChangeSetting("maxQty", e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function AddProductDropdown({
  allProducts,
  excludeIds,
  onSelect,
  autoFocus,
}: {
  allProducts: typeof EXISTING_PRODUCTS
  excludeIds: string[]
  onSelect: (id: string) => void
  autoFocus?: boolean
}) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const isRefresh = productFormStyle === "refresh"
  const dropdownTokens = getFormTokens(productFormStyle, { filled: inputFill })
  const [isOpen, setIsOpen] = useState(autoFocus ?? false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [autoFocus])

  useEffect(() => {
    if (!isOpen) return
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [isOpen])

  const available = allProducts.filter((p) => !excludeIds.includes(p.id))
  const filtered = available.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="relative" ref={containerRef}>
      {isOpen ? (
        <input
          ref={inputRef}
          className={dropdownTokens.inputClass}
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      ) : (
        <button
          type="button"
          className={`${dropdownTokens.inputClass} flex items-center justify-between text-left`}
          onClick={() => {
            setIsOpen(true)
            setTimeout(() => inputRef.current?.focus(), 0)
          }}
        >
          <span className="text-[#9CA3B0]">Select a product...</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="#6C7688" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="absolute left-0 right-0 top-[34px] z-50 rounded-[8px] border border-[#E3E8EF] bg-white py-[4px] shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`flex w-full items-center justify-between px-[10px] py-[6px] text-left transition-colors ${isRefresh ? "hover:bg-[#F6F9FC]" : "hover:bg-[#F5F6F8]"}`}
              onClick={() => {
                onSelect(item.id)
                setIsOpen(false)
                setSearch("")
              }}
            >
              <div className="flex items-center gap-[8px]">
                <div
                  className="h-[24px] w-[24px] shrink-0 rounded-[4px]"
                  style={{ background: PRODUCT_GRADIENTS[item.id] ?? "linear-gradient(135deg, #A8EDEA 0%, #FED6E3 100%)" }}
                />
                <span className={`text-[12px] font-[500] ${isRefresh ? "text-[#142234]" : "text-[#353A44]"}`}>{item.name}</span>
              </div>
              {item.detail && <span className={`text-[11px] ${isRefresh ? "text-[#68778B]" : "text-[#6C7688]"}`}>{item.detail}</span>}
            </button>
          ))}
          {filtered.length === 0 && search && (
            <div className="px-[10px] py-[6px] text-[11px] text-[#9CA3B0]">
              No results matching &ldquo;{search}&rdquo;
            </div>
          )}
          {available.length === 0 && !search && (
            <div className="px-[10px] py-[6px] text-[11px] text-[#9CA3B0]">
              All products added
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const LINK_TYPES = ["Products or subscriptions", "Customers choose"] as const
const CONFIRMATION_OPTIONS = ["Show confirmation page", "Don't show confirmation page"] as const
const ADDRESS_OPTIONS = ["Billing only", "Billing and Shipping"] as const

export function PaymentLinkForm({ data, onChange, errorFields, onAddObject }: PaymentLinkFormProps) {
  const set = (key: string, value: string | boolean) => onChange({ [key]: value })
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const { sectionDividers } = useSectionDividers()
  const { childSettingStyle } = useChildSettingStyle()
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  const isRefresh = productFormStyle === "refresh"
  const effectiveInputClass = tokens.inputClass
  const effectiveTextareaClass = tokens.textareaClass
  const childSettingTheme = {
    surface: isRefresh ? "bg-[#F6F9FC]" : "bg-[#F6F8FA]",
    padding: "px-[12px] py-[8px]",
    isRefresh,
  }
  // Wrapper around a toggle + its revealed child. Only the "filled" mode tints this
  // group (full-bleed inside a divided list, or a rounded block otherwise); the other
  // modes leave it plain and let the child carry the grouping.
  const childSettingGroupClass = (enabled: boolean, withSectionSpacing = false) => {
    const divided = withSectionSpacing && sectionDividers && !isFiltering
    const spacing = divided ? "px-[16px] py-[12px]" : ""
    const fill = getChildSettingFillClass(childSettingStyle, enabled, { surface: childSettingTheme.surface, padding: "px-[12px] py-[10px]" }, { divided })
    return `flex flex-col gap-[8px] ${spacing} ${fill}`
  }
  const childSettingBoxClass = getChildSettingContentClass(childSettingStyle, childSettingTheme)
  const childSettingStackClass = `${getChildSettingContentClass(childSettingStyle, childSettingTheme)} flex flex-col gap-[8px]`
  const childSettingOverflowClass = `${getChildSettingContentClass(childSettingStyle, childSettingTheme)} overflow-hidden`
  // In "filled" mode every ON toggle fills — even bare ones without a revealed child.
  const simpleRowClass = (on: boolean) => {
    const divided = sectionDividers && !isFiltering
    const base = divided ? `${toggleRow} px-[16px] py-[12px]` : toggleRow
    const fill = getChildSettingFillClass(childSettingStyle, on, { surface: childSettingTheme.surface, padding: "px-[12px] py-[10px]" }, { divided })
    return `${base} ${fill}`
  }
  // Segmented controls that are revealed children get a darker track on a grey fill.
  const segmentedContrast = childSettingStyle === "filled" || childSettingStyle === "tint"
  // Refresh + filled: inset the divided cells 2px so the grey doesn't bleed into the edge.
  const dividedListInset = isRefresh && childSettingStyle === "filled" ? "px-[4px]" : ""

  const activePage: ActivePage = data._activePage ?? "link"
  const navStyle: "sidebar" | "tabs" = data._navStyle ?? "sidebar"
  const formFilter: string = data._formFilter ?? ""
  const { isFiltering, matchedIds } = useMemo(
    () => filterPaymentLinkFields(formFilter),
    [formFilter]
  )
  const linkType = data.linkType ?? "Products or subscriptions"
  const selectedProducts: { id: string; name: string }[] = data.selectedProducts ?? []

  const enableManagedPayments = Boolean(data.enableManagedPayments)
  const collectTax = Boolean(data.collectTax)
  const collectCustomerNames = Boolean(data.collectCustomerNames)
  const customerNamesOptional = Boolean(data.customerNamesOptional)
  const collectBusinessNames = Boolean(data.collectBusinessNames)
  const businessNamesOptional = Boolean(data.businessNamesOptional)
  const collectAddresses = Boolean(data.collectAddresses)
  const addressType = data.addressType ?? "Billing only"
  const requirePhone = Boolean(data.requirePhone)
  const includeFreeTrial = Boolean(data.includeFreeTrial)
  const trialWithoutPayment = Boolean(data.trialWithoutPayment)
  const limitPayments = Boolean(data.limitPayments)
  const addCustomFields = Boolean(data.addCustomFields)
  const allowPromoCodes = Boolean(data.allowPromoCodes)
  const allowTaxIds = Boolean(data.allowTaxIds)
  const requireTaxIdCollection = Boolean(data.requireTaxIdCollection)
  const savePaymentDetails = Boolean(data.savePaymentDetails)
  const termsOfService = Boolean(data.termsOfService)

  const confirmationPage = data.confirmationPage ?? "Show confirmation page"
  const replaceWithCustomMessage = Boolean(data.replaceWithCustomMessage)
  const splitPayment = Boolean(data.splitPayment)
  const createInvoicePdf = Boolean(data.createInvoicePdf)
  const useInvoiceTemplate = Boolean(data.useInvoiceTemplate)

  const productSettings: Record<string, { quantity: string; adjustQuantity: boolean; minQty: string; maxQty: string }> = data.productSettings ?? {}
  const recommendedProducts: { id: string; name: string }[] = data.recommendedProducts ?? []
  const recommendedSettings: Record<string, { quantity: string; adjustQuantity: boolean; minQty: string; maxQty: string }> = data.recommendedSettings ?? {}

  const handleSelectProduct = (id: string) => {
    const product = EXISTING_PRODUCTS.find((p) => p.id === id)
    if (!product) return
    const existing = selectedProducts.filter((p) => p.id !== id)
    onChange({
      selectedProducts: [...existing, { id, name: product.name }],
      productSettings: { ...productSettings, [id]: { quantity: "1", adjustQuantity: false, minQty: "0", maxQty: "99" } },
    })
  }

  const handleRemoveProduct = (id: string) => {
    const { [id]: _, ...rest } = productSettings
    onChange({ selectedProducts: selectedProducts.filter((p) => p.id !== id), productSettings: rest })
  }

  const handleProductSetting = (id: string, key: string, value: string | boolean) => {
    const current = productSettings[id] ?? { quantity: "1", adjustQuantity: false, minQty: "0", maxQty: "99" }
    onChange({ productSettings: { ...productSettings, [id]: { ...current, [key]: value } } })
  }

  const handleSelectRecommended = (id: string) => {
    const product = EXISTING_PRODUCTS.find((p) => p.id === id)
    if (!product) return
    const existing = recommendedProducts.filter((p) => p.id !== id)
    onChange({
      recommendedProducts: [...existing, { id, name: product.name }],
      recommendedSettings: { ...recommendedSettings, [id]: { quantity: "1", adjustQuantity: false, minQty: "0", maxQty: "99" } },
    })
  }

  const handleRemoveRecommended = (id: string) => {
    const { [id]: _, ...rest } = recommendedSettings
    onChange({ recommendedProducts: recommendedProducts.filter((p) => p.id !== id), recommendedSettings: rest })
  }

  const handleRecommendedSetting = (id: string, key: string, value: string | boolean) => {
    const current = recommendedSettings[id] ?? { quantity: "1", adjustQuantity: false, minQty: "0", maxQty: "99" }
    onChange({ recommendedSettings: { ...recommendedSettings, [id]: { ...current, [key]: value } } })
  }


  const toggleRow = tokens.toggleRow

  const hasPaymentMatches = isFiltering && ["enableManagedPayments", "collectTax", "collectCustomerNames", "collectBusinessNames", "collectAddresses", "requirePhone", "includeFreeTrial", "limitPayments", "addCustomFields", "allowPromoCodes", "allowTaxIds", "savePaymentDetails", "termsOfService"].some((id) => matchedIds.has(id))
  const hasAfterMatches = isFiltering && ["confirmationPage", "replaceWithCustomMessage", "splitPayment", "createInvoicePdf"].some((id) => matchedIds.has(id))

  const hl = (text: string) => isFiltering ? renderHighlightedText(text, formFilter) : text

  return (
    <div className="flex flex-col gap-[16px]">
      {/* No results state */}
      {isFiltering && !hasPaymentMatches && !hasAfterMatches && (
        <div className="flex items-center justify-center py-[24px]">
          <p className="text-[12px] font-[400] text-[#9CA3B0]">No matching settings</p>
        </div>
      )}

      {/* Payment link (parent page) — also shown at top of payment tab in tabs mode */}
      {!isFiltering && (activePage === "link" || (navStyle === "tabs" && activePage === "payment")) && (
        <>
          <div className="flex flex-col gap-[4px]">
            <label className={tokens.labelClass}>Type</label>
            <div className="relative">
              <select
                className={`${tokens.selectClass} pl-[8px]`}
                value={linkType}
                onChange={(e) => set("linkType", e.target.value)}
              >
                {LINK_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <svg className={`pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2 ${isRefresh ? "text-[#68778B]" : "text-[#6C7688]"}`} width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>

          {linkType === "Products or subscriptions" && (
            <div className="flex flex-col gap-[16px]">
              <div className="flex flex-col gap-[6px]">
                <label className={tokens.labelClass}>Products</label>
                {selectedProducts.length > 0 && (
                  <div className="flex flex-col gap-[10px] pb-[6px]">
                    {selectedProducts.map((p) => {
                      const settings = productSettings[p.id] ?? { quantity: "1", adjustQuantity: false, minQty: "0", maxQty: "99" }
                      return (
                        <ProductCard
                          key={p.id}
                          productId={p.id}
                          settings={settings}
                          onRemove={() => handleRemoveProduct(p.id)}
                          onChangeSetting={(key, value) => handleProductSetting(p.id, key, value)}
                        />
                      )
                    })}
                  </div>
                )}
                <AddProductDropdown
                  allProducts={EXISTING_PRODUCTS}
                  excludeIds={[...selectedProducts.map((sp) => sp.id), ...recommendedProducts.map((rp) => rp.id)]}
                  onSelect={handleSelectProduct}
                />
              </div>

              {/* Recommended products — only visible once a product is selected */}
              {selectedProducts.length > 0 && (
                <div className="flex flex-col gap-[6px]">
                  <label className={tokens.labelClass}>Recommended products</label>
                  {recommendedProducts.length > 0 && (
                    <div className="flex flex-col gap-[10px] pb-[6px]">
                      {recommendedProducts.map((p) => {
                        const settings = recommendedSettings[p.id] ?? { quantity: "1", adjustQuantity: false, minQty: "0", maxQty: "99" }
                        return (
                          <ProductCard
                            key={p.id}
                            productId={p.id}
                            settings={settings}
                            onRemove={() => handleRemoveRecommended(p.id)}
                            onChangeSetting={(key, value) => handleRecommendedSetting(p.id, key, value)}
                          />
                        )
                      })}
                    </div>
                  )}
                  <AddProductDropdown
                    allProducts={EXISTING_PRODUCTS}
                    excludeIds={[...selectedProducts.map((sp) => sp.id), ...recommendedProducts.map((rp) => rp.id)]}
                    onSelect={handleSelectRecommended}
                  />
                </div>
              )}
            </div>
          )}

          {linkType === "Customers choose" && (
            <div className="flex flex-col gap-[16px]">
              <div className="flex flex-col gap-[4px]">
                <label className={tokens.labelClass}>Title</label>
                <input
                  className={effectiveInputClass}
                  placeholder="Payment"
                  value={data.customerChooseTitle ?? ""}
                  onChange={(e) => set("customerChooseTitle", e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-[4px]">
                <label className={tokens.labelClass}>Description</label>
                <textarea
                  className={effectiveTextareaClass}
                  placeholder="Describe what this payment is for"
                  value={data.customerChooseDescription ?? ""}
                  onChange={(e) => set("customerChooseDescription", e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-[4px]">
                <label className={tokens.labelClass}>Image</label>
                <div className={`flex h-[60px] items-center justify-center rounded-[6px] border border-dashed ${isRefresh ? "border-[#EAF0F6]" : "border-[#D8DEE4]"} bg-[#F8FAFB]`}>
                  <span className="text-[11px] font-[500] text-[#533AFD]">+ Upload image</span>
                </div>
              </div>

              <div className="flex flex-col gap-[4px]">
                <label className={tokens.labelClass}>Product category</label>
                <select
                  className={effectiveInputClass}
                  value={data.productCategory ?? ""}
                  onChange={(e) => set("productCategory", e.target.value)}
                >
                  <option value="">Select category</option>
                  <option value="digital_goods">Digital goods</option>
                  <option value="physical_goods">Physical goods</option>
                  <option value="services">Services</option>
                  <option value="donations">Donations</option>
                </select>
              </div>

              <div className="flex flex-col gap-[4px]">
                <label className={tokens.labelClass}>Include tax in price</label>
                <select
                  className={effectiveInputClass}
                  value={data.taxInPrice ?? "no"}
                  onChange={(e) => set("taxInPrice", e.target.value)}
                >
                  <option value="no">No, I'll add tax on top of my prices</option>
                  <option value="yes">Yes, my prices include tax</option>
                </select>
              </div>

              <div className="flex flex-col gap-[4px]">
                <label className={tokens.labelClass}>Currency</label>
                <select
                  className={effectiveInputClass}
                  value={data.currency ?? "usd"}
                  onChange={(e) => set("currency", e.target.value)}
                >
                  <option value="usd">USD — US Dollar</option>
                  <option value="eur">EUR — Euro</option>
                  <option value="gbp">GBP — British Pound</option>
                  <option value="cad">CAD — Canadian Dollar</option>
                  <option value="aud">AUD — Australian Dollar</option>
                  <option value="jpy">JPY — Japanese Yen</option>
                </select>
              </div>

              <div className="flex flex-col gap-[8px]">
                <div className={toggleRow}>
                  <span>Suggest a preset amount</span>
                  <Toggle checked={Boolean(data.suggestPresetAmount)} onChange={(checked) => set("suggestPresetAmount", checked)} />
                </div>
                {data.suggestPresetAmount && (
                  <div className="relative">
                    <span className={`absolute left-[10px] top-1/2 -translate-y-1/2 text-[12px] ${isRefresh ? "text-[#68778B]" : "text-[#6C7688]"}`}>$</span>
                    <input
                      className={`${effectiveInputClass} pl-[22px]`}
                      placeholder="e.g. 25.00"
                      value={data.suggestedAmount ?? ""}
                      onChange={(e) => set("suggestedAmount", e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-[8px]">
                <div className={toggleRow}>
                  <span>Set limits</span>
                  <Toggle checked={Boolean(data.setLimits)} onChange={(checked) => set("setLimits", checked)} />
                </div>
                {data.setLimits && (
                  <div className="flex items-center gap-[6px]">
                    <span className={`text-[12px] ${isRefresh ? "text-[#68778B]" : "text-[#6C7688]"}`}>Between</span>
                    <div className="relative">
                      <span className={`absolute left-[8px] top-1/2 -translate-y-1/2 text-[12px] ${isRefresh ? "text-[#68778B]" : "text-[#6C7688]"}`}>$</span>
                      <input
                        className={`h-[28px] w-[72px] rounded-[6px] border ${isRefresh ? "border-[#D5DEE7]" : "border-[#D8DEE4]"} bg-white pl-[20px] pr-[8px] text-[12px] font-[500] text-[#1A2C44] outline-none focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7]`}
                        placeholder="0.50"
                        value={data.limitMin ?? ""}
                        onChange={(e) => set("limitMin", e.target.value)}
                      />
                    </div>
                    <span className={`text-[12px] ${isRefresh ? "text-[#68778B]" : "text-[#6C7688]"}`}>and</span>
                    <div className="relative">
                      <span className={`absolute left-[8px] top-1/2 -translate-y-1/2 text-[12px] ${isRefresh ? "text-[#68778B]" : "text-[#6C7688]"}`}>$</span>
                      <input
                        className={`h-[28px] w-[72px] rounded-[6px] border ${isRefresh ? "border-[#D5DEE7]" : "border-[#D8DEE4]"} bg-white pl-[20px] pr-[8px] text-[12px] font-[500] text-[#1A2C44] outline-none focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7]`}
                        placeholder="999.99"
                        value={data.limitMax ?? ""}
                        onChange={(e) => set("limitMax", e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced options */}
              <div className="flex flex-col">
                <button
                  type="button"
                  className={`flex w-full cursor-pointer items-center justify-between rounded-[8px] px-4 py-[8px] text-left transition-colors duration-150 ${advancedOpen ? (isRefresh ? "bg-[#F6F9FC]" : "bg-[#F5F6F8]") : (isRefresh ? "hover:bg-[#F6F9FC]" : "hover:bg-[#F5F6F8]")}`}
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                >
                  <span className="text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#1A2C44]">
                    Advanced options
                  </span>
                  <ChevronIcon className={`transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
                </button>

                {advancedOpen && (
                  <div className="flex flex-col gap-[28px] pt-[8px]">
                    <div className={toggleRow}>
                      <span className="flex items-center gap-[6px]">Enable Managed Payments <span className="text-[#9CA3B0]">·</span> <a href="https://docs.stripe.com/payments/payment-links" target="_blank" rel="noreferrer" className="text-[#635BFF] hover:underline">Docs</a></span>
                      <Toggle checked={enableManagedPayments} onChange={(checked) => set("enableManagedPayments", checked)} />
                    </div>
                    <div className={toggleRow}>
                      <span>Collect tax automatically</span>
                      <Toggle checked={collectTax} onChange={(checked) => set("collectTax", checked)} />
                    </div>
                    <div className={childSettingGroupClass(collectCustomerNames)}>
                      <div className={toggleRow}>
                        <span>Collect customer names</span>
                        <Toggle checked={collectCustomerNames} onChange={(checked) => set("collectCustomerNames", checked)} />
                      </div>
                      {collectCustomerNames && (
                        <div className={childSettingBoxClass}>
                          <div className={`flex items-center gap-[6px] ${tokens.checkboxText}`}>
                            <Checkbox checked={customerNamesOptional} onChange={(checked) => set("customerNamesOptional", checked)} />
                            <span>Mark as optional</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={childSettingGroupClass(collectBusinessNames)}>
                      <div className={toggleRow}>
                        <span>Collect business names</span>
                        <Toggle checked={collectBusinessNames} onChange={(checked) => set("collectBusinessNames", checked)} />
                      </div>
                      {collectBusinessNames && (
                        <div className={childSettingBoxClass}>
                          <div className={`flex items-center gap-[6px] ${tokens.checkboxText}`}>
                            <Checkbox checked={businessNamesOptional} onChange={(checked) => set("businessNamesOptional", checked)} />
                            <span>Mark as optional</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={childSettingGroupClass(collectAddresses)}>
                      <div className={toggleRow}>
                        <span>Collect customer addresses</span>
                        <Toggle checked={collectAddresses} onChange={(checked) => set("collectAddresses", checked)} />
                      </div>
                      {collectAddresses && (
                        <div className={childSettingBoxClass}>
                          <SegmentedControl
                            value={addressType}
                            onChange={(v) => set("addressType", v)}
                            options={ADDRESS_OPTIONS}
                            contrast={segmentedContrast}
                          />
                        </div>
                      )}
                    </div>
                    <div className={toggleRow}>
                      <span>Require a phone number</span>
                      <Toggle checked={requirePhone} onChange={(checked) => set("requirePhone", checked)} />
                    </div>
                    <div className={childSettingGroupClass(includeFreeTrial)}>
                      <div className={toggleRow}>
                        <span>Include a free trial</span>
                        <Toggle checked={includeFreeTrial} onChange={(checked) => set("includeFreeTrial", checked)} />
                      </div>
                      {includeFreeTrial && (
                        <div className={childSettingStackClass}>
                          <div className="flex flex-col gap-[4px]">
                            <label className={tokens.labelClass}>Number of days</label>
                            <input
                              className={`h-[28px] w-full rounded-[6px] border ${isRefresh ? "border-[#D5DEE7]" : "border-[#D8DEE4]"} bg-white px-[8px] text-[12px] font-[500] text-[#1A2C44] outline-none focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7]`}
                              value={data.trialDays ?? "30"}
                              onChange={(e) => set("trialDays", e.target.value)}
                            />
                          </div>
                          <div className={`flex items-center gap-[6px] ${tokens.checkboxText}`}>
                            <Checkbox checked={trialWithoutPayment} onChange={(checked) => set("trialWithoutPayment", checked)} />
                            <span>No payment method required</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={childSettingGroupClass(limitPayments)}>
                      <div className={toggleRow}>
                        <span>Limit the number of payments</span>
                        <Toggle checked={limitPayments} onChange={(checked) => set("limitPayments", checked)} />
                      </div>
                      {limitPayments && (
                        <div className={childSettingBoxClass}>
                          <div className="flex flex-col gap-[4px]">
                            <label className={tokens.labelClass}>Total payments</label>
                            <input
                              className={effectiveInputClass}
                              placeholder="e.g. 100"
                              value={data.maxPayments ?? ""}
                              onChange={(e) => set("maxPayments", e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={childSettingGroupClass(addCustomFields)}>
                      <div className={toggleRow}>
                        <span>Add custom fields</span>
                        <Toggle checked={addCustomFields} onChange={(checked) => set("addCustomFields", checked)} />
                      </div>
                      {addCustomFields && (
                        <CustomFieldsSection data={data} onChange={onChange} isRefresh={isRefresh} />
                      )}
                    </div>
                    <div className={toggleRow}>
                      <span>Allow promotion codes</span>
                      <Toggle checked={allowPromoCodes} onChange={(checked) => set("allowPromoCodes", checked)} />
                    </div>
                    <div className={childSettingGroupClass(allowTaxIds)}>
                      <div className={toggleRow}>
                        <span>Collect tax IDs</span>
                        <Toggle checked={allowTaxIds} onChange={(checked) => set("allowTaxIds", checked)} />
                      </div>
                      {allowTaxIds && (
                        <div className={`flex items-center gap-[6px] ${tokens.checkboxText}`}>
                          <Checkbox checked={requireTaxIdCollection} onChange={(checked) => set("requireTaxIdCollection", checked)} />
                          <span>Require tax ID in supported countries</span>
                        </div>
                      )}
                    </div>
                    <div className={toggleRow}>
                      <span>Save payment details</span>
                      <Toggle checked={savePaymentDetails} onChange={(checked) => set("savePaymentDetails", checked)} />
                    </div>
                    <div className={toggleRow}>
                      <span>Require terms of service</span>
                      <Toggle checked={termsOfService} onChange={(checked) => set("termsOfService", checked)} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Payment page */}
      {((!isFiltering && activePage === "payment") || hasPaymentMatches) && (
        <>
          {isFiltering && hasPaymentMatches && (
            <p className={tokens.sectionTitle}>Payment page</p>
          )}
          <div className={sectionDividers && !isFiltering ? `-mx-[16px] ${dividedListInset} flex flex-col divide-y-[0.5px] ${isRefresh ? "divide-[#EAF0F6]" : "divide-[#E3E8EF]"}` : "flex flex-col gap-[20px]"}>
            {(!isFiltering || matchedIds.has("enableManagedPayments")) && (
            <div className={simpleRowClass(enableManagedPayments)}>
              <span className="flex items-center gap-[6px]">{hl("Enable Managed Payments")} <span className="text-[#9CA3B0]">·</span> <a href="https://docs.stripe.com/payments/payment-links" target="_blank" rel="noreferrer" className="text-[#635BFF] hover:underline">Docs</a></span>
              <Toggle checked={enableManagedPayments} onChange={(checked) => set("enableManagedPayments", checked)} />
            </div>
            )}
            {(!isFiltering || matchedIds.has("collectTax")) && (
            <div className={simpleRowClass(collectTax)}>
              <span>{hl("Collect tax automatically")}</span>
              <Toggle checked={collectTax} onChange={(checked) => set("collectTax", checked)} />
            </div>
            )}
            {(!isFiltering || matchedIds.has("collectCustomerNames")) && (
            <div className={childSettingGroupClass(collectCustomerNames, true)}>
              <div className={toggleRow}>
                <span>{hl("Collect customer names")}</span>
                <Toggle checked={collectCustomerNames} onChange={(checked) => set("collectCustomerNames", checked)} />
              </div>
              {collectCustomerNames && (
                <div className={childSettingBoxClass}>
                  <div className={`flex items-center gap-[6px] ${tokens.checkboxText}`}>
                    <Checkbox checked={customerNamesOptional} onChange={(checked) => set("customerNamesOptional", checked)} />
                    <span>Mark as optional</span>
                  </div>
                </div>
              )}
            </div>
            )}
            {(!isFiltering || matchedIds.has("collectBusinessNames")) && (
            <div className={childSettingGroupClass(collectBusinessNames, true)}>
              <div className={toggleRow}>
                <span>{hl("Collect business names")}</span>
                <Toggle checked={collectBusinessNames} onChange={(checked) => set("collectBusinessNames", checked)} />
              </div>
              {collectBusinessNames && (
                <div className={childSettingBoxClass}>
                  <div className={`flex items-center gap-[6px] ${tokens.checkboxText}`}>
                    <Checkbox checked={businessNamesOptional} onChange={(checked) => set("businessNamesOptional", checked)} />
                    <span>Mark as optional</span>
                  </div>
                </div>
              )}
            </div>
            )}
            {(!isFiltering || matchedIds.has("collectAddresses")) && (
            <div className={childSettingGroupClass(collectAddresses, true)}>
              <div className={toggleRow}>
                <span>{hl("Collect customer addresses")}</span>
                <Toggle checked={collectAddresses} onChange={(checked) => set("collectAddresses", checked)} />
              </div>
              {collectAddresses && (
                <div className={childSettingBoxClass}>
                  <SegmentedControl
                    value={addressType}
                    onChange={(v) => set("addressType", v)}
                    options={ADDRESS_OPTIONS}
                    contrast={segmentedContrast}
                  />
                </div>
              )}
            </div>
            )}
            {(!isFiltering || matchedIds.has("requirePhone")) && (
            <div className={simpleRowClass(requirePhone)}>
              <span>{hl("Require a phone number")}</span>
              <Toggle checked={requirePhone} onChange={(checked) => set("requirePhone", checked)} />
            </div>
            )}
            {(!isFiltering || matchedIds.has("includeFreeTrial")) && (
            <div className={childSettingGroupClass(includeFreeTrial, true)}>
              <div className={toggleRow}>
                <span>{hl("Include a free trial")}</span>
                <Toggle checked={includeFreeTrial} onChange={(checked) => set("includeFreeTrial", checked)} />
              </div>
              {includeFreeTrial && (
                <div className={childSettingStackClass}>
                  <div className="flex flex-col gap-[4px]">
                    <label className={tokens.labelClass}>Number of days</label>
                    <input
                      className={`h-[30px] w-full rounded-[6px] border ${isRefresh ? "border-[#D5DEE7]" : "border-[#D8DEE4]"} bg-white px-[8px] text-[12px] font-[500] leading-[16px] ${isRefresh ? "text-[#142234]" : "text-[#353A44]"} outline-none transition-all ${isRefresh ? "hover:border-[#C1CCD7]" : "hover:border-[#B6C0CD]"} focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7]`}
                      value={data.trialDays ?? "30"}
                      onChange={(e) => set("trialDays", e.target.value)}
                    />
                  </div>
                  <div className={`flex items-center gap-[6px] ${tokens.checkboxText}`}>
                    <Checkbox checked={trialWithoutPayment} onChange={(checked) => set("trialWithoutPayment", checked)} />
                    <span>No payment method required</span>
                  </div>
                </div>
              )}
            </div>
            )}
            {(!isFiltering || matchedIds.has("limitPayments")) && (
            <div className={childSettingGroupClass(limitPayments, true)}>
              <div className={toggleRow}>
                <span>{hl("Limit the number of payments")}</span>
                <Toggle checked={limitPayments} onChange={(checked) => set("limitPayments", checked)} />
              </div>
              {limitPayments && (
                <div className={childSettingBoxClass}>
                  <div className="flex flex-col gap-[4px]">
                    <label className={tokens.labelClass}>Total payments</label>
                    <input
                      className={`h-[30px] w-full rounded-[6px] border ${isRefresh ? "border-[#D5DEE7]" : "border-[#D8DEE4]"} bg-white px-[8px] text-[12px] font-[500] leading-[16px] ${isRefresh ? "text-[#142234]" : "text-[#353A44]"} ${isRefresh ? "placeholder:text-[#68778B]" : "placeholder:text-[#6C7688]"} outline-none transition-all ${isRefresh ? "hover:border-[#C1CCD7]" : "hover:border-[#B6C0CD]"} focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7]`}
                      placeholder="e.g. 100"
                      value={data.maxPayments ?? ""}
                      onChange={(e) => set("maxPayments", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            )}
            {(!isFiltering || matchedIds.has("addCustomFields")) && (
            <div className={childSettingGroupClass(addCustomFields, true)}>
              <div className={toggleRow}>
                <span>{hl("Add custom fields")}</span>
                <Toggle checked={addCustomFields} onChange={(checked) => set("addCustomFields", checked)} />
              </div>
              {addCustomFields && (
                <div className={childSettingOverflowClass}>
                  <CustomFieldsSection data={data} onChange={onChange} isRefresh={isRefresh} />
                </div>
              )}
            </div>
            )}
            {(!isFiltering || matchedIds.has("allowPromoCodes")) && (
            <div className={simpleRowClass(allowPromoCodes)}>
              <span>{hl("Allow promotion codes")}</span>
              <Toggle checked={allowPromoCodes} onChange={(checked) => set("allowPromoCodes", checked)} />
            </div>
            )}
            {(!isFiltering || matchedIds.has("allowTaxIds")) && (
            <div className={childSettingGroupClass(allowTaxIds, true)}>
              <div className={toggleRow}>
                <span>{hl("Collect tax IDs")}</span>
                <Toggle checked={allowTaxIds} onChange={(checked) => set("allowTaxIds", checked)} />
              </div>
              {allowTaxIds && (
                <div className={childSettingBoxClass}>
                  <div className={`flex items-center gap-[6px] whitespace-nowrap ${tokens.checkboxText}`}>
                    <Checkbox checked={requireTaxIdCollection} onChange={(checked) => set("requireTaxIdCollection", checked)} />
                    <span>Require tax ID in supported countries</span>
                  </div>
                </div>
              )}
            </div>
            )}
            {(!isFiltering || matchedIds.has("savePaymentDetails")) && (
            <div className={simpleRowClass(savePaymentDetails)}>
              <span>{hl("Save payment details")}</span>
              <Toggle checked={savePaymentDetails} onChange={(checked) => set("savePaymentDetails", checked)} />
            </div>
            )}
            {(!isFiltering || matchedIds.has("termsOfService")) && (
            <div className={simpleRowClass(termsOfService)}>
              <span>{hl("Require terms of service")}</span>
              <Toggle checked={termsOfService} onChange={(checked) => set("termsOfService", checked)} />
            </div>
            )}
          </div>
        </>
      )}

      {/* After payment */}
      {((!isFiltering && activePage === "after") || hasAfterMatches) && (
        <>
          {isFiltering && hasAfterMatches && (
            <p className={`${tokens.sectionTitle} ${hasPaymentMatches ? "pt-[8px]" : ""}`}>After payment</p>
          )}
          <div className={sectionDividers && !isFiltering ? `-mx-[16px] ${dividedListInset} flex flex-col divide-y-[0.5px] ${isRefresh ? "divide-[#EAF0F6]" : "divide-[#E3E8EF]"}` : "flex flex-col gap-[20px]"}>
            {(!isFiltering || matchedIds.has("confirmationPage") || matchedIds.has("replaceWithCustomMessage")) && (
            <>
              <div className={simpleRowClass(confirmationPage !== "Don't show confirmation page")}>
                <span>{hl("Show confirmation page")}</span>
                <Toggle checked={confirmationPage !== "Don't show confirmation page"} onChange={(checked) => set("confirmationPage", checked ? "Show confirmation page" : "Don't show confirmation page")} />
              </div>
              {confirmationPage === "Show confirmation page" && (
                <div className={sectionDividers && !isFiltering ? "flex flex-col gap-[6px] px-[16px] py-[12px]" : "flex flex-col gap-[6px]"}>
                  <div className="flex flex-col gap-[2px]">
                    <div className={toggleRow}>
                      <span>{hl("Custom confirmation message")}</span>
                      <Toggle checked={replaceWithCustomMessage} onChange={(checked) => set("replaceWithCustomMessage", checked)} />
                    </div>
                    <p className={`text-[11px] font-[400] leading-[14px] ${isRefresh ? "text-[#526378]" : "text-[#6C7688]"}`}>
                      Custom messages won&apos;t be auto-translated.
                    </p>
                  </div>
                  {replaceWithCustomMessage && (
                    <textarea
                      className={effectiveTextareaClass}
                      placeholder="Include any details you see fit, such as delivery information."
                      value={data.customMessage ?? ""}
                      onChange={(e) => set("customMessage", e.target.value)}
                    />
                  )}
                </div>
              )}
              {confirmationPage === "Don't show confirmation page" && (
                <div className={sectionDividers && !isFiltering ? "flex flex-col gap-[4px] px-[16px] py-[12px]" : "flex flex-col gap-[4px]"}>
                  <label className={tokens.labelClass}>Redirect URL</label>
                  <input
                    className={effectiveInputClass}
                    placeholder="e.g. https://example.com/thank-you"
                    value={data.redirectUrl ?? ""}
                    onChange={(e) => set("redirectUrl", e.target.value)}
                  />
                </div>
              )}
            </>
            )}
            {(!isFiltering || matchedIds.has("splitPayment")) && (
            <div className={simpleRowClass(splitPayment)}>
              <span>{hl("Split with connected account")}</span>
              <Toggle checked={splitPayment} onChange={(checked) => set("splitPayment", checked)} />
            </div>
            )}
            {(!isFiltering || matchedIds.has("createInvoicePdf")) && (
            <div className={simpleRowClass(createInvoicePdf)}>
              <span>{hl("Create an invoice PDF")}</span>
              <Toggle checked={createInvoicePdf} onChange={(checked) => set("createInvoicePdf", checked)} />
            </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
