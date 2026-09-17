'use client'

import { createToggleContext } from "@/lib/createToggleContext"

export type FormPanelSide = "hidden" | "float-left" | "fixed-left" | "fixed-right" | "float-right"

const { Provider: FormPanelSideProvider, useValue } =
  createToggleContext<FormPanelSide>("FormPanelSide", "fixed-left")

function useFormPanelSide() {
  const { value: side, setValue: setSide } = useValue()
  return { side, setSide }
}

export { FormPanelSideProvider, useFormPanelSide }
