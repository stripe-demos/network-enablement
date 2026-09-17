'use client'

import { getFormTokens } from "./shared/formTokens"
import { CustomSelect } from "./shared/CustomSelect"
import { SegmentedControl } from "@/components/SegmentedControl"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { useInputFill } from "@/components/creation-workspace/inputFill"

type BuyButtonFormProps = {
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
}

export const BUY_BUTTON_PRODUCTS = [
  { value: "pro", label: "Pro plan", price: "$20.00 / month" },
  { value: "starter", label: "Starter", price: "$10.00" },
  { value: "bundle", label: "Team bundle", price: "$120.00 / year" },
  { value: "donation", label: "Support us", price: "Custom amount" },
] as const

export const BUY_BUTTON_COLORS = ["#635BFF", "#1A1A1A", "#0A66C2", "#15803D", "#DB2777"] as const

const CTA_OPTIONS = [
  { value: "Pay", label: "Pay" },
  { value: "Buy now", label: "Buy now" },
  { value: "Subscribe", label: "Subscribe" },
  { value: "Donate", label: "Donate" },
]

const BUTTON_TYPES = ["Button", "Card widget"] as const
const SHAPES = ["Sharp", "Rounded", "Pill"] as const

// Select chrome mirrors the coupon/invoice forms so the buy-button form matches
// the other creation forms across the three UI styles.
const refreshSelectButtonClass =
  "flex h-[32px] w-full items-center justify-between rounded-[6px] border border-[#D5DEE7] bg-white px-[10px] text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#142234] outline-none transition-all hover:border-[#C1CCD7] focus:border-[#A0C8F0] focus:shadow-[0_0_0_4px_rgba(8,142,249,0.2)]"
const refreshSelectOptionClass = "text-[13px] font-[575] leading-[20px] tracking-[-0.065px]"
const selectButtonClass =
  "flex h-[30px] w-full items-center justify-between rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#353A44] outline-none transition-all hover:border-[#B6C0CD] focus:border-[#088EF9] focus:shadow-[0_0_0_4px_rgba(8,142,249,0.36)]"
const selectOptionClass = "text-[14px] leading-[20px] tracking-[-0.15px]"

function SailDropdownIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="12" viewBox="0 0 9 12" fill="none" className="h-[12px] w-[8.6px] shrink-0">
      <path fillRule="evenodd" clipRule="evenodd" d="M0.226171 7.24258C0.534026 6.92566 1.0405 6.91831 1.35742 7.22617L4.30003 10.0846L7.24258 7.22622C7.55949 6.91836 8.06597 6.92571 8.37383 7.24263C8.68169 7.55954 8.67434 8.06602 8.35742 8.37388L4.85745 11.7738C4.70224 11.9246 4.50113 12 4.30003 12C4.09893 12 3.89783 11.9246 3.74261 11.7738L0.242579 8.37383C-0.0743389 8.06597 -0.081685 7.5595 0.226171 7.24258Z" fill="#474E5A" />
      <path fillRule="evenodd" clipRule="evenodd" d="M3.74261 0.22617C3.89783 0.0753911 4.09893 1.15422e-06 4.30003 0C4.50113 -1.15424e-06 4.70224 0.0753906 4.85746 0.226175L8.35743 3.62613C8.67434 3.93398 8.68168 4.44046 8.37383 4.75738C8.06597 5.07429 7.55949 5.08163 7.24257 4.77378L4.30003 1.91532L1.35742 4.77378C1.0405 5.08164 0.534026 5.07429 0.226171 4.75737C-0.081685 4.44046 -0.0743389 3.93398 0.242579 3.62612L3.74261 0.22617Z" fill="#474E5A" />
    </svg>
  )
}

export function BuyButtonForm({ data, onChange }: BuyButtonFormProps) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  const isSail = productFormStyle === "sail"
  const isRefresh = productFormStyle === "refresh"
  const labelClass = tokens.labelClass
  const activeSelectButtonClass = isSail ? selectButtonClass : isRefresh ? refreshSelectButtonClass : undefined
  const activeSelectOptionClass = isSail ? selectOptionClass : isRefresh ? refreshSelectOptionClass : undefined
  const dropdownIcon = (isSail || isRefresh) ? <SailDropdownIcon /> : undefined

  const set = (key: string, value: string) => onChange({ [key]: value })
  const color = data.color ?? BUY_BUTTON_COLORS[0]

  return (
    <div className="flex flex-col gap-[16px]">
      <CustomSelect
        label="Product"
        value={data.product ?? "pro"}
        onChange={(v) => set("product", v)}
        options={BUY_BUTTON_PRODUCTS.map((p) => ({ value: p.value, label: p.label }))}
        buttonClassName={activeSelectButtonClass}
        chevronIcon={dropdownIcon}
        dropdownOptionClassName={activeSelectOptionClass}
        labelClassName={(isSail || isRefresh) ? labelClass : undefined}
      />

      <div className="flex flex-col gap-[8px]">
        <label className={labelClass}>Button type</label>
        <SegmentedControl
          value={data.buttonType ?? "Button"}
          onChange={(v) => set("buttonType", v)}
          options={BUTTON_TYPES}
        />
      </div>

      <CustomSelect
        label="Call to action"
        value={data.cta ?? "Pay"}
        onChange={(v) => set("cta", v)}
        options={CTA_OPTIONS}
        buttonClassName={activeSelectButtonClass}
        chevronIcon={dropdownIcon}
        dropdownOptionClassName={activeSelectOptionClass}
        labelClassName={(isSail || isRefresh) ? labelClass : undefined}
      />

      <div className="flex flex-col gap-[8px]">
        <label className={labelClass}>Button color</label>
        <div className="flex items-center gap-[8px]">
          {BUY_BUTTON_COLORS.map((swatch) => {
            const selected = color === swatch
            return (
              <button
                key={swatch}
                type="button"
                aria-label={swatch}
                aria-pressed={selected}
                onClick={() => set("color", swatch)}
                className={`h-[18px] w-[18px] rounded-full transition-shadow ${
                  selected
                    ? "shadow-[0_0_0_2px_#FFFFFF,0_0_0_3px_#8A94A6]"
                    : "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] hover:shadow-[0_0_0_2px_#FFFFFF,0_0_0_3px_#D4DEE9]"
                }`}
                style={{ backgroundColor: swatch }}
              />
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-[8px]">
        <label className={labelClass}>Corner shape</label>
        <SegmentedControl
          value={data.shape ?? "Rounded"}
          onChange={(v) => set("shape", v)}
          options={SHAPES}
        />
      </div>
    </div>
  )
}
