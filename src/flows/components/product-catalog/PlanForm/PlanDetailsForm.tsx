"use client"

import { FormRow } from "@/components/FormRow"
import { Selector } from "@/components/Selector"
import { CurrencyFlag } from "@/components/CurrencyFlag"
import { LargeChevronIcon, PhotoIcon, TrashIcon } from "@/components/ProductCatalogIcons"
import { useFocusedField } from "@/components/product-catalog/FocusedFieldContext"
import type { PlanFormContext } from "./planFormTypes"
import { HighlightedInput } from "./HighlightedInput"
import { createEnterToCloseHandler, FieldError, getPlanFormTokens } from "./planFormUtils"
import { getFormTokens } from "@/components/creation-workspace/forms/shared/formTokens"
import { useInputFill } from "@/components/creation-workspace/inputFill"
import { FieldHint } from "./QuickStartTip"
import { usePlanFormClose } from "./PlanFormCloseContext"

type PlanDetailsFormProps = {
  ctx: PlanFormContext
  isHighlighted: (key: string) => boolean
  highlightInputClass: (key: string) => string
  validationErrorClass: (key: string) => string
  validationErrorMessage: (key: string) => string | undefined
}

export function PlanDetailsForm({ ctx, isHighlighted, highlightInputClass, validationErrorClass, validationErrorMessage }: PlanDetailsFormProps) {
  const { inputFill } = useInputFill()
  const {
    t,
    textFieldInputClasses,
    productFormStyle,
    currencyOptions,
    currencyDisplayNames,
    planName,
    setPlanName,
    planDescription,
    setPlanDescription,
    planCurrency,
    setPlanCurrency,
    planLookupKey,
    setPlanLookupKey,
    planTaxTreatment,
    setPlanTaxTreatment,
    getMetadataRows,
    addMetadataRow,
    removeMetadataRow,
    planMetadataRows,
    setPlanMetadataRows,
    planMetadataValues,
    setPlanMetadataValues,
    showPlanAdvanced,
    setShowPlanAdvanced,
  } = ctx

  const pf = getPlanFormTokens(productFormStyle)
  const planMetaId = 0
  const metadataRows = getMetadataRows(planMetadataRows, planMetaId)

  const closeForm = usePlanFormClose()
  const handleEnterToClose = createEnterToCloseHandler(closeForm)
  const { setFocusedField, setHoveredField } = useFocusedField()
  const previewHover = (field: string) => ({
    onMouseEnter: () => setHoveredField(field),
    onMouseLeave: () => setHoveredField(null),
  })

  return (
    <div className="flex flex-col gap-[12px] min-w-0">
      <FormRow label={t("Display name")} fieldDescriptionId="plan-name">
        <div data-field-description="plan-name" {...previewHover("plan.name")}>
          <HighlightedInput
            highlightKey="plan.name"
            isHighlighted={isHighlighted}
            textFieldInputClasses={textFieldInputClasses}
            value={planName}
            onChange={(event) => setPlanName(event.target.value)}
            onKeyDown={handleEnterToClose}
            ariaLabel={t("Plan name")}
            placeholder={t("e.g. Pro plan")}
            onFocus={() => setFocusedField("plan.name")}
            onBlur={() => setFocusedField(null)}
            className={validationErrorClass("plan.name")}
          />
          <FieldError message={validationErrorMessage("plan.name")} />
        </div>
      </FormRow>
      <FormRow label={t("Currency")} fieldDescriptionId="plan-currency">
        <div data-field-description="plan-currency" {...previewHover("plan.currency")}>
          <Selector
            ariaLabel={t("Currency")}
            size="sm"
            value={planCurrency}
            onChange={setPlanCurrency}
            onOpenChange={(open) => setFocusedField(open ? "plan.currency" : null)}
            options={currencyOptions}
            getDisplayValue={(value) => value}
            buttonClassName={pf.selectorButton}
            highlightValue={isHighlighted("plan.currency")}
            searchable
            searchPlaceholder={t("Search currencies")}
            triggerIcon={<CurrencyFlag currency={planCurrency} size={14} />}
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
            fullWidth
          />
        </div>
      </FormRow>
      <FormRow label={t("Include tax in prices")} fieldDescriptionId="plan-taxes" docsUrl="https://docs.stripe.com/tax/products-prices-tax-codes-tax-behavior">
        <div data-field-description="plan-taxes">
          <Selector
            ariaLabel={t("Taxes")}
            size="sm"
            value={planTaxTreatment}
            onChange={setPlanTaxTreatment}
            options={["Yes", "No"]}
            getDisplayValue={t}
            buttonClassName={pf.selectorButton}
            highlightValue={isHighlighted("plan.taxTreatment")}
            fullWidth
          />
        </div>
      </FormRow>
      <div
        id="plan-details-advanced-settings"
        aria-hidden={!showPlanAdvanced}
        inert={!showPlanAdvanced}
        className={`grid min-w-0 transition-[grid-template-rows,opacity] duration-200 ease-out ${
          showPlanAdvanced ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex min-w-0 flex-col gap-[12px] pb-[8px]">
          <FormRow label={t("Description")} hint={<FieldHint t={t} text="Shows on your Checkout and Invoice." visible />} rightWidthPx={null}>
            <div data-field-description="plan-description" className="w-full" {...previewHover("plan.description")}>
              <textarea
                className={`${getFormTokens(productFormStyle, { filled: inputFill }).textareaClass.replace("min-h-[80px]", "min-h-[120px]")} ${highlightInputClass(
                  "plan.description"
                )} ${validationErrorClass("plan.description")}`}
                value={planDescription}
                onChange={(event) => setPlanDescription(event.target.value)}
                aria-label={t("Description")}
                placeholder={t("Briefly describe what this plan includes")}
                onFocus={() => setFocusedField("plan.description")}
                onBlur={() => setFocusedField(null)}
              />
              <FieldError message={validationErrorMessage("plan.description")} />
            </div>
          </FormRow>
          <FormRow label={t("Lookup key")} hint={<FieldHint t={t} text="Unique identifier in code." visible />} fieldDescriptionId="plan-lookup-key">
            <div data-field-description="plan-lookup-key">
              <input
                className={`${textFieldInputClasses} ${highlightInputClass("plan.lookupKey")} ${validationErrorClass("plan.lookupKey")}`}
                value={planLookupKey}
                onChange={(event) => setPlanLookupKey(event.target.value)}
                onKeyDown={handleEnterToClose}
                aria-label={t("Lookup key")}
                placeholder={t("e.g. pro_plan")}
              />
              <FieldError message={validationErrorMessage("plan.lookupKey")} />
            </div>
          </FormRow>
          <FormRow label={t("Metadata")} layout="stacked" rightWidthPx={null}>
            <div className="flex w-full flex-col gap-[8px]">
              {metadataRows.map((rowId) => (
                <div key={rowId} className="flex items-center gap-[8px]">
                  <input
                    className={`${textFieldInputClasses} ${highlightInputClass("plan.metadata")}`}
                    aria-label={t("Plan metadata key")}
                    placeholder={t("Key")}
                    value={planMetadataValues[planMetaId]?.[rowId]?.key ?? ""}
                    onChange={(event) =>
                      setPlanMetadataValues((prev) => ({
                        ...prev,
                        [planMetaId]: {
                          ...(prev[planMetaId] ?? {}),
                          [rowId]: {
                            key: event.target.value,
                            value: prev[planMetaId]?.[rowId]?.value ?? "",
                          },
                        },
                      }))
                    }
                    onKeyDown={handleEnterToClose}
                  />
                  <input
                    className={`${textFieldInputClasses} ${highlightInputClass("plan.metadata")}`}
                    aria-label={t("Plan metadata value")}
                    placeholder={t("Value")}
                    value={planMetadataValues[planMetaId]?.[rowId]?.value ?? ""}
                    onChange={(event) =>
                      setPlanMetadataValues((prev) => ({
                        ...prev,
                        [planMetaId]: {
                          ...(prev[planMetaId] ?? {}),
                          [rowId]: {
                            key: prev[planMetaId]?.[rowId]?.key ?? "",
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
                    onClick={() => removeMetadataRow(setPlanMetadataRows, planMetaId, rowId, setPlanMetadataValues)}
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={pf.inlineAddButton}
                onClick={() => addMetadataRow(setPlanMetadataRows, planMetaId, setPlanMetadataValues)}
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
        aria-expanded={showPlanAdvanced}
        aria-controls="plan-details-advanced-settings"
        className={pf.advancedButton}
        onClick={() => setShowPlanAdvanced((prev) => !prev)}
      >
        <span className={pf.advancedLabel}>
          {t("Advanced settings")}
        </span>
        <LargeChevronIcon rotated={showPlanAdvanced} />
      </button>
    </div>
  )
}
