'use client'

import { createToggleContext } from "@/lib/createToggleContext"

export type FilterPlacement = "hidden" | "form" | "nav" | "above"

const { Provider: FilterPlacementProvider, useValue } =
  createToggleContext<FilterPlacement>("FilterPlacementV2", "hidden", true)

function useFilterPlacement() {
  const { value: filterPlacement, setValue: setFilterPlacement } = useValue()
  return { filterPlacement, setFilterPlacement }
}

export { FilterPlacementProvider, useFilterPlacement }
