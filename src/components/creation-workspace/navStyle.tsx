'use client'

import { createToggleContext } from "@/lib/createToggleContext"

// "compose" = a single flat form with no page nav; optional groups are added via
// "+ Add …" chips (the compose-disclosure pattern). Used by the Subscription example.
export type NavStyle = "sidebar" | "tabs" | "compose"

const { Provider: NavStyleProvider, useValue } =
  createToggleContext<NavStyle>("NavStyle", "tabs", true)

function useNavStyle() {
  const { value: navStyle, setValue: setNavStyle } = useValue()
  return { navStyle, setNavStyle }
}

export { NavStyleProvider, useNavStyle }
