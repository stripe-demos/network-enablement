'use client'

import { useState, useRef, useEffect, useLayoutEffect, type ReactNode, type RefObject } from "react"
import { createPortal } from "react-dom"
import type { LayoutMode } from "@/components/product-catalog/layoutMode"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { getFormTokens } from "@/components/creation-workspace/forms/shared/formTokens"

type PricingPlanModalHeaderProps = {
  t: (key: string) => string
  title: string
  status: "draft" | "live"

  customerPreviewMode: string
  setCustomerPreviewMode: (next: string) => void

  layoutMode?: LayoutMode

  isPlanAssistantOpen: boolean
  onToggleAssistant: () => void

  onOpenConsole?: () => void

  isCodePopoverOpen?: boolean
  onToggleCodePopover?: () => void
  codeViewContent?: ReactNode

  onDiscard: () => void
  onSaveDraft: () => void
  onCreate: () => void
  createLabel: string
  /** When true, the primary create button is disabled. */
  createDisabled?: boolean

  /** When true, cross-fade the normal header content out and the bulk edit content in. */
  isBulkEditMode?: boolean
  /** Title shown during bulk edit (e.g. "Editing 57 rates in AI Model Usage") */
  bulkEditTitle?: string
  /** Back callback for bulk edit mode */
  onBulkEditBack?: () => void
  // Breadcrumb / navigation props (for the non-bulk-edit header bar)
  nodeLabel?: string
  parentLabel?: string
  onNavigateToParent?: () => void
  isTreeNavOpen?: boolean
  onToggleTreeNav?: () => void
  hamburgerButtonRef?: RefObject<HTMLButtonElement | null>
  hasTreeChanges?: boolean
  onDismissNavHint?: () => void
  // Breadcrumb hierarchy
  nodeType?: string
  onNavigateToPlan?: () => void
  /**
   * @deprecated The "+" button moved out of the header to inline rows in the sidebar.
   * Kept on the type so callers don't need to change; will be removed in a follow-up.
   */
  formAddButtonRef?: RefObject<HTMLButtonElement | null>
  /** @deprecated See `formAddButtonRef`. */
  onToggleAddPlanObject?: () => void
  /** @deprecated See `formAddButtonRef`. */
  onDismissGetStarted?: () => void
}

export function PricingPlanModalHeader({
  t,
  title,
  createLabel,
  createDisabled,
  onDiscard,
  onCreate,
  onOpenConsole,
  isBulkEditMode,
  bulkEditTitle,
  onBulkEditBack,
  nodeLabel,
  parentLabel,
  onNavigateToParent,
  isTreeNavOpen,
  onToggleTreeNav,
  hamburgerButtonRef,
  hasTreeChanges,
  onDismissNavHint,
  nodeType,
  onNavigateToPlan,
}: PricingPlanModalHeaderProps) {
  const { productFormStyle } = useProductFormStyle()
  const isRefresh = productFormStyle === "refresh"
  const tokens = getFormTokens(productFormStyle)

  const secondaryButtonClass = isRefresh
    ? tokens.secondaryButtonClass
    : "flex h-[26px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[8px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
  const primaryButtonClass = isRefresh
    ? tokens.primaryButtonClass
    : "flex h-[26px] items-center whitespace-nowrap rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[8px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white transition-colors hover:bg-[#4730E0]"
  const primaryButtonDisabledClass = isRefresh
    ? "flex items-center gap-[6px] whitespace-nowrap rounded-full bg-[#F1F6FB] px-[12px] py-[6px] text-[13px] font-[500] leading-[20px] tracking-[-0.065px] text-[#9CA3B0] cursor-not-allowed"
    : "flex h-[26px] items-center whitespace-nowrap rounded-[6px] border border-[#A99CFE] bg-[#A99CFE] px-[8px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white cursor-not-allowed"
  const titleClass = isRefresh
    ? "text-[15px] font-[675] leading-[20px] tracking-[-0.15px] text-[#142234]"
    : "text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]"
  const transitionClass = "transition-all duration-200 ease-out"

  return (
    <div className={`relative z-10 bg-white px-[16px] py-[12px] ${isRefresh ? "border-b border-[#EAF0F6]" : "border-b border-[#ECF1F6]"}`}>
      <div className="relative flex items-center justify-between gap-[12px]">
        <div className="relative min-w-0 flex-1">
          <div
            className={`${transitionClass} flex min-w-0 items-center gap-[8px] ${
              isBulkEditMode ? "pointer-events-none translate-y-[2px] opacity-0 blur-[6px]" : "translate-y-0 opacity-100 blur-0"
            }`}
          >
            <p className={`truncate ${titleClass}`}>{title}</p>
            {onOpenConsole && <PlanTitleMenu onOpenConsole={onOpenConsole} />}
          </div>
          <div
            className={`${transitionClass} pointer-events-none absolute inset-0 flex min-w-0 items-center ${
              isBulkEditMode ? "translate-y-0 opacity-100 blur-0" : "-translate-y-[2px] opacity-0 blur-[6px]"
            }`}
          >
            <p className={`min-w-0 truncate ${titleClass}`}>
              {bulkEditTitle}
            </p>
          </div>
        </div>

        <div className="relative grid shrink-0 justify-items-end">
          <div
            className={`${transitionClass} col-start-1 row-start-1 flex items-center gap-[8px] ${
              isBulkEditMode ? "pointer-events-none translate-y-[2px] opacity-0 blur-[6px]" : "translate-y-0 opacity-100 blur-0"
            }`}
          >
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={onDiscard}
            >
              {t("Discard")}
            </button>
            <button
              type="button"
              className={createDisabled ? primaryButtonDisabledClass : primaryButtonClass}
              onClick={onCreate}
              disabled={createDisabled}
              aria-disabled={createDisabled}
            >
              {createLabel}
            </button>
          </div>
          <div
            className={`${transitionClass} col-start-1 row-start-1 flex items-center gap-[8px] ${
              isBulkEditMode ? "opacity-100 blur-0" : "pointer-events-none opacity-0 blur-[6px]"
            }`}
          >
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={onBulkEditBack}
            >
              {t("Cancel")}
            </button>
            <button
              type="button"
              className={primaryButtonClass}
              onClick={onBulkEditBack}
            >
              {t("Done")}
            </button>
          </div>
          <div className="invisible col-start-1 row-start-1 flex items-center gap-[8px] pointer-events-none">
            <span className={secondaryButtonClass}>{t("Cancel")}</span>
            <span className={primaryButtonClass}>{t("Done")}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function PlanTitleMenu({ onOpenConsole }: { onOpenConsole: () => void }) {
  const { productFormStyle } = useProductFormStyle()
  const isRefresh = productFormStyle === "refresh"
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + 4, left: rect.left })
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return
      if (buttonRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[6px] border transition-colors ${isRefresh ? `border-[#EAF0F6] bg-white ${open ? "bg-[#F1F6FB]" : "hover:bg-[#F1F6FB]"}` : `border-[#D4DEE9] bg-white ${open ? "bg-[#F5F6F8]" : "hover:bg-[#F5F6F8]"}`}`}
        onClick={() => setOpen(v => !v)}
        aria-label="Plan options"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="2.5" cy="6" r="1" fill="#3C4F69" />
          <circle cx="6" cy="6" r="1" fill="#3C4F69" />
          <circle cx="9.5" cy="6" r="1" fill="#3C4F69" />
        </svg>
      </button>
      {open && pos && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] min-w-[160px] rounded-[8px] border border-[#D8DEE4] bg-white py-[4px] shadow-[0_12px_32px_rgba(28,32,40,0.12)]"
          style={{ top: pos.top, left: pos.left }}
        >
          <button
            type="button"
            className="flex w-full items-center px-[12px] py-[7px] text-left text-[12px] font-[500] text-[#353A44] hover:bg-[#F5F6F8] transition-colors"
            onClick={() => {
              setOpen(false)
              onOpenConsole()
            }}
          >
            Open in Console
          </button>
        </div>,
        document.body
      )}
    </>
  )
}
