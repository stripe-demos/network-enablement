'use client'

import { BUY_BUTTON_PRODUCTS, BUY_BUTTON_COLORS } from "@/components/creation-workspace/forms/BuyButtonForm"

type BuyButtonPreviewProps = {
  data: Record<string, any>
}

function buttonRadius(shape: string) {
  if (shape === "Sharp") return 6
  if (shape === "Pill") return 999
  return 10
}

function cardRadius(shape: string) {
  if (shape === "Sharp") return 8
  if (shape === "Pill") return 20
  return 14
}

export function BuyButtonPreview({ data }: BuyButtonPreviewProps) {
  const product = BUY_BUTTON_PRODUCTS.find((p) => p.value === (data.product ?? "pro")) ?? BUY_BUTTON_PRODUCTS[0]
  const cta = data.cta ?? "Pay"
  const color = data.color ?? BUY_BUTTON_COLORS[0]
  const shape = data.shape ?? "Rounded"
  const isCardWidget = (data.buttonType ?? "Button") === "Card widget"
  const btnRadius = buttonRadius(shape)

  if (isCardWidget) {
    return (
      <div className="flex w-full items-center justify-center">
        <div
          className="w-[248px] overflow-hidden border border-[#E3E8EF] bg-white shadow-[0_12px_32px_rgba(20,34,52,0.12)]"
          style={{ borderRadius: cardRadius(shape) }}
        >
          <div className="flex flex-col p-[18px]">
            <p className="text-[15px] font-[650] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">{product.label}</p>
            <p className="mt-[3px] text-[13px] font-[400] leading-[18px] text-[#68778B]">{product.price}</p>
            <button
              type="button"
              tabIndex={-1}
              className="mt-[16px] w-full py-[11px] text-[14px] font-[600] leading-[20px] text-white"
              style={{ backgroundColor: color, borderRadius: btnRadius }}
            >
              {cta}
            </button>
            <p className="mt-[10px] text-center text-[11px] font-[400] leading-[14px] text-[#9AA8B7]">
              Powered by Stripe
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col items-center gap-[8px]">
      <button
        type="button"
        tabIndex={-1}
        className="inline-flex items-center justify-center px-[22px] py-[11px] text-[14px] font-[600] leading-[20px] text-white shadow-[0_1px_2px_rgba(20,34,52,0.12)]"
        style={{ backgroundColor: color, borderRadius: btnRadius }}
      >
        {cta}
      </button>
      <p className="text-[11px] font-[400] leading-[14px] text-[#9AA8B7]">Powered by Stripe</p>
    </div>
  )
}
