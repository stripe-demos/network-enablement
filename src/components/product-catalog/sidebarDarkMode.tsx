'use client'

import { createToggleContext } from "@/lib/createToggleContext"

const { Provider: SidebarDarkModeProvider, useValue } =
  createToggleContext<boolean>("SidebarDarkMode", false)

function useSidebarDarkMode() {
  const { value: sidebarDarkMode, setValue: setSidebarDarkMode } = useValue()
  return { sidebarDarkMode, setSidebarDarkMode }
}

export { SidebarDarkModeProvider, useSidebarDarkMode }
