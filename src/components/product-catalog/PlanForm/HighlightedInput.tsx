"use client"

import { useEffect, useRef } from "react"
import type { ChangeEvent, FocusEvent, KeyboardEvent } from "react"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"

export type HighlightedInputProps = {
  highlightKey: string
  isHighlighted: (key: string) => boolean
  textFieldInputClasses: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void
  placeholder?: string
  ariaLabel?: string
  className?: string
  autoFocus?: boolean
}

export function HighlightedInput({
  highlightKey,
  isHighlighted,
  textFieldInputClasses,
  value,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  placeholder,
  ariaLabel,
  className,
  autoFocus,
}: HighlightedInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle focus when autoFocus becomes true (even if already mounted).
  // Use preventScroll to avoid the browser scrolling the form panel when the
  // input is already off-screen (e.g. during the inline get-started → details
  // form transition).
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus({ preventScroll: true })
      inputRef.current.select()
    }
  }, [autoFocus])

  const { productFormStyle } = useProductFormStyle()
  const highlightWrapper = productFormStyle === "refresh"
    ? "flex h-[32px] w-full items-center overflow-hidden rounded-[6px] border border-[#D5DEE7] border-l-[3px] border-l-[#533AFD] bg-white px-[12px] text-[13px] font-[400] text-[#142234]"
    : productFormStyle === "sail"
      ? "flex h-[30px] w-full items-center overflow-hidden rounded-[6px] border border-[#D8DEE4] border-l-[3px] border-l-[#533AFD] bg-white px-[12px] text-[14px] font-[400] text-[#353A44]"
      : "flex h-[30px] w-full items-center overflow-hidden rounded-[6px] border border-[#D8DEE4] border-l-[3px] border-l-[#533AFD] bg-white px-[12px] text-[12px] font-[500] text-[#353A44]"

  if (isHighlighted(highlightKey)) {
    return (
      <div
        className={`${highlightWrapper} ${className ?? ""}`}
      >
        <span className="truncate rounded-[3px] bg-[#E0D9FB] px-0.5">{value || placeholder}</span>
      </div>
    )
  }

  return (
    <input
      ref={inputRef}
      className={`${textFieldInputClasses} ${className ?? ""}`}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      aria-label={ariaLabel}
      // Intentionally not using HTML autoFocus — the effect above handles
      // focusing with { preventScroll: true } so the form panel doesn't jump
      // when this input mounts off-screen during a transition.
    />
  )
}

export function InputSkeleton() {
  const { productFormStyle } = useProductFormStyle()
  const borderColor = productFormStyle === "refresh" ? "border-[#EAF0F6]" : "border-[#D8DEE4]"
  return (
    <div className={`flex h-[30px] w-full items-center rounded-[6px] border ${borderColor} bg-white px-[12px]`}>
      <div className="h-[12px] w-[60%] animate-pulse rounded-[4px] bg-[#EBEEF1]" />
    </div>
  )
}
