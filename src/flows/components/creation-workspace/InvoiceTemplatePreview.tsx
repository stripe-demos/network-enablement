'use client'

import { useState } from "react"

function PizzaMark() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="#E8C39A" />
      <circle cx="20" cy="20" r="16" fill="#F4D7A8" />
      <circle cx="20" cy="20" r="13" fill="#D3542D" />
      <circle cx="14" cy="16" r="2.2" fill="#F2C14E" />
      <circle cx="23" cy="14" r="2" fill="#8B3A2A" />
      <circle cx="18" cy="23" r="2.1" fill="#8B3A2A" />
      <circle cx="26" cy="22" r="1.8" fill="#F2C14E" />
    </svg>
  )
}

export function InvoiceTemplatePreview({
  memo,
  footer,
}: {
  memo?: string
  footer?: string
}) {
  const [invoiceId, setInvoiceId] = useState("in_1Ns8SDDCA5oQn0Ce390uq11R")
  const dueLabel = "October 18, 2026"

  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto px-[28px] py-[24px]">
      <div className="mx-auto w-full max-w-[560px]">
        <label className="flex flex-col gap-[6px]">
          <span className="text-[12px] font-[500] leading-[16px] text-[#1A2C44]">Invoice ID</span>
          <input
            className="h-[36px] rounded-[8px] border border-[#D4DEE9] bg-white px-[12px] text-[13px] text-[#1A2C44] outline-none placeholder:text-[#9CA3B0] focus:border-[#533AFD] focus:ring-2 focus:ring-[#533AFD]/15"
            value={invoiceId}
            onChange={(event) => setInvoiceId(event.target.value)}
          />
        </label>

        <div className="mt-[20px] overflow-hidden rounded-[4px] bg-white">
          <div className="h-[4px] bg-[#E85D04]" />
          <div className="px-[28px] pb-[28px] pt-[24px]">
            <div className="flex items-start justify-between gap-[16px]">
              <div>
                <h3 className="text-[22px] font-[600] leading-[28px] text-[#1A2C44]">Invoice</h3>
                <div className="mt-[12px] grid grid-cols-[auto_1fr] gap-x-[16px] gap-y-[4px] text-[12px] leading-[16px]">
                  <span className="text-[#6C7688]">Invoice number</span>
                  <span className="text-[#1A2C44]">EXAMPLE-00001</span>
                  <span className="text-[#6C7688]">Date of issue</span>
                  <span className="text-[#1A2C44]">{dueLabel}</span>
                  <span className="text-[#6C7688]">Date due</span>
                  <span className="text-[#1A2C44]">{dueLabel}</span>
                </div>
              </div>
              <div className="h-[40px] w-[40px] overflow-hidden rounded-[4px]">
                <PizzaMark />
              </div>
            </div>

            <div className="mt-[28px] grid grid-cols-2 gap-[24px] text-[12px] leading-[16px] text-[#1A2C44]">
              <div className="flex flex-col gap-[2px]">
                <p className="font-[500]">Katelyn Steinfield</p>
                <p>1008 Carolann Avenue</p>
                <p>13004</p>
                <p>Burlingame, California 94010</p>
                <p>United States</p>
                <p>+1 516-510-2202</p>
              </div>
              <div className="flex flex-col gap-[2px]">
                <p className="text-[#6C7688]">Bill to</p>
                <p className="font-[500]">Example Customer</p>
              </div>
            </div>

            <p className="mt-[28px] text-[20px] font-[600] leading-[28px] text-[#1A2C44]">$0 due {dueLabel}</p>

            {memo ? (
              <p className="mt-[12px] whitespace-pre-wrap text-[12px] leading-[16px] text-[#3C4F69]">{memo}</p>
            ) : null}

            <div className="mt-[20px] border-t border-[#1A2C44] pt-[8px]">
              <div className="grid grid-cols-[1fr_56px_88px_72px] gap-[8px] text-[11px] text-[#6C7688]">
                <span>Description</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Unit price</span>
                <span className="text-right">Amount</span>
              </div>
              <div className="mt-[16px] space-y-[6px] text-[12px] text-[#1A2C44]">
                <div className="flex justify-end gap-[24px]">
                  <span className="text-[#6C7688]">Subtotal</span>
                  <span className="w-[72px] text-right">$0.00</span>
                </div>
                <div className="flex justify-end gap-[24px] font-[500]">
                  <span>Total</span>
                  <span className="w-[72px] text-right">$0.00</span>
                </div>
                <div className="flex justify-end gap-[24px] font-[600]">
                  <span>Amount due</span>
                  <span className="w-[72px] text-right">$0.00 USD</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-[#ECF1F6] px-[28px] py-[12px] text-[11px] text-[#6C7688]">
            {footer?.trim() || "EXAMPLE-00001 · $0.00 USD due October 18, 2026"}
          </div>
        </div>
      </div>
    </div>
  )
}
