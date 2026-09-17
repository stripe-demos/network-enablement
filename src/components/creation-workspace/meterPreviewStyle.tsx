'use client'

import { createToggleContext } from "@/lib/createToggleContext"

export type MeterPreviewStyle = "calculator" | "invoice" | "narrative" | "developer"

const { Provider: MeterPreviewStyleProvider, useValue } =
  createToggleContext<MeterPreviewStyle>("MeterPreviewStyle", "calculator", true)

function useMeterPreviewStyle() {
  const { value: meterPreviewStyle, setValue: setMeterPreviewStyle } = useValue()
  return { meterPreviewStyle, setMeterPreviewStyle }
}

export { MeterPreviewStyleProvider, useMeterPreviewStyle }
