'use client'

import { createToggleContext } from "@/lib/createToggleContext"

export type InvoicePreviewMode = "pure" | "pure-detail"

const { Provider: InvoicePreviewModeProvider, useValue } =
  createToggleContext<InvoicePreviewMode>("InvoicePreviewMode", "pure-detail")

function useInvoicePreviewMode() {
  const { value: invoicePreviewMode, setValue: setInvoicePreviewMode } = useValue()
  return { invoicePreviewMode, setInvoicePreviewMode }
}

export { InvoicePreviewModeProvider, useInvoicePreviewMode }
