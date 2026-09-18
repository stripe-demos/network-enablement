'use client'

import type { ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { getFormTokens } from "@/components/creation-workspace/forms/shared/formTokens"

type CreationModalShellProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  primaryLabel?: string
  onPrimary?: () => void
  modalWidth?: string
  maxHeight?: string
  isPushed?: boolean
  children: ReactNode
  /** Custom content for the right side of the header. Overrides default Discard/Create buttons. */
  headerActions?: ReactNode
  /** Extra content rendered below the title row, inside the header border (e.g. step dots) */
  headerExtra?: ReactNode
  /** Footer content rendered at the bottom of the modal */
  footer?: ReactNode
  /** Suppress the divider line under the title (e.g. when the content leads with its own tabs). Refresh has no divider regardless. */
  hideHeaderDivider?: boolean
}

export function CreationModalShell({
  isOpen,
  onClose,
  title,
  subtitle,
  primaryLabel = "Create",
  onPrimary,
  modalWidth = "w-[480px]",
  maxHeight = "max-h-[80vh]",
  isPushed,
  children,
  headerActions,
  headerExtra,
  footer,
  hideHeaderDivider,
}: CreationModalShellProps) {
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)
  // Refresh modals have no header/footer divider lines (Figma node 196:356); other styles keep them.
  const isRefresh = productFormStyle === "refresh"
  const headerBorder = (isRefresh || hideHeaderDivider) ? "" : "border-b border-[#ECF1F6]"
  const footerBorder = isRefresh ? "" : "border-t border-[#ECF1F6]"
  const defaultFooter = (
    <div className={`flex items-center justify-end gap-[8px] ${footerBorder} bg-white px-[20px] py-[12px]`}>
      <button
        type="button"
        className={tokens.secondaryButtonClass}
        onClick={onClose}
      >
        Discard
      </button>
      <button
        type="button"
        className={tokens.primaryButtonClass}
        onClick={onPrimary ?? onClose}
      >
        {primaryLabel}
      </button>
    </div>
  )

  const actions = headerActions

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {!isPushed && (
            <motion.div
              className="fixed inset-0 z-40 bg-black/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
            />
          )}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-[24px]"
            initial={{ opacity: 0 }}
            animate={isPushed ? { opacity: 1, scale: 0.94, y: -20 } : { opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            style={isPushed ? { pointerEvents: "none", filter: "brightness(0.92)" } : undefined}
          >
            <motion.div
              className={`flex ${maxHeight} ${modalWidth} max-w-full flex-col overflow-hidden rounded-[12px] border border-[#EBEEF1] bg-white shadow-[0px_20px_60px_rgba(0,0,0,0.12),0px_4px_16px_rgba(0,0,0,0.08)]`}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {headerExtra || subtitle ? (
                <div className={`${headerBorder} bg-white px-[20px] py-[14px]`}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className={tokens.modalTitleClass}>
                        {title}
                      </p>
                      {subtitle ? (
                        <p className={`mt-[4px] ${tokens.helperClass}`}>{subtitle}</p>
                      ) : null}
                    </div>
                    {actions}
                  </div>
                  {headerExtra}
                </div>
              ) : (
                <div className={`flex items-center ${actions ? 'justify-between' : ''} ${headerBorder} bg-white px-[20px] py-[14px]`}>
                  <p className={tokens.modalTitleClass}>
                    {title}
                  </p>
                  {actions}
                </div>
              )}
              {children}
              {footer ?? defaultFooter}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
