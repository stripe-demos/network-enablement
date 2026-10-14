'use client'

import { createToggleContext } from "@/lib/createToggleContext"

export type ContextualToolStyle = "annotation" | "tray" | "popover"

const { Provider: ContextualToolStyleProvider, useValue } =
  createToggleContext<ContextualToolStyle>("ContextualToolStyle", "tray", true)

function useContextualToolStyle() {
  const { value: toolStyle, setValue: setToolStyle } = useValue()
  return { toolStyle, setToolStyle }
}

export { ContextualToolStyleProvider, useContextualToolStyle }
