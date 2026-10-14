'use client'

import { createToggleContext } from "@/lib/createToggleContext"

const { Provider: ShowAdditionalNodesProvider, useValue } =
  createToggleContext<boolean>("ShowAdditionalNodes", false)

function useShowAdditionalNodes() {
  const { value: showAdditionalNodes, setValue: setShowAdditionalNodes } = useValue()
  return { showAdditionalNodes, setShowAdditionalNodes }
}

export { ShowAdditionalNodesProvider, useShowAdditionalNodes }
