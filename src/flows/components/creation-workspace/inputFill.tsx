'use client'

import { useEffect, type ReactNode } from "react"
import { createToggleContext } from "@/lib/createToggleContext"

const { Provider: BaseInputFillProvider, useValue } =
  createToggleContext<boolean>("InputFill", false, true)

function useInputFill() {
  const { value: inputFill, setValue: setInputFill } = useValue()
  return { inputFill, setInputFill }
}

function InputFillAttributeSync() {
  const { inputFill } = useInputFill()

  useEffect(() => {
    document.documentElement.dataset.inputFill = inputFill ? "filled" : "white"
  }, [inputFill])

  return null
}

function InputFillProvider({ children, initial }: { children: ReactNode; initial?: boolean }) {
  return (
    <BaseInputFillProvider initial={initial}>
      <InputFillAttributeSync />
      {children}
    </BaseInputFillProvider>
  )
}

export { InputFillProvider, useInputFill }
