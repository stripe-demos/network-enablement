'use client'

import { createToggleContext } from "@/lib/createToggleContext"

export type LayoutSplit = "fixed" | "equal" | "centered"

const { Provider: LayoutSplitProvider, useValue } =
  createToggleContext<LayoutSplit>("LayoutSplit", "fixed", true)

function useLayoutSplit() {
  const { value: layoutSplit, setValue: setLayoutSplit } = useValue()
  return { layoutSplit, setLayoutSplit }
}

export { LayoutSplitProvider, useLayoutSplit }
