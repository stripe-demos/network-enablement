export type PaymentLinkFieldDef = {
  id: string
  label: string
  page: "payment" | "after"
  keywords?: string[]
}

export const PAYMENT_LINK_FIELDS: PaymentLinkFieldDef[] = [
  { id: "enableManagedPayments", label: "Enable Managed Payments", page: "payment", keywords: ["managed"] },
  { id: "collectTax", label: "Collect tax automatically", page: "payment", keywords: ["tax"] },
  { id: "collectCustomerNames", label: "Collect customer names", page: "payment", keywords: ["name", "optional"] },
  { id: "collectBusinessNames", label: "Collect business names", page: "payment", keywords: ["business", "optional"] },
  { id: "collectAddresses", label: "Collect customer addresses", page: "payment", keywords: ["address", "billing", "shipping"] },
  { id: "requirePhone", label: "Require a phone number", page: "payment", keywords: ["phone", "telephone"] },
  { id: "includeFreeTrial", label: "Include a free trial", page: "payment", keywords: ["trial", "days"] },
  { id: "limitPayments", label: "Limit the number of payments", page: "payment", keywords: ["limit", "total"] },
  { id: "addCustomFields", label: "Add custom fields", page: "payment", keywords: ["custom", "field", "label"] },
  { id: "allowPromoCodes", label: "Allow promotion codes", page: "payment", keywords: ["promo", "promotion", "coupon", "discount"] },
  { id: "allowTaxIds", label: "Collect tax IDs", page: "payment", keywords: ["tax id", "vat"] },
  { id: "savePaymentDetails", label: "Save payment details", page: "payment", keywords: ["save", "card"] },
  { id: "termsOfService", label: "Require terms of service", page: "payment", keywords: ["terms", "tos"] },

  { id: "confirmationPage", label: "Show confirmation page", page: "after", keywords: ["confirmation", "redirect"] },
  { id: "replaceWithCustomMessage", label: "Custom confirmation message", page: "after", keywords: ["message", "custom"] },
  { id: "splitPayment", label: "Split with connected account", page: "after", keywords: ["split", "connect"] },
  { id: "createInvoicePdf", label: "Create an invoice PDF", page: "after", keywords: ["invoice", "pdf"] },
]

export function filterPaymentLinkFields(needle: string) {
  const lower = needle.trim().toLowerCase()
  if (!lower) return { isFiltering: false, matchedIds: new Set<string>() }

  const matchedIds = new Set<string>()
  for (const field of PAYMENT_LINK_FIELDS) {
    if (field.label.toLowerCase().includes(lower)) {
      matchedIds.add(field.id)
      continue
    }
    if (field.keywords?.some((kw) => kw.toLowerCase().includes(lower))) {
      matchedIds.add(field.id)
    }
  }

  return { isFiltering: true, matchedIds }
}
