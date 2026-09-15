'use client'

import { createToggleContext } from "@/lib/createToggleContext"

export type AccountPropertiesLayout = "combined" | "separate"

const { Provider: AccountPropertiesLayoutProvider, useValue } =
  createToggleContext<AccountPropertiesLayout>("AccountPropertiesLayout", "separate", true)

function useAccountPropertiesLayout() {
  const { value: accountPropertiesLayout, setValue: setAccountPropertiesLayout } = useValue()
  return { accountPropertiesLayout, setAccountPropertiesLayout }
}

export { AccountPropertiesLayoutProvider, useAccountPropertiesLayout }
