'use client'

import { createToggleContext } from "@/lib/createToggleContext"

export type NavLayoutMode = "horizontal" | "vertical" | "drawer" | "modal" | "ideal" | "intent" | "navigate" | "compose"

const { Provider: NavLayoutModeProvider, useValue } =
  createToggleContext<NavLayoutMode>("NavLayoutMode", "modal", true)

function useNavLayoutMode() {
  const { value: navLayout, setValue: setNavLayout } = useValue()
  return { navLayout, setNavLayout }
}

export { NavLayoutModeProvider, useNavLayoutMode }
