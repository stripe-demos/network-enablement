'use client'

import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"

/**
 * Shared, style-aware checkbox used across creation-workspace forms.
 * Replaces the divergent per-form checkbox implementations so all forms
 * render the same size, colors, and checkmark for a given UI style.
 */
export function Checkbox({
  checked,
  onChange,
  className,
  label,
  decorative = false,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
  label?: string
  decorative?: boolean
}) {
  const { productFormStyle } = useProductFormStyle()
  const isSail = productFormStyle === "sail"
  const isRefresh = productFormStyle === "refresh"

  const sizeClass = isSail ? "h-[16px] w-[16px] rounded-[4px]" : "h-[14px] w-[14px] rounded-[3px]"
  const checkedClass = isRefresh ? "border-[#2C219E] bg-[#2C219E]" : "border-[#675DFF] bg-[#675DFF]"
  const uncheckedClass = isRefresh ? "border-[#D8E1EA] bg-white" : "border-[#C0C8D2] bg-white"
  const boxClass = `flex shrink-0 items-center justify-center border transition-colors ${sizeClass} ${
    checked ? checkedClass : uncheckedClass
  } ${className ?? ""}`

  if (decorative) {
    return (
      <span aria-hidden="true" className={boxClass}>
        {checked ? (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
    )
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={boxClass}
    >
      {checked && (
        <svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden="true">
          <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}
