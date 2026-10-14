'use client'

import type { ComponentType } from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MeterPreviewPanel } from "@/components/creation-workspace/MeterPreviewPanel"
import { CreationModalShell } from "./CreationModalShell"

type RailNode = {
  id: string
  label: string
  kind: string
  FormComponent: ComponentType<{ data: Record<string, any>; onChange: (data: Record<string, any>) => void; onAddObject?: (kind: string) => void }>
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
}

type BreadcrumbRailModalProps = {
  isOpen: boolean
  nodes: RailNode[]
  onClose: () => void
  onAddObject?: (kind: string) => void
  unitPrice?: string
  currency?: string
  focusNodeId?: string | null
}

export function BreadcrumbRailModal({
  isOpen,
  nodes,
  onClose,
  onAddObject,
  unitPrice,
  currency,
  focusNodeId,
}: BreadcrumbRailModalProps) {
  const [activeNodeId, setActiveNodeId] = useState(nodes[0]?.id ?? "")

  if (focusNodeId && focusNodeId !== activeNodeId && nodes.some((n) => n.id === focusNodeId)) {
    setActiveNodeId(focusNodeId)
  }

  const activeNode = nodes.find((n) => n.id === activeNodeId) ?? nodes[0]
  const activeIsMeter = activeNode?.kind === "meter"
  const modalWidth = activeIsMeter ? "w-[820px]" : "w-[520px]"

  const headerActions = (
    <div className="flex items-center gap-[8px]">
      <button type="button" className="flex h-[28px] items-center rounded-[6px] px-[10px] text-[12px] font-[500] text-[#596171] transition-colors hover:bg-[#F5F6F8]" onClick={onClose}>
        Cancel
      </button>
      <button type="button" className="flex h-[28px] items-center rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white transition-colors hover:bg-[#4730E0]" onClick={onClose}>
        Create
      </button>
    </div>
  )

  const breadcrumbRail = nodes.length > 1 ? (
    <div className="flex items-center gap-[4px] border-b border-[#ECF1F6] px-[20px] py-[10px]">
      {nodes.map((node, idx) => {
        const isActive = node.id === activeNodeId
        const hasData = !!(node.data.name || Object.keys(node.data).length > 0)
        return (
          <div key={node.id} className="flex items-center gap-[4px]">
            {idx > 0 && (
              <div className="flex items-center px-[4px]">
                <div className="h-[1px] w-[16px] bg-[#D4DEE9]" />
              </div>
            )}
            <button
              type="button"
              className={`flex items-center gap-[6px] rounded-[6px] px-[10px] py-[5px] text-[12px] font-[500] transition-all ${
                isActive
                  ? "bg-[#F0EDFF] text-[#533AFD]"
                  : "text-[#596171] hover:bg-[#F5F6F8]"
              }`}
              onClick={() => setActiveNodeId(node.id)}
            >
              <div className={`h-[6px] w-[6px] rounded-full ${
                isActive ? "bg-[#533AFD]" : hasData ? "bg-[#30D158]" : "bg-[#D4DEE9]"
              }`} />
              {node.label}
            </button>
          </div>
        )
      })}
    </div>
  ) : null

  return (
    <CreationModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={activeNode?.label ?? "New object"}
      modalWidth={modalWidth}
      maxHeight="max-h-[85vh]"
      headerActions={headerActions}
    >
      {breadcrumbRail}
      <div className="flex min-h-0 flex-1">
        <AnimatePresence mode="wait">
          {activeNode && (
            <motion.div
              key={activeNode.id}
              className={`flex min-h-0 flex-1 ${activeIsMeter ? "" : "flex-col"}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeIsMeter ? (
                <>
                  <div className="w-[400px] overflow-y-auto border-r border-[#ECF1F6] px-[20px] py-[16px]">
                    <activeNode.FormComponent
                      data={activeNode.data}
                      onChange={activeNode.onChange}
                      onAddObject={onAddObject}
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto bg-[#F8FAFB] px-[20px] py-[16px]">
                    <MeterPreviewPanel
                      meters={[{
                        name: activeNode.data.name || "",
                        displayName: activeNode.data.displayName || "",
                        aggregation: activeNode.data.aggregation || "sum",
                        valueKey: activeNode.data.valueKey || "",
                      }]}
                      unitPrice={unitPrice}
                      currency={currency}
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 overflow-y-auto px-[20px] py-[16px]">
                  <activeNode.FormComponent
                    data={activeNode.data}
                    onChange={activeNode.onChange}
                    onAddObject={onAddObject}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </CreationModalShell>
  )
}
