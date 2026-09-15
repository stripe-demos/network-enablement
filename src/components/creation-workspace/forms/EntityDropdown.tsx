'use client'

import { useState, useRef, useEffect, useImperativeHandle, useLayoutEffect, forwardRef, type KeyboardEvent, type ReactNode } from "react"
import { getFormTokens } from "./shared/formTokens"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { useInputFill } from "@/components/creation-workspace/inputFill"
import { AddSmallIcon } from "@/components/ProductCatalogIcons"

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="#6C7688" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export type EntityItem = {
  id: string
  name: string
  detail?: string
}

export type EntityDropdownHandle = {
  open: () => void
}

type EntityDropdownProps = {
  label: string
  placeholder: string
  searchPlaceholder: string
  items: EntityItem[]
  /** Optional searchable text for an item. Defaults to the item name. */
  getSearchText?: (item: EntityItem) => string
  selectedId: string
  /** Custom display label when selected item is not in items list (e.g. newly created) */
  selectedLabel?: string
  /** Render the selected label in placeholder style (lighter grey) */
  selectedIsPlaceholder?: boolean
  onSelect: (id: string) => void
  /** Optional create action shown below the results. */
  addNewLabel?: string
  onAddNew?: () => void
  /** Called when the user clicks "Edit" next to the label (only shown when an item is selected) */
  onEdit?: () => void
  hasError?: boolean
  errorMessage?: string
  highlight?: boolean
  initialOpen?: boolean
  labelClassName?: string
  inputClassName?: string
  errorInputClassName?: string
  chevronIcon?: ReactNode
  optionNameClassName?: string
  optionDetailClassName?: string
  renderOption?: (item: EntityItem) => ReactNode
  addNewClassName?: string
  noResultsClassName?: string
  autoFocus?: boolean
  /** Inset result and create-action hover surfaces by 4px with a 4px radius. */
  insetOptionHover?: boolean
}

export const EntityDropdown = forwardRef<EntityDropdownHandle, EntityDropdownProps>(function EntityDropdown({
  label,
  placeholder,
  searchPlaceholder,
  items,
  getSearchText,
  selectedId,
  selectedLabel,
  selectedIsPlaceholder,
  onSelect,
  addNewLabel,
  onAddNew,
  onEdit,
  hasError,
  errorMessage,
  highlight,
  initialOpen,
  labelClassName,
  inputClassName,
  errorInputClassName,
  chevronIcon,
  optionNameClassName,
  optionDetailClassName,
  renderOption,
  addNewClassName,
  noResultsClassName,
  autoFocus,
  insetOptionHover = false,
}, ref) {
  const { productFormStyle } = useProductFormStyle()
  const { inputFill } = useInputFill()
  const tokens = getFormTokens(productFormStyle, { filled: inputFill })
  const isRefresh = productFormStyle === "refresh"
  const [isOpen, setIsOpen] = useState(false)
  const initialOpenRef = useRef(initialOpen)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef(new Map<string, HTMLButtonElement>())
  const [activeIndex, setActiveIndex] = useState(0)

  useImperativeHandle(ref, () => ({
    open() {
      setIsOpen(true)
      setTimeout(() => inputRef.current?.focus(), 0)
    },
  }))

  useEffect(() => {
    if (initialOpenRef.current) {
      setIsOpen(true)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [])

  useEffect(() => {
    if (!autoFocus || initialOpenRef.current) return
    requestAnimationFrame(() => buttonRef.current?.focus({ preventScroll: true }))
  }, [autoFocus])

  useEffect(() => {
    if (!isOpen) return
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [isOpen])

  const normalizedSearch = search.toLowerCase()
  const filtered = items.filter((item) =>
    (getSearchText?.(item) ?? item.name).toLowerCase().includes(normalizedSearch)
  )

  const selected = items.find((item) => item.id === selectedId)
  const selectedIndex = filtered.findIndex((item) => item.id === selectedId)
  const preferredIndex = search ? 0 : Math.max(selectedIndex, 0)
  const displayText = selected ? selected.name : selectedLabel || ""
  const hasSelection = !!(selected || selectedLabel)
  const ic = hasError ? (errorInputClassName ?? tokens.errorInputClass) : (inputClassName ?? tokens.inputClass)
  const useFloatingLabel = isRefresh && Boolean(label)
  const floatingControlClass = useFloatingLabel ? "!h-[48px] !rounded-[8px] !pb-[7px] !pt-[19px]" : ""

  const highlightClass = highlight
    ? "rounded-[8px] shadow-[0_0_0_2px_#533AFD] transition-all duration-500"
    : ""

  useEffect(() => {
    if (!isOpen) return
    setActiveIndex(Math.min(preferredIndex, Math.max(filtered.length - 1, 0)))
  }, [isOpen, search, selectedId, filtered.length, preferredIndex])

  useLayoutEffect(() => {
    if (!isOpen) return
    const activeItem = filtered[activeIndex]
    if (!activeItem) return
    optionRefs.current.get(activeItem.id)?.scrollIntoView({ block: "nearest" })
  }, [isOpen, activeIndex, filtered])

  useEffect(() => {
    if (!isOpen || !isRefresh) return
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [isOpen, isRefresh])

  const closeDropdown = () => {
    setIsOpen(false)
    setSearch("")
  }

  const selectItem = (item: EntityItem) => {
    onSelect(item.id)
    closeDropdown()
    requestAnimationFrame(() => buttonRef.current?.focus({ preventScroll: true }))
  }

  const moveActive = (direction: 1 | -1) => {
    setActiveIndex((current) => {
      if (filtered.length === 0) return 0
      return (current + direction + filtered.length) % filtered.length
    })
  }

  const handleOpenKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      moveActive(1)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      moveActive(-1)
    } else if (event.key === "Enter") {
      event.preventDefault()
      const activeItem = filtered[activeIndex]
      if (activeItem) selectItem(activeItem)
    } else if (event.key === "Escape") {
      event.preventDefault()
      closeDropdown()
      requestAnimationFrame(() => buttonRef.current?.focus({ preventScroll: true }))
    }
  }

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      setIsOpen(true)
      return
    }
    if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault()
      setSearch(event.key)
      setIsOpen(true)
    }
  }

  const optionButton = (item: EntityItem, index: number) => (
    <button
      key={item.id}
      ref={(node) => {
        if (node) {
          optionRefs.current.set(item.id, node)
        } else {
          optionRefs.current.delete(item.id)
        }
      }}
      type="button"
      role="option"
      aria-selected={item.id === selectedId}
      className={`flex w-full items-center justify-between py-[6px] text-left transition-colors ${insetOptionHover ? "rounded-[4px] px-[6px]" : "px-[10px]"} ${isRefresh ? "hover:bg-[#F6F9FC]" : "hover:bg-[#F5F6F8]"} ${isRefresh && index === activeIndex ? "bg-[#F6F9FC] shadow-[inset_0_0_0_1px_#EAF0F6]" : ""}`}
      onMouseEnter={() => setActiveIndex(index)}
      onClick={() => selectItem(item)}
    >
      {renderOption ? renderOption(item) : (
        <>
          <span className={optionNameClassName ?? `text-[12px] font-[500] ${isRefresh ? "text-[#142234]" : "text-[#353A44]"}`}>{item.name}</span>
          {item.detail && (
            <span className={optionDetailClassName ?? `text-[11px] ${isRefresh ? "text-[#68778B]" : "text-[#6C7688]"}`}>{item.detail}</span>
          )}
        </>
      )}
    </button>
  )

  return (
    <div className="flex flex-col gap-[4px]" ref={containerRef}>
      {label && !useFloatingLabel && (
        <div className="flex items-center gap-[6px]">
          <label className={labelClassName ?? tokens.labelClass}>{label}</label>
          {hasSelection && onEdit && (
            <button
              type="button"
              className="flex items-center gap-[4px] text-[11px] font-[500] text-[#533AFD] transition-colors hover:text-[#4730E0]"
              onClick={onEdit}
            >
              <span className="text-[#9CA3B0]">·</span>
              Edit
            </button>
          )}
        </div>
      )}
      <div className={`relative ${highlightClass}`}>
        {useFloatingLabel && (
          <span className="pointer-events-none absolute left-[11px] top-[6px] z-10 text-[11px] font-[500] leading-[14px] tracking-[-0.04px] text-[#526378]">
            {label}
          </span>
        )}
        {isOpen && !isRefresh ? (
          <input
            ref={inputRef}
            className={`${ic} ${floatingControlClass}`}
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleOpenKeyDown}
            autoFocus
          />
        ) : (
          <button
            ref={buttonRef}
            type="button"
            className={`${ic} ${floatingControlClass} flex items-center justify-between text-left`}
            onClick={() => {
              setIsOpen(true)
              setTimeout(() => inputRef.current?.focus(), 0)
            }}
            onKeyDown={handleTriggerKeyDown}
          >
            <span className={hasSelection && !selectedIsPlaceholder ? (isRefresh ? "text-[#142234]" : "text-[#353A44]") : "text-[#9CA3B0]"}>
              {hasSelection ? displayText : placeholder}
            </span>
            {chevronIcon ?? <ChevronDownIcon />}
          </button>
        )}

        {isOpen && (
          <div
            ref={listRef}
            role="listbox"
            className={`absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-[8px] border ${isRefresh ? "border-[#EAF0F6]" : "border-[#E3E8EF]"} bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)]`}
          >
            {isRefresh && (
              <div className="border-b border-[#EAF0F6] px-[10px] py-[7px]">
                <input
                  ref={inputRef}
                  className="w-full bg-transparent text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#142234] placeholder:text-[#68778B] outline-none"
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleOpenKeyDown}
                  autoComplete="off"
                />
              </div>
            )}
            <div className={`max-h-[216px] overflow-y-auto ${insetOptionHover ? "p-[4px]" : "py-[4px]"}`}>
              {filtered.map((item, index) => optionButton(item, index))}
            </div>

            {filtered.length === 0 && search && (
              <div className={noResultsClassName ?? "px-[10px] py-[6px] text-[11px] text-[#9CA3B0]"}>
                No results matching &ldquo;{search}&rdquo;
              </div>
            )}

            {addNewLabel && onAddNew ? (
              <div className={insetOptionHover ? "border-t border-[#F0F3F7] p-[4px]" : "mt-[4px] border-t border-[#F0F3F7] pt-[4px]"}>
                <button
                  type="button"
                  className={addNewClassName ?? `flex w-full items-center gap-[6px] py-[6px] text-left text-[12px] font-[500] text-[#533AFD] transition-colors ${insetOptionHover ? "rounded-[4px] px-[6px]" : "px-[10px]"} ${isRefresh ? "hover:bg-[#F6F9FC]" : "hover:bg-[#F5F6F8]"}`}
                  onClick={() => {
                    onAddNew()
                    setIsOpen(false)
                    setSearch("")
                  }}
                >
                  {/* Consistent add affordance: the 8×8 filled plus (AddSmallIcon), matching
                      "Add tier". Strip any literal leading "+ " some callers include in the label. */}
                  <AddSmallIcon className="shrink-0" />
                  {addNewLabel.replace(/^\+\s*/, "")}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
      {hasError && errorMessage && (
        <p className="text-[11px] text-[#DF1B41]">{errorMessage}</p>
      )}
    </div>
  )
})
