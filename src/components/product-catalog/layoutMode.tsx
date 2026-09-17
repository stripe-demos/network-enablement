'use client'

import { createToggleContext } from "@/lib/createToggleContext"

/**
 * Layout A: Default layout where the preview/map/code takes the main area
 * Layout B: Side preview layout where the preview is permanently on the right side,
 *           and map/code takes the left side
 */
export type LayoutMode = "A" | "B"

const { Provider: LayoutModeProvider, useValue } =
  createToggleContext<LayoutMode>("LayoutMode", "B")

function useLayoutMode() {
  const { value: layoutMode, setValue: setLayoutMode } = useValue()
  return { layoutMode, setLayoutMode }
}

export { LayoutModeProvider, useLayoutMode }
