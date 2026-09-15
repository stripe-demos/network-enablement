'use client'

import { createToggleContext } from "@/lib/createToggleContext"

const { Provider: NarrowFormWidthProvider, useValue } =
  createToggleContext<boolean>("NarrowFormWidth", false, true)

function useNarrowFormWidth() {
  const { value: narrowFormWidth, setValue: setNarrowFormWidth } = useValue()
  return { narrowFormWidth, setNarrowFormWidth }
}

export { NarrowFormWidthProvider, useNarrowFormWidth }
