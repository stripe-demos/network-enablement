'use client'

import { createToggleContext } from "@/lib/createToggleContext"

export type AccountSelectionStyle = "current" | "profile-discovery" | "repeat"

const { Provider: AccountSelectionStyleProvider, useValue } =
  createToggleContext<AccountSelectionStyle>("AccountSelectionStyle", "profile-discovery", true)

function useAccountSelectionStyle() {
  const { value: accountSelectionStyle, setValue: setAccountSelectionStyle } = useValue()
  return { accountSelectionStyle, setAccountSelectionStyle }
}

export { AccountSelectionStyleProvider, useAccountSelectionStyle }
