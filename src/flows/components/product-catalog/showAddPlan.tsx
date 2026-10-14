'use client'

import { createToggleContext } from "@/lib/createToggleContext"

const { Provider: ShowAddPlanProvider, useValue } =
  createToggleContext<boolean>("ShowAddPlan", false)

function useShowAddPlan() {
  const { value: showAddPlan, setValue: setShowAddPlan } = useValue()
  return { showAddPlan, setShowAddPlan }
}

export { ShowAddPlanProvider, useShowAddPlan }
