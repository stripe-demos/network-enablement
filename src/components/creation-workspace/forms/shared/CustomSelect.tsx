'use client'

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { CurrencyFlag, hasCurrencyFlag } from "@/components/CurrencyFlag"
import { getFormTokens } from "./formTokens"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { useInputFill } from "@/components/creation-workspace/inputFill"

export function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M3 4.5L6 7.5L9 4.5" stroke="#6C7688" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Refresh selects use an up/down "unfold" glyph (Figma node 196:400) rather than a rotating chevron.
export function UnfoldIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M5.5 6.5L8 4L10.5 6.5" stroke="#526378" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 9.5L8 12L10.5 9.5" stroke="#526378" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CustomSelect({ label, value, onChange, options, description, docsUrl, footerAction, buttonClassName, chevronIcon, dropdownOptionClassName, labelClassName }: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string; prefix?: string }[]
  description?: string
  docsUrl?: string
  buttonClassName?: string
  chevronIcon?: ReactNode
  dropdownOptionClassName?: string
  labelClassName?: string
  footerAction?: {
    label: string
    onClick: () => void
  }
}) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  const isRefresh = productFormStyle === "refresh"
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const useFloatingLabel = isRefresh && Boolean(label)
  const floatingControlClass = useFloatingLabel ? "!h-[46px] !pb-[6px] !pt-[18px]" : ""

  useEffect(() => {
    if (!isOpen) return
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [isOpen])

  const openDropdown = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    }
    setIsOpen(!isOpen)
  }, [isOpen])

  const selected = options.find((o) => o.value === value)

  return (
    <div className={`flex flex-col ${label ? "gap-[4px]" : ""}`}>
      {label && !useFloatingLabel && (
        <label className={labelClassName ?? tokens.labelClass}>
          {label}
          {docsUrl && (
            <>
              {" · "}
              <a href={docsUrl} target="_blank" rel="noopener noreferrer" className={`font-[400] ${isRefresh ? "text-[#2C219E]" : "text-[#533AFD]"} hover:underline`}>Docs</a>
            </>
          )}
        </label>
      )}
      <div ref={containerRef} className="relative">
        {useFloatingLabel && (
          <span className="pointer-events-none absolute left-[11px] top-[5px] z-10 text-[11px] font-[500] leading-[14px] tracking-[-0.04px] text-[#526378]">
            {label}
            {docsUrl ? " · Docs" : ""}
          </span>
        )}
        <button
          ref={buttonRef}
          type="button"
          data-input-control="true"
          className={buttonClassName ?? `flex w-full items-center justify-between rounded-[6px] ${tokens.inputClass} ${floatingControlClass}`}
          onClick={openDropdown}
        >
          <span className="flex items-center gap-[6px]">
            {selected && hasCurrencyFlag(selected.value) ? <CurrencyFlag currency={selected.value} size={16} /> : selected?.prefix ? <span>{selected.prefix}</span> : null}
            {selected?.label ?? value}
          </span>
          {chevronIcon ?? (isRefresh ? <UnfoldIcon /> : <ChevronIcon className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />)}
        </button>

        {isOpen && dropdownPos && createPortal(
          <div
            data-input-dropdown="true"
            data-origin="top-left"
            className={`t-dropdown is-open fixed z-[9999] rounded-[8px] border ${isRefresh ? "border-[#EAF0F6]" : "border-[#EBEEF1]"} bg-white py-[4px] shadow-[0px_4px_16px_rgba(0,0,0,0.08)]`}
            style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`flex w-full items-center justify-between px-[10px] py-[6px] text-left ${dropdownOptionClassName ?? "text-[12px]"} transition-colors ${isRefresh ? "hover:bg-[#F6F9FC]" : "hover:bg-[#F5F6F8]"} ${opt.value === value ? `font-[500] ${isRefresh ? "text-[#142234]" : "text-[#1A2C44]"}` : `font-[400] ${isRefresh ? "text-[#142234]" : "text-[#353A44]"}`}`}
                onClick={() => { onChange(opt.value); setIsOpen(false) }}
              >
                <span className="flex items-center gap-[6px]">
                  {hasCurrencyFlag(opt.value) ? <CurrencyFlag currency={opt.value} size={16} /> : opt.prefix ? <span>{opt.prefix}</span> : null}
                  {opt.label}
                </span>
                {opt.value === value && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#533AFD" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            ))}
            {footerAction && (
              <div className="mt-[4px] border-t border-[#F0F3F7] pt-[4px]">
                <button
                  type="button"
                  className={`flex w-full items-center gap-[6px] px-[10px] py-[6px] text-left text-[12px] font-[500] text-[#533AFD] transition-colors ${isRefresh ? "hover:bg-[#F6F9FC]" : "hover:bg-[#F5F6F8]"}`}
                  onClick={() => {
                    footerAction.onClick()
                    setIsOpen(false)
                  }}
                >
                  {footerAction.label}
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
      </div>
      {description && <p className={`text-[11px] ${isRefresh ? "text-[#526378]" : "text-[#6C7688]"}`}>{description}</p>}
    </div>
  )
}
