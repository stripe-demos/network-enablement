'use client'

import { useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

import { CreationWorkspace, type WorkspacePresentation } from "@/components/creation-workspace/CreationWorkspace"
import { SimpleCreationHeader } from "@/components/creation-workspace/SimpleCreationHeader"
import { ValidationPanel } from "@/components/creation-workspace/ValidationPanel"
import { CreationModalShell } from "@/components/creation-workspace/CreationModalShell"
import { FullProductEditor } from "@/components/creation-workspace/FullProductEditor"
import { useWorkflowState } from "@/components/creation-workspace/useWorkflowState"
import { createSubscriptionWorkflowConfig, getPrimaryLabel } from "@/components/creation-workspace/workflowConfig"
import { SubscriptionForm, type SubscriptionActivePage } from "@/components/creation-workspace/forms/SubscriptionForm"
import { CustomerForm } from "@/components/creation-workspace/forms/CustomerForm"
import { ProductForm } from "@/components/creation-workspace/forms/ProductForm"
import { CouponForm } from "@/components/creation-workspace/forms/CouponForm"
import { PriceForm } from "@/components/creation-workspace/forms/PriceForm"
import { PricingPlanForm } from "@/components/creation-workspace/forms/PricingPlanForm"
import { SubscriptionInvoicePreview } from "@/components/creation-workspace/SubscriptionInvoicePreview"
import { InvoiceTemplatePreview } from "@/components/creation-workspace/InvoiceTemplatePreview"
import { PricePreviewPanel } from "@/components/creation-workspace/PricePreviewPanel"
import { getFormTokens } from "@/components/creation-workspace/forms/shared/formTokens"
import { ProductFormStyleProvider, useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { useNavStyle } from "@/components/creation-workspace/navStyle"

type SubscriptionCreationEditorProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (objects: { kind: string; data: Record<string, any> }[]) => void
  presentation?: WorkspacePresentation
  embedded?: boolean
}

const subscriptionForms = {
  subscription: SubscriptionForm,
  customer: CustomerForm,
  product: ProductForm,
  coupon: CouponForm,
  price: PriceForm,
  pricingPlan: PricingPlanForm,
  subscriptionPreview: SubscriptionInvoicePreview,
  pricePreview: PricePreviewPanel,
}

const BASE_SUBSCRIPTION_TABS: { id: SubscriptionActivePage; label: string }[] = [
  { id: "subscription", label: "Subscription" },
]

// Sidebar navigator for the subscription's sub-pages (used when Nav style = Sidebar)
function SubscriptionPageNav({
  activePage,
  onSelectPage,
  tabs,
}: {
  activePage: SubscriptionActivePage
  onSelectPage: (page: SubscriptionActivePage) => void
  tabs: { id: SubscriptionActivePage; label: string }[]
}) {
  const { productFormStyle } = useProductFormStyle()
  const isRefreshNav = productFormStyle === "refresh"
  const rowBase = isRefreshNav
    ? "flex w-full items-center rounded-[6px] px-[10px] py-[5px] text-left text-[13px] font-[575] leading-[20px] tracking-[-0.065px] text-[#142234] transition-colors cursor-pointer whitespace-nowrap"
    : "flex w-full items-center rounded-[6px] px-[10px] py-[4px] text-left text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#1A2C44] transition-colors cursor-pointer whitespace-nowrap"
  const activeBg = isRefreshNav ? "bg-[#F1F6FB]" : "bg-[#F7F5FD]"
  const hoverBg = isRefreshNav ? "hover:bg-[#F1F6FB]" : "hover:bg-[#F4F7FA]"
  return (
    <div className="flex h-full w-[180px] flex-col gap-[2px] px-[8px] pt-[12px] pb-[8px]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`${rowBase} ${activePage === tab.id ? activeBg : hoverBg}`}
          onClick={() => onSelectPage(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export function SubscriptionCreationEditor({
  isOpen,
  onClose,
  onSubmit,
  presentation = "fullscreen",
  embedded = false,
}: SubscriptionCreationEditorProps) {
  const config = useMemo(() => createSubscriptionWorkflowConfig(subscriptionForms), [])
  const workflow = useWorkflowState(config)

  const { productFormStyle } = useProductFormStyle()
  const isRefresh = productFormStyle === "refresh"
  const { navStyle } = useNavStyle()

  const [activePage, setActivePage] = useState<SubscriptionActivePage>("subscription")
  const pageDirection = useRef(1)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showPriceEditorModal, setShowPriceEditorModal] = useState(false)
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [customerModalData, setCustomerModalData] = useState<Record<string, any>>({})
  const [couponModalData, setCouponModalData] = useState<Record<string, any>>({})
  const [productModalData, setProductModalData] = useState<Record<string, any>>({})

  const subscriptionObject = workflow.objects.find((o) => o.kind === "subscription") ?? workflow.activeObject
  const showInvoiceTemplatePage = Boolean(
    subscriptionObject?.data._showInvoiceTemplatePage
    || (Array.isArray(subscriptionObject?.data._createdTemplates) && subscriptionObject.data._createdTemplates.length > 0)
  )
  const subscriptionPageTabs: { id: SubscriptionActivePage; label: string }[] = [
    ...BASE_SUBSCRIPTION_TABS,
    ...(showInvoiceTemplatePage ? [{ id: "invoice" as const, label: "Invoice template" }] : []),
  ]

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
    if (kind === "_invoiceTemplate") {
      const subObj = workflow.objects.find((o) => o.kind === "subscription")
      if (subObj) {
        workflow.updateObjectData(subObj.id, {
          _showInvoiceTemplatePage: true,
          invoiceTemplate: true,
        })
      }
      setActivePage("invoice")
      return
    }
    if (kind === "_fullEditor") {
      setShowPriceEditorModal(true)
      return
    }
    if (kind === "coupon") {
      setCouponModalData({})
      setShowCouponModal(true)
      return
    }
    if (kind === "product") {
      setProductModalData(initialData ?? {})
      setShowProductModal(true)
      return
    }
    if (kind === "customer" && !existingId) {
      setCustomerModalData({})
      setShowCustomerModal(true)
      return
    }
    if (kind === "customer" && existingId) {
      const existing = workflow.objects.find((o) => o.id === existingId)
      if (existing) {
        setCustomerModalData(existing.data)
        setShowCustomerModal(true)
      }
      return
    }
    if (existingId) {
      workflow.setActiveObject(existingId)
      return
    }
    const id = workflow.addObject(kind)
    if (initialData) workflow.updateObjectData(id, initialData)
  }

  const handleCustomerSave = () => {
    const existingCustomer = workflow.objects.find((o) => o.kind === "customer")
    if (existingCustomer) {
      workflow.updateObjectData(existingCustomer.id, customerModalData)
    } else {
      const id = workflow.addObject("customer")
      workflow.updateObjectData(id, customerModalData)
    }
    const subObj = workflow.objects.find((o) => o.kind === "subscription")
    if (subObj) {
      workflow.updateObjectData(subObj.id, {
        customerId: "_new",
        customerName: customerModalData.name || "New account",
        _focusItemsAfterCustomerSave: true,
      })
    }
    setShowCustomerModal(false)
  }

  const handleSelectPage = (nextPage: SubscriptionActivePage) => {
    const currentIndex = subscriptionPageTabs.findIndex((tab) => tab.id === activePage)
    const nextIndex = subscriptionPageTabs.findIndex((tab) => tab.id === nextPage)
    if (currentIndex !== -1 && nextIndex !== -1 && currentIndex !== nextIndex) {
      pageDirection.current = nextIndex > currentIndex ? 1 : -1
    }
    setActivePage(nextPage)
  }

  const previewPanel = (
    <>
      {hasErrors && (
        <ValidationPanel
          errors={workflow.validationErrors}
          config={config}
          onNavigateToError={(objectId) => workflow.setActiveObject(objectId)}
          onDismiss={workflow.clearValidationErrors}
        />
      )}
      {activePage === "invoice" ? (
        <InvoiceTemplatePreview
          memo={subscriptionObject?.data.templateMemo as string | undefined}
          footer={subscriptionObject?.data.templateFooter as string | undefined}
        />
      ) : (
        <SubscriptionInvoicePreview data={subscriptionObject?.data ?? {}} allObjects={workflow.objects} config={config} />
      )}
    </>
  )

  return (
    <>
      <CreationWorkspace
        mode="related"
        presentation={presentation}
        isOpen={isOpen}
        embedded={embedded}
        navigator={
          navStyle === "sidebar" && activeKind === "subscription" && showInvoiceTemplatePage ? (
            <SubscriptionPageNav activePage={activePage} onSelectPage={handleSelectPage} tabs={subscriptionPageTabs} />
          ) : undefined
        }
        header={
          <SimpleCreationHeader
            title="Create subscription"
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
        editor={
          <>
            {/* Tab bar for subscription form pages */}
            {navStyle === "tabs" && activeKind === "subscription" && showInvoiceTemplatePage && (
              <div className={`-mx-[16px] -mt-[16px] grid grid-cols-4 border-b ${isRefresh ? "border-[#EAF0F6]" : "border-[#ECF1F6]"}`}>
                {subscriptionPageTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`relative py-[10px] text-center transition-colors ${
                      isRefresh ? "text-[13px] font-[575] leading-[20px] tracking-[-0.065px]" : "text-[12px] font-[500]"
                    } ${
                      activePage === tab.id
                        ? (isRefresh ? "text-[#142234]" : "text-[#353A44]")
                        : (isRefresh ? "text-[#808FA1] hover:text-[#3F5064]" : "text-[#9CA3B0] hover:text-[#596171]")
                    }`}
                    onClick={() => handleSelectPage(tab.id)}
                  >
                    {tab.label}
                    {activePage === tab.id && (
                      <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${isRefresh ? "bg-[#2C219E]" : "bg-[#533AFD]"}`} />
                    )}
                  </button>
                ))}
              </div>
            )}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`sub-editor-${workflow.activeObjectId}-${activePage}`}
                className="relative flex-1 -mx-[16px] px-[16px] overflow-hidden"
                custom={pageDirection.current}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
              >
                {activeKind !== "subscription" && (
                  <div className="mb-[16px] flex min-w-0 items-center justify-between">
                    <p className="truncate text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
                      {workflow.activeObject?.label ?? "Subscription"}
                    </p>
                  </div>
                )}
                {activeKind === "subscription" && activePage === "invoice" ? (
                  <TemplateForm
                    data={{
                      name: subscriptionObject?.data.templateName ?? "",
                      memo: subscriptionObject?.data.templateMemo ?? "",
                      footer: subscriptionObject?.data.templateFooter ?? "",
                    }}
                    onChange={(patch) => {
                      const subObj = workflow.objects.find((o) => o.kind === "subscription")
                      if (!subObj) return
                      workflow.updateObjectData(subObj.id, {
                        ...("name" in patch ? { templateName: patch.name, template: patch.name } : {}),
                        ...("memo" in patch ? { templateMemo: patch.memo } : {}),
                        ...("footer" in patch ? { templateFooter: patch.footer } : {}),
                      })
                    }}
                  />
                ) : FormComponent && workflow.activeObject ? (
                  <FormComponent
                    data={{
                      ...workflow.activeObject.data,
                      _activePage: activeKind === "subscription" && (navStyle === "tabs" || navStyle === "sidebar") && activePage !== "subscription" ? activePage : undefined,
                      _navStyle: navStyle,
                      _createdCustomers: workflow.objects
                        .filter((o) => o.kind === "customer" && o.data.name)
                        .map((o) => ({ id: o.id, name: o.data.name as string, detail: (o.data.email as string) || "" })),
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
                ) : null}
              </motion.div>
            </AnimatePresence>
          </>
        }
        preview={previewPanel}
      />

      {/* Account creation modal (simple, 480px) */}
      <CreationModalShell
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Create account"
        subtitle="This account will be a customer."
        primaryLabel="Create account"
        onPrimary={handleCustomerSave}
        isPushed={showPriceEditorModal}
      >
        <ProductFormStyleProvider initial={productFormStyle}>
          <div className="overflow-y-auto px-[20px] py-[16px]">
            <CustomerForm
              layout="compose"
              data={customerModalData}
              onChange={(data) => setCustomerModalData((prev) => ({ ...prev, ...data }))}
            />
          </div>
        </ProductFormStyleProvider>
      </CreationModalShell>

      {/* Coupon creation modal */}
      <CreationModalShell
        isOpen={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        title="Create coupon"
        primaryLabel="Create coupon"
        onPrimary={() => setShowCouponModal(false)}
        isPushed={showPriceEditorModal}
      >
        <ProductFormStyleProvider initial={productFormStyle}>
          <div className="overflow-y-auto px-[20px] py-[16px]">
            <CouponForm
              data={couponModalData}
              onChange={(data) => setCouponModalData((prev) => ({ ...prev, ...data }))}
            />
          </div>
        </ProductFormStyleProvider>
      </CreationModalShell>

      {/* Product creation modal */}
      <CreationModalShell
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title="New product"
        primaryLabel="Create product"
        onPrimary={() => {
          const name = productModalData.name || "New product"
          const price = productModalData.unitPrice ? `$${productModalData.unitPrice}/${productModalData.billingPeriod === "yearly" ? "yr" : "mo"}` : ""
          const productId = `created_${Date.now()}`
          const sourceItemId = productModalData._subscriptionItemId as string | null | undefined
          const subData = workflow.objects.find((o) => o.kind === "subscription")?.data ?? {}
          const items = subData.items ?? []
          const newItem = {
            id: `item_${Date.now()}`,
            productId,
            productName: name,
            price,
            quantity: "1",
            couponsEnabled: false,
            taxEnabled: false,
            confirmed: false,
          }
          const nextItems = typeof sourceItemId === "string"
            ? items.map((item: Record<string, any>) =>
                item.id === sourceItemId
                  ? { ...item, productId, productName: name, price }
                  : item
              )
            : [...items, newItem]
          workflow.updateObjectData(workflow.objects.find((o) => o.kind === "subscription")!.id, { items: nextItems })
          setProductModalData({})
          setShowProductModal(false)
        }}
        isPushed={showPriceEditorModal}
      >
        <ProductFormStyleProvider initial={productFormStyle}>
          <div className="overflow-y-auto px-[20px] py-[16px]">
            <ProductForm
              data={productModalData}
              onChange={(data) => setProductModalData((prev) => ({ ...prev, ...data }))}
              onAddObject={handleAddObject}
            />
          </div>
        </ProductFormStyleProvider>
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

// Inline template form for the 80% modal
function TemplateForm({ data, onChange }: { data: Record<string, any>; onChange: (data: Record<string, any>) => void }) {
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)
  const set = (key: string, value: string) => onChange({ [key]: value })

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[4px]">
        <label className={tokens.labelClass}>Template name</label>
        <input
          className={tokens.inputClass}
          placeholder="Enter name"
          value={data.name ?? ""}
          onChange={(e) => set("name", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={tokens.labelClass}>Memo</label>
        <textarea
          className={tokens.textareaClass}
          placeholder="Have questions? Call us at 555-123-4567"
          value={data.memo ?? ""}
          onChange={(e) => set("memo", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={tokens.labelClass}>Footer</label>
        <textarea
          className={tokens.textareaClass}
          placeholder="Thank you for your business!"
          value={data.footer ?? ""}
          onChange={(e) => set("footer", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={tokens.labelClass}>Custom fields</label>
        <button
          type="button"
          className="flex items-center gap-[4px] self-start rounded-[6px] px-[8px] py-[4px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#533AFD] hover:bg-[#F7F5FD]"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 1V9M1 5H9" stroke="#533AFD" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Add custom field
        </button>
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={tokens.labelClass}>Line item grouping</label>
        <button
          type="button"
          className="flex items-center gap-[4px] self-start rounded-[6px] px-[8px] py-[4px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#533AFD] hover:bg-[#F7F5FD]"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 1V9M1 5H9" stroke="#533AFD" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Create a group
        </button>
      </div>
    </div>
  )
}
