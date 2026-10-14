'use client'

import { createToggleContext } from "@/lib/createToggleContext"

export type CustomerFormLayout = "stacked" | "tree" | "tabs"

const { Provider: CustomerFormLayoutProvider, useValue } =
  createToggleContext<CustomerFormLayout>("CustomerFormLayout", "stacked", true)

function useCustomerFormLayout() {
  const { value: customerFormLayout, setValue: setCustomerFormLayout } = useValue()
  return { customerFormLayout, setCustomerFormLayout }
}

export { CustomerFormLayoutProvider, useCustomerFormLayout }
