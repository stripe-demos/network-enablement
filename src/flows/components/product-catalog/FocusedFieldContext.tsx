'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

type FocusedFieldContextValue = {
  focusedField: string | null
  setFocusedField: (field: string | null) => void
  hoveredField: string | null
  setHoveredField: (field: string | null) => void
  activeField: string | null
  activeFieldMode: "focus" | "hover" | null
}

const FocusedFieldContext = createContext<FocusedFieldContextValue>({
  focusedField: null,
  setFocusedField: () => {},
  hoveredField: null,
  setHoveredField: () => {},
  activeField: null,
  activeFieldMode: null,
})

export function FocusedFieldProvider({ children }: { children: ReactNode }) {
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [hoveredField, setHoveredField] = useState<string | null>(null)
  const value = useMemo<FocusedFieldContextValue>(() => {
    const activeField = focusedField ?? hoveredField
    const activeFieldMode: FocusedFieldContextValue["activeFieldMode"] = focusedField ? "focus" : hoveredField ? "hover" : null
    return { focusedField, setFocusedField, hoveredField, setHoveredField, activeField, activeFieldMode }
  }, [focusedField, hoveredField])
  return <FocusedFieldContext.Provider value={value}>{children}</FocusedFieldContext.Provider>
}

export function useFocusedField() {
  return useContext(FocusedFieldContext)
}
