'use client'

import { AnimatePresence } from "framer-motion"

import { InvoiceCreationEditor } from "@/components/creation-workspace/InvoiceCreationEditor"
import { PortalEditorShell } from "@/components/creation-workspace/PortalEditorShell"

type FullInvoiceEditorProps = {
  isOpen: boolean
  customerData: Record<string, any>
  customerId: string
  onBack: () => void
  onClose: () => void
}

export function FullInvoiceEditor({
  isOpen,
  customerData,
  customerId,
  onBack,
  onClose,
}: FullInvoiceEditorProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <PortalEditorShell
        key="customer-invoice-editor"
        originLabel="Customer"
        currentLabel="Create invoice"
        onBack={onBack}
      >
        <InvoiceCreationEditor
          isOpen
          embedded
          initialCustomer={{ id: customerId, data: customerData }}
          onClose={onClose}
        />
      </PortalEditorShell>
    </AnimatePresence>
  )
}
