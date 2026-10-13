'use client'

import { createToggleContext } from "@/lib/createToggleContext"

export type AccountSelectionStyle = "current" | "refined" | "repeat"

const { Provider: AccountSelectionStyleProvider, useValue } =
  createToggleContext<AccountSelectionStyle>("AccountSelectionStyle", "refined", true)

function useAccountSelectionStyle() {
  const { value: accountSelectionStyle, setValue: setAccountSelectionStyle } = useValue()
  return { accountSelectionStyle, setAccountSelectionStyle }
}

export { AccountSelectionStyleProvider, useAccountSelectionStyle }
