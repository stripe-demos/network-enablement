'use client'

import { createToggleContext } from "@/lib/createToggleContext"

// How a Simple form progressively discloses its optional groups. Shared across the
// Customer, Invoice, and Coupon examples (via OptionalGroups / the live specimens):
//  - 'rows'   → defaulted review rows (every group shown, Edit reveals its fields)  [default]
//  - 'pills'  → compose it one open at a time ("+ Add …" ghost chips)
// Both live as specimens in SectionedExplorations; this setting picks which the
// live examples use. Toggled from the Options panel.
export type CustomerDisclosure = 'pills' | 'rows'

const { Provider: CustomerDisclosureProvider, useValue } =
  createToggleContext<CustomerDisclosure>("CustomerDisclosure", "rows", true)

function useCustomerDisclosure() {
  const { value: customerDisclosure, setValue: setCustomerDisclosure } = useValue()
  return { customerDisclosure, setCustomerDisclosure }
}

export { CustomerDisclosureProvider, useCustomerDisclosure }
