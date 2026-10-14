'use client'

import { createToggleContext } from "@/lib/createToggleContext"

export type CascadeAlignment = "top" | "center"

const { Provider: CascadeAlignmentProvider, useValue } =
  createToggleContext<CascadeAlignment>("CascadeAlignment", "top")

function useCascadeAlignment() {
  const { value: cascadeAlignment, setValue: setCascadeAlignment } = useValue()
  return { cascadeAlignment, setCascadeAlignment }
}

export { CascadeAlignmentProvider, useCascadeAlignment }
