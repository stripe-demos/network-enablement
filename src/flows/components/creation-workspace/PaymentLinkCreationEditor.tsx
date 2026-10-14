'use client'

import { useDeferredValue, useEffect, useMemo, useState } from "react"

import { CreationWorkspace, type WorkspacePresentation } from "@/components/creation-workspace/CreationWorkspace"
import { SimpleCreationHeader } from "@/components/creation-workspace/SimpleCreationHeader"
import { ValidationPanel } from "@/components/creation-workspace/ValidationPanel"
import { CreationModalShell } from "@/components/creation-workspace/CreationModalShell"
import { FullProductEditor } from "@/components/creation-workspace/FullProductEditor"
import { useWorkflowState } from "@/components/creation-workspace/useWorkflowState"
import { createPaymentLinkWorkflowConfig, getPrimaryLabel } from "@/components/creation-workspace/workflowConfig"
import { useNavHugContent } from "@/components/creation-workspace/navHugContent"
import { useNavStyle } from "@/components/creation-workspace/navStyle"
import { useFilterPlacement } from "@/components/creation-workspace/filterPlacement"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { PaymentLinkForm } from "@/components/creation-workspace/forms/PaymentLinkForm"
import { ProductForm } from "@/components/creation-workspace/forms/ProductForm"
import { PriceForm } from "@/components/creation-workspace/forms/PriceForm"
import { PaymentLinkPreview } from "@/components/creation-workspace/PaymentLinkPreview"
import { ConfirmationPagePreview } from "@/components/creation-workspace/ConfirmationPagePreview"
import { PostPaymentInvoicePreview } from "@/components/creation-workspace/PostPaymentInvoicePreview"
import { ProductPreviewPanel } from "@/components/creation-workspace/ProductPreviewPanel"
import { PricePreviewPanel } from "@/components/creation-workspace/PricePreviewPanel"

type PaymentLinkCreationEditorProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (objects: { kind: string; data: Record<string, any> }[]) => void
  presentation?: WorkspacePresentation
  embedded?: boolean
}

const paymentLinkForms = {
  paymentLink: PaymentLinkForm,
  product: ProductForm,
  price: PriceForm,
  paymentLinkPreview: PaymentLinkPreview,
  productPreview: ProductPreviewPanel,
  pricePreview: PricePreviewPanel,
}

type TreePage = "link" | "payment" | "after"

function LinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M8.78007 4.56824C9.56661 3.7817 9.56661 2.50647 8.78007 1.71993C7.99353 0.933393 6.7183 0.933393 5.93176 1.71993L5.07203 2.57967C4.85137 2.80032 4.49363 2.80032 4.27298 2.57967C4.05232 2.35901 4.05232 2.00127 4.27298 1.78062L5.13271 0.920881C6.36055 -0.30696 8.35128 -0.30696 9.57912 0.920882C10.807 2.14872 10.807 4.13945 9.57912 5.36729L8.71938 6.22702C8.49873 6.44768 8.14099 6.44768 7.92033 6.22702C7.69968 6.00637 7.69968 5.64863 7.92033 5.42797L8.78007 4.56824Z" fill="#3C4F69"/>
      <path d="M3.19438 7.3193C2.97373 7.09865 2.97373 6.7409 3.19438 6.52025L6.52032 3.19431C6.74097 2.97366 7.09872 2.97366 7.31937 3.19431C7.54002 3.41496 7.54002 3.77271 7.31937 3.99336L3.99343 7.3193C3.77278 7.53995 3.41503 7.53995 3.19438 7.3193Z" fill="#3C4F69"/>
      <path d="M1.71993 8.78C0.933393 7.99346 0.933393 6.71823 1.71993 5.93169L2.57967 5.07196C2.80032 4.85131 2.80032 4.49356 2.57967 4.27291C2.35901 4.05226 2.00127 4.05226 1.78062 4.27291L0.920881 5.13264C-0.306961 6.36049 -0.30696 8.35121 0.920881 9.57905C2.14872 10.8069 4.13945 10.8069 5.36729 9.57905L6.22702 8.71932C6.44768 8.49867 6.44768 8.14092 6.22702 7.92027C6.00637 7.69962 5.64863 7.69962 5.42797 7.92027L4.56824 8.78C3.7817 9.56654 2.50647 9.56654 1.71993 8.78Z" fill="#3C4F69"/>
    </svg>
  )
}

function PaymentPageIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="9" viewBox="0 0 12 9" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M3 1.125V6H10.5V1.125H3ZM1.875 0.9375C1.875 0.419733 2.29473 0 2.8125 0H10.6875C11.2053 0 11.625 0.419733 11.625 0.9375V6.1875C11.625 6.70527 11.2053 7.125 10.6875 7.125H2.8125C2.29473 7.125 1.875 6.70527 1.875 6.1875V0.9375Z" fill="#3C4F69"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M0.5625 1.875C0.87316 1.875 1.125 2.12684 1.125 2.4375V7.3125C1.125 7.62316 1.37684 7.875 1.6875 7.875H9.1875C9.49816 7.875 9.75 8.12684 9.75 8.4375C9.75 8.74816 9.49816 9 9.1875 9H1.6875C0.75552 9 0 8.24448 0 7.3125V2.4375C0 2.12684 0.25184 1.875 0.5625 1.875Z" fill="#3C4F69"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M6.1875 3.1875V3.9375C6.1875 4.24816 6.43934 4.5 6.75 4.5C7.06066 4.5 7.3125 4.24816 7.3125 3.9375V3.1875C7.3125 2.87684 7.06066 2.625 6.75 2.625C6.43934 2.625 6.1875 2.87684 6.1875 3.1875ZM5.25 3.1875V3.9375C5.25 4.76593 5.92157 5.4375 6.75 5.4375C7.57843 5.4375 8.25 4.76593 8.25 3.9375V3.1875C8.25 2.35907 7.57843 1.6875 6.75 1.6875C5.92157 1.6875 5.25 2.35907 5.25 3.1875Z" fill="#3C4F69"/>
    </svg>
  )
}

function AfterPaymentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="12" viewBox="0 0 10 12" fill="none">
      <path d="M2.50024 3.7C2.50024 3.3134 2.81364 3 3.20024 3H5.30005C5.68665 3 6.00005 3.3134 6.00005 3.7C6.00005 4.0866 5.68665 4.4 5.30005 4.4H3.20024C2.81364 4.4 2.50024 4.0866 2.50024 3.7Z" fill="#3C4F69"/>
      <path d="M3.2 6C2.8134 6 2.5 6.3134 2.5 6.7C2.5 7.0866 2.8134 7.4 3.2 7.4H6.79995C7.18655 7.4 7.49995 7.0866 7.49995 6.7C7.49995 6.3134 7.18655 6 6.79995 6H3.2Z" fill="#3C4F69"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M5.80352 11.4345C5.92932 11.4764 6.06663 11.4667 6.18524 11.4074L7.94721 10.5264C7.98193 10.509 8.02021 10.5 8.05902 10.5H9C9.55229 10.5 10 10.0523 10 9.5V2C10 0.89543 9.10457 0 8 0H2C0.89543 0 0 0.895431 0 2V11C0 11.5523 0.447715 12 1 12H2.38197C2.45959 12 2.53615 11.9819 2.60557 11.9472L4.40738 11.0463C4.46668 11.0167 4.53534 11.0118 4.59824 11.0327L5.80352 11.4345ZM3.78129 9.79411C4.17268 9.59842 4.6258 9.5662 5.04096 9.70459L5.89258 9.98846L7.32111 9.27419C7.55023 9.15964 7.80287 9.1 8.05902 9.1H8.6V2C8.6 1.66863 8.33137 1.4 8 1.4H2C1.66863 1.4 1.4 1.66863 1.4 2V10.6H2.1695L3.78129 9.79411Z" fill="#3C4F69"/>
    </svg>
  )
}

function PaymentLinkTreeNav({
  activePage,
  onSelectPage,
  formFilter,
  onFilterChange,
  showFilter,
  isFiltering,
}: {
  activePage: TreePage
  onSelectPage: (page: TreePage) => void
  formFilter?: string
  onFilterChange?: (value: string) => void
  showFilter?: boolean
  isFiltering?: boolean
}) {
  const { navHugContent } = useNavHugContent()
  const { productFormStyle } = useProductFormStyle()
  const isRefreshNav = productFormStyle === "refresh"
  const rowBase = isRefreshNav
    ? "flex items-center gap-[8px] rounded-[6px] pl-[8px] pr-[12px] py-[5px] text-left text-[13px] font-[575] leading-[20px] tracking-[-0.065px] text-[#142234] transition-colors cursor-pointer whitespace-nowrap"
    : "flex items-center gap-[8px] rounded-[6px] pl-[8px] pr-[12px] py-[4px] text-left text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#1A2C44] transition-colors cursor-pointer whitespace-nowrap"
  const childRow = isRefreshNav
    ? "flex items-center gap-[8px] rounded-[6px] pl-[26px] pr-[12px] py-[5px] text-left text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#142234] transition-colors cursor-pointer whitespace-nowrap"
    : "flex items-center gap-[8px] rounded-[6px] pl-[26px] pr-[12px] py-[4px] text-left text-[12px] font-[400] leading-[16px] tracking-[-0.024px] text-[#1A2C44] transition-colors cursor-pointer whitespace-nowrap"
  const activeBg = isRefreshNav ? "bg-[#F1F6FB]" : "bg-[#F7F5FD]"
  const hoverBg = isRefreshNav ? "hover:bg-[#F1F6FB]" : "hover:bg-[#F4F7FA]"

  return (
    <div className={`flex h-full flex-col px-[8px] pt-[8px] pb-[8px] ${navHugContent ? "w-fit" : "w-[180px]"}`}>
      {showFilter && (
        <div className="relative mb-[6px]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            className="pointer-events-none absolute left-[8px] top-1/2 -translate-y-1/2"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M4.25 1C2.45507 1 1 2.45507 1 4.25C1 6.04493 2.45507 7.5 4.25 7.5C5.04908 7.5 5.78153 7.2188 6.35848 6.7471L8.30569 8.69431C8.41306 8.80168 8.58694 8.80168 8.69431 8.69431C8.80168 8.58694 8.80168 8.41306 8.69431 8.30569L6.7471 6.35848C7.2188 5.78153 7.5 5.04908 7.5 4.25C7.5 2.45507 6.04493 1 4.25 1ZM1.55 4.25C1.55 2.75883 2.75883 1.55 4.25 1.55C5.74117 1.55 6.95 2.75883 6.95 4.25C6.95 5.74117 5.74117 6.95 4.25 6.95C2.75883 6.95 1.55 5.74117 1.55 4.25Z"
              fill="#6C7688"
            />
          </svg>
          <input
            value={formFilter ?? ""}
            onChange={(e) => onFilterChange?.(e.target.value)}
            placeholder="Filter..."
            className="h-[26px] w-full rounded-[6px] border border-[#D8DEE4] bg-white pl-[24px] pr-[24px] text-[11px] font-[500] leading-[14px] tracking-[-0.024px] text-[#1A2C44] placeholder:text-[#6C7688] outline-none transition-all hover:border-[#B6C0CD] focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7]"
          />
          {formFilter && (
            <button
              type="button"
              onClick={() => onFilterChange?.("")}
              className="absolute right-[6px] top-1/2 -translate-y-1/2 flex h-[12px] w-[12px] items-center justify-center rounded-full text-[#6C7688] transition-colors hover:bg-[#ECF1F6] hover:text-[#3C4F69]"
            >
              <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-[2px] pt-[4px]">
        {/* Parent: Payment link */}
        <button
          type="button"
          className={`${rowBase} ${activePage === "link" && !isFiltering ? activeBg : hoverBg}`}
          onClick={() => onSelectPage("link")}
        >
          <span className="flex items-center gap-[6px]">
            <span className="flex h-[12px] w-[12px] shrink-0 items-center justify-center">
              <LinkIcon />
            </span>
            <span>Payment link</span>
          </span>
        </button>

        {/* Children */}
        <button
          type="button"
          className={`${childRow} ${(activePage === "payment" || isFiltering) ? activeBg : hoverBg}`}
          onClick={() => onSelectPage("payment")}
        >
          <span className="flex items-center gap-[6px]">
            <span className="flex h-[12px] w-[12px] shrink-0 items-center justify-center">
              <PaymentPageIcon />
            </span>
            <span>Payment page</span>
          </span>
        </button>

        <button
          type="button"
          className={`${childRow} ${(activePage === "after" || isFiltering) ? activeBg : hoverBg}`}
          onClick={() => onSelectPage("after")}
        >
          <span className="flex items-center gap-[6px]">
            <span className="flex h-[12px] w-[12px] shrink-0 items-center justify-center">
              <AfterPaymentIcon />
            </span>
            <span>After payment</span>
          </span>
        </button>
      </div>
    </div>
  )
}

export function PaymentLinkCreationEditor({
  isOpen,
  onClose,
  onSubmit,
  presentation = "fullscreen",
  embedded = false,
}: PaymentLinkCreationEditorProps) {
  const config = useMemo(() => createPaymentLinkWorkflowConfig(paymentLinkForms), [])
  const workflow = useWorkflowState(config)
  const { navStyle } = useNavStyle()
  const { filterPlacement } = useFilterPlacement()
  const { productFormStyle } = useProductFormStyle()
  const isRefresh = productFormStyle === "refresh"
  const [activePage, setActivePage] = useState<TreePage>("link")
  const [formFilter, setFormFilter] = useState("")
  const deferredFormFilter = useDeferredValue(formFilter)
  const isFiltering = filterPlacement !== "hidden" && deferredFormFilter.length > 0
  useEffect(() => {
    if (navStyle === "tabs" && activePage === "link") {
      setActivePage("payment")
    }
  }, [navStyle]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectPage = (page: TreePage) => {
    setActivePage(page)
    setFormFilter("")
  }
  const [showProductModal, setShowProductModal] = useState(false)
  const [showPriceEditorModal, setShowPriceEditorModal] = useState(false)
  const [productModalData, setProductModalData] = useState<Record<string, any>>({})
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop")
  const [afterPreviewMode, setAfterPreviewMode] = useState<"confirmation" | "invoice">("confirmation")

  const paymentLinkObject = workflow.objects.find((o) => o.kind === "paymentLink") ?? workflow.activeObject
  const activeKind = workflow.activeObject?.kind
  const FormComponent = activeKind ? config.objectKinds[activeKind]?.formComponent : null

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

  const handleSubmit = () => {
    workflow.handlePrimaryAction()
    if (workflow.validationErrors.length === 0) {
      onSubmit?.(workflow.objects.map((o) => ({ kind: o.kind, data: o.data })))
      onClose()
    }
  }

  const handleAddObject = (kind: string, existingId?: string, initialData?: Record<string, any>) => {
    if (kind === "_fullEditor") {
      setShowPriceEditorModal(true)
      return
    }
    if (existingId) {
      workflow.setActiveObject(existingId)
      return
    }
    if (kind === "product") {
      setProductModalData({})
      setShowProductModal(true)
      return
    }
    const id = workflow.addObject(kind)
    if (initialData) workflow.updateObjectData(id, initialData)
  }

  const handleCreateProduct = () => {
    const id = workflow.addObject("product")
    workflow.updateObjectData(id, productModalData)
    setShowProductModal(false)
    setProductModalData({})
  }

  const previewPanel = (
    <div className="relative flex h-full w-full items-center justify-center">
      {hasErrors && (
        <ValidationPanel
          errors={workflow.validationErrors}
          config={config}
          onNavigateToError={(objectId) => workflow.setActiveObject(objectId)}
          onDismiss={workflow.clearValidationErrors}
        />
      )}
      {/* Top-right controls: device toggle + page switcher — pinned to the preview area's top-right */}
      <div className="absolute right-0 top-0 z-10 flex items-center gap-[8px]">
        {/* Device toggle — hidden when invoice preview is active */}
        {!(activePage === "after" && afterPreviewMode === "invoice") && <div className="flex h-[28px] items-center gap-[2px] rounded-[6px] bg-[#ECF1F6] p-[2px]">
          <button
            type="button"
            onClick={() => setPreviewDevice("desktop")}
            className={`flex h-full items-center justify-center rounded-[5px] px-[8px] transition-colors ${
              previewDevice === "desktop"
                ? "bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                : "hover:text-[#353A44]"
            }`}
            aria-label="Desktop preview"
            aria-pressed={previewDevice === "desktop"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="11" viewBox="0 0 12 11" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M2.25 0C1.00736 0 0 1.00736 0 2.25V6C0 7.24264 1.00736 8.25 2.25 8.25H5.0625V9.375H3.5625C3.25184 9.375 3 9.62684 3 9.9375C3 10.2482 3.25184 10.5 3.5625 10.5H7.6875C7.99816 10.5 8.25 10.2482 8.25 9.9375C8.25 9.62684 7.99816 9.375 7.6875 9.375H6.1875V8.25H9C10.2426 8.25 11.25 7.24264 11.25 6V2.25C11.25 1.00736 10.2426 0 9 0H2.25ZM9 1.125H2.25C1.62868 1.125 1.125 1.62868 1.125 2.25V6C1.125 6.62132 1.62868 7.125 2.25 7.125H9C9.62132 7.125 10.125 6.62132 10.125 6V2.25C10.125 1.62868 9.62132 1.125 9 1.125Z" fill={previewDevice === "desktop" ? "#474E5A" : "#667691"} />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setPreviewDevice("mobile")}
            className={`flex h-full items-center justify-center rounded-[5px] px-[8px] transition-colors ${
              previewDevice === "mobile"
                ? "bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                : "hover:text-[#353A44]"
            }`}
            aria-label="Mobile preview"
            aria-pressed={previewDevice === "mobile"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="8" height="12" viewBox="0 0 8 12" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M5.25 1.125H2.25C1.62868 1.125 1.125 1.62868 1.125 2.25V9.75C1.125 10.3713 1.62868 10.875 2.25 10.875H5.25C5.87132 10.875 6.375 10.3713 6.375 9.75V2.25C6.375 1.62868 5.87132 1.125 5.25 1.125ZM2.25 0C1.00736 0 0 1.00736 0 2.25V9.75C0 10.9926 1.00736 12 2.25 12H5.25C6.49264 12 7.5 10.9926 7.5 9.75V2.25C7.5 1.00736 6.49264 0 5.25 0H2.25Z" fill={previewDevice === "mobile" ? "#474E5A" : "#667691"} />
              <path fillRule="evenodd" clipRule="evenodd" d="M1.875 9.375C1.875 9.11612 2.08487 8.90625 2.34375 8.90625H5.15625C5.41513 8.90625 5.625 9.11612 5.625 9.375C5.625 9.63388 5.41513 9.84375 5.15625 9.84375H2.34375C2.08487 9.84375 1.875 9.63388 1.875 9.375Z" fill={previewDevice === "mobile" ? "#474E5A" : "#667691"} />
            </svg>
          </button>
        </div>}
        {/* Confirmation / Invoice switcher (after payment only) */}
        {activePage === "after" && (
          <div className="flex h-[28px] items-center gap-[2px] rounded-[6px] bg-[#ECF1F6] p-[2px]">
            <button
              type="button"
              onClick={() => setAfterPreviewMode("confirmation")}
              className={`flex h-full items-center justify-center rounded-[5px] px-[8px] text-[11px] font-[500] leading-[14px] transition-colors ${
                afterPreviewMode === "confirmation"
                  ? "bg-white text-[#353A44] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  : "text-[#596171] hover:text-[#353A44]"
              }`}
              aria-pressed={afterPreviewMode === "confirmation"}
            >
              Confirmation
            </button>
            <button
              type="button"
              onClick={() => setAfterPreviewMode("invoice")}
              className={`flex h-full items-center justify-center rounded-[5px] px-[8px] text-[11px] font-[500] leading-[14px] transition-colors ${
                afterPreviewMode === "invoice"
                  ? "bg-white text-[#353A44] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  : "text-[#596171] hover:text-[#353A44]"
              }`}
              aria-pressed={afterPreviewMode === "invoice"}
            >
              Invoice
            </button>
          </div>
        )}
      </div>
      {/* Preview card */}
      <div className="relative transition-all duration-200" style={{ width: (activePage === "after" && afterPreviewMode === "invoice") || previewDevice === "desktop" ? "580px" : "320px" }}>
        <div className="pointer-events-none select-none">
          {(activePage === "link" || activePage === "payment") && (
            <PaymentLinkPreview
              data={paymentLinkObject?.data ?? {}}
              allObjects={workflow.objects}
              config={config}
            />
          )}
          {/* After-payment: stack both views in one grid cell so the card is always as tall
              as the taller of the two — toggling Confirmation/Invoice never changes height. */}
          {activePage === "after" && (
            <div className="grid">
              <div
                className={`col-start-1 row-start-1 flex ${afterPreviewMode === "confirmation" ? "" : "[&_*]:!transition-none"}`}
                style={{ visibility: afterPreviewMode === "confirmation" ? "visible" : "hidden" }}
                aria-hidden={afterPreviewMode !== "confirmation"}
              >
                <ConfirmationPagePreview
                  data={paymentLinkObject?.data ?? {}}
                  allObjects={workflow.objects}
                  config={config}
                />
              </div>
              <div
                className={`col-start-1 row-start-1 flex ${afterPreviewMode === "invoice" ? "" : "[&_*]:!transition-none"}`}
                style={{ visibility: afterPreviewMode === "invoice" ? "visible" : "hidden" }}
                aria-hidden={afterPreviewMode !== "invoice"}
              >
                <PostPaymentInvoicePreview
                  data={paymentLinkObject?.data ?? {}}
                  allObjects={workflow.objects}
                  config={config}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
    <CreationWorkspace
      mode="hierarchical"
      presentation={presentation}
      isOpen={isOpen}
      embedded={embedded}
      toolbar={
        navStyle === "sidebar" && filterPlacement === "above" ? (
          <div className="relative flex h-[36px] w-full items-center border-b border-[#ECF1F6] bg-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none" className="pointer-events-none absolute left-[12px] top-1/2 -translate-y-1/2">
              <path fillRule="evenodd" clipRule="evenodd" d="M4.25 1C2.45507 1 1 2.45507 1 4.25C1 6.04493 2.45507 7.5 4.25 7.5C5.04908 7.5 5.78153 7.2188 6.35848 6.7471L8.30569 8.69431C8.41306 8.80168 8.58694 8.80168 8.69431 8.69431C8.80168 8.58694 8.80168 8.41306 8.69431 8.30569L6.7471 6.35848C7.2188 5.78153 7.5 5.04908 7.5 4.25C7.5 2.45507 6.04493 1 4.25 1ZM1.55 4.25C1.55 2.75883 2.75883 1.55 4.25 1.55C5.74117 1.55 6.95 2.75883 6.95 4.25C6.95 5.74117 5.74117 6.95 4.25 6.95C2.75883 6.95 1.55 5.74117 1.55 4.25Z" fill="#6C7688" />
            </svg>
            <input
              value={formFilter}
              onChange={(e) => setFormFilter(e.target.value)}
              placeholder="Filter settings..."
              className="h-full w-full bg-transparent pl-[30px] pr-[32px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#1A2C44] placeholder:text-[#6C7688] outline-none"
            />
            {formFilter && (
              <button type="button" onClick={() => setFormFilter("")} className="absolute right-[10px] top-1/2 -translate-y-1/2 flex h-[14px] w-[14px] items-center justify-center rounded-full text-[#6C7688] transition-colors hover:bg-[#ECF1F6] hover:text-[#3C4F69]">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
              </button>
            )}
          </div>
        ) : undefined
      }
      header={
        <SimpleCreationHeader
          title="Create a payment link"
          onDiscard={onClose}
          onSubmit={handleSubmit}
          submitLabel={getPrimaryLabel(config)}
          discardLabel={config.discardLabel}
          onAddObject={(kind) => handleAddObject(kind)}
          addOptions={workflow.availableAddOptions()}
          tabs={workflow.objects.map((obj) => ({
            id: obj.id,
            kind: obj.kind,
            label: config.objectKinds[obj.kind]?.label ?? obj.kind,
          }))}
          activeTabId={workflow.activeObjectId}
          onSelectTab={workflow.setActiveObject}
          onRemoveTab={(id) => workflow.removeObject(id)}
          errorTabIds={hasErrors ? errorObjectIds : undefined}
        />
      }
      navigator={
        navStyle === "sidebar" ? (
          <PaymentLinkTreeNav
            activePage={activePage}
            onSelectPage={handleSelectPage}
            formFilter={formFilter}
            onFilterChange={setFormFilter}
            showFilter={filterPlacement === "nav"}
            isFiltering={isFiltering}
          />
        ) : null
      }
      editor={
        <>
          {/* Variant "above" in tabs mode: filter sits above the tab bar */}
          {navStyle === "tabs" && filterPlacement === "above" && (
            <div className="px-[16px] pt-[10px] pb-[6px]">
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none" className="pointer-events-none absolute left-[10px] top-1/2 -translate-y-1/2">
                  <path fillRule="evenodd" clipRule="evenodd" d="M4.25 1C2.45507 1 1 2.45507 1 4.25C1 6.04493 2.45507 7.5 4.25 7.5C5.04908 7.5 5.78153 7.2188 6.35848 6.7471L8.30569 8.69431C8.41306 8.80168 8.58694 8.80168 8.69431 8.69431C8.80168 8.58694 8.80168 8.41306 8.69431 8.30569L6.7471 6.35848C7.2188 5.78153 7.5 5.04908 7.5 4.25C7.5 2.45507 6.04493 1 4.25 1ZM1.55 4.25C1.55 2.75883 2.75883 1.55 4.25 1.55C5.74117 1.55 6.95 2.75883 6.95 4.25C6.95 5.74117 5.74117 6.95 4.25 6.95C2.75883 6.95 1.55 5.74117 1.55 4.25Z" fill="#6C7688" />
                </svg>
                <input
                  value={formFilter}
                  onChange={(e) => setFormFilter(e.target.value)}
                  placeholder="Filter settings..."
                  className="h-[30px] w-full rounded-[6px] border border-[#D8DEE4] bg-white pl-[28px] pr-[28px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#1A2C44] placeholder:text-[#6C7688] outline-none transition-all hover:border-[#B6C0CD] focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7]"
                />
                {formFilter && (
                  <button type="button" onClick={() => setFormFilter("")} className="absolute right-[8px] top-1/2 -translate-y-1/2 flex h-[14px] w-[14px] items-center justify-center rounded-full text-[#6C7688] transition-colors hover:bg-[#ECF1F6] hover:text-[#3C4F69]">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                  </button>
                )}
              </div>
            </div>
          )}
          {/* Tab bar — hidden in "nav" variant when filtering (filter replaces it) */}
          {navStyle === "tabs" && !(filterPlacement === "nav" && isFiltering) && (
            <div className={`grid grid-cols-2 border-b ${isRefresh ? "border-[#EAF0F6]" : "border-[#ECF1F6]"} ${isFiltering ? "opacity-50" : ""}`}>
              <button
                type="button"
                className={`relative py-[10px] text-center transition-colors ${
                  isRefresh ? "text-[13px] font-[575] leading-[20px] tracking-[-0.065px]" : "text-[12px] font-[500]"
                } ${
                  !isFiltering && (activePage === "payment" || activePage === "link")
                    ? (isRefresh ? "text-[#142234]" : "text-[#353A44]")
                    : (isRefresh ? "text-[#808FA1] hover:text-[#3F5064]" : "text-[#9CA3B0] hover:text-[#596171]")
                }`}
                onClick={() => handleSelectPage("payment")}
              >
                Payment page
                {!isFiltering && (activePage === "payment" || activePage === "link") && (
                  <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${isRefresh ? "bg-[#2C219E]" : "bg-[#533AFD]"}`} />
                )}
              </button>
              <button
                type="button"
                className={`relative py-[10px] text-center transition-colors ${
                  isRefresh ? "text-[13px] font-[575] leading-[20px] tracking-[-0.065px]" : "text-[12px] font-[500]"
                } ${
                  !isFiltering && activePage === "after"
                    ? (isRefresh ? "text-[#142234]" : "text-[#353A44]")
                    : (isRefresh ? "text-[#808FA1] hover:text-[#3F5064]" : "text-[#9CA3B0] hover:text-[#596171]")
                }`}
                onClick={() => handleSelectPage("after")}
              >
                After payment
                {!isFiltering && activePage === "after" && (
                  <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${isRefresh ? "bg-[#2C219E]" : "bg-[#533AFD]"}`} />
                )}
              </button>
            </div>
          )}
          {/* Variant "nav" in tabs mode: full-width filter bar flush with tabs */}
          {navStyle === "tabs" && filterPlacement === "nav" && (
            <div className="relative flex h-[36px] w-full items-center border-b border-[#ECF1F6] bg-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none" className="pointer-events-none absolute left-[12px] top-1/2 -translate-y-1/2">
                <path fillRule="evenodd" clipRule="evenodd" d="M4.25 1C2.45507 1 1 2.45507 1 4.25C1 6.04493 2.45507 7.5 4.25 7.5C5.04908 7.5 5.78153 7.2188 6.35848 6.7471L8.30569 8.69431C8.41306 8.80168 8.58694 8.80168 8.69431 8.69431C8.80168 8.58694 8.80168 8.41306 8.69431 8.30569L6.7471 6.35848C7.2188 5.78153 7.5 5.04908 7.5 4.25C7.5 2.45507 6.04493 1 4.25 1ZM1.55 4.25C1.55 2.75883 2.75883 1.55 4.25 1.55C5.74117 1.55 6.95 2.75883 6.95 4.25C6.95 5.74117 5.74117 6.95 4.25 6.95C2.75883 6.95 1.55 5.74117 1.55 4.25Z" fill="#6C7688" />
              </svg>
              <input
                value={formFilter}
                onChange={(e) => setFormFilter(e.target.value)}
                placeholder="Filter settings..."
                className="h-full w-full bg-transparent pl-[30px] pr-[32px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#1A2C44] placeholder:text-[#6C7688] outline-none"
              />
              {formFilter && (
                <button type="button" onClick={() => setFormFilter("")} className="absolute right-[10px] top-1/2 -translate-y-1/2 flex h-[14px] w-[14px] items-center justify-center rounded-full text-[#6C7688] transition-colors hover:bg-[#ECF1F6] hover:text-[#3C4F69]">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                </button>
              )}
            </div>
          )}
          <div
            key={`pl-editor-${workflow.activeObjectId}-${activePage}`}
            className={`relative flex-1 overflow-visible px-[16px] ${navStyle === "tabs" ? "pb-[16px] pt-[16px]" : "py-[16px]"}`}
          >
            {navStyle === "sidebar" && !isFiltering && (
              <div className="mb-[8px]">
                <p className="text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
                  {activePage === "link" ? "Payment link" : activePage === "payment" ? "Payment page" : "After payment"}
                </p>
              </div>
            )}
            {/* Variant "form": filter in form content area (original placement) */}
            {filterPlacement === "form" && (activePage === "payment" || activePage === "after") && activeKind === "paymentLink" && (
              <div className="relative mb-[12px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none" className="pointer-events-none absolute left-[10px] top-1/2 -translate-y-1/2">
                  <path fillRule="evenodd" clipRule="evenodd" d="M4.25 1C2.45507 1 1 2.45507 1 4.25C1 6.04493 2.45507 7.5 4.25 7.5C5.04908 7.5 5.78153 7.2188 6.35848 6.7471L8.30569 8.69431C8.41306 8.80168 8.58694 8.80168 8.69431 8.69431C8.80168 8.58694 8.80168 8.41306 8.69431 8.30569L6.7471 6.35848C7.2188 5.78153 7.5 5.04908 7.5 4.25C7.5 2.45507 6.04493 1 4.25 1ZM1.55 4.25C1.55 2.75883 2.75883 1.55 4.25 1.55C5.74117 1.55 6.95 2.75883 6.95 4.25C6.95 5.74117 5.74117 6.95 4.25 6.95C2.75883 6.95 1.55 5.74117 1.55 4.25Z" fill="#6C7688" />
                </svg>
                <input
                  value={formFilter}
                  onChange={(e) => setFormFilter(e.target.value)}
                  placeholder="Filter settings..."
                  className="h-[30px] w-full rounded-[6px] border border-[#D8DEE4] bg-white pl-[28px] pr-[28px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#1A2C44] placeholder:text-[#6C7688] outline-none transition-all hover:border-[#B6C0CD] focus:border-[#A0D0F7] focus:shadow-[0_0_0_1.5px_#A0D0F7]"
                />
                {formFilter && (
                  <button type="button" onClick={() => setFormFilter("")} className="absolute right-[8px] top-1/2 -translate-y-1/2 flex h-[14px] w-[14px] items-center justify-center rounded-full text-[#6C7688] transition-colors hover:bg-[#ECF1F6] hover:text-[#3C4F69]">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                  </button>
                )}
              </div>
            )}
            {FormComponent && workflow.activeObject && (
              <FormComponent
                data={{
                  ...workflow.activeObject.data,
                  _activePage: navStyle === "tabs" && activePage === "link" ? "payment" : activePage,
                  _navStyle: navStyle,
                  _formFilter: deferredFormFilter,
                  _createdProducts: workflow.objects
                    .filter((o) => o.kind === "product" && o.data.name)
                    .map((o) => ({ id: o.id, name: o.data.name as string, detail: o.data.unitPrice ? `$${o.data.unitPrice}` : "" })),
                  _allObjects: workflow.objects,
                }}
                onChange={(data: Record<string, any>) => {
                  workflow.updateObjectData(workflow.activeObject!.id, data)
                  if (hasErrors) workflow.clearValidationErrors()
                }}
                errorFields={activeErrorFields.size > 0 ? activeErrorFields : undefined}
                onAddObject={handleAddObject}
              />
            )}
          </div>
        </>
      }
      preview={previewPanel}
    />

    <CreationModalShell
      isOpen={showProductModal}
      onClose={() => setShowProductModal(false)}
      title="New product"
      primaryLabel="Create product"
      onPrimary={handleCreateProduct}
    >
      <div className="flex-1 overflow-y-auto px-[20px] py-[16px]">
        <ProductForm
          data={productModalData}
          onChange={(data) => setProductModalData((prev) => ({ ...prev, ...data }))}
        />
      </div>
    </CreationModalShell>

    {/* Full product editor (80% modal) */}
    <FullProductEditor
      isOpen={showPriceEditorModal}
      onClose={() => setShowPriceEditorModal(false)}
      presentation="80-modal"
    />
  </>
  )
}
