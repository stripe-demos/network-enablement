"use client"

import { useState, type ReactNode } from "react"
import { FormRow } from "@/components/FormRow"
import { SegmentedControl } from "@/components/SegmentedControl"
import { Selector } from "@/components/Selector"
import { useFocusedField } from "@/components/product-catalog/FocusedFieldContext"
import { TieredPricingEditor } from "@/components/TieredPricingEditor"
import { LargeChevronIcon, TrashIcon } from "@/components/ProductCatalogIcons"
import { DetailChipsOverflow, type DetailChipItem } from "@/components/DetailChipsOverflow"
import type { PlanFormContext } from "./planFormTypes"
import { InputSkeleton } from "./HighlightedInput"
import { ComboboxInput } from "./ComboboxInput"
import {
  detailChipClasses,
  countFilledMetadataEntries,
  focusElement,
  chipWithValue,
  createEnterToCloseHandler,
  FieldError,
  getPlanFormTokens,
} from "./planFormUtils"
import { usePlanFormClose } from "./PlanFormCloseContext"
import { FieldHint } from "./QuickStartTip"

type RateFormProps = {
  ctx: PlanFormContext
  isHighlighted: (key: string) => boolean
  highlightInputClass: (key: string) => string
  isLoading: (key: string) => boolean
  validationErrorClass: (key: string) => string
  validationErrorMessage: (key: string) => string | undefined
}

export function RateForm({ ctx, isHighlighted, highlightInputClass, isLoading, validationErrorClass, validationErrorMessage }: RateFormProps) {
  const {
    t,
    textFieldInputClasses,
    productFormStyle,
    assistantHighlightedKeys = [],
    currencyOptions,
    currencyDisplayNames,
    includeTaxOptions,
    planPriceTypeOptions,
    sellAsOptions,
    numberFormatter,
    parseNumberValue,
    activePlanNode,
    activePlanRateCard,
    planRateCards,
    planCurrency,
    getMetadataRows,
    addMetadataRow,
    removeMetadataRow,
    updateRateName,
    ratePriceTypes,
    setRatePriceTypes,
    rateSellAs,
    setRateSellAs,
    planRateUnitPrices,
    setPlanRateUnitPrices,
    planRateTiers,
    setPlanRateTiers,
    planRateTierToValues,
    setPlanRateTierToValues,
    planRateTierUnitPrices,
    setPlanRateTierUnitPrices,
    planRateTierFlatFees,
    setPlanRateTierFlatFees,
    planRateIncludeTax,
    setPlanRateIncludeTax,
    planRateCurrencies,
    setPlanRateCurrencies,
    planRateActiveCurrencyId,
    setPlanRateActiveCurrencyId,
    usageScenarioDraggingRateId,
    planRateUsage,
    rateUnitLabels,
    setRateUnitLabels,
    showRateAdvanced,
    setShowRateAdvanced,
    rateTaxCodes,
    setRateTaxCodes,
    rateItemLookupKeys,
    setRateItemLookupKeys,
    rateItemMetadataRows,
    setRateItemMetadataRows,
    rateItemMetadataValues,
    setRateItemMetadataValues,
    rateSettingsMetadataRows,
    setRateSettingsMetadataRows,
    rateSettingsMetadataValues,
    setRateSettingsMetadataValues,
    pendingFocusRateId,
    // Meter selection
    rateMeters,
    setRateMeters,
    meterOptions,
    onOpenMeterBuilderForRate,
    existingRateNames,
  } = ctx

  const pf = getPlanFormTokens(productFormStyle)

  const closeForm = usePlanFormClose()
  const handleEnterToClose = createEnterToCloseHandler(closeForm)
  const { setFocusedField, setHoveredField } = useFocusedField()
  const previewHover = (field: string) => ({
    onMouseEnter: () => setHoveredField(field),
    onMouseLeave: () => setHoveredField(null),
  })
  const [nameLabelAction, setNameLabelAction] = useState<ReactNode>(null)

  const rateId = activePlanNode.id ?? activePlanRateCard?.rates[0]?.id ?? 0
  // Debug: warn if activePlanNode.id is undefined - this causes multi-select issues
  if (activePlanNode.id === undefined) {
    console.warn(`[RateForm] activePlanNode.id is undefined, falling back to rateId=${rateId}`)
  }
  const rateCardForRate = planRateCards.find((card) => card.rates.some((rate) => rate.id === rateId))
  const rate = rateCardForRate?.rates.find((item) => item.id === rateId)

  const itemMetadataRows = getMetadataRows(rateItemMetadataRows, rateId)
  const rateMetadataRows = getMetadataRows(rateSettingsMetadataRows, rateId)
  const itemMetadataFilledCount = countFilledMetadataEntries(rateItemMetadataValues[rateId], itemMetadataRows)
  const rateMetadataFilledCount = countFilledMetadataEntries(rateSettingsMetadataValues[rateId], rateMetadataRows)
  const ratePriceType = ratePriceTypes[rateId] ?? planPriceTypeOptions[0]
  const isTieredRate = ratePriceType === "Graduated" || ratePriceType === "Volume"
  const rateTiers = planRateTiers[rateId] ?? [0, 1]
  const rateTierTo = planRateTierToValues[rateId] ?? {}
  const rateTierUnitPrices = planRateTierUnitPrices[rateId] ?? {}
  const rateTierFlatFees = planRateTierFlatFees[rateId] ?? {}
  const rateIncludeTax = planRateIncludeTax[rateId] ?? includeTaxOptions[0]
  const rateCurrencies = planRateCurrencies[rateId] ?? [{ id: 0, code: planCurrency }]
  const rateActiveCurrencyId = planRateActiveCurrencyId[rateId] ?? rateCurrencies[0]?.id ?? 0
  const shouldDimInactiveTiers = usageScenarioDraggingRateId === rateId && isTieredRate
  const usageQuantityForHighlight = parseNumberValue(planRateUsage[rateId] ?? "0") ?? 0

  const activeTierIdForHighlight = (() => {
    if (!shouldDimInactiveTiers) return null
    if (!rateTiers.length) return null
    const tierRanges = rateTiers.map((id, index) => {
      const isLast = index === rateTiers.length - 1
      const defaultTo = (index + 1) * 1000
      const toRaw = rateTierTo[id] || numberFormatter.format(defaultTo)
      const parsedTo = isLast ? Infinity : parseNumberValue(toRaw || `${defaultTo}`)
      return { id, to: isLast ? Infinity : parsedTo }
    })
    const match = tierRanges.find((tier) => usageQuantityForHighlight <= tier.to) ?? tierRanges[tierRanges.length - 1]
    return match?.id ?? null
  })()

  return (
    <div className="flex flex-col gap-[12px] min-w-0">
      <FormRow
        label={t("Metered item")}
        labelAction={nameLabelAction}
        fieldDescriptionId="rate-name"
      >
        <div data-field-description="rate-name" {...previewHover("rate.name")}>
          {isLoading(`rate.${rateId}.name`) ? (
            <InputSkeleton />
          ) : (
            <>
              <ComboboxInput
                highlightKey="rate.name"
                isHighlighted={isHighlighted}
                textFieldInputClasses={textFieldInputClasses}
                value={rate?.name ?? ""}
                onChange={(value) => updateRateName(rateId, value)}
                onKeyDown={handleEnterToClose}
                placeholder={t("e.g. API calls")}
                autoFocus={pendingFocusRateId === rateId}
                onFocus={() => setFocusedField("rate.name")}
                onBlur={() => setFocusedField(null)}
                className={validationErrorClass(`rate.${rateId}.name`)}
                allSuggestions={existingRateNames}
                suggestions={existingRateNames.filter(n => n !== (rate?.name ?? ""))}
                onLabelActionChange={setNameLabelAction}
              />
              <FieldError message={validationErrorMessage(`rate.${rateId}.name`)} />
            </>
          )}
        </div>
      </FormRow>
      <FormRow label={t("Meter")} fieldDescriptionId="rate-meter" hint={<FieldHint t={t} text="Track usage by adding a meter." visible />}>
        <div data-field-description="rate-meter" {...previewHover("rate.meter")}>
          <Selector
            ariaLabel={t("Meter")}
            size="sm"
            value={rateMeters[rateId] ?? ""}
            onChange={(next) => setRateMeters((prev) => ({ ...prev, [rateId]: next }))}
            onOpenChange={(open) => setFocusedField(open ? "rate.meter" : null)}
            options={meterOptions}
            placeholder={t("Add meter")}
            buttonClassName={`${pf.selectorButton} ${
              !(rateMeters[rateId] ?? "").trim()
                ? (productFormStyle === "refresh" ? "text-[#68778B]" : "text-[#6C7688]")
                : ""
            } ${highlightInputClass("rate.meter")} ${validationErrorClass(`rate.${rateId}.meter`)}`}
            highlightValue={isHighlighted("rate.meter")}
            footerLabel={t("Create new meter")}
            onFooterClick={() => onOpenMeterBuilderForRate(rateId)}
            fullWidth
          />
          <FieldError message={validationErrorMessage(`rate.${rateId}.meter`)} />
        </div>
      </FormRow>
      <FormRow label={t("Price type")} fieldDescriptionId="rate-price-type" docsUrl="https://docs.stripe.com/products-prices/pricing-models">
        <div data-field-description="rate-price-type" className="w-full">
          {isLoading(`rate.${rateId}.priceType`) ? (
            <InputSkeleton />
          ) : (
            <SegmentedControl
              value={ratePriceType}
              onChange={(next) => setRatePriceTypes((prev) => ({ ...prev, [rateId]: next }))}
              options={planPriceTypeOptions}
              getDisplayValue={(v) => t(v === "Fixed rate" ? "Flat fee" : v)}
            />
          )}
        </div>
      </FormRow>
      <FormRow label={t("Sell as")} fieldDescriptionId="rate-sell-as">
        <div data-field-description="rate-sell-as" className="w-full">
          <SegmentedControl
            value={rateSellAs[rateId] ?? sellAsOptions[0]}
            onChange={(next) => setRateSellAs((prev) => ({ ...prev, [rateId]: next }))}
            options={sellAsOptions}
            getDisplayValue={t}
          />
        </div>
      </FormRow>
      {!isTieredRate && (
        <FormRow label={t("Price per unit")} fieldDescriptionId="rate-unit-price">
          <div data-field-description="rate-unit-price" {...previewHover("rate.unitPrice")}>
            <div
              className={`${pf.prefixInputWrapper} ${highlightInputClass(
                "rate.unitPrice"
              )} ${validationErrorClass(`rate.${rateId}.unitPrice`)}`}
            >
              <span className={pf.prefixColor}>$</span>
              <input
                className="w-full bg-transparent outline-none"
                placeholder="0.00"
                inputMode="decimal"
                value={planRateUnitPrices[rateId] ?? ""}
                onChange={(event) => {
                  const v = event.target.value.replace(/[^0-9.]/g, "")
                  setPlanRateUnitPrices((prev) => ({ ...prev, [rateId]: v }))
                }}
                onKeyDown={handleEnterToClose}
                onFocus={() => setFocusedField("rate.unitPrice")}
                onBlur={() => setFocusedField(null)}
              />
            </div>
            <FieldError message={validationErrorMessage(`rate.${rateId}.unitPrice`)} />
          </div>
        </FormRow>
      )}
      {isTieredRate && (
        <TieredPricingEditor
          tiers={rateTiers}
          tieredBy="Graduated"
          includeTax={rateIncludeTax}
          setIncludeTax={(value: string) => setPlanRateIncludeTax((prev) => ({ ...prev, [rateId]: value }))}
          showCurrencyControls={false}
          activeTierId={activeTierIdForHighlight}
          dimInactiveTiers={shouldDimInactiveTiers}
          tierToValues={rateTierTo}
          onChangeTierTo={(tierId: number, value: string) =>
            setPlanRateTierToValues((prev) => ({
              ...prev,
              [rateId]: { ...(prev[rateId] ?? {}), [tierId]: value },
            }))
          }
          tierUnitPrices={rateTierUnitPrices}
          onChangeTierUnitPrice={(tierId: number, value: string) =>
            setPlanRateTierUnitPrices((prev) => ({
              ...prev,
              [rateId]: { ...(prev[rateId] ?? {}), [tierId]: value },
            }))
          }
          tierFlatFees={rateTierFlatFees}
          onChangeTierFlatFee={(tierId: number, value: string) =>
            setPlanRateTierFlatFees((prev) => ({
              ...prev,
              [rateId]: { ...(prev[rateId] ?? {}), [tierId]: value },
            }))
          }
          pricingCurrencies={rateCurrencies}
          activeCurrencyId={rateActiveCurrencyId}
          setActiveCurrencyId={(id: number) => setPlanRateActiveCurrencyId((prev) => ({ ...prev, [rateId]: id }))}
          currencyDisplayNames={currencyDisplayNames}
          currencyOptions={currencyOptions}
          onAddCurrency={(code: string) =>
            setPlanRateCurrencies((prev) => {
              const current = prev[rateId] ?? [{ id: 0, code: planCurrency }]
              const nextId = current.length ? Math.max(...current.map((c) => c.id)) + 1 : 0
              const next = [...current, { id: nextId, code }]
              setPlanRateActiveCurrencyId((ids) => ({ ...ids, [rateId]: nextId }))
              return { ...prev, [rateId]: next }
            })
          }
          onRemoveTier={(tierId: number) => {
            setPlanRateTiers((prev) => {
              const current = prev[rateId] ?? [0, 1]
              if (current.length <= 1) return prev
              return { ...prev, [rateId]: current.filter((id) => id !== tierId) }
            })
            setPlanRateTierToValues((prev) => {
              const current = { ...(prev[rateId] ?? {}) }
              delete current[tierId]
              return { ...prev, [rateId]: current }
            })
            setPlanRateTierUnitPrices((prev) => {
              const current = { ...(prev[rateId] ?? {}) }
              delete current[tierId]
              return { ...prev, [rateId]: current }
            })
            setPlanRateTierFlatFees((prev) => {
              const current = { ...(prev[rateId] ?? {}) }
              delete current[tierId]
              return { ...prev, [rateId]: current }
            })
          }}
          onAddTier={() =>
            setPlanRateTiers((prev) => {
              const current = prev[rateId] ?? [0, 1]
              const nextId = current.length ? Math.max(...current) + 1 : 0
              setPlanRateTierToValues((values) => ({ ...values, [rateId]: { ...(values[rateId] ?? {}), [nextId]: "" } }))
              setPlanRateTierUnitPrices((values) => ({ ...values, [rateId]: { ...(values[rateId] ?? {}), [nextId]: "" } }))
              setPlanRateTierFlatFees((values) => ({ ...values, [rateId]: { ...(values[rateId] ?? {}), [nextId]: "" } }))
              return { ...prev, [rateId]: [...current, nextId] }
            })
          }
          onDeleteCurrency={(currencyId: number) =>
            setPlanRateCurrencies((prev) => {
              const current = prev[rateId] ?? [{ id: 0, code: planCurrency }]
              const next = current.filter((c) => c.id !== currencyId)
              const fallback = next.length ? next : [{ id: 0, code: planCurrency }]
              if (!fallback.some((c) => c.id === rateActiveCurrencyId)) {
                setPlanRateActiveCurrencyId((ids) => ({ ...ids, [rateId]: fallback[0]!.id }))
              }
              return { ...prev, [rateId]: fallback }
            })
          }
          highlightedId={null}
          newFieldEffect="highlight"
          assistantHighlightedKeys={assistantHighlightedKeys}
        />
      )}
      <FormRow label={rateSellAs[rateId] === "Package" ? t("Package label") : t("Unit label")} fieldDescriptionId="rate-unit-label">
        <div data-field-description="rate-unit-label">
          <input
            className={`${textFieldInputClasses} ${highlightInputClass("rate.unitLabel")} ${validationErrorClass(`rate.${rateId}.unitLabel`)}`}
            placeholder={rateSellAs[rateId] === "Package" ? t("e.g. developer seats") : t("e.g. token")}
            value={rateUnitLabels[rateId] ?? ""}
            onChange={(event) => setRateUnitLabels((prev) => ({ ...prev, [rateId]: event.target.value }))}
            onKeyDown={handleEnterToClose}
          />
          <FieldError message={validationErrorMessage(`rate.${rateId}.unitLabel`)} />
        </div>
      </FormRow>
      <div
        id="rate-advanced-settings"
        aria-hidden={!showRateAdvanced}
        inert={!showRateAdvanced}
        className={`grid min-w-0 transition-[grid-template-rows,opacity] duration-200 ease-out ${
          showRateAdvanced ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex min-w-0 flex-col gap-[12px] pb-[8px]">
          <FormRow label={t("Product tax code")} fieldDescriptionId="rate-tax-code">
            <Selector
              ariaLabel={t("Product tax code")}
              size="sm"
              value={rateTaxCodes[rateId] ?? "Software as a service (SaaS)"}
              onChange={(next) => setRateTaxCodes((prev) => ({ ...prev, [rateId]: next }))}
              options={["Software as a service (SaaS)"]}
              getDisplayValue={t}
              buttonClassName={pf.selectorButton}
              highlightValue={isHighlighted("rate.taxCode")}
              fullWidth
            />
          </FormRow>
          <FormRow label={t("Lookup key")} fieldDescriptionId="rate-lookup-key">
            <input
              className={`${textFieldInputClasses} ${highlightInputClass("rate.itemLookupKey")}`}
              aria-label={t("Item lookup key")}
              placeholder={t("e.g. api_calls_tier1")}
              value={rateItemLookupKeys[rateId] ?? ""}
              onChange={(event) => setRateItemLookupKeys((prev) => ({ ...prev, [rateId]: event.target.value }))}
              onKeyDown={handleEnterToClose}
            />
          </FormRow>
          <FormRow label={t("Item metadata")} layout="stacked" rightWidthPx={null}>
            <div className="flex w-full flex-col gap-[8px]">
              {itemMetadataRows.map((rowId) => (
                <div key={rowId} className="flex items-center gap-[8px]">
                  <input
                    className={`${textFieldInputClasses} ${highlightInputClass("rate.itemMetadata")}`}
                    aria-label={t("Item metadata key")}
                    placeholder={t("e.g. internal_sku")}
                    value={rateItemMetadataValues[rateId]?.[rowId]?.key ?? ""}
                    onChange={(event) =>
                      setRateItemMetadataValues((prev) => ({
                        ...prev,
                        [rateId]: {
                          ...(prev[rateId] ?? {}),
                          [rowId]: {
                            key: event.target.value,
                            value: prev[rateId]?.[rowId]?.value ?? "",
                          },
                        },
                      }))
                    }
                    onKeyDown={handleEnterToClose}
                  />
                  <input
                    className={`${textFieldInputClasses} ${highlightInputClass("rate.itemMetadata")}`}
                    aria-label={t("Item metadata value")}
                    placeholder={t("e.g. SKU-12345")}
                    value={rateItemMetadataValues[rateId]?.[rowId]?.value ?? ""}
                    onChange={(event) =>
                      setRateItemMetadataValues((prev) => ({
                        ...prev,
                        [rateId]: {
                          ...(prev[rateId] ?? {}),
                          [rowId]: {
                            key: prev[rateId]?.[rowId]?.key ?? "",
                            value: event.target.value,
                          },
                        },
                      }))
                    }
                    onKeyDown={handleEnterToClose}
                  />
                  <button
                    type="button"
                    className={pf.trashButton}
                    onClick={() => removeMetadataRow(setRateItemMetadataRows, rateId, rowId, setRateItemMetadataValues)}
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={pf.inlineAddButton}
                onClick={() => addMetadataRow(setRateItemMetadataRows, rateId, setRateItemMetadataValues)}
              >
                {t("Add item metadata")}
              </button>
            </div>
          </FormRow>
          <FormRow label={t("Rate metadata")} layout="stacked" rightWidthPx={null}>
            <div className="flex w-full flex-col gap-[8px]">
              {rateMetadataRows.map((rowId) => (
                <div key={rowId} className="flex items-center gap-[8px]">
                  <input
                    className={`${textFieldInputClasses} ${highlightInputClass("rate.rateMetadata")}`}
                    aria-label={t("Rate metadata key")}
                    placeholder={t("e.g. tier")}
                    value={rateSettingsMetadataValues[rateId]?.[rowId]?.key ?? ""}
                    onChange={(event) =>
                      setRateSettingsMetadataValues((prev) => ({
                        ...prev,
                        [rateId]: {
                          ...(prev[rateId] ?? {}),
                          [rowId]: {
                            key: event.target.value,
                            value: prev[rateId]?.[rowId]?.value ?? "",
                          },
                        },
                      }))
                    }
                    onKeyDown={handleEnterToClose}
                  />
                  <input
                    className={`${textFieldInputClasses} ${highlightInputClass("rate.rateMetadata")}`}
                    aria-label={t("Rate metadata value")}
                    placeholder={t("e.g. premium")}
                    value={rateSettingsMetadataValues[rateId]?.[rowId]?.value ?? ""}
                    onChange={(event) =>
                      setRateSettingsMetadataValues((prev) => ({
                        ...prev,
                        [rateId]: {
                          ...(prev[rateId] ?? {}),
                          [rowId]: {
                            key: prev[rateId]?.[rowId]?.key ?? "",
                            value: event.target.value,
                          },
                        },
                      }))
                    }
                    onKeyDown={handleEnterToClose}
                  />
                  <button
                    type="button"
                    className={pf.trashButton}
                    onClick={() => removeMetadataRow(setRateSettingsMetadataRows, rateId, rowId, setRateSettingsMetadataValues)}
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={pf.inlineAddButton}
                onClick={() => addMetadataRow(setRateSettingsMetadataRows, rateId, setRateSettingsMetadataValues)}
              >
                {t("Add rate metadata")}
              </button>
            </div>
          </FormRow>
          </div>
        </div>
      </div>
      <button
        type="button"
        aria-expanded={showRateAdvanced}
        aria-controls="rate-advanced-settings"
        className={pf.advancedButton}
        onClick={() => setShowRateAdvanced((prev) => !prev)}
      >
        <span className={pf.advancedLabel}>
          {t("Advanced settings")}
        </span>
        <LargeChevronIcon rotated={showRateAdvanced} />
      </button>
    </div>
  )
}
