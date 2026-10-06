'use client'

import type { ReactNode } from "react"

// A floating white pill for wayfinding out of an example demo back to the /patterns docs.
// Used on the Simple dashboard backdrop (top-left) and over the full-screen editor demos
// (bottom-left, so it stays clear of the editor's own top chrome). z-[70] keeps it above
// both the Simple modal (z-50) and the full-screen editor shells.
export function DemoContextBar({
  patternLabel,
  exampleLabel,
  onBack,
  placement = "top-left",
  zIndexClass = "z-[70]",
  trailingAction,
}: {
  patternLabel: string
  exampleLabel: string
  onBack: () => void
  placement?: "top-left" | "bottom-left"
  // Override for surfaces with high-z chrome (e.g. the pricing-plan editor's panels).
  zIndexClass?: string
  trailingAction?: ReactNode
}) {
  const pos = placement === "bottom-left" ? "bottom-[8px] left-[8px]" : "left-[8px] top-[8px]"
  return (
    <div
      className={`fixed ${pos} ${zIndexClass} flex h-[40px] w-max items-center gap-[10px] rounded-full border border-white/[0.08] bg-[#1A2234] px-[16px] shadow-[0_6px_20px_-6px_rgba(10,16,28,0.35),0_2px_6px_-2px_rgba(10,16,28,0.25)]`}
    >
      <button
        type="button"
        onClick={onBack}
        className="group/back flex items-center gap-[7px] text-[13px] font-[500] text-white/90 transition-colors hover:text-white"
      >
        <BackArrow />
        {patternLabel}
      </button>
      <span className="text-white/25" aria-hidden>/</span>
      <span className="text-[13px] font-[400] text-white/55">{exampleLabel}</span>
      {trailingAction ? (
        <>
          <span className="text-white/25" aria-hidden>/</span>
          {trailingAction}
        </>
      ) : null}
    </div>
  )
}

// Back affordance: a left chevron whose shaft draws in on hover, morphing "‹" → "←",
// while the whole arrow nudges left.
function BackArrow() {
  return (
    <svg width="9" height="12" viewBox="0 0 9 12" fill="none" aria-hidden="true" className="shrink-0 overflow-visible transition-transform duration-200 ease-out group-hover/back:-translate-x-[3px]">
      <path d="M6 2.5 2.5 6 6 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M2.5 6H11.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="[stroke-dasharray:9] [stroke-dashoffset:9] transition-[stroke-dashoffset] duration-200 ease-out group-hover/back:[stroke-dashoffset:0]"
      />
    </svg>
  )
}
