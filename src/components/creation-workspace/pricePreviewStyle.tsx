'use client'

import { createToggleContext } from "@/lib/createToggleContext"

export type PricePreviewStyle = "simple" | "invoice" | "receipt"

const { Provider: PricePreviewStyleProvider, useValue } =
  createToggleContext<PricePreviewStyle>("PricePreviewStyle", "simple", true)

function usePricePreviewStyle() {
  const { value: pricePreviewStyle, setValue: setPricePreviewStyle } = useValue()
  return { pricePreviewStyle, setPricePreviewStyle }
}

export { PricePreviewStyleProvider, usePricePreviewStyle }
