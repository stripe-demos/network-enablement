'use client'

type CatalogSidebarSkeletonProps = {
  onOpenFlow?: (flow: string) => void
  activeFlow?: string | null
}

export function CatalogSidebarSkeleton({ onOpenFlow, activeFlow }: CatalogSidebarSkeletonProps = {}) {
  const isVercel = Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV)

  const allFlowItems: { id: string; label: string }[] = [
    { id: "invoices", label: "Invoices" },
    { id: "subscriptions", label: "Subscriptions" },
    { id: "usage-billing", label: "Usage-based billing" },
    { id: "contracts", label: "Contracts" },
    { id: "customers", label: "Customers" },
    { id: "products", label: "Products" },
    { id: "coupons", label: "Coupons" },
  ]

  const vercelFlowIds = ["invoices", "usage-billing", "products"]
  const flowItems = isVercel ? allFlowItems.filter(item => vercelFlowIds.includes(item.id)) : allFlowItems

  return (
    <aside
      className="hidden w-[240px] flex-col border-r border-[#F5F5F5] bg-white px-6 py-[18px] lg:flex"
    >
      <div className="mb-[44px] flex items-center gap-[9px]">
        <div className="h-[24px] w-[24px] shrink-0 rounded-[4px] bg-[#F5F6F8]" />
        <div className="h-[11px] w-[78px] shrink-0 rounded-[40px] bg-[#F5F6F8]" />
      </div>

      <div className="flex flex-col gap-[44px]">
        <div className="flex w-[135px] flex-col gap-[14px]">
          {[37, 57, 81, 68, 106].map((width, i) => {
            const isActive = i === 2 && !activeFlow
            const row = (
              <>
                <div className={`h-[16px] w-[16px] shrink-0 rounded-[4px] ${isActive ? "bg-[#D8DEE4]" : "bg-[#F5F6F8]"}`} />
                <div
                  className={`h-[11px] shrink-0 rounded-[40px] ${isActive ? "bg-[#D8DEE4]" : "bg-[#F5F6F8]"}`}
                  style={{ width: `${width}px` }}
                />
              </>
            )

            if (i === 2) {
              return (
                <button
                  key={`nav-group-1-${i}`}
                  type="button"
                  className="flex items-center gap-[13px] cursor-pointer rounded-[4px] transition-colors hover:opacity-80"
                  onClick={() => onOpenFlow?.("")}
                >
                  {row}
                </button>
              )
            }

            return (
              <div key={`nav-group-1-${i}`} className="flex items-center gap-[13px]">
                {row}
              </div>
            )
          })}
        </div>

        <div className="flex w-full flex-col gap-[14px]">
          <div className="h-[11px] w-[53px] shrink-0 rounded-[40px] bg-[#F5F6F8]" />
          {[51, 127, 118, 86, 132].map((width, i) => (
            <div key={`nav-group-2-${i}`} className="flex items-center gap-[13px]">
              <div className="h-[16px] w-[16px] shrink-0 rounded-[4px] bg-[#F5F6F8]" />
              <div className="h-[11px] shrink-0 rounded-[40px] bg-[#F5F6F8]" style={{ width: `${width}px` }} />
            </div>
          ))}
        </div>

        {/* Real nav items for creation flows */}
        <div className="flex w-full flex-col gap-[4px]">
          <p className="mb-[6px] text-[11px] font-[600] uppercase tracking-[0.5px] text-[#9CA3B0]">
            Billing
          </p>
          {flowItems.map((item) => {
            const isActive = activeFlow === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={`flex items-center gap-[10px] rounded-[6px] px-[8px] py-[6px] text-left text-[13px] leading-[16px] tracking-[-0.065px] transition-colors ${
                  isActive
                    ? "bg-[#EBEEF1] font-[600] text-[#1A2C44]"
                    : "font-[500] text-[#596171] hover:bg-[#F5F6F8] hover:text-[#353A44]"
                }`}
                onClick={() => onOpenFlow?.(item.id)}
              >
                <div className={`h-[16px] w-[16px] shrink-0 rounded-[4px] ${isActive ? "bg-[#D8DEE4]" : "bg-[#F5F6F8]"}`} />
                {item.label}
              </button>
            )
          })}
        </div>

        <div className="flex w-full flex-col gap-[14px]">
          <div className="h-[11px] w-[53px] shrink-0 rounded-[40px] bg-[#F5F6F8]" />
          {[51, 61, 36, 61, 31].map((width, i) => (
            <div key={`nav-group-3-${i}`} className="flex items-center gap-[13px]">
              <div className="h-[16px] w-[16px] shrink-0 rounded-[4px] bg-[#F5F6F8]" />
              <div className="h-[11px] shrink-0 rounded-[40px] bg-[#F5F6F8]" style={{ width: `${width}px` }} />
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
