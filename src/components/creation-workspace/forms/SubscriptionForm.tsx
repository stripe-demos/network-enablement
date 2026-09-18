'use client'

import { useState, useRef, useEffect, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { EntityDropdown, type EntityDropdownHandle, type EntityItem } from "./EntityDropdown"
import type { WorkflowObject } from "../useWorkflowState"
import { AccountSummaryCard, NetworkAccountOption } from "../account-configuration/AccountConfigurationPrimitives"
import { getAccountRoles, getDisplayedNetworkAccount, NETWORK_ACCOUNTS } from "../account-configuration/model"

import { EXISTING_PRODUCTS } from "./shared/mockEntities"

const SUBSCRIPTION_ACCOUNTS = NETWORK_ACCOUNTS.map((account) => getDisplayedNetworkAccount(account, "direct"))

function getSubscriptionAccountItems(created: EntityItem[] = []) {
  return [
    ...SUBSCRIPTION_ACCOUNTS.map((account) => ({ id: account.id, name: account.name, detail: account.email })),
    ...created,
  ]
}

function subscriptionAccountSearchText(item: EntityItem) {
  const account = SUBSCRIPTION_ACCOUNTS.find((candidate) => candidate.id === item.id)
  return account
    ? `${account.name} ${account.email} ${account.id} ${account.country} ${getAccountRoles(account).join(" ")}`
    : `${item.name} ${item.detail ?? ""} ${item.id}`
}

function SubscriptionAccountOption({ item }: { item: EntityItem }) {
  const account = SUBSCRIPTION_ACCOUNTS.find((candidate) => candidate.id === item.id)
  if (account) return <NetworkAccountOption account={account} />
  return (
    <span className="flex min-w-0 flex-1 flex-col py-[2px]">
      <span className="truncate text-[12px] font-[600] text-[#1A2C44]">{item.name}</span>
      {item.detail ? <span className="mt-[1px] truncate text-[11px] leading-[16px] text-[#6C7688]">{item.detail}</span> : null}
    </span>
  )
}

import { getFormTokens } from "./shared/formTokens"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { useInputFill } from "@/components/creation-workspace/inputFill"
import { useChildSettingStyle, getChildSettingContentClass, getChildSettingFillClass } from "@/components/creation-workspace/childSettingStyle"
import { useSectionDividers } from "@/components/creation-workspace/sectionDividers"
import { ChevronIcon } from "./shared/CustomSelect"
import { Checkbox } from "./shared/Checkbox"
import { SegmentedControl } from "@/components/SegmentedControl"
import { ComposeGroup, AddChip } from "./shared/ComposeGroup"

// ── Constants ──────────────────────────────────────────────────────────

const PAYMENT_METHOD_PRESETS = [
  { value: "default", label: "Default" },
  { value: "custom", label: "Custom" },
]

const TEMPLATE_OPTIONS = [
  { value: "", label: "Select a template..." },
  { value: "default", label: "Default" },
  { value: "minimal", label: "Minimal" },
]

const TRIAL_END_OPTIONS = [
  { value: "continue", label: "Continue subscription and send invoice" },
  { value: "cancel", label: "Cancel subscription" },
  { value: "pause", label: "Pause subscription" },
]

const MOCK_TAX_RATES = [
  { id: "tax_1", name: "VAT 20%", detail: "United Kingdom" },
  { id: "tax_2", name: "VAT 19%", detail: "Germany" },
  { id: "tax_3", name: "GST 10%", detail: "Australia" },
  { id: "tax_4", name: "Sales Tax 8.875%", detail: "New York" },
  { id: "tax_5", name: "HST 13%", detail: "Ontario, Canada" },
]

const MOCK_COUPONS = [
  { id: "coupon_1", name: "SUMMER25", detail: "25% off" },
  { id: "coupon_2", name: "WELCOME10", detail: "$10 off" },
  { id: "coupon_3", name: "LOYAL50", detail: "50% off first month" },
  { id: "coupon_4", name: "ENTERPRISE", detail: "Custom pricing" },
]

const MOCK_PAYMENT_METHODS: { id: string; name: string; status: "enabled" | "disabled" | "pending"; type: string; region: string }[] = [
  { id: "pm_1", name: "Cards", status: "enabled", type: "Cards", region: "All regions" },
  { id: "pm_2", name: "Cartes Bancaires", status: "pending", type: "Cards", region: "France" },
  { id: "pm_3", name: "Alipay", status: "disabled", type: "Wallet", region: "China" },
  { id: "pm_4", name: "Apple Pay", status: "enabled", type: "Wallet", region: "All regions" },
  { id: "pm_5", name: "Google Pay", status: "disabled", type: "Wallet", region: "All regions" },
  { id: "pm_6", name: "Link", status: "disabled", type: "Wallet", region: "All regions" },
  { id: "pm_7", name: "Bancontact", status: "enabled", type: "Bank redirect", region: "Belgium" },
  { id: "pm_8", name: "BLIK", status: "disabled", type: "Bank redirect", region: "Poland" },
  { id: "pm_9", name: "Klarna", status: "enabled", type: "Buy now pay later", region: "All regions" },
  { id: "pm_10", name: "Afterpay", status: "disabled", type: "Buy now pay later", region: "All regions" },
]

const BILL_UPFRONT_OPTIONS = [
  { value: "1_month", label: "1 month" },
  { value: "3_months", label: "3 months" },
  { value: "6_months", label: "6 months" },
  { value: "1_year", label: "1 year" },
]

const TRIAL_DURATION_OPTIONS = [
  { value: "7_days", label: "7 days" },
  { value: "14_days", label: "14 days" },
  { value: "30_days", label: "30 days" },
  { value: "60_days", label: "60 days" },
]

// ── Helper Components ──────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const t = getFormTokens(productFormStyle, { filled: inputFill }).toggle
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
        className={`absolute ${t.knobClass} rounded-full bg-white shadow-[0_1px_1px_rgba(33,37,44,0.16)] transition-all ${
          checked ? `${t.knobOnPos} ${t.knobOnBorder}` : `${t.knobOffPos} ${t.knobOffBorder}`
        }`}
      />
    </button>
  )
}

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

function MultiSelectDropdown({ placeholder, items, selectedIds, onChange, addNewLabel, onAddNew, autoFocus }: {
  placeholder: string
  items: { id: string; name: string; detail: string }[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  addNewLabel?: string
  onAddNew?: () => void
  autoFocus?: boolean
}) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  const isRefresh = productFormStyle === "refresh"
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => setIsOpen(true), 80)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [isOpen])

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  const remove = (id: string) => onChange(selectedIds.filter((s) => s !== id))

  return (
    <div className="flex flex-col gap-[6px]">
      <div ref={containerRef} className="relative">
        <button
          type="button"
          className={`${tokens.inputClass} flex w-full items-center justify-between text-left`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={selectedIds.length > 0 ? "" : "text-[#9CA3B0]"}>
            {selectedIds.length > 0 ? `${selectedIds.length} selected` : placeholder}
          </span>
          <ChevronIcon className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
        {isOpen && (
          <div className={`absolute left-0 top-[calc(100%+4px)] z-50 w-full rounded-[8px] border ${isRefresh ? "border-[#EAF0F6]" : "border-[#EBEEF1]"} bg-white py-[4px] shadow-[0px_4px_16px_rgba(0,0,0,0.08)]`}>
            {items.map((item) => {
              const checked = selectedIds.includes(item.id)
              return (
                <div
                  key={item.id}
                  role="option"
                  aria-selected={checked}
                  tabIndex={0}
                  className={`flex w-full cursor-pointer items-center gap-[8px] px-[10px] py-[6px] text-left text-[12px] transition-colors ${isRefresh ? "hover:bg-[#F6F9FC]" : "hover:bg-[#F5F6F8]"}`}
                  onClick={() => toggle(item.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(item.id) } }}
                >
                  <Checkbox checked={checked} onChange={() => toggle(item.id)} />
                  <span className="flex-1 font-[400] text-[#353A44]">{item.name}</span>
                  <span className={`text-[11px] ${isRefresh ? "text-[#526378]" : "text-[#596171]"}`}>{item.detail}</span>
                </div>
              )
            })}
            {addNewLabel && (
              <>
                <div className={`mx-[8px] my-[4px] border-t ${isRefresh ? "border-[#EAF0F6]" : "border-[#EBEEF1]"}`} />
                <button
                  type="button"
                  className={`flex w-full items-center gap-[6px] px-[10px] py-[6px] text-left text-[12px] font-[500] text-[#533AFD] transition-colors ${isRefresh ? "hover:bg-[#F6F9FC]" : "hover:bg-[#F5F6F8]"}`}
                  onClick={() => {
                    setIsOpen(false)
                    onAddNew?.()
                  }}
                >
                  {addNewLabel}
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-[4px]">
          {selectedIds.map((id) => {
            const item = items.find((i) => i.id === id)
            return (
              <span key={id} className="flex items-center gap-[4px] rounded-full border border-[#D8DEE4] bg-white px-[8px] py-[2px] text-[11px] font-[400] text-[#596171]">
                {item?.name ?? id}
                <button type="button" className="text-[#9CA3B0] hover:text-[#596171]" onClick={() => remove(id)}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M2 2L6 6M6 2L2 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                </button>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PaymentMethodsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [methods, setMethods] = useState(MOCK_PAYMENT_METHODS)
  const [actionsOpen, setActionsOpen] = useState<string | null>(null)

  const toggleStatus = (id: string) => {
    setMethods((prev) => prev.map((m) =>
      m.id === id ? { ...m, status: m.status === "enabled" ? "disabled" : "enabled" as const } : m
    ))
  }

  const statusBadge = (status: string) => {
    const colors = {
      enabled: "bg-[#E8FFF3] text-[#1D7C4D] border-[#C3F0D8]",
      disabled: "bg-[#F4F6F8] text-[#596171] border-[#E3E8EF]",
      pending: "bg-[#FFFBE6] text-[#946800] border-[#FFE58F]",
    }
    return colors[status as keyof typeof colors] ?? colors.disabled
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-[24px]">
        <div className="flex max-h-[80vh] w-[680px] flex-col overflow-hidden rounded-[12px] border border-[#EBEEF1] bg-white shadow-[0px_15px_35px_0px_rgba(48,49,61,0.08),0px_5px_15px_0px_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between border-b border-[#ECF1F6] px-[20px] py-[14px]">
            <h2 className="text-[15px] font-[600] text-[#1A2C44]">Payment methods</h2>
            <button type="button" className="text-[#596171] hover:text-[#1A2C44]" onClick={onClose}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-[2px] border-b border-[#ECF1F6] px-[20px] py-[10px]">
            {[
              { label: "All", count: methods.length },
              { label: "Enabled", count: methods.filter((m) => m.status === "enabled").length },
              { label: "Disabled", count: methods.filter((m) => m.status === "disabled").length },
            ].map((tab) => (
              <span key={tab.label} className="rounded-[4px] px-[8px] py-[4px] text-[12px] font-[500] text-[#596171]">
                {tab.label} <span className="text-[#9CA3B0]">{tab.count}</span>
              </span>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#ECF1F6] text-left text-[11px] font-[500] uppercase tracking-[0.5px] text-[#596171]">
                  <th className="px-[20px] py-[8px]">Payment method</th>
                  <th className="px-[12px] py-[8px]">Status</th>
                  <th className="px-[12px] py-[8px]">Type</th>
                  <th className="px-[12px] py-[8px]">Popular in</th>
                  <th className="px-[12px] py-[8px] text-right"></th>
                </tr>
              </thead>
              <tbody>
                {methods.map((method) => (
                  <tr key={method.id} className="border-b border-[#F4F6F8] transition-colors hover:bg-[#FAFBFC]">
                    <td className="px-[20px] py-[10px]">
                      <span className="text-[13px] font-[500] text-[#1A2C44]">{method.name}</span>
                    </td>
                    <td className="px-[12px] py-[10px]">
                      <span className={`inline-flex rounded-full border px-[8px] py-[1px] text-[11px] font-[500] capitalize ${statusBadge(method.status)}`}>
                        {method.status}
                      </span>
                    </td>
                    <td className="px-[12px] py-[10px] text-[12px] text-[#596171]">{method.type}</td>
                    <td className="px-[12px] py-[10px] text-[12px] text-[#596171]">{method.region}</td>
                    <td className="px-[12px] py-[10px] text-right">
                      <div className="relative inline-flex items-center gap-[4px]">
                        {method.status === "disabled" && (
                          <button
                            type="button"
                            className="rounded-[4px] border border-[#D8DEE4] bg-white px-[8px] py-[3px] text-[11px] font-[500] text-[#353A44] transition-colors hover:bg-[#F5F6F8]"
                            onClick={() => toggleStatus(method.id)}
                          >
                            Enable
                          </button>
                        )}
                        <button
                          type="button"
                          className="flex h-[24px] w-[24px] items-center justify-center rounded-[4px] text-[#596171] transition-colors hover:bg-[#F5F6F8]"
                          onClick={() => setActionsOpen(actionsOpen === method.id ? null : method.id)}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <circle cx="6" cy="2.5" r="1" fill="currentColor" />
                            <circle cx="6" cy="6" r="1" fill="currentColor" />
                            <circle cx="6" cy="9.5" r="1" fill="currentColor" />
                          </svg>
                        </button>
                        {actionsOpen === method.id && (
                          <div className="absolute right-0 top-[28px] z-10 w-[180px] rounded-[8px] border border-[#EBEEF1] bg-white py-[4px] shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                            <button
                              type="button"
                              className="flex w-full px-[12px] py-[6px] text-left text-[12px] text-[#353A44] hover:bg-[#F5F6F8]"
                              onClick={() => { toggleStatus(method.id); setActionsOpen(null) }}
                            >
                              {method.status === "enabled" ? "Disable" : "Enable"}
                            </button>
                            <button
                              type="button"
                              className="flex w-full px-[12px] py-[6px] text-left text-[12px] text-[#353A44] hover:bg-[#F5F6F8]"
                              onClick={() => setActionsOpen(null)}
                            >
                              Customize availability
                            </button>
                            <button
                              type="button"
                              className="flex w-full px-[12px] py-[6px] text-left text-[12px] text-[#353A44] hover:bg-[#F5F6F8]"
                              onClick={() => setActionsOpen(null)}
                            >
                              View details
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end border-t border-[#ECF1F6] px-[20px] py-[12px]">
            <button
              type="button"
              className="flex h-[28px] items-center rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[10px] text-[12px] font-[600] text-white transition-colors hover:bg-[#4730E0]"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function CustomSelect({ label, value, onChange, options, buttonLabel, onButtonClick, buttonClassName, footerAction }: {
  label?: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  buttonLabel?: string
  onButtonClick?: () => void
  buttonClassName?: string
  footerAction?: {
    label: string
    onClick: () => void
  }
}) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  const isRefresh = productFormStyle === "refresh"
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [isOpen])

  const selected = options.find((o) => o.value === value)

  return (
    <div className="flex flex-col gap-[4px]">
      {label && <label className={tokens.labelClass}>{label}</label>}
      <div className="flex items-center gap-[8px]">
        <div ref={containerRef} className="relative flex-1">
          <button
            type="button"
            className={`${tokens.inputClass} flex items-center justify-between gap-[10px] ${buttonClassName ?? ""}`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <span>{selected?.label ?? value}</span>
            <ChevronIcon className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
          {isOpen && (
            <div className={`absolute left-0 top-[calc(100%+4px)] z-50 w-full rounded-[8px] border ${isRefresh ? "border-[#EAF0F6]" : "border-[#EBEEF1]"} bg-white py-[4px] shadow-[0px_4px_16px_rgba(0,0,0,0.08)]`}>
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`flex w-full items-center px-[10px] py-[6px] text-left text-[12px] transition-colors ${isRefresh ? "hover:bg-[#F6F9FC]" : "hover:bg-[#F5F6F8]"} ${opt.value === value ? "font-[500] text-[#1A2C44]" : "font-[400] text-[#353A44]"}`}
                  onClick={() => { onChange(opt.value); setIsOpen(false) }}
                >
                  {opt.label}
                </button>
              ))}
              {footerAction ? (
                <div className="mt-[4px] border-t border-[#F0F3F7] pt-[4px]">
                  <button
                    type="button"
                    className={`flex w-full items-center px-[10px] py-[6px] text-left text-[12px] font-[500] text-[#533AFD] transition-colors ${isRefresh ? "hover:bg-[#F6F9FC]" : "hover:bg-[#F5F6F8]"}`}
                    onClick={() => {
                      footerAction.onClick()
                      setIsOpen(false)
                    }}
                  >
                    {footerAction.label}
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
        {buttonLabel && (
          <button
            type="button"
            className="h-[30px] shrink-0 rounded-[6px] border border-[#D8DEE4] bg-white px-[12px] text-[12px] font-[500] text-[#353A44] transition-colors hover:bg-[#F5F6F8]"
            onClick={onButtonClick}
          >
            {buttonLabel}
          </button>
        )}
      </div>
    </div>
  )
}

function MetadataRows({ rows, onChange }: {
  rows: { key: string; value: string }[]
  onChange: (rows: { key: string; value: string }[]) => void
}) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })

  const updateRow = (index: number, field: "key" | "value", val: string) => {
    const updated = [...rows]
    updated[index] = { ...updated[index], [field]: val }
    onChange(updated)
  }

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index))
  }

  const addRow = () => {
    onChange([...rows, { key: "", value: "" }])
  }

  return (
    <div className="flex flex-col gap-[8px]">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-[8px]">
          <input
            className={tokens.inputClass}
            placeholder="Key"
            value={row.key}
            onChange={(e) => updateRow(i, "key", e.target.value)}
          />
          <input
            className={tokens.inputClass}
            placeholder="Value"
            value={row.value}
            onChange={(e) => updateRow(i, "value", e.target.value)}
          />
          <button
            type="button"
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center text-[#9CA3B0] transition-colors hover:text-[#596171]"
            onClick={() => removeRow(i)}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        className="flex items-center gap-[4px] self-start text-[12px] font-[600] text-[#533AFD] hover:text-[#4730E0]"
        onClick={addRow}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        Add metadata
      </button>
    </div>
  )
}

function CustomFieldRows({ rows, onChange }: {
  rows: { name: string; value: string }[]
  onChange: (rows: { name: string; value: string }[]) => void
}) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })

  const updateRow = (index: number, field: "name" | "value", val: string) => {
    const updated = [...rows]
    updated[index] = { ...updated[index], [field]: val }
    onChange(updated)
  }

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index))
  }

  const addRow = () => {
    onChange([...rows, { name: "", value: "" }])
  }

  return (
    <div className="flex flex-col gap-[8px]">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-[8px]">
          <input
            className={tokens.inputClass}
            placeholder="Field name (e.g. PO number)"
            value={row.name}
            onChange={(e) => updateRow(i, "name", e.target.value)}
          />
          <input
            className={tokens.inputClass}
            placeholder="Field value"
            value={row.value}
            onChange={(e) => updateRow(i, "value", e.target.value)}
          />
          <button
            type="button"
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center text-[#9CA3B0] transition-colors hover:text-[#596171]"
            onClick={() => removeRow(i)}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        className="flex items-center gap-[4px] self-start text-[12px] font-[600] text-[#533AFD] hover:text-[#4730E0]"
        onClick={addRow}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        Add custom field
      </button>
    </div>
  )
}

// ── Item Card ──────────────────────────────────────────────────────────

type SubscriptionItem = {
  id: string
  productId: string
  productName: string
  price: string
  priceOptions?: { value: string; label: string }[]
  quantity: string
  couponsEnabled: boolean
  taxEnabled: boolean
  taxCategory?: string
  confirmed: boolean
}

function ItemCard({ item, onUpdate, onRemove, autoFocus, onAddObject }: {
  item: SubscriptionItem
  onUpdate: (updates: Partial<SubscriptionItem>) => void
  onRemove: () => void
  autoFocus?: boolean
  onAddObject?: (kind: string, existingId?: string, initialData?: Record<string, any>) => void
}) {
  const productDropdownRef = useRef<EntityDropdownHandle>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([])
  const [selectedTaxRates, setSelectedTaxRates] = useState<string[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const { childSettingStyle } = useChildSettingStyle()
  const { sectionDividers } = useSectionDividers()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  const isSail = productFormStyle === "sail"
  const isRefresh = productFormStyle === "refresh"
  const useDividers = sectionDividers
  const activeToggleRowClass = tokens.toggleRow
  const activeToggleBlockGapClass = isSail ? "gap-[16px]" : isRefresh ? "gap-[12px]" : "gap-[10px]"
  const activeToggleBlockPaddingClass = isSail ? "px-[16px] py-[16px]" : isRefresh ? "px-[12px] py-[12px]" : "px-[12px] py-[10px]"
  const activeToggleBlockSurfaceClass = isRefresh ? "bg-[#F6F9FC]" : "bg-[#F6F8FA]"
  const childSettingBlockClass = (enabled: boolean) =>
    `flex flex-col transition-[padding] duration-200 ease-out ${useDividers ? "px-[16px] py-[12px]" : ""} ${activeToggleBlockGapClass} ${getChildSettingFillClass(childSettingStyle, enabled, { surface: activeToggleBlockSurfaceClass, padding: activeToggleBlockPaddingClass }, { divided: useDividers })}`
  const childSettingContentClass = getChildSettingContentClass(childSettingStyle, {
    surface: activeToggleBlockSurfaceClass,
    padding: activeToggleBlockPaddingClass,
    isRefresh,
  })
  const toggleGroupClass = useDividers
    ? `-mx-[16px] ${isRefresh && childSettingStyle === "filled" ? "px-[4px]" : ""} flex flex-col divide-y-[0.5px] ${isRefresh ? "divide-[#EAF0F6]" : "divide-[#E3E8EF]"}`
    : "flex flex-col gap-[12px]"

  useEffect(() => {
    if (autoFocus && !item.productId) {
      setTimeout(() => productDropdownRef.current?.open(), 100)
    }
  }, [])

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

  return (
    <div className={`rounded-[8px] border ${isRefresh ? "border-[#EAF0F6]" : "border-[#E3E8EF]"} p-[16px]`}>
      <div className="flex flex-col gap-[8px]">
        <div className="flex items-start gap-[8px]">
          <div className="min-w-0 flex-1">
            <EntityDropdown
              ref={productDropdownRef}
              label="Product"
              placeholder="Select product"
              searchPlaceholder="Search products..."
              items={EXISTING_PRODUCTS}
              selectedId={item.productId}
              selectedLabel={item.productName}
              onSelect={(id) => {
                const product = EXISTING_PRODUCTS.find((p) => p.id === id)
                onUpdate({ productId: id, productName: product?.name ?? "", price: product?.detail ?? "" })
              }}
              addNewLabel="+ New product"
              onAddNew={() => onAddObject?.("product", undefined, { _subscriptionItemId: item.id })}
            />
          </div>
          <div className={`relative shrink-0 ${isSail || isRefresh ? "mt-[24px]" : "mt-[20px]"}`} ref={menuRef}>
            <button
              type="button"
              aria-label="Item actions"
              className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[6px] border ${isRefresh ? "border-[#D8E1EA]" : "border-[#D4DEE9]"} bg-white transition-colors ${menuOpen ? (isRefresh ? "bg-[#F1F6FB]" : "bg-[#F5F6F8]") : (isRefresh ? "hover:bg-[#F1F6FB]" : "hover:bg-[#F5F6F8]")}`}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <circle cx="2.5" cy="6" r="1" fill="#3C4F69" />
                <circle cx="6" cy="6" r="1" fill="#3C4F69" />
                <circle cx="9.5" cy="6" r="1" fill="#3C4F69" />
              </svg>
            </button>
            {menuOpen && (
              <div className={`absolute right-0 top-[34px] z-50 w-[120px] rounded-[8px] border ${isRefresh ? "border-[#D8E1EA]" : "border-[#D8DEE4]"} bg-white py-[4px] shadow-[0_12px_32px_rgba(28,32,40,0.12)]`}>
                <button
                  type="button"
                  className={`flex w-full items-center px-[10px] py-[6px] text-left text-[#DF1B41] transition-colors ${isRefresh ? "hover:bg-[#F1F6FB]" : "hover:bg-[#F5F6F8]"} ${isSail ? "text-[14px] font-[400] leading-[20px] tracking-[-0.15px]" : isRefresh ? "text-[13px] font-[400] leading-[20px] tracking-[-0.065px]" : "text-[12px] font-[500]"}`}
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

        {item.priceOptions && item.priceOptions.length > 1 ? (
          <CustomSelect
            value={item.price || item.priceOptions[0]?.value || ""}
            onChange={(v) => onUpdate({ price: v })}
            options={item.priceOptions}
          />
        ) : (
          <div className="flex items-center px-[2px] py-[2px]">
            <span className={isSail ? "text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#353A44]" : isRefresh ? "text-[13px] font-[575] leading-[20px] tracking-[-0.065px] text-[#142234]" : "text-[12px] font-[500] leading-[16px] text-[#1A2C44]"}>
              {item.price || "$0.00/mo"}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-[4px]">
          <label className={tokens.labelClass}>Quantity</label>
          <input
            className={tokens.inputClass}
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => onUpdate({ quantity: e.target.value })}
          />
        </div>

        <div className={toggleGroupClass}>
          <div className={childSettingBlockClass(item.couponsEnabled)}>
            <div className={activeToggleRowClass}>
              <span>Coupons</span>
              <Toggle checked={item.couponsEnabled} onChange={(v) => onUpdate({ couponsEnabled: v })} />
            </div>
            <Expandable show={item.couponsEnabled}>
              <div className={childSettingContentClass}>
                <MultiSelectDropdown
                  placeholder="Choose coupons"
                  items={MOCK_COUPONS}
                  selectedIds={selectedCoupons}
                  onChange={setSelectedCoupons}
                  addNewLabel="+ Add new coupon"
                  onAddNew={() => onAddObject?.("coupon")}
                  autoFocus
                />
              </div>
            </Expandable>
          </div>

          <div className={childSettingBlockClass(item.taxEnabled)}>
            <div className={activeToggleRowClass}>
              <span>Apply item-specific tax</span>
              <Toggle checked={item.taxEnabled} onChange={(v) => onUpdate({ taxEnabled: v })} />
            </div>
            <Expandable show={item.taxEnabled}>
              <div className={`${childSettingContentClass} flex flex-col gap-[6px]`}>
                <span className={tokens.helperClass}>Replaces subscription-level taxes.</span>
                <MultiSelectDropdown
                  placeholder="Select tax rates"
                  items={MOCK_TAX_RATES}
                  selectedIds={selectedTaxRates}
                  onChange={setSelectedTaxRates}
                  autoFocus
                />
              </div>
            </Expandable>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page: Subscription (main) ──────────────────────────────────────────

function SubscriptionPage({ data, onChange, errorFields, onAddObject, itemsDropdownRef, topPadding = true, customerLabel = "Account" }: {
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
  errorFields?: Set<string>
  onAddObject?: (kind: string, existingId?: string, initialData?: Record<string, any>) => void
  itemsDropdownRef: React.RefObject<EntityDropdownHandle | null>
  topPadding?: boolean
  customerLabel?: string
}) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  const isRefresh = productFormStyle === "refresh"
  const isSail = productFormStyle === "sail"
  const items: SubscriptionItem[] = data.items ?? []
  const hasCustomer = !!(data.customerId && data.customerId !== "")
  const selectedSubscriptionAccount = data.customerId && data.customerId !== "_new"
    ? SUBSCRIPTION_ACCOUNTS.find((account) => account.id === data.customerId)
    : undefined
  const [newItemId, setNewItemId] = useState<string | null>(null)
  const serviceDateClass = isSail
    ? "rounded-[6px] border border-[#D8DEE4] bg-white px-[10px] py-[4px] text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#353A44]"
    : isRefresh
      ? "rounded-[6px] border border-[#D8E1EA] bg-white px-[10px] py-[4px] text-[13px] font-[575] leading-[20px] tracking-[-0.065px] text-[#142234]"
      : "rounded-[6px] border border-[#D8DEE4] bg-white px-[10px] py-[4px] text-[12px] font-[500] leading-[16px] text-[#1A2C44]"
  const serviceEndSelectClass = isSail
    ? "min-w-[124px] px-[12px]"
    : isRefresh
      ? "min-w-[122px] px-[12px]"
      : "min-w-[112px] px-[12px]"

  const addItem = (productId: string, productName: string) => {
    const product = EXISTING_PRODUCTS.find((p) => p.id === productId)
    const newItem: SubscriptionItem = {
      id: `item_${Date.now()}`,
      productId,
      productName,
      price: product?.detail ?? "$0.00/mo",
      quantity: "1",
      couponsEnabled: false,
      taxEnabled: false,
      confirmed: false,
    }
    onChange({ items: [...items, newItem] })
  }

  useEffect(() => {
    if (!data._focusItemsAfterCustomerSave) return
    const timer = window.setTimeout(() => {
      itemsDropdownRef.current?.open()
      onChange({ _focusItemsAfterCustomerSave: false })
    }, 150)
    return () => window.clearTimeout(timer)
  }, [data._focusItemsAfterCustomerSave, itemsDropdownRef, onChange])

  const updateItem = (itemId: string, updates: Partial<SubscriptionItem>) => {
    onChange({ items: items.map((item) => item.id === itemId ? { ...item, ...updates } : item) })
  }

  const removeItem = (itemId: string) => {
    onChange({ items: items.filter((item) => item.id !== itemId) })
  }


  return (
    <div className={`flex flex-col gap-[16px] ${topPadding ? "pt-[16px]" : ""}`}>
      <div className="flex flex-col gap-[12px]">
        <EntityDropdown
          label={customerLabel}
          placeholder="Find or add an account"
          searchPlaceholder="Search by name, email, or account ID"
          items={getSubscriptionAccountItems(data._createdCustomers ?? [])}
          getSearchText={subscriptionAccountSearchText}
          renderOption={(item) => <SubscriptionAccountOption item={item} />}
          insetOptionHover
          selectedId={data.customerId ?? ""}
          selectedLabel={data.customerName}
          selectedIsPlaceholder={data.customerId === "_new" && (!data.customerName || data.customerName === "New account")}
          onSelect={(id) => {
            const account = getSubscriptionAccountItems(data._createdCustomers ?? []).find((candidate) => candidate.id === id)
            onChange({ customerId: id, customerName: account?.name ?? "" })
            setTimeout(() => itemsDropdownRef.current?.open(), 150)
          }}
          addNewLabel="Create new account"
          onAddNew={() => {
            onAddObject?.("customer")
            onChange({ customerId: "_new", customerName: "New account" })
          }}
          hasError={errorFields?.has("customerId")}
          errorMessage="Select an account"
        />
        {selectedSubscriptionAccount ? <AccountSummaryCard account={selectedSubscriptionAccount} /> : null}
      </div>

      {hasCustomer && (
        <>
          {/* Service period */}
          <div className="flex flex-col gap-[4px]">
            <label className={tokens.labelClass}>Service period</label>
            <div className="flex items-center gap-[8px]">
              <span className={serviceDateClass}>
                {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span className="text-[13px] text-[#596171]">&rarr;</span>
              <CustomSelect
                value={data.endDate ?? "forever"}
                onChange={(v) => onChange({ endDate: v })}
                buttonClassName={serviceEndSelectClass}
                options={[
                  { value: "forever", label: "Forever" },
                  { value: "1_month", label: "1 month" },
                  { value: "3_months", label: "3 months" },
                  { value: "6_months", label: "6 months" },
                  { value: "12_months", label: "12 months" },
                ]}
              />
            </div>
          </div>

          {/* Items */}
          <div className="flex flex-col gap-[8px]">
            <label className={tokens.labelClass}>Items</label>

            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onUpdate={(updates) => updateItem(item.id, updates)}
                onRemove={() => removeItem(item.id)}
                autoFocus={item.id === newItemId}
                onAddObject={(kind) => onAddObject?.(kind)}
              />
            ))}

            {items.length === 0 ? (
              <EntityDropdown
                ref={itemsDropdownRef}
                placeholder="Select item"
                label=""
                searchPlaceholder="Search products..."
                items={[...EXISTING_PRODUCTS, ...(data._createdProducts ?? [])]}
                selectedId=""
                onSelect={(id) => {
                  const allItems = [...EXISTING_PRODUCTS, ...(data._createdProducts ?? [])]
                  const product = allItems.find((p) => p.id === id)
                  if (product) addItem(id, product.name)
                }}
                addNewLabel="+ New product"
                onAddNew={() => {
                  onAddObject?.("product", undefined, { _subscriptionItemId: null })
                }}
                hasError={errorFields?.has("productId")}
                errorMessage="Select a product"
              />
            ) : (
              <button
                type="button"
                className="flex items-center gap-[4px] self-start rounded-[6px] px-[8px] py-[4px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#533AFD] transition-colors hover:bg-[#F7F5FD]"
                onClick={() => {
                  const id = `item_${Date.now()}`
                  setNewItemId(id)
                  const newItem: SubscriptionItem = {
                    id,
                    productId: "",
                    productName: "",
                    price: "",
                    quantity: "1",
                    couponsEnabled: false,
                    taxEnabled: false,
                    confirmed: false,
                  }
                  onChange({ items: [...items, newItem] })
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                Add another item
              </button>
            )}
          </div>
        </>
      )}

    </div>
  )
}

// ── Page: Billing and payment collection ───────────────────────────────

function BillingPage({ data, onChange, topPadding = true, flush = true }: {
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
  topPadding?: boolean
  flush?: boolean
}) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const { childSettingStyle } = useChildSettingStyle()
  const { sectionDividers } = useSectionDividers()
  const isSail = productFormStyle === "sail"
  const isRefresh = productFormStyle === "refresh"
  const useDividers = sectionDividers
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  const set = (key: string, value: any) => onChange({ [key]: value })
  const collectionMethod = data.collectionMethod ?? "charge_automatically"
  const today = new Date().toISOString().split("T")[0]
  const [showPaymentMethodsModal, setShowPaymentMethodsModal] = useState(false)
  const [selectedTaxRates, setSelectedTaxRates] = useState<string[]>([])
  const activeToggleRowClass = tokens.toggleRow
  const activeToggleBlockGapClass = isSail ? "gap-[16px]" : isRefresh ? "gap-[12px]" : "gap-[10px]"
  const activeToggleBlockSurfaceClass = isRefresh ? "bg-[#F6F9FC]" : "bg-[#F6F8FA]"
  const childSettingBlockClass = (enabled: boolean) =>
    `flex flex-col transition-[padding] duration-200 ease-out ${useDividers ? (isSail ? "px-[24px] py-[12px]" : "px-[16px] py-[12px]") : ""} ${activeToggleBlockGapClass} ${getChildSettingFillClass(childSettingStyle, enabled, { surface: activeToggleBlockSurfaceClass, padding: "px-[12px] py-[10px]" }, { divided: useDividers })}`
  const childSettingContentClass = getChildSettingContentClass(childSettingStyle, {
    surface: activeToggleBlockSurfaceClass,
    padding: "px-[12px] py-[8px]",
    isRefresh,
  })
  const toggleGroupClass = useDividers
    ? `${flush ? (isSail ? "-mx-[24px]" : "-mx-[16px]") : ""} ${isRefresh && childSettingStyle === "filled" ? "px-[4px]" : ""} flex flex-col divide-y-[0.5px] ${isRefresh ? "divide-[#EAF0F6]" : "divide-[#E3E8EF]"}`
    : "flex flex-col gap-[20px]"

  return (
    <div className={`flex flex-col gap-[16px] ${topPadding ? "pt-[16px]" : ""}`}>
      <div className="flex flex-col gap-[4px]">
        <label className={tokens.labelClass}>Payment collection</label>
        {/* No fitContent: in segmented style this fills the column width (like Invoice's). */}
        <SegmentedControl
          value={collectionMethod as "charge_automatically" | "send_invoice"}
          onChange={(v) => set("collectionMethod", v)}
          options={["charge_automatically", "send_invoice"] as const}
          getDisplayValue={(v) => (v === "charge_automatically" ? "Auto charge" : "Send invoices")}
        />
      </div>

      {collectionMethod === "send_invoice" && (
        <>
          <div className="flex flex-col gap-[4px]">
            <label className={tokens.labelClass}>Days until payment is due</label>
            <input
              className={tokens.inputClass}
              type="number"
              value={data.daysUntilDue ?? "30"}
              onChange={(e) => set("daysUntilDue", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-[4px]">
            <label className={tokens.labelClass}>Payment methods</label>
            <span className="text-[12px] font-[400] text-[#596171]">Configure available payment methods for this subscription.</span>
            <div className="flex items-center gap-[8px]">
              <div className="flex-1">
                <CustomSelect
                  value={data.paymentMethodPreset ?? "default"}
                  onChange={(v) => set("paymentMethodPreset", v)}
                  options={PAYMENT_METHOD_PRESETS}
                />
              </div>
              <button
                type="button"
                className="h-[30px] shrink-0 rounded-[6px] border border-[#D8DEE4] bg-white px-[12px] text-[12px] font-[500] text-[#353A44] transition-colors hover:bg-[#F5F6F8]"
                onClick={() => setShowPaymentMethodsModal(true)}
              >
                Manage
              </button>
            </div>
            <div className="flex flex-wrap gap-[6px] pt-[4px]">
              {["Credit or debit card", "Klarna"].map((method) => (
                <span key={method} className="flex items-center gap-[4px] rounded-full border border-[#D8DEE4] px-[8px] py-[2px] text-[12px] font-[400] text-[#596171]">
                  {method}
                </span>
              ))}
            </div>
          </div>
        </>
      )}


      <div className={toggleGroupClass}>
        <div className={childSettingBlockClass(Boolean(data.chargeFirstInvoice))}>
          <div className={activeToggleRowClass}>
            <span>Charge first invoice at specific time</span>
            <Toggle checked={Boolean(data.chargeFirstInvoice)} onChange={(v) => set("chargeFirstInvoice", v)} />
          </div>
          <Expandable show={Boolean(data.chargeFirstInvoice)}>
            <div className={`${childSettingContentClass} flex flex-col gap-[6px]`}>
              <span className={tokens.helperClass}>Based on UTC</span>
              <div className="flex items-center gap-[8px]">
                <input
                  type="date"
                  className={tokens.inputClass}
                  value={data.chargeDate ?? today}
                  onChange={(e) => set("chargeDate", e.target.value)}
                />
                <input
                  type="time"
                  className={tokens.inputClass}
                  value={data.chargeTime ?? "18:29"}
                  onChange={(e) => set("chargeTime", e.target.value)}
                />
              </div>
            </div>
          </Expandable>
        </div>

        <div className={childSettingBlockClass(Boolean(data.billUpfront))}>
          <div className={activeToggleRowClass}>
            <span>Bill upfront</span>
            <Toggle checked={Boolean(data.billUpfront)} onChange={(v) => set("billUpfront", v)} />
          </div>
          <Expandable show={Boolean(data.billUpfront)}>
            <div className={`${childSettingContentClass} flex items-center gap-[8px]`}>
              <span className="text-[13px] font-[500] text-[#1A2C44]">Now</span>
              <span className="text-[13px] text-[#596171]">&rarr;</span>
              <CustomSelect
                value={data.billUpfrontEnd ?? "1_month"}
                onChange={(v) => set("billUpfrontEnd", v)}
                options={BILL_UPFRONT_OPTIONS}
              />
              <span className="text-[13px] text-[#596171]">for all products</span>
            </div>
          </Expandable>
        </div>

        <div className={childSettingBlockClass(Boolean(data.collectTax))}>
          <div className={activeToggleRowClass}>
            <span>Collect tax</span>
            <Toggle
              checked={Boolean(data.collectTax)}
              onChange={(v) => onChange({ collectTax: v, taxMode: v ? "automatically" : data.taxMode })}
            />
          </div>
          <Expandable show={Boolean(data.collectTax)}>
            <div className={`${childSettingContentClass} flex flex-col gap-[8px]`}>
              <SegmentedControl
                value={(data.taxMode ?? "automatically") as "automatically" | "manually"}
                onChange={(v) => set("taxMode", v)}
                options={["automatically", "manually"] as const}
                getDisplayValue={(v) => (v === "automatically" ? "Automatically" : "Manually")}
                contrast={childSettingStyle === "filled" || childSettingStyle === "tint"}
              />
              {data.taxMode === "manually" && (
                <MultiSelectDropdown
                  placeholder="Select tax rates"
                  items={MOCK_TAX_RATES}
                  selectedIds={selectedTaxRates}
                  onChange={setSelectedTaxRates}
                  autoFocus
                />
              )}
            </div>
          </Expandable>
        </div>
      </div>
      <PaymentMethodsModal isOpen={showPaymentMethodsModal} onClose={() => setShowPaymentMethodsModal(false)} />
    </div>
  )
}

// ── Page: Subscription options ─────────────────────────────────────────

function SubscriptionOptionsPage({ data, onChange, onAddObject, flush = true }: {
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
  onAddObject?: (kind: string, existingId?: string, initialData?: Record<string, any>) => void
  flush?: boolean
}) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const { childSettingStyle } = useChildSettingStyle()
  const { sectionDividers } = useSectionDividers()
  const isSail = productFormStyle === "sail"
  const isRefresh = productFormStyle === "refresh"
  const useDividers = sectionDividers
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  const set = (key: string, value: any) => onChange({ [key]: value })
  const metadataRows: { key: string; value: string }[] = data.metadataRows ?? [{ key: "", value: "" }]
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([])
  const activeToggleRowClass = tokens.toggleRow
  const activeToggleBlockGapClass = isSail ? "gap-[16px]" : isRefresh ? "gap-[12px]" : "gap-[10px]"
  const activeToggleBlockSurfaceClass = isRefresh ? "bg-[#F6F9FC]" : "bg-[#F6F8FA]"
  const childSettingBlockClass = (enabled: boolean) =>
    `flex flex-col transition-[padding] duration-200 ease-out ${useDividers ? (isSail ? "px-[24px] py-[12px]" : "px-[16px] py-[12px]") : ""} ${activeToggleBlockGapClass} ${getChildSettingFillClass(childSettingStyle, enabled, { surface: activeToggleBlockSurfaceClass, padding: "px-[12px] py-[10px]" }, { divided: useDividers })}`
  const childSettingContentClass = getChildSettingContentClass(childSettingStyle, {
    surface: activeToggleBlockSurfaceClass,
    padding: "px-[12px] py-[8px]",
    isRefresh,
  })
  const toggleGroupClass = useDividers
    ? `${flush ? (isSail ? "-mx-[24px]" : "-mx-[16px]") : ""} ${isRefresh && childSettingStyle === "filled" ? "px-[4px]" : ""} flex flex-col divide-y-[0.5px] ${isRefresh ? "divide-[#EAF0F6]" : "divide-[#E3E8EF]"}`
    : "flex flex-col gap-[20px]"

  return (
    <div className={toggleGroupClass}>
      <div className={childSettingBlockClass(Boolean(data.subscriptionCoupons))}>
        <div className={activeToggleRowClass}>
          <span>Coupons</span>
          <Toggle checked={Boolean(data.subscriptionCoupons)} onChange={(v) => set("subscriptionCoupons", v)} />
        </div>
        <Expandable show={Boolean(data.subscriptionCoupons)}>
          <div className={childSettingContentClass}>
            <MultiSelectDropdown
              placeholder="Choose coupons"
              items={MOCK_COUPONS}
              selectedIds={selectedCoupons}
              onChange={setSelectedCoupons}
              addNewLabel="+ Add new coupon"
              onAddNew={() => onAddObject?.("coupon")}
              autoFocus
            />
          </div>
        </Expandable>
      </div>

      <div className={childSettingBlockClass(Boolean(data.metadataEnabled))}>
        <div className={activeToggleRowClass}>
          <span>Metadata</span>
          <Toggle checked={Boolean(data.metadataEnabled)} onChange={(v) => set("metadataEnabled", v)} />
        </div>
        <Expandable show={Boolean(data.metadataEnabled)}>
          <div className={childSettingContentClass}>
            <MetadataRows
              rows={metadataRows}
              onChange={(rows) => set("metadataRows", rows)}
            />
          </div>
        </Expandable>
      </div>

      <div className={childSettingBlockClass(Boolean(data.descriptionEnabled))}>
        <div className={activeToggleRowClass}>
          <span>Description</span>
          <Toggle checked={Boolean(data.descriptionEnabled)} onChange={(v) => set("descriptionEnabled", v)} />
        </div>
        <Expandable show={Boolean(data.descriptionEnabled)}>
          <div className={childSettingContentClass}>
            <textarea
              className={tokens.textareaClass}
              placeholder="Custom subscription plan"
              value={data.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
        </Expandable>
      </div>

      <div className={childSettingBlockClass(Boolean(data.trialEnabled))}>
        <div className={activeToggleRowClass}>
          <span>Trial period</span>
          <Toggle checked={Boolean(data.trialEnabled)} onChange={(v) => set("trialEnabled", v)} />
        </div>
        <Expandable show={Boolean(data.trialEnabled)}>
          <div className={`${childSettingContentClass} flex flex-col gap-[12px]`}>
            <div className="flex items-center gap-[8px]">
              <span className="rounded-[6px] border border-[#D8DEE4] bg-white px-[10px] py-[4px] text-[13px] font-[500] text-[#1A2C44]">
                {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span className="text-[13px] text-[#596171]">&rarr;</span>
              <CustomSelect
                value={data.trialEnd ?? "14_days"}
                onChange={(v) => set("trialEnd", v)}
                options={TRIAL_DURATION_OPTIONS}
              />
            </div>
            <CustomSelect
              label="When trial ends without a payment method"
              value={data.trialEndBehavior ?? "continue"}
              onChange={(v) => set("trialEndBehavior", v)}
              options={TRIAL_END_OPTIONS}
            />
          </div>
        </Expandable>
      </div>
    </div>
  )
}

// ── Page: Invoice options ──────────────────────────────────────────────

function InvoiceOptionsPage({ data, onChange, onAddObject, flush = true }: {
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
  onAddObject?: (kind: string, existingId?: string, initialData?: Record<string, any>) => void
  flush?: boolean
}) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const { childSettingStyle } = useChildSettingStyle()
  const { sectionDividers } = useSectionDividers()
  const isSail = productFormStyle === "sail"
  const isRefresh = productFormStyle === "refresh"
  const useDividers = sectionDividers
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  const set = (key: string, value: any) => onChange({ [key]: value })
  const customFieldRows: { name: string; value: string }[] = data.customFieldRows ?? [{ name: "", value: "" }]
  const activeToggleRowClass = tokens.toggleRow
  const activeToggleBlockGapClass = isSail ? "gap-[16px]" : isRefresh ? "gap-[12px]" : "gap-[10px]"
  const activeToggleBlockSurfaceClass = isRefresh ? "bg-[#F6F9FC]" : "bg-[#F6F8FA]"
  const childSettingBlockClass = (enabled: boolean) =>
    `flex flex-col transition-[padding] duration-200 ease-out ${useDividers ? (isSail ? "px-[24px] py-[12px]" : "px-[16px] py-[12px]") : ""} ${activeToggleBlockGapClass} ${getChildSettingFillClass(childSettingStyle, enabled, { surface: activeToggleBlockSurfaceClass, padding: "px-[12px] py-[10px]" }, { divided: useDividers })}`
  const childSettingContentClass = getChildSettingContentClass(childSettingStyle, {
    surface: activeToggleBlockSurfaceClass,
    padding: "px-[12px] py-[8px]",
    isRefresh,
  })
  const toggleGroupClass = useDividers
    ? `${flush ? (isSail ? "-mx-[24px]" : "-mx-[16px]") : ""} ${isRefresh && childSettingStyle === "filled" ? "px-[4px]" : ""} flex flex-col divide-y-[0.5px] ${isRefresh ? "divide-[#EAF0F6]" : "divide-[#E3E8EF]"}`
    : "flex flex-col gap-[20px]"

  return (
    <div className={toggleGroupClass}>
      <div className={childSettingBlockClass(Boolean(data.invoiceTemplate))}>
        <div className={activeToggleRowClass}>
          <span>Invoice template</span>
          <Toggle checked={Boolean(data.invoiceTemplate)} onChange={(v) => set("invoiceTemplate", v)} />
        </div>
        <Expandable show={Boolean(data.invoiceTemplate)}>
          <div className={childSettingContentClass}>
            <CustomSelect
              value={data.templateId ?? ""}
              onChange={(v) => set("templateId", v)}
              options={[
                ...TEMPLATE_OPTIONS,
                ...((data._createdTemplates ?? []) as { id: string; name: string }[]).map((template) => ({
                  value: template.id,
                  label: template.name,
                })),
              ]}
              footerAction={{
                label: "+ Create new template",
                onClick: () => onAddObject?.("_invoiceTemplate"),
              }}
            />
          </div>
        </Expandable>
      </div>

      <div className={childSettingBlockClass(Boolean(data.invoiceMemo))}>
        <div className={activeToggleRowClass}>
          <span>Invoice memo</span>
          <Toggle checked={Boolean(data.invoiceMemo)} onChange={(v) => set("invoiceMemo", v)} />
        </div>
        <Expandable show={Boolean(data.invoiceMemo)}>
          <div className={`${childSettingContentClass} flex flex-col gap-[6px]`}>
            <span className={tokens.helperClass}>Up to 500 characters</span>
            <textarea
              className={tokens.textareaClass}
              placeholder=""
              maxLength={500}
              value={data.memoText ?? ""}
              onChange={(e) => set("memoText", e.target.value)}
            />
          </div>
        </Expandable>
      </div>

      <div className={childSettingBlockClass(Boolean(data.invoiceFooter))}>
        <div className={activeToggleRowClass}>
          <span>Invoice footer</span>
          <Toggle checked={Boolean(data.invoiceFooter)} onChange={(v) => set("invoiceFooter", v)} />
        </div>
        <Expandable show={Boolean(data.invoiceFooter)}>
          <div className={childSettingContentClass}>
            <textarea
              className={tokens.textareaClass}
              placeholder=""
              value={data.footerText ?? ""}
              onChange={(e) => set("footerText", e.target.value)}
            />
          </div>
        </Expandable>
      </div>

      <div className={childSettingBlockClass(Boolean(data.invoiceCustomFields))}>
        <div className={activeToggleRowClass}>
          <span>Invoice custom fields</span>
          <Toggle checked={Boolean(data.invoiceCustomFields)} onChange={(v) => set("invoiceCustomFields", v)} />
        </div>
        <Expandable show={Boolean(data.invoiceCustomFields)}>
          <div className={childSettingContentClass}>
            <CustomFieldRows
              rows={customFieldRows}
              onChange={(rows) => set("customFieldRows", rows)}
            />
          </div>
        </Expandable>
      </div>
    </div>
  )
}

// ── Main Form ──────────────────────────────────────────────────────────

export type SubscriptionActivePage = "subscription" | "billing" | "options" | "invoice"

type SubscriptionFormProps = {
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
  errorFields?: Set<string>
  onAddObject?: (kind: string, existingId?: string, initialData?: Record<string, any>) => void
}

function StandardSubscriptionSection({ title, children }: {
  title: string
  children: ReactNode
}) {
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)
  return (
    <section className="flex flex-col gap-[12px]">
      {title && (
        <h3 className={tokens.sectionTitle}>
          {title}
        </h3>
      )}
      {children}
    </section>
  )
}

// Compose variant (navStyle "compose"): one flat form — Customer + billing essentials with
// NO "Billing and payments" header — then "+ Add" chips that reveal Subscription options /
// Invoice options inline. Mirrors the compose-disclosure pattern used by the Simple/Customer example.
// Dividers follow the global Section-dividers option (defaults to Hide — see sectionDividers.tsx).
function SubscriptionComposeForm({ data, onChange, errorFields, onAddObject, itemsDropdownRef }: {
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
  errorFields?: Set<string>
  onAddObject?: (kind: string, existingId?: string, initialData?: Record<string, any>) => void
  itemsDropdownRef: React.RefObject<EntityDropdownHandle | null>
}) {
  const OPTIONAL_GROUPS = [
    { id: "options", title: "Subscription options" },
    { id: "invoice", title: "Invoice options" },
  ] as const
  // Collapsed-row summary: enabled items, else a muted blurb of what the section holds.
  const summarize = (id: string) => {
    if (id === "options") {
      const on: string[] = []
      if (data.subscriptionCoupons) on.push("Coupons")
      if (data.metadataEnabled) on.push("Metadata")
      if (data.descriptionEnabled) on.push("Description")
      if (data.trialEnabled) on.push("Trial period")
      return on.length ? on.join(" · ") : "Coupons, metadata, description, trial"
    }
    const on: string[] = []
    if (data.invoiceTemplate) on.push("Template")
    if (data.invoiceMemo) on.push("Memo")
    if (data.invoiceFooter) on.push("Footer")
    if (data.invoiceCustomFields) on.push("Custom fields")
    return on.length ? on.join(" · ") : "Template, memo, footer, custom fields"
  }
  const [added, setAdded] = useState<string[]>([])
  const [open, setOpen] = useState<string | null>(null)
  const remaining = OPTIONAL_GROUPS.filter((g) => !added.includes(g.id))
  const addGroup = (id: string) => { setAdded((a) => (a.includes(id) ? a : [...a, id])); setOpen(id) }

  const body = (
    <div className="flex flex-col gap-[16px]">
      {/* Essentials: customer + billing, no section headers. */}
      <SubscriptionPage
        data={data}
        onChange={onChange}
        errorFields={errorFields}
        onAddObject={onAddObject}
        itemsDropdownRef={itemsDropdownRef}
        topPadding={false}
        customerLabel="Account"
      />
      <BillingPage data={data} onChange={onChange} topPadding={false} />

      {/* Optional groups + "+ Add" chips share one tight region (8px), sitting on the same
          16px rhythm below the essentials. No "Optional fields" header for the subscription flow. */}
      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {added.map((id) => {
            const group = OPTIONAL_GROUPS.find((g) => g.id === id)!
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: "hidden" }}
              >
                <ComposeGroup
                  title={group.title}
                  open={open === id}
                  onToggle={() => setOpen(open === id ? null : id)}
                  summary={summarize(id)}
                >
                  {id === "options" ? (
                    <SubscriptionOptionsPage data={data} onChange={onChange} onAddObject={onAddObject} />
                  ) : (
                    <InvoiceOptionsPage data={data} onChange={onChange} onAddObject={onAddObject} />
                  )}
                </ComposeGroup>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {remaining.length > 0 && (
          <div className="flex flex-wrap gap-[8px]">
            {remaining.map((g) => (
              <AddChip key={g.id} title={g.title} onClick={() => addGroup(g.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return body
}

export function SubscriptionForm({ data, onChange, errorFields, onAddObject }: SubscriptionFormProps) {
  const itemsDropdownRef = useRef<EntityDropdownHandle>(null)
  const activePage = data._activePage as SubscriptionActivePage | undefined

  if (activePage === "billing") {
    return <BillingPage data={data} onChange={onChange} />
  }

  if (activePage === "options") {
    return <SubscriptionOptionsPage data={data} onChange={onChange} onAddObject={onAddObject} />
  }

  if (activePage === "invoice") {
    return <InvoiceOptionsPage data={data} onChange={onChange} onAddObject={onAddObject} />
  }

  if (activePage === "subscription") {
    return (
      <SubscriptionPage
        data={data}
        onChange={onChange}
        errorFields={errorFields}
        onAddObject={onAddObject}
        itemsDropdownRef={itemsDropdownRef}
      />
    )
  }

  if (data._navStyle === "compose") {
    return (
      <SubscriptionComposeForm
        data={data}
        onChange={onChange}
        errorFields={errorFields}
        onAddObject={onAddObject}
        itemsDropdownRef={itemsDropdownRef}
      />
    )
  }

  const sectioned = (
    <div className="flex flex-col gap-[22px]">
      <StandardSubscriptionSection title="">
        <SubscriptionPage
          data={data}
          onChange={onChange}
          errorFields={errorFields}
          onAddObject={onAddObject}
          itemsDropdownRef={itemsDropdownRef}
          topPadding={false}
          customerLabel="Account"
        />
      </StandardSubscriptionSection>
      <StandardSubscriptionSection title="Billing and payments">
        <BillingPage
          data={data}
          onChange={onChange}
          topPadding={false}
        />
      </StandardSubscriptionSection>
      <StandardSubscriptionSection title="Subscription options">
        <SubscriptionOptionsPage
          data={data}
          onChange={onChange}
          onAddObject={onAddObject}
        />
      </StandardSubscriptionSection>
      <StandardSubscriptionSection title="Invoice options">
        <InvoiceOptionsPage
          data={data}
          onChange={onChange}
          onAddObject={onAddObject}
        />
      </StandardSubscriptionSection>
    </div>
  )

  return sectioned
}
