'use client'

import { createToggleContext } from "@/lib/createToggleContext"

const { Provider: NavHugContentProvider, useValue } =
  createToggleContext<boolean>("NavHugContent", true, true)

function useNavHugContent() {
  const { value: navHugContent, setValue: setNavHugContent } = useValue()
  return { navHugContent, setNavHugContent }
}

export { NavHugContentProvider, useNavHugContent }
