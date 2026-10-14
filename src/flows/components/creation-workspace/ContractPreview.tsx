'use client'

import type { PreviewProps } from "./workflowConfig"

const MOCK_PRICING_PLANS: Record<string, { name: string; detail: string; rateCards: { name: string; items: { description: string; price: string }[] }[] }> = {
  plan_1: { name: "Starter", detail: "Monthly", rateCards: [{ name: "Base", items: [{ description: "Platform access", price: "$49/mo" }] }] },
  plan_2: { name: "Growth", detail: "Monthly", rateCards: [{ name: "Base", items: [{ description: "Platform access", price: "$149/mo" }, { description: "API calls", price: "$0.01/call" }] }, { name: "Support", items: [{ description: "Priority support", price: "$50/mo" }] }] },
  plan_3: { name: "Enterprise", detail: "Monthly", rateCards: [{ name: "Base", items: [{ description: "Platform access", price: "$499/mo" }, { description: "API calls", price: "$0.005/call" }] }, { name: "Support", items: [{ description: "Dedicated CSM", price: "$200/mo" }] }, { name: "Compliance", items: [{ description: "SOC 2 report", price: "Included" }] }] },
}

export function ContractPreview({ data, allObjects }: PreviewProps) {
  const customerObj = allObjects.find((o) => o.kind === "customer")
  const customerName = customerObj?.data.name || data.customerName || null
  const contractName = data.name || "Untitled contract"
  const planId = data.parentPlanId as string | undefined
  const planData = planId ? MOCK_PRICING_PLANS[planId] : null
  const planName = data.parentPlanName || planData?.name || null
  const startDate = data.startDate as string | undefined
  const endDate = data.endDate as string | undefined
  const syncEnabled = data.syncWithParent !== "false"

  const formatDate = (d: string) => {
    try {
      return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    } catch {
      return d
    }
  }

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto">
      <div className="w-full max-w-[432px] overflow-clip rounded-[12px] border border-[#D4DEE9] bg-white">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white p-[24px]">
          <div className="flex items-center gap-[8px]">
            <div className="flex h-[28px] w-[28px] items-center justify-center rounded-[6px] bg-[#F3F0FF]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3.5 1.75h7a1.75 1.75 0 0 1 1.75 1.75v7a1.75 1.75 0 0 1-1.75 1.75h-7A1.75 1.75 0 0 1 1.75 10.5v-7A1.75 1.75 0 0 1 3.5 1.75Z" stroke="#533AFD" strokeWidth="1.2" />
                <path d="M4.5 5h5M4.5 7h5M4.5 9h3" stroke="#533AFD" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-[16px] font-[600] leading-[20px] tracking-[-0.2px] text-[#1A2C44]">
                {contractName}
              </p>
              {planName && (
                <p className="mt-[1px] text-[12px] font-[400] text-[#596171]">{planName} plan</p>
              )}
            </div>
          </div>

          {customerName && (
            <div className="mt-[16px] rounded-[8px] bg-[#F8FAFB] px-[12px] py-[10px]">
              <p className="text-[11px] font-[500] uppercase tracking-[0.5px] text-[#667691]">Customer</p>
              <p className="mt-[2px] text-[13px] font-[500] text-[#1A2C44]">{customerName}</p>
            </div>
          )}
        </div>

        {/* Term */}
        {(startDate || endDate) && (
          <div className="border-t border-[#D4DEE9] px-[24px] py-[16px]">
            <p className="text-[11px] font-[500] uppercase tracking-[0.5px] text-[#667691]">Contract term</p>
            <div className="mt-[6px] flex items-center gap-[8px]">
              <span className="text-[13px] font-[500] text-[#1A2C44]">
                {startDate ? formatDate(startDate) : "TBD"}
              </span>
              <span className="text-[12px] text-[#9CA3B0]">→</span>
              <span className="text-[13px] font-[500] text-[#1A2C44]">
                {endDate ? formatDate(endDate) : "TBD"}
              </span>
            </div>
          </div>
        )}

        {/* Rate cards */}
        {planData && planData.rateCards.length > 0 && (
          <div className="border-t border-[#D4DEE9] px-[24px] py-[16px]">
            <p className="text-[11px] font-[500] uppercase tracking-[0.5px] text-[#667691]">Rate cards</p>
            <div className="mt-[8px] flex flex-col gap-[10px]">
              {planData.rateCards.map((card, i) => (
                <div key={i} className="rounded-[8px] border border-[#ECF1F6] bg-[#FAFBFC] px-[12px] py-[10px]">
                  <p className="text-[12px] font-[600] text-[#1A2C44]">{card.name}</p>
                  <div className="mt-[6px] flex flex-col gap-[4px]">
                    {card.items.map((item, j) => (
                      <div key={j} className="flex items-center justify-between">
                        <span className="text-[12px] text-[#596171]">{item.description}</span>
                        <span className="text-[12px] font-[500] tabular-nums text-[#1A2C44]">{item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-[#D4DEE9] px-[24px] py-[12px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-[500] text-[#667691]">
              {syncEnabled ? "Synced with parent plan" : "Independent (no sync)"}
            </span>
            <div className={`h-[6px] w-[6px] rounded-full ${syncEnabled ? "bg-[#30D158]" : "bg-[#D4DEE9]"}`} />
          </div>
        </div>
      </div>
    </div>
  )
}
