'use client'

import { createToggleContext } from "@/lib/createToggleContext"

export type AccountConflictNudgeMode = "automatic" | "always" | "off"

const { Provider: AccountConflictNudgeModeProvider, useValue } =
  createToggleContext<AccountConflictNudgeMode>("AccountConflictNudgeMode", "automatic", true)

function useAccountConflictNudgeMode() {
  const { value: accountConflictNudgeMode, setValue: setAccountConflictNudgeMode } = useValue()
  return { accountConflictNudgeMode, setAccountConflictNudgeMode }
}

export { AccountConflictNudgeModeProvider, useAccountConflictNudgeMode }
