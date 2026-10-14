'use client'

import { motion } from "framer-motion"

import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"
import { getFormTokens } from "@/components/creation-workspace/forms/shared/formTokens"

type DiscardConfirmOverlayProps = {
  title: string
  description: string
  onKeepEditing: () => void
  onDiscard: () => void
}

export function DiscardConfirmOverlay({
  title,
  description,
  onKeepEditing,
  onDiscard,
}: DiscardConfirmOverlayProps) {
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)
  const isRefresh = productFormStyle === "refresh"
  const isSail = productFormStyle === "sail"

  const secondaryButtonClass = isRefresh
    ? tokens.secondaryButtonClass
    : isSail
      ? "flex h-[28px] items-center rounded-[6px] bg-white px-[8px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#353A44] shadow-[0px_1px_1px_0px_rgba(26,27,37,0.16),0px_0px_0px_1px_#D5DBE1] transition-colors hover:bg-[#F5F6F8]"
      : tokens.secondaryButtonClass

  const dangerButtonClass = isRefresh
    ? "flex h-[32px] items-center justify-center rounded-full bg-[#E61947] px-[12px] text-[13px] font-[500] leading-[20px] tracking-[-0.065px] text-white transition-colors hover:bg-[#C0123C]"
    : isSail
      ? "flex h-[28px] items-center rounded-[6px] bg-[#E61947] px-[8px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-white shadow-[0px_1px_1px_0px_rgba(62,2,26,0.32),0_0_0_1px_#E61947] transition-colors hover:bg-[#C0123C]"
      : "flex h-[28px] items-center rounded-[6px] border border-[#DF1B41] bg-[#DF1B41] px-[10px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white transition-colors hover:bg-[#C5173A]"

  return (
    <motion.div
      className="absolute inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(255, 255, 255, 0.75)", borderRadius: "inherit" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="discard-confirm-title"
      aria-describedby="discard-confirm-description"
    >
      <div
        className="flex w-full max-w-[480px] flex-col items-start gap-[4px] p-[40px]"
        style={{
          borderRadius: 9999,
          background: "#FFF",
          boxShadow: "0 4px 50px 40px #FFF",
        }}
      >
        <span id="discard-confirm-title" className="text-[20px] font-[700] leading-[28px] text-[#1A2C44]">
          {title}
        </span>
        <span id="discard-confirm-description" className="text-[14px] font-[400] leading-[20px] text-[#1A2C44]">
          {description}
        </span>
        <div className="mt-[12px] flex items-center gap-[8px]">
          <button type="button" className={secondaryButtonClass} onClick={onKeepEditing}>
            Continue editing
          </button>
          <button type="button" className={dangerButtonClass} onClick={onDiscard}>
            Discard
          </button>
        </div>
      </div>
    </motion.div>
  )
}
