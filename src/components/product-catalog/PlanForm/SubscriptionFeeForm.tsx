"use client"

import { useState, type ReactNode } from "react"
import { FormRow } from "@/components/FormRow"
import { SegmentedControl } from "@/components/SegmentedControl"
import { Selector } from "@/components/Selector"
import { useFocusedField } from "@/components/product-catalog/FocusedFieldContext"
import { LargeChevronIcon, TrashIcon } from "@/components/ProductCatalogIcons"
import type { PlanFormContext } from "./planFormTypes"
import { HighlightedInput } from "./HighlightedInput"
import { ComboboxInput } from "./ComboboxInput"
import { subscriptionFeeSellAsOptions } from "@/components/product-catalog/productCatalogPage.constants"
import { detailChipClasses, createEnterToCloseHandler, FieldError, getPlanFormTokens } from "./planFormUtils"
import { usePlanFormClose } from "./PlanFormCloseContext"
import { FieldHint } from "./QuickStartTip"

type SubscriptionFeeFormProps = {
  ctx: PlanFormContext
  isHighlighted: (key: string) => boolean
  highlightInputClass: (key: string) => string
  validationErrorClass: (key: string) => string
  validationErrorMessage: (key: string) => string | undefined
}

export function SubscriptionFeeForm({ ctx, isHighlighted, highlightInputClass, validationErrorClass, validationErrorMessage }: SubscriptionFeeFormProps) {
  const {
    t,
    textFieldInputClasses,
    productFormStyle,
    activePlanNode,
    servicingPeriodOptions,
    planPriceTypeOptions,
    sellAsOptions,
    getMetadataRows,
    addMetadataRow,
    removeMetadataRow,
    planSubscriptionFees,
    updateSubscriptionFeeName,
    subscriptionFeeItemMetadataRows,
    setSubscriptionFeeItemMetadataRows,
    subscriptionFeeItemMetadataValues,
    setSubscriptionFeeItemMetadataValues,
    subscriptionFeeFeeMetadataRows,
    setSubscriptionFeeFeeMetadataRows,
    subscriptionFeeFeeMetadataValues,
    setSubscriptionFeeFeeMetadataValues,
    subscriptionFeePeriods,
    setSubscriptionFeePeriods,
    subscriptionFeePriceTypes,
    setSubscriptionFeePriceTypes,
    subscriptionFeeSellAs,
    setSubscriptionFeeSellAs,
    subscriptionFeeAmounts,
    setSubscriptionFeeAmounts,
    subscriptionFeeUnitLabels,
    setSubscriptionFeeUnitLabels,
    showSubscriptionFeeAdvanced,
    setShowSubscriptionFeeAdvanced,
    subscriptionFeeTaxCodes,
    setSubscriptionFeeTaxCodes,
    subscriptionFeeItemLookupKeys,
    setSubscriptionFeeItemLookupKeys,
    subscriptionFeeFeeLookupKeys,
    setSubscriptionFeeFeeLookupKeys,
    existingFeeNames,
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

  const feeId = activePlanNode.id ?? planSubscriptionFees[0]?.id ?? 0
  const fee = planSubscriptionFees.find((item) => item.id === feeId)
  const itemMetadataRows = getMetadataRows(subscriptionFeeItemMetadataRows, feeId)
  const feeMetadataRows = getMetadataRows(subscriptionFeeFeeMetadataRows, feeId)

  if (!fee) return null

  return (
    <div className="flex flex-col gap-[12px] min-w-0">
      <FormRow label={t("Licensed fee item")} labelAction={nameLabelAction} fieldDescriptionId="subscription-fee-name">
        <div data-field-description="subscription-fee-name" {...previewHover("subscriptionFee.name")}>
          <ComboboxInput
            highlightKey="subscriptionFee.name"
            isHighlighted={isHighlighted}
            textFieldInputClasses={textFieldInputClasses}
            value={fee.name}
            onChange={(value) => updateSubscriptionFeeName(feeId, value)}
            onKeyDown={handleEnterToClose}
            placeholder={t("e.g. Platform Fee, Base Subscription")}
            onFocus={() => setFocusedField("subscriptionFee.name")}
            onBlur={() => setFocusedField(null)}
            className={validationErrorClass(`subscriptionFee.${feeId}.name`)}
            allSuggestions={existingFeeNames}
            suggestions={existingFeeNames.filter(n => n !== fee.name)}
            onLabelActionChange={setNameLabelAction}
          />
          <FieldError message={validationErrorMessage(`subscriptionFee.${feeId}.name`)} />
        </div>
      </FormRow>
      <FormRow label={t("Service interval")} fieldDescriptionId="subscription-fee-servicing-period" hint={<FieldHint t={t} text="How often this fee is charged." visible />}>
        <div data-field-description="subscription-fee-servicing-period" className="w-full">
          <SegmentedControl
            value={subscriptionFeePeriods[feeId] ?? servicingPeriodOptions[0]}
            onChange={(next) => setSubscriptionFeePeriods((prev) => ({ ...prev, [feeId]: next }))}
            options={servicingPeriodOptions}
            getDisplayValue={t}
          />
        </div>
      </FormRow>
      <FormRow label={t("Price type")} fieldDescriptionId="subscription-fee-price-type" docsUrl="https://docs.stripe.com/products-prices/pricing-models">
        <div data-field-description="subscription-fee-price-type" className="w-full">
          <SegmentedControl
            value={subscriptionFeePriceTypes[feeId] ?? planPriceTypeOptions[0]}
            onChange={(next) => setSubscriptionFeePriceTypes((prev) => ({ ...prev, [feeId]: next }))}
            options={planPriceTypeOptions}
            getDisplayValue={t}
          />
        </div>
      </FormRow>
      <FormRow label={t("Sell as")} fieldDescriptionId="subscription-fee-sell-as">
        <div data-field-description="subscription-fee-sell-as" className="w-full">
          <SegmentedControl
            value={subscriptionFeeSellAs[feeId] ?? subscriptionFeeSellAsOptions[0]}
            onChange={(next) => setSubscriptionFeeSellAs((prev) => ({ ...prev, [feeId]: next }))}
            options={subscriptionFeeSellAsOptions}
            getDisplayValue={t}
          />
        </div>
      </FormRow>
      <FormRow label={t("Price per subscription")} fieldDescriptionId="subscription-fee-unit-price">
        <div data-field-description="subscription-fee-unit-price" {...previewHover("subscriptionFee.amount")}>
          {isHighlighted("subscriptionFee.amount") ? (
            <div className={`${pf.prefixInputWrapper} border-l-[3px] border-l-[#533AFD]`}>
              <span className={pf.prefixColor}>$</span>
              <span className="rounded-[3px] bg-[#E0D9FB] px-0.5">{subscriptionFeeAmounts[feeId] || "0.00"}</span>
            </div>
          ) : (
            <div className={`${pf.prefixInputWrapper} ${validationErrorClass(`subscriptionFee.${feeId}.amount`)}`}>
              <span className={pf.prefixColor}>$</span>
              <input
                className="w-full bg-transparent outline-none"
                placeholder="0.00"
                inputMode="decimal"
                value={subscriptionFeeAmounts[feeId] ?? ""}
                onChange={(event) => {
                  const v = event.target.value.replace(/[^0-9.]/g, "")
                  setSubscriptionFeeAmounts((prev) => ({ ...prev, [feeId]: v }))
                }}
                onKeyDown={handleEnterToClose}
                onFocus={() => setFocusedField("subscriptionFee.amount")}
                onBlur={() => setFocusedField(null)}
              />
            </div>
          )}
          <FieldError message={validationErrorMessage(`subscriptionFee.${feeId}.amount`)} />
        </div>
      </FormRow>
      <FormRow label={t("Subscription label")} fieldDescriptionId="subscription-fee-unit-label">
        <div data-field-description="subscription-fee-unit-label">
          <HighlightedInput
            highlightKey="subscriptionFee.unitLabel"
            isHighlighted={isHighlighted}
            textFieldInputClasses={textFieldInputClasses}
            value={subscriptionFeeUnitLabels[feeId] ?? ""}
            onChange={(event) => setSubscriptionFeeUnitLabels((prev) => ({ ...prev, [feeId]: event.target.value }))}
            onKeyDown={handleEnterToClose}
            placeholder={t("e.g. seat")}
            className={validationErrorClass(`subscriptionFee.${feeId}.unitLabel`)}
          />
          <FieldError message={validationErrorMessage(`subscriptionFee.${feeId}.unitLabel`)} />
        </div>
      </FormRow>
      <div
        id="subscription-fee-advanced-settings"
        aria-hidden={!showSubscriptionFeeAdvanced}
        inert={!showSubscriptionFeeAdvanced}
        className={`grid min-w-0 transition-[grid-template-rows,opacity] duration-200 ease-out ${
          showSubscriptionFeeAdvanced ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex min-w-0 flex-col gap-[12px] pb-[8px]">
          <p className={`px-4 ${pf.sectionTitle}`}>{t("Item settings")}</p>
          <FormRow label={t("Product tax code")}>
            <Selector
              ariaLabel={t("Product tax code")}
              size="sm"
              value={subscriptionFeeTaxCodes[feeId] ?? "Audiobook"}
              onChange={(next) => setSubscriptionFeeTaxCodes((prev) => ({ ...prev, [feeId]: next }))}
              options={["Audiobook"]}
              getDisplayValue={t}
              buttonClassName={pf.selectorButton}
              highlightValue={isHighlighted("subscriptionFee.taxCode")}
              fullWidth
            />
          </FormRow>
          <FormRow label={t("Item lookup key")}>
            <input
              className={`${textFieldInputClasses} ${highlightInputClass("subscriptionFee.itemLookupKey")}`}
              value={subscriptionFeeItemLookupKeys[feeId] ?? ""}
              onChange={(event) => setSubscriptionFeeItemLookupKeys((prev) => ({ ...prev, [feeId]: event.target.value }))}
              onKeyDown={handleEnterToClose}
              placeholder={t("e.g. XYZ")}
            />
          </FormRow>
          <FormRow label={t("Item metadata")} layout="stacked" rightWidthPx={null}>
            <div className="flex w-full flex-col gap-[8px]">
              {itemMetadataRows.map((rowId) => (
                <div key={rowId} className="flex items-center gap-[8px]">
                  <input
                    className={`${textFieldInputClasses} ${highlightInputClass("subscriptionFee.itemMetadata")}`}
                    placeholder={t("e.g. feature_tier")}
                    aria-label={t("Subscription fee item metadata key")}
                    value={subscriptionFeeItemMetadataValues[feeId]?.[rowId]?.key ?? ""}
                    onChange={(event) =>
                      setSubscriptionFeeItemMetadataValues((prev) => ({
                        ...prev,
                        [feeId]: {
                          ...(prev[feeId] ?? {}),
                          [rowId]: {
                            key: event.target.value,
                            value: prev[feeId]?.[rowId]?.value ?? "",
                          },
                        },
                      }))
                    }
                    onKeyDown={handleEnterToClose}
                  />
                  <input
                    className={`${textFieldInputClasses} ${highlightInputClass("subscriptionFee.itemMetadata")}`}
                    placeholder={t("e.g. enterprise")}
                    aria-label={t("Subscription fee item metadata value")}
                    value={subscriptionFeeItemMetadataValues[feeId]?.[rowId]?.value ?? ""}
                    onChange={(event) =>
                      setSubscriptionFeeItemMetadataValues((prev) => ({
                        ...prev,
                        [feeId]: {
                          ...(prev[feeId] ?? {}),
                          [rowId]: {
                            key: prev[feeId]?.[rowId]?.key ?? "",
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
                    onClick={() => removeMetadataRow(setSubscriptionFeeItemMetadataRows, feeId, rowId, setSubscriptionFeeItemMetadataValues)}
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={pf.inlineAddButton}
                onClick={() => addMetadataRow(setSubscriptionFeeItemMetadataRows, feeId, setSubscriptionFeeItemMetadataValues)}
              >
                {t("Add item metadata")}
              </button>
            </div>
          </FormRow>
          <p className={`px-4 ${pf.sectionTitle}`}>{t("Fee settings")}</p>
          <FormRow label={t("Fee lookup key")}>
            <input
              className={`${textFieldInputClasses} ${highlightInputClass("subscriptionFee.feeLookupKey")}`}
              value={subscriptionFeeFeeLookupKeys[feeId] ?? ""}
              onChange={(event) => setSubscriptionFeeFeeLookupKeys((prev) => ({ ...prev, [feeId]: event.target.value }))}
              onKeyDown={handleEnterToClose}
              placeholder={t("e.g. XYZ")}
            />
          </FormRow>
          <FormRow label={t("Fee metadata")} layout="stacked" rightWidthPx={null}>
            <div className="flex w-full flex-col gap-[8px]">
              {feeMetadataRows.map((rowId) => (
                <div key={rowId} className="flex items-center gap-[8px]">
                  <input
                    className={`${textFieldInputClasses} ${highlightInputClass("subscriptionFee.feeMetadata")}`}
                    placeholder={t("e.g. billing_type")}
                    aria-label={t("Subscription fee fee metadata key")}
                    value={subscriptionFeeFeeMetadataValues[feeId]?.[rowId]?.key ?? ""}
                    onChange={(event) =>
                      setSubscriptionFeeFeeMetadataValues((prev) => ({
                        ...prev,
                        [feeId]: {
                          ...(prev[feeId] ?? {}),
                          [rowId]: {
                            key: event.target.value,
                            value: prev[feeId]?.[rowId]?.value ?? "",
                          },
                        },
                      }))
                    }
                    onKeyDown={handleEnterToClose}
                  />
                  <input
                    className={`${textFieldInputClasses} ${highlightInputClass("subscriptionFee.feeMetadata")}`}
                    placeholder={t("e.g. recurring")}
                    aria-label={t("Subscription fee fee metadata value")}
                    value={subscriptionFeeFeeMetadataValues[feeId]?.[rowId]?.value ?? ""}
                    onChange={(event) =>
                      setSubscriptionFeeFeeMetadataValues((prev) => ({
                        ...prev,
                        [feeId]: {
                          ...(prev[feeId] ?? {}),
                          [rowId]: {
                            key: prev[feeId]?.[rowId]?.key ?? "",
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
                    onClick={() => removeMetadataRow(setSubscriptionFeeFeeMetadataRows, feeId, rowId, setSubscriptionFeeFeeMetadataValues)}
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={pf.inlineAddButton}
                onClick={() => addMetadataRow(setSubscriptionFeeFeeMetadataRows, feeId, setSubscriptionFeeFeeMetadataValues)}
              >
                {t("Add metadata")}
              </button>
            </div>
          </FormRow>
          </div>
        </div>
      </div>
      <button
        type="button"
        aria-expanded={showSubscriptionFeeAdvanced}
        aria-controls="subscription-fee-advanced-settings"
        className={pf.advancedButton}
        onClick={() => setShowSubscriptionFeeAdvanced((prev) => !prev)}
      >
        <span className={pf.advancedLabel}>
          {t("Advanced settings")}
        </span>
        <LargeChevronIcon rotated={showSubscriptionFeeAdvanced} />
      </button>
    </div>
  )
}
