'use client'

import { useMemo, useState, type ComponentType } from "react"
import { AnimatePresence, motion } from "framer-motion"

import { CreationWorkspace, type WorkspacePresentation } from "@/components/creation-workspace/CreationWorkspace"
import { SimpleCreationHeader } from "@/components/creation-workspace/SimpleCreationHeader"
import { ValidationPanel } from "@/components/creation-workspace/ValidationPanel"
import { useWorkflowState, type WorkflowObject } from "@/components/creation-workspace/useWorkflowState"
import { createInvoiceWorkflowConfig, getPrimaryLabel } from "@/components/creation-workspace/workflowConfig"
import { InvoiceForm } from "@/components/creation-workspace/forms/InvoiceForm"
import { CustomerForm } from "@/components/creation-workspace/forms/CustomerForm"
import { ProductForm } from "@/components/creation-workspace/forms/ProductForm"
import { CouponForm } from "@/components/creation-workspace/forms/CouponForm"
import { MeterForm } from "@/components/creation-workspace/forms/MeterForm"
import { PriceForm } from "@/components/creation-workspace/forms/PriceForm"
import { InvoicePreview } from "@/components/creation-workspace/InvoicePreview"
import { MeterPreview } from "@/components/creation-workspace/MeterPreview"
import { PricePreviewPanel } from "@/components/creation-workspace/PricePreviewPanel"
import { ProductPreviewPanel } from "@/components/creation-workspace/ProductPreviewPanel"
import { CreationModalShell } from "@/components/creation-workspace/CreationModalShell"
import { FullProductEditor } from "@/components/creation-workspace/FullProductEditor"
import { ProductFormStyleProvider, useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { FocusedFieldProvider } from "@/components/product-catalog/FocusedFieldContext"

type InvoiceCreationEditorProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (objects: { kind: string; data: Record<string, any> }[]) => void
  presentation?: WorkspacePresentation
  embedded?: boolean
  initialCustomer?: {
    id: string
    data: Record<string, any>
  }
}

const invoiceForms = {
  invoice: InvoiceForm,
  customer: CustomerForm,
  product: ProductForm,
  coupon: CouponForm,
  meter: MeterForm,
  price: PriceForm,
  invoicePreview: InvoicePreview,
  meterPreview: MeterPreview,
  pricePreview: PricePreviewPanel,
  productPreview: ProductPreviewPanel,
}

export function InvoiceCreationEditor({
  isOpen,
  onClose,
  onSubmit,
  presentation = "fullscreen",
  embedded = false,
  initialCustomer,
}: InvoiceCreationEditorProps) {
  const config = useMemo(() => createInvoiceWorkflowConfig(invoiceForms), [])
  const workflow = useWorkflowState(config)
  const { productFormStyle } = useProductFormStyle()
  const isRefresh = productFormStyle === "refresh"

  const [showProductModal, setShowProductModal] = useState(false)
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showPriceEditorModal, setShowPriceEditorModal] = useState(false)
  const [productModalData, setProductModalData] = useState<Record<string, any>>({})
  const [couponModalData, setCouponModalData] = useState<Record<string, any>>({})
  const [customerModalData, setCustomerModalData] = useState<Record<string, any>>({})

  const invoiceObject = workflow.objects.find((o) => o.kind === "invoice") ?? workflow.activeObject
  const syntheticCustomer: WorkflowObject | null = initialCustomer
    ? {
        id: initialCustomer.id,
        kind: "customer",
        label: initialCustomer.data.name || initialCustomer.data.email || "Account",
        isPlaceholder: false,
        isComplete: true,
        data: initialCustomer.data,
      }
    : null

  const visibleObjects = syntheticCustomer
    ? [syntheticCustomer, ...workflow.objects.filter((o) => o.id !== syntheticCustomer.id)]
    : workflow.objects

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
    if (kind === "product") {
      setProductModalData({})
      setShowProductModal(true)
      return
    }
    if (kind === "coupon") {
      setCouponModalData({})
      setShowCouponModal(true)
      return
    }
    if (kind === "customer") {
      setCustomerModalData(initialData ?? {})
      setShowCustomerModal(true)
      return
    }
    if (existingId) {
      workflow.setActiveObject(existingId)
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

  const handleCreateCoupon = () => {
    const id = workflow.addObject("coupon")
    workflow.updateObjectData(id, couponModalData)
    setShowCouponModal(false)
    setCouponModalData({})
  }

  const applyAccountToInvoice = (account: { id: string; name: string; detail?: string; country?: string; draft?: Record<string, any>; created?: boolean }) => {
    if (!invoiceObject) return
    const created = Array.isArray(invoiceObject.data._createdCustomers)
      ? [...invoiceObject.data._createdCustomers]
      : []
    if (account.created) {
      const entry = {
        id: account.id,
        name: account.name,
        detail: account.detail ?? "",
        country: account.country,
        draft: { ...(account.draft ?? {}), customerId: account.id, name: account.name },
      }
      const index = created.findIndex((candidate: { id: string }) => candidate.id === account.id)
      if (index >= 0) created[index] = entry
      else created.push(entry)
    }
    workflow.updateObjectData(invoiceObject.id, {
      customerId: account.id,
      customerName: account.name,
      _createdCustomers: created,
    })
    workflow.setActiveObject(invoiceObject.id)
  }

  const handleCreateCustomer = () => {
    const name = String(customerModalData.name || customerModalData.displayName || "New account")
    const email = String(customerModalData.accountEmail || customerModalData.email || "")
    const existingId = customerModalData.customerId && customerModalData.customerId !== "_new"
      ? String(customerModalData.customerId)
      : undefined
    applyAccountToInvoice({
      id: existingId ?? `acct_${Date.now()}`,
      name,
      detail: email,
      country: String(customerModalData.accountCountry || customerModalData.country || ""),
      draft: customerModalData,
      created: true,
    })
    setShowCustomerModal(false)
    setCustomerModalData({})
  }

  const handleUseExistingAccount = (account: { id: string; name: string }) => {
    applyAccountToInvoice(account)
    setShowCustomerModal(false)
    setCustomerModalData({})
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
      <InvoicePreview data={invoiceObject?.data ?? {}} allObjects={visibleObjects} config={config} />
    </>
  )

  return (
    <>
    <FocusedFieldProvider>
    <CreationWorkspace
      mode="related"
      presentation={presentation}
      isOpen={isOpen}
      embedded={embedded}
      header={
        <SimpleCreationHeader
          title="Create invoice"
          onDiscard={onClose}
          onSubmit={handleSubmit}
          submitLabel={isRefresh ? "Create" : getPrimaryLabel(config)}
          discardLabel={config.discardLabel}
          onAddObject={(kind) => handleAddObject(kind)}
          addOptions={workflow.availableAddOptions()}
          tabs={workflow.objects.filter((obj) => obj.kind !== "customer").map((obj) => ({
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
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`invoice-editor-${workflow.activeObjectId}`}
            className="relative flex-1 -mx-[16px] px-[16px] overflow-hidden"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12, transition: { duration: 0.1 } }}
            transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
          >
            {FormComponent && workflow.activeObject && (
              <FormComponent
                data={{
                  ...workflow.activeObject.data,
                  _createdCustomers: [
                    ...(syntheticCustomer
                      ? [{ id: syntheticCustomer.id, name: syntheticCustomer.label, detail: syntheticCustomer.data.email ?? "" }]
                      : []),
                    ...(Array.isArray(workflow.activeObject.data._createdCustomers) ? workflow.activeObject.data._createdCustomers : []),
                    ...workflow.objects
                      .filter((o) => o.kind === "customer" && o.data.name)
                      .map((o) => ({ id: o.id, name: o.data.name as string, detail: (o.data.email as string) || "" })),
                  ],
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
          </motion.div>
        </AnimatePresence>
      }
      preview={previewPanel}
    />
    </FocusedFieldProvider>

    {/* Product creation modal */}
    <CreationModalShell
      isOpen={showProductModal}
      onClose={() => setShowProductModal(false)}
      title="New product"
      primaryLabel="Create product"
      onPrimary={handleCreateProduct}
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

    {/* Coupon creation modal */}
    <CreationModalShell
      isOpen={showCouponModal}
      onClose={() => setShowCouponModal(false)}
      title="Create coupon"
      primaryLabel="Create coupon"
      onPrimary={handleCreateCoupon}
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

    {/* Customer creation modal */}
    <CreationModalShell
      isOpen={showCustomerModal}
      onClose={() => setShowCustomerModal(false)}
      title="Create account"
      subtitle="This account will be a customer."
      primaryLabel="Create account"
      onPrimary={handleCreateCustomer}
    >
      <ProductFormStyleProvider initial={productFormStyle}>
        <div className="overflow-y-auto px-[20px] py-[16px]">
          <CustomerForm
            layout="compose"
            data={customerModalData}
            onChange={(data) => setCustomerModalData((prev) => ({ ...prev, ...data }))}
            onUseExistingAccount={handleUseExistingAccount}
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
