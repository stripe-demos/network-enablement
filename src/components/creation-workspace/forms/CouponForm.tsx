'use client'

import { useState, useRef, useEffect, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { getFormTokens } from "./shared/formTokens"
import { Checkbox } from "./shared/Checkbox"
import { useInputFill } from "@/components/creation-workspace/inputFill"
import { CustomSelect } from "./shared/CustomSelect"
import { EntityDropdown } from "./EntityDropdown"
import { EXISTING_PRODUCTS, EXISTING_CUSTOMERS } from "./shared/mockEntities"
import { SegmentedControl } from "@/components/SegmentedControl"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { useChildSettingStyle, getChildSettingContentClass, getChildSettingFillClass } from "@/components/creation-workspace/childSettingStyle"
import { OptionalGroups, type OptionalGroup } from "./shared/ComposeGroup"

type CouponFormProps = {
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
  errorFields?: Set<string>
  onAddObject?: (kind: string, existingId?: string) => void
}

type CouponCode = {
  code: string
  firstTimeOnly: boolean
  limitToCustomer: boolean
  customerId: string
  limitRedemptionCount: boolean
  maxRedemptions: string
  hasExpiration: boolean
  expiresAtDate: string
  expiresAtTime: string
  requireMinOrder: boolean
  minOrderCurrency: string
  minOrderAmount: string
}

type ProductScope = {
  productId: string
}

type AdditionalCurrencyAmount = {
  currency: string
  amount: string
}

const DISCOUNT_TYPES = ["Percentage off", "Fixed amount off"] as const

function defaultCode(): CouponCode {
  return {
    code: '',
    firstTimeOnly: false,
    limitToCustomer: false,
    customerId: '',
    limitRedemptionCount: false,
    maxRedemptions: '',
    hasExpiration: false,
    expiresAtDate: '',
    expiresAtTime: '',
    requireMinOrder: false,
    minOrderCurrency: 'USD',
    minOrderAmount: '',
  }
}

function defaultRedeemByDate() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function timezoneLabel() {
  const offsetMinutes = -new Date().getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? "+" : "-"
  const absoluteMinutes = Math.abs(offsetMinutes)
  const hours = Math.floor(absoluteMinutes / 60)
  const minutes = absoluteMinutes % 60
  return minutes === 0 ? `GMT${sign}${hours}` : `GMT${sign}${hours}:${String(minutes).padStart(2, "0")}`
}

function defaultAdditionalCurrency(existingCurrencies: string[]) {
  return ["CAD", "EUR", "GBP", "USD"].find((currency) => !existingCurrencies.includes(currency)) ?? "CAD"
}

const refreshSelectButtonClass =
  "flex h-[32px] w-full items-center justify-between rounded-[6px] border border-[#D5DEE7] bg-white px-[10px] text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#142234] outline-none transition-all hover:border-[#C1CCD7] focus:border-[#A0C8F0] focus:shadow-[0_0_0_4px_rgba(8,142,249,0.2)]"
const refreshComboSelectButtonClass =
  "flex h-[32px] w-full items-center justify-between rounded-[6px] rounded-l-none border border-l-0 border-[#D5DEE7] bg-white px-[10px] text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#142234] outline-none transition-all hover:border-[#C1CCD7] focus:border-[#A0C8F0]"
const refreshSelectOptionClass = "text-[13px] font-[575] leading-[20px] tracking-[-0.065px]"
const refreshActionClass = "flex items-center gap-[4px] self-start rounded-[6px] px-[2px] py-[2px] text-[13px] font-[575] leading-[20px] tracking-[-0.065px] text-[#2C219E] transition-colors hover:text-[#142234]"
const refreshPillActionClass = "flex items-center gap-[4px] self-start rounded-[6px] px-[8px] py-[4px] text-[13px] font-[575] leading-[20px] tracking-[-0.065px] text-[#2C219E] transition-colors hover:bg-[#F1F6FB]"
const refreshSmallMutedClass = "text-[11px] font-[400] leading-[16px] tracking-[-0.055px] text-[#526378]"

const linkClass = "text-[#533AFD] transition-colors hover:text-[#4730E0]"
const selectButtonClass =
  "flex h-[30px] w-full items-center justify-between rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#353A44] outline-none transition-all hover:border-[#B6C0CD] focus:border-[#088EF9] focus:shadow-[0_0_0_4px_rgba(8,142,249,0.36)]"
const comboSelectButtonClass =
  "flex h-[30px] w-full items-center justify-between rounded-[6px] rounded-l-none border border-l-0 border-[#D8DEE4] bg-white px-[8px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#353A44] outline-none transition-all hover:border-[#B6C0CD] focus:border-[#088EF9] focus:shadow-[0_0_0_4px_rgba(8,142,249,0.36)]"
const selectOptionClass = "text-[14px] leading-[20px] tracking-[-0.15px]"

function Expandable({
  show,
  children,
}: {
  show: boolean
  children: ReactNode
}) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
          className="overflow-visible"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function SailDropdownIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="12" viewBox="0 0 9 12" fill="none" className="h-[12px] w-[8.6px] shrink-0">
      <path fillRule="evenodd" clipRule="evenodd" d="M0.226171 7.24258C0.534026 6.92566 1.0405 6.91831 1.35742 7.22617L4.30003 10.0846L7.24258 7.22622C7.55949 6.91836 8.06597 6.92571 8.37383 7.24263C8.68169 7.55954 8.67434 8.06602 8.35742 8.37388L4.85745 11.7738C4.70224 11.9246 4.50113 12 4.30003 12C4.09893 12 3.89783 11.9246 3.74261 11.7738L0.242579 8.37383C-0.0743389 8.06597 -0.081685 7.5595 0.226171 7.24258Z" fill="#474E5A" />
      <path fillRule="evenodd" clipRule="evenodd" d="M3.74261 0.22617C3.89783 0.0753911 4.09893 1.15422e-06 4.30003 0C4.50113 -1.15424e-06 4.70224 0.0753906 4.85746 0.226175L8.35743 3.62613C8.67434 3.93398 8.68168 4.44046 8.37383 4.75738C8.06597 5.07429 7.55949 5.08163 7.24257 4.77378L4.30003 1.91532L1.35742 4.77378C1.0405 5.08164 0.534026 5.07429 0.226171 4.75737C-0.081685 4.44046 -0.0743389 3.93398 0.242579 3.62612L3.74261 0.22617Z" fill="#474E5A" />
    </svg>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
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
    <button type="button" className={`group relative shrink-0 rounded-full border transition-colors ${t.trackClass} ${checked ? t.onClass : t.offClass}`} onClick={() => onChange(!checked)} role="switch" aria-checked={checked}>
      <span className={`absolute rounded-full bg-white shadow-[0_1px_1px_rgba(33,37,44,0.16)] transition-all ${t.knobClass} ${checked ? `${t.knobOnPos} ${t.knobOnBorder}` : `${t.knobOffPos} ${t.knobOffBorder}`}`} />
    </button>
  )
}

function OverflowMenu({
  label,
  destructiveLabel,
  onDestructive,
  isSail = false,
  isRefresh = false,
}: {
  label: string
  destructiveLabel: string
  onDestructive: () => void
  isSail?: boolean
  isRefresh?: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [menuOpen])

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        aria-label={label}
        className={`flex h-[30px] w-[30px] items-center justify-center rounded-[6px] transition-colors ${isRefresh ? "text-[#2B3A4E]" : "text-[#3C4F69]"} ${menuOpen ? (isRefresh ? "bg-[#F1F6FB]" : "bg-[#ECEFF3]") : (isRefresh ? "hover:bg-[#F1F6FB]" : "hover:bg-[#ECEFF3]")}`}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="3" cy="7" r="1.1" fill="currentColor" />
          <circle cx="7" cy="7" r="1.1" fill="currentColor" />
          <circle cx="11" cy="7" r="1.1" fill="currentColor" />
        </svg>
      </button>
      {menuOpen && (
        <div className={`absolute right-0 top-[34px] z-50 w-[128px] rounded-[8px] border ${isRefresh ? "border-[#D8E1EA]" : "border-[#D8DEE4]"} bg-white py-[4px] shadow-[0_12px_32px_rgba(28,32,40,0.12)]`}>
          <button
            type="button"
            className={`flex w-full items-center px-[10px] py-[6px] text-left text-[#DF1B41] transition-colors ${isRefresh ? "hover:bg-[#F1F6FB]" : "hover:bg-[#F5F6F8]"} ${
              isSail
                ? "text-[14px] font-[400] leading-[20px] tracking-[-0.15px]"
                : isRefresh
                  ? "text-[13px] font-[400] leading-[20px] tracking-[-0.065px]"
                : "text-[12px] font-[500]"
            }`}
            onClick={() => {
              onDestructive()
              setMenuOpen(false)
            }}
          >
            {destructiveLabel}
          </button>
        </div>
      )}
    </div>
  )
}


function CouponCodeCard({
  codeData,
  onUpdate,
  onRemove,
  onAddObject,
  isSail,
  isRefresh,
}: {
  codeData: CouponCode
  onUpdate: (key: string, value: string | boolean) => void
  onRemove: () => void
  onAddObject?: (kind: string) => void
  isSail: boolean
  isRefresh: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [menuOpen])

  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  const activeLabelClass = tokens.labelClass
  const activeInputClass = tokens.inputClass
  const activeCheckboxLabelClass = tokens.checkboxText
  const activeSmallMutedClass = isSail ? "text-[14px] font-[400] leading-[20px] tracking-[-0.15px]" : isRefresh ? refreshSmallMutedClass : "text-[12px]"
  const activeSelectButtonClass = isSail ? selectButtonClass : isRefresh ? refreshSelectButtonClass : undefined
  const activeSelectOptionClass = isSail ? selectOptionClass : isRefresh ? refreshSelectOptionClass : undefined
  const entityDropdownProps = (isSail || isRefresh) ? {
    inputClassName: activeInputClass,
    errorInputClassName: tokens.errorInputClass,
    chevronIcon: <SailDropdownIcon />,
    optionNameClassName: isSail ? "text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#353A44]" : "text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#142234]",
    optionDetailClassName: isSail ? "text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#6C7688]" : "text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#3F5064]",
    addNewClassName: isSail ? "flex w-full items-center gap-[6px] px-[10px] py-[8px] text-left text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#533AFD] transition-colors hover:bg-[#F5F6F8]" : "flex w-full items-center gap-[6px] px-[10px] py-[8px] text-left text-[13px] font-[575] leading-[20px] tracking-[-0.065px] text-[#2C219E] transition-colors hover:bg-[#F1F6FB]",
    noResultsClassName: isSail ? "px-[10px] py-[8px] text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#9CA3B0]" : "px-[10px] py-[8px] text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#808FA1]",
  } : {}
  const activeNestedSurfaceClass = isRefresh ? "rounded-[6px] bg-[#F6F9FC] px-[12px] pt-[10px] pb-[6px]" : "rounded-[6px] bg-[#F6F8FA] px-[12px] pt-[10px] pb-[6px]"

  return (
    <div className={`${isSail ? "rounded-[8px]" : "rounded-[10px]"} border ${isRefresh ? "border-[#D8E1EA]" : "border-[#E3E8EF]"} bg-white overflow-hidden`}>
      <div className={`flex flex-col ${isSail ? "gap-[16px] px-[16px] py-[16px]" : "gap-[12px] px-[12px] py-[12px]"}`}>
        <div className="flex flex-col gap-[4px]">
          <div className="flex items-center justify-between">
            <label className={activeLabelClass}>Code</label>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className={`flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[6px] border ${isRefresh ? "border-[#D8E1EA]" : "border-[#D4DEE9]"} bg-white transition-colors ${menuOpen ? (isRefresh ? "bg-[#F1F6FB]" : "bg-[#F5F6F8]") : (isRefresh ? "hover:bg-[#F1F6FB]" : "hover:bg-[#F5F6F8]")}`}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="2.5" cy="6" r="1" fill="#3C4F69" />
                  <circle cx="6" cy="6" r="1" fill="#3C4F69" />
                  <circle cx="9.5" cy="6" r="1" fill="#3C4F69" />
                </svg>
              </button>
              {menuOpen && (
                <div className={`absolute right-0 top-[28px] z-50 w-[120px] rounded-[8px] border ${isRefresh ? "border-[#D8E1EA]" : "border-[#D8DEE4]"} bg-white py-[4px] shadow-[0_12px_32px_rgba(28,32,40,0.12)]`}>
                  <button
                    type="button"
                    className={`flex w-full items-center px-[10px] py-[6px] text-left text-[#DF1B41] transition-colors ${isRefresh ? "hover:bg-[#F1F6FB]" : "hover:bg-[#F5F6F8]"} ${
                      isSail
                        ? "text-[14px] font-[400] leading-[20px] tracking-[-0.15px]"
                        : isRefresh
                          ? "text-[13px] font-[400] leading-[20px] tracking-[-0.065px]"
                        : "text-[12px] font-[500]"
                    }`}
                    onClick={() => { onRemove(); setMenuOpen(false) }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
          <input
            className={`${activeInputClass} uppercase`}
            placeholder="FRIENDS20"
            value={codeData.code}
            onChange={(e) => onUpdate("code", e.target.value)}
          />
        </div>

        <div className="flex items-center gap-[8px]">
          <Checkbox checked={codeData.firstTimeOnly} onChange={(v) => onUpdate("firstTimeOnly", v)} />
          <span className={activeCheckboxLabelClass}>Eligible for first-time order only</span>
        </div>

        <div className="flex flex-col gap-[8px]">
          <div className="flex items-center gap-[8px]">
            <Checkbox checked={codeData.limitToCustomer} onChange={(v) => onUpdate("limitToCustomer", v)} />
            <span className={activeCheckboxLabelClass}>Limit to a specific customer</span>
          </div>
          <Expandable show={codeData.limitToCustomer}>
            <div className={activeNestedSurfaceClass}>
              <EntityDropdown
                label=""
                placeholder="Find or add a customer..."
                searchPlaceholder="Search customers..."
                items={EXISTING_CUSTOMERS}
                selectedId={codeData.customerId}
                onSelect={(id) => onUpdate("customerId", id)}
                addNewLabel="Add customer"
                onAddNew={() => onAddObject?.("customer")}
                {...entityDropdownProps}
              />
            </div>
          </Expandable>
        </div>

        <div className="flex flex-col gap-[8px]">
          <div className="flex items-center gap-[8px]">
            <Checkbox checked={codeData.limitRedemptionCount} onChange={(v) => onUpdate("limitRedemptionCount", v)} />
            <span className={activeCheckboxLabelClass}>Limit the number of times this code can be redeemed</span>
          </div>
          <Expandable show={codeData.limitRedemptionCount}>
            <div className={activeNestedSurfaceClass}>
              <div className="relative">
                <input
                  className={`${activeInputClass} pr-[42px]`}
                  placeholder="e.g. 5"
                  value={codeData.maxRedemptions}
                  onChange={(e) => onUpdate("maxRedemptions", e.target.value)}
                />
                <span className={`absolute right-[10px] top-1/2 -translate-y-1/2 ${activeSmallMutedClass}`}>time</span>
              </div>
            </div>
          </Expandable>
        </div>

        <div className="flex flex-col gap-[8px]">
          <div className="flex items-center gap-[8px]">
            <Checkbox checked={codeData.hasExpiration} onChange={(v) => onUpdate("hasExpiration", v)} />
            <span className={activeCheckboxLabelClass}>Add an expiration date</span>
          </div>
          <Expandable show={codeData.hasExpiration}>
            <div className={activeNestedSurfaceClass}>
              <div className="flex flex-col gap-[4px]">
                <span className={isSail ? "text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#596171]" : isRefresh ? refreshSmallMutedClass : "text-[12px] text-[#6C7688]"}>Expires at</span>
                <div className="flex flex-wrap items-center gap-[8px]">
                  <input
                    type="date"
                    className={`${activeInputClass} min-w-0 flex-1`}
                    value={codeData.expiresAtDate}
                    onChange={(e) => onUpdate("expiresAtDate", e.target.value)}
                  />
                  <input
                    type="time"
                    className={`${activeInputClass} min-w-0 flex-1`}
                    value={codeData.expiresAtTime}
                    onChange={(e) => onUpdate("expiresAtTime", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Expandable>
        </div>

        <div className="flex flex-col gap-[8px]">
          <div className="flex items-center gap-[8px]">
            <Checkbox checked={codeData.requireMinOrder} onChange={(v) => onUpdate("requireMinOrder", v)} />
            <span className={activeCheckboxLabelClass}>Require minimum order value</span>
          </div>
          <Expandable show={codeData.requireMinOrder}>
            <div className={activeNestedSurfaceClass}>
              <div className="flex items-center gap-[8px]">
                <CustomSelect
                  label=""
                  value={codeData.minOrderCurrency}
                  onChange={(v) => onUpdate("minOrderCurrency", v)}
                  options={[
                    { value: "USD", label: "USD" },
                    { value: "EUR", label: "EUR" },
                    { value: "GBP", label: "GBP" },
                    { value: "CAD", label: "CAD" },
                  ]}
                  buttonClassName={activeSelectButtonClass}
                  chevronIcon={(isSail || isRefresh) ? <SailDropdownIcon /> : undefined}
                  dropdownOptionClassName={activeSelectOptionClass}
                />
                <div className="relative flex-1">
                  <span className={`absolute left-[10px] top-1/2 -translate-y-1/2 ${activeSmallMutedClass}`}>$</span>
                  <input
                    className={`${activeInputClass} pl-[22px]`}
                    placeholder="0.00"
                    value={codeData.minOrderAmount}
                    onChange={(e) => onUpdate("minOrderAmount", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Expandable>
        </div>
      </div>
    </div>
  )
}


export function CouponForm({ data, onChange, errorFields, onAddObject }: CouponFormProps) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const { childSettingStyle } = useChildSettingStyle()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  const isSail = productFormStyle === "sail"
  const isRefresh = productFormStyle === "refresh"
  const activeLabelClass = tokens.labelClass
  const activeInputClass = tokens.inputClass
  const activeErrorInputClass = tokens.errorInputClass
  const activeHelperClass = tokens.helperClass
  const activeToggleRowClass = tokens.toggleRow
  const activeSmallMutedClass = isSail ? "text-[14px] font-[400] leading-[20px] tracking-[-0.15px]" : isRefresh ? refreshSmallMutedClass : "text-[12px]"
  const activeSelectButtonClass = isSail ? selectButtonClass : isRefresh ? refreshSelectButtonClass : undefined
  const activeComboSelectButtonClass = isSail ? comboSelectButtonClass : isRefresh ? refreshComboSelectButtonClass : undefined
  const activeSelectOptionClass = isSail ? selectOptionClass : isRefresh ? refreshSelectOptionClass : undefined
  const activeLinkClass = isRefresh ? "text-[#2C219E] transition-colors hover:text-[#142234]" : linkClass
  const activeActionClass = isSail ? "flex items-center gap-[4px] self-start rounded-[6px] px-[2px] py-[2px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#533AFD] transition-colors hover:text-[#4730E0]" : isRefresh ? refreshActionClass : "flex items-center gap-[4px] self-start rounded-[6px] px-[2px] py-[2px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#533AFD] transition-colors hover:text-[#4730E0]"
  const activePillActionClass = isSail ? "flex items-center gap-[4px] self-start rounded-[6px] px-[8px] py-[4px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#533AFD] transition-colors hover:bg-[#F7F5FD]" : isRefresh ? refreshPillActionClass : "flex items-center gap-[4px] self-start rounded-[6px] px-[8px] py-[4px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#533AFD] transition-colors hover:bg-[#F7F5FD]"
  // Inside an "optional fields" compose group, render the settings as the same white
  // full-bleed divided list the main forms use: cells go grey when their toggle is on.
  // Bleeds over the group's grey surface (-m cancels its padding) so the shared
  // ComposeGroup/Invoice are untouched.
  const composeListClass = `-mx-[16px] -my-[16px] flex flex-col divide-y-[0.5px] rounded-b-[8px] bg-white ${isRefresh ? "divide-[#EAF0F6]" : "divide-[#E3E8EF]"}`
  const activeToggleBlockGapClass = isSail ? "gap-[16px]" : isRefresh ? "gap-[12px]" : "gap-[10px]"
  const activeToggleBlockPaddingClass = isSail ? "px-[16px] py-[16px]" : isRefresh ? "px-[12px] py-[12px]" : "px-[12px] py-[10px]"
  const activeToggleBlockSurfaceClass = isRefresh ? "bg-[#F6F9FC]" : "bg-[#F6F8FA]"
  const childSettingBlockClass = (enabled: boolean) =>
    `flex flex-col px-[16px] py-[12px] ${activeToggleBlockGapClass} ${getChildSettingFillClass(childSettingStyle, enabled, { surface: activeToggleBlockSurfaceClass, padding: activeToggleBlockPaddingClass }, { divided: true })}`
  const childSettingContentClass = getChildSettingContentClass(childSettingStyle, {
    surface: activeToggleBlockSurfaceClass,
    padding: activeToggleBlockPaddingClass,
    isRefresh,
  })
  const entityDropdownProps = (isSail || isRefresh) ? {
    inputClassName: activeInputClass,
    errorInputClassName: activeErrorInputClass,
    chevronIcon: <SailDropdownIcon />,
    optionNameClassName: isSail ? "text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#353A44]" : "text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#142234]",
    optionDetailClassName: isSail ? "text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#6C7688]" : "text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#3F5064]",
    addNewClassName: isSail ? "flex w-full items-center gap-[6px] px-[10px] py-[8px] text-left text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#533AFD] transition-colors hover:bg-[#F5F6F8]" : "flex w-full items-center gap-[6px] px-[10px] py-[8px] text-left text-[13px] font-[575] leading-[20px] tracking-[-0.065px] text-[#2C219E] transition-colors hover:bg-[#F1F6FB]",
    noResultsClassName: isSail ? "px-[10px] py-[8px] text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#9CA3B0]" : "px-[10px] py-[8px] text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#808FA1]",
  } : {}
  const set = (key: string, value: string | boolean) => onChange({ [key]: value })
  const ic = (field: string) => errorFields?.has(field) ? activeErrorInputClass : activeInputClass
  const discountType = data.discountType ?? "Percentage off"
  const limitDateRange = Boolean(data.limitDateRange)
  const limitRedemptions = Boolean(data.limitRedemptions)
  const hasCouponCodes = Boolean(data.hasCouponCodes)
  const appliesToProducts = Boolean(data.appliesToProducts)
  const productScopes: ProductScope[] = data.productScopes ?? [{ productId: data.productScope ?? "" }]
  const additionalCurrencies: AdditionalCurrencyAmount[] = data.additionalCurrencies ?? []
  const currentTimezoneLabel = timezoneLabel()
  const currencyOptions = [
    { value: "USD", label: "USD" },
    { value: "CAD", label: "CAD" },
    { value: "EUR", label: "EUR" },
    { value: "GBP", label: "GBP" },
  ]

  const updateProductScopes = (nextScopes: ProductScope[]) => {
    const firstProduct = EXISTING_PRODUCTS.find((product) => product.id === nextScopes[0]?.productId)
    onChange({
      productScopes: nextScopes,
      productScope: nextScopes[0]?.productId ?? "",
      productName: firstProduct?.name ?? "",
    })
  }

  const updateAdditionalCurrencies = (nextCurrencies: AdditionalCurrencyAmount[]) => {
    onChange({ additionalCurrencies: nextCurrencies })
  }

  // ── Optional groups (Duration, Applicable products, Redemption limits, Promotion codes) ──
  // Essentials (Name, ID, Type, Discount) stay inline above; everything else discloses through
  // the shared <OptionalGroups>. One-line summaries read as done-vs-default.
  const durationValue = data.duration ?? "once"
  const durationSummary =
    durationValue === "forever"
      ? "Forever"
      : durationValue === "repeating"
        ? ((data.durationMonths ?? "").toString().trim() ? `${(data.durationMonths).toString().trim()} months` : "Multiple months")
        : "Once"

  const scopeNames = appliesToProducts
    ? productScopes
        .map((s) => EXISTING_PRODUCTS.find((p) => p.id === s.productId)?.name)
        .filter((n): n is string => Boolean(n))
    : []
  const productsSummary = !appliesToProducts
    ? "All products"
    : scopeNames.length === 0
      ? "Select products"
      : scopeNames.length === 1
        ? scopeNames[0]
        : `${scopeNames.length} products`

  const limitParts: string[] = []
  if (limitDateRange) limitParts.push((data.redeemByDate ?? "").toString().trim() ? `Until ${data.redeemByDate}` : "Date range")
  if (limitRedemptions) limitParts.push((data.maxRedemptions ?? "").toString().trim() ? `Max ${data.maxRedemptions}` : "Capped")

  const codesArr: CouponCode[] = data.codes ?? []
  const firstCode = (codesArr[0]?.code ?? "").toString().trim()
  const codesSummary = !hasCouponCodes
    ? "Applied automatically"
    : codesArr.length > 1
      ? `${codesArr.length} codes`
      : firstCode
        ? firstCode.toUpperCase()
        : "No code yet"

  const durationLimitsSummary = [durationSummary, ...limitParts].join(" · ")
  const productsCodesSummary = hasCouponCodes ? `${productsSummary} · ${codesSummary}` : productsSummary

  // Two groups, each revealing ≥2 settings: "Duration and limits" (how long / how often the
  // discount can be redeemed) and "Products and codes" (what it applies to / how it's shared).
  const couponGroups: OptionalGroup[] = [
    {
      id: "duration-limits",
      title: "Duration and limits",
      summary: durationLimitsSummary,
      render: () => (
        <div className={composeListClass}>
          <div className="flex flex-col gap-[8px] px-[16px] py-[12px]">
            <CustomSelect
              label="Duration"
              docsUrl="https://docs.stripe.com/billing/subscriptions/coupons"
              value={data.duration ?? "once"}
              onChange={(v) => set("duration", v)}
              options={[
                { value: "once", label: "Once" },
                { value: "repeating", label: "Multiple months" },
                { value: "forever", label: "Forever" },
              ]}
              buttonClassName={activeSelectButtonClass}
              chevronIcon={(isSail || isRefresh) ? <SailDropdownIcon /> : undefined}
              dropdownOptionClassName={activeSelectOptionClass}
              labelClassName={(isSail || isRefresh) ? activeLabelClass : undefined}
            />
            <Expandable show={data.duration === "repeating"}>
              <div className="flex flex-col gap-[4px]">
                <label className={activeLabelClass}>Number of months</label>
                <input
                  className={activeInputClass}
                  placeholder="e.g. 3"
                  value={data.durationMonths ?? ""}
                  onChange={(e) => set("durationMonths", e.target.value)}
                />
              </div>
            </Expandable>
          </div>
          <div className={childSettingBlockClass(limitDateRange)}>
            <div className={activeToggleRowClass}>
              <span>Limit redemption date range</span>
              <Toggle
                checked={limitDateRange}
                onChange={(checked) => {
                  if (checked) {
                    onChange({
                      limitDateRange: true,
                      redeemByDate: data.redeemByDate ?? defaultRedeemByDate(),
                      redeemByTime: data.redeemByTime ?? "23:59",
                    })
                  } else {
                    set("limitDateRange", false)
                  }
                }}
              />
            </div>
            <Expandable show={limitDateRange}>
              <div className={`${childSettingContentClass} flex flex-col gap-[4px]`}>
                <span className={isSail ? "text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#596171]" : isRefresh ? refreshSmallMutedClass : "text-[12px] text-[#6C7688]"}>Redeem by</span>
                <div className="flex flex-wrap items-center gap-[8px]">
                  <input
                    type="date"
                    className={`${activeInputClass} min-w-0 flex-1`}
                    value={data.redeemByDate ?? ""}
                    onChange={(e) => set("redeemByDate", e.target.value)}
                  />
                  <input
                    type="time"
                    className={`${activeInputClass} min-w-0 flex-1`}
                    value={data.redeemByTime ?? ""}
                    onChange={(e) => set("redeemByTime", e.target.value)}
                  />
                  <span className={`shrink-0 ${isSail ? "text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#596171]" : isRefresh ? refreshSmallMutedClass : "text-[12px] font-[400] text-[#596171]"}`}>{currentTimezoneLabel}</span>
                </div>
              </div>
            </Expandable>
          </div>
          <div className={childSettingBlockClass(limitRedemptions)}>
            <div className={activeToggleRowClass}>
              <span>Limit total redemptions</span>
              <Toggle checked={limitRedemptions} onChange={(checked) => set("limitRedemptions", checked)} />
            </div>
            <Expandable show={limitRedemptions}>
              <div className={`${childSettingContentClass} flex flex-col gap-[4px]`}>
                <div className="relative">
                  <input
                    className={`${activeInputClass} pr-[42px]`}
                    placeholder="e.g. 100"
                    value={data.maxRedemptions ?? ""}
                    onChange={(e) => set("maxRedemptions", e.target.value)}
                  />
                  <span className={`absolute right-[10px] top-1/2 -translate-y-1/2 ${activeSmallMutedClass}`}>time</span>
                </div>
                <p className={activeHelperClass}>
                  This limit applies across customers so it won&apos;t prevent a single customer from redeeming multiple times.
                </p>
              </div>
            </Expandable>
          </div>
        </div>
      ),
    },
    {
      id: "products-codes",
      title: "Products and codes",
      summary: productsCodesSummary,
      render: () => (
        <div className={composeListClass}>
          <div className={childSettingBlockClass(appliesToProducts)}>
            <div className={activeToggleRowClass}>
              <span>Apply to specific products</span>
              <Toggle checked={appliesToProducts} onChange={(checked) => set("appliesToProducts", checked)} />
            </div>
            <Expandable show={appliesToProducts}>
              <div className={`${childSettingContentClass} flex flex-col ${isSail ? "gap-[16px]" : "gap-[10px]"}`}>
                {productScopes.map((scope, idx) => (
                  <div className="flex items-center gap-[8px]" key={idx}>
                    <div className="min-w-0 flex-1">
                      <EntityDropdown
                        label=""
                        placeholder="Find a product..."
                        searchPlaceholder="Search products..."
                        items={EXISTING_PRODUCTS}
                        selectedId={scope.productId}
                        onSelect={(id) => {
                          const next = [...productScopes]
                          next[idx] = { productId: id }
                          updateProductScopes(next)
                        }}
                        addNewLabel="Add product"
                        onAddNew={() => onAddObject?.("product")}
                        {...entityDropdownProps}
                      />
                    </div>
                    <OverflowMenu
                      label="Product options"
                      destructiveLabel="Remove"
                      isSail={isSail}
                      isRefresh={isRefresh}
                      onDestructive={() => {
                        const next = productScopes.filter((_, i) => i !== idx)
                        updateProductScopes(next.length ? next : [{ productId: "" }])
                      }}
                    />
                  </div>
                ))}
                <div className="border-t border-[#E9EDF3]" />
                <button
                  type="button"
                  className={activeActionClass}
                  onClick={() => updateProductScopes([...productScopes, { productId: "" }])}
                >
                  Add another product
                </button>
              </div>
            </Expandable>
          </div>
          <div className={childSettingBlockClass(hasCouponCodes)}>
            <div className={activeToggleRowClass}>
              <span>Use customer-facing coupon codes</span>
              <Toggle
                checked={hasCouponCodes}
                onChange={(checked) => {
                  if (checked && !data.codes?.length) {
                    onChange({ hasCouponCodes: true, codes: [defaultCode()] })
                  } else {
                    set("hasCouponCodes", checked)
                  }
                }}
              />
            </div>
            <Expandable show={hasCouponCodes}>
              <div className={`${childSettingContentClass} flex flex-col ${isSail ? "gap-[16px]" : "gap-[12px]"}`}>
                {(data.codes ?? [defaultCode()]).map((code: CouponCode, idx: number) => (
                  <CouponCodeCard
                    key={idx}
                    codeData={code}
                    onUpdate={(key, value) => {
                      const updated = [...(data.codes ?? [defaultCode()])]
                      updated[idx] = { ...updated[idx], [key]: value }
                      onChange({ codes: updated })
                    }}
                    onRemove={() => {
                      const currentCodes = data.codes ?? [defaultCode()]
                      const updated = currentCodes.filter((_: any, i: number) => i !== idx)
                      if (updated.length === 0) {
                        onChange({ hasCouponCodes: false, codes: [] })
                      } else {
                        onChange({ codes: updated })
                      }
                    }}
                    onAddObject={onAddObject}
                    isSail={isSail}
                    isRefresh={isRefresh}
                  />
                ))}
                <button
                  type="button"
                  className={activePillActionClass}
                  onClick={() => onChange({ codes: [...(data.codes ?? [defaultCode()]), defaultCode()] })}
                >
                  <svg width={isSail ? "14" : "12"} height={isSail ? "14" : "12"} viewBox={isSail ? "0 0 14 14" : "0 0 12 12"} fill="none" aria-hidden="true"><path d={isSail ? "M7 3V11M3 7H11" : "M6 2V10M2 6H10"} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                  Add another code
                </button>
              </div>
            </Expandable>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className={`flex flex-col ${isSail ? "gap-[16px]" : "gap-[16px]"}`}>
      <div className="flex flex-col gap-[8px]">
        <div className="flex flex-col gap-[4px]">
          <label className={activeLabelClass}>Name</label>
          <input
            className={ic("name")}
            placeholder="e.g. First purchase discount"
            value={data.name ?? ""}
            onChange={(e) => set("name", e.target.value)}
          />
          {errorFields?.has("name") && (
            <p className="text-[11px] text-[#DF1B41]">Enter a coupon name</p>
          )}
        </div>
        <p className={activeHelperClass}>This will appear on customers&apos; receipts and invoices.</p>
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={activeLabelClass}>
          ID
          {" · "}
          <a className={activeLinkClass} href="https://docs.stripe.com/api/coupons" target="_blank" rel="noreferrer">Docs</a>
        </label>
        <input
          className={activeInputClass}
          placeholder="Leave blank to auto-generate"
          value={data.couponId ?? ""}
          onChange={(e) => set("couponId", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-[8px]">
        <label className={activeLabelClass}>Type</label>
        <SegmentedControl
          value={discountType}
          onChange={(v) => set("discountType", v)}
          options={DISCOUNT_TYPES}
        />
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={activeLabelClass}>
          {discountType === "Percentage off" ? "Percentage discount" : "Discount amount"}
        </label>
        {discountType === "Percentage off" ? (
          <div className="relative">
            <input
              className={`${ic("amount")} pr-[24px]`}
              placeholder="e.g. 20"
              value={data.amount ?? ""}
              onChange={(e) => set("amount", e.target.value)}
            />
            <span className={`absolute right-[10px] top-1/2 -translate-y-1/2 ${activeSmallMutedClass}`}>%</span>
          </div>
        ) : (
          <div className="flex flex-col gap-[8px]">
            <div className="flex items-center">
              <div className="relative min-w-0 flex-1">
                <span className={`absolute left-[10px] top-1/2 -translate-y-1/2 ${activeSmallMutedClass}`}>$</span>
                <input
                  className={`${ic("amount")} rounded-r-none pl-[22px]`}
                  placeholder="0.00"
                  value={data.amount ?? ""}
                  onChange={(e) => set("amount", e.target.value)}
                />
              </div>
              <div className="w-[92px] [&_button]:rounded-l-none [&_button]:border-l-0">
                <CustomSelect
                  label=""
                  value={data.currency ?? "USD"}
                  onChange={(v) => set("currency", v)}
                  options={currencyOptions}
                  buttonClassName={activeComboSelectButtonClass}
                  chevronIcon={(isSail || isRefresh) ? <SailDropdownIcon /> : undefined}
                  dropdownOptionClassName={activeSelectOptionClass}
                />
              </div>
            </div>

            {additionalCurrencies.map((currencyAmount, idx) => (
              <div className="flex items-center gap-[8px]" key={`${currencyAmount.currency}-${idx}`}>
                <div className="flex min-w-0 flex-1 items-center">
                  <div className="relative min-w-0 flex-1">
                    <span className={`absolute left-[10px] top-1/2 -translate-y-1/2 ${activeSmallMutedClass}`}>$</span>
                    <input
                      className={`${activeInputClass} rounded-r-none pl-[22px]`}
                      placeholder="0.00"
                      value={currencyAmount.amount}
                      onChange={(e) => {
                        const next = [...additionalCurrencies]
                        next[idx] = { ...next[idx], amount: e.target.value }
                        updateAdditionalCurrencies(next)
                      }}
                    />
                  </div>
                  <div className="w-[92px] [&_button]:rounded-l-none [&_button]:border-l-0">
                    <CustomSelect
                      label=""
                      value={currencyAmount.currency}
                      onChange={(v) => {
                        const next = [...additionalCurrencies]
                        next[idx] = { ...next[idx], currency: v }
                        updateAdditionalCurrencies(next)
                      }}
                      options={currencyOptions}
                      buttonClassName={activeComboSelectButtonClass}
                      chevronIcon={(isSail || isRefresh) ? <SailDropdownIcon /> : undefined}
                      dropdownOptionClassName={activeSelectOptionClass}
                    />
                  </div>
                </div>
                <OverflowMenu
                  label="Currency options"
                  destructiveLabel="Remove"
                  isSail={isSail}
                  isRefresh={isRefresh}
                  onDestructive={() => updateAdditionalCurrencies(additionalCurrencies.filter((_, i) => i !== idx))}
                />
              </div>
            ))}

            <button
              type="button"
              className={activeActionClass}
              onClick={() => {
                const usedCurrencies = [data.currency ?? "USD", ...additionalCurrencies.map((item) => item.currency)]
                updateAdditionalCurrencies([
                  ...additionalCurrencies,
                  { currency: defaultAdditionalCurrency(usedCurrencies), amount: "" },
                ])
              }}
            >
              <svg width={isSail ? "14" : "12"} height={isSail ? "14" : "12"} viewBox={isSail ? "0 0 14 14" : "0 0 12 12"} fill="none" aria-hidden="true"><path d={isSail ? "M7 3V11M3 7H11" : "M6 2V10M2 6H10"} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              Add additional currencies
            </button>
          </div>
        )}
      </div>

      <OptionalGroups groups={couponGroups} />
    </div>
  )
}
