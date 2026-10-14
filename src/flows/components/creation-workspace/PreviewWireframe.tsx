'use client'

export function PreviewWireframe() {
  const bar = "bg-[#C1CCD7]"

  return (
    <div className="w-[600px] rounded-[16px] bg-[#F4F7FA] p-[32px]">
      <div className="rounded-[12px] border border-[#E3E8EF] bg-white px-[32px] py-[28px] shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
        {/* Header */}
        <div className="mb-[20px] flex flex-col items-center gap-[8px]">
          <div className={`h-[8px] w-[120px] rounded-full ${bar}`} />
          <div className={`h-[6px] w-[180px] rounded-full ${bar} opacity-60`} />
        </div>

        {/* Line items */}
        <div className="space-y-[14px]">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-[4px]">
              <div className={`h-[6px] w-[100px] rounded-full ${bar}`} />
              <div className={`h-[5px] w-[72px] rounded-full ${bar} opacity-50`} />
            </div>
            <div className={`h-[6px] w-[52px] rounded-full ${bar}`} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-[4px]">
              <div className={`h-[6px] w-[88px] rounded-full ${bar}`} />
              <div className={`h-[5px] w-[64px] rounded-full ${bar} opacity-50`} />
            </div>
            <div className={`h-[6px] w-[44px] rounded-full ${bar}`} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-[4px]">
              <div className={`h-[6px] w-[112px] rounded-full ${bar}`} />
              <div className={`h-[5px] w-[80px] rounded-full ${bar} opacity-50`} />
            </div>
            <div className={`h-[6px] w-[48px] rounded-full ${bar}`} />
          </div>
        </div>

        {/* Divider */}
        <div className="my-[16px] border-t border-[#E3E8EF]" />

        {/* Subtotal section */}
        <div className="space-y-[12px]">
          <div className="flex items-center justify-between">
            <div className={`h-[6px] w-[72px] rounded-full ${bar}`} />
            <div className={`h-[6px] w-[56px] rounded-full ${bar}`} />
          </div>
          <div className="flex items-center justify-between">
            <div className={`h-[6px] w-[56px] rounded-full ${bar}`} />
            <div className={`h-[6px] w-[40px] rounded-full ${bar}`} />
          </div>
        </div>

        {/* Divider */}
        <div className="my-[16px] border-t border-[#E3E8EF]" />

        {/* Total */}
        <div className="flex items-center justify-between">
          <div className={`h-[7px] w-[64px] rounded-full ${bar}`} />
          <div className={`h-[7px] w-[68px] rounded-full ${bar}`} />
        </div>
      </div>
    </div>
  )
}
