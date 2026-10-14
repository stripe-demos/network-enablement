'use client'

import type { ComponentProps, ReactNode } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

import { ProductFormOverlay } from "@/components/ProductFormOverlay"
import { PlanFormSkeleton, PlanFormSkeletonHeader } from "@/components/product-catalog/PlanFormSkeleton"
import { PricingPlanModalBody } from "@/components/product-catalog/PricingPlanModalBody"
import { PricingPlanModalHeader } from "@/components/product-catalog/PricingPlanModalHeader"
import { PlanCodeView } from "@/components/product-catalog/PlanCodeView"
import { CoachmarkOverlay, CoachmarkPulse, type CoachmarkStep } from "@/components/product-catalog/Coachmark"
import { ValidationAttentionPanel } from "@/components/product-catalog/IncompleteFieldsModal"
import { BulkEditHeaderVisibleContext } from "@/components/product-catalog/BulkRateEditor"
import { SaveVersionModal } from "@/components/product-catalog/SaveVersionModal"
import { useLayoutMode } from "@/components/product-catalog/layoutMode"
import { useOnboardingMode } from "@/components/product-catalog/onboardingMode"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { useBulkEditTransition } from "@/components/product-catalog/bulkEditTransition"
import { useConsoleSlideDirection } from "@/components/creation-workspace/consoleSlideDirection"
import { ConsoleChatPane } from "@/components/creation-workspace/ConsoleChatPane"
import { COACHMARK_STEPS_LAYOUT_A, COACHMARK_STEPS_LAYOUT_B, DYNAMIC_COACHMARK_MAP, INTRO_COACHMARK_STEPS } from "@/lib/example-pricing-plan"
import type { ValidationErrorObject } from "@/components/product-catalog/PlanForm/validatePlanForm"

const INTRO_COACHMARK_STORAGE_KEY = "pricing-plan-intro-coachmark-seen"

type PricingPlanModalOverlayProps = {
  overlayProps: Omit<ComponentProps<typeof ProductFormOverlay>, "header" | "children">
  headerProps: ComponentProps<typeof PricingPlanModalHeader>
  bodyProps: ComponentProps<typeof PricingPlanModalBody>
  coachmarkProps?: {
    isActive: boolean
    currentStep: number
    steps: CoachmarkStep[]
    onNext: () => void
    onPrev: () => void
    onClose: () => void
    onNavigateToStep: (stepId: string) => void
  }
  /** Single dynamic coachmark (on-first-click) – no tour UI, just close. */
  activeCoachmark?: string | null
  onDismissCoachmark?: () => void
  /** Validation error objects for the attention panel */
  validationErrorObjects?: ValidationErrorObject[]
  /** Callback when user clicks an error object to navigate to its form */
  onNavigateToValidationError?: (obj: ValidationErrorObject) => void
  /** Callback to dismiss the validation attention panel */
  onDismissValidationPanel?: () => void
  /** Props for the save version modal (when defined, the modal is rendered) */
  saveVersionModalProps?: ComponentProps<typeof SaveVersionModal>
  /** Inline wizard form rendered inside the overlay (form onboarding mode). */
  inlineWizardForm?: ReactNode
  /** When true, show skeleton instead of real content (wizard transition). */
  showSkeleton?: boolean
  /** Called when skeleton should be dismissed (after delay). */
  onSkeletonDone?: () => void
  /** Branch metadata: shown when editing a contract-branched plan. */
  branchInfo?: {
    parentPlanName: string
    syncWithParent: boolean
    onToggleSync?: () => void
    onViewParent?: () => void
  }
}

export function PricingPlanModalOverlay({ overlayProps, headerProps, bodyProps, coachmarkProps, activeCoachmark, onDismissCoachmark, validationErrorObjects, onNavigateToValidationError, onDismissValidationPanel, saveVersionModalProps, inlineWizardForm, showSkeleton, onSkeletonDone, branchInfo }: PricingPlanModalOverlayProps) {
  const { layoutMode } = useLayoutMode()
  const { productFormStyle } = useProductFormStyle()
  const isRefresh = productFormStyle === "refresh"
  // Read onboarding mode from the provider that actually wraps this overlay.
  // The same hook called from ProductCatalogPage is above the provider and
  // returns the fallback "tips" value; reading it here gives the real value.
  const { onboardingMode } = useOnboardingMode()
  // The inline get-started wizard form runs in `form` mode on an empty plan
  // root. While it's showing, hide the entire top header (plan name, +,
  // Discard, Get started). Compute synchronously here so the header never
  // flashes between modal-open and when the parent's state catches up.
  const inlineGetStartedActive = (() => {
    if (onboardingMode !== "form") return false
    if (bodyProps.editorProps?.nodeType !== "plan") return false
    if (bodyProps.showGetStarted !== true) return false
    if (bodyProps.previewProps?.isInlineGetStartedActive === true) return true
    const preview = bodyProps.previewProps
    if (!preview) return false
    const empty =
      (preview.planRateCards?.length ?? 0) === 0 &&
      (preview.planSubscriptionFees?.length ?? 0) === 0 &&
      (preview.planCreditGrants?.length ?? 0) === 0
    return empty
  })()
  const { bulkEditTransition } = useBulkEditTransition()
  const keepHeaderVisible = bulkEditTransition === "inline" || bulkEditTransition === "header"
  const collapseSidebarForBulkEdit = bodyProps.isBulkEditMode && bulkEditTransition !== "inline"

  // Console mode state (communicated up from PricingPlanModalBody)
  const [isConsoleMode, setIsConsoleMode] = useState(false)
  const [branchToggleInteracted, setBranchToggleInteracted] = useState(false)
  const { consoleSlideDirection } = useConsoleSlideDirection()
  const isHeaderSlideMode = consoleSlideDirection === "left-header"
  const [consoleContextItems, setConsoleContextItems] = useState<import("@/components/product-catalog/PlanForm/ConsoleContext").ConsoleContextItem[]>([])
  const handleOverlayCloseConsole = useCallback(() => {
    setIsConsoleMode(false)
    window.dispatchEvent(new Event("close-console-mode"))
  }, [])

  // Code popover state for Layout B
  const [isCodePopoverOpen, setIsCodePopoverOpen] = useState(false)

  // Delayed header swap for bulk edit: keep the outer header visible during the
  // 300ms entry transition, then swap it for BulkRateEditor's internal title row.
  // In inline/header modes the original header stays and the BulkRateEditor's own
  // title row stays hidden (controlled by BulkEditHeaderVisibleContext = false).
  const [bulkEditReady, setBulkEditReady] = useState(false)
  useEffect(() => {
    if (keepHeaderVisible) {
      setBulkEditReady(false)
      return
    }
    if (bodyProps.isBulkEditMode) {
      const timer = setTimeout(() => setBulkEditReady(true), 310)
      return () => clearTimeout(timer)
    } else {
      setBulkEditReady(false)
    }
  }, [bodyProps.isBulkEditMode, keepHeaderVisible])

  // Compute bulk edit title for "header" transition mode
  const t = headerProps.t
  const bulkEditTitle = useMemo(() => {
    if (bulkEditTransition !== "header" || bodyProps.bulkEditRateCardId == null) return undefined
    const rateCard = bodyProps.sidebarProps.planRateCards.find(
      (c) => c.id === bodyProps.bulkEditRateCardId
    )
    const rates = rateCard?.rates ?? []
    const rateCardName = rateCard?.name?.trim() || t("rate group")
    const count = rates.length
    return `${t("Editing")} ${count} ${count === 1 ? t("rate") : t("rates")} ${t("in")} ${rateCardName}`
  }, [bulkEditTransition, bodyProps.bulkEditRateCardId, bodyProps.sidebarProps.planRateCards, t])

  // Intro coachmark state (shown on first launch)
  const [isIntroCoachmarkActive, setIsIntroCoachmarkActive] = useState(false)
  const [introCoachmarkStep, setIntroCoachmarkStep] = useState(0)

  // Intro coachmarks disabled for now
  // useEffect(() => {
  //   if (!overlayProps.isOpen) return
  //   const timer = setTimeout(() => {
  //     try {
  //       const seen = localStorage.getItem(INTRO_COACHMARK_STORAGE_KEY)
  //       if (!seen) {
  //         setIsIntroCoachmarkActive(true)
  //         setIntroCoachmarkStep(0)
  //       }
  //     } catch {}
  //   }, 500)
  //   return () => clearTimeout(timer)
  // }, [overlayProps.isOpen])

  const handleIntroNext = () => {
    if (introCoachmarkStep < INTRO_COACHMARK_STEPS.length - 1) {
      setIntroCoachmarkStep(prev => prev + 1)
    } else {
      handleIntroClose()
    }
  }

  const handleIntroPrev = () => {
    if (introCoachmarkStep > 0) {
      setIntroCoachmarkStep(prev => prev - 1)
    }
  }

  const handleIntroClose = () => {
    setIsIntroCoachmarkActive(false)
    try {
      localStorage.setItem(INTRO_COACHMARK_STORAGE_KEY, "true")
    } catch {
      // localStorage not available
    }
  }
  
  // Use the appropriate coachmark steps based on the current layout mode
  const effectiveSteps = useMemo(() => {
    return layoutMode === "B" ? COACHMARK_STEPS_LAYOUT_B : COACHMARK_STEPS_LAYOUT_A
  }, [layoutMode])
  
  // Clamp the current step index to valid range for the effective steps
  const effectiveCurrentStep = coachmarkProps 
    ? Math.min(coachmarkProps.currentStep, effectiveSteps.length - 1)
    : 0
  
  // Wrap onNext to handle tour completion based on effective steps
  const handleNext = () => {
    if (!coachmarkProps) return
    if (effectiveCurrentStep >= effectiveSteps.length - 1) {
      // We're at the last step, close the tour
      coachmarkProps.onClose()
    } else {
      coachmarkProps.onNext()
    }
  }
  
  // Code view content for the popover (match Layout A's code tab)
  const codeViewContent = useMemo(() => {
    if (layoutMode !== "B") return null
    const p = bodyProps.previewProps
    return (
      <PlanCodeView
        t={p.t}
        input={{
          planName: p.planName,
          planDescription: p.planDescription,
          planCurrency: p.planCurrency,
          planLookupKey: p.planLookupKey,
          planRateCards: p.planRateCards,
          rateMeters: p.rateMetersByRate,
          ratePriceTypes: p.ratePriceTypes,
          planRateUnitPrices: p.planRateUnitPrices,
          planRateTiers: p.planRateTiers,
          planRateTierToValues: p.planRateTierToValues,
          planRateTierUnitPrices: p.planRateTierUnitPrices,
          planRateTierFlatFees: p.planRateTierFlatFees,
          rateUnitLabels: p.rateUnitLabels,
          rateSellAs: p.rateSellAs,
          planCreditGrants: p.planCreditGrants,
          creditGrantAmounts: p.creditGrantAmounts,
          creditGrantPeriods: p.creditGrantPeriods,
          planSubscriptionFees: p.planSubscriptionFees,
          subscriptionFeeAmounts: p.subscriptionFeeAmounts,
          subscriptionFeePeriods: p.subscriptionFeePeriods,
        }}
      />
    )
  }, [layoutMode, bodyProps.previewProps])
  
  const isLayoutB = layoutMode === "B"

  // Skeleton → content crossfade: auto-dismiss after 800ms
  useEffect(() => {
    if (!showSkeleton || !overlayProps.isOpen) return
    const timer = setTimeout(() => onSkeletonDone?.(), 2000)
    return () => clearTimeout(timer)
  }, [showSkeleton, overlayProps.isOpen, onSkeletonDone])

  const isOverlayMode = consoleSlideDirection === "overlay"
  const isLeftHeaderMode = consoleSlideDirection === "left-header"
  const isParentRenderedConsole = isOverlayMode || isLeftHeaderMode
  const collapseSidebarForBulkEditCalc = bodyProps.isBulkEditMode && bulkEditTransition !== "inline"
  const headerSlidePanelWidth = collapseSidebarForBulkEditCalc ? 320 : (bodyProps.isTreeNavOpen ? 280 + 320 : 320)

  const consolePanelElement = useMemo(() => {
    if (!isParentRenderedConsole) return undefined
    const p = bodyProps.previewProps
    return (
      <ConsoleChatPane
        onBack={handleOverlayCloseConsole}
        contextItems={consoleContextItems}
        planContext={{
          name: p.planName,
          description: p.planDescription ?? "",
          currency: p.planCurrency ?? "USD",
          rateCards: (p.planRateCards ?? []).map(rc => ({
            id: rc.id,
            name: rc.name ?? "",
            rates: (rc.rates ?? []).map(r => ({
              id: r.id,
              name: r.name ?? "",
              meter: "",
              unitPrice: "",
              priceType: "",
            })),
          })),
          creditGrants: (p.planCreditGrants ?? []).map(cg => ({
            id: cg.id,
            name: cg.name ?? "",
            amount: "",
            period: "",
          })),
          subscriptionFees: (p.planSubscriptionFees ?? []).map(sf => ({
            id: sf.id,
            name: sf.name ?? "",
            amount: "",
            period: "",
          })),
        }}
      />
    )
  }, [isParentRenderedConsole, consoleContextItems, bodyProps.previewProps, handleOverlayCloseConsole])

  return (
    <ProductFormOverlay
      {...overlayProps}
      canvas={isRefresh}
      sidebar={undefined}
      overlayDrawer={isParentRenderedConsole ? consolePanelElement : undefined}
      isOverlayDrawerActive={isParentRenderedConsole && isConsoleMode}
      overlayDrawerWidth={headerSlidePanelWidth}
      headerTranslateX={isHeaderSlideMode && isConsoleMode ? headerSlidePanelWidth : 0}
      header={
        showSkeleton ? (
          // Skip the skeleton header entirely when we're heading into the
          // inline Get started wizard — the wizard runs with the top header
          // collapsed, so showing a skeleton header would create a visible
          // chrome flash before it collapses.
          inlineGetStartedActive ? null : <PlanFormSkeletonHeader />
        ) : !bulkEditReady ? (
            <motion.div
              key="real-header"
              className="overflow-hidden flex flex-col justify-end"
              initial={inlineGetStartedActive ? { height: 0 } : false}
              animate={{
                height: inlineGetStartedActive ? 0 : "auto",
              }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              style={{ pointerEvents: inlineGetStartedActive ? "none" : undefined }}
            >
              <PricingPlanModalHeader
                {...headerProps}
                layoutMode={layoutMode}
                onOpenConsole={() => {
                  setIsConsoleMode(true)
                  window.dispatchEvent(new Event("open-console-mode"))
                }}
                isCodePopoverOpen={isCodePopoverOpen}
                onToggleCodePopover={() => setIsCodePopoverOpen(prev => !prev)}
                codeViewContent={codeViewContent}
                isBulkEditMode={bulkEditTransition === "header" && bodyProps.isBulkEditMode}
                bulkEditTitle={bulkEditTitle}
                onBulkEditBack={bodyProps.onExitBulkEdit}
                nodeLabel={bodyProps.editorProps.headerLabel}
                parentLabel={bodyProps.editorProps.parentLabel}
                onNavigateToParent={bodyProps.editorProps.onNavigateToParent}
                nodeType={bodyProps.editorProps.nodeType}
                onNavigateToPlan={bodyProps.editorProps.onNavigateToPlan}
                isTreeNavOpen={bodyProps.editorProps.isTreeNavOpen}
                onToggleTreeNav={bodyProps.editorProps.onToggleTreeNav}
                hamburgerButtonRef={bodyProps.editorProps.hamburgerButtonRef}
                hasTreeChanges={bodyProps.editorProps.hasTreeChanges}
                onDismissNavHint={bodyProps.editorProps.onDismissNavHint}
                formAddButtonRef={bodyProps.editorProps.formAddButtonRef}
                onToggleAddPlanObject={bodyProps.editorProps.onToggleAddPlanObject}
                onDismissGetStarted={bodyProps.editorProps.onDismissGetStarted}
              />
            </motion.div>
        ) : null
      }
    >
      {branchInfo && !showSkeleton && (
        <div className="flex items-center justify-between border-b border-[#E9EDF2] bg-[#F8F5FF] px-[20px] py-[8px]">
          <div className="flex items-center gap-[8px]">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-[#675DFF]">
              <path d="M5 3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM14 3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" stroke="currentColor" strokeWidth="1.2" />
              <path d="M3.5 5v2.5a2 2 0 0 0 2 2h3a2 2 0 0 1 2-2V5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M3.5 9.5v1" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            <span className="text-[12px] font-[500] text-[#1A2C44]">
              Based on <button type="button" className="font-[600] text-[#675DFF] hover:underline" onClick={branchInfo.onViewParent}>{branchInfo.parentPlanName}</button>
            </span>
          </div>
          <div className="flex items-center gap-[8px]">
            <span className="text-[11px] text-[#596171]">
              {branchInfo.syncWithParent ? "Synced" : "Independent"}
            </span>
            <button
              type="button"
              className={isRefresh
                ? `t-toggle group relative h-[20px] w-[36px] shrink-0 rounded-full border ${branchInfo.syncWithParent ? "border-[#2C219E] bg-[#2C219E]" : "border-[#D5DEE7] bg-[#F1F6FB]"} ${branchToggleInteracted ? "is-init" : ""}`
                : `relative h-[16px] w-[28px] shrink-0 rounded-full transition-colors ${
                    branchInfo.syncWithParent ? "bg-[#675DFF]" : "bg-[#D8DEE4]"
                  }`
              }
              data-on={isRefresh ? (branchInfo.syncWithParent ? "true" : "false") : undefined}
              onClick={() => {
                setBranchToggleInteracted(true)
                branchInfo.onToggleSync?.()
              }}
              role="switch"
              aria-checked={branchInfo.syncWithParent}
            >
              {isRefresh ? (
                <span className="t-toggle-thumb absolute left-0 top-0 h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.16)]" />
              ) : (
                <span
                  className={`absolute top-[2px] h-[12px] w-[12px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.16)] transition-transform ${
                    branchInfo.syncWithParent ? "left-[14px]" : "left-[2px]"
                  }`}
                />
              )}
            </button>
          </div>
        </div>
      )}
      <AnimatePresence mode="wait">
        {showSkeleton ? (
          <motion.div
            key="skeleton"
            className="h-full w-full"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <PlanFormSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            className="h-full w-full flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <BulkEditHeaderVisibleContext.Provider value={bulkEditReady ? "all" : (bulkEditTransition === "header" && bodyProps.isBulkEditMode ? "none" : "subtitle")}>
              <div className="relative h-full w-full">
                <PricingPlanModalBody
                  {...bodyProps}
                  editorProps={{
                    ...bodyProps.editorProps,
                    // While the inline wizard is active, force the panel
                    // header to stay MOUNTED (override the upstream
                    // `hideHeader=true`) so `collapseHeader` can animate it
                    // smoothly from height 0 → auto in sync with the chrome
                    // push. Without this, the header unmounts during the
                    // wizard and pops in on remount.
                    hideHeader:
                      bodyProps.editorProps.nodeType === "plan" && inlineGetStartedActive
                        ? false
                        : bodyProps.editorProps.hideHeader,
                    collapseHeader:
                      bodyProps.editorProps.nodeType === "plan" &&
                      inlineGetStartedActive,
                  }}
                  // Layout B: left panel always visible; no right/bottom panels
                  isLeftPanelVisible={isLayoutB ? true : undefined}
                  isRightPanelVisible={isLayoutB ? false : undefined}
                  isBottomPanelVisible={isLayoutB ? false : undefined}
                  onOpenLeftPanel={undefined}
                  hideSidebar={false}
                  onConsoleModeChange={setIsConsoleMode}
                  onConsoleContextItemsChange={isParentRenderedConsole ? setConsoleContextItems : undefined}
                />
              {/* Validation attention popover — positioned in the preview area */}
              {validationErrorObjects && validationErrorObjects.length > 0 && onNavigateToValidationError && (
                <div className="pointer-events-none absolute inset-0 z-40 hidden sm:flex items-start">
                  {/* Spacer for sidebar + editor width */}
                  <div className="shrink-0 h-0" style={{ width: 280 + 320 }} />
                  <div className="pointer-events-auto min-w-0 flex-1 flex justify-end pl-[16px] pr-[80px] pt-[8px]">
                    <ValidationAttentionPanel
                      t={headerProps.t}
                      objects={validationErrorObjects}
                      onNavigateToObject={onNavigateToValidationError}
                      onDismiss={onDismissValidationPanel}
                    />
                  </div>
                </div>
              )}
            </div>
            </BulkEditHeaderVisibleContext.Provider>
            {/* Intro coachmarks (shown on first launch) */}
            {isIntroCoachmarkActive && INTRO_COACHMARK_STEPS[introCoachmarkStep] && (
              <>
                <CoachmarkPulse
                  key={INTRO_COACHMARK_STEPS[introCoachmarkStep].id}
                  targetSelector={INTRO_COACHMARK_STEPS[introCoachmarkStep].targetSelector}
                  onClick={handleIntroNext}
                  isSelected
                />
                <CoachmarkOverlay
                  step={INTRO_COACHMARK_STEPS[introCoachmarkStep]}
                  stepIndex={introCoachmarkStep}
                  totalSteps={INTRO_COACHMARK_STEPS.length}
                  onClose={handleIntroClose}
                  onNext={handleIntroNext}
                  onPrev={handleIntroPrev}
                />
              </>
            )}
            {saveVersionModalProps && <SaveVersionModal {...saveVersionModalProps} />}
          </motion.div>
        )}
      </AnimatePresence>
    </ProductFormOverlay>
  )
}
