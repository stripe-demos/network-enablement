'use client'

import { createToggleContext } from "@/lib/createToggleContext"

export type ModalSubStyle = "stacked" | "tabs" | "wizard" | "portal" | "paneShift" | "breadcrumbRail"

const { Provider: ModalSubStyleProvider, useValue } =
  createToggleContext<ModalSubStyle>("ModalSubStyle", "portal", true)

function useModalSubStyle() {
  const { value: modalSubStyle, setValue: setModalSubStyle } = useValue()
  return { modalSubStyle, setModalSubStyle }
}

export { ModalSubStyleProvider, useModalSubStyle }
