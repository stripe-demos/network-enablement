'use client'

import { cn } from "@/lib/utils"

type PreviewOption = {
  key: string
  label: string
}

type PreviewSwitcherProps = {
  options: PreviewOption[]
  activeKey: string
  onChange: (key: string) => void
}

export function PreviewSwitcher({ options, activeKey, onChange }: PreviewSwitcherProps) {
  if (options.length <= 1) return null

  return (
    <div className="absolute right-[16px] top-[12px] z-10 flex h-[28px] items-center gap-[2px] overflow-visible rounded-[6px] bg-[#ECF1F6] p-[2px]">
      {options.map((opt) => {
        const isActive = opt.key === activeKey
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={cn(
              "flex h-full items-center justify-center rounded-[5px] px-[8px] text-[11px] font-[500] leading-[14px] transition-colors",
              isActive
                ? "bg-white text-[#353A44] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                : "text-[#596171] hover:text-[#353A44]"
            )}
            aria-pressed={isActive}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
