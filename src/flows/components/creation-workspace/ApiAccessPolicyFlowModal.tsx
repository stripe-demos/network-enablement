'use client'

import { useState, type MouseEvent } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ApiAccessPolicyForm, defaultApiAccessPolicyData } from "./forms/ApiAccessPolicyForm"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"

/**
 * Simple-pattern example: the whole "Suspicious API request" flow condensed into
 * one modal. It starts as a review — confirm the conditions that make a flagged
 * request safe — and creating an access policy to harden the key is optional,
 * revealed by a toggle. Mirrors the Coupon/Product/Customer Simple examples
 * rather than the multi-step wizard in the source designs. Self-contained state.
 */
export function ApiAccessPolicyFlowModal({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<Record<string, any>>(defaultApiAccessPolicyData)
  const { productFormStyle } = useProductFormStyle()
  const isSail = productFormStyle === "sail"
  const isRefresh = productFormStyle === "refresh"

  const noConditions = (data.safeConditions ?? []).length === 0
  const primaryLabel = data.createPolicy ? "Mark as safe and create policy" : "Mark as safe"

  const titleClass = isSail
    ? "text-[16px] font-[700] leading-[24px] tracking-[-0.31px] text-[#353A44]"
    : isRefresh
      ? "text-[20px] font-[600] leading-[24px] tracking-[-0.2px] text-[#142234]"
      : "text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]"
  const secondaryButtonClass = isSail
    ? "flex h-[28px] items-center rounded-[6px] bg-white px-[8px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#353A44] shadow-[0px_1px_1px_0px_rgba(26,27,37,0.16),0px_0px_0px_1px_#D5DBE1] transition-colors hover:bg-[#F5F6F8]"
    : isRefresh
      ? "flex items-center gap-[6px] rounded-full bg-[#F1F6FB] px-[12px] py-[6px] text-[13px] font-[500] leading-[20px] tracking-[-0.065px] text-[#142234] transition-colors hover:bg-[#EAF0F6]"
      : "flex h-[28px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
  const primaryButtonClass = isSail
    ? "flex h-[28px] items-center rounded-[6px] bg-[#675DFF] px-[8px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-white shadow-[0px_1px_1px_0px_rgba(20,19,78,0.32),0px_0px_0px_1px_#625AFA] hover:bg-[#5B52F0]"
    : isRefresh
      ? "flex items-center gap-[6px] rounded-full bg-[#2C219E] px-[12px] py-[6px] text-[13px] font-[500] leading-[20px] tracking-[-0.065px] text-white transition-colors hover:bg-[#241A86]"
      : "flex h-[28px] items-center rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white hover:bg-[#4730E0]"
  const modalClass = isSail
    ? "flex max-h-[80vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[8px] border border-[#EBEEF1] bg-white shadow-[0px_15px_35px_0px_rgba(48,49,61,0.08),0px_5px_15px_0px_rgba(0,0,0,0.12)]"
    : isRefresh
      ? "flex max-h-[80vh] w-[560px] max-w-full flex-col overflow-hidden rounded-[12px] border border-[#D8E1EA] bg-white shadow-[0px_20px_60px_rgba(20,34,52,0.12),0px_4px_16px_rgba(20,34,52,0.08)]"
      : "flex max-h-[80vh] w-[560px] max-w-full flex-col overflow-hidden rounded-[12px] border border-[#EBEEF1] bg-white shadow-[0px_20px_60px_rgba(0,0,0,0.12),0px_4px_16px_rgba(0,0,0,0.08)]"
  const headerClass = isSail
    ? "border-b border-[#ECF1F6] p-[16px]"
    : isRefresh
      ? "px-[24px] py-[24px]"
      : "border-b border-[#ECF1F6] px-[20px] py-[14px]"
  const contentClass = isSail
    ? "min-h-0 overflow-y-auto px-[16px] py-[16px]"
    : isRefresh
      ? "min-h-0 overflow-y-auto px-[24px] pt-0 pb-[16px]"
      : "min-h-0 overflow-y-auto px-[20px] py-[16px]"
  const footerClass = isSail
    ? "flex items-center justify-end gap-[8px] border-t border-[#ECF1F6] p-[16px]"
    : isRefresh
      ? "flex items-center justify-end gap-[8px] px-[24px] py-[24px]"
      : "flex items-center justify-end gap-[8px] border-t border-[#ECF1F6] px-[20px] py-[12px]"
  const disabledPrimary = isRefresh
    ? "cursor-not-allowed opacity-50 hover:bg-[#2C219E]"
    : isSail
      ? "cursor-not-allowed opacity-50 hover:bg-[#675DFF]"
      : "cursor-not-allowed opacity-50 hover:bg-[#533AFD]"

  return (
    <AnimatePresence>
      <motion.div
        key="api-access-policy-backdrop"
        className="fixed inset-0 z-40 bg-black/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        key="api-access-policy-dialog"
        className="fixed inset-0 z-50 flex items-center justify-center p-[24px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <motion.div
          className={modalClass}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          onClick={(e: MouseEvent) => e.stopPropagation()}
        >
          <div className={`${headerClass} flex items-center justify-between`}>
            <p className={titleClass}>Jane&apos;s API key</p>
          </div>

          <div className={contentClass}>
            <ApiAccessPolicyForm data={data} onChange={(d) => setData((prev) => ({ ...prev, ...d }))} />
          </div>

          <div className={footerClass}>
            <button type="button" className={secondaryButtonClass} onClick={onClose}>Cancel</button>
            <button
              type="button"
              className={`${primaryButtonClass} ${noConditions ? disabledPrimary : ""}`}
              onClick={onClose}
              disabled={noConditions}
            >
              {primaryLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
