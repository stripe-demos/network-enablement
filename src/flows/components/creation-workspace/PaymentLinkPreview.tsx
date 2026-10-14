'use client'

import type { WorkflowObject } from "./useWorkflowState"
import type { WorkflowConfig } from "./workflowConfig"

type PaymentLinkPreviewProps = {
  data: Record<string, any>
  allObjects: WorkflowObject[]
  config: WorkflowConfig
}

export function PaymentLinkPreview({ data, allObjects }: PaymentLinkPreviewProps) {
  const selectedProducts: { id: string; name: string }[] = data.selectedProducts ?? []
  const createdProducts = allObjects
    .filter((o) => o.kind === "product" && o.data.name)
    .map((o) => ({ id: o.id, name: o.data.name as string, price: o.data.unitPrice as string | undefined }))

  const allProducts = [
    ...selectedProducts.map((p) => ({ name: p.name, price: "" })),
    ...createdProducts.map((p) => ({ name: p.name, price: p.price ?? "" })),
  ]

  const linkType = data.linkType ?? "Products or subscriptions"
  const hasProducts = allProducts.length > 0
  const displayName = hasProducts ? allProducts[0].name : "Your product"
  const displayPrice = hasProducts && allProducts[0].price ? `$${allProducts[0].price}` : "$0.00"

  return (
      <div className="w-full overflow-clip rounded-[14px] border border-[#D4DEE9] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)]">
        {/* Browser chrome */}
        <div className="flex items-center gap-[10px] border-b border-[#EBEEF1] bg-[#F8FAFB] px-[16px] py-[11px]">
          <div className="flex gap-[6px]">
            <div className="h-[9px] w-[9px] rounded-full bg-[#E0E4EA]" />
            <div className="h-[9px] w-[9px] rounded-full bg-[#E0E4EA]" />
            <div className="h-[9px] w-[9px] rounded-full bg-[#E0E4EA]" />
          </div>
          <div className="flex-1 rounded-[5px] bg-[#EBEEF1] px-[10px] py-[4px]">
            <span className="text-[12px] font-[400] text-[#6C7688]">pay.stripe.com/c/pay_...</span>
          </div>
        </div>

        {/* Checkout content */}
        <div className="flex flex-col p-[28px]">
          {/* Product info */}
          <div className="mb-[24px]">
            {linkType === "Customers choose" ? (
              <>
                <p className="text-[16px] font-[500] text-[#1A2C44]">Pay what you want</p>
                {data.suggestedAmount && (
                  <p className="mt-[4px] text-[28px] font-[600] leading-[34px] text-[#1A2C44]" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>
                    ${data.suggestedAmount}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-[16px] font-[500] text-[#1A2C44]">{displayName}</p>
                <p className="mt-[4px] text-[28px] font-[600] leading-[34px] text-[#1A2C44]" style={{ fontFeatureSettings: "'lnum' 1, 'pnum' 1" }}>
                  {displayPrice}
                </p>
                {allProducts.length > 1 && (
                  <p className="mt-[6px] text-[13px] text-[#6C7688]">+{allProducts.length - 1} more item{allProducts.length > 2 ? "s" : ""}</p>
                )}
              </>
            )}
          </div>

          {/* Mock form fields */}
          <div className="flex flex-col gap-[16px]">
            <div className="flex flex-col gap-[6px]">
              <label className="text-[13px] font-[400] text-[#6C7688]">Email</label>
              <div className="h-[44px] rounded-[8px] border border-[#D8DEE4] bg-[#F8FAFB]" />
            </div>

            <div className="flex flex-col gap-[6px]">
              <label className="text-[13px] font-[400] text-[#6C7688]">Card information</label>
              <div className="rounded-[8px] border border-[#D8DEE4] bg-[#F8FAFB]">
                <div className="h-[44px] border-b border-[#D8DEE4]" />
                <div className="flex">
                  <div className="h-[44px] flex-1 border-r border-[#D8DEE4]" />
                  <div className="h-[44px] flex-1" />
                </div>
              </div>
            </div>

            {data.collectAddresses && (
              <div className="flex flex-col gap-[6px]">
                <label className="text-[13px] font-[400] text-[#6C7688]">Billing address</label>
                <div className="h-[44px] rounded-[8px] border border-[#D8DEE4] bg-[#F8FAFB]" />
              </div>
            )}

            {data.requirePhone && (
              <div className="flex flex-col gap-[6px]">
                <label className="text-[13px] font-[400] text-[#6C7688]">Phone</label>
                <div className="h-[44px] rounded-[8px] border border-[#D8DEE4] bg-[#F8FAFB]" />
              </div>
            )}
          </div>

          {/* Pay button */}
          <button
            type="button"
            className="mt-[24px] flex h-[48px] w-full items-center justify-center rounded-[8px] bg-[#3C4257] text-[15px] font-[500] text-white"
          >
            Pay {hasProducts || data.suggestedAmount ? (data.suggestedAmount ? `$${data.suggestedAmount}` : displayPrice) : ""}
          </button>

          {/* Powered by */}
          <p className="mt-[16px] text-center text-[11px] text-[#A3ACB9]">
            Powered by <span className="font-[500]">Stripe</span>
          </p>
        </div>
      </div>
  )
}
