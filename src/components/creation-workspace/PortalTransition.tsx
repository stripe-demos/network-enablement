'use client'

import type { ComponentType } from "react"
import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChildPreviewSlot } from "@/components/creation-workspace/ChildPreviewSlot"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { getFormTokens } from "@/components/creation-workspace/forms/shared/formTokens"

type PortalTransitionProps = {
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
  grandchildFormComponent?: ComponentType<{ data: Record<string, any>; onChange: (data: Record<string, any>) => void; onAddObject?: (kind: string) => void }> | null
  grandchildData?: Record<string, any>
  grandchildKind?: string | null
  grandchildLabel?: string
  onGrandchildChange?: (data: Record<string, any>) => void
  onAddGrandchild?: (kind: string) => void
  onDismissGrandchild?: () => void
}

export function PortalTransition({
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
  grandchildFormComponent: GrandchildFormComponent,
  grandchildData = {},
  grandchildKind,
  grandchildLabel = "",
  onGrandchildChange,
  onDismissGrandchild,
}: PortalTransitionProps) {
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)
  const [showChild, setShowChild] = useState(false)
  const [showGrandchild, setShowGrandchild] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ChildFormComponent && childKind) {
      requestAnimationFrame(() => setShowChild(true))
    } else {
      setShowChild(false)
    }
  }, [ChildFormComponent, childKind])

  useEffect(() => {
    if (GrandchildFormComponent && grandchildKind) {
      requestAnimationFrame(() => setShowGrandchild(true))
    } else {
      setShowGrandchild(false)
    }
  }, [GrandchildFormComponent, grandchildKind])

  const handleDismissChild = () => {
    setShowChild(false)
    setTimeout(() => onDismissChild(), 300)
  }

  const handleDismissGrandchild = () => {
    setShowGrandchild(false)
    setTimeout(() => { if (onDismissGrandchild) onDismissGrandchild() }, 300)
  }

  const childHasPreview = childKind === "meter" || childKind === "price"
  const grandchildHasPreview = grandchildKind === "meter"

  // Determine depth for stacking offsets
  const depth = showGrandchild ? 2 : showChild ? 1 : 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Background overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Stacked modal container */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-[24px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Layer 0: Parent form */}
            <motion.div
              className="absolute flex h-[70vh] max-h-[600px] w-[480px] max-w-full flex-col overflow-hidden rounded-[12px] border border-[#EBEEF1] bg-white"
              animate={{
                y: depth === 0 ? 0 : depth === 1 ? 28 : 54,
                scale: depth === 0 ? 1 : depth === 1 ? 0.96 : 0.91,
              }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              style={{
                pointerEvents: depth >= 1 ? "none" : "auto",
                boxShadow: depth === 0
                  ? "0px 40px 120px rgba(0,0,0,0.24), 0px 16px 40px rgba(0,0,0,0.14)"
                  : depth === 1
                    ? "0px 16px 48px rgba(0,0,0,0.16), 0px 6px 16px rgba(0,0,0,0.10)"
                    : "0px 8px 24px rgba(0,0,0,0.10), 0px 3px 8px rgba(0,0,0,0.06)",
              }}
            >
              <div className="flex items-center justify-between border-b border-[#ECF1F6] px-[20px] py-[14px]">
                <p className={tokens.modalTitleClass}>
                  New {parentLabel.toLowerCase()}
                </p>
                <div className="flex items-center gap-[8px]">
                  <button type="button" className={tokens.secondaryButtonClass} onClick={onClose}>
                    Discard
                  </button>
                  <button type="button" className={tokens.primaryButtonClass} onClick={onClose}>
                    Create {parentLabel.toLowerCase()}
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-[20px] py-[16px]">
                <div ref={triggerRef}>
                  <ParentFormComponent data={parentData} onChange={onParentChange} onAddObject={onAddObject} />
                </div>
              </div>
            </motion.div>

            {/* Layer 1: Child form */}
            <AnimatePresence>
              {showChild && ChildFormComponent && (
                <motion.div
                  className={`absolute flex h-[70vh] max-h-[600px] ${childHasPreview ? "w-[820px]" : "w-[480px]"} max-w-full flex-col overflow-hidden rounded-[12px] border border-[#EBEEF1] bg-white`}
                  initial={{ y: -20, opacity: 0, scale: 0.96 }}
                  animate={{
                    y: depth >= 2 ? 18 : 0,
                    opacity: 1,
                    scale: depth >= 2 ? 0.96 : 1,
                  }}
                  exit={{ y: -20, opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  style={{
                    pointerEvents: depth >= 2 ? "none" : "auto",
                    boxShadow: depth >= 2
                      ? "0px 16px 48px rgba(0,0,0,0.16), 0px 6px 16px rgba(0,0,0,0.10)"
                      : "0px 40px 120px rgba(0,0,0,0.24), 0px 16px 40px rgba(0,0,0,0.14)",
                  }}
                >
                  <div className="flex items-center justify-between border-b border-[#ECF1F6] px-[20px] py-[14px]">
                    <p className={tokens.modalTitleClass}>
                      {childLabel}
                    </p>
                    <div className="flex items-center gap-[8px]">
                      <button
                        type="button"
                        className={tokens.secondaryButtonClass}
                        onClick={handleDismissChild}
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        className={tokens.primaryButtonClass}
                        onClick={handleDismissChild}
                      >
                        Create {childLabel.toLowerCase()}
                      </button>
                    </div>
                  </div>
                  <div className="flex min-h-0 flex-1">
                    <div className={`${childHasPreview ? "w-[400px] border-r border-[#ECF1F6]" : "flex-1"} overflow-y-auto px-[20px] py-[16px]`}>
                      <ChildFormComponent data={childData} onChange={onChildChange} onAddObject={onAddObject} />
                    </div>
                    <ChildPreviewSlot kind={childKind} data={childData} unitPrice={unitPrice} currency={currency} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Layer 2: Grandchild form (e.g. meter from price) */}
            <AnimatePresence>
              {showGrandchild && GrandchildFormComponent && (
                <motion.div
                  className={`absolute flex h-[70vh] max-h-[600px] ${grandchildHasPreview ? "w-[820px]" : "w-[480px]"} max-w-full flex-col overflow-hidden rounded-[12px] border border-[#EBEEF1] bg-white shadow-[0px_40px_120px_rgba(0,0,0,0.24),0px_16px_40px_rgba(0,0,0,0.14)]`}
                  initial={{ y: -20, opacity: 0, scale: 0.96 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -20, opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-[#ECF1F6] px-[20px] py-[14px]">
                    <p className={tokens.modalTitleClass}>
                      {grandchildLabel}
                    </p>
                    <div className="flex items-center gap-[8px]">
                      <button
                        type="button"
                        className={tokens.secondaryButtonClass}
                        onClick={handleDismissGrandchild}
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        className={tokens.primaryButtonClass}
                        onClick={handleDismissGrandchild}
                      >
                        Create {grandchildLabel.toLowerCase()}
                      </button>
                    </div>
                  </div>
                  <div className="flex min-h-0 flex-1">
                    <div className={`${grandchildHasPreview ? "w-[400px] border-r border-[#ECF1F6]" : "flex-1"} overflow-y-auto px-[20px] py-[16px]`}>
                      <GrandchildFormComponent data={grandchildData} onChange={onGrandchildChange ?? (() => {})} />
                    </div>
                    <ChildPreviewSlot kind={grandchildKind ?? null} data={grandchildData} unitPrice={unitPrice} currency={currency} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
