'use client'

import { createToggleContext } from "@/lib/createToggleContext"

export type AccountSelectionStyle = "picker" | "related-modal" | "source-toggle"

const { Provider: AccountSelectionStyleProvider, useValue } =
  createToggleContext<AccountSelectionStyle>("AccountSelectionStyle", "picker", true)

function useAccountSelectionStyle() {
  const { value: accountSelectionStyle, setValue: setAccountSelectionStyle } = useValue()
  return { accountSelectionStyle, setAccountSelectionStyle }
}

export { AccountSelectionStyleProvider, useAccountSelectionStyle }
