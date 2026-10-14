'use client'

import { createToggleContext } from "@/lib/createToggleContext"

export type ComboboxStyle = "combobox" | "sel-link" | "sel-btn" | "sel-clear" | "sel-segmented" | "create-first"

const { Provider: ComboboxStyleProvider, useValue } =
  createToggleContext<ComboboxStyle>("ComboboxStyle", "sel-link")

function useComboboxStyle() {
  const { value: comboboxStyle, setValue: setComboboxStyle } = useValue()
  return { comboboxStyle, setComboboxStyle }
}

export { ComboboxStyleProvider, useComboboxStyle }
