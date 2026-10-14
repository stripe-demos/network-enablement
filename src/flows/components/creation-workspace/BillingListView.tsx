'use client'

// Width variants for table placeholder bars
const widthClasses = [
  "w-[30%]", "w-[35%]", "w-[40%]", "w-[45%]", "w-[50%]",
  "w-[55%]", "w-[60%]", "w-[65%]", "w-[70%]", "w-[75%]",
]

type BillingListViewProps = {
  title: string
  createLabel: string
  onCreate: () => void
  columns: string[]
}

export function BillingListView({ title, createLabel, onCreate, columns }: BillingListViewProps) {
  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <p className="text-[28px] font-bold tracking-[-0.56px] text-[#0D111A]">
          {title}
        </p>
        <button
          type="button"
          className="rounded-[6px] bg-[#675DFF] px-3 py-2 text-[13px] font-[500] text-white shadow-[0_1px_1px_rgba(47,14,99,0.32)] hover:bg-[#5B52F0] transition-colors"
          onClick={onCreate}
        >
          {createLabel}
        </button>
      </div>

      {/* Toolbar skeleton */}
      <div className="mt-4 flex flex-wrap gap-5 border-b border-[#EBEEF1] pb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[11px] w-[81px] rounded-full bg-[#F5F6F8]" />
        ))}
      </div>

      {/* Filter bar skeleton */}
      <div className="mt-4 flex flex-wrap gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="min-w-[180px] flex-1 rounded-[6px] border border-[#D8DEE4] bg-white px-4 py-3">
            <div className="h-[11px] w-full rounded-full bg-[#F5F6F8]" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="-mx-10 mt-6 border-b border-[#EBEEF1]">
        <div className="px-10">
          {/* Header row */}
          <div className="border-b border-[#EBEEF1] bg-white">
            <div
              className="grid h-[40px] items-center gap-8 text-[12px] font-[500] text-[#6C7688]"
              style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
            >
              {columns.map((col) => (
                <span key={col}>{col}</span>
              ))}
            </div>
          </div>

          {/* Skeleton rows */}
          <div className="divide-y divide-[#EBEEF1] bg-white">
            {Array.from({ length: 40 }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="grid h-[40px] items-center gap-8"
                style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
              >
                {Array.from({ length: columns.length }).map((_, colIndex) => {
                  const seed = rowIndex * columns.length + colIndex
                  const wordCount = seed % 7 === 0 ? 3 : seed % 3 === 0 ? 2 : 1
                  return (
                    <div key={colIndex} className="flex items-center gap-3">
                      {Array.from({ length: wordCount }).map((_, wordIndex) => {
                        const widthIndex = (rowIndex * 11 + colIndex * 5 + wordIndex * 3) % widthClasses.length
                        return (
                          <div
                            key={wordIndex}
                            className={`h-[9px] rounded-full bg-[#F5F6F8] ${widthClasses[widthIndex]}`}
                          />
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
