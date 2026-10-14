'use client'

import type { ComponentType } from "react"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MeterPreviewPanel } from "@/components/creation-workspace/MeterPreviewPanel"
import { CreationModalShell } from "./CreationModalShell"

type WizardStep = {
  id: string
  label: string
  kind: string
  FormComponent: ComponentType<{ data: Record<string, any>; onChange: (data: Record<string, any>) => void; onAddObject?: (kind: string) => void }>
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
}

type WizardCreationModalProps = {
  isOpen: boolean
  label: string
  steps: WizardStep[]
  onClose: () => void
  onAddObject?: (kind: string) => void
  meters?: { name: string; displayName?: string; aggregation: string; valueKey?: string }[]
  unitPrice?: string
  currency?: string
  /** When set, the wizard will jump to the step with this id */
  focusStepId?: string | null
}

export function WizardCreationModal({
  isOpen,
  label,
  steps,
  onClose,
  onAddObject,
  meters = [],
  unitPrice,
  currency,
  focusStepId,
}: WizardCreationModalProps) {
  const hasReviewStep = meters.length > 0
  const totalSteps = steps.length + (hasReviewStep ? 1 : 0)
  const [currentStepIdx, setCurrentStepIdx] = useState(0)

  useEffect(() => {
    if (focusStepId) {
      const idx = steps.findIndex((s) => s.id === focusStepId)
      if (idx >= 0) setCurrentStepIdx(idx)
    }
  }, [focusStepId, steps])
  const isReviewStep = hasReviewStep && currentStepIdx === steps.length
  const isLastStep = currentStepIdx === totalSteps - 1
  const isFirstStep = currentStepIdx === 0
  const currentStep = steps[currentStepIdx]
  const currentStepIsMeter = currentStep?.kind === "meter"
  const modalWidth = currentStepIsMeter ? "w-[780px]" : "w-[480px]"

  const handleNext = () => {
    if (isLastStep) {
      onClose()
    } else {
      setCurrentStepIdx((i) => i + 1)
    }
  }

  const handleBack = () => {
    if (!isFirstStep) setCurrentStepIdx((i) => i - 1)
  }

  const cancelButton = (
    <button
      type="button"
      className="flex h-[28px] items-center rounded-[6px] px-[10px] text-[12px] font-[500] text-[#596171] transition-colors hover:bg-[#F5F6F8]"
      onClick={onClose}
    >
      Cancel
    </button>
  )

  const stepDots = (
    <div className="mt-[10px] flex items-center gap-[8px]">
      {steps.map((step, i) => (
        <button
          key={step.id}
          type="button"
          className="flex items-center gap-[4px]"
          onClick={() => setCurrentStepIdx(i)}
        >
          <div className={`h-[6px] w-[6px] rounded-full transition-colors ${
            i === currentStepIdx && !isReviewStep ? "bg-[#533AFD]" : i < currentStepIdx ? "bg-[#533AFD]/40" : "bg-[#D4DEE9]"
          }`} />
          <span className={`text-[11px] font-[500] transition-colors ${
            i === currentStepIdx && !isReviewStep ? "text-[#353A44]" : "text-[#9CA3B0]"
          }`}>
            {step.label}
          </span>
        </button>
      ))}
      {hasReviewStep && (
        <button
          type="button"
          className="flex items-center gap-[4px]"
          onClick={() => setCurrentStepIdx(steps.length)}
        >
          <div className={`h-[6px] w-[6px] rounded-full transition-colors ${
            isReviewStep ? "bg-[#533AFD]" : "bg-[#D4DEE9]"
          }`} />
          <span className={`text-[11px] font-[500] transition-colors ${
            isReviewStep ? "text-[#353A44]" : "text-[#9CA3B0]"
          }`}>
            Review
          </span>
        </button>
      )}
    </div>
  )

  const wizardFooter = (
    <div className="flex items-center justify-between border-t border-[#ECF1F6] px-[20px] py-[12px]">
      <button
        type="button"
        className={`flex h-[28px] items-center rounded-[6px] px-[10px] text-[12px] font-[500] transition-colors ${
          isFirstStep ? "text-[#D4DEE9] cursor-not-allowed" : "text-[#596171] hover:bg-[#F5F6F8]"
        }`}
        onClick={handleBack}
        disabled={isFirstStep}
      >
        ← Back
      </button>
      <div className="flex items-center gap-[4px]">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-[4px] rounded-full transition-all ${
              i <= currentStepIdx ? "w-[16px] bg-[#533AFD]" : "w-[4px] bg-[#D4DEE9]"
            }`}
          />
        ))}
      </div>
      <button
        type="button"
        className="flex h-[28px] items-center rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white transition-colors hover:bg-[#4730E0]"
        onClick={handleNext}
      >
        {isLastStep ? "Create" : "Next →"}
      </button>
    </div>
  )

  return (
    <CreationModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={`New ${label.toLowerCase()}`}
      modalWidth={modalWidth}
      headerActions={cancelButton}
      headerExtra={stepDots}
      footer={wizardFooter}
    >
      <div className="flex min-h-0 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepIdx}
            className={`flex min-h-0 flex-1 ${currentStepIsMeter ? "" : "flex-col"}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
          >
            {isReviewStep ? (
              <div className="flex-1 overflow-y-auto px-[20px] py-[16px]">
                <MeterPreviewPanel meters={meters} unitPrice={unitPrice} currency={currency} />
              </div>
            ) : currentStepIsMeter && currentStep ? (
              <>
                <div className="w-[400px] overflow-y-auto border-r border-[#ECF1F6] px-[20px] py-[16px]">
                  <currentStep.FormComponent
                    data={currentStep.data}
                    onChange={currentStep.onChange}
                    onAddObject={onAddObject}
                  />
                </div>
                <div className="flex-1 overflow-y-auto bg-[#F8FAFB] px-[20px] py-[16px]">
                  <MeterPreviewPanel
                    meters={[{
                      name: currentStep.data.name || "",
                      displayName: currentStep.data.displayName || "",
                      aggregation: currentStep.data.aggregation || "sum",
                      valueKey: currentStep.data.valueKey || "",
                    }]}
                    unitPrice={unitPrice}
                    currency={currency}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto px-[20px] py-[16px]">
                {currentStep && (
                  <currentStep.FormComponent
                    data={currentStep.data}
                    onChange={currentStep.onChange}
                    onAddObject={onAddObject}
                  />
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </CreationModalShell>
  )
}
