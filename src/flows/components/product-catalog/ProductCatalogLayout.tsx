'use client'

import type { RefObject, ReactNode } from "react"
import { useEffect, useState } from "react"
import { UnifiedSettingsPanel } from "@/components/UnifiedSettingsPanel"
import { DemoContextBar } from "@/components/creation-workspace/DemoContextBar"

import { ProductTable } from "@/components/ProductTable"
import { AddProductPopover, type PopoverPosition } from "@/components/product-catalog/AddProductPopover"
import { CatalogChromeHeaderSkeleton } from "@/components/product-catalog/CatalogChromeHeaderSkeleton"
import { CatalogSidebarSkeleton } from "@/components/product-catalog/CatalogSidebarSkeleton"
import { CatalogTableToolbarSkeleton } from "@/components/product-catalog/CatalogTableToolbarSkeleton"
import { ProductCatalogHeaderRow } from "@/components/product-catalog/ProductCatalogHeaderRow"
import { IconographyProvider } from "@/components/product-catalog/iconography"
import { FormPanelSideProvider } from "@/components/product-catalog/formPanelSide"
import { ShowAdditionalNodesProvider } from "@/components/product-catalog/showAdditionalNodes"
import { LayoutDirectionProvider } from "@/components/product-catalog/layoutDirection"
import { LayoutModeProvider } from "@/components/product-catalog/layoutMode"
import { MapInteractivityProvider } from "@/components/product-catalog/mapInteractivity"
import { ShowAddPlanProvider } from "@/components/product-catalog/showAddPlan"
import { BulkEditTransitionProvider } from "@/components/product-catalog/bulkEditTransition"
import { CascadeAlignmentProvider } from "@/components/product-catalog/cascadeAlignment"
import { OnboardingModeProvider } from "@/components/product-catalog/onboardingMode"
import { SidebarDarkModeProvider } from "@/components/product-catalog/sidebarDarkMode"
import { AddMenuModeProvider } from "@/components/product-catalog/addMenuMode"
import { ComboboxStyleProvider } from "@/components/product-catalog/comboboxStyle"
import { NavLayoutModeProvider } from "@/components/creation-workspace/navLayoutMode"
import { ModalSubStyleProvider } from "@/components/creation-workspace/modalSubStyle"
import { SectionDividersProvider } from "@/components/creation-workspace/sectionDividers"
import { NavHugContentProvider } from "@/components/creation-workspace/navHugContent"
import { ConsoleSlideDirectionProvider } from "@/components/creation-workspace/consoleSlideDirection"
import { NarrowFormWidthProvider } from "@/components/creation-workspace/narrowFormWidth"
import { MeterPreviewStyleProvider } from "@/components/creation-workspace/meterPreviewStyle"
import { PricePreviewStyleProvider } from "@/components/creation-workspace/pricePreviewStyle"
import { InvoicePreviewModeProvider } from "@/components/creation-workspace/invoicePreviewMode"
import { HeaderStyleProvider } from "@/components/creation-workspace/headerStyle"
import { ContextualToolStyleProvider } from "@/components/creation-workspace/meterToolStyle"
import { CustomerFormLayoutProvider } from "@/components/creation-workspace/customerFormLayout"
import { FocusedFieldProvider } from "@/components/product-catalog/FocusedFieldContext"
import type { PricingPlanRow, ProductRow } from "@/components/product-catalog/productCatalogPage.types"
import { getFullBillingFlowEdges, getFlowOmissions } from "@/components/creation-workspace/workflowConfig"

type CatalogItem = ({ kind: "product" } & ProductRow) | ({ kind: "plan" } & PricingPlanRow)

type ProductCatalogLayoutProps = {
  t: (key: string) => string

  addProductButtonRef: RefObject<HTMLButtonElement | null>
  onToggleAddProductPopover: () => void
  onAddPricingPlan: () => void
  onOpenFlow?: (flow: string) => void
  activeBillingView: string | null
  billingViewContent?: ReactNode

  isAddProductPopoverOpen: boolean
  addProductPopoverPosition: PopoverPosition | null
  addProductPopoverRef: RefObject<HTMLDivElement | null>
  addProductPromptRef: RefObject<HTMLTextAreaElement | null>
  addProductPromptMode: boolean
  addProductPromptText: string
  isRoutingPrompt: boolean
  onChangeAddProductPromptText: (next: string) => void
  onCancelAddProductPromptMode: () => void
  onEnterAddProductPromptMode: () => void
  onSendAddProductPrompt: () => void
  onCreateSingleProduct: () => void
  onCreatePricingPlan: () => void

  catalogItems: CatalogItem[]
  onCatalogItemClick: (item: CatalogItem) => void

  children: ReactNode
}

export function ProductCatalogLayout({
  t,
  addProductButtonRef,
  onToggleAddProductPopover,
  onAddPricingPlan,
  onOpenFlow,
  activeBillingView,
  billingViewContent,
  isAddProductPopoverOpen,
  addProductPopoverPosition,
  addProductPopoverRef,
  addProductPromptRef,
  addProductPromptMode,
  addProductPromptText,
  isRoutingPrompt,
  onChangeAddProductPromptText,
  onCancelAddProductPromptMode,
  onEnterAddProductPromptMode,
  onSendAddProductPrompt,
  onCreateSingleProduct,
  onCreatePricingPlan,
  catalogItems,
  onCatalogItemClick,
  children,
}: ProductCatalogLayoutProps) {
  const [showFlows, setShowFlows] = useState(false)

  // When this editor is opened from the /patterns docs (Advanced example), a `returnTo`
  // query param is set. Show a floating "back to patterns" bar in that case only.
  const [patternsReturnTo, setPatternsReturnTo] = useState<string | null>(null)
  useEffect(() => {
    const rt = new URLSearchParams(window.location.search).get("returnTo")
    if (rt && rt.startsWith("/")) setPatternsReturnTo(rt)
  }, [])

  return (
    <IconographyProvider>
      <NavLayoutModeProvider>
      <CustomerFormLayoutProvider>
      <HeaderStyleProvider>
      <ModalSubStyleProvider>
      <MeterPreviewStyleProvider>
      <PricePreviewStyleProvider>
      <InvoicePreviewModeProvider>
      <ContextualToolStyleProvider>
      <ComboboxStyleProvider>
      <AddMenuModeProvider>
      <SectionDividersProvider>
      <NavHugContentProvider>
      <ConsoleSlideDirectionProvider>
      <NarrowFormWidthProvider>
      <FormPanelSideProvider>
        <ShowAdditionalNodesProvider>
          <LayoutDirectionProvider>
            <LayoutModeProvider>
                <MapInteractivityProvider>
                <ShowAddPlanProvider>
                <BulkEditTransitionProvider>
                <CascadeAlignmentProvider>
                <OnboardingModeProvider>
                <SidebarDarkModeProvider>
                <FocusedFieldProvider>
        <main className="min-h-screen bg-white">
          {patternsReturnTo && (
            <DemoContextBar
              patternLabel="Advanced pattern"
              exampleLabel="Pricing plan"
              onBack={() => { window.location.href = patternsReturnTo }}
              placement="bottom-left"
              zIndexClass="z-[10002]"
            />
          )}
          <div className="flex min-h-screen bg-white text-[#353A44]">
            <CatalogSidebarSkeleton onOpenFlow={onOpenFlow} activeFlow={activeBillingView} />

            <div className="flex flex-1 flex-col">
              <CatalogChromeHeaderSkeleton />

              <div className="flex-1 px-10 py-10">
                {activeBillingView ? (
                  billingViewContent
                ) : (
                  <>
                    <ProductCatalogHeaderRow
                      t={t}
                      addProductButtonRef={addProductButtonRef}
                      onAddPricingPlan={onAddPricingPlan}
                    />

                    {isAddProductPopoverOpen && addProductPopoverPosition && (
                      <AddProductPopover
                        t={t}
                        position={addProductPopoverPosition}
                        popoverRef={addProductPopoverRef}
                        promptRef={addProductPromptRef}
                        isPromptMode={addProductPromptMode}
                        promptText={addProductPromptText}
                        isRoutingPrompt={isRoutingPrompt}
                        onChangePromptText={onChangeAddProductPromptText}
                        onCancelPromptMode={onCancelAddProductPromptMode}
                        onEnterPromptMode={onEnterAddProductPromptMode}
                        onSendPrompt={onSendAddProductPrompt}
                        onCreateSingleProduct={onCreateSingleProduct}
                        onCreatePricingPlan={onCreatePricingPlan}
                      />
                    )}

                    <CatalogTableToolbarSkeleton />
                    <ProductTable items={catalogItems} onItemClick={onCatalogItemClick} />
                  </>
                )}
              </div>
            </div>

            {children}

            <UnifiedSettingsPanel onObjectGraph={() => setShowFlows(true)} onReset={() => {}} />
            {showFlows && <ConnectedFlowsModal onClose={() => setShowFlows(false)} />}
          </div>
        </main>
                </FocusedFieldProvider>
                </SidebarDarkModeProvider>
                </OnboardingModeProvider>
                </CascadeAlignmentProvider>
                </BulkEditTransitionProvider>
                </ShowAddPlanProvider>
                </MapInteractivityProvider>
            </LayoutModeProvider>
          </LayoutDirectionProvider>
        </ShowAdditionalNodesProvider>
      </FormPanelSideProvider>
      </NarrowFormWidthProvider>
      </ConsoleSlideDirectionProvider>
      </NavHugContentProvider>
      </SectionDividersProvider>
      </AddMenuModeProvider>
      </ComboboxStyleProvider>
      </ContextualToolStyleProvider>
      </InvoicePreviewModeProvider>
      </PricePreviewStyleProvider>
      </MeterPreviewStyleProvider>
      </ModalSubStyleProvider>
      </HeaderStyleProvider>
      </CustomerFormLayoutProvider>
      </NavLayoutModeProvider>
    </IconographyProvider>
  )
}



function ConnectedFlowsModal({ onClose }: { onClose: () => void }) {
  const edges = getFullBillingFlowEdges()
  const omissions = getFlowOmissions()

  const grouped = new Map<string, { toLabel: string; reason: string }[]>()
  for (const e of edges) {
    const list = grouped.get(e.fromLabel) ?? []
    list.push({ toLabel: e.toLabel, reason: e.reason })
    grouped.set(e.fromLabel, list)
  }

  const uncommonByFrom = new Map<string, { notSuggested: string; rationale: string }[]>()
  const omissionsByFrom = new Map<string, { notSuggested: string; reason: string; rationale: string }[]>()
  for (const o of omissions) {
    if (o.reason === "uncommon") {
      const list = uncommonByFrom.get(o.fromLabel) ?? []
      list.push({ notSuggested: o.notSuggested, rationale: o.rationale })
      uncommonByFrom.set(o.fromLabel, list)
    } else {
      const list = omissionsByFrom.get(o.fromLabel) ?? []
      list.push({ notSuggested: o.notSuggested, reason: o.reason, rationale: o.rationale })
      omissionsByFrom.set(o.fromLabel, list)
    }
  }

  const allKinds = Array.from(new Set([...Array.from(grouped.keys()), ...Array.from(uncommonByFrom.keys()), ...Array.from(omissionsByFrom.keys())]))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 flex max-h-[80vh] w-full max-w-[520px] flex-col overflow-hidden rounded-[12px] border border-[#EBEEF1] bg-white shadow-[0px_15px_35px_0px_rgba(48,49,61,0.08),0px_5px_15px_0px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between border-b border-[#EBEEF1] px-[20px] py-[14px]">
          <h2 className="text-[14px] font-[600] leading-[20px] tracking-[-0.07px] text-[#1A2C44]">
            Connected flows
          </h2>
          <button
            type="button"
            className="rounded-[6px] px-[8px] py-[4px] text-[12px] font-[500] text-[#596171] hover:bg-[#F5F6F8] transition-colors"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-[20px] py-[16px]">
          <div className="mb-[16px] flex flex-col gap-[6px] text-[12px] font-[400] leading-[18px] text-[#6C7688]">
            <p>Suggested (green) flows are what you'd naturally do next. Uncommon (orange) flows are possible but not typical. Not suggested (red) flows go backwards, skip steps, or are unrelated.</p>
          </div>

          <div className="flex flex-col gap-[20px]">
            {allKinds.map((from) => {
              const targets = grouped.get(from) ?? []
              const uncommon = uncommonByFrom.get(from) ?? []
              const excluded = omissionsByFrom.get(from) ?? []
              return (
                <div key={from} className="flex flex-col gap-[6px]">
                  <p className="text-[13px] font-[600] leading-[16px] tracking-[-0.02px] text-[#1A2C44]">
                    {from}
                  </p>

                  {targets.length > 0 && (
                    <div className="flex flex-col gap-[4px]">
                      {targets.map((t, i) => (
                        <div key={`inc-${i}`} className="flex items-start gap-[6px]">
                          <span className="shrink-0 text-[12px] leading-[18px]">✅</span>
                          <p className="text-[12px] font-[400] leading-[18px] text-[#596171]">
                            <span className="font-[500] text-[#1A2C44]">{t.toLabel}</span>
                            {" — "}{t.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {uncommon.length > 0 && (
                    <div className="mt-[2px] flex flex-col gap-[4px]">
                      {uncommon.map((u, i) => (
                        <div key={`unc-${i}`} className="flex items-start gap-[6px]">
                          <span className="shrink-0 text-[12px] leading-[18px]">🟠</span>
                          <p className="text-[12px] font-[400] leading-[18px] text-[#6C7688]">
                            <span className="font-[500] text-[#596171]">{u.notSuggested}</span>
                            <span className="ml-[6px] inline-block rounded-[3px] bg-[#FFF6ED] px-[4px] py-[1px] text-[10px] font-[500] leading-[14px] text-[#B54708]">
                              uncommon
                            </span>
                            {" "}{u.rationale}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {excluded.length > 0 && (
                    <div className="mt-[2px] flex flex-col gap-[4px]">
                      {excluded.map((o, i) => (
                        <div key={`exc-${i}`} className="flex items-start gap-[6px]">
                          <span className="shrink-0 text-[12px] leading-[18px]">🚫</span>
                          <p className="text-[12px] font-[400] leading-[18px] text-[#6C7688]">
                            <span className="font-[500] text-[#596171]">{o.notSuggested}</span>
                            <span className={`ml-[6px] inline-block rounded-[3px] px-[4px] py-[1px] text-[10px] font-[500] leading-[14px] ${
                              o.reason === "backwards" ? "bg-[#FEF3F2] text-[#B42318]"
                              : o.reason === "skips-step" ? "bg-[#FFF6ED] text-[#B54708]"
                              : "bg-[#F2F4F7] text-[#667085]"
                            }`}>
                              {o.reason === "backwards" ? "backwards" : o.reason === "skips-step" ? "skips step" : "unrelated"}
                            </span>
                            {" "}{o.rationale}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
