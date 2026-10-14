'use client'

import type { ComponentType } from "react"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { MeterPreviewPanel } from "@/components/creation-workspace/MeterPreviewPanel"
import { PricePreviewPanel } from "@/components/creation-workspace/PricePreviewPanel"
import { ProductPreviewPanel } from "@/components/creation-workspace/ProductPreviewPanel"
import { CreationModalShell } from "./CreationModalShell"

type TabConfig = {
  id: string
  label: string
  kind: string
  FormComponent: ComponentType<{ data: Record<string, any>; onChange: (data: Record<string, any>) => void; onAddObject?: (kind: string) => void }>
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
}

type TabbedCreationModalProps = {
  isOpen: boolean
  label: string
  tabs: TabConfig[]
  onClose: () => void
  onAddObject?: (kind: string) => void
  /** Show preview panel for meters */
  meters?: { name: string; displayName?: string; aggregation: string; valueKey?: string }[]
  unitPrice?: string
  currency?: string
  /** When set, the modal will switch to this tab */
  focusTabId?: string | null
}

export function TabbedCreationModal({
  isOpen,
  label,
  tabs,
  onClose,
  onAddObject,
  meters = [],
  unitPrice,
  currency,
  focusTabId,
}: TabbedCreationModalProps) {
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id ?? "")
  const hasPreview = meters.length > 0
  const showPreviewTab = tabs.length > 1 || hasPreview

  // Switch to a newly added tab when focusTabId changes
  useEffect(() => {
    if (focusTabId && tabs.some((t) => t.id === focusTabId)) {
      setActiveTabId(focusTabId)
      setShowPreview(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to focusTabId changes, not tabs rebuilds
  }, [focusTabId])

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0]
  const [showPreview, setShowPreview] = useState(false)

  const activeTabIsMeter = activeTab?.kind === "meter"
  const activeTabIsPrice = activeTab?.kind === "price"
  const activeTabIsProduct = activeTab?.kind === "product"
  const showInlinePreview = (activeTabIsMeter || activeTabIsPrice || activeTabIsProduct) && !showPreview
  const modalWidth = (showPreviewTab || showInlinePreview) ? "w-[780px]" : "w-[480px]"

  const primaryLabel = tabs.length <= 1 ? `Create ${label.toLowerCase()}` : `Create ${tabs.length} items`

  const tabsBar = showPreviewTab ? (
    <div className="flex items-center gap-[2px] border-b border-[#ECF1F6] px-[20px]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`relative px-[12px] py-[10px] text-[12px] font-[500] transition-colors ${
            activeTabId === tab.id && !showPreview
              ? "text-[#353A44]"
              : "text-[#9CA3B0] hover:text-[#596171]"
          }`}
          onClick={() => { setActiveTabId(tab.id); setShowPreview(false) }}
        >
          {tab.label}
          {activeTabId === tab.id && !showPreview && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute bottom-0 left-[12px] right-[12px] h-[2px] rounded-full bg-[#533AFD]"
            />
          )}
        </button>
      ))}
      {hasPreview && (
        <button
          type="button"
          className={`relative px-[12px] py-[10px] text-[12px] font-[500] transition-colors ${
            showPreview ? "text-[#353A44]" : "text-[#9CA3B0] hover:text-[#596171]"
          }`}
          onClick={() => setShowPreview(true)}
        >
          Preview
          {showPreview && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute bottom-0 left-[12px] right-[12px] h-[2px] rounded-full bg-[#533AFD]"
            />
          )}
        </button>
      )}
    </div>
  ) : null

  return (
    <CreationModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={`New ${label.toLowerCase()}`}
      primaryLabel={primaryLabel}
      modalWidth={modalWidth}
    >
      {tabsBar}
      <div className="flex min-h-0 flex-1">
        {showPreview ? (
          <div className="flex-1 overflow-y-auto px-[20px] py-[16px]">
            <MeterPreviewPanel meters={meters} unitPrice={unitPrice} currency={currency} />
          </div>
        ) : showInlinePreview && activeTab ? (
          <>
            <div className="w-[400px] overflow-y-auto border-r border-[#ECF1F6] px-[20px] py-[16px]">
              <activeTab.FormComponent
                data={activeTab.data}
                onChange={activeTab.onChange}
                onAddObject={onAddObject}
              />
            </div>
            <div className="flex-1 overflow-y-auto bg-[#F8FAFB] px-[20px] py-[16px]">
              {activeTabIsMeter && (
                <MeterPreviewPanel
                  meters={[{
                    name: activeTab.data.name || "",
                    displayName: activeTab.data.displayName || "",
                    aggregation: activeTab.data.aggregation || "sum",
                    valueKey: activeTab.data.valueKey || "",
                  }]}
                  unitPrice={unitPrice}
                  currency={currency}
                />
              )}
              {activeTabIsPrice && (
                <PricePreviewPanel data={activeTab.data} />
              )}
              {activeTabIsProduct && (
                <ProductPreviewPanel data={activeTab.data} />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto px-[20px] py-[16px]">
            {activeTab && (
              <activeTab.FormComponent
                data={activeTab.data}
                onChange={activeTab.onChange}
                onAddObject={onAddObject}
              />
            )}
          </div>
        )}
      </div>
    </CreationModalShell>
  )
}
