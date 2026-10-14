'use client'

import type { WorkflowObject } from "./useWorkflowState"
import type { WorkflowConfig } from "./workflowConfig"

type PostPaymentInvoicePreviewProps = {
  data: Record<string, any>
  allObjects: WorkflowObject[]
  config: WorkflowConfig
}

export function PostPaymentInvoicePreview({ data, allObjects }: PostPaymentInvoicePreviewProps) {
  const selectedProducts: { id: string; name: string }[] = data.selectedProducts ?? []
  const createdProducts = allObjects
    .filter((o) => o.kind === "product" && o.data.name)
    .map((o) => ({ id: o.id, name: o.data.name as string, price: o.data.unitPrice as string | undefined }))

  const allProducts = [
    ...selectedProducts.map((p) => ({ name: p.name, price: "" })),
    ...createdProducts.map((p) => ({ name: p.name, price: p.price ?? "" })),
  ]

  const hasProducts = allProducts.length > 0
  const displayPrice = hasProducts && allProducts[0].price ? `$${allProducts[0].price}` : "$0.00"

  const today = new Date()
  const dateStr = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })

  return (
      <div className="flex w-full flex-col overflow-clip rounded-[14px] border border-[#D4DEE9] bg-white px-[36px] py-[32px] shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)]">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[22px] font-[600] leading-[28px] text-[#1A2C44]">Tax Invoice</h2>
            <div className="mt-[10px] flex flex-col gap-[3px]">
              <div className="flex gap-[10px]">
                <span className="w-[96px] text-[12px] font-[400] text-[#6C7688]">Invoice number</span>
                <span className="text-[12px] font-[500] text-[#1A2C44]">EXAMPLE-0001</span>
              </div>
              <div className="flex gap-[10px]">
                <span className="w-[96px] text-[12px] font-[400] text-[#6C7688]">Date of issue</span>
                <span className="text-[12px] font-[400] text-[#1A2C44]">{dateStr}</span>
              </div>
              <div className="flex gap-[10px]">
                <span className="w-[96px] text-[12px] font-[400] text-[#6C7688]">Date due</span>
                <span className="text-[12px] font-[400] text-[#1A2C44]">{dateStr}</span>
              </div>
            </div>
          </div>

          {/* Link logo */}
          <div className="flex items-center gap-[6px]">
            <div className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#8792A2]">
              <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
                <path d="M5 2V8M5 2L3 4M5 2L7 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-[16px] font-[600] text-[#1A2C44]">link</span>
          </div>
        </div>

        {/* Address blocks */}
        <div className="mt-[24px] flex gap-[28px]">
          <div className="flex-1">
            <p className="text-[11px] font-[600] uppercase tracking-[0.5px] text-[#6C7688]">Sold through</p>
            <div className="mt-[6px] flex flex-col gap-[2px]">
              <p className="text-[12px] font-[500] text-[#1A2C44]">Stripe Managed Link, LLC</p>
              <p className="text-[12px] font-[400] text-[#6C7688]">354 Oyster Point Boulevard</p>
              <p className="text-[12px] font-[400] text-[#6C7688]">South San Francisco,</p>
              <p className="text-[12px] font-[400] text-[#6C7688]">California 94080</p>
              <p className="text-[12px] font-[400] text-[#6C7688]">United States</p>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-[600] uppercase tracking-[0.5px] text-[#6C7688]">Bill to</p>
            <div className="mt-[6px] flex flex-col gap-[2px]">
              <p className="text-[12px] font-[500] text-[#1A2C44]">Example Customer</p>
              <p className="text-[12px] font-[400] text-[#6C7688]">123 Street Ln.</p>
              <p className="text-[12px] font-[400] text-[#6C7688]">Springfield, Illinois 62703</p>
              <p className="text-[12px] font-[400] text-[#6C7688]">United States</p>
              <p className="text-[12px] font-[400] text-[#6C7688]">email@customer.com</p>
            </div>
          </div>
        </div>

        {/* Amount due */}
        <p className="mt-[24px] text-[16px] font-[600] text-[#1A2C44]">
          $0 due {dateStr}
        </p>

        {/* Line items table */}
        <div className="mt-[20px]">
          {/* Header */}
          <div className="flex border-b border-[#EBEEF1] pb-[8px]">
            <span className="flex-1 text-[11px] font-[500] text-[#6C7688]">Description</span>
            <span className="w-[40px] text-right text-[11px] font-[500] text-[#6C7688]">Qty</span>
            <span className="w-[72px] text-right text-[11px] font-[500] text-[#6C7688]">Unit price</span>
            <span className="w-[68px] text-right text-[11px] font-[500] text-[#6C7688]">Amount</span>
          </div>

          {/* Empty row (no line items) */}
          <div className="flex border-b border-[#EBEEF1] py-[10px]">
            <span className="flex-1 text-[12px] font-[400] text-[#6C7688]" />
            <span className="w-[40px]" />
            <span className="w-[72px]" />
            <span className="w-[68px]" />
          </div>

          {/* Totals */}
          <div className="mt-[10px] flex flex-col gap-[6px]">
            <div className="flex justify-end gap-[20px]">
              <span className="text-[12px] font-[400] text-[#6C7688]">Subtotal</span>
              <span className="w-[68px] text-right text-[12px] font-[400] text-[#1A2C44]">{displayPrice}</span>
            </div>
            <div className="flex justify-end gap-[20px]">
              <span className="text-[12px] font-[400] text-[#6C7688]">Total</span>
              <span className="w-[68px] text-right text-[12px] font-[400] text-[#1A2C44]">{displayPrice}</span>
            </div>
            <div className="flex justify-end gap-[20px]">
              <span className="text-[12px] font-[600] text-[#1A2C44]">Amount due</span>
              <span className="w-[68px] text-right text-[12px] font-[600] text-[#1A2C44]">{displayPrice} USD</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-[24px] border-t border-[#EBEEF1] pt-[14px]">
          <p className="text-[11px] font-[400] text-[#A3ACB9]">
            LINKT-0001 · {displayPrice} USD due {dateStr}
          </p>
        </div>
      </div>
  )
}
