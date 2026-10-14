'use client'

import { useEffect, useState, type MouseEvent } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { MeterForm } from "./forms/MeterForm"
import { useProductFormStyle } from "./productFormStyle"
import { getFormTokens } from "./forms/shared/formTokens"

type MeterEditorModalProps = {
  isOpen: boolean
  initialData?: Record<string, any>
  onClose: () => void
  onSave: (data: Record<string, any>) => void
}

export function MeterEditorModal({ isOpen, initialData, onClose, onSave }: MeterEditorModalProps) {
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)
  const [draft, setDraft] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!isOpen) return
    setDraft({ aggregation: "sum", timeWindow: "hour", ...initialData })
    setErrors(new Set())
  }, [initialData, isOpen])

  const save = () => {
    if (!String(draft.name ?? "").trim()) {
      setErrors(new Set(["name"]))
      return
    }
    onSave(draft)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-[24px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={initialData?.id ? "Edit meter" : "Create meter"}
            className="flex max-h-[min(760px,calc(100vh-48px))] w-full max-w-[460px] flex-col overflow-hidden rounded-[12px] border border-[#D8DEE4] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}
          >
            <div className="border-b border-[#ECF1F6] px-[20px] py-[14px]">
              <p className={tokens.modalTitleClass}>{initialData?.id ? "Edit meter" : "Create meter"}</p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-[20px] py-[16px]">
              <MeterForm
                data={draft}
                onChange={(patch) => {
                  setDraft((current) => ({ ...current, ...patch }))
                  if (errors.size > 0) setErrors(new Set())
                }}
                errorFields={errors}
              />
            </div>
            <div className="flex items-center justify-end gap-[8px] border-t border-[#ECF1F6] px-[20px] py-[12px]">
              <button type="button" className={tokens.secondaryButtonClass} onClick={onClose}>Cancel</button>
              <button type="button" className={tokens.primaryButtonClass} onClick={save}>{initialData?.id ? "Save meter" : "Create meter"}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
