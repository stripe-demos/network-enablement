'use client'

import { useProductFormStyle, type ProductFormStyle } from "@/components/creation-workspace/productFormStyle"

const OPTIONS: { value: ProductFormStyle; label: string }[] = [
  { value: 'current', label: 'Compact' },
  { value: 'sail', label: 'Standard' },
  { value: 'refresh', label: 'Refresh' },
]

/**
 * Floating toolbar (bottom-center) shown while previewing an example. Lets you
 * switch the UI style (Compact / Standard / Refresh) live — mirrors the floating
 * switcher in the pattern-starter kit. Sits above modals and fullscreen editors.
 */
export function UiStyleSwitcher() {
  const { productFormStyle, setProductFormStyle } = useProductFormStyle()

  return (
    <div className="example-ui fixed bottom-[16px] left-1/2 z-[100] -translate-x-1/2">
      <div className="flex items-center gap-[8px] rounded-full border border-[#E3EAF2] bg-white/95 py-[6px] pl-[12px] pr-[6px] shadow-[0_4px_16px_rgba(0,0,0,0.10)] backdrop-blur">
        <span className="text-[12px] font-[500] text-[#68778B]">UI style</span>
        <div className="flex items-center gap-[2px] rounded-full bg-[#F1F6FB] p-[3px]">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setProductFormStyle(o.value)}
              className={`rounded-full px-[12px] py-[5px] text-[12px] transition-colors ${
                productFormStyle === o.value
                  ? 'bg-white font-[500] text-[#142234] shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                  : 'text-[#526378] hover:text-[#142234]'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
