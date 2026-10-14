'use client'

import { useEffect, type MouseEvent, type ReactNode, type RefObject } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRightIcon } from "@/components/ProductCatalogIcons"

type SimplifiedProductPopoverProps = {
  isOpen: boolean
  onClose: () => void
  t: (key: string) => string
  onDiscard: () => void
  onSubmit: () => void
  onOpenFullSettings: () => void
  submitLabel: string
  title?: string
  formContent: ReactNode
  containerRef?: RefObject<HTMLDivElement | null>
}

export function SimplifiedProductPopover({
  isOpen,
  onClose,
  t,
  onDiscard,
  onSubmit,
  onOpenFullSettings,
  submitLabel,
  title,
  formContent,
  containerRef,
}: SimplifiedProductPopoverProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="simplified-modal"
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          role="dialog"
          aria-modal="true"
          aria-label={t("Create product")}
          onClick={(e: MouseEvent<HTMLDivElement>) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <motion.div
            ref={containerRef}
            className="flex w-[380px] max-h-[80vh] flex-col overflow-hidden rounded-[8px] border border-[#EBEEF1] bg-white shadow-[0px_50px_100px_0px_rgba(48,49,61,0.08),0px_15px_35px_0px_rgba(48,49,61,0.08),0px_5px_15px_0px_rgba(0,0,0,0.12)]"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#EBEEF1] p-[16px]">
              <p className="text-[16px] font-[500] leading-[24px] tracking-[-0.31px] text-[#353A44]">
                {title ?? t("Add a product")}
              </p>
              <div className="flex items-center gap-[12px]">
                <button
                  type="button"
                  className="relative isolate flex h-[28px] min-h-[28px] items-center justify-center gap-[6px] rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] py-[4px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#353A44]"
                  onClick={onDiscard}
                >
                  <span className="relative z-[3]">{t("Discard")}</span>
                  <span className="absolute inset-0 z-[1] rounded-[6px] bg-white shadow-[0px_1px_1px_0px_rgba(33,37,44,0.16)]" />
                </button>
                <button
                  type="button"
                  className="relative isolate flex h-[28px] min-h-[28px] items-center justify-center gap-[6px] rounded-[6px] border border-[#675DFF] bg-[#675DFF] px-[8px] py-[4px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-white hover:bg-[#5B52F0] transition-colors"
                  onClick={onSubmit}
                >
                  <span className="relative z-[3]">{submitLabel}</span>
                  <span className="absolute inset-0 z-[1] rounded-[6px] bg-[#675DFF] shadow-[0px_1px_1px_0px_rgba(47,14,99,0.32)]" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">{formContent}</div>

            {/* More settings */}
            <div className="p-[6px]">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-[6px] border-t border-[#EBEEF1] bg-[#F5F6F8] px-[10px] py-[8px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#353A44] hover:bg-[#EBEEF1] transition-colors"
                onClick={onOpenFullSettings}
              >
                <span>{t("More settings")}</span>
                <ArrowRightIcon />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
