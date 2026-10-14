'use client'

import type { ChangeEvent, DragEvent } from "react"
import { useRef, useState } from "react"

import { Selector } from "@/components/Selector"
import { CurrencyFlag } from "@/components/CurrencyFlag"
import { PhotoIcon } from "@/components/ProductCatalogIcons"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"

const productTaxCodes = ["Account default", "Digital", "Physical", "Service"]
const chargeFrequencyOptions = ["Recurring", "One-off"]
const billingPeriodOptions = ["Daily", "Weekly", "Monthly", "Yearly", "Every 3 months", "Every 6 months"]
const includeTaxOptions = ["Taxes included", "Taxes excluded", "Auto"]

type SimplifiedCreateProductFormProps = {
  t: (key: string) => string

  productName: string
  setProductName: (next: string) => void

  productDescription: string
  setProductDescription: (next: string) => void

  productImageUrl: string | null
  setProductImageUrl: (next: string | null) => void

  productTaxCode: string
  setProductTaxCode: (next: string) => void

  chargeFrequency: string
  setChargeFrequency: (next: string) => void

  billingPeriod: string
  setBillingPeriod: (next: string) => void

  includeTax: string
  setIncludeTax: (next: string) => void

  // Price (single currency)
  pricingCurrencyCode: string
  currencyOptions: string[]
  currencyDisplayNames: Intl.DisplayNames | null
  onChangeCurrency: (code: string) => void

  amount: string
  setAmount: (next: string) => void
}

function SelectRow({
  label,
  right,
  isRefresh,
}: {
  label: string
  right: React.ReactNode
  isRefresh: boolean
}) {
  return (
    <div className="flex items-center justify-between bg-white px-[16px] py-[8px]">
      <p className={`text-[12px] font-[400] leading-[16px] tracking-[-0.024px] ${isRefresh ? "text-[#142234]" : "text-[#353A44]"}`}>{label}</p>
      {right}
    </div>
  )
}

export function SimplifiedCreateProductForm({
  t,
  productName,
  setProductName,
  productDescription,
  setProductDescription,
  productImageUrl,
  setProductImageUrl,
  productTaxCode,
  setProductTaxCode,
  chargeFrequency,
  setChargeFrequency,
  billingPeriod,
  setBillingPeriod,
  includeTax,
  setIncludeTax,
  pricingCurrencyCode,
  currencyOptions,
  currencyDisplayNames,
  onChangeCurrency,
  amount,
  setAmount,
}: SimplifiedCreateProductFormProps) {
  const { productFormStyle } = useProductFormStyle()
  const isRefresh = productFormStyle === "refresh"
  const bigNameInputClasses = isRefresh
    ? "min-w-0 flex-1 bg-transparent text-[18px] font-[500] leading-[normal] text-[#142234] placeholder:text-[#68778B] outline-none"
    : "min-w-0 flex-1 bg-transparent text-[18px] font-[500] leading-[normal] text-[#353A44] placeholder:text-[#6C7688] outline-none"
  const descriptionTextareaClasses = isRefresh
    ? "min-h-[120px] w-full resize-none bg-transparent text-[14px] font-[400] leading-[normal] text-[#142234] placeholder:text-[#68778B] outline-none"
    : "min-h-[120px] w-full resize-none bg-transparent text-[14px] font-[400] leading-[normal] text-[#353A44] placeholder:text-[#6C7688] outline-none"
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)

  const handleFile = (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith("image/")) return
    const nextUrl = URL.createObjectURL(file)
    setProductImageUrl(nextUrl)
  }

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.item(0) ?? null
    handleFile(file)
  }

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragActive(false)
    const file = event.dataTransfer.files?.item(0) ?? null
    handleFile(file)
  }

  return (
    <div className="pb-[8px]">
      {/* Top fields */}
      <div className="px-[16px]">
        <div className="flex items-center gap-[8px] pb-[16px] pt-[16px]">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
          />

          <div
            className={`group flex shrink-0 items-center overflow-hidden rounded-[6px] p-[8px] transition-colors ${
              isDragActive
                ? "bg-[#EFECFC] outline outline-1 outline-dashed outline-[#675DFF] outline-offset-[-1px]"
                : "bg-[#F5F6F8] hover:bg-[#EFECFC]"
            }`}
            role="button"
            tabIndex={0}
            aria-label={t("Upload image")}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                fileInputRef.current?.click()
              }
            }}
            onDragEnter={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsDragActive(true)
            }}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsDragActive(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsDragActive(false)
            }}
            onDrop={handleDrop}
          >
            {productImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={productImageUrl} alt="" className="size-[20px] rounded-[3px] object-cover" />
            ) : (
              <PhotoIcon
                size={20}
                className={
                  isDragActive ? "text-[#675DFF]" : "text-[#6C7688] group-hover:text-[#675DFF] transition-colors"
                }
              />
            )}
          </div>

          <input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder={t("Product name")}
            aria-label={t("Product name")}
            className={bigNameInputClasses}
          />
        </div>

        <textarea
          value={productDescription}
          onChange={(e) => setProductDescription(e.target.value)}
          placeholder={t("Briefly describe this product")}
          aria-label={t("Description")}
          className={descriptionTextareaClasses}
        />
      </div>

      {/* Rows */}
      <div className="mt-[8px]">
        <SelectRow
          label={t("Product tax code")}
          isRefresh={isRefresh}
          right={
            <Selector
              ariaLabel={t("Product tax code")}
              options={productTaxCodes}
              value={productTaxCode}
              onChange={setProductTaxCode}
              size="sm"
              getDisplayValue={t}
              buttonClassName={`h-[32px] justify-between border ${isRefresh ? "border-[#D5DEE7]" : "border-[#D8DEE4]"} px-[12px] py-[8px] text-[12px] font-[500] ${isRefresh ? "text-[#142234]" : "text-[#353A44]"}`}
            />
          }
        />

        <SelectRow
          label={t("Charge frequency")}
          isRefresh={isRefresh}
          right={
            <Selector
              ariaLabel={t("Charge frequency")}
              options={chargeFrequencyOptions}
              value={chargeFrequency}
              onChange={setChargeFrequency}
              size="sm"
              getDisplayValue={t}
              buttonClassName={`h-[32px] justify-between border ${isRefresh ? "border-[#D5DEE7]" : "border-[#D8DEE4]"} px-[12px] py-[8px] text-[12px] font-[500] ${isRefresh ? "text-[#142234]" : "text-[#353A44]"}`}
            />
          }
        />

        {chargeFrequency !== "One-off" && (
          <SelectRow
            label={t("Billing period")}
            isRefresh={isRefresh}
            right={
              <Selector
                ariaLabel={t("Billing period")}
                options={billingPeriodOptions}
                value={billingPeriod}
                onChange={setBillingPeriod}
                size="sm"
                getDisplayValue={t}
                buttonClassName={`h-[32px] justify-between border ${isRefresh ? "border-[#D5DEE7]" : "border-[#D8DEE4]"} px-[12px] py-[8px] text-[12px] font-[500] ${isRefresh ? "text-[#142234]" : "text-[#353A44]"}`}
              />
            }
          />
        )}

        <SelectRow
          label={t("Taxes")}
          isRefresh={isRefresh}
          right={
            <Selector
              ariaLabel={t("Taxes")}
              options={includeTaxOptions}
              value={includeTax}
              onChange={setIncludeTax}
              size="sm"
              getDisplayValue={t}
              buttonClassName={`h-[32px] justify-between border ${isRefresh ? "border-[#D5DEE7]" : "border-[#D8DEE4]"} px-[12px] py-[8px] text-[12px] font-[500] ${isRefresh ? "text-[#142234]" : "text-[#353A44]"}`}
            />
          }
        />

        <SelectRow
          label={t("Price")}
          isRefresh={isRefresh}
          right={
            <div className="flex w-[160px] items-stretch">
              <div className={`flex h-[32px] min-w-0 flex-1 items-center gap-[4px] rounded-bl-[6px] rounded-tl-[6px] border ${isRefresh ? "border-[#D5DEE7]" : "border-[#D8DEE4]"} bg-white p-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] ${isRefresh ? "text-[#68778B]" : "text-[#6C7688]"}`}>
                <span>$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-label={t("Amount")}
                  className={`min-w-0 flex-1 bg-transparent text-[12px] font-[500] leading-[16px] tracking-[-0.024px] ${isRefresh ? "text-[#142234]" : "text-[#353A44]"} ${isRefresh ? "placeholder:text-[#68778B]" : "placeholder:text-[#6C7688]"} outline-none`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <Selector
                ariaLabel={t("Select currency")}
                options={currencyOptions}
                value={pricingCurrencyCode}
                onChange={onChangeCurrency}
                size="sm"
                searchable
                searchPlaceholder={t("Search currencies")}
                placeholder={t("Select currency")}
                triggerIcon={<CurrencyFlag currency={pricingCurrencyCode} />}
                getSearchKey={(code) => {
                  const name = currencyDisplayNames?.of(code) ?? ""
                  return `${code} ${name}`
                }}
                renderOption={(code) => {
                  const name = currencyDisplayNames?.of(code)
                  return (
                    <div className="flex min-w-0 flex-1 items-center gap-[8px]">
                      <CurrencyFlag currency={code} className="shrink-0" />
                      <span className={`w-[29px] flex-none font-[500] ${isRefresh ? "text-[#142234]" : "text-[#353A44]"}`}>{code}</span>
                      <span className={`truncate font-[500] ${isRefresh ? "text-[#68778B]" : "text-[#818DA0]"}`}>{name}</span>
                    </div>
                  )
                }}
                buttonClassName={`h-[32px] w-[82px] rounded-l-none border-l-0 px-[12px] py-[8px] text-[12px] font-[500] ${isRefresh ? "text-[#142234]" : "text-[#353A44]"}`}
              />
            </div>
          }
        />
      </div>

      {/* subtle spacer so the last row isn't flush */}
      <div className="h-[4px]" />
    </div>
  )
}


