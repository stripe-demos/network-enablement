'use client'

import { createToggleContext } from "@/lib/createToggleContext"

/**
 * Expand: Current behaviour — left dock expands to full width, sidebar slides away,
 *         header swaps to BulkRateEditor's internal title row.
 * Inline: Nav stays in place, only the form area swaps to the bulk-edit spreadsheet.
 * Header: Left dock expands, sidebar slides away, but the modal header stays in place
 *         and cross-fades its contents (plan name -> "Editing N rates", buttons fade out).
 */
export type BulkEditTransition = "expand" | "inline" | "header"

const { Provider: BulkEditTransitionProvider, useValue } =
  createToggleContext<BulkEditTransition>("BulkEditTransition", "header")

function useBulkEditTransition() {
  const { value: bulkEditTransition, setValue: setBulkEditTransition } = useValue()
  return { bulkEditTransition, setBulkEditTransition }
}

export { BulkEditTransitionProvider, useBulkEditTransition }
