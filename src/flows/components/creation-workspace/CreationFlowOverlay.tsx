'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CreationWorkspace, type WorkspacePresentation } from "@/components/creation-workspace/CreationWorkspace"
import { SimpleCreationHeader } from "@/components/creation-workspace/SimpleCreationHeader"
import { SimpleCreationSidebarNav } from "@/components/creation-workspace/SimpleCreationSidebarNav"
import { SlideOverDrawer } from "@/components/creation-workspace/SlideOverDrawer"
import { CreationModal } from "@/components/creation-workspace/CreationModal"
import { CreationModalShell } from "@/components/creation-workspace/CreationModalShell"
import { TabbedCreationModal } from "@/components/creation-workspace/TabbedCreationModal"
import { ApiAccessPolicyFlowModal } from "@/components/creation-workspace/ApiAccessPolicyFlowModal"
import { CreateApiKeyFlowModal } from "@/components/creation-workspace/CreateApiKeyFlowModal"
import { MeterPreviewPanel } from "@/components/creation-workspace/MeterPreviewPanel"
import { useModalSubStyle } from "@/components/creation-workspace/modalSubStyle"
import { InvoicePreview } from "@/components/creation-workspace/InvoicePreview"
import { SubscriptionInvoicePreview } from "@/components/creation-workspace/SubscriptionInvoicePreview"
import { ValidationPanel } from "@/components/creation-workspace/ValidationPanel"
import { PreviewSwitcher } from "@/components/creation-workspace/PreviewSwitcher"
import { useNavLayoutMode } from "@/components/creation-workspace/navLayoutMode"
import { useNavStyle } from "@/components/creation-workspace/navStyle"
import { useHeaderStyle } from "@/components/creation-workspace/headerStyle"
import { useInvoicePreviewMode } from "@/components/creation-workspace/invoicePreviewMode"
import { useContextualToolStyle } from "@/components/creation-workspace/meterToolStyle"
import { MeterCalculator } from "@/components/creation-workspace/MeterCalculator"
import { useCustomerFormLayout } from "@/components/creation-workspace/customerFormLayout"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"

import { useWorkflowState, computeAddOptionsFromMenuKinds } from "@/components/creation-workspace/useWorkflowState"
import { getPrimaryLabel } from "@/components/creation-workspace/workflowConfig"
import { useFlowConfig } from "@/components/creation-workspace/useFlowConfig"
import { useWorkflowSync } from "@/components/creation-workspace/useWorkflowSync"
import { useAddMenuMode } from "@/components/product-catalog/addMenuMode"
import { InvoiceForm } from "@/components/creation-workspace/forms/InvoiceForm"
import { CustomerForm } from "@/components/creation-workspace/forms/CustomerForm"
import { ProductForm } from "@/components/creation-workspace/forms/ProductForm"
import { CouponForm } from "@/components/creation-workspace/forms/CouponForm"
import { MeterForm } from "@/components/creation-workspace/forms/MeterForm"
import { PriceForm, validatePriceData } from "@/components/creation-workspace/forms/PriceForm"
import { MeterPreview } from "@/components/creation-workspace/MeterPreview"
import { PricePreviewPanel } from "@/components/creation-workspace/PricePreviewPanel"
import { ProductPreviewPanel } from "@/components/creation-workspace/ProductPreviewPanel"
import { PortalTransition } from "@/components/creation-workspace/PortalTransition"
import { PaneShiftTransition } from "@/components/creation-workspace/PaneShiftTransition"
import { SubscriptionForm } from "@/components/creation-workspace/forms/SubscriptionForm"
import { PricingPlanForm } from "@/components/creation-workspace/forms/PricingPlanForm"
import { ContractForm } from "@/components/creation-workspace/forms/ContractForm"
import { ContractPreview } from "@/components/creation-workspace/ContractPreview"
import { ContractPlanEditorOverlay } from "@/components/creation-workspace/ContractPlanEditorOverlay"
import { FullProductEditor } from "@/components/creation-workspace/FullProductEditor"
import { FullInvoiceEditor } from "@/components/creation-workspace/FullInvoiceEditor"
import { InvoiceCreationEditor } from "@/components/creation-workspace/InvoiceCreationEditor"
import { SubscriptionCreationEditor } from "@/components/creation-workspace/SubscriptionCreationEditor"
import { BuyButtonCreationEditor } from "@/components/creation-workspace/BuyButtonCreationEditor"
import { CouponCreationEditor } from "@/components/creation-workspace/CouponCreationEditor"
import { PaymentLinkCreationEditor } from "@/components/creation-workspace/PaymentLinkCreationEditor"
import { PaymentLinkForm } from "@/components/creation-workspace/forms/PaymentLinkForm"
import { PaymentLinkPreview } from "@/components/creation-workspace/PaymentLinkPreview"
import { UxRationaleToast } from "@/components/creation-workspace/UxRationaleToast"

const fullBillingForms = {
  invoice: InvoiceForm,
  customer: CustomerForm,
  product: ProductForm,
  coupon: CouponForm,
  meter: MeterForm,
  price: PriceForm,
  subscription: SubscriptionForm,
  pricingPlan: PricingPlanForm,
  contract: ContractForm,
  paymentLink: PaymentLinkForm,
  contractPreview: ContractPreview,
  invoicePreview: InvoicePreview,
  subscriptionPreview: SubscriptionInvoicePreview,
  meterPreview: MeterPreview,
  pricePreview: PricePreviewPanel,
  productPreview: ProductPreviewPanel,
  paymentLinkPreview: PaymentLinkPreview,
}

const contextualLabels: Record<string, string> = {
  meter: "Simulate usage events",
  price: "Pricing breakdown",
  product: "Product details",
}

type ContextualDetailContentProps = {
  kind: string
  meterToolData: { meterName?: string; displayName?: string; aggregation?: string; unitPrice?: string; currency?: string } | null
  priceDetailBlock: { tiers: { id: number; firstUnit: string; lastUnit: string; perUnit: string; flatFee: string }[]; isTiered: boolean; isMetered: boolean; amount?: string; billingPeriod?: string } | null
  productDetailBlock: { productName: string; priceCount: number } | null
}

function ContextualDetailContent({ kind, meterToolData, priceDetailBlock, productDetailBlock }: ContextualDetailContentProps) {
  if (kind === "meter" && meterToolData) {
    return <MeterCalculator {...meterToolData} />
  }
  if (kind === "price" && priceDetailBlock) {
    const { tiers, isTiered, isMetered, amount, billingPeriod } = priceDetailBlock
    if (isTiered && tiers.length > 0) {
      return (
        <div className="flex flex-col gap-[4px]">
          {tiers.map((tier) => (
            <div key={tier.id} className="flex items-center justify-between rounded-[6px] bg-[#F8FAFB] px-[10px] py-[6px]">
              <span className="text-[12px] font-[500] text-[#1A2C44]">
                {tier.lastUnit === "∞" ? `${parseInt(tier.firstUnit).toLocaleString()}+` : `${parseInt(tier.firstUnit).toLocaleString()} – ${parseInt(tier.lastUnit).toLocaleString()}`}
              </span>
              <span className="text-[12px] font-[600] tabular-nums text-[#1A2C44]">
                ${parseFloat(tier.perUnit || "0").toFixed(3)}/unit
              </span>
            </div>
          ))}
        </div>
      )
    }
    return (
      <div className="rounded-[6px] bg-[#F8FAFB] px-[10px] py-[8px]">
        <p className="text-[12px] text-[#596171]">
          {isMetered ? "Usage-based" : "Fixed"} price{amount ? `: $${amount}` : ""}
          {billingPeriod ? ` / ${billingPeriod.replace("ly", "").replace("dai", "day")}` : ""}
        </p>
      </div>
    )
  }
  if (kind === "product" && productDetailBlock) {
    return (
      <div className="rounded-[6px] bg-[#F8FAFB] px-[10px] py-[8px]">
        <p className="text-[12px] text-[#596171]">
          <span className="font-[600] text-[#1A2C44]">{productDetailBlock.productName}</span>
          {productDetailBlock.priceCount > 0 && ` · ${productDetailBlock.priceCount} price${productDetailBlock.priceCount !== 1 ? "s" : ""}`}
        </p>
      </div>
    )
  }
  return null
}

function ContextualToolTray({ label, children }: { label: string; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="mt-[16px] max-w-[360px] rounded-[8px] border border-[#E0E4EA] bg-[#FAFBFC]">
      <button
        type="button"
        className="flex w-full items-center justify-between px-[12px] py-[8px] text-left"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="text-[11px] font-[600] text-[#596171]">{label}</span>
        <svg
          width="10" height="10" viewBox="0 0 12 12" fill="none"
          className={`text-[#9CA3B0] transition-transform ${collapsed ? "" : "rotate-180"}`}
        >
          <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {!collapsed && (
        <div className="border-t border-[#E0E4EA] px-[12px] py-[10px]">
          {children}
        </div>
      )}
    </div>
  )
}

// Refresh simple-modal header close button — 24px circle, Figma node 196:359.
function RefreshCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-[#F1F6FB] text-[#526378] transition-colors hover:bg-[#EAF0F6]"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </button>
  )
}

function CouponFlowModal({ workflow, hasErrors, activeErrorFields, onClose, onOpenFullEditor }: {
  workflow: ReturnType<typeof useWorkflowState>
  hasErrors: boolean
  activeErrorFields: Set<string>
  onClose: () => void
  onOpenFullEditor: () => void
}) {
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [productData, setProductData] = useState<Record<string, any>>({})
  const { productFormStyle } = useProductFormStyle()
  const isSail = productFormStyle === "sail"
  const isRefresh = productFormStyle === "refresh"
  const couponObj = workflow.objects.find((o) => o.kind === "coupon") ?? workflow.objects[0]
  const couponTitleClass = isSail
    ? "text-[16px] font-[700] leading-[24px] tracking-[-0.31px] text-[#353A44]"
    : isRefresh
      ? "text-[20px] font-[600] leading-[24px] tracking-[-0.2px] text-[#142234]"
      : "text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]"
  const couponSecondaryButtonClass = isSail
    ? "flex h-[28px] items-center rounded-[6px] bg-white px-[8px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#353A44] shadow-[0px_1px_1px_0px_rgba(26,27,37,0.16),0px_0px_0px_1px_#D5DBE1] transition-colors hover:bg-[#F5F6F8]"
    : isRefresh
      ? "flex items-center gap-[6px] rounded-full bg-[#F1F6FB] px-[12px] py-[6px] text-[13px] font-[500] leading-[20px] tracking-[-0.065px] text-[#142234] transition-colors hover:bg-[#EAF0F6]"
      : "flex h-[28px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
  const couponPrimaryButtonClass = isSail
    ? "flex h-[28px] items-center rounded-[6px] bg-[#675DFF] px-[8px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-white shadow-[0px_1px_1px_0px_rgba(20,19,78,0.32),0px_0px_0px_1px_#625AFA] hover:bg-[#5B52F0]"
    : isRefresh
      ? "flex items-center gap-[6px] rounded-full bg-[#2C219E] px-[12px] py-[6px] text-[13px] font-[500] leading-[20px] tracking-[-0.065px] text-white transition-colors hover:bg-[#241A86]"
      : "flex h-[28px] items-center rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white hover:bg-[#4730E0]"
  const couponModalClass = isSail
    ? "flex max-h-[80vh] w-full max-w-[496px] flex-col overflow-hidden rounded-[8px] border border-[#EBEEF1] bg-white shadow-[0px_15px_35px_0px_rgba(48,49,61,0.08),0px_5px_15px_0px_rgba(0,0,0,0.12)]"
    : isRefresh
      ? "flex min-h-[520px] max-h-[80vh] w-[480px] max-w-full flex-col overflow-hidden rounded-[12px] border border-[#D8E1EA] bg-white shadow-[0px_20px_60px_rgba(20,34,52,0.12),0px_4px_16px_rgba(20,34,52,0.08)]"
      : "flex min-h-[520px] max-h-[80vh] w-[480px] max-w-full flex-col overflow-hidden rounded-[12px] border border-[#EBEEF1] bg-white shadow-[0px_20px_60px_rgba(0,0,0,0.12),0px_4px_16px_rgba(0,0,0,0.08)]"
  const couponHeaderClass = isSail
    ? "border-b border-[#ECF1F6] p-[16px]"
    : isRefresh
      ? "px-[24px] py-[24px]"
      : "border-b border-[#ECF1F6] px-[20px] py-[14px]"
  const couponFooterClass = isSail
    ? "flex items-center justify-end gap-[8px] border-t border-[#ECF1F6] p-[16px]"
    : isRefresh
      ? "flex items-center justify-end gap-[8px] px-[24px] py-[24px]"
      : "flex items-center justify-end gap-[8px] border-t border-[#ECF1F6] px-[20px] py-[12px]"
  const couponContentClass = isSail
    ? "min-h-[300px] flex-1 overflow-y-auto px-[16px] py-[16px]"
    : isRefresh
      ? "min-h-[300px] flex-1 overflow-y-auto px-[24px] pt-0 pb-[16px]"
      : "min-h-[300px] flex-1 overflow-y-auto px-[20px] py-[16px]"

  const handleProductAddObject = (kind: string) => {
    if (kind === "_fullEditor") {
      setProductModalOpen(false)
      onOpenFullEditor()
    }
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-black/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-[24px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <motion.div
          className={couponModalClass}
          animate={productModalOpen ? { scale: 0.94, y: -16 } : { scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <div className={`${couponHeaderClass} flex items-center justify-between`}>
            <p className={couponTitleClass}>
              Create coupon
            </p>
            {isRefresh && <RefreshCloseButton onClose={onClose} />}
          </div>

          <div className={couponContentClass}>
            <CouponForm
              data={couponObj.data}
              onChange={(data: Record<string, any>) => {
                workflow.updateObjectData(couponObj.id, data)
                if (hasErrors) workflow.clearValidationErrors()
              }}
              errorFields={activeErrorFields.size > 0 ? activeErrorFields : undefined}
              onAddObject={() => setProductModalOpen(true)}
            />
          </div>

          <div className={couponFooterClass}>
            <button
              type="button"
              className={couponSecondaryButtonClass}
              onClick={onClose}
            >
              Discard
            </button>
            <button
              type="button"
              className={couponPrimaryButtonClass}
              onClick={onClose}
            >
              Create coupon
            </button>
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {productModalOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[60]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setProductModalOpen(false)}
            />
            <motion.div
              className="fixed inset-0 z-[70] flex items-center justify-center p-[24px]"
            >
              <motion.div
                className="flex max-h-[80vh] w-[480px] max-w-full flex-col overflow-hidden rounded-[12px] border border-[#EBEEF1] bg-white shadow-[0px_20px_60px_rgba(0,0,0,0.16),0px_4px_16px_rgba(0,0,0,0.1)]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                <div className="border-b border-[#ECF1F6] px-[20px] py-[14px]">
                  <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
                    Add product
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto px-[20px] py-[16px]">
                  <ProductForm
                    data={productData}
                    onChange={(d) => setProductData((prev) => ({ ...prev, ...d }))}
                    onAddObject={handleProductAddObject}
                  />
                </div>

                <div className="flex items-center justify-end gap-[8px] border-t border-[#ECF1F6] px-[20px] py-[12px]">
                  <button
                    type="button"
                    className="flex h-[28px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
                    onClick={() => setProductModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="flex h-[28px] items-center rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white hover:bg-[#4730E0]"
                    onClick={() => setProductModalOpen(false)}
                  >
                    Create product
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </>
  )
}

type CreationFlowOverlayProps = {
  flow: string
  onClose: () => void
  onSubmit?: (flow: string, objects: { kind: string; data: Record<string, any> }[]) => void
  presentationOverride?: WorkspacePresentation
}

export function CreationFlowOverlay({ flow, onClose, onSubmit, presentationOverride }: CreationFlowOverlayProps) {
  const { addMenuMode } = useAddMenuMode()
  const { navLayout } = useNavLayoutMode()
  const { navStyle } = useNavStyle()
  const { headerStyle, buttonPlacement, formPanelStyle } = useHeaderStyle()
  const { modalSubStyle } = useModalSubStyle()
  const { invoicePreviewMode } = useInvoicePreviewMode()
  const { toolStyle } = useContextualToolStyle()
  const { customerFormLayout } = useCustomerFormLayout()
  const { productFormStyle } = useProductFormStyle()
  const isRefresh = productFormStyle === "refresh"

  // Lock body scroll while overlay is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [])

  const config = useFlowConfig(flow, fullBillingForms)
  const workflow = useWorkflowState(config)

  const handleSubmitAction = useCallback(() => {
    workflow.handlePrimaryAction()
    if (workflow.validationErrors.length === 0 && onSubmit) {
      const objectData = workflow.objects.map((o) => ({ kind: o.kind, data: o.data }))
      onSubmit(flow, objectData)
      onClose()
    }
  }, [workflow, onSubmit, onClose, flow])

  useWorkflowSync(workflow.objects, workflow.updateObjectData)

  // History-aware tab selection: push browser history on tab change
  const isPopStateNav = useRef(false)
  const selectTab = useCallback((tabId: string) => {
    workflow.setActiveObject(tabId)
    if (!isPopStateNav.current) {
      history.pushState(
        { creationFlow: flow, tabId },
        "",
        `${window.location.pathname}${window.location.search}#create=${flow}&tab=${tabId}`
      )
    }
  }, [flow, workflow])

  useEffect(() => {
    function handlePopState(e: PopStateEvent) {
      const state = e.state as { creationFlow?: string; tabId?: string } | null
      if (state?.creationFlow === flow && state?.tabId) {
        const exists = workflow.objects.some((o) => o.id === state.tabId)
        if (exists) {
          isPopStateNav.current = true
          workflow.setActiveObject(state.tabId!)
          isPopStateNav.current = false
          return
        }
      }
      if (!state?.creationFlow) {
        onClose()
      }
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [flow, workflow, onClose])

  const addOptions = useMemo(() => {
    const menuKinds =
      addMenuMode === "general"
        ? Object.keys(config.objectKinds)
        : config.addMenuKinds ?? Object.keys(config.objectKinds)
    return computeAddOptionsFromMenuKinds(config, workflow.objects, menuKinds)
  }, [addMenuMode, config, workflow.objects])

  const activeKind = workflow.activeObject?.kind
  const FormComponent = activeKind ? config.objectKinds[activeKind]?.formComponent : null
  const kindLabel = activeKind ? config.objectKinds[activeKind]?.label ?? "Object" : "Object"
  const activeDataName = workflow.activeObject?.data?.name as string | undefined
  const editorTitle = activeDataName?.trim() ? activeDataName.trim() : `New ${kindLabel.toLowerCase()}`

  const isEntryFlow = flow === "customers" || flow === "products" || flow === "coupons"
  const PreviewComponent = isEntryFlow ? null : config.objectKinds[config.initialObjectKind]?.previewComponent
  const hasPreview = Boolean(PreviewComponent)

  const hasErrors = workflow.validationErrors.length > 0
  const errorObjectIds = useMemo(
    () => new Set(workflow.validationErrors.map((e) => e.objectId)),
    [workflow.validationErrors]
  )
  const activeErrorFields = useMemo(
    () => new Set(
      workflow.validationErrors
        .filter((e) => e.objectId === workflow.activeObjectId)
        .map((e) => e.field)
    ),
    [workflow.validationErrors, workflow.activeObjectId]
  )

  const validationPanel = hasErrors ? (
    <ValidationPanel
      errors={workflow.validationErrors}
      config={config}
      onNavigateToError={(objectId) => {
        selectTab(objectId)
      }}
      onDismiss={workflow.clearValidationErrors}
    />
  ) : null

  const rootObj = workflow.objects.find((o) => o.kind === config.initialObjectKind)
  const isContextual = invoicePreviewMode === "pure-detail"
  const showCatalogDetail = isContextual && (activeKind === "price" || activeKind === "meter" || activeKind === "product")

  // Helper: get meter data for tool rendering
  const meterToolData = useMemo(() => {
    if (!showCatalogDetail || activeKind !== "meter") return null
    const meterObj = workflow.objects.find((o) => o.id === workflow.activeObjectId)
    const linkedPrice = workflow.objects.find((o) => o.kind === "price" && o.data.usageType === "metered")
    return {
      meterName: (meterObj?.data?.name as string) || undefined,
      displayName: (meterObj?.data?.displayName as string) || undefined,
      aggregation: (meterObj?.data?.aggregation as string) || undefined,
      unitPrice: linkedPrice?.data?.amount as string | undefined,
      currency: linkedPrice?.data?.currency as string | undefined,
    }
  }, [showCatalogDetail, activeKind, workflow.objects, workflow.activeObjectId])

  // Helper: price detail for non-annotation modes
  const priceDetailBlock = useMemo(() => {
    if (!showCatalogDetail || activeKind !== "price") return null
    const priceObj = workflow.objects.find((o) => o.id === workflow.activeObjectId)
    const tiers = (priceObj?.data?.tiers ?? []) as { id: number; firstUnit: string; lastUnit: string; perUnit: string; flatFee: string }[]
    const model = priceObj?.data?.pricingModel as string | undefined
    const isTiered = model === "graduated" || model === "volume"
    const isMetered = priceObj?.data?.usageType === "metered"
    const amount = priceObj?.data?.amount as string | undefined
    return { tiers, isTiered, isMetered, amount, billingPeriod: priceObj?.data?.billingPeriod as string | undefined }
  }, [showCatalogDetail, activeKind, workflow.objects, workflow.activeObjectId])

  const productDetailBlock = useMemo(() => {
    if (!showCatalogDetail || activeKind !== "product") return null
    const productObj = workflow.objects.find((o) => o.id === workflow.activeObjectId)
    const productName = (productObj?.data?.name as string) || "Product"
    const productPrices = workflow.objects.filter((o) => o.kind === "price")
    return { productName, priceCount: productPrices.length }
  }, [showCatalogDetail, activeKind, workflow.objects, workflow.activeObjectId])

  // Annotation mode: floating tool card overlaying the invoice preview
  const showAnnotation = showCatalogDetail && toolStyle === "annotation"
  const showTray = showCatalogDetail && toolStyle === "tray"
  const showPopover = showCatalogDetail && toolStyle === "popover"
  const [popoverOpen, setPopoverOpen] = useState(false)

  // Close popover when navigating away from a contextual object
  useEffect(() => {
    if (!showPopover) setPopoverOpen(false)
  }, [showPopover])

  const flowTitles: Record<string, string> = {
    invoices: "Create invoice",
    subscriptions: "Create subscription",
    "usage-billing": "Set up usage-based billing",
    customers: "Create customer",
    products: "Create product",
    coupons: "Create coupon",
    contracts: "Create contract",
  }

  // In drawer/modal mode, meters get their own modal with preview — the workspace
  // should only show the preview panel for the primary/initial object kind's preview.
  const isOverlayMode = navLayout === "drawer" || navLayout === "modal"

  // In ideal/intent/navigate mode, always show root object label (peers are created independently)
  const idealSubmitLabel = isRefresh && flow === "invoices"
    ? "Create"
    : (navLayout === "ideal" || navLayout === "intent" || navLayout === "navigate" || navLayout === "compose")
    ? config.lifecycle.submitLabel
    : getPrimaryLabel(config, undefined, workflow.objects.length)
  const effectiveHasPreview = hasPreview

  const isCompactEntryFlow = flow === "customers" || flow === "products" || flow === "coupons"
  const defaultPresentation: WorkspacePresentation = isCompactEntryFlow && !effectiveHasPreview ? "modal" : "fullscreen"
  const presentation = presentationOverride ?? defaultPresentation
  const workspaceMode = effectiveHasPreview ? "related" : "single"

  const hasMultipleObjects = workflow.objects.length > 1
  const showVerticalNav = navLayout === "vertical" && hasMultipleObjects

  const sidebarNav = showVerticalNav ? (
    <SimpleCreationSidebarNav
      items={workflow.objects.map((obj) => ({
        id: obj.id,
        kind: obj.kind,
        label: config.objectKinds[obj.kind]?.label ?? obj.kind,
      }))}
      activeItemId={workflow.activeObjectId}
      onSelectItem={selectTab}
      errorItemIds={hasErrors ? errorObjectIds : undefined}
    />
  ) : null

  const primaryObject = workflow.objects.find((o) => o.kind === config.initialObjectKind)
  const invoiceReady = primaryObject
    ? isCompactEntryFlow
      ? (() => {
          const kind = config.initialObjectKind
          const required = config.objectKinds[kind]?.requiredFields ?? []
          return required.every((f) => !!primaryObject.data[f])
        })()
      : !!(primaryObject.data.customerId || primaryObject.data.customerName) && !!(primaryObject.data.productId || primaryObject.data.productName)
    : false

  // For drawer/modal modes: track which object is shown in the overlay (null = closed)
  const [overlayObjectId, setOverlayObjectId] = useState<string | null>(null)
  const overlayObject = overlayObjectId ? workflow.objects.find((o) => o.id === overlayObjectId) : null
  const overlayKind = overlayObject?.kind
  const OverlayFormComponent = overlayKind ? config.objectKinds[overlayKind]?.formComponent : null

  // Stacked child modal (e.g. meter created from within a product modal)
  const [childModalObjectId, setChildModalObjectId] = useState<string | null>(null)
  const childModalObject = childModalObjectId ? workflow.objects.find((o) => o.id === childModalObjectId) : null
  const childModalKind = childModalObject?.kind
  const ChildModalFormComponent = childModalKind ? config.objectKinds[childModalKind]?.formComponent : null

  // Grandchild modal (e.g. meter created from within a price form)
  const [grandchildObjectId, setGrandchildObjectId] = useState<string | null>(null)
  const grandchildObject = grandchildObjectId ? workflow.objects.find((o) => o.id === grandchildObjectId) : null
  const grandchildKind = grandchildObject?.kind
  const GrandchildFormComponent = grandchildKind ? config.objectKinds[grandchildKind]?.formComponent : null

  // Contract plan editor overlay
  const [isPlanEditorOpen, setIsPlanEditorOpen] = useState(false)
  const [isFullProductEditorOpen, setIsFullProductEditorOpen] = useState(false)
  const [isCustomerInvoiceEditorOpen, setIsCustomerInvoiceEditorOpen] = useState(false)
  const [newTabToast, setNewTabToast] = useState<string | null>(null)
  const [productFlowErrors, setProductFlowErrors] = useState<Set<string>>(new Set())
  const [productFlowErrorMessage, setProductFlowErrorMessage] = useState("")

  const showRationale = useCallback((_kind: string, _mode: string) => {}, [])

  // Navigate mode: page-level navigation + floating child card
  const [navigatePageId, setNavigatePageId] = useState<string | null>(null)
  const [navigateChildId, setNavigateChildId] = useState<string | null>(null)

  // Reset workflow when nav layout or modal sub-style changes to prevent
  // accumulation of stale objects from testing different modes.
  const modeRef = useRef({ navLayout, modalSubStyle })
  useEffect(() => {
    if (modeRef.current.navLayout !== navLayout || modeRef.current.modalSubStyle !== modalSubStyle) {
      modeRef.current = { navLayout, modalSubStyle }
      workflow.resetToInitial()
      setOverlayObjectId(null)
      setChildModalObjectId(null)
      setGrandchildObjectId(null)
      setNavigatePageId(null)
      setNavigateChildId(null)
    }
  }, [navLayout, modalSubStyle]) // eslint-disable-line react-hooks/exhaustive-deps

  // Track navigation direction for flows that still opt into directional transitions.
  const activeIndex = workflow.activeObjectId
    ? workflow.objects.findIndex((o) => o.id === workflow.activeObjectId)
    : 0
  const prevIndexRef = useRef(activeIndex)
  const slideDirection = useRef(1)
  if (activeIndex !== prevIndexRef.current) {
    slideDirection.current = activeIndex > prevIndexRef.current ? 1 : -1
    prevIndexRef.current = activeIndex
  }

  if (flow === "invoices" && (navLayout === "horizontal" || navLayout === "vertical")) {
    return (
      <InvoiceCreationEditor
        isOpen
        onClose={onClose}
        onSubmit={(objects) => onSubmit?.(flow, objects)}
        presentation={presentation}
      />
    )
  }

  if (flow === "subscriptions" && (navStyle === "tabs" || navStyle === "compose")) {
    return (
      <SubscriptionCreationEditor
        isOpen
        onClose={onClose}
        onSubmit={(objects) => onSubmit?.(flow, objects)}
        presentation={presentation}
      />
    )
  }

  if (flow === "payment-links") {
    return (
      <PaymentLinkCreationEditor
        isOpen
        onClose={onClose}
        onSubmit={(objects) => onSubmit?.(flow, objects)}
        presentation={presentation}
      />
    )
  }

  if (flow === "buy-button") {
    return (
      <BuyButtonCreationEditor
        isOpen
        onClose={onClose}
        onSubmit={(objects) => onSubmit?.(flow, objects)}
        presentation={presentation}
      />
    )
  }

  // Coupon in the Standard-mini presentation: the Simple CouponForm beside a live preview.
  if (flow === "coupon-mini") {
    return (
      <CouponCreationEditor
        isOpen
        onClose={onClose}
        onSubmit={(objects) => onSubmit?.(flow, objects)}
        presentation={presentation}
      />
    )
  }

  const navigatePageObj = navigatePageId ? workflow.objects.find((o) => o.id === navigatePageId) : null
  const navigateChildObj = navigateChildId ? workflow.objects.find((o) => o.id === navigateChildId) : null
  const NavigatePageForm = navigatePageObj ? config.objectKinds[navigatePageObj.kind]?.formComponent : null
  const NavigateChildForm = navigateChildObj ? config.objectKinds[navigateChildObj.kind]?.formComponent : null

  // In drawer/modal/intent/navigate modes, always show the primary form
  const showPrimaryOnly = navLayout === "drawer" || navLayout === "modal" || navLayout === "intent" || navLayout === "navigate" || navLayout === "compose"
  const displayedFormObject = showPrimaryOnly ? primaryObject : workflow.activeObject
  const displayedFormKind = displayedFormObject?.kind
  const DisplayedFormComponent = displayedFormKind ? config.objectKinds[displayedFormKind]?.formComponent : null
  const displayedKindLabel = displayedFormKind ? config.objectKinds[displayedFormKind]?.label ?? "Object" : "Object"
  const displayedDataName = displayedFormObject?.data?.name as string | undefined
  const displayedEditorTitle = showPrimaryOnly
    ? (displayedDataName?.trim() ? displayedDataName.trim() : `New ${displayedKindLabel.toLowerCase()}`)
    : editorTitle

  // Override onAddObject — reuse existing singleton objects to prevent duplicates
  const handleAddObject = (kind: string, existingId?: string, initialData?: Record<string, any>) => {
    if (kind === "_fullEditor") {
      const editorPres = typeof window !== "undefined" ? localStorage.getItem("fullEditorPresentation") : null
      if (editorPres === "new-tab") {
        setNewTabToast("This would open the full product editor in a new browser tab.")
        return
      }
      setIsFullProductEditorOpen(true)
      return
    }

    if (kind === "editPlan") {
      setIsPlanEditorOpen(true)
      return
    }

    const kindConfig = config.objectKinds[kind]
    if (!kindConfig) {
      console.warn(`Object kind "${kind}" is not available in this workflow config`)
      return
    }

    // If an existing object ID is provided, navigate to it
    if (existingId) {
      if (navLayout === "ideal") {
        if (kind === "customer" || kind === "coupon") {
          setOverlayObjectId(existingId)
        } else if (kind === "price" || kind === "meter") {
          setChildModalObjectId(existingId)
        } else {
          selectTab(existingId)
        }
        showRationale(kind, "ideal")
      } else if (navLayout === "intent") {
        const isPermanent = !config.objectKinds[kind]?.dependsOn
        if (isPermanent) {
          setOverlayObjectId(existingId)
        } else {
          setChildModalObjectId(existingId)
        }
        showRationale(kind, "intent")
      } else if (navLayout === "navigate") {
        const isPermanent = !config.objectKinds[kind]?.dependsOn
        if (isPermanent) {
          slideDirection.current = 1
          setNavigatePageId(existingId)
        } else {
          setNavigateChildId(existingId)
        }
        showRationale(kind, "navigate")
      } else if (navLayout === "compose") {
        const isPermanent = !config.objectKinds[kind]?.dependsOn
        if (isPermanent) {
          setOverlayObjectId(existingId)
        } else {
          setChildModalObjectId(existingId)
        }
        showRationale(kind, "compose")
      } else {
        selectTab(existingId)
        if (navLayout === "drawer" || navLayout === "modal") {
          setOverlayObjectId(existingId)
        }
      }
      return
    }

    const existing = workflow.objects.find((o) => o.kind === kind)

    let id: string
    if (existing && !kindConfig.allowMultiple) {
      id = existing.id
    } else {
      id = workflow.addObject(kind)
    }
    if (initialData) {
      workflow.updateObjectData(id, initialData)
    }

    if (navLayout === "ideal") {
      if (kind === "customer" || kind === "coupon") {
        // Peer objects: open in modal, keep workspace on current tab
        const currentTab = workflow.objects.find(
          (o) => o.kind === config.initialObjectKind || o.kind === "product"
        )
        if (currentTab) workflow.setActiveObject(currentTab.id)
        setOverlayObjectId(id)
      } else if (kind === "price" || kind === "meter") {
        // Child objects: open in slide-out, keep workspace on product tab
        const productTab = workflow.objects.find((o) => o.kind === "product")
        if (productTab) workflow.setActiveObject(productTab.id)
        setChildModalObjectId(id)
      } else {
        // Bundled catalog objects (product): add as workspace tab
        selectTab(id)
        history.pushState(
          { creationFlow: flow, tabId: id },
          "",
          `${window.location.pathname}${window.location.search}#create=${flow}&tab=${id}`
        )
      }
      showRationale(kind, "ideal")
    } else if (navLayout === "intent") {
      // Intent mode: permanent entities → modal, non-permanent → inline within parent modal
      const isPermanent = !kindConfig.dependsOn
      if (isPermanent) {
        setOverlayObjectId(id)
      } else {
        setChildModalObjectId(id)
      }
      showRationale(kind, "intent")
      const rootObj = workflow.objects.find((o) => o.kind === config.initialObjectKind)
      if (rootObj) workflow.setActiveObject(rootObj.id)
    } else if (navLayout === "navigate") {
      // Navigate mode: permanent → page transition, non-permanent → floating card
      const isPermanent = !kindConfig.dependsOn
      if (isPermanent) {
        slideDirection.current = 1
        setNavigatePageId(id)
      } else {
        setNavigateChildId(id)
      }
      showRationale(kind, "navigate")
      const rootObj = workflow.objects.find((o) => o.kind === config.initialObjectKind)
      if (rootObj) workflow.setActiveObject(rootObj.id)
    } else if (navLayout === "compose") {
      // Compose mode: permanent → modal, non-permanent → slide-out panel within modal
      const isPermanent = !kindConfig.dependsOn
      if (isPermanent) {
        setOverlayObjectId(id)
      } else {
        setChildModalObjectId(id)
      }
      showRationale(kind, "compose")
      const rootObj = workflow.objects.find((o) => o.kind === config.initialObjectKind)
      if (rootObj) workflow.setActiveObject(rootObj.id)
    } else if (navLayout === "drawer" || navLayout === "modal") {
      setOverlayObjectId(id)
    } else {
      selectTab(id)
      if (!existing || kindConfig.allowMultiple) {
        history.pushState(
          { creationFlow: flow, tabId: id },
          "",
          `${window.location.pathname}${window.location.search}#create=${flow}&tab=${id}`
        )
      }
    }
  }

  // Handle sub-object creation from within an already-open modal (stacked modal)
  const handleChildAddObject = (kind: string) => {
    if (kind === "_fullEditor") {
      const editorPres = typeof window !== "undefined" ? localStorage.getItem("fullEditorPresentation") : null
      if (editorPres === "new-tab") {
        setNewTabToast("This would open the full product editor in a new browser tab.")
        return
      }
      setIsFullProductEditorOpen(true)
      return
    }
    const kindConfig = config.objectKinds[kind]
    if (!kindConfig) {
      console.warn(`Object kind "${kind}" is not available in this workflow config`)
      return
    }
    const existing = workflow.objects.find((o) => o.kind === kind)

    let id: string
    if (existing && !kindConfig.allowMultiple) {
      id = existing.id
    } else {
      id = workflow.addObject(kind)
    }

    // If a child is already open and we're adding a meter (from price), use grandchild level
    if (childModalObjectId && kind === "meter") {
      setGrandchildObjectId(id)
    } else {
      setChildModalObjectId(id)
    }
  }

  // Sync grandchild (meter) data back to child (price) on dismiss
  const handleDismissGrandchild = () => {
    if (grandchildObject && childModalObject) {
      if (grandchildObject.kind === "meter" && grandchildObject.data.name) {
        workflow.updateObjectData(childModalObject.id, { meterId: grandchildObject.id, meterName: grandchildObject.data.displayName || grandchildObject.data.name })
      }
    }
    setGrandchildObjectId(null)
  }

  // Sync child object data back to parent on dismiss
  const handleDismissChild = () => {
    if (childModalObject) {
      // Find the parent: in drawer/modal modes it's the overlayObject, in tabs/sidebar it's the active product
      const parentObj = overlayObject
        ?? workflow.objects.find((o) => o.kind === "product")

      if (childModalObject.kind === "meter" && childModalObject.data.name) {
        const priceObj = workflow.objects.find((o) => o.kind === "price" && o.data.usageType === "metered")
        if (priceObj) {
          workflow.updateObjectData(priceObj.id, { meterId: childModalObject.id, meterName: childModalObject.data.displayName || childModalObject.data.name })
        }
      } else if (childModalObject.kind === "price" && parentObj) {
        const existingPrices: any[] = parentObj.data._prices ?? []
        const priceEntry = {
          id: childModalObject.id,
          name: childModalObject.data.name || "",
          amount: childModalObject.data.amount || "",
          pricingModel: childModalObject.data.pricingModel || "standard",
          billingPeriod: childModalObject.data.billingPeriod || "monthly",
          currency: childModalObject.data.currency || "USD",
          priceType: childModalObject.data.priceType || "recurring",
          usageType: childModalObject.data.usageType || "licensed",
          meterName: childModalObject.data.meterName || "",
          tiers: childModalObject.data.tiers,
        }
        const idx = existingPrices.findIndex((p: any) => p.id === childModalObject.id)
        const updatedPrices = idx >= 0 ? existingPrices.map((p: any, i: number) => i === idx ? priceEntry : p) : [...existingPrices, priceEntry]
        workflow.updateObjectData(parentObj.id, { _prices: updatedPrices, _highlightPriceId: childModalObject.id })
      }
    }
    setChildModalObjectId(null)
  }

  // Ideal mode: slide-out panel for price/meter (child objects)
  const idealSlideOutObject = navLayout === "ideal" && childModalObjectId
    ? workflow.objects.find((o) => o.id === childModalObjectId)
    : null
  const idealSlideOutKind = idealSlideOutObject?.kind
  const IdealSlideOutFormComponent = idealSlideOutKind
    ? config.objectKinds[idealSlideOutKind]?.formComponent
    : null

  const handleDismissIdealSlideOut = () => {
    if (idealSlideOutObject) {
      const parentProduct = workflow.objects.find((o) => o.kind === "product")
      if (idealSlideOutObject.kind === "price" && parentProduct) {
        const existingPrices: any[] = parentProduct.data._prices ?? []
        const priceEntry = {
          id: idealSlideOutObject.id,
          name: idealSlideOutObject.data.name || "",
          amount: idealSlideOutObject.data.amount || "",
          pricingModel: idealSlideOutObject.data.pricingModel || "standard",
          billingPeriod: idealSlideOutObject.data.billingPeriod || "monthly",
          currency: idealSlideOutObject.data.currency || "USD",
          priceType: idealSlideOutObject.data.priceType || "recurring",
          usageType: idealSlideOutObject.data.usageType || "licensed",
          meterName: idealSlideOutObject.data.meterName || "",
          tiers: idealSlideOutObject.data.tiers,
        }
        const idx = existingPrices.findIndex((p: any) => p.id === idealSlideOutObject.id)
        const updatedPrices = idx >= 0
          ? existingPrices.map((p: any, i: number) => i === idx ? priceEntry : p)
          : [...existingPrices, priceEntry]
        workflow.updateObjectData(parentProduct.id, { _prices: updatedPrices })
      } else if (idealSlideOutObject.kind === "meter") {
        const priceObj = workflow.objects.find((o) => o.kind === "price" && o.data.usageType === "metered")
        if (priceObj && idealSlideOutObject.data.name) {
          workflow.updateObjectData(priceObj.id, { meterId: idealSlideOutObject.id, meterName: idealSlideOutObject.data.displayName || idealSlideOutObject.data.name })
        }
      }
    }
    setChildModalObjectId(null)
  }

  const previewPanel = (
    <>
      {validationPanel}
      {hasPreview && PreviewComponent && (
          <div className="relative flex h-full w-full min-w-0">
            {/* Ideal mode: price/meter slide-out panel */}
            <AnimatePresence>
              {navLayout === "ideal" && idealSlideOutObject && IdealSlideOutFormComponent && (
                <motion.div
                  key="ideal-slideout"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 340, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="h-full shrink-0 overflow-hidden border-r border-[#EBEEF1] bg-white"
                >
                  <div className="flex h-full w-[340px] flex-col">
                    <div className="flex items-center justify-between border-b border-[#ECF1F6] px-[16px] py-[10px]">
                      <span className="text-[13px] font-[600] leading-[18px] text-[#1A2C44]">
                        {config.objectKinds[idealSlideOutKind!]?.label ?? "Details"}
                      </span>
                      <button
                        type="button"
                        onClick={handleDismissIdealSlideOut}
                        className="flex h-[26px] items-center rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[10px] text-[11px] font-[600] text-white transition-colors hover:bg-[#4730E0]"
                      >
                        Done
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-[16px] py-[16px]">
                      <IdealSlideOutFormComponent
                        data={idealSlideOutObject.data}
                        onChange={(data: Record<string, any>) => workflow.updateObjectData(idealSlideOutObject.id, data)}
                        onAddObject={(kind: string) => handleAddObject(kind)}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {showAnnotation && activeKind ? (
                  <div className="flex h-full items-center justify-center gap-[12px] px-[8px]">
                    <div className="w-full max-w-[432px] shrink-0">
                      <PreviewComponent
                        data={rootObj?.data ?? {}}
                        allObjects={workflow.objects}
                        config={config}
                        {...(PreviewComponent === InvoicePreview ? { highlightUsageLine: activeKind === "meter" || activeKind === "price" } : {})}
                      />
                    </div>
                    {/* Annotation — contextual detail card adjacent to preview */}
                    <div className="relative flex w-[210px] shrink-0 items-start" style={{ paddingTop: "100px" }}>
                      <div className="absolute -left-[14px] top-[120px] flex items-center">
                        <div className="h-[6px] w-[6px] rounded-full bg-[#533AFD]/50" />
                        <div className="h-px w-[8px] border-t border-dashed border-[#533AFD]/40" />
                      </div>
                      <div className="rounded-[10px] border border-[#533AFD]/20 bg-white p-[12px] shadow-[0_4px_20px_rgba(83,58,253,0.06)]">
                        <p className="mb-[8px] text-[10px] font-[600] uppercase tracking-[0.5px] text-[#533AFD]">
                          {contextualLabels[activeKind] ?? "Details"}
                        </p>
                        <ContextualDetailContent kind={activeKind} meterToolData={meterToolData} priceDetailBlock={priceDetailBlock} productDetailBlock={productDetailBlock} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <PreviewComponent
                    data={rootObj?.data ?? {}}
                    allObjects={workflow.objects}
                    config={config}
                  />
                )}
              </div>
          </div>
      )}
    </>
  )

  // Customers: single modal that matches the product modal's structure and footer placement.
  if (flow === "customers") {
    const customerObj = workflow.objects.find((o) => o.kind === "customer") ?? workflow.objects[0]
    const isTreeCustomerLayout = customerFormLayout === "tree"
    const isTabsCustomerLayout = customerFormLayout === "tabs"
    const isSailCustomerForm = productFormStyle === "sail"
    const isRefreshCustomerForm = productFormStyle === "refresh"
    const customerSizeClass = isTreeCustomerLayout ? "h-[520px] w-[592px]" : isTabsCustomerLayout ? "h-[520px] w-[640px]" : "w-[480px] max-h-[calc(100vh-48px)]"
    const customerShellClass = isSailCustomerForm
      ? `flex ${customerSizeClass} max-w-full flex-col overflow-hidden rounded-[8px] border border-[#EBEEF1] bg-white shadow-[0px_15px_35px_0px_rgba(48,49,61,0.08),0px_5px_15px_0px_rgba(0,0,0,0.12)] transition-[max-height] duration-200`
      : isRefreshCustomerForm
        ? `flex ${customerSizeClass} max-w-full flex-col overflow-hidden rounded-[12px] border border-[#D8E1EA] bg-white shadow-[0px_20px_60px_rgba(20,34,52,0.12),0px_4px_16px_rgba(20,34,52,0.08)] transition-[max-height] duration-200`
        : `flex ${customerSizeClass} max-w-full flex-col overflow-hidden rounded-[12px] border border-[#EBEEF1] bg-white shadow-[0px_20px_60px_rgba(0,0,0,0.12),0px_4px_16px_rgba(0,0,0,0.08)] transition-[max-height] duration-200`
    const customerHeaderClass = isTabsCustomerLayout
      // Tabs layout: no header border (the tab bar owns the single divider) and Figma-matched padding.
      ? (isSailCustomerForm ? "flex items-center justify-between px-[24px] pt-[16px] pb-[0px]" : isRefreshCustomerForm ? "flex items-center justify-between px-[24px] pt-[24px] pb-[16px]" : "flex items-center justify-between px-[24px] pt-[16px] pb-[12px]")
      : isSailCustomerForm ? "flex items-center justify-between border-b border-[#ECF1F6] p-[16px]" : isRefreshCustomerForm ? "flex items-center justify-between px-[24px] py-[24px]" : "flex items-center justify-between border-b border-[#ECF1F6] px-[20px] py-[14px]"
    const customerTitleClass = isSailCustomerForm ? "text-[16px] font-[700] leading-[24px] tracking-[-0.31px] text-[#353A44]" : isRefreshCustomerForm ? "text-[20px] font-[600] leading-[24px] tracking-[-0.2px] text-[#142234]" : "text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]"
    const customerFooterClass = isSailCustomerForm ? "flex items-center justify-end gap-[8px] border-t border-[#ECF1F6] p-[16px]" : isRefreshCustomerForm ? "flex items-center justify-end gap-[8px] px-[24px] py-[24px]" : "flex items-center justify-end gap-[8px] border-t border-[#ECF1F6] px-[20px] py-[12px]"
    const customerContentClass = isRefreshCustomerForm
      ? `relative min-h-0 flex-1 ${isTreeCustomerLayout || isTabsCustomerLayout ? "overflow-hidden" : "overflow-y-auto px-[24px] pt-0 pb-[16px]"}`
      : `relative h-full min-h-0 flex-1 ${isTreeCustomerLayout || isTabsCustomerLayout ? "overflow-hidden" : "overflow-y-auto px-[20px] py-[16px]"}`
    const customerSecondaryButtonClass = isSailCustomerForm
      ? "flex h-[28px] items-center justify-center rounded-[6px] bg-white px-[8px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#353A44] shadow-[0px_1px_1px_0px_rgba(26,27,37,0.16),0px_0px_0px_1px_#D5DBE1] transition-colors hover:bg-[#F5F6F8]"
      : isRefreshCustomerForm
        ? "flex items-center gap-[6px] rounded-full bg-[#F1F6FB] px-[12px] py-[6px] text-[13px] font-[500] leading-[20px] tracking-[-0.065px] text-[#142234] transition-colors hover:bg-[#EAF0F6]"
        : "flex h-[28px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
    const customerPrimaryButtonClass = isSailCustomerForm
      ? "flex h-[28px] items-center justify-center rounded-[6px] bg-[#675DFF] px-[8px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-white shadow-[0px_1px_1px_0px_rgba(20,19,78,0.32),0px_0px_0px_1px_#625AFA] hover:bg-[#5B52F0]"
      : isRefreshCustomerForm
        ? "flex items-center gap-[6px] rounded-full bg-[#2C219E] px-[12px] py-[6px] text-[13px] font-[500] leading-[20px] tracking-[-0.065px] text-white transition-colors hover:bg-[#241A86]"
        : "flex h-[28px] items-center rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white hover:bg-[#4730E0]"
    const handleCustomerCreate = () => {
      const email = customerObj.data.email
      if (!email || (typeof email === "string" && !email.trim())) {
        workflow.handlePrimaryAction()
        return
      }
      if (onSubmit) {
        onSubmit(flow, workflow.objects.map((o) => ({ kind: o.kind, data: o.data })))
      }
      onClose()
    }

    return (
      <>
        <motion.div
          className="fixed inset-0 z-40 bg-black/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: isCustomerInvoiceEditorOpen ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        />
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-[24px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: isCustomerInvoiceEditorOpen ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={
            isCustomerInvoiceEditorOpen
              ? { transform: "scale(1.1)", opacity: 0, pointerEvents: "none", transition: "transform 350ms cubic-bezier(0.32, 0.72, 0, 1), opacity 200ms ease" }
              : { transition: "transform 250ms ease, filter 250ms ease" }
          }
        >
          <motion.div
            className={customerShellClass}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className={customerHeaderClass}>
              <p className={customerTitleClass}>
                Create customer
              </p>
              {isRefreshCustomerForm && <RefreshCloseButton onClose={onClose} />}
            </div>

            <div className={customerContentClass}>
              {isTreeCustomerLayout && (
                <div className="pointer-events-none absolute bottom-0 left-[184px] top-0 z-10 w-px bg-[#ECF1F6]" />
              )}
              <CustomerForm
                data={customerObj.data}
                onChange={(data: Record<string, any>) => {
                  workflow.updateObjectData(customerObj.id, data)
                  if (hasErrors) workflow.clearValidationErrors()
                }}
                errorFields={activeErrorFields.size > 0 ? activeErrorFields : undefined}
                layout={customerFormLayout}
                onOpenInvoiceEditor={() => setIsCustomerInvoiceEditorOpen(true)}
              />
            </div>

            <div className={customerFooterClass}>
              <button
                type="button"
                className={customerSecondaryButtonClass}
                onClick={onClose}
              >
                Discard
              </button>
              <button
                type="button"
                className={customerPrimaryButtonClass}
                onClick={handleCustomerCreate}
              >
                Create customer
              </button>
            </div>
          </motion.div>
        </motion.div>
        <FullInvoiceEditor
          isOpen={isCustomerInvoiceEditorOpen}
          customerData={customerObj.data}
          customerId={customerObj.id}
          onBack={() => setIsCustomerInvoiceEditorOpen(false)}
          onClose={onClose}
        />
      </>
    )
  }

  // Coupons: focused modal with Dashboard fields and product-style footer actions.
  if (flow === "coupons") {
    return (
      <>
        <CouponFlowModal workflow={workflow} hasErrors={hasErrors} activeErrorFields={activeErrorFields} onClose={onClose} onOpenFullEditor={() => setIsFullProductEditorOpen(true)} />
        <FullProductEditor
          isOpen={isFullProductEditorOpen}
          onClose={() => { setIsFullProductEditorOpen(false) }}
        />
      </>
    )
  }

  // API access policy: self-contained simple modal (does not use the billing workflow engine).
  if (flow === "api-access-policy") {
    return <ApiAccessPolicyFlowModal onClose={onClose} />
  }

  // Create secret key: self-contained simple modal, reinterpreted from the IAM wizard.
  if (flow === "create-api-key") {
    return <CreateApiKeyFlowModal onClose={onClose} />
  }

  // Products: single modal with drill-in for price, separate stacked modal for meter
  if (flow === "products") {
    const isSailProductForm = productFormStyle === "sail"
    const isRefreshProductForm = productFormStyle === "refresh"
    const productObj = workflow.objects.find((o) => o.kind === "product") ?? workflow.objects[0]
    const siblingPrices: Record<string, any>[] = workflow.objects
      .filter((o) => o.kind === "price" && o.id !== childModalObjectId)
      .map((o) => ({ id: o.id, ...o.data }))
    const productData: Record<string, any> = { ...productObj.data, _prices: siblingPrices }

    const productPanelDepth = childModalObject && ChildModalFormComponent ? 1 : 0
    const hasProductGrandchild = grandchildObject && GrandchildFormComponent

    const handleProductAddObject = (kind: string, existingId?: string) => {
      setProductFlowErrors(new Set())
      setProductFlowErrorMessage("")
      if (kind === "_fullEditor") {
        const editorPres = typeof window !== "undefined" ? localStorage.getItem("fullEditorPresentation") : null
        if (editorPres === "new-tab") {
          setNewTabToast("This would open the full product editor in a new browser tab.")
          return
        }
        setIsFullProductEditorOpen(true)
        return
      }

      const kindConfig = config.objectKinds[kind]
      if (!kindConfig) return

      if (existingId) {
        if (kind === "meter") {
          setGrandchildObjectId(existingId)
        } else {
          setChildModalObjectId(existingId)
        }
        return
      }

      const existing = workflow.objects.find((o) => o.kind === kind)
      let id: string
      if (existing && !kindConfig.allowMultiple) {
        id = existing.id
      } else {
        id = workflow.addObject(kind)
      }

      if (childModalObjectId && kind === "meter") {
        setGrandchildObjectId(id)
      } else {
        setChildModalObjectId(id)
      }
    }

    const handleProductBack = () => {
      if (childModalObject) {
        if (childModalObject.kind === "price" && productObj) {
          const existingPrices: any[] = productObj.data._prices ?? []
          const entry = { id: childModalObject.id, ...childModalObject.data }
          const idx = existingPrices.findIndex((p: any) => p.id === childModalObject.id)
          const updated = idx >= 0 ? existingPrices.map((p: any, i: number) => i === idx ? entry : p) : [...existingPrices, entry]
          workflow.updateObjectData(productObj.id, { _prices: updated, _highlightPriceId: childModalObject.id })
        } else if (childModalObject.kind === "meter") {
          const priceObj = workflow.objects.find((o) => o.kind === "price" && o.data.usageType === "metered")
          if (priceObj && childModalObject.data.name) {
            workflow.updateObjectData(priceObj.id, {
              meterId: childModalObject.id,
              meterName: childModalObject.data.displayName || childModalObject.data.name,
            })
          }
        }
      }
      setChildModalObjectId(null)
    }

    const handleProductDismissGrandchild = () => {
      if (grandchildObject && childModalObject) {
        if (grandchildObject.kind === "meter" && grandchildObject.data.name) {
          workflow.updateObjectData(childModalObject.id, {
            meterId: grandchildObject.id,
            meterName: grandchildObject.data.displayName || grandchildObject.data.name,
          })
        }
      }
      setGrandchildObjectId(null)
    }

    const productTitle = productPanelDepth === 1
      ? (config.objectKinds[childModalKind!]?.label ?? "Price")
      : "New product"
    const productPrimaryLabel = productPanelDepth === 1 ? "Done" : "Create product"
    // Related-objects demo: the modal hugs its content (no fixed min-height / inner scroll)
    // so the "More pricing options" pointer is never clipped. This flow never drills into
    // the price sub-pane, so we can drop the sliding track and render the form in flow.
    const isRelatedDemo = typeof window !== "undefined" && localStorage.getItem("relatedDemoHint") === "1"
    const productModalSizeClass = isRelatedDemo ? "max-h-[88vh]" : "min-h-[520px] max-h-[80vh]"
    const handleProductFormChange = (data: Record<string, any>) => {
      setProductFlowErrors(new Set())
      setProductFlowErrorMessage("")
      if (data._prices !== undefined) {
        const updatedIds = new Set((data._prices as any[]).map((p: any) => p.id))
        const removed = workflow.objects.filter((o) => o.kind === "price" && !updatedIds.has(o.id))
        for (const r of removed) workflow.removeObject(r.id)
        return
      }
      workflow.updateObjectData(productObj.id, data)
    }

    const handleProductPrimary = () => {
      if (productPanelDepth === 1 && childModalObject) {
        const errors = childModalObject.kind === "price"
          ? validatePriceData(childModalObject.data)
          : childModalObject.kind === "meter" && !String(childModalObject.data.name ?? "").trim()
            ? new Set(["name"])
            : new Set<string>()
        if (errors.size > 0) {
          setProductFlowErrors(errors)
          setProductFlowErrorMessage(childModalObject.kind === "meter" ? "Enter an event name" : "Complete the highlighted price fields")
          return
        }
        handleProductBack()
        return
      }

      const errors = new Set<string>()
      if (!String(productData.name ?? "").trim()) errors.add("name")
      if (siblingPrices.length > 0) {
        const invalidPrice = siblingPrices.find((price) => validatePriceData(price).size > 0)
        if (invalidPrice) validatePriceData(invalidPrice).forEach((field) => errors.add(field))
      } else {
        const inlinePrice = {
          priceType: productData._pricingType === "one_off" ? "one_time" : "recurring",
          pricingCategory: "flat_rate",
          chargeType: "per_unit",
          amount: productData._inlineAmount ?? "",
          currency: productData._inlineCurrency ?? "USD",
          billingPeriod: productData._inlineBillingPeriod ?? "monthly",
        }
        validatePriceData(inlinePrice).forEach((field) => errors.add(field === "amount" ? "_inlineAmount" : field))
      }
      if (errors.size > 0) {
        setProductFlowErrors(errors)
        setProductFlowErrorMessage(errors.has("name") ? "Enter a product name" : "Complete the highlighted price fields")
        return
      }

      setProductFlowErrors(new Set())
      setProductFlowErrorMessage("")
      onSubmit?.(flow, workflow.objects.map((object) => ({ kind: object.kind, data: object.data })))
      onClose()
    }

    return (
      <>
        <motion.div
          className="fixed inset-0 z-40 bg-black/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: isFullProductEditorOpen ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        />
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-[24px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: isFullProductEditorOpen ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={
            isFullProductEditorOpen
              ? { transform: "scale(1.1)", opacity: 0, pointerEvents: "none", transition: "transform 350ms cubic-bezier(0.32, 0.72, 0, 1), opacity 200ms ease" }
              : hasProductGrandchild
                ? { transform: "scale(0.94) translateY(-20px)", filter: "brightness(0.92)", pointerEvents: "none", transition: "transform 250ms ease, filter 250ms ease" }
                : { transition: "transform 250ms ease, filter 250ms ease" }
          }
        >
          <motion.div
            className={
              isSailProductForm
                ? `flex ${isRelatedDemo ? "max-h-[88vh]" : "max-h-[80vh]"} w-full max-w-[496px] flex-col overflow-hidden rounded-[8px] border border-[#EBEEF1] bg-white shadow-[0px_15px_35px_0px_rgba(48,49,61,0.08),0px_5px_15px_0px_rgba(0,0,0,0.12)]`
                : isRefreshProductForm
                  ? `flex ${productModalSizeClass} w-[480px] max-w-full flex-col overflow-hidden rounded-[12px] border border-[#D8E1EA] bg-white shadow-[0px_20px_60px_rgba(20,34,52,0.12),0px_4px_16px_rgba(20,34,52,0.08)]`
                  : `flex ${productModalSizeClass} w-[480px] max-w-full flex-col overflow-hidden rounded-[12px] border border-[#EBEEF1] bg-white shadow-[0px_20px_60px_rgba(0,0,0,0.12),0px_4px_16px_rgba(0,0,0,0.08)]`
            }
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={isSailProductForm ? "flex items-center justify-between border-b border-[#ECF1F6] p-[16px]" : isRefreshProductForm ? "flex items-center justify-between px-[24px] py-[24px]" : "flex items-center justify-between border-b border-[#ECF1F6] px-[20px] py-[14px]"}>
              <div className="flex items-center">
                <div
                  className="overflow-hidden"
                  style={{
                    width: productPanelDepth > 0 ? 32 : 0,
                    opacity: productPanelDepth > 0 ? 1 : 0,
                    transition: "width 250ms cubic-bezier(0.32, 0.72, 0, 1), opacity 150ms ease",
                  }}
                >
                  <button
                    type="button"
                    className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[4px] text-[#596171] hover:bg-[#F5F6F8]"
                    onClick={handleProductBack}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M7.5 1.5L3 6l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
                <p className={isSailProductForm ? "text-[16px] font-[700] leading-[24px] tracking-[-0.31px] text-[#353A44]" : isRefreshProductForm ? "text-[20px] font-[600] leading-[24px] tracking-[-0.2px] text-[#142234]" : "text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]"}>
                  {productTitle}
                </p>
              </div>
              {isRefreshProductForm && productPanelDepth === 0 && <RefreshCloseButton onClose={onClose} />}
            </div>

            {productFlowErrorMessage && (
              <div role="alert" className="border-y border-[#F8C6D0] bg-[#FFF5F7] px-[20px] py-[8px] text-[12px] font-[500] text-[#C0123C]">
                {productFlowErrorMessage}
              </div>
            )}

            {/* Content */}
            {isRelatedDemo ? (
              // Hug-to-content: no slide track or inner scroll, so the full form and the
              // "More pricing options" pointer stay visible (this flow never drills in).
              <div className={isSailProductForm ? "px-[16px] py-[16px]" : isRefreshProductForm ? "px-[24px] pt-0 pb-[16px]" : "px-[20px] py-[16px]"}>
                <ProductForm
                  data={productData}
                  onChange={handleProductFormChange}
                  onAddObject={handleProductAddObject}
                  pointAtMoreOptions={productPanelDepth === 0}
                  errorFields={productFlowErrors}
                />
              </div>
            ) : (
              // Horizontal navigation push (product ↔ price) — fixed height with inner scroll.
              <div className={isSailProductForm ? "relative min-h-[420px] flex-auto overflow-hidden" : isRefreshProductForm ? "relative min-h-[340px] flex-1 overflow-hidden" : "relative min-h-[300px] flex-1 overflow-hidden"}>
                <div
                  className="absolute inset-0 flex"
                  style={{
                    width: "200%",
                    transform: `translateX(-${productPanelDepth * 50}%)`,
                    transition: "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
                  }}
                >
                  {/* Pane 0: product form */}
                  <div className={isSailProductForm ? "h-full w-1/2 overflow-y-auto px-[16px] py-[16px]" : isRefreshProductForm ? "h-full w-1/2 overflow-y-auto px-[24px] pt-0 pb-[16px]" : "h-full w-1/2 overflow-y-auto px-[20px] py-[16px]"}>
                    <ProductForm
                      data={productData}
                      onChange={handleProductFormChange}
                      onAddObject={handleProductAddObject}
                      pointAtMoreOptions={false}
                      errorFields={productFlowErrors}
                    />
                  </div>

                  {/* Pane 1: price form (drill-in) */}
                  <div className="h-full w-1/2 overflow-y-auto px-[20px] py-[16px]">
                    {childModalObject && ChildModalFormComponent && (
                      <ChildModalFormComponent
                        data={childModalObject.data}
                        onChange={(data: Record<string, any>) => {
                          workflow.updateObjectData(childModalObject.id, data)
                          setProductFlowErrors(new Set())
                          setProductFlowErrorMessage("")
                        }}
                        onAddObject={(kind: string) => handleProductAddObject(kind)}
                        errorFields={productFlowErrors}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className={isSailProductForm ? "flex items-center justify-end gap-[8px] border-t border-[#ECF1F6] p-[16px]" : isRefreshProductForm ? "flex items-center justify-end gap-[8px] px-[24px] py-[24px]" : "flex items-center justify-end gap-[8px] border-t border-[#ECF1F6] px-[20px] py-[12px]"}>
              {productPanelDepth === 0 && (
                <button
                  type="button"
                  className={
                    isSailProductForm
                      ? "flex h-[28px] items-center justify-center rounded-[6px] bg-white px-[8px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#353A44] shadow-[0px_1px_1px_0px_rgba(26,27,37,0.16),0px_0px_0px_1px_#D5DBE1] transition-colors hover:bg-[#F5F6F8]"
                      : isRefreshProductForm
                        ? "flex items-center gap-[6px] rounded-full bg-[#F1F6FB] px-[12px] py-[6px] text-[13px] font-[500] leading-[20px] tracking-[-0.065px] text-[#142234] transition-colors hover:bg-[#EAF0F6]"
                        : "flex h-[28px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
                  }
                  onClick={onClose}
                >
                  Discard
                </button>
              )}
              <button
                type="button"
                className={productPanelDepth === 0
                  ? isSailProductForm
                    ? "flex h-[28px] items-center justify-center rounded-[6px] bg-[#675DFF] px-[8px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-white shadow-[0px_1px_1px_0px_rgba(20,19,78,0.32),0px_0px_0px_1px_#625AFA] hover:bg-[#5B52F0]"
                    : isRefreshProductForm
                      ? "flex items-center gap-[6px] rounded-full bg-[#2C219E] px-[12px] py-[6px] text-[13px] font-[500] leading-[20px] tracking-[-0.065px] text-white transition-colors hover:bg-[#241A86]"
                      : "flex h-[28px] items-center rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white hover:bg-[#4730E0]"
                  : isRefreshProductForm
                    ? "flex items-center gap-[6px] rounded-full bg-[#F1F6FB] px-[12px] py-[6px] text-[13px] font-[500] leading-[20px] tracking-[-0.065px] text-[#142234] transition-colors hover:bg-[#EAF0F6]"
                    : "flex h-[28px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] hover:bg-[#F5F6F8]"
                }
                onClick={handleProductPrimary}
              >
                {productPrimaryLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>

        {/* Meter modal — separate stacked modal on top */}
        {hasProductGrandchild && (
          <CreationModalShell
            isOpen={true}
            onClose={handleProductDismissGrandchild}
            title={config.objectKinds[grandchildKind!]?.label ?? "Meter"}
            primaryLabel={`Create ${(config.objectKinds[grandchildKind!]?.label ?? "meter").toLowerCase()}`}
            onPrimary={() => {
              if (!String(grandchildObject?.data.name ?? "").trim()) {
                setProductFlowErrors(new Set(["name"]))
                setProductFlowErrorMessage("Enter an event name")
                return
              }
              handleProductDismissGrandchild()
            }}
          >
            <div className="flex-1 overflow-y-auto px-[20px] py-[16px]">
              <GrandchildFormComponent
                data={grandchildObject!.data}
                onChange={(data: Record<string, any>) => {
                  workflow.updateObjectData(grandchildObject!.id, data)
                  setProductFlowErrors(new Set())
                  setProductFlowErrorMessage("")
                }}
                onAddObject={(kind: string) => handleProductAddObject(kind)}
                errorFields={productFlowErrors}
              />
            </div>
          </CreationModalShell>
        )}

        {/* Full product editor — triggered by "More pricing options". The Related objects
            pattern demo sets fullEditorPresentation="80-modal" so this escalates into the
            80% modal instead of the default full-screen editor. */}
        <FullProductEditor
          isOpen={isFullProductEditorOpen}
          onClose={() => setIsFullProductEditorOpen(false)}
          initialProductData={productData}
          presentation={typeof window !== "undefined" && localStorage.getItem("fullEditorPresentation") === "80-modal" ? "80-modal" : undefined}
          showRelatedHint={typeof window !== "undefined" && localStorage.getItem("relatedDemoHint") === "1"}
          onCreate={(createdProductData, createdItems) => {
            const prices = createdItems
              .filter((item) => item.kind === "price")
              .map(({ kind: _kind, ...price }) => price)
            const existingPriceObjects = workflow.objects.filter((object) => object.kind === "price")
            existingPriceObjects.forEach((object) => workflow.removeObject(object.id))
            const persistedPrices = prices.map((price) => {
              const id = workflow.addObject("price")
              workflow.updateObjectData(id, price)
              return { ...price, id }
            })
            const persistedProduct = { ...createdProductData, _prices: persistedPrices }
            workflow.updateObjectData(productObj.id, persistedProduct)
            onSubmit?.(flow, [
              { kind: "product", data: persistedProduct },
              ...persistedPrices.map((price) => ({ kind: "price", data: price })),
            ])
            setIsFullProductEditorOpen(false)
            onClose()
          }}
        />
      </>
    )
  }

  return (
    <>
      <CreationWorkspace
        mode={workspaceMode}
        presentation={presentation}
        isOpen={true}
        onClose={onClose}
        hideHeader={headerStyle === "inline"}
        formPanelStyle={headerStyle === "inline" ? formPanelStyle : "default"}
        header={
          <SimpleCreationHeader
            title={flowTitles[flow] ?? "Create"}
            onDiscard={onClose}
            onSubmit={onSubmit ? handleSubmitAction : workflow.handlePrimaryAction}
            submitLabel={idealSubmitLabel}
            submitDisabled={isRefresh && flow === "invoices" ? false : !invoiceReady}
            discardLabel={config.discardLabel}
            onAddObject={(kind) => handleAddObject(kind)}
            addOptions={addOptions}
            tabs={workflow.objects
              .filter((obj) => navLayout !== "ideal" || obj.kind === config.initialObjectKind || obj.kind === "product")
              .map((obj) => ({
                id: obj.id,
                kind: obj.kind,
                label: obj.kind === config.initialObjectKind
                  ? config.objectKinds[obj.kind]?.label ?? obj.kind
                  : obj.label,
              }))}
            activeTabId={workflow.activeObjectId}
            onSelectTab={selectTab}
            onRemoveTab={(id) => workflow.removeObject(id)}
            errorTabIds={hasErrors ? errorObjectIds : undefined}
            navLayout={navLayout}
          />
        }
        navigator={sidebarNav}
        editor={
          <div className="relative flex flex-1 flex-col">
            {presentation === "modal" && validationPanel}

            {headerStyle === "inline" && (
              buttonPlacement === "header" ? (
                <div className="-mx-[16px] -mt-[16px] mb-[16px] flex items-center justify-between border-b border-[#ECF1F6] px-[16px] py-[12px]">
                  <h2 className="text-[16px] font-[600] leading-[24px] tracking-[-0.18px] text-[#1A2C44]">
                    {flowTitles[flow] ?? "Create"}
                  </h2>
                  <div className="flex items-center gap-[8px]">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex h-[28px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      disabled={!invoiceReady}
                      onClick={onSubmit ? handleSubmitAction : workflow.handlePrimaryAction}
                      className={invoiceReady
                        ? "flex h-[28px] items-center rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white transition-colors hover:bg-[#4730E0]"
                        : "flex h-[28px] items-center rounded-[6px] border border-[#D4DEE9] bg-[#F5F6F8] px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#9CA3B0] cursor-not-allowed"
                      }
                    >
                      {idealSubmitLabel}
                    </button>
                  </div>
                </div>
              ) : (
                <h2 className="mb-[12px] text-[16px] font-[600] leading-[24px] tracking-[-0.18px] text-[#1A2C44]">
                  {flowTitles[flow] ?? "Create"}
                </h2>
              )
            )}

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={navLayout === "navigate" && navigatePageId ? `navigate-${navigatePageId}` : (showPrimaryOnly ? `form-primary` : `form-${workflow.activeObjectId}`)}
                className="relative flex-1 -mx-[16px] px-[16px] overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                transition={{ duration: 0.16, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {/* Navigate mode: page-level form with breadcrumb */}
                {navLayout === "navigate" && navigatePageObj && NavigatePageForm ? (
                  <div
                    className="flex h-full flex-col"
                    style={{
                      paddingRight: navigateChildObj && grandchildObject ? 24 : 0,
                      transition: "padding-right 250ms cubic-bezier(0.32, 0.72, 0, 1)",
                    }}
                  >
                    {/* Breadcrumb bar with Done button */}
                    <div className="mb-[12px] flex items-center justify-between">
                      <div className="flex items-center gap-[6px]">
                        <button
                          type="button"
                          onClick={() => {
                            if (navigatePageObj && primaryObject) {
                              if (navigatePageObj.kind === "customer") {
                                workflow.updateObjectData(primaryObject.id, { customerId: navigatePageObj.id, customerName: navigatePageObj.data.name || "Customer" })
                              } else if (navigatePageObj.kind === "product") {
                                workflow.updateObjectData(primaryObject.id, { productId: navigatePageObj.id, productName: navigatePageObj.data.name || "New product" })
                              }
                            }
                            const label = config.objectKinds[navigatePageObj.kind]?.label ?? navigatePageObj.kind
                            // setRationaleToast(`${label} created as a permanent object — returning to the parent invoice.`)
                            setNavigateChildId(null)
                            setNavigatePageId(null)
                            slideDirection.current = -1
                          }}
                          className="text-[12px] font-[500] text-[#533AFD] hover:underline"
                        >
                          {(() => {
                            const raw = config.lifecycle.submitLabel?.replace("Create ", "") ?? "Back"
                            return raw.charAt(0).toUpperCase() + raw.slice(1)
                          })()}
                        </button>
                        <svg width="6" height="9" viewBox="0 0 6 9" fill="none" className="text-[#9CA3B0]">
                          <path d="M1 1L4.5 4.5L1 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text-[12px] font-[600] text-[#1A2C44]">
                          {config.objectKinds[navigatePageObj.kind]?.label}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (navigatePageObj && primaryObject) {
                            if (navigatePageObj.kind === "customer") {
                              workflow.updateObjectData(primaryObject.id, { customerId: navigatePageObj.id, customerName: navigatePageObj.data.name || "Customer" })
                            } else if (navigatePageObj.kind === "product") {
                              workflow.updateObjectData(primaryObject.id, { productId: navigatePageObj.id, productName: navigatePageObj.data.name || "New product" })
                            }
                          }
                          const label = config.objectKinds[navigatePageObj.kind]?.label ?? navigatePageObj.kind
                          // setRationaleToast(`${label} created as a permanent object — returning to the parent invoice.`)
                          setNavigateChildId(null)
                          setNavigatePageId(null)
                          slideDirection.current = -1
                        }}
                        className="flex h-[28px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
                      >
                        Create {(config.objectKinds[navigatePageObj.kind]?.label ?? navigatePageObj.kind).toLowerCase()}
                      </button>
                    </div>

                    {/* Page form */}
                    <div className="flex-1 overflow-y-auto">
                      <NavigatePageForm
                        data={{
                          ...navigatePageObj.data,
                          ...(navigatePageObj.kind === "product" ? {
                            _prices: workflow.objects.filter((o) => o.kind === "price" && o.id !== navigateChildId).map((o) => ({
                              id: o.id, name: o.data.name || "", amount: o.data.amount || "",
                              pricingModel: o.data.pricingModel || "standard", billingPeriod: o.data.billingPeriod || "",
                              currency: o.data.currency || "USD", priceType: o.data.priceType || "recurring",
                              usageType: o.data.usageType || "licensed", meterName: o.data.meterName || "", tiers: o.data.tiers,
                            })),
                          } : {}),
                        }}
                        onChange={(data: Record<string, any>) => {
                          if (navigatePageObj.kind === "product" && data._prices !== undefined) {
                            const updatedIds = new Set((data._prices as any[]).map((p: any) => p.id))
                            const removed = workflow.objects.filter((o) => o.kind === "price" && !updatedIds.has(o.id))
                            for (const r of removed) workflow.removeObject(r.id)
                            return
                          }
                          workflow.updateObjectData(navigatePageObj.id, data)
                        }}
                        onAddObject={(kind: string, existingId?: string, initialData?: Record<string, any>) => handleAddObject(kind, existingId, initialData)}
                      />
                    </div>

                  </div>
                ) : (
                <>

                {navLayout === "navigate" && (
                  <div className="mb-[12px] flex items-center gap-[6px]">
                    <span className="text-[12px] font-[600] text-[#1A2C44]">
                      {(() => {
                        const raw = config.lifecycle.submitLabel?.replace("Create ", "") ?? "Invoice"
                        return raw.charAt(0).toUpperCase() + raw.slice(1)
                      })()}
                    </span>
                  </div>
                )}

                {((isRefresh && flow === "invoices" && displayedFormKind === "invoice") || navLayout === "vertical" || navLayout === "horizontal" || navLayout === "ideal") && (
                  <div className={isRefresh && flow === "invoices" && displayedFormKind === "invoice" ? "mb-[16px] flex min-w-0 items-center justify-between" : "mb-[16px] flex min-w-0 items-center justify-between"}>
                    <p className={isRefresh && flow === "invoices" && displayedFormKind === "invoice" ? "truncate text-[17px] font-[675] leading-[24px] tracking-[-0.18px] text-[#142234]" : "truncate text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]"}>
                      {isRefresh && flow === "invoices" && displayedFormKind === "invoice" ? "Invoice details" : displayedEditorTitle}
                    </p>
                    <div className="flex shrink-0 items-center gap-[8px]">
                      {displayedFormKind && displayedFormKind !== config.initialObjectKind && displayedFormObject && (
                        <button
                          type="button"
                          className="group flex h-[24px] w-[24px] items-center justify-center rounded-[6px] border border-[#D4DEE9] bg-white hover:border-[#FAA9B8] hover:bg-[#FEF4F6]"
                          aria-label={`Delete ${displayedKindLabel.toLowerCase()}`}
                          title={`Delete ${displayedKindLabel.toLowerCase()}`}
                          onClick={() => {
                            workflow.removeObject(displayedFormObject.id)
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                            <path fillRule="evenodd" clipRule="evenodd" d="M8.99998 3V1.5C8.99998 0.671573 8.3284 0 7.49998 0H4.49998C3.67155 0 2.99998 0.671573 2.99998 1.5V3H0.75C0.335786 3 0 3.33579 0 3.75C0 4.16421 0.335786 4.5 0.75 4.5H1.49998V10C1.49998 11.1046 2.39541 12 3.49998 12H8.49998C9.60454 12 10.5 11.1046 10.5 10V4.5H11.25C11.6642 4.5 12 4.16421 12 3.75C12 3.33579 11.6642 3 11.25 3H8.99998ZM7.49998 1.4H4.49998C4.44475 1.4 4.39998 1.44477 4.39998 1.5V3H7.59998V1.5C7.59998 1.44477 7.5552 1.4 7.49998 1.4ZM9.09998 4.5V10C9.09998 10.3314 8.83135 10.6 8.49998 10.6H3.49998C3.1686 10.6 2.89998 10.3314 2.89998 10V4.5H9.09998Z" fill="#3C4F69" className="group-hover:fill-[#E61947]"/>
                            <path fillRule="evenodd" clipRule="evenodd" d="M4.62498 5.5C4.97015 5.5 5.24998 5.77982 5.24998 6.125V8.875C5.24998 9.22018 4.97015 9.5 4.62498 9.5C4.2798 9.5 3.99998 9.22018 3.99998 8.875V6.125C3.99998 5.77982 4.2798 5.5 4.62498 5.5Z" fill="#3C4F69" className="group-hover:fill-[#E61947]"/>
                            <path fillRule="evenodd" clipRule="evenodd" d="M7.37498 5.5C7.72015 5.5 7.99998 5.77982 7.99998 6.125V8.875C7.99998 9.22018 7.72015 9.5 7.37498 9.5C7.0298 9.5 6.74998 9.22018 6.74998 8.875V6.125C6.74998 5.77982 7.0298 5.5 7.37498 5.5Z" fill="#3C4F69" className="group-hover:fill-[#E61947]"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {DisplayedFormComponent && displayedFormObject && (
                  <DisplayedFormComponent
                    data={{
                      ...displayedFormObject.data,
                      _createdCustomers: workflow.objects
                        .filter((o) => o.kind === "customer" && o.data.name)
                        .map((o) => ({ id: o.id, name: o.data.name as string, detail: (o.data.email as string) || "" })),
                      _createdProducts: workflow.objects
                        .filter((o) => o.kind === "product" && o.data.name)
                        .map((o) => ({ id: o.id, name: o.data.name as string, detail: o.data.unitPrice ? `$${o.data.unitPrice}` : "" })),
                      _allObjects: workflow.objects,
                      ...(displayedFormObject.kind === "product" ? {
                        _prices: workflow.objects
                          .filter((o) => o.kind === "price")
                          .map((o) => ({
                            id: o.id,
                            name: o.data.name || "",
                            amount: o.data.amount || "",
                            pricingModel: o.data.pricingModel || "standard",
                            billingPeriod: o.data.billingPeriod || "",
                            currency: o.data.currency || "USD",
                            priceType: o.data.priceType || "recurring",
                            usageType: o.data.usageType || "licensed",
                            meterName: o.data.meterName || "",
                            tiers: o.data.tiers,
                          })),
                      } : {}),
                    }}
                    onChange={(data: Record<string, any>) => {
                      // Intercept _prices changes from product form to remove workflow objects
                      if (displayedFormObject.kind === "product" && data._prices !== undefined) {
                        const updatedIds = new Set((data._prices as any[]).map((p: any) => p.id))
                        const removed = workflow.objects.filter((o) => o.kind === "price" && !updatedIds.has(o.id))
                        for (const obj of removed) workflow.removeObject(obj.id)
                        return
                      }
                      workflow.updateObjectData(displayedFormObject.id, data)
                      if (hasErrors) workflow.clearValidationErrors()
                    }}
                    errorFields={
                      showPrimaryOnly
                        ? undefined
                        : activeErrorFields.size > 0 ? activeErrorFields : undefined
                    }
                    onAddObject={(kind: string, existingId?: string, initialData?: Record<string, any>) => handleAddObject(kind, existingId, initialData)}
                  />
                )}

                </>)}
              </motion.div>
            </AnimatePresence>

            {/* Navigate mode: floating child card — positioned relative to editor container */}
            <AnimatePresence>
              {navLayout === "navigate" && navigateChildObj && NavigateChildForm && (
                <>
                  <motion.div
                    key="navigate-child-dim"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute -inset-[16px] z-[5] bg-black/10"
                  />
                  <motion.div
                    key="navigate-child-card"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute inset-x-0 bottom-0 z-10 flex flex-col rounded-[12px] border border-[#ECF1F6] bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
                    style={{ maxHeight: "60%" }}
                  >
                    <div className="flex items-center justify-between border-b border-[#ECF1F6] px-[16px] py-[10px]">
                      <span className="text-[13px] font-[600] leading-[18px] text-[#1A2C44]">
                        {config.objectKinds[navigateChildObj.kind]?.label ?? "Details"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (navigateChildObj.kind === "price" && navigatePageObj) {
                            const existingPrices: any[] = navigatePageObj.data._prices ?? []
                            const entry = { id: navigateChildObj.id, name: navigateChildObj.data.name || "", amount: navigateChildObj.data.amount || "", pricingModel: navigateChildObj.data.pricingModel || "standard", billingPeriod: navigateChildObj.data.billingPeriod || "monthly", currency: navigateChildObj.data.currency || "USD", priceType: navigateChildObj.data.priceType || "recurring", usageType: navigateChildObj.data.usageType || "licensed", meterName: navigateChildObj.data.meterName || "", tiers: navigateChildObj.data.tiers }
                            const idx = existingPrices.findIndex((p: any) => p.id === navigateChildObj.id)
                            const updated = idx >= 0 ? existingPrices.map((p: any, i: number) => i === idx ? entry : p) : [...existingPrices, entry]
                            workflow.updateObjectData(navigatePageObj.id, { _prices: updated, _highlightPriceId: navigateChildObj.id })
                          } else if (navigateChildObj.kind === "meter") {
                            const priceObj = workflow.objects.find((o) => o.kind === "price" && o.data.usageType === "metered")
                            if (priceObj && navigateChildObj.data.name) {
                              workflow.updateObjectData(priceObj.id, { meterId: navigateChildObj.id, meterName: navigateChildObj.data.displayName || navigateChildObj.data.name })
                            }
                          }
                          const childLabel = config.objectKinds[navigateChildObj.kind]?.label ?? navigateChildObj.kind
                          // setRationaleToast(`${childLabel} bundled with this product — it will be created when the product is submitted.`)
                          setNavigateChildId(null)
                        }}
                        className="flex h-[28px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
                      >
                        Done
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-[16px] py-[12px]">
                      <NavigateChildForm
                        data={navigateChildObj.data}
                        onChange={(data: Record<string, any>) => workflow.updateObjectData(navigateChildObj.id, data)}
                        onAddObject={(kind: string) => handleChildAddObject(kind)}
                      />
                    </div>

                    {/* iOS-style stacked sheet: grandchild (meter) on top of child (price) */}
                    <AnimatePresence>
                      {grandchildObject && GrandchildFormComponent && (
                        <>
                          <motion.div
                            key="navigate-grandchild-dim"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[15] rounded-[12px] bg-black/8"
                          />
                          <motion.div
                            key="navigate-grandchild-card"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="absolute inset-x-0 bottom-0 z-20 flex max-h-[85%] flex-col rounded-[12px] border border-[#ECF1F6] bg-white shadow-[0_-8px_32px_rgba(0,0,0,0.12)]"
                          >
                            <div className="flex items-center justify-between border-b border-[#ECF1F6] px-[16px] py-[10px]">
                              <span className="text-[13px] font-[600] leading-[18px] text-[#1A2C44]">
                                {config.objectKinds[grandchildObject.kind]?.label ?? "Details"}
                              </span>
                              <button
                                type="button"
                                onClick={handleDismissGrandchild}
                                className="flex h-[28px] items-center rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white transition-colors hover:bg-[#4730E0]"
                              >
                                Create {(config.objectKinds[grandchildObject.kind]?.label ?? "").toLowerCase()}
                              </button>
                            </div>
                            <div className="flex-1 overflow-y-auto px-[16px] py-[12px]">
                              <GrandchildFormComponent
                                data={grandchildObject.data}
                                onChange={(data: Record<string, any>) => workflow.updateObjectData(grandchildObject.id, data)}
                                onAddObject={(kind: string) => handleAddObject(kind)}
                              />
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Tool tray — collapsible section below the form fields */}
            {showTray && activeKind && (
              <ContextualToolTray label={contextualLabels[activeKind] ?? "Details"}>
                <ContextualDetailContent kind={activeKind} meterToolData={meterToolData} priceDetailBlock={priceDetailBlock} productDetailBlock={productDetailBlock} />
              </ContextualToolTray>
            )}

            {/* Popover — contextual trigger below the form */}
            {showPopover && activeKind && (
              <div className="relative mt-[16px] max-w-[360px]">
                <button
                  type="button"
                  onClick={() => setPopoverOpen(!popoverOpen)}
                  className={`flex w-full items-center justify-between rounded-[8px] px-[12px] py-[8px] text-left transition-colors ${
                    popoverOpen
                      ? "bg-[#F3F0FF]"
                      : "bg-[#F3F0FF]/60 hover:bg-[#F3F0FF]"
                  }`}
                >
                  <span className="text-[11px] font-[600] text-[#533AFD]">
                    {contextualLabels[activeKind] ?? "Details"}
                  </span>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="text-[#533AFD]">
                    <path d={popoverOpen ? "M3 7.5l3-3 3 3" : "M3 4.5l3 3 3-3"} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {popoverOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setPopoverOpen(false)} />
                    <div className="absolute bottom-[calc(100%+4px)] left-0 z-50 w-[300px] rounded-[10px] border border-[#D4DEE9] bg-white p-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
                      <div className="mb-[10px] flex items-center justify-between">
                        <span className="text-[10px] font-[600] uppercase tracking-[0.5px] text-[#533AFD]">
                          {contextualLabels[activeKind] ?? "Details"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPopoverOpen(false)}
                          className="flex h-[16px] w-[16px] items-center justify-center rounded-full text-[#9CA3B0] hover:bg-[#F5F6F8] hover:text-[#596171]"
                        >
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                        </button>
                      </div>
                      <ContextualDetailContent kind={activeKind} meterToolData={meterToolData} priceDetailBlock={priceDetailBlock} productDetailBlock={productDetailBlock} />
                    </div>
                  </>
                )}
              </div>
            )}

            {headerStyle === "inline" && buttonPlacement === "flow" && (
              <div className="-mx-[16px] -mb-[16px] mt-[16px] rounded-b-[12px] border-t border-[#ECF1F6] px-[16px] py-[12px]">
                <div className="flex items-center justify-end gap-[8px]">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-[28px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    disabled={!invoiceReady}
                    onClick={workflow.handlePrimaryAction}
                    className={invoiceReady
                      ? "flex h-[28px] items-center rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white transition-colors hover:bg-[#4730E0]"
                      : "flex h-[28px] items-center rounded-[6px] border border-[#D4DEE9] bg-[#F5F6F8] px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#9CA3B0] cursor-not-allowed"
                    }
                  >
                    {idealSubmitLabel}
                  </button>
                </div>
              </div>
            )}

            {headerStyle === "inline" && buttonPlacement === "bottom" && (
              <div className="-mx-[16px] -mb-[16px] mt-auto rounded-b-[12px] border-t border-[#ECF1F6] bg-white px-[16px] py-[12px]">
                <div className="flex items-center justify-end gap-[8px]">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-[28px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    disabled={!invoiceReady}
                    onClick={workflow.handlePrimaryAction}
                    className={invoiceReady
                      ? "flex h-[28px] items-center rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white transition-colors hover:bg-[#4730E0]"
                      : "flex h-[28px] items-center rounded-[6px] border border-[#D4DEE9] bg-[#F5F6F8] px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#9CA3B0] cursor-not-allowed"
                    }
                  >
                    {idealSubmitLabel}
                  </button>
                </div>
              </div>
            )}

          </div>
        }
        preview={previewPanel}
      />

      {navLayout === "drawer" && overlayObject && OverlayFormComponent && (
        <SlideOverDrawer
          isOpen={true}
          label={config.objectKinds[overlayObject.kind]?.label ?? overlayObject.kind}
          FormComponent={OverlayFormComponent}
          ChildFormComponent={ChildModalFormComponent}
          data={overlayObject.data}
          childData={childModalObject?.data ?? {}}
          childKind={childModalKind ?? null}
          childLabel={childModalObject ? (config.objectKinds[childModalObject.kind]?.label ?? childModalObject.kind) : ""}
          onChange={(data) => workflow.updateObjectData(overlayObject.id, data)}
          onChildChange={(data) => childModalObject && workflow.updateObjectData(childModalObject.id, data)}
          onClose={() => {
            if (primaryObject && overlayObject.data.name) {
              const kind = overlayObject.kind
              if (kind === "customer") {
                workflow.updateObjectData(primaryObject.id, {
                  customerId: overlayObject.id,
                  customerName: overlayObject.data.name,
                })
              } else if (kind === "product") {
                workflow.updateObjectData(primaryObject.id, {
                  productId: overlayObject.id,
                  productName: overlayObject.data.name,
                })
              }
            }
            setOverlayObjectId(null)
          }}
          onAddObject={handleChildAddObject}
          onDismissChild={handleDismissChild}
          unitPrice={overlayObject.data.unitPrice}
          currency={overlayObject.data.currency}
        />
      )}

      {navLayout === "modal" && overlayObject && OverlayFormComponent && (() => {
        const overlayLabel = config.objectKinds[overlayObject.kind]?.label ?? overlayObject.kind
        const meterObjects = workflow.objects.filter((o) => o.kind === "meter")
        const overlayMeters: any[] = meterObjects.map((m) => ({ name: m.data.name || "", displayName: m.data.displayName, aggregation: m.data.aggregation || "sum", valueKey: m.data.valueKey }))
        const handleOverlayClose = () => {
          if (primaryObject && overlayObject.data.name) {
            const kind = overlayObject.kind
            if (kind === "customer") {
              workflow.updateObjectData(primaryObject.id, {
                customerId: overlayObject.id,
                customerName: overlayObject.data.name,
              })
            } else if (kind === "product") {
              workflow.updateObjectData(primaryObject.id, {
                productId: overlayObject.id,
                productName: overlayObject.data.name,
              })
            }
          }
          setOverlayObjectId(null)
        }

        // Build child objects as tabs/steps for tabbed and wizard modes
        const childObjects = workflow.objects.filter(
          (o) => o.id !== overlayObject.id && o.kind !== config.initialObjectKind
        )

        // Derive _prices from sibling workflow objects for the product tab
        const siblingPrices = childObjects
          .filter((o) => o.kind === "price")
          .map((o) => ({ id: o.id, name: o.data.name || "", amount: o.data.amount || "", pricingModel: o.data.pricingModel || "standard", billingPeriod: o.data.billingPeriod || "", currency: o.data.currency || "USD", priceType: o.data.priceType || "recurring", usageType: o.data.usageType || "licensed", meterName: o.data.meterName || "", tiers: o.data.tiers }))
        const overlayDataWithChildren = overlayObject.kind === "product"
          ? { ...overlayObject.data, _prices: siblingPrices }
          : overlayObject.data

        const allTabs = [
          {
            id: overlayObject.id,
            label: overlayLabel,
            kind: overlayObject.kind,
            FormComponent: OverlayFormComponent,
            data: overlayDataWithChildren,
            onChange: (data: Record<string, any>) => workflow.updateObjectData(overlayObject.id, data),
          },
          ...childObjects.map((obj) => ({
            id: obj.id,
            label: config.objectKinds[obj.kind]?.label ?? obj.kind,
            kind: obj.kind,
            FormComponent: config.objectKinds[obj.kind]?.formComponent,
            data: obj.data,
            onChange: (data: Record<string, any>) => workflow.updateObjectData(obj.id, data),
          })).filter((t) => t.FormComponent),
        ]

        if (modalSubStyle === "tabs") {
          return (
            <TabbedCreationModal
              isOpen={true}
              label={overlayLabel}
              tabs={allTabs as any}
              onClose={handleOverlayClose}
              onAddObject={handleChildAddObject}
              meters={overlayMeters}
              unitPrice={overlayObject.data.unitPrice}
              currency={overlayObject.data.currency}
              focusTabId={childModalObjectId}
            />
          )
        }

        if (modalSubStyle === "portal") {
          return (
            <PortalTransition
              isOpen={true}
              parentLabel={overlayLabel}
              childLabel={childModalObject ? (config.objectKinds[childModalObject.kind]?.label ?? childModalObject.kind) : ""}
              ParentFormComponent={OverlayFormComponent}
              ChildFormComponent={ChildModalFormComponent}
              parentData={overlayObject.data}
              childData={childModalObject?.data ?? {}}
              childKind={childModalKind ?? null}
              onParentChange={(data) => workflow.updateObjectData(overlayObject.id, data)}
              onChildChange={(data) => childModalObject && workflow.updateObjectData(childModalObject.id, data)}
              onClose={handleOverlayClose}
              onAddObject={handleChildAddObject}
              onDismissChild={handleDismissChild}
              unitPrice={overlayObject.data.unitPrice}
              currency={overlayObject.data.currency}
              grandchildFormComponent={GrandchildFormComponent}
              grandchildData={grandchildObject?.data ?? {}}
              grandchildKind={grandchildKind ?? null}
              grandchildLabel={grandchildObject ? (config.objectKinds[grandchildObject.kind]?.label ?? grandchildObject.kind) : ""}
              onGrandchildChange={(data) => grandchildObject && workflow.updateObjectData(grandchildObject.id, data)}
              onDismissGrandchild={handleDismissGrandchild}
            />
          )
        }

        if (modalSubStyle === "paneShift") {
          return (
            <PaneShiftTransition
              isOpen={true}
              parentLabel={overlayLabel}
              childLabel={childModalObject ? (config.objectKinds[childModalObject.kind]?.label ?? childModalObject.kind) : ""}
              ParentFormComponent={OverlayFormComponent}
              ChildFormComponent={ChildModalFormComponent}
              parentData={overlayObject.data}
              childData={childModalObject?.data ?? {}}
              childKind={childModalKind ?? null}
              onParentChange={(data) => workflow.updateObjectData(overlayObject.id, data)}
              onChildChange={(data) => childModalObject && workflow.updateObjectData(childModalObject.id, data)}
              onClose={handleOverlayClose}
              onAddObject={handleChildAddObject}
              onDismissChild={handleDismissChild}
              unitPrice={overlayObject.data.unitPrice}
              currency={overlayObject.data.currency}
            />
          )
        }

        // Default fallback: use Portal (replaces old "stacked" mode)
        return (
          <PortalTransition
            isOpen={true}
            parentLabel={overlayLabel}
            childLabel={childModalObject ? (config.objectKinds[childModalObject.kind]?.label ?? childModalObject.kind) : ""}
            ParentFormComponent={OverlayFormComponent}
            ChildFormComponent={ChildModalFormComponent}
            parentData={overlayObject.data}
            childData={childModalObject?.data ?? {}}
            childKind={childModalKind ?? null}
            onParentChange={(data) => workflow.updateObjectData(overlayObject.id, data)}
            onChildChange={(data) => childModalObject && workflow.updateObjectData(childModalObject.id, data)}
            onClose={handleOverlayClose}
            onAddObject={handleChildAddObject}
            onDismissChild={handleDismissChild}
            unitPrice={overlayObject.data.unitPrice}
            currency={overlayObject.data.currency}
            grandchildFormComponent={GrandchildFormComponent}
            grandchildData={grandchildObject?.data ?? {}}
            grandchildKind={grandchildKind ?? null}
            grandchildLabel={grandchildObject ? (config.objectKinds[grandchildObject.kind]?.label ?? grandchildObject.kind) : ""}
            onGrandchildChange={(data) => grandchildObject && workflow.updateObjectData(grandchildObject.id, data)}
            onDismissGrandchild={handleDismissGrandchild}
          />
        )
      })()}

      {/* Ideal mode: customer/coupon as independent modal */}
      {navLayout === "ideal" && overlayObject && OverlayFormComponent && (overlayObject.kind === "customer" || overlayObject.kind === "coupon") && (
        <CreationModal
          isOpen={true}
          label={config.objectKinds[overlayObject.kind]?.label ?? overlayObject.kind}
          FormComponent={OverlayFormComponent}
          data={overlayObject.data}
          onChange={(data: Record<string, any>) => workflow.updateObjectData(overlayObject.id, data)}
          onClose={() => {
            if (primaryObject && overlayObject.data.name) {
              if (overlayObject.kind === "customer") {
                workflow.updateObjectData(primaryObject.id, {
                  customerId: overlayObject.id,
                  customerName: overlayObject.data.name,
                })
              }
            }
            setOverlayObjectId(null)
          }}
        />
      )}

      {/* Intent mode: permanent entities open in modals */}
      {navLayout === "intent" && overlayObject && OverlayFormComponent && (
        <CreationModal
          isOpen={true}
          label={config.objectKinds[overlayObject.kind]?.label ?? overlayObject.kind}
          FormComponent={OverlayFormComponent}
          data={overlayObject.kind === "product" ? {
            ...overlayObject.data,
            _prices: workflow.objects.filter((o) => o.kind === "price").map((o) => ({
              id: o.id, name: o.data.name || "", amount: o.data.amount || "",
              pricingModel: o.data.pricingModel || "standard", billingPeriod: o.data.billingPeriod || "",
              currency: o.data.currency || "USD", priceType: o.data.priceType || "recurring",
              usageType: o.data.usageType || "licensed", meterName: o.data.meterName || "", tiers: o.data.tiers,
            })),
          } : overlayObject.data}
          onChange={(data: Record<string, any>) => {
            if (overlayObject.kind === "product" && data._prices !== undefined) {
              const updatedIds = new Set((data._prices as any[]).map((p: any) => p.id))
              const removed = workflow.objects.filter((o) => o.kind === "price" && !updatedIds.has(o.id))
              for (const r of removed) workflow.removeObject(r.id)
              return
            }
            workflow.updateObjectData(overlayObject.id, data)
          }}
          onClose={() => {
            if (primaryObject && overlayObject.data.name) {
              if (overlayObject.kind === "customer") {
                workflow.updateObjectData(primaryObject.id, { customerId: overlayObject.id, customerName: overlayObject.data.name })
              } else if (overlayObject.kind === "product") {
                workflow.updateObjectData(primaryObject.id, { productId: overlayObject.id, productName: overlayObject.data.name })
              }
            }
            setOverlayObjectId(null)
            setChildModalObjectId(null)
          }}
          onAddObject={(kind: string) => handleAddObject(kind)}
        >
          {/* Non-permanent child: inline section within the modal */}
          {childModalObject && ChildModalFormComponent && (
            <div className="mt-[16px] border-t border-[#ECF1F6] pt-[16px]">
              <div className="mb-[12px] flex items-center justify-between">
                <span className="text-[13px] font-[600] leading-[18px] text-[#1A2C44]">
                  {config.objectKinds[childModalKind!]?.label ?? "Details"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (childModalObject.kind === "price" && overlayObject) {
                      const existingPrices: any[] = overlayObject.data._prices ?? []
                      const entry = { id: childModalObject.id, name: childModalObject.data.name || "", amount: childModalObject.data.amount || "", pricingModel: childModalObject.data.pricingModel || "standard", billingPeriod: childModalObject.data.billingPeriod || "monthly", currency: childModalObject.data.currency || "USD", priceType: childModalObject.data.priceType || "recurring", usageType: childModalObject.data.usageType || "licensed", meterName: childModalObject.data.meterName || "", tiers: childModalObject.data.tiers }
                      const idx = existingPrices.findIndex((p: any) => p.id === childModalObject.id)
                      const updated = idx >= 0 ? existingPrices.map((p: any, i: number) => i === idx ? entry : p) : [...existingPrices, entry]
                      workflow.updateObjectData(overlayObject.id, { _prices: updated })
                    } else if (childModalObject.kind === "meter") {
                      const priceObj = workflow.objects.find((o) => o.kind === "price" && o.data.usageType === "metered")
                      if (priceObj && childModalObject.data.name) {
                        workflow.updateObjectData(priceObj.id, { meterId: childModalObject.id, meterName: childModalObject.data.displayName || childModalObject.data.name })
                      }
                    }
                    setChildModalObjectId(null)
                  }}
                  className="flex h-[26px] items-center rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[10px] text-[11px] font-[600] text-white transition-colors hover:bg-[#4730E0]"
                >
                  Done
                </button>
              </div>
              <ChildModalFormComponent
                data={childModalObject.data}
                onChange={(data: Record<string, any>) => workflow.updateObjectData(childModalObject.id, data)}
                onAddObject={(kind: string) => handleAddObject(kind)}
              />
            </div>
          )}
        </CreationModal>
      )}

      {/* Compose mode: navigation push within a fixed modal (iOS UINavigationController pattern) */}
      {navLayout === "compose" && overlayObject && OverlayFormComponent && (() => {
        const overlayLabel = config.objectKinds[overlayObject.kind]?.label ?? overlayObject.kind
        const childLabel = childModalObject ? (config.objectKinds[childModalObject.kind]?.label ?? childModalObject.kind) : ""
        const gcLabel = grandchildObject ? (config.objectKinds[grandchildObject.kind]?.label ?? grandchildObject.kind) : ""

        const panelDepth = childModalObject && ChildModalFormComponent ? 1 : 0
        const hasGrandchild = grandchildObject && GrandchildFormComponent

        const siblingPrices = workflow.objects
          .filter((o) => o.kind === "price" && o.id !== childModalObjectId)
          .map((o) => ({ id: o.id, name: o.data.name || "", amount: o.data.amount || "", pricingModel: o.data.pricingModel || "standard", billingPeriod: o.data.billingPeriod || "", currency: o.data.currency || "USD", priceType: o.data.priceType || "recurring", usageType: o.data.usageType || "licensed", meterName: o.data.meterName || "", tiers: o.data.tiers }))
        const composeOverlayData = overlayObject.kind === "product"
          ? { ...overlayObject.data, _prices: siblingPrices }
          : overlayObject.data

        const handleComposeDismiss = (focusItemsAfterCustomerSave = false) => {
          if (primaryObject && overlayObject.data.name) {
            if (overlayObject.kind === "customer") {
              workflow.updateObjectData(primaryObject.id, {
                customerId: overlayObject.id,
                customerName: overlayObject.data.name,
                ...(focusItemsAfterCustomerSave ? { _focusItemsAfterCustomerSave: true } : {}),
              })
            } else if (overlayObject.kind === "product") {
              const productName = overlayObject.data.name || "New product"
              if (primaryObject.kind === "subscription") {
                const formatPeriod = (period: string | undefined) => {
                  if (period === "yearly") return "yr"
                  if (period === "weekly") return "wk"
                  if (period === "daily") return "day"
                  return "mo"
                }
                const formatPrice = (amount: unknown, period: unknown) => {
                  const normalizedAmount = typeof amount === "string" ? amount.trim() : ""
                  if (!normalizedAmount) return "$0.00/mo"
                  return `$${normalizedAmount}/${formatPeriod(typeof period === "string" ? period : undefined)}`
                }
                const priceOptions = Array.isArray(overlayObject.data._prices)
                  ? overlayObject.data._prices
                      .map((priceOption: Record<string, any>) => {
                        const label = formatPrice(priceOption.amount, priceOption.billingPeriod)
                        return { value: label, label }
                      })
                      .filter((priceOption: { value: string; label: string }) => !!priceOption.value)
                  : []
                const price = priceOptions[0]?.value ?? formatPrice(
                  overlayObject.data._inlineAmount,
                  overlayObject.data._inlineBillingPeriod
                )
                const sourceItemId = overlayObject.data._subscriptionItemId as string | null | undefined
                const items = (primaryObject.data.items ?? []) as Record<string, any>[]
                const newItem = {
                  id: `item_${Date.now()}`,
                  productId: overlayObject.id,
                  productName,
                  price,
                  ...(priceOptions.length > 1 ? { priceOptions } : {}),
                  quantity: "1",
                  couponsEnabled: false,
                  taxEnabled: false,
                  confirmed: false,
                }
                const nextItems = typeof sourceItemId === "string"
                  ? items.map((item) =>
                      item.id === sourceItemId
                        ? {
                            ...item,
                            productId: overlayObject.id,
                            productName,
                            price,
                            ...(priceOptions.length > 1 ? { priceOptions } : { priceOptions: undefined }),
                          }
                        : item
                    )
                  : [...items, newItem]
                workflow.updateObjectData(primaryObject.id, {
                  productId: overlayObject.id,
                  productName,
                  items: nextItems,
                })
              } else {
                workflow.updateObjectData(primaryObject.id, { productId: overlayObject.id, productName })
              }
            }
          }
          const label = config.objectKinds[overlayObject.kind]?.label ?? overlayObject.kind
          // setRationaleToast(`${label} created independently — it persists in your system regardless of this flow's outcome.`)
          setOverlayObjectId(null)
          setChildModalObjectId(null)
          setGrandchildObjectId(null)
        }

        const handleComposeBack = () => {
          if (childModalObject) {
            if (childModalObject.kind === "price" && overlayObject) {
              const existingPrices: any[] = overlayObject.data._prices ?? []
              const entry = { id: childModalObject.id, name: childModalObject.data.name || "", amount: childModalObject.data.amount || "", pricingModel: childModalObject.data.pricingModel || "standard", billingPeriod: childModalObject.data.billingPeriod || "monthly", currency: childModalObject.data.currency || "USD", priceType: childModalObject.data.priceType || "recurring", usageType: childModalObject.data.usageType || "licensed", meterName: childModalObject.data.meterName || "", tiers: childModalObject.data.tiers }
              const idx = existingPrices.findIndex((p: any) => p.id === childModalObject.id)
              const updated = idx >= 0 ? existingPrices.map((p: any, i: number) => i === idx ? entry : p) : [...existingPrices, entry]
              workflow.updateObjectData(overlayObject.id, { _prices: updated, _highlightPriceId: childModalObject.id })
            } else if (childModalObject.kind === "meter") {
              const priceObj = workflow.objects.find((o) => o.kind === "price" && o.data.usageType === "metered")
              if (priceObj && childModalObject.data.name) {
                workflow.updateObjectData(priceObj.id, { meterId: childModalObject.id, meterName: childModalObject.data.displayName || childModalObject.data.name })
              }
            }
          }
          setChildModalObjectId(null)
        }

        const currentTitle = panelDepth === 1 ? childLabel : `New ${overlayLabel.toLowerCase()}`
        const currentPrimaryLabel = panelDepth === 1
          ? "Done"
          : `Create ${overlayLabel.toLowerCase()}`
        const currentPrimaryAction = panelDepth === 1
          ? handleComposeBack
          : () => handleComposeDismiss(true)
        const shouldHugComposeModal = overlayObject.kind === "customer" && panelDepth === 0

        return (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: isFullProductEditorOpen ? 0 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleComposeDismiss()}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-[24px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: isFullProductEditorOpen ? 0 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={
                isFullProductEditorOpen
                  ? { transform: "scale(1.1)", opacity: 0, pointerEvents: "none", transition: "transform 350ms cubic-bezier(0.32, 0.72, 0, 1), opacity 200ms ease" }
                  : hasGrandchild
                    ? { transform: "scale(0.94) translateY(-20px)", filter: "brightness(0.92)", pointerEvents: "none", transition: "transform 250ms ease, filter 250ms ease" }
                    : { transition: "transform 250ms ease, filter 250ms ease" }
              }
            >
              <div
                className={`${shouldHugComposeModal ? "flex max-h-[calc(100vh-48px)] max-w-full flex-col overflow-hidden" : "flex min-h-[520px] max-h-[80vh] max-w-full flex-col overflow-hidden"} rounded-[12px] border border-[#EBEEF1] bg-white shadow-[0px_20px_60px_rgba(0,0,0,0.12),0px_4px_16px_rgba(0,0,0,0.08)]`}
                style={{ width: 480 }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center border-b border-[#ECF1F6] px-[20px] py-[14px]">
                  <div className="flex items-center">
                    <div
                      className="overflow-hidden"
                      style={{
                        width: panelDepth > 0 ? 32 : 0,
                        opacity: panelDepth > 0 ? 1 : 0,
                        transition: "width 250ms cubic-bezier(0.32, 0.72, 0, 1), opacity 150ms ease",
                      }}
                    >
                      <button
                        type="button"
                        className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[4px] text-[#596171] hover:bg-[#F5F6F8]"
                        onClick={handleComposeBack}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M7.5 1.5L3 6l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
                      {currentTitle}
                    </p>
                  </div>
                </div>

                {/* Content — horizontal navigation push (product ↔ price only) */}
                {shouldHugComposeModal ? (
                  <div className="min-h-0 overflow-y-auto px-[20px] py-[16px]">
                    <OverlayFormComponent
                      data={composeOverlayData}
                      onChange={(data: Record<string, any>) => {
                        workflow.updateObjectData(overlayObject.id, data)
                      }}
                      onAddObject={(kind: string, existingId?: string, initialData?: Record<string, any>) => handleAddObject(kind, existingId, initialData)}
                    />
                  </div>
                ) : (
                  <div className="relative min-h-[300px] flex-1 overflow-hidden">
                    <div
                      className="absolute inset-0 flex"
                      style={{
                        width: "200%",
                        transform: `translateX(-${panelDepth * 50}%)`,
                        transition: "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
                      }}
                    >
                      {/* Pane 0: parent form (product/customer) */}
                      <div className="h-full w-1/2 overflow-y-auto px-[20px] py-[16px]">
                        <OverlayFormComponent
                          data={composeOverlayData}
                          onChange={(data: Record<string, any>) => {
                            if (overlayObject.kind === "product" && data._prices !== undefined) {
                              const updatedIds = new Set((data._prices as any[]).map((p: any) => p.id))
                              const removed = workflow.objects.filter((o) => o.kind === "price" && !updatedIds.has(o.id))
                              for (const r of removed) workflow.removeObject(r.id)
                              return
                            }
                            workflow.updateObjectData(overlayObject.id, data)
                          }}
                          onAddObject={(kind: string, existingId?: string, initialData?: Record<string, any>) => handleAddObject(kind, existingId, initialData)}
                        />
                      </div>

                      {/* Pane 1: child form (price) */}
                      <div className="h-full w-1/2 overflow-y-auto px-[20px] py-[16px]">
                        {childModalObject && ChildModalFormComponent && (
                          <ChildModalFormComponent
                            data={childModalObject.data}
                            onChange={(data: Record<string, any>) => workflow.updateObjectData(childModalObject.id, data)}
                            onAddObject={(kind: string) => handleChildAddObject(kind)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-end gap-[8px] border-t border-[#ECF1F6] px-[20px] py-[12px]">
                  {panelDepth === 0 && (
                    <button
                      type="button"
                      className="flex h-[28px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
                      onClick={() => handleComposeDismiss()}
                    >
                      Discard
                    </button>
                  )}
                  <button
                    type="button"
                    className={panelDepth === 0
                      ? "flex h-[28px] items-center rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white hover:bg-[#4730E0]"
                      : "flex h-[28px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] hover:bg-[#F5F6F8]"
                    }
                    onClick={currentPrimaryAction}
                  >
                    {currentPrimaryLabel}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Grandchild modal (Meter) — separate stacked modal on top */}
            {hasGrandchild && (
              <CreationModalShell
                isOpen={true}
                onClose={handleDismissGrandchild}
                title={gcLabel}
                primaryLabel={`Create ${gcLabel.toLowerCase()}`}
                onPrimary={handleDismissGrandchild}
              >
                <div className="flex-1 overflow-y-auto px-[20px] py-[16px]">
                  <GrandchildFormComponent
                    data={grandchildObject!.data}
                    onChange={(data: Record<string, any>) => workflow.updateObjectData(grandchildObject!.id, data)}
                    onAddObject={(kind: string) => handleAddObject(kind)}
                  />
                </div>
              </CreationModalShell>
            )}
          </>
        )
      })()}


      {/* Contract plan editor overlay */}
      <AnimatePresence>
        {isPlanEditorOpen && primaryObject && (
          <motion.div
            key="plan-editor"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 z-[60]"
          >
            <ContractPlanEditorOverlay
              isOpen={isPlanEditorOpen}
              onClose={() => setIsPlanEditorOpen(false)}
              onSave={(branchName) => {
                workflow.updateObjectData(primaryObject.id, {
                  planBranchName: branchName,
                  planBranchSaved: "true",
                })
              }}
              planId={(primaryObject.data.parentPlanId as string) || "plan_2"}
              planName={(primaryObject.data.parentPlanName as string) || "Plan"}
              contractName={(primaryObject.data.name as string) || "Contract"}
              existingBranchName={primaryObject.data.planBranchName as string | undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full product editor — triggered by "More pricing options" from invoices */}
      <FullProductEditor
        isOpen={isFullProductEditorOpen}
        onClose={() => {
          setIsFullProductEditorOpen(false)
          setOverlayObjectId(null)
          setChildModalObjectId(null)
          setGrandchildObjectId(null)
        }}
        onCreate={(prodData) => {
          if (primaryObject) {
            const name = prodData.name || "New product"
            workflow.updateObjectData(primaryObject.id, { productId: `prod_${Date.now()}`, productName: name, _highlightItems: true })
            setTimeout(() => {
              workflow.updateObjectData(primaryObject.id, { _highlightItems: false })
            }, 2000)
          }
          setIsFullProductEditorOpen(false)
          setOverlayObjectId(null)
          setChildModalObjectId(null)
          setGrandchildObjectId(null)
        }}
        onPortalBack={() => setIsFullProductEditorOpen(false)}
        portalOrigin={flow === "invoices" || flow === "subscriptions" ? "Invoice" : undefined}
        presentation={typeof window !== "undefined" && localStorage.getItem("fullEditorPresentation") === "80-modal" ? "80-modal" : undefined}
      />

      <UxRationaleToast message={newTabToast} onDismiss={() => setNewTabToast(null)} />
    </>
  )
}
