"use client"

import { FormRow } from "@/components/FormRow"
import { SegmentedControl } from "@/components/SegmentedControl"
import { Selector } from "@/components/Selector"
import { useFocusedField } from "@/components/product-catalog/FocusedFieldContext"
import { LargeChevronIcon, TrashIcon } from "@/components/ProductCatalogIcons"
import { DetailChipsOverflow, type DetailChipItem } from "@/components/DetailChipsOverflow"
import type { PlanFormContext } from "./planFormTypes"
import { HighlightedInput, InputSkeleton } from "./HighlightedInput"
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

type RateCardFormProps = {
  ctx: PlanFormContext
  isHighlighted: (key: string) => boolean
  highlightInputClass: (key: string) => string
  isLoading: (key: string) => boolean
  validationErrorClass: (key: string) => string
  validationErrorMessage: (key: string) => string | undefined
}

export function RateCardForm({ ctx, isHighlighted, highlightInputClass, isLoading, validationErrorClass, validationErrorMessage }: RateCardFormProps) {
  const {
    t,
    textFieldInputClasses,
    productFormStyle,
    activePlanNode,
    activePlanRateCardId,
    planRateCards,
    getMetadataRows,
    addMetadataRow,
    removeMetadataRow,
    rateCardServicingPeriods,
    setRateCardServicingPeriods,
    servicingPeriodOptions,
    rateCardLookupKeys,
    setRateCardLookupKeys,
    showRateCardAdvanced,
    setShowRateCardAdvanced,
    updateRateCardName,
    rateCardMetadataRows,
    setRateCardMetadataRows,
    rateCardMetadataValues,
    setRateCardMetadataValues,
    onEditAllRates,
  } = ctx

  const pf = getPlanFormTokens(productFormStyle)
  const closeForm = usePlanFormClose()
  const handleEnterToClose = createEnterToCloseHandler(closeForm)
  const { setFocusedField, setHoveredField } = useFocusedField()
  const previewHover = (field: string) => ({
    onMouseEnter: () => setHoveredField(field),
    onMouseLeave: () => setHoveredField(null),
  })

  const rateCardId = activePlanNode.id ?? activePlanRateCardId
  const rateCard = planRateCards.find((card) => card.id === rateCardId)
  const metadataRows = getMetadataRows(rateCardMetadataRows, rateCardId)
  const lookupKeySummary = (rateCardLookupKeys[rateCardId] ?? "").trim()
  const metadataFilledCount = countFilledMetadataEntries(rateCardMetadataValues[rateCardId], metadataRows)
  const canBulkEditRates = Boolean(onEditAllRates) && (rateCard?.rates.length ?? 0) > 0

  const advancedItems: DetailChipItem[] = [
    {
      id: "rateCard.lookupKey",
      label: lookupKeySummary ? chipWithValue(t("Lookup key"), lookupKeySummary) : t("Lookup key"),
      onClick: () => {
        setShowRateCardAdvanced(true)
        window.setTimeout(() => focusElement(`input[aria-label="${t("Rate card lookup key")}"]`), 140)
      },
    },
    {
      id: "rateCard.metadata",
      label: metadataFilledCount > 0 ? chipWithValue(t("Metadata"), metadataFilledCount) : t("Metadata"),
      onClick: () => {
        setShowRateCardAdvanced(true)
        if (metadataRows.length === 0) {
          addMetadataRow(setRateCardMetadataRows, rateCardId, setRateCardMetadataValues)
        }
        window.setTimeout(() => focusElement(`input[aria-label="${t("Rate card metadata key")}"]`), 140)
      },
    },
  ]

  return (
    <div className="flex flex-col gap-[12px] min-w-0">
      <FormRow label={t("Display name")} fieldDescriptionId="ratecard-name" hint={<FieldHint t={t} text="Shows on the customer portal and Checkout." visible />}>
        <div data-field-description="ratecard-name" {...previewHover("rateCard.name")}>
          {isLoading(`rateCard.${rateCardId}.name`) ? (
            <InputSkeleton />
          ) : (
            <>
              <HighlightedInput
                highlightKey="rateCard.name"
                isHighlighted={isHighlighted}
                textFieldInputClasses={textFieldInputClasses}
                value={rateCard?.name ?? ""}
                onChange={(event) => updateRateCardName(rateCardId, event.target.value)}
                onKeyDown={handleEnterToClose}
                placeholder={t("e.g. Enterprise 2024, PayGo simple rates")}
                onFocus={() => setFocusedField("rateCard.name")}
                onBlur={() => setFocusedField(null)}
                className={validationErrorClass(`rateCard.${rateCardId}.name`)}
              />
              <FieldError message={validationErrorMessage(`rateCard.${rateCardId}.name`)} />
            </>
          )}
        </div>
      </FormRow>
      <FormRow label={t("Service interval")} fieldDescriptionId="ratecard-servicing-period">
        <div data-field-description="ratecard-servicing-period" className="w-full" {...previewHover("rateCard.servicingPeriod")}>
          <SegmentedControl
            value={rateCardServicingPeriods[rateCardId] ?? servicingPeriodOptions[0]}
            onChange={(next) => setRateCardServicingPeriods((prev) => ({ ...prev, [rateCardId]: next }))}
            options={servicingPeriodOptions}
            getDisplayValue={t}
            onFocus={() => setFocusedField("rateCard.servicingPeriod")}
            onBlur={() => setFocusedField(null)}
          />
        </div>
      </FormRow>
      <div
        id="rate-card-advanced-settings"
        aria-hidden={!showRateCardAdvanced}
        inert={!showRateCardAdvanced}
        className={`grid min-w-0 transition-[grid-template-rows,opacity] duration-200 ease-out ${
          showRateCardAdvanced ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex min-w-0 flex-col gap-[12px] pb-[8px]">
            <FormRow label={t("Lookup key")} fieldDescriptionId="ratecard-lookup-key">
              <div data-field-description="ratecard-lookup-key">
                <input
                  className={`${textFieldInputClasses} ${highlightInputClass("rateCard.lookupKey")}`}
                  aria-label={t("Rate card lookup key")}
                  value={rateCardLookupKeys[rateCardId] ?? ""}
                  onChange={(event) => setRateCardLookupKeys((prev) => ({ ...prev, [rateCardId]: event.target.value }))}
                  onKeyDown={handleEnterToClose}
                  placeholder={t("e.g. api_calls")}
                />
              </div>
            </FormRow>
            <FormRow label={t("Metadata")} fieldDescriptionId="ratecard-metadata" layout="stacked" rightWidthPx={null}>
              <div data-field-description="ratecard-metadata" className="flex w-full flex-col gap-[8px]">
                {metadataRows.map((rowId) => (
                  <div key={rowId} className="flex items-center gap-[8px]">
                    <input
                      className={`${textFieldInputClasses} ${highlightInputClass("rateCard.metadata")}`}
                      aria-label={t("Rate card metadata key")}
                      placeholder={t("e.g. category")}
                      value={rateCardMetadataValues[rateCardId]?.[rowId]?.key ?? ""}
                      onChange={(event) =>
                        setRateCardMetadataValues((prev) => ({
                          ...prev,
                          [rateCardId]: {
                            ...(prev[rateCardId] ?? {}),
                            [rowId]: {
                              key: event.target.value,
                              value: prev[rateCardId]?.[rowId]?.value ?? "",
                            },
                          },
                        }))
                      }
                      onKeyDown={handleEnterToClose}
                    />
                    <input
                      className={`${textFieldInputClasses} ${highlightInputClass("rateCard.metadata")}`}
                      aria-label={t("Rate card metadata value")}
                      placeholder={t("e.g. compute")}
                      value={rateCardMetadataValues[rateCardId]?.[rowId]?.value ?? ""}
                      onChange={(event) =>
                        setRateCardMetadataValues((prev) => ({
                          ...prev,
                          [rateCardId]: {
                            ...(prev[rateCardId] ?? {}),
                            [rowId]: {
                              key: prev[rateCardId]?.[rowId]?.key ?? "",
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
                      onClick={() => removeMetadataRow(setRateCardMetadataRows, rateCardId, rowId, setRateCardMetadataValues)}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className={pf.inlineAddButton}
                  onClick={() => addMetadataRow(setRateCardMetadataRows, rateCardId, setRateCardMetadataValues)}
                >
                  {t("Add metadata")}
                </button>
              </div>
            </FormRow>
          </div>
        </div>
      </div>
      {canBulkEditRates && (
        <button
          type="button"
          className={productFormStyle === "refresh"
            ? "mx-4 flex h-[26px] w-[calc(100%-32px)] items-center justify-center rounded-[6px] border border-[#EAF0F6] bg-white px-[8px] text-[13px] font-[500] leading-[20px] tracking-[-0.065px] text-[#142234] transition-colors hover:bg-[#F6F9FC]"
            : productFormStyle === "sail"
              ? "mx-4 flex h-[26px] w-[calc(100%-32px)] items-center justify-center rounded-[6px] border border-[#D4DEE9] bg-white px-[8px] text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
              : "mx-4 flex h-[26px] w-[calc(100%-32px)] items-center justify-center rounded-[6px] border border-[#D4DEE9] bg-white px-[8px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
          }
          onClick={() => onEditAllRates?.(rateCardId)}
        >
          {t("Edit all rates")}
        </button>
      )}
      <button
        type="button"
        aria-expanded={showRateCardAdvanced}
        aria-controls="rate-card-advanced-settings"
        className={pf.advancedButton}
        onClick={() => setShowRateCardAdvanced((prev) => !prev)}
      >
        <span className={pf.advancedLabel}>
          {t("Advanced settings")}
        </span>
        <LargeChevronIcon rotated={showRateCardAdvanced} />
      </button>
    </div>
  )
}
