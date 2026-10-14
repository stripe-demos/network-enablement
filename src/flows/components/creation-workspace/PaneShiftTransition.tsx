'use client'

import type { ComponentType } from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChildPreviewSlot } from "@/components/creation-workspace/ChildPreviewSlot"

type PaneShiftTransitionProps = {
  isOpen: boolean
  parentLabel: string
  childLabel: string
  ParentFormComponent: ComponentType<{ data: Record<string, any>; onChange: (data: Record<string, any>) => void; onAddObject?: (kind: string) => void }>
  ChildFormComponent: ComponentType<{ data: Record<string, any>; onChange: (data: Record<string, any>) => void; onAddObject?: (kind: string) => void }> | null
  parentData: Record<string, any>
  childData: Record<string, any>
  childKind: string | null
  onParentChange: (data: Record<string, any>) => void
  onChildChange: (data: Record<string, any>) => void
  onClose: () => void
  onAddObject: (kind: string) => void
  onDismissChild: () => void
  unitPrice?: string
  currency?: string
}

export function PaneShiftTransition({
  isOpen,
  parentLabel,
  childLabel,
  ParentFormComponent,
  ChildFormComponent,
  parentData,
  childData,
  childKind,
  onParentChange,
  onChildChange,
  onClose,
  onAddObject,
  onDismissChild,
  unitPrice,
  currency,
}: PaneShiftTransitionProps) {
  const hasChild = !!ChildFormComponent && !!childKind
  const childHasPreview = childKind === "meter" || childKind === "price"
  const [showBackTooltip, setShowBackTooltip] = useState(false)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-[24px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className="flex h-[75vh] max-h-[680px] max-w-full flex-col overflow-hidden rounded-[12px] border border-[#EBEEF1] bg-white shadow-[0px_20px_60px_rgba(0,0,0,0.12),0px_4px_16px_rgba(0,0,0,0.08)]"
              style={{
                width: childHasPreview && hasChild ? 820 : 480,
                transition: "width 300ms cubic-bezier(0.32, 0.72, 0, 1)",
              }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#ECF1F6] px-[20px] py-[14px]">
                <div className="flex items-center gap-[8px] overflow-hidden">
                  {hasChild && (
                    <div className="relative">
                      <button
                        type="button"
                        className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[4px] text-[#596171] transition-colors hover:bg-[#F5F6F8]"
                        onClick={onDismissChild}
                        onMouseEnter={() => setShowBackTooltip(true)}
                        onMouseLeave={() => setShowBackTooltip(false)}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M7.5 1.5L3 6l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      {showBackTooltip && (
                        <div className="absolute left-1/2 top-full z-10 mt-[4px] -translate-x-1/2 whitespace-nowrap rounded-[6px] bg-[#1A2C44] px-[8px] py-[4px] text-[11px] font-[500] text-white shadow-[0_4px_12px_rgba(0,0,0,0.12)]">
                          Discard
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
                    {hasChild ? childLabel : `New ${parentLabel.toLowerCase()}`}
                  </p>
                </div>
                <div className="flex items-center gap-[8px]">
                  <button type="button" className="flex h-[28px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] transition-colors hover:bg-[#F5F6F8]" onClick={hasChild ? onDismissChild : onClose}>
                    Discard
                  </button>
                  <button type="button" className="flex h-[28px] items-center rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white transition-colors hover:bg-[#4730E0]" onClick={hasChild ? onDismissChild : onClose}>
                    {hasChild ? `Create ${childLabel.toLowerCase()}` : `Create ${parentLabel.toLowerCase()}`}
                  </button>
                </div>
              </div>

              {/* Content — CSS transform slide */}
              <div className="relative min-h-[300px] flex-1 overflow-hidden">
                <div
                  className="absolute inset-0 flex"
                  style={{
                    width: "200%",
                    transform: hasChild ? "translateX(-50%)" : "translateX(0%)",
                    transition: "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
                  }}
                >
                  {/* Left half: parent form */}
                  <div className="h-full w-1/2 overflow-y-auto px-[20px] py-[16px]">
                    <ParentFormComponent data={parentData} onChange={onParentChange} onAddObject={onAddObject} />
                  </div>

                  {/* Right half: child form (+ preview if applicable) */}
                  <div className="flex h-full w-1/2">
                    {hasChild && ChildFormComponent ? (
                      <>
                        <div className={`${childHasPreview ? "w-[400px] shrink-0 border-r border-[#ECF1F6]" : "flex-1"} overflow-y-auto px-[20px] py-[16px]`}>
                          <ChildFormComponent data={childData} onChange={onChildChange} onAddObject={onAddObject} />
                        </div>
                        <ChildPreviewSlot kind={childKind} data={childData} unitPrice={unitPrice} currency={currency} />
                      </>
                    ) : (
                      <div className="flex-1" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
