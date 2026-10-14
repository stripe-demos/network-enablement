'use client'

import { createToggleContext } from "@/lib/createToggleContext"

// "segmented" = classic shared-track segmented control (the original look, default).
// "toggle" = the new Sail Toggle: individual bordered pills.
export type SegmentedStyle = "segmented" | "toggle"

const { Provider: SegmentedStyleProvider, useValue } =
  createToggleContext<SegmentedStyle>("SegmentedStyle", "segmented", true)

function useSegmentedStyle() {
  const { value: segmentedStyle, setValue: setSegmentedStyle } = useValue()
  return { segmentedStyle, setSegmentedStyle }
}

export { SegmentedStyleProvider, useSegmentedStyle }
