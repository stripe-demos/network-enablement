'use client'

import { createToggleContext } from "@/lib/createToggleContext"

export type LayoutDirection = "horizontal" | "vertical"

const { Provider: LayoutDirectionProvider, useValue } =
  createToggleContext<LayoutDirection>("LayoutDirection", "horizontal")

function useLayoutDirection() {
  const { value: direction, setValue: setDirection } = useValue()
  return { direction, setDirection }
}

export { LayoutDirectionProvider, useLayoutDirection }
