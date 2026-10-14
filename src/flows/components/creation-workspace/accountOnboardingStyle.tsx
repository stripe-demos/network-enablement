'use client'

import { createToggleContext } from "@/lib/createToggleContext"

export type AccountOnboardingStyle = "pre-save" | "toast-actions" | "success-page"

const { Provider: AccountOnboardingStyleProvider, useValue } =
  createToggleContext<AccountOnboardingStyle>("AccountOnboardingStyle", "success-page", true)

function useAccountOnboardingStyle() {
  const { value: accountOnboardingStyle, setValue: setAccountOnboardingStyle } = useValue()
  return { accountOnboardingStyle, setAccountOnboardingStyle }
}

export { AccountOnboardingStyleProvider, useAccountOnboardingStyle }
