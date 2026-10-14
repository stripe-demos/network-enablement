'use client'

import { createToggleContext } from "@/lib/createToggleContext"

/** "+" menu: contextual kinds vs all kinds in the workflow config. */
export type AddMenuMode = "contextual" | "general"

const { Provider: AddMenuModeProvider, useValue } =
  createToggleContext<AddMenuMode>("AddMenuMode", "contextual")

function useAddMenuMode() {
  const { value: addMenuMode, setValue: setAddMenuMode } = useValue()
  return { addMenuMode, setAddMenuMode }
}

export { AddMenuModeProvider, useAddMenuMode }
