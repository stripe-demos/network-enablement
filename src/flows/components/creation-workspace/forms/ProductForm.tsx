'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { getFormTokens } from "./shared/formTokens"
import { CustomSelect } from "./shared/CustomSelect"
import { SegmentedControl } from "@/components/SegmentedControl"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { useInputFill } from "@/components/creation-workspace/inputFill"
import { ProductImageDropzone } from "@/components/creation-workspace/ProductImageDropzone"
import { CURRENCY_OPTIONS } from "./shared/mockEntities"

type PriceChip = {
  id: string
  name: string
  amount?: string
  pricingModel?: string
  billingPeriod?: string
  currency?: string
}

type ProductFormProps = {
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
  errorFields?: Set<string>
  onAddObject?: (kind: string, existingId?: string) => void
  hidePricing?: boolean
  hideProductDetails?: boolean
  /** Override the name field's label (e.g. "Pricing plan name"). Defaults to "Product name". */
  nameLabel?: string
  /** Override the name field's placeholder. Defaults to "API access". */
  namePlaceholder?: string
  /**
   * Demo-only: draw a cursor + hint pill at "More pricing options →" to signal it as the
   * control that escalates to the 80% modal. Used by the Related objects pattern page.
   */
  pointAtMoreOptions?: boolean
}

const productCategoryOptions = [
  { value: "general-electronics", label: "General — Electronics" },
  { value: "software", label: "Software" },
  { value: "business-services", label: "Business services" },
  { value: "education", label: "Education" },
  { value: "professional-services", label: "Professional services" },
  { value: "physical-goods", label: "General — Physical goods" },
  { value: "donations", label: "Donations" },
  { value: "restricted-goods", label: "Restricted goods" },
]

const ineligibleManagedPaymentCategories = new Set(["donations", "restricted-goods"])
const productCategoryDocsUrl = "https://docs.stripe.com/tax/tax-categories"

function ManagedPaymentsEligibility({ category }: { category: string }) {
  const { productFormStyle } = useProductFormStyle()
  const eligible = !ineligibleManagedPaymentCategories.has(category)
  const rowClass = productFormStyle === "refresh"
    ? "text-[13px] leading-[20px] tracking-[-0.065px] text-[#142234]"
    : "text-[12px] leading-[16px] tracking-[-0.024px] text-[#273951]"
  const badgeClass = eligible
    ? productFormStyle === "refresh"
      ? "rounded-full bg-[#E5FFD8] px-[7px] py-[1px] text-[12px] leading-[16px] text-[#197A16]"
      : "rounded-[5px] border border-[#A4E38B] bg-[#E5FFD8] px-[6px] py-[1px] text-[#197A16]"
    : productFormStyle === "refresh"
      ? "rounded-full bg-[#FFF2D8] px-[7px] py-[1px] text-[12px] leading-[16px] text-[#8A5A00]"
      : "rounded-[5px] border border-[#F3C969] bg-[#FFF8E8] px-[6px] py-[1px] text-[#8A5A00]"

  return (
    <div className={`flex items-center gap-[8px] ${rowClass}`}>
      <span>Managed payments</span>
      <span className={badgeClass}>{eligible ? "Eligible" : "Not eligible"}</span>
    </div>
  )
}

const errorInputClass =
  "h-[30px] w-full rounded-[6px] border border-[#DF1B41] bg-[#FFF5F5] px-3 text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#6C7688] outline-none focus:border-[#DF1B41] focus:shadow-[0_0_0_1.5px_rgba(223,27,65,0.2)] transition-all"

const sailTokens = getFormTokens("sail")
const sailSelectTriggerClass =
  "flex h-[30px] w-full items-center justify-between rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#353A44] outline-none transition-all hover:border-[#B6C0CD] focus:border-[#088EF9] focus:shadow-[0_0_0_4px_rgba(8,142,249,0.36)]"
const sailSelectOptionClass = "text-[14px] leading-[20px] tracking-[-0.15px]"

function SailDropdownIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="12" viewBox="0 0 9 12" fill="none" className="h-[12px] w-[8.6px] shrink-0">
      <path fillRule="evenodd" clipRule="evenodd" d="M0.226171 7.24258C0.534026 6.92566 1.0405 6.91831 1.35742 7.22617L4.30003 10.0846L7.24258 7.22622C7.55949 6.91836 8.06597 6.92571 8.37383 7.24263C8.68169 7.55954 8.67434 8.06602 8.35742 8.37388L4.85745 11.7738C4.70224 11.9246 4.50113 12 4.30003 12C4.09893 12 3.89783 11.9246 3.74261 11.7738L0.242579 8.37383C-0.0743389 8.06597 -0.081685 7.5595 0.226171 7.24258Z" fill="#474E5A" />
      <path fillRule="evenodd" clipRule="evenodd" d="M3.74261 0.22617C3.89783 0.0753911 4.09893 1.15422e-06 4.30003 0C4.50113 -1.15424e-06 4.70224 0.0753906 4.85746 0.226175L8.35743 3.62613C8.67434 3.93398 8.68168 4.44046 8.37383 4.75738C8.06597 5.07429 7.55949 5.08163 7.24257 4.77378L4.30003 1.91532L1.35742 4.77378C1.0405 5.08164 0.534026 5.07429 0.226171 4.75737C-0.081685 4.44046 -0.0743389 3.93398 0.242579 3.62612L3.74261 0.22617Z" fill="#474E5A" />
    </svg>
  )
}

// Demo-only affordance for the Related objects pattern page: an annotation callout that
// draws the eye to the "More pricing options →" link — the control that escalates the Simple
// modal into the 80% modal. A black dot sits next to the link, a hairline runs off to a black
// label chip. Purely decorative (pointer-events none) so it never intercepts the link's click.
function MorePricingPointer() {
  return (
    <div className="pointer-events-none absolute left-full top-1/2 z-10 ml-[10px] flex -translate-y-1/2 items-center">
      <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-[#1A2234]" />
      <span className="h-[1.5px] w-[26px] shrink-0 bg-[#1A2234]" />
      <span className="whitespace-nowrap rounded-[6px] bg-[#1A2234] px-[10px] py-[5px] text-[11px] font-[500] leading-[14px] text-white shadow-[0_6px_20px_-6px_rgba(10,16,28,0.35)]">
        Click to open the 80% modal
      </span>
    </div>
  )
}

function SailProductField({
  label,
  description,
  htmlFor,
  children,
}: {
  label: ReactNode
  description?: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-[4px]">
      <div className="flex flex-col">
        <label className={sailTokens.labelClass} htmlFor={htmlFor}>{label}</label>
        {description && <p className={sailTokens.helperClass}>{description}</p>}
      </div>
      {children}
    </div>
  )
}

function SailProductForm({
  data,
  onChange,
  errorFields,
  onAddObject,
  hidePricing,
  hideProductDetails,
  nameLabel = "Product name",
  namePlaceholder = "API access",
  pointAtMoreOptions = false,
}: ProductFormProps) {
  const nameId = useId()
  const descriptionId = useId()
  const amountId = useId()
  const set = (key: string, value: unknown) => onChange({ [key]: value })
  const prices: PriceChip[] = data._prices ?? []
  const pricingType = (data._pricingType ?? "recurring") as "recurring" | "one_off"

  return (
    <div className="flex flex-col pb-[16px]">
      <SailProductField
        label={nameLabel}
        htmlFor={nameId}
      >
        <input
          id={nameId}
          data-focus-field="name"
          className={errorFields?.has("name") ? errorInputClass : sailTokens.inputClass}
          placeholder={namePlaceholder}
          value={data.name ?? ""}
          onChange={(e) => set("name", e.target.value)}
        />
        {errorFields?.has("name") && (
          <p className="text-[11px] text-[#DF1B41]">Enter a product name</p>
        )}
      </SailProductField>

      <div className="h-[16px]" />

      <SailProductField label="Description" htmlFor={descriptionId}>
        <textarea
          id={descriptionId}
          data-focus-field="description"
          className={sailTokens.textareaClass}
          placeholder="Describe the product or service"
          value={data.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
        />
      </SailProductField>

      {!hideProductDetails && (
        <>
          <div className="h-[16px]" />

          <SailProductField label="Product image">
            <ProductImageDropzone
              imageUrl={data.imageUrl ?? null}
              onChange={(imageUrl) => set("imageUrl", imageUrl)}
            />
          </SailProductField>

          <div className="h-[16px]" />

          <div className="flex flex-col gap-[8px]">
            <SailProductField
              label={
                <>
                  Category <span className="font-[400] text-[#6C7688]">·</span>{" "}
                  <a className="font-[600] text-[#533AFD] hover:underline" href={productCategoryDocsUrl} target="_blank" rel="noreferrer">Docs</a>
                </>
              }
            >
              <CustomSelect
                label=""
                value={data.category ?? "general-electronics"}
                onChange={(category) => set("category", category)}
                options={productCategoryOptions}
                buttonClassName={sailSelectTriggerClass}
                chevronIcon={<SailDropdownIcon />}
                dropdownOptionClassName={sailSelectOptionClass}
              />
            </SailProductField>
            <ManagedPaymentsEligibility category={data.category ?? "general-electronics"} />
          </div>
        </>
      )}

      {!hidePricing && (
        <div className="flex flex-col pt-[16px]">
          {prices.length === 0 ? (
            <>
              <SailProductField label="Price type">
                <SegmentedControl
                  value={pricingType}
                  onChange={(v) => set("_pricingType", v)}
                  options={["recurring", "one_off"] as const}
                  getDisplayValue={(v) => (v === "recurring" ? "Recurring" : "One-off")}
                />
              </SailProductField>

              <div className="h-[16px]" />

              <SailProductField label="Amount" htmlFor={amountId}>
                <div className="flex items-center gap-[6px]">
                  <div className={`flex h-[30px] min-w-0 flex-1 items-center gap-[6px] rounded-[6px] border bg-white px-[8px] transition-all focus-within:shadow-[0_0_0_4px_rgba(8,142,249,0.20)] ${errorFields?.has("_inlineAmount") ? "border-[#DF1B41]" : "border-[#D8DEE4] hover:border-[#B6C0CD] focus-within:border-[#088EF9]"}`}>
                    <span className="text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#353A44]">$</span>
                    <input
                      id={amountId}
                      type="text"
                      inputMode="decimal"
                      className="min-w-0 flex-1 bg-transparent text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#353A44] placeholder:text-[#818DA0] outline-none"
                      placeholder="0.00"
                      value={data._inlineAmount ?? ""}
                      onChange={(e) => set("_inlineAmount", e.target.value)}
                    />
                  </div>
                  <div className="w-[84px] shrink-0">
                    <CustomSelect
                      label=""
                      value={data._inlineCurrency ?? "USD"}
                      onChange={(v) => set("_inlineCurrency", v)}
                      options={CURRENCY_OPTIONS}
                      buttonClassName={sailSelectTriggerClass}
                      chevronIcon={<SailDropdownIcon />}
                      dropdownOptionClassName={sailSelectOptionClass}
                    />
                  </div>
                </div>
                {errorFields?.has("_inlineAmount") && <p className="mt-[4px] text-[11px] text-[#DF1B41]">Enter a valid amount</p>}
              </SailProductField>

              {pricingType === "recurring" && (
                <>
                  <div className="h-[16px]" />
                  <SailProductField label="Billing period">
                    <CustomSelect
                      label=""
                      value={data._inlineBillingPeriod ?? "monthly"}
                      onChange={(v) => set("_inlineBillingPeriod", v)}
                      options={[
                        { value: "monthly", label: "Monthly" },
                        { value: "yearly", label: "Yearly" },
                        { value: "weekly", label: "Weekly" },
                        { value: "daily", label: "Daily" },
                      ]}
                      buttonClassName={sailSelectTriggerClass}
                      chevronIcon={<SailDropdownIcon />}
                      dropdownOptionClassName={sailSelectOptionClass}
                    />
                  </SailProductField>
                </>
              )}

              <div className="relative mt-[16px] w-fit">
                <button
                  type="button"
                  className="-ml-[8px] w-fit rounded-[6px] px-[8px] py-[4px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#533AFD] transition-all hover:bg-[#F0EDFF] hover:text-[#4730E0]"
                  onClick={() => onAddObject?.("_fullEditor")}
                >
                  More pricing options →
                </button>
                {pointAtMoreOptions && <MorePricingPointer />}
              </div>
            </>
          ) : (
            <>
              <p className={sailTokens.labelClass}>Pricing</p>
              <button
                type="button"
                className="mt-[8px] flex items-center gap-[6px] self-start rounded-[6px] px-[8px] py-[2px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#533AFD] transition-colors hover:bg-[#F5F6F8]"
                onClick={() => onAddObject?.("price")}
              >
                Add another price
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}


export function ProductForm({ data, onChange, errorFields, onAddObject, hidePricing, hideProductDetails, nameLabel = "Product name", namePlaceholder = "API access", pointAtMoreOptions = false }: ProductFormProps) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const isRefresh = productFormStyle === "refresh"
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  const set = (key: string, value: unknown) => onChange({ [key]: value })
  const ic = (field: string) => errorFields?.has(field) ? tokens.errorInputClass : tokens.inputClass
  const prices: PriceChip[] = data._prices ?? []

  const [animateInId, setAnimateInId] = useState<string | null>(null)
  const lastHighlightRef = useRef<string | null>(null)
  const highlightId = data._highlightPriceId as string | undefined
  if (highlightId && highlightId !== lastHighlightRef.current) {
    lastHighlightRef.current = highlightId
  }
  useEffect(() => {
    if (highlightId) {
      const id = highlightId
      const t = setTimeout(() => {
        setAnimateInId(id)
        onChange({ _highlightPriceId: undefined })
      }, 350)
      return () => clearTimeout(t)
    }
  }, [highlightId])

  const removePrice = (id: string) => {
    onChange({ _prices: prices.filter((p) => p.id !== id) })
  }

  const formatPriceLabel = (p: PriceChip, index: number) => {
    const currency = p.currency === "EUR" ? "€" : p.currency === "GBP" ? "£" : "$"
    if (p.amount) return `${currency}${p.amount}${p.billingPeriod ? ` / ${p.billingPeriod.replace("ly", "").replace("dai", "day")}` : ""}`
    if (p.pricingModel === "graduated" || p.pricingModel === "volume") return `${p.pricingModel} pricing`
    const emptyBefore = prices.slice(0, index).filter((pr) => !pr.amount && pr.pricingModel !== "graduated" && pr.pricingModel !== "volume").length
    return emptyBefore > 0 ? `Price (${emptyBefore + 1})` : "Price"
  }

  if (productFormStyle === "sail") {
    return (
      <SailProductForm
        data={data}
        onChange={onChange}
        errorFields={errorFields}
        onAddObject={onAddObject}
        hidePricing={hidePricing}
        hideProductDetails={hideProductDetails}
        nameLabel={nameLabel}
        namePlaceholder={namePlaceholder}
        pointAtMoreOptions={pointAtMoreOptions}
      />
    )
  }

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[4px]">
        <label className={tokens.labelClass}>{nameLabel}</label>
        <input
          data-focus-field="name"
          className={ic("name")}
          placeholder={namePlaceholder}
          value={data.name ?? ""}
          onChange={(e) => set("name", e.target.value)}
        />
        {errorFields?.has("name") && (
          <p className="text-[11px] text-[#DF1B41]">Enter a product name</p>
        )}
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={tokens.labelClass}>Description</label>
        <textarea
          data-focus-field="description"
          className={tokens.textareaClass}
          placeholder="Describe the product or service"
          value={data.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      {!hideProductDetails && (
        <>
          <div className="flex flex-col gap-[4px]">
            <label className={tokens.labelClass}>Product image</label>
            <ProductImageDropzone
              imageUrl={data.imageUrl ?? null}
              onChange={(imageUrl) => set("imageUrl", imageUrl)}
            />
          </div>

          <div className="flex flex-col gap-[8px]">
            <div className="flex flex-col gap-[4px]">
              <label className={tokens.labelClass}>
                Category <span className="font-[400] text-[#6C7688]">·</span>{" "}
                <a className={isRefresh ? "font-[500] text-[#2C219E] hover:underline" : "font-[600] text-[#533AFD] hover:underline"} href={productCategoryDocsUrl} target="_blank" rel="noreferrer">Docs</a>
              </label>
              <CustomSelect
                label=""
                value={data.category ?? "general-electronics"}
                onChange={(category) => set("category", category)}
                options={productCategoryOptions}
              />
            </div>
            <ManagedPaymentsEligibility category={data.category ?? "general-electronics"} />
          </div>
        </>
      )}

      {/* Pricing section */}
      {!hidePricing && <div>
        <p className={`${isRefresh ? "mb-[4px]" : "mb-[8px]"} ${tokens.labelClass}`}>
          {prices.length === 0 ? "Price type" : "Pricing"}
        </p>

        {/* Inline pricing fields — shown when no prices added yet or exactly one simple price */}
        {prices.length === 0 && (
          <div className={isRefresh ? "space-y-[16px]" : "space-y-[12px]"}>
            {/* Recurring / One-off toggle */}
            <SegmentedControl
              value={(data._pricingType ?? 'recurring') as 'recurring' | 'one_off'}
              onChange={(v) => set('_pricingType', v)}
              options={['recurring', 'one_off'] as const}
              getDisplayValue={(v) => v === 'recurring' ? 'Recurring' : 'One-off'}
            />

            {/* Amount */}
            <div className="flex flex-col gap-[4px]">
              <label className={tokens.labelClass}>Amount</label>
              <div className="flex items-center gap-[6px]">
                <div className="relative flex-1">
                  <span className={`absolute left-[10px] top-1/2 -translate-y-1/2 text-[12px] ${isRefresh ? "text-[#68778B]" : "text-[#6C7688]"}`}>$</span>
                  <input
                    className={`${errorFields?.has("_inlineAmount") ? tokens.errorInputClass : tokens.inputClass} pl-[22px]`}
                    placeholder="0.00"
                    value={data._inlineAmount ?? ""}
                    onChange={(e) => set("_inlineAmount", e.target.value)}
                    inputMode="decimal"
                  />
                </div>
                <div className="w-[76px] shrink-0">
                  <CustomSelect
                    label=""
                    value={data._inlineCurrency ?? "USD"}
                    onChange={(v) => set("_inlineCurrency", v)}
                    options={CURRENCY_OPTIONS}
                  />
                </div>
              </div>
              {errorFields?.has("_inlineAmount") && <p className="text-[11px] text-[#DF1B41]">Enter a valid amount</p>}
            </div>

            {/* Billing period — only for recurring */}
            {(data._pricingType ?? 'recurring') === 'recurring' && (
              <CustomSelect
                label="Billing period"
                value={data._inlineBillingPeriod ?? "monthly"}
                onChange={(v) => set("_inlineBillingPeriod", v)}
                options={[
                  { value: "monthly", label: "Monthly" },
                  { value: "yearly", label: "Yearly" },
                  { value: "weekly", label: "Weekly" },
                  { value: "daily", label: "Daily" },
                ]}
              />
            )}

            {/* More options link — escalates to full product editor */}
            <div className="relative w-fit">
              <button
                type="button"
                className="rounded-[6px] px-[8px] py-[4px] -ml-[8px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#533AFD] transition-all hover:bg-[#F0EDFF] hover:text-[#4730E0]"
                onClick={() => onAddObject?.("_fullEditor")}
              >
                More pricing options →
              </button>
              {pointAtMoreOptions && <MorePricingPointer />}
            </div>
          </div>
        )}

        {/* Condensed price chips — shown when prices exist */}
        {prices.length > 0 && (
          <div className="mb-[8px] flex flex-col gap-[4px]">
            {prices.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center justify-between rounded-[6px] border ${isRefresh ? "border-[#EAF0F6]" : "border-[#EBEEF1]"} bg-[#FAFBFC] px-[10px] py-[6px]`}
                style={
                  animateInId === p.id
                    ? { animation: "priceChipIn 400ms cubic-bezier(0.32, 0.72, 0, 1) forwards" }
                    : highlightId === p.id && !animateInId
                      ? { opacity: 0, transform: "scale(0.95)" }
                      : undefined
                }
                onAnimationEnd={() => { if (animateInId === p.id) setAnimateInId(null) }}
              >
                <span className={`text-[12px] font-[500] ${isRefresh ? "text-[#142234]" : "text-[#353A44]"}`}>
                  {formatPriceLabel(p, i)}
                </span>
                <div className="flex items-center gap-[4px]">
                  <button
                    type="button"
                    className="rounded-[4px] px-[4px] py-[1px] text-[11px] font-[500] text-[#533AFD] transition-colors hover:bg-[#F0EDFF] hover:text-[#4730E0]"
                    onClick={() => onAddObject?.("price", p.id)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="ml-[4px] flex h-[16px] w-[16px] items-center justify-center rounded-full text-[#9CA3B0] transition-colors hover:bg-[#FEF4F6] hover:text-[#E61947]"
                    title="Remove price"
                    onClick={() => removePrice(p.id)}
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {prices.length > 0 && (
          <button
            type="button"
            className={`flex items-center gap-[6px] self-start rounded-[6px] px-[8px] py-[2px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#533AFD] transition-colors ${isRefresh ? "hover:bg-[#F6F9FC]" : "hover:bg-[#F5F6F8]"}`}
            onClick={() => onAddObject?.("price")}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Add another price
          </button>
        )}
      </div>}


      <div>
        <div className="flex flex-col gap-[12px]">
          <CustomSelect
            label="Tax code"
            value={data.taxCode ?? "default"}
            onChange={(v) => set("taxCode", v)}
            options={[
              { value: "default", label: "Account default" },
              { value: "digital", label: "Digital" },
              { value: "physical", label: "Physical" },
              { value: "service", label: "Service" },
            ]}
          />
          <CustomSelect
            label="Tax behavior"
            value={data.taxBehavior ?? "unspecified"}
            onChange={(v) => set("taxBehavior", v)}
            options={[
              { value: "unspecified", label: "Unspecified" },
              { value: "inclusive", label: "Inclusive" },
              { value: "exclusive", label: "Exclusive" },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
