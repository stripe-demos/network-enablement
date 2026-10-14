'use client'

import type { UserPath } from "./model"

const PATHS: ReadonlyArray<{ id: UserPath; label: string }> = [
  { id: "direct", label: "Direct user" },
  { id: "platform", label: "Platform user" },
]

export function UserPathPicker({ onChoose }: { onChoose: (path: UserPath) => void }) {
  return (
    <div className="flex flex-col items-center px-[56px] py-[40px]" data-user-path-picker>
      <div className="flex items-start gap-[24px]">
        {PATHS.map((path) => (
          <button
            key={path.id}
            type="button"
            onClick={() => onChoose(path.id)}
            className="group flex w-[188px] flex-col items-start"
          >
            <span className="w-full overflow-hidden rounded-[10px] border border-[#D4DEE9] bg-white shadow-[0_1px_2px_rgba(20,34,52,0.04)] transition-[border-color,box-shadow,transform] group-hover:-translate-y-[1px] group-hover:border-[#533AFD] group-hover:shadow-[0_10px_24px_rgba(83,58,253,0.14)]">
              <span className="flex h-[22px] items-center gap-[5px] border-b border-[#ECF1F6] bg-[#F8FAFB] px-[8px]">
                <span className="h-[6px] w-[6px] rounded-full bg-[#E3E8EF]" />
                <span className="h-[6px] w-[6px] rounded-full bg-[#E3E8EF]" />
                <span className="h-[6px] w-[6px] rounded-full bg-[#E3E8EF]" />
              </span>
              <span className="flex h-[112px] flex-col justify-center gap-[8px] bg-[#FCFDFE] px-[16px]">
                <span className="h-[8px] w-[72px] rounded-full bg-[#E3E8EF]" />
                <span className="h-[6px] w-full rounded-full bg-[#EEF2F6]" />
                <span className="h-[6px] w-[78%] rounded-full bg-[#EEF2F6]" />
                <span className="mt-[4px] h-[22px] w-[64px] rounded-[5px] bg-[#E8E4FF]" />
              </span>
            </span>
            <span className="mt-[10px] text-[13px] font-[650] leading-[18px] text-[#1A2C44] transition-colors group-hover:text-[#533AFD]">
              {path.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
