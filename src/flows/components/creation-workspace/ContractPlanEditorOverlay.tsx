'use client'

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ProductFormOverlay } from "@/components/ProductFormOverlay"
import { CatalogObjectGlyph } from "@/components/product-catalog/iconography"
import { ChevronDownTiny } from "@/components/ProductCatalogIcons"
import { ConsoleChatPane, type ConsoleContextItem } from "./ConsoleChatPane"

type PlanRate = { id: number; name: string; meter: string; unitPrice: string; priceType: string }
type PlanRateCard = { id: number; name: string; rates: PlanRate[] }
type PlanCreditGrant = { id: number; name: string; amount: string; period: string }
type PlanSubscriptionFee = { id: number; name: string; amount: string; period: string }

type MockPlan = {
  name: string
  description: string
  currency: string
  rateCards: PlanRateCard[]
  creditGrants: PlanCreditGrant[]
  subscriptionFees: PlanSubscriptionFee[]
}

const MOCK_PLANS: Record<string, MockPlan> = {
  plan_1: {
    name: "Starter",
    description: "Basic plan for small teams",
    currency: "USD",
    rateCards: [
      {
        id: 1,
        name: "Platform",
        rates: [
          { id: 1, name: "API Calls", meter: "api_calls", unitPrice: "0.001", priceType: "Usage" },
        ],
      },
    ],
    creditGrants: [],
    subscriptionFees: [
      { id: 1, name: "Base Fee", amount: "49.00", period: "Monthly" },
    ],
  },
  plan_2: {
    name: "Growth",
    description: "For growing teams that need more capacity",
    currency: "USD",
    rateCards: [
      {
        id: 1,
        name: "AI Models",
        rates: [
          { id: 1, name: "GPT-4 Calls", meter: "gpt4_calls", unitPrice: "0.03", priceType: "Graduated" },
          { id: 2, name: "Claude Calls", meter: "claude_calls", unitPrice: "0.02", priceType: "Usage" },
        ],
      },
      {
        id: 2,
        name: "Storage",
        rates: [
          { id: 3, name: "File Storage", meter: "storage_gb", unitPrice: "0.10", priceType: "Usage" },
        ],
      },
    ],
    creditGrants: [
      { id: 1, name: "Monthly Credits", amount: "25.00", period: "Monthly" },
    ],
    subscriptionFees: [
      { id: 1, name: "Platform Fee", amount: "149.00", period: "Monthly" },
    ],
  },
  plan_3: {
    name: "Enterprise",
    description: "Full-featured plan with dedicated support",
    currency: "USD",
    rateCards: [
      {
        id: 1,
        name: "AI Models",
        rates: [
          { id: 1, name: "GPT-4 Calls", meter: "gpt4_calls", unitPrice: "0.005", priceType: "Graduated" },
          { id: 2, name: "Claude Calls", meter: "claude_calls", unitPrice: "0.004", priceType: "Graduated" },
          { id: 3, name: "Embeddings", meter: "embeddings", unitPrice: "0.0001", priceType: "Usage" },
        ],
      },
      {
        id: 2,
        name: "Infrastructure",
        rates: [
          { id: 4, name: "Compute Hours", meter: "compute_hrs", unitPrice: "0.50", priceType: "Usage" },
          { id: 5, name: "File Storage", meter: "storage_gb", unitPrice: "0.05", priceType: "Usage" },
        ],
      },
      {
        id: 3,
        name: "Support",
        rates: [
          { id: 6, name: "Support Tickets", meter: "support_tickets", unitPrice: "15.00", priceType: "Flat" },
        ],
      },
    ],
    creditGrants: [
      { id: 1, name: "Monthly Credits", amount: "100.00", period: "Monthly" },
      { id: 2, name: "Onboarding Credits", amount: "500.00", period: "One-time" },
    ],
    subscriptionFees: [
      { id: 1, name: "Platform Fee", amount: "499.00", period: "Monthly" },
      { id: 2, name: "Dedicated CSM", amount: "200.00", period: "Monthly" },
    ],
  },
  plan_4: {
    name: "AI Platform Pro",
    description: "Full AI model access with usage-based pricing",
    currency: "USD",
    rateCards: [
      {
        id: 1,
        name: "AI Model Usage",
        rates: [
          { id: 101, name: "GPT-4o", meter: "gpt4o_tokens", unitPrice: "0.005", priceType: "Usage" },
          { id: 102, name: "GPT-4o mini", meter: "gpt4o_mini_tokens", unitPrice: "0.0015", priceType: "Usage" },
          { id: 103, name: "GPT-4 Turbo", meter: "gpt4_turbo_tokens", unitPrice: "0.01", priceType: "Usage" },
          { id: 104, name: "GPT-4", meter: "gpt4_tokens", unitPrice: "0.03", priceType: "Usage" },
          { id: 105, name: "GPT-3.5 Turbo", meter: "gpt35_turbo_tokens", unitPrice: "0.001", priceType: "Usage" },
          { id: 106, name: "o1", meter: "o1_tokens", unitPrice: "0.015", priceType: "Usage" },
          { id: 107, name: "o1-mini", meter: "o1_mini_tokens", unitPrice: "0.003", priceType: "Usage" },
          { id: 108, name: "o1-pro", meter: "o1_pro_tokens", unitPrice: "0.06", priceType: "Usage" },
          { id: 109, name: "o3-mini", meter: "o3_mini_tokens", unitPrice: "0.004", priceType: "Usage" },
          { id: 110, name: "GPT-4.5 Preview", meter: "gpt45_tokens", unitPrice: "0.02", priceType: "Usage" },
          { id: 111, name: "Claude 4 Opus", meter: "claude4_opus_tokens", unitPrice: "0.015", priceType: "Usage" },
          { id: 112, name: "Claude 4 Sonnet", meter: "claude4_sonnet_tokens", unitPrice: "0.003", priceType: "Usage" },
          { id: 113, name: "Claude 3.5 Sonnet", meter: "claude35_sonnet_tokens", unitPrice: "0.003", priceType: "Usage" },
          { id: 114, name: "Claude 3.5 Haiku", meter: "claude35_haiku_tokens", unitPrice: "0.001", priceType: "Usage" },
          { id: 115, name: "Claude 3 Opus", meter: "claude3_opus_tokens", unitPrice: "0.015", priceType: "Usage" },
          { id: 116, name: "Claude 3 Sonnet", meter: "claude3_sonnet_tokens", unitPrice: "0.003", priceType: "Usage" },
          { id: 117, name: "Claude 3 Haiku", meter: "claude3_haiku_tokens", unitPrice: "0.00025", priceType: "Usage" },
          { id: 118, name: "Gemini 2.0 Flash", meter: "gemini2_flash_tokens", unitPrice: "0.001", priceType: "Usage" },
          { id: 119, name: "Gemini 2.0 Pro", meter: "gemini2_pro_tokens", unitPrice: "0.005", priceType: "Usage" },
          { id: 120, name: "Gemini 1.5 Pro", meter: "gemini15_pro_tokens", unitPrice: "0.004", priceType: "Usage" },
          { id: 121, name: "Gemini 1.5 Flash", meter: "gemini15_flash_tokens", unitPrice: "0.001", priceType: "Usage" },
          { id: 122, name: "Llama 3.3 70B", meter: "llama33_70b_tokens", unitPrice: "0.0009", priceType: "Usage" },
          { id: 123, name: "Llama 3.1 405B", meter: "llama31_405b_tokens", unitPrice: "0.003", priceType: "Usage" },
          { id: 124, name: "Llama 3.1 70B", meter: "llama31_70b_tokens", unitPrice: "0.0009", priceType: "Usage" },
          { id: 125, name: "Llama 3.1 8B", meter: "llama31_8b_tokens", unitPrice: "0.0002", priceType: "Usage" },
          { id: 126, name: "Mistral Large", meter: "mistral_large_tokens", unitPrice: "0.004", priceType: "Usage" },
          { id: 127, name: "Mistral Medium", meter: "mistral_medium_tokens", unitPrice: "0.003", priceType: "Usage" },
          { id: 128, name: "Mistral Small", meter: "mistral_small_tokens", unitPrice: "0.001", priceType: "Usage" },
          { id: 129, name: "Mixtral 8x22B", meter: "mixtral_8x22b_tokens", unitPrice: "0.001", priceType: "Usage" },
          { id: 130, name: "Codestral", meter: "codestral_tokens", unitPrice: "0.001", priceType: "Usage" },
          { id: 131, name: "Command R+", meter: "command_rplus_tokens", unitPrice: "0.003", priceType: "Usage" },
          { id: 132, name: "Command R", meter: "command_r_tokens", unitPrice: "0.0005", priceType: "Usage" },
          { id: 133, name: "Sonar Large", meter: "sonar_large_tokens", unitPrice: "0.005", priceType: "Usage" },
          { id: 134, name: "Sonar Small", meter: "sonar_small_tokens", unitPrice: "0.001", priceType: "Usage" },
          { id: 135, name: "Sonar Reasoning", meter: "sonar_reasoning_tokens", unitPrice: "0.005", priceType: "Usage" },
        ],
      },
    ],
    creditGrants: [
      { id: 1, name: "Monthly Fast Request Credits", amount: "500.00", period: "Monthly" },
    ],
    subscriptionFees: [
      { id: 1, name: "Platform License", amount: "20.00", period: "Monthly" },
    ],
  },
}

type ActiveNode =
  | { type: "plan" }
  | { type: "rateCard"; id: number }
  | { type: "rate"; id: number; rateCardId: number }
  | { type: "creditGrant"; id: number }
  | { type: "subscriptionFee"; id: number }

type ContractPlanEditorOverlayProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (branchName: string) => void
  planId: string
  planName: string
  contractName: string
  existingBranchName?: string
}

export function ContractPlanEditorOverlay({
  isOpen,
  onClose,
  onSave,
  planId,
  planName,
  contractName,
  existingBranchName,
}: ContractPlanEditorOverlayProps) {
  const plan = MOCK_PLANS[planId] || MOCK_PLANS.plan_2
  const defaultBranchName = existingBranchName || `${plan.name} — ${contractName}`
  const [branchName, setBranchName] = useState(defaultBranchName)
  const [activeNode, setActiveNode] = useState<ActiveNode>({ type: "plan" })
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(plan.rateCards.map((c) => [c.id, true]))
  )
  const [syncStatusOpen, setSyncStatusOpen] = useState(false)
  const [syncOthers, setSyncOthers] = useState(true)
  const [editedItems, setEditedItems] = useState<{ type: string; name: string; field: string; from: string; to: string }[]>(() => {
    if (existingBranchName && plan.rateCards[0]?.rates[0]) {
      return [{ type: "rate", name: plan.rateCards[0].rates[0].name, field: "Unit price", from: "$0.005", to: "$0.004" }]
    }
    return []
  })

  // Console integration state
  const [mode, setMode] = useState<"editor" | "console">("editor")
  const [consoleContextItems, setConsoleContextItems] = useState<ConsoleContextItem[]>([])

  const handleSparkleClick = useCallback((nodeType: string, nodeName: string, fieldName: string) => {
    setConsoleContextItems((prev) => {
      const exists = prev.some((i) => i.nodeName === nodeName && i.fieldName === fieldName)
      if (exists) return prev
      return [...prev, { nodeType, nodeName, fieldName }]
    })
    setMode("console")
  }, [])

  const isExistingBranch = Boolean(existingBranchName)

  const totalRates = plan.rateCards.reduce((sum, c) => sum + c.rates.length, 0)
  const totalComponents = totalRates + plan.rateCards.length + plan.creditGrants.length + plan.subscriptionFees.length

  const toggleCard = (id: number) =>
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }))

  const activeRate = activeNode.type === "rate"
    ? plan.rateCards.flatMap((c) => c.rates).find((r) => r.id === activeNode.id)
    : null
  const activeRateCard = activeNode.type === "rateCard"
    ? plan.rateCards.find((c) => c.id === activeNode.id)
    : null
  const activeCreditGrant = activeNode.type === "creditGrant"
    ? plan.creditGrants.find((g) => g.id === activeNode.id)
    : null
  const activeSubscriptionFee = activeNode.type === "subscriptionFee"
    ? plan.subscriptionFees.find((f) => f.id === activeNode.id)
    : null

  const handleSave = () => {
    onSave(branchName)
    onClose()
  }

  return (
    <ProductFormOverlay
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Edit pricing plan"
      header={
        /* Contract context breadcrumb */
        <div className="flex items-center gap-[6px] border-b border-[#E3E8EF] px-[20px] py-[8px]">
          <button
            type="button"
            className="text-[12px] font-[500] text-[#596171] transition-colors hover:text-[#1A2C44]"
            onClick={onClose}
          >
            {contractName || "Contract"}
          </button>
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none" className="shrink-0">
            <path d="M1 1L5 5L1 9" stroke="#9CA3B0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[12px] font-[600] text-[#1A2C44]">{branchName}</span>
        </div>
      }
    >
      {/* Grey background with the plan card inside */}
      <div className="flex h-full flex-col bg-[#F0F2F5] p-[16px]">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-[#D8DEE4] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          {/* Card header */}
          <div className="flex items-center justify-between border-b border-[#E3E8EF] px-[16px] py-[10px]">
            <div className="flex items-center gap-[10px]">
              <span className="text-[13px] font-[600] leading-[16px] text-[#1A2C44]">{branchName}</span>
              <span className="text-[11px] leading-[14px] text-[#596171]">
                <BranchIcon className="mr-[3px] inline-block align-[-1px]" />
                {isExistingBranch ? "branched from" : "branching from"} {planName}
              </span>
              {/* Sync status badge */}
              <div className="relative">
                <button
                  type="button"
                  className="flex h-[22px] items-center rounded-[4px] border border-[#D8DEE4] bg-white px-[8px] text-[11px] font-[500] text-[#353A44] transition-colors hover:border-[#B6C0CD]"
                  onClick={() => setSyncStatusOpen(!syncStatusOpen)}
                >
                  {editedItems.length === 0 ? "No changes" : `${editedItems.length} ${editedItems.length === 1 ? "change" : "changes"}`}
                </button>
                {syncStatusOpen && (
                  <SyncStatusPanel
                    plan={plan}
                    planName={planName}
                    editedItems={editedItems}
                    syncOthers={syncOthers}
                    onToggleSync={() => setSyncOthers(!syncOthers)}
                    totalComponents={totalComponents}
                  />
                )}
              </div>
            </div>
            <div className="flex items-center gap-[8px]">
              <button
                type="button"
                className="flex h-[26px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[8px] text-[12px] font-[600] text-[#273951] transition-colors hover:bg-[#F5F6F8]"
                onClick={onClose}
              >
                Discard
              </button>
              <button
                type="button"
                className="flex h-[26px] items-center whitespace-nowrap rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[8px] text-[12px] font-[600] text-white transition-colors hover:bg-[#4730E0]"
                onClick={handleSave}
              >
                Save branch
              </button>
            </div>
          </div>

          {/* Card body — left panel (editor OR console) + preview */}
          <div className="flex min-h-0 flex-1">
            {/* Left area: animated swap between editor and console */}
            <AnimatePresence mode="wait" initial={false}>
              {mode === "editor" ? (
                <motion.div
                  key="editor-panels"
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -30, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1.0] }}
                  className="flex shrink-0"
                  style={{ width: 640 }}
                >
                  {/* Sidebar */}
                  <aside className="hidden w-[240px] shrink-0 flex-col border-r border-[#ECF1F6] bg-white sm:flex">
                    <div className="min-h-0 flex-1 overflow-y-auto px-[8px] pt-[12px]">
                      <SidebarTree
                        plan={plan}
                        activeNode={activeNode}
                        expandedCards={expandedCards}
                        onSelectNode={setActiveNode}
                        onToggleCard={toggleCard}
                      />
                    </div>
                  </aside>

                  {/* Editor panel */}
                  <div className="w-[400px] shrink-0 overflow-y-auto border-r border-[#ECF1F6] bg-white">
                    <EditorPanel
                      plan={plan}
                      activeNode={activeNode}
                      activeRate={activeRate}
                      activeRateCard={activeRateCard}
                      activeCreditGrant={activeCreditGrant}
                      activeSubscriptionFee={activeSubscriptionFee}
                      branchName={branchName}
                      onBranchNameChange={setBranchName}
                      onSparkleClick={handleSparkleClick}
                      onFieldChange={(itemType, itemName, field, from, to) => {
                        setEditedItems((prev) => {
                          const existing = prev.findIndex((e) => e.name === itemName && e.field === field)
                          if (to === from) {
                            return existing >= 0 ? prev.filter((_, i) => i !== existing) : prev
                          }
                          if (existing >= 0) {
                            const updated = [...prev]
                            updated[existing] = { type: itemType, name: itemName, field, from, to }
                            return updated
                          }
                          return [...prev, { type: itemType, name: itemName, field, from, to }]
                        })
                      }}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="console-panel"
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -30, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1.0] }}
                  className="shrink-0 overflow-hidden"
                  style={{ width: 560 }}
                >
                  <ConsoleChatPane
                    onBack={() => setMode("editor")}
                    contextItems={consoleContextItems}
                    planContext={{
                      name: plan.name,
                      description: plan.description,
                      currency: plan.currency,
                      rateCards: plan.rateCards.map(rc => ({
                        id: rc.id,
                        name: rc.name,
                        rates: rc.rates.map(r => ({ id: r.id, name: r.name, meter: r.meter, unitPrice: r.unitPrice, priceType: r.priceType })),
                      })),
                      creditGrants: plan.creditGrants.map(cg => ({ id: cg.id, name: cg.name, amount: cg.amount, period: cg.period })),
                      subscriptionFees: plan.subscriptionFees.map(sf => ({ id: sf.id, name: sf.name, amount: sf.amount, period: sf.period })),
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Preview area — always visible */}
            <div className="relative flex flex-1 items-center justify-center overflow-y-auto bg-[#F8FAFB] p-[24px]">
              <div className="blur-[2px] pointer-events-none select-none">
                <PreviewPanel plan={plan} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProductFormOverlay>
  )
}

function BranchIcon({ className }: { className?: string }) {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className={className}>
      <path d="M4 2.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm0 7a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM10 2.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" stroke="#596171" strokeWidth="1" />
      <path d="M3 3.5v2a1.5 1.5 0 0 0 1.5 1.5H7A1.5 1.5 0 0 1 8.5 5.5v-2" stroke="#596171" strokeWidth="1" />
      <path d="M3 7.5v1" stroke="#596171" strokeWidth="1" />
    </svg>
  )
}


function SyncStatusPanel({
  planName,
  editedItems,
  syncOthers,
  onToggleSync,
  totalComponents,
}: {
  plan: MockPlan
  planName: string
  editedItems: { type: string; name: string; field: string; from: string; to: string }[]
  syncOthers: boolean
  onToggleSync: () => void
  totalComponents: number
}) {
  const unchangedCount = totalComponents - editedItems.length

  return (
    <div className="absolute left-0 top-full z-50 mt-[4px] w-[300px] rounded-[8px] border border-[#E3E8EF] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
      {/* Edited items */}
      {editedItems.length > 0 && (
        <div className="border-b border-[#ECF1F6] px-[12px] py-[10px]">
          <span className="text-[12px] font-[500] text-[#596171]">
            Your changes
          </span>
          <div className="mt-[6px] flex flex-col gap-[2px]">
            {editedItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-[4px] py-[3px]">
                <span className="text-[12px] font-[500] text-[#1A2C44]">{item.name}</span>
                <div className="flex items-center gap-[4px] text-[11px]">
                  <span className="text-[#9CA3B0] line-through">{item.from}</span>
                  <span className="text-[#1A2C44]">{item.to}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sync toggle */}
      <div className="px-[12px] py-[10px]">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-[1px]">
            <span className="text-[12px] font-[500] text-[#1A2C44]">
              Sync {unchangedCount} others
            </span>
            <span className="text-[11px] text-[#6C7688]">
              {syncOthers ? `Tracking changes from ${planName}` : `Independent from ${planName}`}
            </span>
          </div>
          <button
            type="button"
            className={`relative h-[18px] w-[34px] shrink-0 rounded-full border transition-colors ${
              syncOthers ? "border-[#533AFD] bg-[#675DFF]" : "border-[#D4DEE9] bg-[#ECF1F6]"
            }`}
            onClick={onToggleSync}
          >
            <span
              className={`absolute top-0 h-[16px] w-[16px] rounded-full bg-white border shadow-[0_1px_1px_rgba(33,37,44,0.16)] transition-all ${
                syncOthers ? "left-[16px] border-[#533AFD]" : "left-0 border-[#D4DEE9]"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  )
}

function SidebarTree({
  plan,
  activeNode,
  expandedCards,
  onSelectNode,
  onToggleCard,
}: {
  plan: MockPlan
  activeNode: ActiveNode
  expandedCards: Record<number, boolean>
  onSelectNode: (node: ActiveNode) => void
  onToggleCard: (id: number) => void
}) {
  const isActive = (node: ActiveNode) => {
    if (activeNode.type !== node.type) return false
    if (node.type === "plan") return true
    if ("id" in node && "id" in activeNode) return node.id === activeNode.id
    return false
  }

  const rowBase = "flex w-full items-center gap-[8px] rounded-[6px] px-[8px] py-[4px] text-left text-[12px] font-[400] leading-[16px] text-[#1A2C44]"
  const planRow = "flex w-full items-center gap-[8px] rounded-[6px] pl-[12px] pr-[8px] py-[4px] text-left text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#1A2C44]"

  const getRowClass = (node: ActiveNode, isPlanRow?: boolean) => {
    const base = isPlanRow ? planRow : rowBase
    return `${base} ${isActive(node) ? "bg-[#F7F5FD]" : "hover:bg-[#F4F7FA]"}`
  }

  return (
    <div className="flex flex-col gap-[2px]">
      {/* Plan root */}
      <button type="button" className={getRowClass({ type: "plan" }, true)} onClick={() => onSelectNode({ type: "plan" })}>
        <CatalogObjectGlyph kind="plan" size="sm" />
        <span className="truncate">{plan.name}</span>
      </button>

      {/* Rate cards */}
      {plan.rateCards.map((card) => (
        <div key={card.id}>
          <div className="flex items-center pl-[15px]">
            <button
              type="button"
              className="flex h-[16px] w-[12px] shrink-0 items-center justify-center"
              onClick={() => onToggleCard(card.id)}
            >
              <ChevronDownTiny className={`transition-transform text-[#3C4F69] ${expandedCards[card.id] ? "" : "-rotate-90"}`} />
            </button>
            <button
              type="button"
              className={getRowClass({ type: "rateCard", id: card.id })}
              onClick={() => onSelectNode({ type: "rateCard", id: card.id })}
            >
              <CatalogObjectGlyph kind="rateCard" size="sm" />
              <span className="truncate">{card.name}</span>
            </button>
          </div>
          {expandedCards[card.id] && (
            <div className="flex flex-col gap-[2px]">
              {card.rates.map((rate) => (
                <button
                  key={rate.id}
                  type="button"
                  className={`pl-[37px] ${getRowClass({ type: "rate", id: rate.id, rateCardId: card.id })}`}
                  onClick={() => onSelectNode({ type: "rate", id: rate.id, rateCardId: card.id })}
                >
                  <CatalogObjectGlyph kind="rate" size="sm" />
                  <span className="truncate">{rate.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Credit grants */}
      {plan.creditGrants.length > 0 && (
        <div className="flex flex-col gap-[2px] pl-[15px]">
          {plan.creditGrants.map((grant) => (
            <button
              key={grant.id}
              type="button"
              className={getRowClass({ type: "creditGrant", id: grant.id })}
              onClick={() => onSelectNode({ type: "creditGrant", id: grant.id })}
            >
              <CatalogObjectGlyph kind="creditGrant" size="sm" />
              <span className="truncate">{grant.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Subscription fees */}
      {plan.subscriptionFees.length > 0 && (
        <div className="flex flex-col gap-[2px] pl-[15px]">
          {plan.subscriptionFees.map((fee) => (
            <button
              key={fee.id}
              type="button"
              className={getRowClass({ type: "subscriptionFee", id: fee.id })}
              onClick={() => onSelectNode({ type: "subscriptionFee", id: fee.id })}
            >
              <CatalogObjectGlyph kind="subscriptionFee" size="sm" />
              <span className="truncate">{fee.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SparkleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="group flex h-[16px] w-[16px] items-center justify-center rounded-[4px] transition-colors hover:bg-[#F0EEFF]"
      onClick={onClick}
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-[#9CA3B0] transition-colors group-hover:text-[#675DFF]">
        <path d="M8 1.5L9.1 5.9L13.5 7L9.1 8.1L8 12.5L6.9 8.1L2.5 7L6.9 5.9L8 1.5Z" fill="currentColor" />
        <path d="M12.5 11L13 12.5L14.5 13L13 13.5L12.5 15L12 13.5L10.5 13L12 12.5L12.5 11Z" fill="currentColor" opacity="0.6" />
      </svg>
    </button>
  )
}

function EditorPanel({
  plan,
  activeNode,
  activeRate,
  activeRateCard,
  activeCreditGrant,
  activeSubscriptionFee,
  branchName,
  onBranchNameChange,
  onSparkleClick,
  onFieldChange,
}: {
  plan: MockPlan
  activeNode: ActiveNode
  activeRate: PlanRate | null | undefined
  activeRateCard: PlanRateCard | null | undefined
  activeCreditGrant: PlanCreditGrant | null | undefined
  activeSubscriptionFee: PlanSubscriptionFee | null | undefined
  branchName: string
  onBranchNameChange: (name: string) => void
  onSparkleClick: (nodeType: string, nodeName: string, fieldName: string) => void
  onFieldChange: (itemType: string, itemName: string, field: string, originalValue: string, newValue: string) => void
}) {
  const labelClass = "text-[11px] font-[600] uppercase tracking-[0.5px] text-[#596171]"
  const inputClass = "h-[30px] w-full rounded-[6px] border border-[#D8DEE4] bg-white px-3 text-[12px] font-[500] text-[#353A44] outline-none focus:border-[#675DFF] focus:shadow-[0_0_0_1.5px_rgba(103,93,255,0.15)] transition-all"

  if (activeNode.type === "plan") {
    return (
      <div className="p-[20px]">
        <p className="mb-[16px] text-[13px] font-[600] text-[#1A2C44]">Plan details</p>
        <div className="flex flex-col gap-[12px]">
          <div className="flex flex-col gap-[4px]">
            <div className="flex items-center gap-[6px]">
              <label className={labelClass}>Name</label>
              <SparkleButton onClick={() => onSparkleClick("plan", plan.name, "Name")} />
            </div>
            <input
              className={inputClass}
              value={branchName}
              onChange={(e) => {
                onBranchNameChange(e.target.value)
                onFieldChange("plan", plan.name, "Name", plan.name, e.target.value)
              }}
            />
          </div>
          <div className="flex flex-col gap-[4px]">
            <div className="flex items-center gap-[6px]">
              <label className={labelClass}>Description</label>
              <SparkleButton onClick={() => onSparkleClick("plan", plan.name, "Description")} />
            </div>
            <textarea
              className="h-[60px] w-full resize-none rounded-[6px] border border-[#D8DEE4] bg-white px-3 py-2 text-[12px] font-[500] text-[#353A44] outline-none focus:border-[#675DFF] focus:shadow-[0_0_0_1.5px_rgba(103,93,255,0.15)] transition-all"
              defaultValue={plan.description}
              onBlur={(e) => {
                if (e.target.value !== plan.description) {
                  onFieldChange("plan", plan.name, "Description", plan.description, e.target.value)
                }
              }}
            />
          </div>
          <div className="flex flex-col gap-[4px]">
            <label className={labelClass}>Currency</label>
            <input className={inputClass} defaultValue={plan.currency} />
          </div>
        </div>
      </div>
    )
  }

  if (activeNode.type === "rateCard" && activeRateCard) {
    return (
      <div className="p-[20px]">
        <p className="mb-[16px] text-[13px] font-[600] text-[#1A2C44]">Rate card</p>
        <div className="flex flex-col gap-[12px]">
          <div className="flex flex-col gap-[4px]">
            <div className="flex items-center gap-[6px]">
              <label className={labelClass}>Name</label>
              <SparkleButton onClick={() => onSparkleClick("rateCard", activeRateCard.name, "Name")} />
            </div>
            <input
              className={inputClass}
              defaultValue={activeRateCard.name}
              onBlur={(e) => {
                if (e.target.value !== activeRateCard.name) {
                  onFieldChange("rateCard", activeRateCard.name, "Name", activeRateCard.name, e.target.value)
                }
              }}
            />
          </div>
          <div className="flex flex-col gap-[4px]">
            <label className={labelClass}>Billing period</label>
            <input className={inputClass} defaultValue="Monthly" />
          </div>
          <div className="rounded-[8px] border border-[#ECF1F6] bg-[#FAFBFC] p-[12px]">
            <p className="text-[11px] font-[500] text-[#596171]">{activeRateCard.rates.length} rate{activeRateCard.rates.length !== 1 ? "s" : ""} in this card</p>
          </div>
        </div>
      </div>
    )
  }

  if (activeNode.type === "rate" && activeRate) {
    return (
      <div className="p-[20px]">
        <p className="mb-[16px] text-[13px] font-[600] text-[#1A2C44]">Rate</p>
        <div className="flex flex-col gap-[12px]">
          <div className="flex flex-col gap-[4px]">
            <div className="flex items-center gap-[6px]">
              <label className={labelClass}>Name</label>
              <SparkleButton onClick={() => onSparkleClick("rate", activeRate.name, "Name")} />
            </div>
            <TrackedInput
              defaultValue={activeRate.name}
              labelClass={labelClass}
              inputClass={inputClass}
              onCommit={(val) => onFieldChange("rate", activeRate.name, "Name", activeRate.name, val)}
              key={`${activeRate.id}_name`}
            />
          </div>
          <TrackedInput
            label="Meter"
            defaultValue={activeRate.meter}
            labelClass={labelClass}
            inputClass={inputClass}
            onCommit={(val) => onFieldChange("rate", activeRate.name, "Meter", activeRate.meter, val)}
            key={`${activeRate.id}_meter`}
          />
          <TrackedInput
            label="Price type"
            defaultValue={activeRate.priceType}
            labelClass={labelClass}
            inputClass={inputClass}
            onCommit={(val) => onFieldChange("rate", activeRate.name, "Price type", activeRate.priceType, val)}
            key={`${activeRate.id}_priceType`}
          />
          <div className="flex flex-col gap-[4px]">
            <div className="flex items-center gap-[6px]">
              <label className={labelClass}>Unit price</label>
              <SparkleButton onClick={() => onSparkleClick("rate", activeRate.name, "Unit price")} />
            </div>
            <div className="flex items-center gap-[8px]">
              <span className="text-[12px] text-[#596171]">$</span>
              <TrackedInput
                defaultValue={activeRate.unitPrice}
                labelClass={labelClass}
                inputClass={inputClass}
                onCommit={(val) => onFieldChange("rate", activeRate.name, "Unit price", `$${activeRate.unitPrice}`, `$${val}`)}
                key={`${activeRate.id}_unitPrice`}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (activeNode.type === "creditGrant" && activeCreditGrant) {
    return (
      <div className="p-[20px]">
        <p className="mb-[16px] text-[13px] font-[600] text-[#1A2C44]">Credit grant</p>
        <div className="flex flex-col gap-[12px]">
          <div className="flex flex-col gap-[4px]">
            <div className="flex items-center gap-[6px]">
              <label className={labelClass}>Name</label>
              <SparkleButton onClick={() => onSparkleClick("creditGrant", activeCreditGrant.name, "Name")} />
            </div>
            <TrackedInput
              defaultValue={activeCreditGrant.name}
              labelClass={labelClass}
              inputClass={inputClass}
              onCommit={(val) => onFieldChange("creditGrant", activeCreditGrant.name, "Name", activeCreditGrant.name, val)}
              key={`cg_${activeCreditGrant.id}_name`}
            />
          </div>
          <div className="flex flex-col gap-[4px]">
            <div className="flex items-center gap-[6px]">
              <label className={labelClass}>Amount</label>
              <SparkleButton onClick={() => onSparkleClick("creditGrant", activeCreditGrant.name, "Amount")} />
            </div>
            <div className="flex items-center gap-[8px]">
              <span className="text-[12px] text-[#596171]">$</span>
              <TrackedInput
                defaultValue={activeCreditGrant.amount}
                labelClass={labelClass}
                inputClass={inputClass}
                onCommit={(val) => onFieldChange("creditGrant", activeCreditGrant.name, "Amount", `$${activeCreditGrant.amount}`, `$${val}`)}
                key={`cg_${activeCreditGrant.id}_amount`}
              />
            </div>
          </div>
          <TrackedInput
            label="Period"
            defaultValue={activeCreditGrant.period}
            labelClass={labelClass}
            inputClass={inputClass}
            onCommit={(val) => onFieldChange("creditGrant", activeCreditGrant.name, "Period", activeCreditGrant.period, val)}
            key={`cg_${activeCreditGrant.id}_period`}
          />
        </div>
      </div>
    )
  }

  if (activeNode.type === "subscriptionFee" && activeSubscriptionFee) {
    return (
      <div className="p-[20px]">
        <p className="mb-[16px] text-[13px] font-[600] text-[#1A2C44]">Subscription fee</p>
        <div className="flex flex-col gap-[12px]">
          <div className="flex flex-col gap-[4px]">
            <div className="flex items-center gap-[6px]">
              <label className={labelClass}>Name</label>
              <SparkleButton onClick={() => onSparkleClick("subscriptionFee", activeSubscriptionFee.name, "Name")} />
            </div>
            <TrackedInput
              defaultValue={activeSubscriptionFee.name}
              labelClass={labelClass}
              inputClass={inputClass}
              onCommit={(val) => onFieldChange("subscriptionFee", activeSubscriptionFee.name, "Name", activeSubscriptionFee.name, val)}
              key={`sf_${activeSubscriptionFee.id}_name`}
            />
          </div>
          <div className="flex flex-col gap-[4px]">
            <div className="flex items-center gap-[6px]">
              <label className={labelClass}>Amount</label>
              <SparkleButton onClick={() => onSparkleClick("subscriptionFee", activeSubscriptionFee.name, "Amount")} />
            </div>
            <div className="flex items-center gap-[8px]">
              <span className="text-[12px] text-[#596171]">$</span>
              <TrackedInput
                defaultValue={activeSubscriptionFee.amount}
                labelClass={labelClass}
                inputClass={inputClass}
                onCommit={(val) => onFieldChange("subscriptionFee", activeSubscriptionFee.name, "Amount", `$${activeSubscriptionFee.amount}`, `$${val}`)}
                key={`sf_${activeSubscriptionFee.id}_amount`}
              />
            </div>
          </div>
          <TrackedInput
            label="Period"
            defaultValue={activeSubscriptionFee.period}
            labelClass={labelClass}
            inputClass={inputClass}
            onCommit={(val) => onFieldChange("subscriptionFee", activeSubscriptionFee.name, "Period", activeSubscriptionFee.period, val)}
            key={`sf_${activeSubscriptionFee.id}_period`}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full items-center justify-center p-[20px]">
      <p className="text-[12px] text-[#9CA3B0]">Select an item from the sidebar</p>
    </div>
  )
}

function PreviewPanel({ plan }: { plan: MockPlan }) {
  const totalMonthly = plan.subscriptionFees.reduce((sum, f) => sum + parseFloat(f.amount), 0)

  return (
    <div className="w-full max-w-[380px] rounded-[12px] border border-[#D4DEE9] bg-white overflow-clip">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#ECF1F6] bg-white px-[20px] py-[16px]">
        <p className="text-[15px] font-[600] text-[#1A2C44]">{plan.name}</p>
        <p className="mt-[2px] text-[12px] text-[#596171]">{plan.description}</p>
      </div>

      {/* Rate cards */}
      <div className="px-[20px] py-[14px]">
        <p className="text-[10px] font-[600] uppercase tracking-[0.5px] text-[#9CA3B0]">Rate cards</p>
        <div className="mt-[8px] flex flex-col gap-[8px]">
          {plan.rateCards.map((card) => (
            <div key={card.id} className="rounded-[8px] border border-[#ECF1F6] bg-[#FAFBFC] px-[12px] py-[10px]">
              <p className="text-[12px] font-[600] text-[#1A2C44]">{card.name}</p>
              <div className="mt-[6px] flex flex-col gap-[3px]">
                {card.rates.map((rate) => (
                  <div key={rate.id} className="flex items-center justify-between">
                    <span className="text-[11px] text-[#596171]">{rate.name}</span>
                    <span className="text-[11px] font-[500] tabular-nums text-[#1A2C44]">${rate.unitPrice}/{rate.meter.split("_").pop()}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Credits */}
      {plan.creditGrants.length > 0 && (
        <div className="border-t border-[#ECF1F6] px-[20px] py-[14px]">
          <p className="text-[10px] font-[600] uppercase tracking-[0.5px] text-[#9CA3B0]">Credits</p>
          <div className="mt-[6px] flex flex-col gap-[3px]">
            {plan.creditGrants.map((grant) => (
              <div key={grant.id} className="flex items-center justify-between">
                <span className="text-[11px] text-[#596171]">{grant.name}</span>
                <span className="text-[11px] font-[500] tabular-nums text-[#1A2C44]">${grant.amount} / {grant.period.toLowerCase()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fees */}
      {plan.subscriptionFees.length > 0 && (
        <div className="border-t border-[#ECF1F6] px-[20px] py-[14px]">
          <p className="text-[10px] font-[600] uppercase tracking-[0.5px] text-[#9CA3B0]">Subscription fees</p>
          <div className="mt-[6px] flex flex-col gap-[3px]">
            {plan.subscriptionFees.map((fee) => (
              <div key={fee.id} className="flex items-center justify-between">
                <span className="text-[11px] text-[#596171]">{fee.name}</span>
                <span className="text-[11px] font-[500] tabular-nums text-[#1A2C44]">${fee.amount} / {fee.period.toLowerCase()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total */}
      <div className="border-t border-[#D4DEE9] bg-[#F8FAFB] px-[20px] py-[12px]">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-[500] text-[#596171]">Monthly base</span>
          <span className="text-[14px] font-[600] tabular-nums text-[#1A2C44]">${totalMonthly.toFixed(2)}</span>
        </div>
        <p className="mt-[2px] text-[10px] text-[#9CA3B0]">+ usage-based charges</p>
      </div>
    </div>
  )
}

function TrackedInput({
  label,
  defaultValue,
  labelClass,
  inputClass,
  onCommit,
}: {
  label?: string
  defaultValue: string
  labelClass: string
  inputClass: string
  onCommit: (value: string) => void
}) {
  const [value, setValue] = useState(defaultValue)

  return (
    <div className={label ? "flex flex-col gap-[4px]" : "w-full"}>
      {label && <label className={labelClass}>{label}</label>}
      <input
        className={inputClass}
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          onCommit(e.target.value)
        }}
      />
    </div>
  )
}
