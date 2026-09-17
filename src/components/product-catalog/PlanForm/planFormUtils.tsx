import type { KeyboardEvent, ReactNode } from "react"
import type { ProductFormStyle } from "@/components/creation-workspace/productFormStyle"

export function getPlanFormTokens(style: ProductFormStyle) {
  const isRefresh = style === "refresh"
  const isSail = style === "sail"
  return {
    prefixInputWrapper: isRefresh
      ? "flex h-[32px] w-full items-center gap-[8px] rounded-[6px] border border-[#D5DEE7] bg-white px-[12px] text-[13px] font-[400] text-[#142234]"
      : isSail
        ? "flex h-[30px] w-full items-center gap-[8px] rounded-[6px] border border-[#D8DEE4] bg-white px-[12px] text-[14px] font-[400] text-[#353A44]"
        : "flex h-[30px] w-full items-center gap-[8px] rounded-[6px] border border-[#D8DEE4] bg-white px-[12px] text-[12px] font-[500] text-[#353A44]",
    prefixColor: isRefresh ? "text-[#68778B]" : "text-[#6C7688]",
    // Form section heading (e.g. "Item settings"). Refresh uses the larger 14/675
    // heading; compact/sail keep the existing 12/500.
    sectionTitle: isRefresh
      ? "text-[14px] font-[675] leading-[20px] tracking-[-0.07px] text-[#142234]"
      : "text-[12px] font-[500] text-[#353A44]",
    selectorButton: isRefresh
      ? "h-[32px] justify-between px-[12px] py-[6px] text-[13px] font-[400] leading-[20px] text-[#142234]"
      : isSail
        ? "h-[30px] justify-between px-[12px] py-[6px] text-[14px] font-[400] leading-[20px] text-[#353A44]"
        : "h-[30px] justify-between px-[12px] py-[6px] text-[12px] font-[500] leading-[16px] text-[#353A44]",
    advancedButton: isRefresh
      ? "mx-4 flex cursor-pointer items-center justify-between rounded-[8px] px-4 py-[8px] transition-colors duration-150 hover:bg-[#F6F9FC]"
      : "mx-4 flex cursor-pointer items-center justify-between rounded-[8px] px-4 py-[8px] transition-colors duration-150 hover:bg-[#F5F6F8]",
    advancedLabel: isRefresh
      ? "text-[13px] font-[675] leading-[20px] tracking-[-0.065px] text-[#142234]"
      : isSail
        ? "text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#353A44]"
        : "text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#1A2C44]",
    trashButton: isRefresh
      ? "flex h-[32px] w-[32px] items-center justify-center rounded-[6px] text-[#474E5A] hover:bg-[#F6F9FC]"
      : "flex h-[32px] w-[32px] items-center justify-center rounded-[6px] text-[#474E5A] hover:bg-[#F5F6F8]",
    inlineAddButton: isRefresh
      ? "inline-flex h-[26px] self-start items-center rounded-[6px] border border-[#EAF0F6] bg-white px-[8px] text-[13px] font-[500] leading-[20px] tracking-[-0.065px] text-[#142234] hover:bg-[#F6F9FC] transition-colors"
      : isSail
        ? "inline-flex h-[26px] self-start items-center rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#353A44] shadow-[0_0.5px_1px_rgba(0,0,0,0.20)] hover:bg-[#F5F6F8] transition-colors"
        : "inline-flex h-[26px] self-start items-center rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#353A44] shadow-[0_0.5px_1px_rgba(0,0,0,0.20)] hover:bg-[#F5F6F8] transition-colors",
  }
}

/**
 * Inline validation error message shown below a field.
 * Renders a red exclamation icon + error text matching the Figma design.
 */
export function FieldError({ message }: { message: string | undefined }) {
  if (!message) return null
  return (
    <div className="mt-[4px] flex items-center gap-[4px]">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <path d="M5.14226 3.74023C5.06719 3.21774 5.47254 2.75 6.0004 2.75C6.52798 2.75 6.93325 3.21728 6.85863 3.73956L6.57215 5.74497C6.53095 6.03334 6.28118 6.24573 5.98994 6.24004C5.70742 6.23452 5.4705 6.02512 5.43032 5.74542L5.14226 3.74023Z" fill="#E61947" />
        <path d="M7 8C7 8.5514 6.5514 9 6 9C5.4486 9 5 8.5514 5 8C5 7.4486 5.4486 7 6 7C6.5514 7 7 7.4486 7 8Z" fill="#E61947" />
        <path fillRule="evenodd" clipRule="evenodd" d="M12 5.99999C12 9.31404 9.31405 12 6 12C2.68595 12 0 9.31404 0 5.99999C0 2.68595 2.68595 0 6 0C9.32231 0 12 2.68595 12 5.99999ZM10.6 5.99999C10.6 8.54085 8.54085 10.6 6 10.6C3.45915 10.6 1.4 8.54085 1.4 5.99999C1.4 3.45915 3.45915 1.4 6 1.4C8.54786 1.4 10.6 3.45789 10.6 5.99999Z" fill="#E61947" />
      </svg>
      <span className="text-[11px] font-[500] leading-[14px] text-[#DF1B41]">{message}</span>
    </div>
  )
}

/**
 * CSS classes for detail chips (used in advanced settings toggles)
 */
export const detailChipClasses =
  "flex h-[32px] items-center overflow-clip rounded-[6px] bg-[#F5F6F8] px-[10px] py-[8px] text-[12px] font-[500] leading-[16px] text-[#353A44] hover:bg-[#EBEEF1] transition-colors"

/**
 * CSS classes for inline add buttons (e.g. "Add meta data")
 */
export const inlineAddButtonClasses =
  "inline-flex h-[26px] self-start items-center rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#353A44] shadow-[0_0.5px_1px_rgba(0,0,0,0.20)] hover:bg-[#F5F6F8] transition-colors"

/**
 * Count filled metadata entries for a given ID
 */
export function countFilledMetadataEntries(
  valuesForId: Record<number, { key: string; value: string }> | undefined,
  rows: number[]
): number {
  let count = 0
  for (const rowId of rows) {
    const entry = valuesForId?.[rowId]
    const key = (entry?.key ?? "").trim()
    const value = (entry?.value ?? "").trim()
    if (key || value) count += 1
  }
  return count
}

export { focusElement } from "@/lib/focusElement"

/**
 * Creates a helper for checking if a key is highlighted
 */
export function createHighlightChecker(assistantHighlightedKeys: string[] = []) {
  return (key: string) => assistantHighlightedKeys.includes(key)
}

/**
 * Creates a helper for getting highlight CSS class
 */
export function createHighlightClassGetter(assistantHighlightedKeys: string[] = []) {
  return (key: string) =>
    assistantHighlightedKeys.includes(key) ? "!border-l-[3px] !border-l-[#533AFD]" : ""
}

/**
 * Creates a helper for checking if a key is in loading state
 */
export function createLoadingChecker(assistantLoadingKeys: string[] = []) {
  return (key: string) => assistantLoadingKeys.includes(key)
}

/**
 * Creates an onKeyDown handler that closes the form when Enter is pressed
 */
export function createEnterToCloseHandler(closeForm: () => void) {
  return (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      closeForm()
    }
  }
}

/**
 * Renders a chip with a label and value
 */
export function chipWithValue(label: string, value: string | number): ReactNode {
  return (
    <div className="flex items-center gap-[6px]">
      <span className="text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44]">{label}</span>
      <span className="max-w-[140px] truncate rounded-[4px] bg-[#D8DEE4] px-[3px] py-[2px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44]">
        {value}
      </span>
    </div>
  )
}
