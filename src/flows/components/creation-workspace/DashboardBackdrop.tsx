'use client'

import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { DemoContextBar } from "@/components/creation-workspace/DemoContextBar"

// A full-viewport greyscale wireframe of a Stripe dashboard list page, rendered behind
// the Simple-pattern example modals so the modal reads as opening inside a real product
// surface. Deliberately abstract — no icons, no colour, just wireframe bars — so the
// modal stays the focus. The only real text is the page title, which is contextual to
// the object being created (Products / Coupons / Customers / …). A slim dark context bar
// pins to the top for wayfinding back to the docs. Purely decorative: the modal's own
// dim (z-40) sits above the dashboard and owns click-to-close.

type FlowContext = { title: string; columns: number; navActive: number }

// Map each Simple example flow to the list page it would launch from.
const FLOW_CONTEXT: Record<string, FlowContext> = {
  "account-configurations": { title: "Network", columns: 4, navActive: 3 },
  products: { title: "Products", columns: 4, navActive: 4 },
  coupons: { title: "Coupons", columns: 4, navActive: 4 },
  customers: { title: "Customers", columns: 4, navActive: 3 },
  "api-access-policy": { title: "API requests", columns: 4, navActive: 2 },
  "create-api-key": { title: "API keys", columns: 4, navActive: 2 },
  "buy-button": { title: "Payment links", columns: 4, navActive: 4 },
  invoices: { title: "Invoices", columns: 4, navActive: 4 },
  subscriptions: { title: "Subscriptions", columns: 4, navActive: 4 },
  payouts: { title: "Payouts", columns: 4, navActive: 4 },
}
const DEFAULT_CONTEXT: FlowContext = { title: "Overview", columns: 4, navActive: 0 }

// Widths for the main-nav wireframe rows (px). One is highlighted per flow.
const NAV_ROW_WIDTHS = [46, 68, 92, 78, 104]
const GROUP_A = [64, 88, 72]
const GROUP_B = [58, 80, 66]

const ROW_WIDTHS = [
  "w-[30%]", "w-[38%]", "w-[46%]", "w-[52%]", "w-[60%]", "w-[68%]", "w-[74%]",
]

export function DashboardBackdrop({
  flow,
  exampleLabel,
  onBack,
  patternLabel = "Simple pattern",
  showContextBar = true,
  headerAction,
}: {
  flow: string
  exampleLabel: string
  onBack: () => void
  // Which pattern's docs the context bar points back to (defaults to Simple, the
  // original caller). The Related objects page reuses this backdrop and overrides it.
  patternLabel?: string
  /** Hide when the caller already owns the demo wayfinding bar. */
  showContextBar?: boolean
  /** Real list-page action that replaces the wireframe create button. */
  headerAction?: ReactNode
}) {
  const ctx = FLOW_CONTEXT[flow] ?? DEFAULT_CONTEXT

  return (
    <>
      {/* Context bar — floating pill, bottom-left, for wayfinding back to the docs. */}
      {showContextBar ? <DemoContextBar patternLabel={patternLabel} exampleLabel={exampleLabel} onBack={onBack} placement="bottom-left" /> : null}

      {/* Wireframe dashboard — fills the viewport behind the modal + dim. */}
      <div
        className="fixed inset-0 z-30 flex bg-white"
        aria-hidden={headerAction ? undefined : true}
      >
        <div className="pointer-events-none flex h-full w-full select-none">
          {/* ── Left sidebar (pure wireframe) ──────────────────────── */}
          <aside
            className="flex h-full w-[240px] shrink-0 flex-col gap-[4px] border-r border-[#E0E8EF] bg-white px-[12px] py-[14px]"
            style={{ borderRightWidth: "0.5px" }}
          >
            {/* Account switcher */}
            <div className="mb-[10px] flex items-center gap-[8px] rounded-[8px] px-[8px] py-[6px]">
              <div className="h-[26px] w-[26px] shrink-0 rounded-[7px] bg-[#E4E9EF]" />
              <div className="flex-1 space-y-[5px]">
                <div className="h-[7px] w-[84px] rounded-full bg-[#DDE3EA]" />
                <div className="h-[6px] w-[56px] rounded-full bg-[#EAEEF3]" />
              </div>
              <div className="h-[8px] w-[8px] shrink-0 rounded-full bg-[#DDE3EA]" />
            </div>

            {/* Primary nav */}
            {NAV_ROW_WIDTHS.map((w, i) => (
              <NavBar key={i} width={w} active={i === ctx.navActive} />
            ))}

            <GroupGap />
            {GROUP_A.map((w, i) => <NavBar key={`a${i}`} width={w} />)}

            <GroupGap />
            {GROUP_B.map((w, i) => <NavBar key={`b${i}`} width={w} />)}
          </aside>

          {/* ── Main column ──────────────────────────────────────── */}
          <div className="flex h-full min-w-0 flex-1 flex-col">
            {/* Top bar (search skeleton + control dots) */}
            <div className="flex h-[56px] shrink-0 items-center justify-between border-b border-[#E0E8EF] px-[24px]" style={{ borderBottomWidth: "0.5px" }}>
              <div className="flex h-[32px] w-[340px] max-w-[42vw] items-center gap-[8px] rounded-[8px] border border-[#E7ECF1] bg-[#FAFBFC] px-[12px]">
                <div className="h-[10px] w-[10px] rounded-full bg-[#E1E7EE]" />
                <div className="h-[8px] w-[120px] rounded-full bg-[#EAEEF3]" />
              </div>
              <div className="flex items-center gap-[12px]">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-[16px] w-[16px] rounded-full bg-[#EAEEF3]" />
                ))}
                <div className="h-[28px] w-[28px] rounded-full bg-[#E4E9EF]" />
              </div>
            </div>

            {/* List page */}
            <div className="min-h-0 flex-1 overflow-hidden px-[40px] pt-[28px]">
              {/* Header: contextual title + wireframe create button */}
              <div className="flex items-center justify-between">
                <p className="text-[28px] font-bold tracking-[-0.56px] text-[#0D111A]">
                  {ctx.title}
                </p>
                {headerAction ? (
                  <div className="pointer-events-auto">{headerAction}</div>
                ) : (
                  <div className="h-[34px] w-[132px] rounded-[8px] bg-[#EAEEF3]" />
                )}
              </div>

              {/* Toolbar tabs */}
              <div className="mt-[16px] flex flex-wrap gap-[20px] border-b border-[#EBEEF1] pb-[16px]">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-[11px] w-[80px] rounded-full bg-[#F1F4F7]" />
                ))}
              </div>

              {/* Filters */}
              <div className="mt-[16px] flex flex-wrap gap-[16px]">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="min-w-[180px] flex-1 rounded-[6px] border border-[#E4E9EF] bg-white px-[16px] py-[12px]">
                    <div className="h-[10px] w-full rounded-full bg-[#F1F4F7]" />
                  </div>
                ))}
              </div>

              {/* Table */}
              <div className="mt-[24px] border-b border-[#EBEEF1]">
                {/* Column headers (wireframe bars) */}
                <div
                  className="grid h-[40px] items-center gap-[32px] border-b border-[#EBEEF1]"
                  style={{ gridTemplateColumns: `repeat(${ctx.columns}, 1fr)` }}
                >
                  {Array.from({ length: ctx.columns }).map((_, i) => (
                    <div key={i} className="h-[9px] w-[64px] rounded-full bg-[#E7ECF1]" />
                  ))}
                </div>

                {/* Rows */}
                <div className="divide-y divide-[#EBEEF1]">
                  {Array.from({ length: 26 }).map((_, rowIndex) => (
                    <div
                      key={rowIndex}
                      className="grid h-[40px] items-center gap-[32px]"
                      style={{ gridTemplateColumns: `repeat(${ctx.columns}, 1fr)` }}
                    >
                      {Array.from({ length: ctx.columns }).map((_, colIndex) => {
                        const w = ROW_WIDTHS[(rowIndex * 7 + colIndex * 3) % ROW_WIDTHS.length]
                        return (
                          <div key={colIndex} className={`h-[9px] rounded-full bg-[#F1F4F7] ${w}`} />
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// A full-viewport greyscale wireframe of the "Create invoice" flow, rendered behind the
// Related-objects Product modal so it reads as adding a product WHILE building an invoice
// (the point of the pattern) rather than creating one from the Products list. Same abstract
// style as DashboardBackdrop; the modal's own dim darkens it. The only real text is the page
// title. Purely decorative.
export function InvoiceFlowBackdrop({
  exampleLabel,
  onBack,
  patternLabel = "Related objects pattern",
}: {
  exampleLabel: string
  onBack: () => void
  patternLabel?: string
}) {
  return (
    <>
      <DemoContextBar patternLabel={patternLabel} exampleLabel={exampleLabel} onBack={onBack} placement="bottom-left" />

      <motion.div
        className="fixed inset-0 z-30 flex flex-col bg-white"
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Top bar — contextual title + Discard / Create actions (wireframe). */}
        <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-[#E0E8EF] px-[40px]" style={{ borderBottomWidth: "0.5px" }}>
          <p className="text-[18px] font-semibold tracking-[-0.01em] text-[#0D111A]">Create invoice</p>
          <div className="flex items-center gap-[10px]">
            <div className="h-[32px] w-[76px] rounded-[8px] border border-[#E2E8EF] bg-white" />
            <div className="h-[32px] w-[108px] rounded-[8px] bg-[#EAEEF3]" />
          </div>
        </div>

        {/* Body — form column + preview canvas. */}
        <div className="pointer-events-none flex min-h-0 flex-1 select-none">
          <div className="w-[440px] max-w-[40%] shrink-0 border-r border-[#E0E8EF] px-[40px] py-[34px]" style={{ borderRightWidth: "0.5px" }}>
            <div className="space-y-[22px]">
              {[64, 52, 40, 72].map((w, i) => (
                <div key={i}>
                  <div className="mb-[8px] h-[8px] rounded-full bg-[#DDE3EA]" style={{ width: w }} />
                  <div className="h-[36px] w-full rounded-[8px] border border-[#E4E9EF] bg-[#FAFBFC]" />
                </div>
              ))}
              {/* Payment-method chips */}
              <div>
                <div className="mb-[10px] h-[8px] w-[70px] rounded-full bg-[#DDE3EA]" />
                <div className="flex gap-[8px]">
                  {[56, 56, 44, 74].map((w, i) => (
                    <div key={i} className="h-[26px] rounded-full border border-[#E4E9EF] bg-white" style={{ width: w }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-center bg-[#FBFCFD] p-[40px]">
            <div className="flex aspect-[4/3] w-[68%] max-w-[720px] flex-col items-center justify-center gap-[10px] rounded-[12px] border border-dashed border-[#E2E8F0] bg-white">
              <div className="h-[10px] w-[80px] rounded-full bg-[#E7ECF1]" />
              <div className="h-[8px] w-[120px] rounded-full bg-[#F1F4F7]" />
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}

function NavBar({ width, active = false }: { width: number; active?: boolean }) {
  return (
    <div className={`flex h-[28px] items-center rounded-[6px] px-[10px] ${active ? "bg-[#EEF1F5]" : ""}`}>
      <div className={`h-[8px] rounded-full ${active ? "bg-[#C6CFDA]" : "bg-[#E1E7EE]"}`} style={{ width }} />
    </div>
  )
}

function GroupGap() {
  return (
    <div className="mb-[2px] mt-[18px] px-[10px]">
      <div className="h-[6px] w-[40px] rounded-full bg-[#EDF1F5]" />
    </div>
  )
}
