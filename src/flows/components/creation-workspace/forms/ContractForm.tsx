'use client'

import { useState, useRef, useEffect } from "react"
import { EntityDropdown } from "./EntityDropdown"
import { EXISTING_CUSTOMERS } from "./shared/mockEntities"
import { getFormTokens } from "./shared/formTokens"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"

const MOCK_PRICING_PLANS = [
  { id: "plan_1", name: "Starter", detail: "1 rate card · Monthly" },
  { id: "plan_2", name: "Growth", detail: "2 rate cards · Monthly" },
  { id: "plan_3", name: "Enterprise", detail: "3 rate cards · Monthly" },
  { id: "plan_4", name: "AI Platform Pro", detail: "35 rates · Monthly" },
]

type ContractFormProps = {
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
  errorFields?: Set<string>
  onAddObject?: (kind: string) => void
}

export function ContractForm({ data, onChange, errorFields, onAddObject }: ContractFormProps) {
  const { productFormStyle } = useProductFormStyle()
  const isRefresh = productFormStyle === "refresh"
  const tokens = getFormTokens(productFormStyle)
  const set = (key: string, value: string) => onChange({ [key]: value })
  const ic = (field: string) => errorFields?.has(field) ? tokens.errorInputClass : tokens.inputClass

  const syncEnabled = data.syncWithParent !== "false"

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[4px]">
        <label className={tokens.labelClass}>Contract name</label>
        <input
          className={ic("name")}
          placeholder="e.g. Acme Corp — Enterprise"
          value={data.name ?? ""}
          onChange={(e) => set("name", e.target.value)}
        />
      </div>

      <EntityDropdown
        label="Customer"
        placeholder="Find or add a customer..."
        searchPlaceholder="Search customers..."
        items={EXISTING_CUSTOMERS}
        selectedId={data.customerId ?? ""}
        selectedLabel={data.customerName}
        onSelect={(id) => {
          const customer = EXISTING_CUSTOMERS.find((c) => c.id === id)
          onChange({ customerId: id, customerName: customer?.name ?? "" })
        }}
        addNewLabel="Add new customer"
        onAddNew={() => {
          onAddObject?.("customer")
          onChange({ customerId: "_new", customerName: "New customer" })
        }}
        onEdit={() => onAddObject?.("customer")}
        hasError={errorFields?.has("customerId")}
        errorMessage="Select a customer"
      />

      <PlanSelector
        selectedId={data.planBranchSaved === "true" ? `branch_${data.parentPlanId}` : (data.parentPlanId ?? "")}
        selectedLabel={data.planBranchSaved === "true" ? data.planBranchName : data.parentPlanName}
        onSelect={(id, name) => {
          if (id.startsWith("branch_")) {
            onAddObject?.("editPlan")
          } else {
            onChange({ parentPlanId: id, parentPlanName: name, planBranchSaved: "", planBranchName: "" })
          }
        }}
        hasError={errorFields?.has("parentPlanId")}
        branchName={data.planBranchSaved === "true" ? data.planBranchName : undefined}
        branchParentId={data.planBranchSaved === "true" ? data.parentPlanId : undefined}
        onEditPlan={data.parentPlanId ? () => onAddObject?.("editPlan") : undefined}
      />

      <div className="flex gap-[8px]">
        <div className="flex flex-1 flex-col gap-[4px]">
          <label className={tokens.labelClass}>Start date</label>
          <input
            type="date"
            className={tokens.inputClass}
            value={data.startDate ?? ""}
            onChange={(e) => set("startDate", e.target.value)}
          />
        </div>
        <div className="flex flex-1 flex-col gap-[4px]">
          <label className={tokens.labelClass}>End date</label>
          <input
            type="date"
            className={tokens.inputClass}
            value={data.endDate ?? ""}
            onChange={(e) => set("endDate", e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-[8px] border border-[#E0E4EA] bg-[#FAFBFC] p-[12px]">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-[2px]">
            <span className="text-[12px] font-[400] text-[#1A2C44]">Sync with parent plan</span>
            <span className={`text-[11px] leading-[14px] ${isRefresh ? "text-[#526378]" : "text-[#596171]"}`}>
              {syncEnabled
                ? "Inherits changes from the parent plan"
                : "Fully independent — parent changes won't apply"}
            </span>
          </div>
          <button
            type="button"
            className={`relative h-[18px] w-[34px] shrink-0 rounded-full border transition-colors ${
              syncEnabled ? "border-[#533AFD] bg-[#675DFF]" : `${isRefresh ? "border-[#C1CCD7]" : "border-[#D4DEE9]"} ${isRefresh ? "bg-[#EAF0F6]" : "bg-[#ECF1F6]"}`
            }`}
            onClick={() => onChange({ syncWithParent: syncEnabled ? "false" : "true" })}
          >
            <span
              className={`absolute top-0 h-[16px] w-[16px] rounded-full bg-white border shadow-[0_1px_1px_rgba(33,37,44,0.16)] transition-all ${
                syncEnabled ? "left-[16px] border-[#533AFD]" : `left-0 ${isRefresh ? "border-[#C1CCD7]" : "border-[#D4DEE9]"}`
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  )
}

function PlanSelector({ selectedId, selectedLabel, onSelect, hasError, branchName, branchParentId, onEditPlan }: {
  selectedId: string
  selectedLabel?: string
  onSelect: (id: string, name: string) => void
  hasError?: boolean
  branchName?: string
  branchParentId?: string
  onEditPlan?: () => void
}) {
  const { productFormStyle } = useProductFormStyle()
  const isRefresh = productFormStyle === "refresh"
  const tokens = getFormTokens(productFormStyle)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [isOpen])

  const selected = MOCK_PRICING_PLANS.find((p) => p.id === selectedId)
  const isBranchSelected = selectedId.startsWith("branch_")
  const displayName = selectedLabel || selected?.name

  return (
    <div className="flex flex-col gap-[4px]">
      <div className="flex items-center gap-[6px]">
        <label className={tokens.labelClass}>Pricing plan</label>
        {onEditPlan && (
          <>
            <span className="text-[10px] text-[#B6C0CD]">·</span>
            <button
              type="button"
              className="text-[11px] font-[500] text-[#675DFF] transition-colors hover:text-[#4730E0]"
              onClick={onEditPlan}
            >
              Edit
            </button>
          </>
        )}
      </div>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          className={`flex ${isRefresh ? "h-[32px] px-[10px]" : "h-[30px] px-3"} w-full items-center justify-between rounded-[6px] border text-[12px] font-[500] leading-[16px] tracking-[-0.024px] transition-all ${
            hasError
              ? `border-[#DF1B41] bg-[#FFF5F5] ${isRefresh ? "text-[#142234]" : "text-[#353A44]"}`
              : displayName
                ? `${isRefresh ? "border-[#D5DEE7]" : "border-[#D8DEE4]"} bg-white ${isRefresh ? "text-[#142234]" : "text-[#353A44]"} ${isRefresh ? "hover:border-[#C1CCD7]" : "hover:border-[#B6C0CD]"}`
                : `${isRefresh ? "border-[#D5DEE7]" : "border-[#D8DEE4]"} bg-white ${isRefresh ? "text-[#68778B]" : "text-[#6C7688]"} ${isRefresh ? "hover:border-[#C1CCD7]" : "hover:border-[#B6C0CD]"}`
          }`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="truncate">{displayName || "Select a pricing plan..."}</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="#6C7688" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {isOpen && (
          <div className={`absolute left-0 top-[34px] z-50 w-full rounded-[8px] border ${isRefresh ? "border-[#EAF0F6]" : "border-[#D8DEE4]"} bg-white py-[4px] shadow-[0_4px_12px_rgba(0,0,0,0.08)]`}>
            {MOCK_PRICING_PLANS.map((plan) => (
              <div key={plan.id}>
                <button
                  type="button"
                  className={`flex w-full flex-col gap-[1px] px-[10px] py-[8px] text-left transition-colors ${isRefresh ? "hover:bg-[#F6F9FC]" : "hover:bg-[#F5F6F8]"} ${
                    plan.id === selectedId ? "bg-[#F0EEFF]" : ""
                  }`}
                  onClick={() => {
                    onSelect(plan.id, plan.name)
                    setIsOpen(false)
                  }}
                >
                  <span className="text-[12px] font-[500] text-[#1A2C44]">{plan.name}</span>
                  <span className={`text-[11px] ${isRefresh ? "text-[#526378]" : "text-[#596171]"}`}>{plan.detail}</span>
                </button>
                {branchName && branchParentId === plan.id && (
                  <button
                    type="button"
                    className={`flex w-full items-center gap-[6px] py-[7px] pl-[22px] pr-[10px] text-left transition-colors ${isRefresh ? "hover:bg-[#F6F9FC]" : "hover:bg-[#F5F6F8]"} ${
                      isBranchSelected ? "bg-[#F0EEFF]" : ""
                    }`}
                    onClick={() => {
                      onSelect(`branch_${plan.id}`, branchName)
                      setIsOpen(false)
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="shrink-0">
                      <path d="M4 2.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm0 7a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM10 2.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" stroke="#675DFF" strokeWidth="1" />
                      <path d="M3 3.5v2a1.5 1.5 0 0 0 1.5 1.5H7A1.5 1.5 0 0 1 8.5 5.5v-2" stroke="#675DFF" strokeWidth="1" />
                      <path d="M3 7.5v1" stroke="#675DFF" strokeWidth="1" />
                    </svg>
                    <span className="truncate text-[12px] font-[500] text-[#675DFF]">{branchName}</span>
                  </button>
                )}
              </div>
            ))}
            {MOCK_PRICING_PLANS.length === 0 && (
              <div className={`px-[10px] py-[8px] text-[12px] ${isRefresh ? "text-[#526378]" : "text-[#596171]"}`}>No pricing plans yet</div>
            )}
          </div>
        )}
      </div>
      {hasError && (
        <span className="text-[11px] text-[#DF1B41]">Select a pricing plan</span>
      )}
    </div>
  )
}
