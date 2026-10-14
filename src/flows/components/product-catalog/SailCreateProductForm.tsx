'use client'

import { useId, type ReactNode } from "react"

import { CurrencyFlag } from "@/components/CurrencyFlag"
import { Selector } from "@/components/Selector"
import { SegmentedControl } from "@/components/SegmentedControl"

const chargeFrequencyOptions = ["Recurring", "One-off"]
const billingPeriodOptions = ["Daily", "Weekly", "Monthly", "Yearly", "Every 3 months", "Every 6 months"]

const labelClass = "text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#353A44]"
const helperClass = "text-[12px] font-[400] leading-[16px] tracking-[0] text-[#596171]"
const inputClass =
  "h-[30px] w-full rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#353A44] placeholder:text-[#818DA0] outline-none transition-all hover:border-[#B6C0CD] focus:border-[#088EF9] focus:shadow-[0_0_0_4px_rgba(8,142,249,0.36)]"
const textareaClass =
  "min-h-[88px] w-full resize-y rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] py-[4px] text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#353A44] placeholder:text-[#818DA0] outline-none transition-all hover:border-[#B6C0CD] focus:border-[#088EF9] focus:shadow-[0_0_0_4px_rgba(8,142,249,0.36)]"
const selectButtonClass =
  "h-[30px] w-full justify-between rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] py-[4px] text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#353A44] shadow-none"

function SailDropdownIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="12" viewBox="0 0 9 12" fill="none" className="h-[12px] w-[8.6px] shrink-0">
      <path fillRule="evenodd" clipRule="evenodd" d="M0.226171 7.24258C0.534026 6.92566 1.0405 6.91831 1.35742 7.22617L4.30003 10.0846L7.24258 7.22622C7.55949 6.91836 8.06597 6.92571 8.37383 7.24263C8.68169 7.55954 8.67434 8.06602 8.35742 8.37388L4.85745 11.7738C4.70224 11.9246 4.50113 12 4.30003 12C4.09893 12 3.89783 11.9246 3.74261 11.7738L0.242579 8.37383C-0.0743389 8.06597 -0.081685 7.5595 0.226171 7.24258Z" fill="#474E5A" />
      <path fillRule="evenodd" clipRule="evenodd" d="M3.74261 0.22617C3.89783 0.0753911 4.09893 1.15422e-06 4.30003 0C4.50113 -1.15424e-06 4.70224 0.0753906 4.85746 0.226175L8.35743 3.62613C8.67434 3.93398 8.68168 4.44046 8.37383 4.75738C8.06597 5.07429 7.55949 5.08163 7.24257 4.77378L4.30003 1.91532L1.35742 4.77378C1.0405 5.08164 0.534026 5.07429 0.226171 4.75737C-0.081685 4.44046 -0.0743389 3.93398 0.242579 3.62612L3.74261 0.22617Z" fill="#474E5A" />
    </svg>
  )
}

type SailCreateProductFormProps = {
  t: (key: string) => string

  productName: string
  setProductName: (next: string) => void

  productDescription: string
  setProductDescription: (next: string) => void

  productTaxCode: string
  setProductTaxCode: (next: string) => void

  chargeFrequency: string
  setChargeFrequency: (next: string) => void

  billingPeriod: string
  setBillingPeriod: (next: string) => void

  includeTax: string
  setIncludeTax: (next: string) => void

  pricingCurrencyCode: string
  currencyOptions: string[]
  currencyDisplayNames: Intl.DisplayNames | null
  onChangeCurrency: (code: string) => void

  amount: string
  setAmount: (next: string) => void
}

function Field({
  label,
  helper,
  htmlFor,
  children,
}: {
  label: string
  helper?: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-[4px]">
      <div className="flex flex-col">
        <label className={labelClass} htmlFor={htmlFor}>{label}</label>
        {helper && <p className={helperClass}>{helper}</p>}
      </div>
      {children}
    </div>
  )
}

export function SailCreateProductForm({
  t,
  productName,
  setProductName,
  productDescription,
  setProductDescription,
  chargeFrequency,
  setChargeFrequency,
  billingPeriod,
  setBillingPeriod,
  pricingCurrencyCode,
  currencyOptions,
  currencyDisplayNames,
  onChangeCurrency,
  amount,
  setAmount,
}: SailCreateProductFormProps) {
  const productNameId = useId()
  const descriptionId = useId()
  const amountId = useId()

  return (
    <div className="px-[16px] py-[16px]">
      <div className="flex flex-col gap-[16px]">
        <Field
          label={t("Product name")}
          htmlFor={productNameId}
        >
          <input
            id={productNameId}
            value={productName}
            onChange={(event) => setProductName(event.target.value)}
            placeholder={t("API access")}
            className={inputClass}
          />
        </Field>

        <Field label={t("Description")} htmlFor={descriptionId}>
          <textarea
            id={descriptionId}
            value={productDescription}
            onChange={(event) => setProductDescription(event.target.value)}
            placeholder={t("Describe the product or service")}
            className={textareaClass}
          />
        </Field>

        <div className="flex flex-col gap-[8px]">
          <p className={labelClass}>{t("Pricing")}</p>

          <SegmentedControl options={chargeFrequencyOptions} value={chargeFrequency} onChange={setChargeFrequency} getDisplayValue={t} />

          <Field label={t("Amount")} htmlFor={amountId}>
            <div className="flex items-stretch rounded-[6px] border border-[#D8DEE4] bg-white transition-all focus-within:border-[#088EF9] focus-within:shadow-[0_0_0_4px_rgba(8,142,249,0.36)] hover:border-[#B6C0CD]">
              <div className="flex min-w-0 flex-1 items-center gap-[6px] px-[8px] py-[4px]">
                <span className="text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#353A44]">$</span>
                <input
                  id={amountId}
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                  className="min-w-0 flex-1 bg-transparent text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#353A44] placeholder:text-[#818DA0] outline-none"
                />
              </div>
              <Selector
                ariaLabel={t("Select currency")}
                options={currencyOptions}
                value={pricingCurrencyCode}
                onChange={onChangeCurrency}
                size="md"
                searchable
                searchPlaceholder={t("Search currencies")}
                placeholder={t("Select currency")}
                getSearchKey={(code) => {
                  const name = currencyDisplayNames?.of(code) ?? ""
                  return `${code} ${name}`
                }}
                renderOption={(code) => {
                  const name = currencyDisplayNames?.of(code)
                  return (
                    <div className="flex min-w-0 flex-1 items-center gap-[8px]">
                      <CurrencyFlag currency={code} className="shrink-0" />
                      <span className="w-[29px] flex-none font-[500] text-[#353A44]">{code}</span>
                      <span className="truncate font-[500] text-[#818DA0]">{name}</span>
                    </div>
                  )
                }}
                chevronIcon={<SailDropdownIcon />}
                buttonClassName="h-[30px] rounded-l-none border-0 border-l border-[#D8DEE4] px-[8px] py-[4px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#353A44] shadow-none"
              />
            </div>
          </Field>

          {chargeFrequency !== "One-off" && (
            <Field label={t("Billing period")}>
              <Selector
                ariaLabel={t("Billing period")}
                options={billingPeriodOptions}
                value={billingPeriod}
                onChange={setBillingPeriod}
                size="md"
                getDisplayValue={t}
                fullWidth
                chevronIcon={<SailDropdownIcon />}
                buttonClassName={selectButtonClass}
              />
            </Field>
          )}

          <button
            type="button"
            className="-ml-[8px] w-fit rounded-[6px] px-[8px] py-[4px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#533AFD] transition-all hover:bg-[#F0EDFF] hover:text-[#4730E0]"
          >
            {t("More pricing options")} →
          </button>
        </div>
      </div>
    </div>
  )
}
