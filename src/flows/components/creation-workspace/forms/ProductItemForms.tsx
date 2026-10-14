'use client'

import type { ReactNode } from "react"
import { getFormTokens } from "./shared/formTokens"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { useInputFill } from "@/components/creation-workspace/inputFill"
import { CustomSelect } from "./shared/CustomSelect"
import { CURRENCY_OPTIONS } from "./shared/mockEntities"

// Lightweight forms for the extra item kinds the Advanced product editor can add
// alongside prices — rate cards, subscription fees, and credit grants. These
// intentionally stay small (a handful of fields) so the starter remains easy to
// vibecode; they mirror the field styling of PriceForm via getFormTokens.

type ItemFormProps = {
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  return (
    <div className="flex flex-col gap-[4px]">
      <label className={tokens.labelClass}>{label}</label>
      {children}
    </div>
  )
}

function TextField({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  return (
    <Field label={label}>
      <input className={tokens.inputClass} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  )
}

function AmountField({ label = "Amount", value, onChange }: { label?: string; value: string; onChange: (v: string) => void }) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  const prefixText =
    productFormStyle === "refresh" ? "text-[13px] text-[#3F5064]"
    : productFormStyle === "sail" ? "text-[14px] text-[#6C7688]"
    : "text-[12px] text-[#6C7688]"
  return (
    <Field label={label}>
      <div className="relative">
        <span className={`pointer-events-none absolute left-[10px] top-1/2 -translate-y-1/2 ${prefixText}`}>$</span>
        <input className={`${tokens.inputClass} !pl-[22px] !pr-[10px]`} placeholder="0.00" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </Field>
  )
}

export function SubscriptionFeeForm({ data, onChange }: ItemFormProps) {
  const set = (key: string, value: string) => onChange({ [key]: value })
  return (
    <div className="flex flex-col gap-[16px]">
      <TextField label="Name" placeholder="e.g. Platform fee" value={data.name ?? ""} onChange={(v) => set("name", v)} />
      <AmountField value={data.amount ?? ""} onChange={(v) => set("amount", v)} />
      <CustomSelect
        label="Billing period"
        value={data.billingPeriod ?? "monthly"}
        onChange={(v) => set("billingPeriod", v)}
        options={[
          { value: "daily", label: "Daily" },
          { value: "weekly", label: "Weekly" },
          { value: "monthly", label: "Monthly" },
          { value: "yearly", label: "Yearly" },
        ]}
      />
      <CustomSelect label="Currency" value={data.currency ?? "USD"} onChange={(v) => set("currency", v)} options={CURRENCY_OPTIONS} />
    </div>
  )
}

export function CreditGrantForm({ data, onChange }: ItemFormProps) {
  const set = (key: string, value: string) => onChange({ [key]: value })
  return (
    <div className="flex flex-col gap-[16px]">
      <TextField label="Name" placeholder="e.g. Onboarding credits" value={data.name ?? ""} onChange={(v) => set("name", v)} />
      <AmountField label="Credit amount" value={data.amount ?? ""} onChange={(v) => set("amount", v)} />
      <CustomSelect label="Currency" value={data.currency ?? "USD"} onChange={(v) => set("currency", v)} options={CURRENCY_OPTIONS} />
      <CustomSelect
        label="Expires"
        value={data.expiry ?? "never"}
        onChange={(v) => set("expiry", v)}
        options={[
          { value: "never", label: "Never" },
          { value: "30", label: "After 30 days" },
          { value: "90", label: "After 90 days" },
          { value: "365", label: "After 12 months" },
        ]}
      />
    </div>
  )
}

// A rate card just groups rates — the per-unit pricing lives on each nested rate
// (add them via "+ Add rate" in the tree).
export function RateCardForm({ data, onChange }: ItemFormProps) {
  const set = (key: string, value: string) => onChange({ [key]: value })
  return (
    <div className="flex flex-col gap-[16px]">
      <TextField label="Name" placeholder="e.g. API usage" value={data.name ?? ""} onChange={(v) => set("name", v)} />
    </div>
  )
}

// A single usage rate nested inside a rate card.
export function RateForm({ data, onChange }: ItemFormProps) {
  const set = (key: string, value: string) => onChange({ [key]: value })
  return (
    <div className="flex flex-col gap-[16px]">
      <TextField label="Name" placeholder="e.g. API requests" value={data.name ?? ""} onChange={(v) => set("name", v)} />
      <AmountField label="Unit price" value={data.amount ?? ""} onChange={(v) => set("amount", v)} />
      <TextField label="Per unit" placeholder="e.g. request" value={data.unitLabel ?? ""} onChange={(v) => set("unitLabel", v)} />
      <CustomSelect label="Currency" value={data.currency ?? "USD"} onChange={(v) => set("currency", v)} options={CURRENCY_OPTIONS} />
    </div>
  )
}
