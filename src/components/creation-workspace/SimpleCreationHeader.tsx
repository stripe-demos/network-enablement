'use client'

import { useState, useRef, useEffect, useId } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"

const { LayoutGroup } = require("framer-motion") as { LayoutGroup: React.ComponentType<{ children: React.ReactNode }> }
import type { NavLayoutMode } from "@/components/creation-workspace/navLayoutMode"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { getFormTokens } from "@/components/creation-workspace/forms/shared/formTokens"

const tabSpring = { type: "spring" as const, stiffness: 500, damping: 35, mass: 0.8 }

type AddOption = { kind: string; label: string }

type ObjectTab = {
  id: string
  kind: string
  label: string
}

type SimpleCreationHeaderProps = {
  title: string
  onDiscard: () => void
  onSubmit: () => void
  submitLabel: string
  submitDisabled?: boolean
  submitDisabledReason?: string
  discardLabel?: string
  addOptions?: AddOption[]
  onAddObject?: (kind: string) => void
  /** Object tabs to render in the header */
  tabs?: ObjectTab[]
  activeTabId?: string | null
  onSelectTab?: (id: string) => void
  /** Called when user requests to delete a tab via context menu */
  onRemoveTab?: (id: string) => void
  /** Object IDs that have validation errors */
  errorTabIds?: Set<string>
  /** Nav layout mode — when "vertical", tabs are shown in a sidebar instead */
  navLayout?: NavLayoutMode
}

function AddObjectPopover({
  options,
  onSelect,
  onClose,
}: {
  options: AddOption[]
  onSelect: (kind: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [onClose])

  return (
    <motion.div
      ref={ref}
      className="absolute left-0 top-full z-50 mt-[4px] min-w-[180px] rounded-[8px] border border-[#E3E8EF] bg-white py-[4px] shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
    >
      {options.map((opt) => (
        <button
          key={opt.kind}
          type="button"
          className="flex w-full items-center gap-[8px] px-[12px] py-[6px] text-left text-[12px] font-[500] text-[#353A44] transition-colors hover:bg-[#F5F6F8]"
          onClick={() => {
            onSelect(opt.kind)
            onClose()
          }}
        >
          <span>{opt.label}</span>
        </button>
      ))}
    </motion.div>
  )
}

export function SimpleCreationHeader({
  title,
  onDiscard,
  onSubmit,
  submitLabel,
  submitDisabled,
  submitDisabledReason,
  discardLabel = "Discard",
  addOptions,
  onAddObject,
  tabs,
  activeTabId,
  onSelectTab,
  onRemoveTab,
  errorTabIds,
  navLayout = "horizontal",
}: SimpleCreationHeaderProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ tabId: string; x: number; y: number } | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const submitTooltipId = useId()

  useEffect(() => {
    if (!contextMenu) return
    function handleClick(e: MouseEvent) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) setContextMenu(null)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [contextMenu])

  useEffect(() => {
    if (!tabs || tabs.length <= 1 || !onSelectTab) return
    function handleKeyDown(e: KeyboardEvent) {
      if (!e.metaKey) return
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= tabs!.length) {
        e.preventDefault()
        onSelectTab!(tabs![num - 1].id)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [tabs, onSelectTab])

  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)
  const isRefresh = productFormStyle === "refresh"
  const isSail = productFormStyle === "sail"

  const secondaryButtonClass = isRefresh
    ? tokens.secondaryButtonClass
    : isSail
      ? "flex h-[28px] items-center rounded-[6px] bg-white px-[8px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#353A44] shadow-[0px_1px_1px_0px_rgba(26,27,37,0.16),0px_0px_0px_1px_#D5DBE1] transition-colors hover:bg-[#F5F6F8]"
      : "flex h-[26px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[8px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
  const primaryButtonClass = isRefresh
    ? tokens.primaryButtonClass
    : isSail
      ? "flex h-[28px] items-center whitespace-nowrap rounded-[6px] bg-[#675DFF] px-[8px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-white shadow-[0px_1px_1px_0px_rgba(20,19,78,0.32),0px_0px_0px_1px_#625AFA] transition-colors hover:bg-[#5B52F0]"
      : "flex h-[26px] items-center whitespace-nowrap rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[8px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white transition-colors hover:bg-[#4730E0]"

  const hasTabs = tabs && tabs.length > 1
  const showHorizontalTabs = hasTabs && (navLayout === "horizontal" || navLayout === "ideal")
  const showAddButton = false
  const hasSubmitTooltip = Boolean(submitDisabled && submitDisabledReason)

  // In sidebar and tabs modes, build a composite title from all objects.
  // In drawer/modal modes, child objects get their own overlays so skip composition.
  const displayTitle = (() => {
    const shouldCompose = navLayout === "vertical" || navLayout === "horizontal"
    if (shouldCompose && hasTabs) {
      const labels = tabs.map((t) => t.label.toLowerCase())
      if (labels.length === 1) return title
      const primary = title.replace(/^Create\s+/i, "")
      const additional = labels.filter((l) => l !== primary.toLowerCase())
      if (additional.length === 0) return title
      return `${title} and ${additional.join(" and ")}`
    }
    return title
  })()

  const submitButton = (
    <button
      type="button"
      disabled={Boolean(submitDisabled && !hasSubmitTooltip)}
      aria-disabled={submitDisabled || undefined}
      aria-describedby={hasSubmitTooltip ? submitTooltipId : undefined}
      className={`${submitDisabled
        ? isRefresh
          ? "flex items-center gap-[6px] rounded-full bg-[#F1F6FB] px-[12px] py-[6px] text-[13px] font-[500] leading-[20px] tracking-[-0.065px] text-[#9CA3B0] cursor-not-allowed"
          : isSail
            ? "flex h-[28px] items-center whitespace-nowrap rounded-[6px] border border-[#D4DEE9] bg-[#F5F6F8] px-[8px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#9CA3B0] cursor-not-allowed"
            : "flex h-[26px] items-center whitespace-nowrap rounded-[6px] border border-[#D4DEE9] bg-[#F5F6F8] px-[8px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#9CA3B0] cursor-not-allowed"
        : primaryButtonClass
      } ${hasSubmitTooltip ? "t-tt-trigger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#675DFF]/30" : ""}`}
      onClick={submitDisabled ? undefined : onSubmit}
    >
      {submitLabel}
    </button>
  )

  return (
    <div className={`relative z-10 flex items-center justify-between ${isRefresh ? "h-[64px] border-b border-[#EAF0F6] bg-white px-[28px]" : isSail ? "bg-white border-b border-[#ECF1F6] px-[16px] py-[14px]" : "bg-white border-b border-[#ECF1F6] px-[16px] py-[12px]"}`}>
      <div className="flex min-w-0 items-center gap-[8px]">
        <LayoutGroup>
          <AnimatePresence mode="popLayout" initial={false}>
            {showHorizontalTabs ? (
              tabs.map((tab, index) => {
                const isActive = tab.id === activeTabId
                const hasError = errorTabIds?.has(tab.id)
                const tabBase = isRefresh
                  ? "flex items-center gap-[6px] overflow-hidden rounded-full px-[10px] py-[4px] text-[13px] font-[500] leading-[20px] tracking-[-0.065px] transition-colors"
                  : isSail
                    ? "flex items-center gap-[6px] overflow-hidden rounded-[6px] border px-[8px] py-[3px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] transition-colors"
                    : "flex items-center gap-[6px] overflow-hidden rounded-[6px] border px-[8px] py-[2px] text-[14px] font-[500] leading-[20px] tracking-[-0.15px] transition-colors"
                const tabState = hasError
                  ? isActive
                    ? isRefresh ? "bg-[#E53E3E] text-white" : "border-[#E53E3E] bg-[#1A2C44] text-white"
                    : isRefresh ? "bg-[#FEF2F2] text-[#E53E3E]" : "border-[#E53E3E]/40 text-[#E53E3E]"
                  : isActive
                    ? isRefresh ? "bg-[#1C1E54] text-white" : "border-[#1A2C44] bg-[#1A2C44] text-[#F4F7FA]"
                    : isRefresh ? "bg-[#F1F6FB] text-[#526378] hover:bg-[#EAF0F6]" : "border-[#D4DEE9] text-[#1A2C44] hover:bg-[#F5F6F8]"
                return (
                  <motion.button
                    key={tab.id}
                    layoutId={index === 0 ? "header-title" : undefined}
                    layout="position"
                    type="button"
                    className={`${tabBase} ${tabState}`}
                    initial={index === 0 ? false : { opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8, transition: { duration: 0.15 } }}
                    transition={tabSpring}
                    onClick={() => onSelectTab?.(tab.id)}
                    onContextMenu={(e: React.MouseEvent) => {
                      e.preventDefault()
                      setContextMenu({ tabId: tab.id, x: e.clientX, y: e.clientY })
                    }}
                  >
                    {tab.label}
                    {tabs.length > 1 && index < 9 && (
                      <span className={`ml-[2px] text-[10px] font-[400] leading-none ${
                        isActive
                          ? "text-white/40"
                          : isRefresh ? "text-[#526378]/40" : "text-[#B0B7C3]"
                      }`}>
                        {"\u2318"}{index + 1}
                      </span>
                    )}
                  </motion.button>
                )
              })
            ) : (
              <motion.p
                key="header-title-single"
                layoutId="header-title"
                layout
                className={`truncate ${isRefresh ? "text-[15px] font-[675] leading-[20px] tracking-[-0.15px] text-[#142234]" : isSail ? "text-[15px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]" : "text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]"}`}
                transition={tabSpring}
              >
                {displayTitle}
              </motion.p>
            )}
          </AnimatePresence>
        </LayoutGroup>

        {showAddButton && (
          <div className="relative">
            <button
              type="button"
              className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[6px] border border-[#D4DEE9] bg-white transition-colors hover:bg-[#F5F6F8]"
              onClick={() => setIsPopoverOpen(!isPopoverOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6.7 0.85C6.7 0.380558 6.31944 0 5.85 0C5.38056 0 5 0.380558 5 0.85V5H0.85C0.380558 5 0 5.38056 0 5.85C0 6.31944 0.380558 6.7 0.85 6.7H5V10.85C5 11.3194 5.38056 11.7 5.85 11.7C6.31944 11.7 6.7 11.3194 6.7 10.85V6.7H10.85C11.3194 6.7 11.7 6.31944 11.7 5.85C11.7 5.38056 11.3194 5 10.85 5H6.7V0.85Z" fill="#3C4F69"/>
              </svg>
            </button>
            <AnimatePresence>
              {isPopoverOpen && (
                <AddObjectPopover
                  options={addOptions!}
                  onSelect={onAddObject!}
                  onClose={() => setIsPopoverOpen(false)}
                />
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="flex items-center gap-[8px]">
        <button type="button" className={secondaryButtonClass} onClick={onDiscard}>
          {discardLabel}
        </button>
        {hasSubmitTooltip ? (
          <span className="t-tt-wrap">
            {submitButton}
            <span id={submitTooltipId} role="tooltip" data-side="bottom-right" className="t-tt">
              {submitDisabledReason}
            </span>
          </span>
        ) : submitButton}
      </div>

      {contextMenu && onRemoveTab && createPortal(
        <div
          ref={contextMenuRef}
          className="fixed z-[9999] min-w-[140px] rounded-[8px] border border-[#E3E8EF] bg-white py-[4px] shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            type="button"
            className="flex w-full items-center gap-[8px] px-[12px] py-[6px] text-left text-[12px] font-[500] text-[#E53E3E] transition-colors hover:bg-[#FEF2F2]"
            onClick={() => {
              onRemoveTab(contextMenu.tabId)
              setContextMenu(null)
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 3H10M4.5 5V9M7.5 5V9M2.5 3L3 10C3 10.5523 3.44772 11 4 11H8C8.55228 11 9 10.5523 9 10L9.5 3M4.5 3V1.5C4.5 1.22386 4.72386 1 5 1H7C7.27614 1 7.5 1.22386 7.5 1.5V3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Delete
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}
