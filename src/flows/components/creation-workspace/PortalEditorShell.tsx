'use client'

import { motion } from "framer-motion"
import type { ReactNode } from "react"

type PortalEditorShellProps = {
  originLabel: string
  currentLabel: string
  onBack: () => void
  isExiting?: boolean
  children: ReactNode
}

export function PortalEditorShell({
  originLabel,
  currentLabel,
  onBack,
  isExiting = false,
  children,
}: PortalEditorShellProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col bg-[#F6F8FA]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
    >
      <motion.div
        className="flex items-center gap-[8px] px-[16px] pt-[16px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: isExiting ? 0 : 1 }}
        transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      >
        <button
          type="button"
          className="text-[12px] font-[400] leading-[16px] text-[#1A2C44] transition-colors hover:text-[#533AFD]"
          onClick={onBack}
        >
          {originLabel}
        </button>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="text-[#667691]">
          <path d="M2.5 1.5L5.5 4L2.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#1A2C44]">
          {currentLabel}
        </span>
      </motion.div>

      <motion.div
        className="mx-[16px] mb-[16px] mt-[16px] flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-[#D4DEE9] bg-white shadow-[0px_4px_12px_rgba(0,0,0,0.06),0px_1px_4px_rgba(0,0,0,0.04)]"
        initial={{ scale: 0.85, opacity: 0.8, y: 20 }}
        animate={isExiting ? { scale: 0.92, opacity: 0, y: 12 } : { scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 10 }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        style={{ transformOrigin: "center center" }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
