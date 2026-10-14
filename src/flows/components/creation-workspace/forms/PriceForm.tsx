'use client'

import { useState } from "react"
import { getFormTokens } from "./shared/formTokens"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { CustomSelect } from "./shared/CustomSelect"
import { EntityDropdown, type EntityItem } from "./EntityDropdown"
import { CURRENCY_OPTIONS, EXISTING_METERS } from "./shared/mockEntities"
import { SegmentedControl } from "@/components/SegmentedControl"
import { TrashIcon } from "@/components/ProductCatalogIcons"

type PriceTier = {
  id: number
  firstUnit: string
  lastUnit: string
  perUnit: string
  flatFee: string
}

type PriceFormProps = {
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
  errorFields?: Set<string>
  onAddObject?: (kind: string) => void
  meterOptions?: EntityItem[]
  onEditMeter?: (meterId: string) => void
}

type CurrencyPrice = {
  id: string
  currency: string
  amount: string
}

function defaultTiers(): PriceTier[] {
  return [
    { id: 0, firstUnit: "0", lastUnit: "1", perUnit: "", flatFee: "" },
    { id: 1, firstUnit: "2", lastUnit: "∞", perUnit: "", flatFee: "" },
  ]
}

function resolvePricingModel(category: string, chargeType: string, tierMode: string): string {
  if (category === "flat_rate") return "standard"
  if (chargeType === "per_package") return "package"
  if (chargeType === "per_tier") return tierMode === "volume" ? "volume" : "graduated"
  return "standard"
}

function isBlankAmount(value: unknown): boolean {
  if (typeof value !== "string" || value.trim() === "") return true
  const amount = Number(value)
  return !Number.isFinite(amount) || amount < 0
}

export function validatePriceData(data: Record<string, any>): Set<string> {
  const errors = new Set<string>()
  const category = data.pricingCategory ?? "flat_rate"
  const chargeType = data.chargeType ?? "per_unit"

  if (chargeType === "per_tier") {
    const tiers = Array.isArray(data.tiers) ? data.tiers : []
    if (tiers.length === 0 || tiers.some((tier: PriceTier) => isBlankAmount(tier.perUnit) && isBlankAmount(tier.flatFee))) {
      errors.add("tiers")
    }
  } else if (isBlankAmount(data.amount)) {
    errors.add("amount")
  }

  if (chargeType === "per_package") {
    const size = Number(data.packageSize)
    if (!Number.isInteger(size) || size <= 0) errors.add("packageSize")
  }

  if (category === "usage_based" && !String(data.meterId ?? "").trim() && !String(data.meterName ?? "").trim()) {
    errors.add("meterId")
  }

  const currencyPrices = Array.isArray(data.currencyOptions) ? data.currencyOptions as CurrencyPrice[] : []
  if (currencyPrices.some((price) => isBlankAmount(price.amount))) errors.add("currencyOptions")

  return errors
}

export function PriceForm({ data, onChange, errorFields, onAddObject, meterOptions = EXISTING_METERS, onEditMeter }: PriceFormProps) {
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)
  const set = (key: string, value: unknown) => onChange({ [key]: value })
  // Advanced price fields are progressively disclosed — collapsed by default, but
  // opened automatically when editing a price that already has these values set.
  const [showAdvanced, setShowAdvanced] = useState(() => Boolean(data.priceDescription || data.lookupKey))
  const [packageToggleInteracted, setPackageToggleInteracted] = useState(false)
  // Bleed the Advanced divider + hover row to the form-panel edges. RelatedLayout insets
  // the form by 16/24/28px depending on the UI style (see formInnerPad), so match that.
  const advancedBleedClass = productFormStyle === "refresh" ? "-mx-[28px]" : productFormStyle === "sail" ? "-mx-[24px]" : "-mx-[16px]"
  // The hover surface sits 4px in from the panel edge, so reduce its horizontal
  // padding by the same amount to keep the label aligned with the form fields.
  const advancedButtonPadClass = productFormStyle === "refresh" ? "px-[24px]" : productFormStyle === "sail" ? "px-[20px]" : "px-[12px]"

  const priceType: string = data.priceType ?? "recurring"
  const pricingCategory: string = data.pricingCategory ?? "flat_rate"
  const chargeType: string = data.chargeType ?? "per_unit"
  const tierMode: string = data.tierMode ?? "graduated"
  const tiers: PriceTier[] = data.tiers ?? defaultTiers()

  const showChargeType = pricingCategory === "tiered" || pricingCategory === "usage_based"
  const showTierMode = showChargeType && chargeType === "per_tier"
  const showTierEditor = showTierMode
  const showAmountInput = !showTierEditor
  const isUsageBased = pricingCategory === "usage_based"
  const isPackage = chargeType === "per_package"
  const currencyPrices: CurrencyPrice[] = data.currencyOptions ?? []
  const hasError = (field: string) => errorFields?.has(field) ?? false

  const addCurrencyPrice = () => {
    const used = new Set([data.currency ?? "USD", ...currencyPrices.map((price) => price.currency)])
    const nextCurrency = CURRENCY_OPTIONS.find((option) => !used.has(option.value))?.value
    if (!nextCurrency) return
    onChange({
      currencyOptions: [
        ...currencyPrices,
        { id: `currency-${Date.now()}-${currencyPrices.length}`, currency: nextCurrency, amount: "" },
      ],
    })
  }

  const updateCurrencyPrice = (id: string, patch: Partial<CurrencyPrice>) => {
    onChange({ currencyOptions: currencyPrices.map((price) => price.id === id ? { ...price, ...patch } : price) })
  }

  const removeCurrencyPrice = (id: string) => {
    onChange({ currencyOptions: currencyPrices.filter((price) => price.id !== id) })
  }

  const updateTier = (id: number, field: keyof PriceTier, value: string) => {
    const updated = tiers.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    onChange({ tiers: updated })
  }

  const addTier = () => {
    const lastTier = tiers[tiers.length - 1]
    const prevTo = lastTier ? parseInt(lastTier.lastUnit === "∞" ? String(tiers.length * 1000) : lastTier.lastUnit, 10) : 0
    const newFrom = prevTo + 1
    const newTier: PriceTier = {
      id: (tiers[tiers.length - 1]?.id ?? -1) + 1,
      firstUnit: String(newFrom),
      lastUnit: "∞",
      perUnit: "",
      flatFee: "",
    }
    if (lastTier && lastTier.lastUnit === "∞") {
      const updatedLast = { ...lastTier, lastUnit: String(newFrom - 1) }
      onChange({ tiers: [...tiers.slice(0, -1), updatedLast, newTier] })
    } else {
      onChange({ tiers: [...tiers, newTier] })
    }
  }

  const removeTier = (id: number) => {
    if (tiers.length <= 2) return
    const updated = tiers.filter((t) => t.id !== id)
    if (updated.length > 0 && updated[updated.length - 1].lastUnit !== "∞") {
      updated[updated.length - 1] = { ...updated[updated.length - 1], lastUnit: "∞" }
    }
    onChange({ tiers: updated })
  }

  const handlePricingCategoryChange = (category: string) => {
    const resolved = resolvePricingModel(category, chargeType, tierMode)
    const updates: Record<string, any> = {
      pricingCategory: category,
      pricingModel: resolved,
      usageType: category === "usage_based" ? "metered" : "licensed",
    }
    if (category !== "usage_based") {
      updates.meterId = ""
      updates.meterName = ""
    }
    if ((category === "tiered" || category === "usage_based") && chargeType === "per_tier" && (!data.tiers || data.tiers.length === 0)) {
      updates.tiers = defaultTiers()
    }
    onChange(updates)
  }

  const handleChargeTypeChange = (ct: string) => {
    const resolved = resolvePricingModel(pricingCategory, ct, tierMode)
    const updates: Record<string, any> = { chargeType: ct, pricingModel: resolved }
    if (ct === "per_tier") updates.currencyOptions = []
    if (ct === "per_tier" && (!data.tiers || data.tiers.length === 0)) {
      updates.tiers = defaultTiers()
    }
    onChange(updates)
  }

  const handleTierModeChange = (mode: string) => {
    const resolved = resolvePricingModel(pricingCategory, chargeType, mode)
    onChange({ tierMode: mode, pricingModel: resolved })
  }

  return (
    <div className="flex flex-col gap-[16px]">
      {/* Recurring / One-off toggle */}
      <div data-focus-field="_pricingType">
        <SegmentedControl
          value={priceType}
          onChange={(v) => set("priceType", v)}
          options={["recurring", "one_time"]}
          getDisplayValue={(v) => (v === "recurring" ? "Recurring" : "One-off")}
        />
      </div>

      {/* Pricing model */}
      <CustomSelect
        label="Pricing model"
        value={pricingCategory}
        onChange={handlePricingCategoryChange}
        options={[
          { value: "flat_rate", label: "Flat rate" },
          { value: "tiered", label: "Tiered pricing" },
          { value: "usage_based", label: "Usage-based" },
        ]}
      />

      {/* Charge type (for tiered and usage-based) */}
      {showChargeType && (
        <CustomSelect
          label="Charge type"
          value={chargeType}
          onChange={handleChargeTypeChange}
          options={[
            { value: "per_unit", label: "Per unit" },
            { value: "per_package", label: "Per package" },
            { value: "per_tier", label: "Per tier" },
          ]}
        />
      )}

      {/* Tier mode (graduated vs volume, only for per_tier) */}
      {showTierMode && (
        <CustomSelect
          label="Tier mode"
          value={tierMode}
          onChange={handleTierModeChange}
          options={[
            { value: "graduated", label: "Graduated" },
            { value: "volume", label: "Volume" },
          ]}
          description={tierMode === "graduated"
            ? "Tiers apply progressively as quantity increases."
            : "All units price based on final tier reached."}
        />
      )}

      {/* Amount input (flat rate, or per_unit/per_package charge types) */}
      {showAmountInput && (
        <>
          <div className="flex flex-col gap-[4px]" data-focus-field="_inlineAmount">
            <label className={tokens.labelClass}>Amount</label>
            <div className="relative">
              <span className={`pointer-events-none absolute left-[10px] top-1/2 -translate-y-1/2 ${
                productFormStyle === "refresh" ? "text-[13px] text-[#3F5064]"
                : productFormStyle === "sail" ? "text-[14px] text-[#6C7688]"
                : "text-[12px] text-[#6C7688]"
              }`}>$</span>
              <input
                className={`${hasError("amount") ? tokens.errorInputClass : tokens.inputClass} !pl-[22px] !pr-[10px]`}
                placeholder="0.00"
                value={data.amount ?? ""}
                onChange={(e) => set("amount", e.target.value)}
                inputMode="decimal"
              />
            </div>
            {hasError("amount") && <p className="text-[11px] text-[#DF1B41]">Enter a valid amount</p>}
          </div>
          <div data-focus-field="_inlineCurrency">
            <CustomSelect
              label="Currency"
              value={data.currency ?? "USD"}
              onChange={(v) => set("currency", v)}
              options={CURRENCY_OPTIONS}
            />
          </div>
        </>
      )}

      {pricingCategory === "flat_rate" && (
        <div className="flex items-center justify-between gap-[12px]">
          <span className={productFormStyle === "refresh" ? "text-[13px] font-[400] leading-[20px] text-[#142234]" : "text-[12px] font-[500] text-[#273951]"}>
            Sell as a package
          </span>
          <button
            type="button"
            role="switch"
            aria-label="Sell as a package"
            aria-checked={isPackage}
            data-on={isPackage ? "true" : "false"}
            className={`t-toggle relative h-[20px] w-[36px] shrink-0 rounded-full border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#675DFF] [--toggle-travel:16px] ${
              isPackage
                ? "border-[#675DFF] bg-[#675DFF]"
                : productFormStyle === "refresh"
                  ? "border-[#D5DEE7] bg-[#F1F6FB]"
                  : "border-[#D8DEE4] bg-[#F5F6F8]"
            } ${packageToggleInteracted ? "is-init" : ""}`}
            onClick={() => {
              setPackageToggleInteracted(true)
              handleChargeTypeChange(isPackage ? "per_unit" : "per_package")
            }}
          >
            <span className="t-toggle-thumb absolute left-0 top-0 h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.16)]" />
          </button>
        </div>
      )}

      {isPackage && (
        <div className="flex flex-col gap-[4px]">
          <label className={tokens.labelClass}>Package size</label>
          <input
            className={hasError("packageSize") ? tokens.errorInputClass : tokens.inputClass}
            inputMode="numeric"
            min={1}
            placeholder="e.g. 10"
            value={data.packageSize ?? ""}
            onChange={(event) => set("packageSize", event.target.value)}
          />
          <p className={hasError("packageSize") ? "text-[11px] text-[#DF1B41]" : tokens.helperClass}>
            {hasError("packageSize") ? "Enter a package size greater than zero" : "Customers are charged once per package of this many units."}
          </p>
        </div>
      )}

      {/* Tier editor — connected cell style matching TieredPricingEditor */}
      {showTierEditor && (
        <div className="flex flex-col gap-[4px]">
          <CustomSelect
            label="Currency"
            value={data.currency ?? "USD"}
            onChange={(v) => set("currency", v)}
            options={CURRENCY_OPTIONS}
          />

          {(() => {
            const isRefresh = productFormStyle === "refresh"
            const isSail = productFormStyle === "sail"
            const borderColor = isRefresh ? "border-[#EAF0F6]" : "border-[#EBEEF1]"
            const headerText = isRefresh
              ? "text-[13px] font-[500] leading-[20px] text-[#142234]"
              : isSail
                ? "text-[14px] font-[400] leading-[20px] text-[#353A44]"
                : "text-[12px] font-[400] leading-[16px] text-[#353A44]"
            const cellBg = isRefresh ? "bg-[#F6F9FC]" : "bg-[#F5F6F8]"
            const cellText = isRefresh
              ? "text-[13px] font-[500] text-[#142234]"
              : isSail
                ? "text-[14px] font-[500] text-[#353A44]"
                : "text-[12px] font-[500] text-[#353A44]"
            const prefixText = isRefresh
              ? "text-[13px] text-[#3F5064]"
              : isSail
                ? "text-[14px] text-[#6C7688]"
                : "text-[12px] text-[#6C7688]"
            const inputText = isRefresh
              ? "text-[13px] font-[500] text-[#142234] placeholder:text-[#9CA3B0]"
              : isSail
                ? "text-[14px] font-[500] text-[#353A44] placeholder:text-[#818DA0]"
                : "text-[12px] font-[500] text-[#353A44] placeholder:text-[#818DA0]"
            const addColor = isRefresh ? "text-[#1C1E54]" : "text-[#533AFD]"
            const addText = isRefresh ? "text-[13px]" : isSail ? "text-[14px]" : "text-[12px]"
            const rowHeight = isRefresh ? "h-[34px]" : isSail ? "h-[34px]" : "h-[32px]"

            return (
          <div className={`mt-[8px] -mx-[16px] overflow-hidden border-y ${borderColor}`}>
            {/* Header */}
            <div className={`grid w-full grid-cols-4 border-b ${borderColor} bg-white ${headerText}`}>
              <div className="px-[12px] py-[8px]">From</div>
              <div className={`border-l ${borderColor} px-[12px] py-[8px]`}>To</div>
              <div className={`border-l ${borderColor} px-[12px] py-[8px]`}>Unit price</div>
              <div className={`border-l ${borderColor} px-[12px] py-[8px]`}>Flat fee</div>
            </div>

            {/* Rows */}
            {tiers.map((tier, idx) => {
              const isLast = idx === tiers.length - 1
              const canDelete = idx > 0 && tiers.length > 2
              return (
                <div key={tier.id} className={`group relative grid w-full grid-cols-4 ${idx < tiers.length - 1 ? `border-b ${borderColor}` : ""}`}>
                  {/* From (read-only) */}
                  <div className={`flex ${rowHeight} items-center ${cellBg} px-[12px] ${cellText}`}>
                    {tier.firstUnit}
                  </div>
                  {/* To */}
                  <div className={`flex ${rowHeight} items-center border-l ${borderColor} bg-white px-[12px]`}>
                    {isLast ? (
                      <span className={cellText}>∞</span>
                    ) : (
                      <input
                        className={`h-full w-full bg-transparent ${inputText} outline-none`}
                        value={tier.lastUnit}
                        onChange={(e) => updateTier(tier.id, "lastUnit", e.target.value)}
                      />
                    )}
                  </div>
                  {/* Unit price */}
                  <div className={`flex ${rowHeight} items-center gap-[4px] border-l ${borderColor} bg-white px-[12px] focus-within:relative focus-within:z-10 focus-within:shadow-[0_0_0_1.5px_#A0D0F7]`}>
                    <span className={prefixText}>$</span>
                    <input
                      className={`min-w-0 flex-1 bg-transparent ${inputText} outline-none`}
                      placeholder="0.00"
                      value={tier.perUnit}
                      onChange={(e) => updateTier(tier.id, "perUnit", e.target.value)}
                    />
                  </div>
                  {/* Flat fee */}
                  <div className={`flex ${rowHeight} items-center gap-[4px] border-l ${borderColor} bg-white px-[12px] focus-within:relative focus-within:z-10 focus-within:shadow-[0_0_0_1.5px_#A0D0F7]`}>
                    <span className={prefixText}>$</span>
                    <input
                      className={`min-w-0 flex-1 bg-transparent ${inputText} outline-none`}
                      placeholder="0.00"
                      value={tier.flatFee}
                      onChange={(e) => updateTier(tier.id, "flatFee", e.target.value)}
                    />
                  </div>
                  {/* Delete button */}
                  {canDelete && (
                    <button
                      type="button"
                      className="absolute left-full top-1/2 ml-[4px] flex h-[32px] w-[32px] -translate-y-1/2 items-center justify-center rounded-[6px] text-[#9CA3B0] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#DF1B41]"
                      onClick={() => removeTier(tier.id)}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    </button>
                  )}
                </div>
              )
            })}

            {/* Add tier row */}
            <button
              type="button"
              className={`flex ${rowHeight} w-full items-center gap-[8px] border-t ${borderColor} bg-white px-[12px] ${addText} font-[500] leading-[16px] ${addColor}`}
              onClick={addTier}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
              Add tier
            </button>
          </div>
            )
          })()}
          {hasError("tiers") && <p className="mt-[6px] text-[11px] text-[#DF1B41]">Enter a unit price or flat fee for every tier</p>}
        </div>
      )}

      {/* Include tax in price */}
      <div data-focus-field="_inlineTaxBehavior">
        <CustomSelect
          label="Include tax in price"
          value={data.taxBehavior ?? "auto"}
          onChange={(v) => set("taxBehavior", v)}
          options={[
            { value: "auto", label: "Auto" },
            { value: "inclusive", label: "Inclusive" },
            { value: "exclusive", label: "Exclusive" },
          ]}
        />
      </div>

      {/* Billing period (recurring only) */}
      {priceType === "recurring" && (
        <div data-focus-field="_inlineBillingPeriod">
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
        </div>
      )}

      {showAmountInput && (
        <div className="flex flex-col gap-[8px]">
          {currencyPrices.map((price) => (
            <div key={price.id} className="grid grid-cols-[1fr_116px_24px] items-end gap-[6px]">
              <div className="flex flex-col gap-[4px]">
                <label className={tokens.labelClass}>Amount</label>
                <input
                  className={hasError("currencyOptions") && isBlankAmount(price.amount) ? tokens.errorInputClass : tokens.inputClass}
                  inputMode="decimal"
                  placeholder="0.00"
                  value={price.amount}
                  onChange={(event) => updateCurrencyPrice(price.id, { amount: event.target.value })}
                />
              </div>
              <CustomSelect
                label="Currency"
                value={price.currency}
                onChange={(currency) => updateCurrencyPrice(price.id, { currency })}
                options={CURRENCY_OPTIONS.filter((option) => option.value === price.currency || ![data.currency ?? "USD", ...currencyPrices.map((entry) => entry.currency)].includes(option.value))}
              />
              <button
                type="button"
                aria-label={`Remove ${price.currency} price`}
                className="mb-[3px] flex h-[24px] w-[24px] items-center justify-center rounded-[6px] text-[#6C7688] hover:bg-[#FEF4F6] hover:text-[#C0123C]"
                onClick={() => removeCurrencyPrice(price.id)}
              >
                <TrashIcon />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="flex w-fit items-center gap-[5px] rounded-[6px] px-[4px] py-[2px] text-[12px] font-[600] text-[#533AFD] hover:bg-[#F0EDFF] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={addCurrencyPrice}
            disabled={currencyPrices.length + 1 >= CURRENCY_OPTIONS.length}
          >
            <span aria-hidden="true">＋</span> Add a price by currency
          </button>
          {hasError("currencyOptions") && <p className="text-[11px] text-[#DF1B41]">Enter an amount for each currency</p>}
        </div>
      )}

      {/* Meter association (only when usage-based) */}
      {isUsageBased && (
        <EntityDropdown
          label="Meter"
          placeholder="Choose a meter"
          searchPlaceholder="Search meters"
          items={meterOptions}
          selectedId={data.meterId ?? ""}
          selectedLabel={data.meterName ?? ""}
          onSelect={(meterId) => {
            const meter = meterOptions.find((option) => option.id === meterId)
            onChange({ meterId, meterName: meter?.name ?? "" })
          }}
          addNewLabel="Create a new meter"
          onAddNew={() => onAddObject?.("meter")}
          onEdit={data.meterId && onEditMeter ? () => onEditMeter(data.meterId) : undefined}
          hasError={hasError("meterId")}
          errorMessage="Choose or create a meter"
        />
      )}

      {/* Unit label */}
      <div className="flex flex-col gap-[4px]">
        <label className={tokens.labelClass}>Unit label</label>
        <input
          className={tokens.inputClass}
          placeholder="e.g. seat, request, token"
          value={data.unitLabel ?? ""}
          onChange={(e) => set("unitLabel", e.target.value)}
        />
        <p className="text-[11px] text-[#9CA3B0]">
          Describes how you sell your product. Appears on invoices and receipts.
        </p>
      </div>

      <div>
        {/* Keep the divider full bleed while insetting the rounded hover surface by 4px. */}
        <div className={`${advancedBleedClass} border-t border-[#ECF1F6]`} />
        <div className={`${advancedBleedClass} p-[4px]`}>
          <button
            type="button"
            aria-expanded={showAdvanced}
            aria-controls="price-advanced-settings"
            className={`${advancedButtonPadClass} flex w-full items-center justify-between gap-[8px] rounded-[8px] py-[10px] text-left outline-none transition-colors ${productFormStyle === "refresh" ? "hover:bg-[#F1F6FB]" : "hover:bg-[#F6F8FA]"}`}
            onClick={() => setShowAdvanced((prev) => !prev)}
          >
            <span className="text-[13px] font-[600] leading-[20px] text-[#1A2C44]">Advanced settings</span>
            <svg
              className={`shrink-0 text-[#8792A2] transition-transform duration-200 ${showAdvanced ? "rotate-180" : ""}`}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path d="m2.75 4.5 3.25 3.25 3.25-3.25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div
          id="price-advanced-settings"
          aria-hidden={!showAdvanced}
          inert={!showAdvanced}
          className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
            showAdvanced ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-[12px] pt-[12px]">
              <div className="flex flex-col gap-[4px]">
                <label className={tokens.labelClass}>Price description</label>
                <input
                  className={tokens.inputClass}
                  placeholder="e.g. Standard monthly"
                  value={data.priceDescription ?? ""}
                  onChange={(event) => set("priceDescription", event.target.value)}
                />
                <p className={tokens.helperClass}>Use this to organize prices. It is not shown to customers.</p>
              </div>
              <div className="flex flex-col gap-[4px]">
                <label className={tokens.labelClass}>Lookup key</label>
                <input
                  className={tokens.inputClass}
                  placeholder="e.g. standard_monthly"
                  value={data.lookupKey ?? ""}
                  onChange={(event) => set("lookupKey", event.target.value)}
                />
                <p className={tokens.helperClass}>A stable key your integration can use to retrieve this price.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
