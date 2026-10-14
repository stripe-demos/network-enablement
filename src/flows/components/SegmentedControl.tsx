'use client'

import { useLayoutEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { useSegmentedStyle } from "@/components/creation-workspace/segmentedStyle"

type SegmentedControlProps<T extends string> = {
  value: T
  onChange: (next: T) => void
  options: readonly T[]
  getDisplayValue?: (value: T) => string
  className?: string
  buttonClassName?: string
  /**
   * Hug content width and left-align instead of stretching each option to equal width.
   * Only affects the "segmented" (shared-track) style — the "toggle" style always hugs.
   */
  fitContent?: boolean
  /**
   * Use a slightly darker track. For the shared-track ("segmented") style only — set
   * this when the control sits on a grey surface (e.g. a filled/tinted child setting)
   * so its track stands out instead of blending grey-on-grey.
   */
  contrast?: boolean
  variantOverride?: "segmented" | "toggle"
  onFocus?: () => void
  onBlur?: () => void
}

/**
 * Pick one of a small set of mutually exclusive options. Two looks, chosen via the
 * "Segmented style" option (`useSegmentedStyle`):
 * - "segmented" (default): classic shared-track control with a white selected chip.
 *   Fills its row by default; pass `fitContent` to hug.
 * - "toggle": Sail Toggle — individual bordered pills; the selected pill takes an
 *   accent inset-ring + accent label. Ring is a box-shadow (not a layout border), so
 *   selecting never shifts size and pill height is controlled purely by padding.
 *   Always hugs its content (left-aligned), so it never stretches to fill the row.
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  getDisplayValue,
  className,
  buttonClassName,
  fitContent,
  contrast,
  variantOverride,
  onFocus,
  onBlur,
}: SegmentedControlProps<T>) {
  const { productFormStyle } = useProductFormStyle()
  const { segmentedStyle } = useSegmentedStyle()
  const resolvedSegmentedStyle = variantOverride ?? segmentedStyle
  // Toggle style hugs; segmented style fills (unless fitContent). See reference_segmentedcontrol-contract.
  const isRefresh = productFormStyle === "refresh"
  const isSail = productFormStyle === "sail"
  const buttonRefs = useRef(new Map<T, HTMLButtonElement>())
  const pillRef = useRef<HTMLSpanElement>(null)
  const [pillStyle, setPillStyle] = useState({ width: 0, x: 0 })

  useLayoutEffect(() => {
    const selected = buttonRefs.current.get(value)
    const pill = pillRef.current
    if (!selected || !pill) return

    const write = (animate: boolean) => {
      if (!animate) {
        const previous = pill.style.transition
        pill.style.transition = "none"
        setPillStyle({ width: selected.offsetWidth, x: selected.offsetLeft })
        requestAnimationFrame(() => {
          void pill.offsetWidth
          pill.style.transition = previous
        })
        return
      }
      setPillStyle({ width: selected.offsetWidth, x: selected.offsetLeft })
    }

    write(pillStyle.width !== 0)
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => write(false))
    observer.observe(selected)
    selected.parentElement && observer.observe(selected.parentElement)
    return () => observer.disconnect()
  }, [value, options, pillStyle.width])

  if (resolvedSegmentedStyle === "toggle") {
    const gap = isRefresh ? "gap-[4px]" : "gap-[8px]"
    const shape = isRefresh
      ? "rounded-[8px] px-[12px] py-[7px]"
      : isSail
        ? "rounded-[8px] px-[12px] py-[8px]"
        : "rounded-[6px] px-[12px] py-[6px]"
    const textSize = isRefresh
      ? "text-[13px] leading-[20px] tracking-[-0.065px]"
      : isSail
        ? "text-[14px] leading-[20px] tracking-[-0.15px]"
        : "text-[12px] leading-[16px] tracking-[-0.024px]"
    const selectedClass = isRefresh
      ? "bg-white font-[600] text-[#142234] shadow-[inset_0_0_0_1.5px_#142234]"
      : isSail
        ? "bg-white font-[600] text-[#273951] shadow-[inset_0_0_0_2px_#273951]"
        : "bg-white font-[600] text-[#533AFD] shadow-[inset_0_0_0_2px_#533AFD]"
    const unselectedClass = isRefresh
      ? "bg-white font-[400] text-[#526378] shadow-[inset_0_0_0_1px_#EAF0F6] hover:shadow-[inset_0_0_0_1px_#D5DEE7]"
      : "bg-white font-[600] text-[#1A2C44] shadow-[inset_0_0_0_1px_#D4DEE9] hover:bg-[#F5F6F8]"

    // The toggle style always hugs its content and left-aligns — it never stretches to
    // fill the row, regardless of `fitContent`.
    return (
      <div
        className={cn("flex w-fit items-center justify-start", gap, className)}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        {options.map((option) => {
          const isSelected = option === value
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={cn(
                "flex items-center justify-center whitespace-nowrap transition-colors",
                shape,
                textSize,
                buttonClassName,
                isSelected ? selectedClass : unselectedClass,
              )}
              aria-pressed={isSelected}
            >
              {getDisplayValue ? getDisplayValue(option) : option}
            </button>
          )
        })}
      </div>
    )
  }

  // Default — classic shared-track segmented control.
  const flexClass = fitContent ? "" : "flex-1"
  // On a grey surface the normal track blends in, so `contrast` bumps it a shade darker.
  const trackBg = isRefresh
    ? (contrast ? "bg-[#E1EAF3]" : "bg-[#F1F6FB]")
    : isSail
      ? (contrast ? "bg-[#E9EBEF]" : "bg-[#F5F6F8]")
      : (contrast ? "bg-[#DFE7EF]" : "bg-[#ECF1F6]")
  const trackClass = isRefresh
    ? `t-tabs flex h-[32px] items-center justify-center rounded-full ${trackBg} p-[2px]`
    : isSail
      ? `t-tabs flex h-[30px] items-center justify-center rounded-[6px] ${trackBg} p-[1px]`
      : `t-tabs flex h-[28px] items-center justify-center rounded-[6px] ${trackBg} p-[1px]`
  const buttonSizeClass = isRefresh
    ? "px-[12px] py-[6px] text-[13px] leading-[20px] tracking-[-0.065px]"
    : isSail
      ? "px-[8px] text-[14px] leading-[20px] tracking-[-0.15px]"
      : "px-[12px] py-[6px] text-[12px] leading-[16px] tracking-[-0.024px]"
  const buttonSelectedClass = isRefresh
    ? "rounded-full border border-transparent font-[500] text-[#142234]"
    : isSail
      ? "rounded-[5px] border border-transparent font-[400] text-[#353A44]"
      : "rounded-[6px] border border-transparent font-[500] text-[#353A44]"
  const buttonUnselectedClass = isRefresh
    ? "rounded-full border border-transparent font-[400] text-[#526378] hover:bg-[#EAF0F6]"
    : isSail
      ? "rounded-[5px] border border-transparent font-[400] text-[#596171] hover:bg-[#EBEEF1] hover:text-[#353A44]"
      : "rounded-[4px] border border-transparent font-[500] text-[#50617A] hover:bg-[#D4DEE9]"
  const pillClass = isRefresh
    ? "top-[2px] h-[28px] rounded-full border border-[#D5DEE7] bg-white"
    : isSail
      ? "top-[1px] h-[28px] rounded-[5px] border border-[#D8DEE4] bg-white"
      : "top-[1px] h-[26px] rounded-[5px] border border-[#D4DEE9] bg-white"

  return (
    <div
      className={cn(trackClass, fitContent ? "w-fit" : "w-full", className)}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <span
        ref={pillRef}
        aria-hidden="true"
        className={cn("t-tabs-pill", pillClass)}
        style={{ width: pillStyle.width, transform: `translateX(${pillStyle.x}px)` }}
      />
      {options.map((option) => {
        const isSelected = option === value
        return (
          <button
            key={option}
            ref={(node) => {
              if (node) buttonRefs.current.set(option, node)
              else buttonRefs.current.delete(option)
            }}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "flex h-full items-center justify-center transition-colors whitespace-nowrap",
              buttonSizeClass,
              flexClass,
              buttonClassName,
              isSelected ? buttonSelectedClass : buttonUnselectedClass,
            )}
            aria-pressed={isSelected}
          >
            {getDisplayValue ? getDisplayValue(option) : option}
          </button>
        )
      })}
    </div>
  )
}
