'use client'

import type { WorkflowObject } from "./useWorkflowState"
import type { WorkflowConfig } from "./workflowConfig"

type ConfirmationPagePreviewProps = {
  data: Record<string, any>
  allObjects: WorkflowObject[]
  config: WorkflowConfig
}

export function ConfirmationPagePreview({ data, allObjects }: ConfirmationPagePreviewProps) {
  const selectedProducts: { id: string; name: string }[] = data.selectedProducts ?? []
  const createdProducts = allObjects
    .filter((o) => o.kind === "product" && o.data.name)
    .map((o) => ({ id: o.id, name: o.data.name as string, price: o.data.unitPrice as string | undefined }))

  const allProducts = [
    ...selectedProducts.map((p) => ({ name: p.name, price: "" })),
    ...createdProducts.map((p) => ({ name: p.name, price: p.price ?? "" })),
  ]

  const hasProducts = allProducts.length > 0
  const displayName = hasProducts ? allProducts[0].name : "Product name"
  const displayPrice = hasProducts && allProducts[0].price ? `$${allProducts[0].price}` : "$0.00"

  return (
      <div className="flex w-full flex-col overflow-clip rounded-[14px] border border-[#D4DEE9] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)]">
        {/* Browser chrome */}
        <div className="flex shrink-0 items-center gap-[10px] border-b border-[#EBEEF1] bg-[#F8FAFB] px-[16px] py-[11px]">
          <div className="flex gap-[6px]">
            <div className="h-[9px] w-[9px] rounded-full bg-[#E0E4EA]" />
            <div className="h-[9px] w-[9px] rounded-full bg-[#E0E4EA]" />
            <div className="h-[9px] w-[9px] rounded-full bg-[#E0E4EA]" />
          </div>
          <div className="flex-1 rounded-[5px] bg-[#EBEEF1] px-[10px] py-[4px]">
            <span className="text-[12px] font-[400] text-[#6C7688]">buy.stripe.com</span>
          </div>
        </div>

        {/* Two-column body */}
        <div className="flex min-h-0 flex-1">
          {/* Left: dark sidebar with payment summary */}
          <div className="flex w-[220px] shrink-0 flex-col bg-[#1A2C44] p-[28px]">
            <div className="mb-[6px] flex h-[30px] w-[30px] items-center justify-center rounded-[6px] bg-[#2D4562]">
              <svg width="15" height="15" viewBox="0 0 12 12" fill="none">
                <rect x="2" y="2" width="8" height="8" rx="2" fill="#8B9DB8" />
              </svg>
            </div>
            <p className="mt-[16px] text-[13px] font-[400] text-[#8B9DB8]">Pay</p>
            <p className="mt-[3px] text-[26px] font-[600] leading-[32px] text-white" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>
              {displayPrice}
            </p>

            <div className="mt-[24px] flex flex-col gap-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-[400] text-[#8B9DB8]">{displayName}</span>
                <span className="text-[13px] font-[400] text-[#8B9DB8]">{displayPrice}</span>
              </div>
              <div className="h-px bg-[#2D4562]" />
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-[400] text-[#8B9DB8]">Total paid</span>
                <span className="text-[13px] font-[400] text-white">{displayPrice}</span>
              </div>
            </div>
          </div>

          {/* Right: confirmation content */}
          <div className="flex flex-1 flex-col items-center px-[32px] py-[32px]">
            {/* Success checkmark (wireframe grey) */}
            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#ECEFF3]">
              <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
                <path d="M4.5 9.5L7.5 12.5L13.5 6.5" stroke="#697386" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <p className="mt-[16px] text-[16px] font-[600] leading-[22px] text-[#1A2C44]">
              Thanks for your order
            </p>

            {/* Action buttons */}
            <div className="mt-[20px] flex gap-[10px]">
              <button
                type="button"
                className="rounded-[8px] border border-[#D4DEE9] bg-white px-[14px] py-[8px] text-[13px] font-[500] text-[#3C4F69] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                Download invoice
              </button>
              <button
                type="button"
                className="rounded-[8px] border border-[#D4DEE9] bg-white px-[14px] py-[8px] text-[13px] font-[500] text-[#3C4F69] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                Download receipt
              </button>
            </div>

            {/* Contact information */}
            <div className="mt-[28px] w-full">
              <p className="text-[13px] font-[600] text-[#3C4F69]">Contact information</p>
              <p className="mt-[3px] text-[13px] font-[400] text-[#6C7688]">customer@example.com</p>
            </div>

            {/* Payment method */}
            <div className="mt-[18px] w-full">
              <p className="text-[13px] font-[600] text-[#3C4F69]">Payment method</p>
              <div className="mt-[4px] flex items-center gap-[6px]">
                <div className="flex h-[18px] w-[28px] items-center justify-center rounded-[3px] bg-[#1A2C44]">
                  <span className="text-[9px] font-[700] text-white">VISA</span>
                </div>
                <span className="text-[13px] font-[400] text-[#6C7688]">Visa ••••4242 — {displayPrice}</span>
              </div>
            </div>

            {/* Climate badge */}
            <div className="mt-[28px] flex w-full items-start gap-[8px] rounded-[8px] bg-[#F4F7FA] px-[14px] py-[11px]">
              <div className="mt-[1px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#8792A2]">
                <svg width="10" height="10" viewBox="0 0 8 8" fill="none">
                  <circle cx="4" cy="4" r="3" fill="white" />
                </svg>
              </div>
              <p className="text-[12px] font-[400] leading-[16px] text-[#3C4F69]">
                Goldilocks will contribute <span className="font-[600]">1% of your purchase</span> to removing CO₂ from the atmosphere.
              </p>
            </div>
          </div>
        </div>
      </div>
  )
}
