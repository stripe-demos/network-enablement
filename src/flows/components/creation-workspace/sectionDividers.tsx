'use client'

import { createToggleContext } from "@/lib/createToggleContext"

// Default to Show (true): forms open with full-bleed dividers, which the "filled"
// child-setting default relies on to read as clean grey bands. The Options
// "Section dividers" toggle still turns them off.
const { Provider: SectionDividersProvider, useValue } =
  createToggleContext<boolean>("SectionDividers", true, true)

function useSectionDividers() {
  const { value: sectionDividers, setValue: setSectionDividers } = useValue()
  return { sectionDividers, setSectionDividers }
}

export { SectionDividersProvider, useSectionDividers }
