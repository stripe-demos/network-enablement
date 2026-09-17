'use client'

import type { ComponentType } from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MeterPreviewPanel } from "@/components/creation-workspace/MeterPreviewPanel"
import { PricePreviewPanel } from "@/components/creation-workspace/PricePreviewPanel"

type SlideOverDrawerProps = {
  isOpen: boolean
  label: string
  FormComponent: ComponentType<{ data: Record<string, any>; onChange: (data: Record<string, any>) => void; onAddObject?: (kind: string) => void }>
  ChildFormComponent?: ComponentType<{ data: Record<string, any>; onChange: (data: Record<string, any>) => void; onAddObject?: (kind: string) => void }> | null
  data: Record<string, any>
  childData?: Record<string, any>
  childKind?: string | null
  childLabel?: string
  onChange: (data: Record<string, any>) => void
  onChildChange?: (data: Record<string, any>) => void
  onClose: () => void
  onAddObject?: (kind: string) => void
  onDismissChild?: () => void
  unitPrice?: string
  currency?: string
}

export function SlideOverDrawer({
  isOpen,
  label,
  FormComponent,
  ChildFormComponent,
  data,
  childData = {},
  childKind,
  childLabel,
  onChange,
  onChildChange,
  onClose,
  onAddObject,
  onDismissChild,
  unitPrice,
  currency,
}: SlideOverDrawerProps) {
  const hasChild = !!ChildFormComponent && !!childKind
  const childIsMeter = childKind === "meter"
  const childIsPrice = childKind === "price"
  const [childExpanded, setChildExpanded] = useState(false)

  const handleAddObject = (kind: string) => {
    onAddObject?.(kind)
    setChildExpanded(true)
  }

  const handleDismissChild = () => {
    setChildExpanded(false)
    setTimeout(() => onDismissChild?.(), 250)
  }

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

          {/* Main drawer */}
          <motion.div
            className="fixed inset-y-0 right-0 z-50 flex w-[400px] max-w-[90vw] flex-col border-l border-[#EBEEF1] bg-white shadow-[-8px_0_24px_rgba(0,0,0,0.08)]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="flex items-center justify-between border-b border-[#ECF1F6] px-[20px] py-[14px]">
              <div className="flex items-center gap-[8px]">
                <button
                  type="button"
                  className="flex h-[24px] w-[24px] items-center justify-center rounded-[6px] text-[#667691] transition-colors hover:bg-[#F5F6F8] hover:text-[#353A44]"
                  onClick={onClose}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <p className="text-[14px] font-[500] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
                  New {label.toLowerCase()}
                </p>
              </div>
              <div className="flex items-center gap-[6px]">
                <button
                  type="button"
                  className="flex h-[28px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
                  onClick={onClose}
                >
                  Discard
                </button>
                <button
                  type="button"
                  className="flex h-[28px] items-center rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white transition-colors hover:bg-[#4730E0]"
                  onClick={onClose}
                >
                  Create {label.toLowerCase()}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-[20px] py-[16px]">
              <FormComponent data={data} onChange={onChange} onAddObject={handleAddObject} />
            </div>
          </motion.div>

          {/* Child panel — reveals to the left of the drawer */}
          <AnimatePresence>
            {hasChild && childExpanded && (
              <motion.div
                className="fixed inset-y-0 right-[400px] z-[45] flex w-[380px] flex-col border-l border-r border-[#EBEEF1] bg-[#FAFBFC] shadow-[-4px_0_16px_rgba(0,0,0,0.06)]"
                initial={{ x: 380, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 380, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              >
                <div className="flex items-center justify-between border-b border-[#ECF1F6] px-[20px] py-[14px]">
                  <p className="text-[14px] font-[500] leading-[20px] text-[#1A2C44]">
                    {childLabel || childKind}
                  </p>
                  <div className="flex items-center gap-[6px]">
                    <button
                      type="button"
                      className="flex h-[28px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[12px] font-[600] text-[#596171] transition-colors hover:bg-[#F5F6F8]"
                      onClick={handleDismissChild}
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      className="flex h-[28px] items-center rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[10px] text-[12px] font-[600] text-white transition-colors hover:bg-[#4730E0]"
                      onClick={handleDismissChild}
                    >
                      Create {(childLabel || childKind || "").toLowerCase()}
                    </button>
                  </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                  <div className="flex-1 px-[20px] py-[14px]">
                    <ChildFormComponent data={childData} onChange={onChildChange ?? (() => {})} onAddObject={handleAddObject} />
                  </div>
                  {childIsMeter && (
                    <div className="border-t border-[#ECF1F6] bg-white px-[20px] py-[14px]">
                      <MeterPreviewPanel
                        meters={[{
                          name: childData.name || "",
                          displayName: childData.displayName || "",
                          aggregation: childData.aggregation || "sum",
                          valueKey: childData.valueKey || "",
                        }]}
                        unitPrice={unitPrice}
                        currency={currency}
                      />
                    </div>
                  )}
                  {childIsPrice && (
                    <div className="border-t border-[#ECF1F6] bg-white px-[20px] py-[14px]">
                      <PricePreviewPanel data={childData} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  )
}
