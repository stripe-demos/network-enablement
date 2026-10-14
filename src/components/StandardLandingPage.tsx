"use client"

import { useEffect, useState, type ReactNode } from "react"
import dynamic from "next/dynamic"

import { AccountConfigurationDemo } from "@/components/AccountConfigurationDemo"
import { CreateCustomerModal } from "@/components/creation-workspace/CreateCustomerModal"
import { DashboardBackdrop } from "@/components/creation-workspace/DashboardBackdrop"
import { InvoiceCreationEditor } from "@/components/creation-workspace/InvoiceCreationEditor"
import { InputFillProvider } from "@/components/creation-workspace/inputFill"
import { LayoutSplitProvider } from "@/components/creation-workspace/layoutSplit"
import { NavStyleProvider } from "@/components/creation-workspace/navStyle"
import { ProductFormStyleProvider } from "@/components/creation-workspace/productFormStyle"
import { SegmentedStyleProvider } from "@/components/creation-workspace/segmentedStyle"
import { SubscriptionCreationEditor } from "@/components/creation-workspace/SubscriptionCreationEditor"

const SendMoneyCreationEditor = dynamic(
  () => import("@/components/creation-workspace/SendMoneyCreationEditor").then((mod) => ({ default: mod.SendMoneyCreationEditor })),
  { ssr: false },
)

const TYPE = {
  pageTitle: "doc-title text-[72px] font-[440] leading-[1.0] tracking-[-0.038em] text-[#142234]",
}

const COMPONENT_COLORS: Record<string, string> = {
  "Title and actions": "#2E7CF6",
  Form: "#533AFD",
  Preview: "#039C7D",
}

const STANDARD_BLOCKS = ["Title and actions", "Form", "Preview"] as const

type DemoKey = "invoice" | "subscription" | "account" | "singleConfig" | "send"

const DEMO_HASH: Record<DemoKey, string> = {
  invoice: "invoice",
  subscription: "subscription",
  account: "account-creation",
  singleConfig: "single-config",
  send: "send-money",
}

function demoFromHash(hash: string): DemoKey | null {
  const slug = hash.replace(/^#/, "")
  const match = (Object.keys(DEMO_HASH) as DemoKey[]).find((key) => DEMO_HASH[key] === slug)
  return match ?? null
}

function demoFromHistoryState(state: unknown): DemoKey | null {
  if (!state || typeof state !== "object" || !("demo" in state)) return null
  const demo = (state as { demo?: unknown }).demo
  return demo === "invoice" || demo === "subscription" || demo === "account" || demo === "singleConfig" || demo === "send"
    ? demo
    : null
}

function FieldWire({
  labelWidth = 48,
  valueWidth = "full",
  tall = false,
}: {
  labelWidth?: number
  valueWidth?: "full" | "short"
  tall?: boolean
}) {
  const colored = true
  const label = colored ? "bg-[#533AFD]" : "bg-[#C1CCD7]"
  const valueCls = colored
    ? "bg-white border border-[#533AFD]"
    : "bg-white border border-[#D8E1EA]"
  return (
    <div>
      <div className={`mb-2 h-[5px] rounded-full ${label}`} style={{ width: labelWidth }} />
      <div className={`rounded-[4px] ${valueCls} ${tall ? "h-[52px]" : "h-[24px]"} ${valueWidth === "short" ? "w-3/4" : "w-full"}`} />
    </div>
  )
}

function PreviewCard() {
  const bar = "bg-[#039C7D]"
  return (
    <div className="w-[460px] max-w-[86%] overflow-hidden rounded-[12px] border border-[#D8E1EA] bg-white shadow-sm">
      <div className="px-[18px] py-[16px]">
        <div className={`h-[8px] w-40 rounded-full ${bar}`} />
        <div className={`mt-[8px] h-[6px] w-24 rounded-full opacity-50 ${bar}`} />
      </div>
      <div className="border-t border-[#ECF1F6] px-[18px] py-[14px]">
        <div className="space-y-[8px]">
          {[80, 104, 92, 120, 72].map((width, index) => (
            <div key={index} className="flex items-center justify-between rounded-[6px] border border-[#ECF1F6] bg-[#FAFBFC] px-[14px] py-[11px]">
              <div className={`h-[6px] rounded-full opacity-60 ${bar}`} style={{ width }} />
              <div className={`h-[6px] shrink-0 rounded-full ${bar}`} style={{ width: 44 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Canvas({ children }: { children: ReactNode }) {
  const bar = "bg-[#039C7D]"
  return (
    <div className="flex flex-1 flex-col rounded-[10px] bg-[#EBF8F5]">
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className={`h-[5px] w-14 rounded-full ${bar}`} />
      </div>
      <div className="flex flex-1 items-center justify-center">{children}</div>
    </div>
  )
}

function WireHeader({ title }: { title: string }) {
  return (
    <div aria-label={title} className="flex items-center justify-between rounded-[10px] bg-[#EEF7FF] px-5 py-3.5">
      <span className="h-[8px] w-28 rounded-full bg-[#2E7CF6]" />
      <div className="flex gap-2">
        <span aria-label="Discard" className="h-6 w-10 rounded bg-[#2E7CF6]" />
        <span aria-label="Save" className="h-6 w-10 rounded bg-[#2E7CF6]" />
      </div>
    </div>
  )
}

function InvoiceFormWire() {
  const label = "bg-[#533AFD]"
  const valueCls = "bg-white border border-[#533AFD]"
  return (
    <div className="w-[220px] rounded-[10px] bg-[#F4F4FE] p-5">
      <div className="space-y-5">
        <FieldWire labelWidth={46} />
        <FieldWire labelWidth={42} />
        <div className="relative">
          <div className={`mb-2 h-[5px] w-8 rounded-full ${label}`} />
          <div aria-label="Items" className={`flex h-[24px] items-center justify-between rounded-[4px] px-2 ${valueCls}`}>
            <span className="h-[5px] w-14 rounded-full bg-[#C3CAF7]" />
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" className="shrink-0">
              <path d="M2.5 4L5 6.5L7.5 4" stroke="#8E97C9" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <FieldWire labelWidth={40} />
      </div>
    </div>
  )
}

function InvoiceEditorSurface() {
  return (
    <div className="flex h-full flex-col gap-[10px] overflow-hidden">
      <WireHeader title="Create invoice" />
      <div className="flex min-h-0 flex-1 gap-[10px]">
        <InvoiceFormWire />
        <Canvas>
          <PreviewCard />
        </Canvas>
      </div>
    </div>
  )
}

function WireframeChrome({ children }: { children: ReactNode }) {
  return (
    <div className="example-ui flex h-full w-full flex-col overflow-hidden rounded-[20px] border border-[#E8ECF1] bg-white shadow-[0_12px_48px_-16px_rgba(0,0,0,0.07),0_2px_6px_-2px_rgba(0,0,0,0.03)]">
      <div className="flex h-[30px] shrink-0 items-center border-b border-[#F4F7FA] bg-[#FBFCFD] px-3.5">
        <div className="flex items-center gap-[5px]">
          <span className="h-[7px] w-[7px] rounded-full bg-[#C1CCD7]" />
          <span className="h-[7px] w-[7px] rounded-full bg-[#C1CCD7]" />
          <span className="h-[7px] w-[7px] rounded-full bg-[#C1CCD7]" />
        </div>
      </div>
      <div className="flex-1 overflow-visible bg-white p-[8px]">{children}</div>
    </div>
  )
}

function ExampleChip({
  label,
  onClick,
  disabled = false,
  tooltip,
}: {
  label: string
  href?: string
  onClick?: () => void
  disabled?: boolean
  tooltip?: string
}) {
  const className = `relative z-10 inline-flex items-center rounded-full border px-[16px] pt-[7px] pb-[8px] text-[15px] font-[500] leading-[16px] transition-colors ${
    disabled
      ? "cursor-not-allowed border-[#E4EAEF] bg-[#F7F9FB] text-[#9AA8B5]"
      : "cursor-pointer border-[#D5DEE7] bg-white text-[#3F5064] hover:border-[#C1CCD7] hover:bg-[#F6F8FA] hover:text-[#142234]"
  }`

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        disabled={disabled}
        className={className}
        onClick={() => {
          if (disabled) return
          onClick?.()
        }}
      >
        {label}
      </button>
      {tooltip ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-[6px] bg-[#142234] px-[8px] py-[5px] text-[12px] font-[500] leading-[16px] text-white opacity-0 shadow-[0_4px_12px_rgba(20,34,52,0.18)] transition-opacity group-hover:opacity-100"
        >
          {tooltip}
        </span>
      ) : null}
    </span>
  )
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="block shrink-0 overflow-visible">
      <path d="M6.7 0.85C6.7 0.380558 6.31944 0 5.85 0C5.38056 0 5 0.380558 5 0.85V5H0.85C0.380558 5 0 5.38056 0 5.85C0 6.31944 0.380558 6.7 0.85 6.7H5V10.85C5 11.3194 5.38056 11.7 5.85 11.7C6.31944 11.7 6.7 11.3194 6.7 10.85V6.7H10.85C11.3194 6.7 11.7 6.31944 11.7 5.85C11.7 5.38056 11.3194 5 10.85 5H6.7V0.85Z" fill="currentColor" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M14.8238 0C14.689 0 14.5552 0.0231783 14.4282 0.068522L0.730534 4.96056C0.29244 5.11702 0 5.53199 0 5.99719C0 6.47099 0.303182 6.89163 0.752669 7.04146L6.90707 9.09293L8.95854 15.2473C9.10837 15.6968 9.52901 16 10.0028 16C10.468 16 10.883 15.7076 11.0394 15.2695L15.9315 1.57177C15.9768 1.44481 16 1.311 16 1.17618C16 0.526594 15.4734 0 14.8238 0ZM13 2L2.32423 5.98417L7.29743 7.64191L13 2ZM8.35809 8.70257L10.0158 13.6758L14 3L8.35809 8.70257Z" fill="currentColor" />
    </svg>
  )
}

function CreateListButton({
  label,
  onClick,
  icon = "add",
}: {
  label: string
  onClick: () => void
  icon?: "add" | "send"
}) {
  return (
    <button
      type="button"
      className="flex h-[32px] items-center gap-[6px] rounded-[7px] border border-[#D4DEE9] bg-white px-[12px] text-[13px] font-[600] text-[#1A2C44] shadow-[0_1px_2px_rgba(20,34,52,0.06)] hover:bg-[#F5F6F8]"
      onClick={onClick}
    >
      {icon === "send" ? <SendIcon /> : <PlusIcon />}
      {label}
    </button>
  )
}

function ListPageDemo({
  flow,
  exampleLabel,
  ctaLabel,
  ctaIcon,
  onExit,
  children,
}: {
  flow: string
  exampleLabel: string
  ctaLabel: string
  ctaIcon?: "add" | "send"
  onExit: () => void
  children: (props: { isOpen: boolean; onClose: () => void }) => ReactNode
}) {
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  return (
    <>
      <DashboardBackdrop
        flow={flow}
        exampleLabel={exampleLabel}
        patternLabel="Creation flows"
        onBack={() => {
          if (isEditorOpen) {
            setIsEditorOpen(false)
            return
          }
          onExit()
        }}
        headerAction={<CreateListButton label={ctaLabel} icon={ctaIcon} onClick={() => setIsEditorOpen(true)} />}
      />
      {children({ isOpen: isEditorOpen, onClose: () => setIsEditorOpen(false) })}
    </>
  )
}

function FlowProviders({ children }: { children: ReactNode }) {
  return (
    <InputFillProvider initial={false}>
      <SegmentedStyleProvider initial="segmented">
        <ProductFormStyleProvider initial="current" ignorePersisted>
          <LayoutSplitProvider initial="fixed" ignorePersisted>
            {children}
          </LayoutSplitProvider>
        </ProductFormStyleProvider>
      </SegmentedStyleProvider>
    </InputFillProvider>
  )
}

function StandardDocs() {
  const [activeDemo, setActiveDemo] = useState<DemoKey | null>(null)

  useEffect(() => {
    const applyFromLocation = (state?: unknown) => {
      setActiveDemo(demoFromHistoryState(state) ?? demoFromHash(window.location.hash))
    }

    applyFromLocation(window.history.state)

    const onPopState = (event: PopStateEvent) => applyFromLocation(event.state)
    const onHashChange = () => applyFromLocation()
    window.addEventListener("popstate", onPopState)
    window.addEventListener("hashchange", onHashChange)
    return () => {
      window.removeEventListener("popstate", onPopState)
      window.removeEventListener("hashchange", onHashChange)
    }
  }, [])

  const openDemo = (key: DemoKey) => {
    setActiveDemo(key)
    const url = `#${DEMO_HASH[key]}`
    const x = window.scrollX
    const y = window.scrollY
    try {
      window.history.pushState({ demo: key }, "", url)
    } catch {
      window.location.hash = DEMO_HASH[key]
    }
    window.scrollTo(x, y)
  }

  const goToPreviousPage = () => {
    setActiveDemo(null)
    const cleanUrl = `${window.location.pathname}${window.location.search}`
    if (demoFromHistoryState(window.history.state) || window.location.hash) {
      window.history.replaceState(null, "", cleanUrl)
    }
  }

  return (
    <>
      <div className="docs-root relative min-h-[100vh] bg-white">
        <div
          className="mx-[52px] flex min-h-[100vh] flex-col border-x border-[#E0E8EF] lg:mx-[64px]"
          style={{ borderLeftWidth: "0.5px", borderRightWidth: "0.5px" }}
        >
          <div className="flex flex-col items-start px-6 pt-[88px] pb-[64px] sm:px-[64px]">
            <h1 className={TYPE.pageTitle}>Creation flows</h1>
            <p className="doc-lead mt-6 max-w-[640px] text-[20px] !font-[450] leading-[1.55] tracking-[-0.01em] !text-[#3F5064]">
              Object creation flows in the new Network world.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <ExampleChip label="Account creation" href={`#${DEMO_HASH.account}`} onClick={() => openDemo("account")} />
              <ExampleChip label="Single config" href={`#${DEMO_HASH.singleConfig}`} onClick={() => openDemo("singleConfig")} />
              <ExampleChip label="Invoice" href={`#${DEMO_HASH.invoice}`} onClick={() => openDemo("invoice")} />
              <ExampleChip label="Subscription" href={`#${DEMO_HASH.subscription}`} onClick={() => openDemo("subscription")} />
              <ExampleChip label="Send money" href={`#${DEMO_HASH.send}`} onClick={() => openDemo("send")} />
            </div>
          </div>

          <div className="flex flex-col items-start px-6 pb-[72px] sm:px-[64px]">
            <div className="w-full" style={{ height: "56vh", minHeight: 400, maxHeight: 660 }}>
              <WireframeChrome>
                <InvoiceEditorSurface />
              </WireframeChrome>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {STANDARD_BLOCKS.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-[7px] rounded-full border border-[#D5DEE7] bg-white px-2.5 py-1 text-[13px] font-[400] text-[#142234]"
                >
                  <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ backgroundColor: COMPONENT_COLORS[name] }} />
                  {name}
                </span>
              ))}
            </div>
          </div>

          <div className="flex-1" />
          <div className="border-t border-[#E6ECF1] bg-white" style={{ borderTopWidth: "0.5px" }}>
            <div className="flex flex-col items-start px-6 py-5 sm:px-[64px]">
              <div className="flex w-full flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-[600px]">
                  <h3 className="text-[18px] font-[500] leading-[1.3] tracking-[-0.01em] text-[#142234]">
                    Build your own standard pattern
                  </h3>
                  <p className="doc-body mt-2 text-[#5A6978]">
                    Use the starter repo to build your own prototype or access the patterns in Figma.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href="https://www.figma.com/design/3XGkIVxRCeYmEINCiPJOXo/Checkout-Editor-Prototype?node-id=271-1256"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-full border border-[#D5DEE7] bg-white px-[16px] pt-[7px] pb-[8px] text-[15px] font-[500] leading-[16px] text-[#3F5064] transition-colors hover:border-[#C1CCD7] hover:bg-[#F6F8FA] hover:text-[#142234]"
                  >
                    Figma
                  </a>
                  <a
                    href="https://github.com/stripe-demos/pattern-starter"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-full border border-[#D5DEE7] bg-white px-[16px] pt-[7px] pb-[8px] text-[15px] font-[500] leading-[16px] text-[#3F5064] transition-colors hover:border-[#C1CCD7] hover:bg-[#F6F8FA] hover:text-[#142234]"
                  >
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeDemo === "invoice" ? (
          <div key="invoice-demo" className="example-ui fixed inset-0 z-[80] bg-white">
            <ListPageDemo flow="invoices" exampleLabel="Invoice" ctaLabel="Create invoice" onExit={goToPreviousPage}>
              {({ isOpen, onClose }) => (
                <FlowProviders>
                  <InvoiceCreationEditor isOpen={isOpen} onClose={onClose} />
                </FlowProviders>
              )}
            </ListPageDemo>
          </div>
        ) : null}

        {activeDemo === "subscription" ? (
          <div key="subscription-demo" className="example-ui fixed inset-0 z-[80] bg-white">
            <ListPageDemo flow="subscriptions" exampleLabel="Subscription" ctaLabel="Create subscription" onExit={goToPreviousPage}>
              {({ isOpen, onClose }) => (
                <FlowProviders>
                  <NavStyleProvider initial="sidebar" ignorePersisted>
                    <SubscriptionCreationEditor isOpen={isOpen} onClose={onClose} />
                  </NavStyleProvider>
                </FlowProviders>
              )}
            </ListPageDemo>
          </div>
        ) : null}

        {activeDemo === "account" ? (
          <div key="account-demo" className="example-ui fixed inset-0 z-[80] overflow-auto bg-white">
            <AccountConfigurationDemo
              patternLabel="Creation flows"
              exampleLabel="Account creation"
              onExit={goToPreviousPage}
            />
          </div>
        ) : null}

        {activeDemo === "singleConfig" ? (
          <div key="single-config-demo" className="example-ui fixed inset-0 z-[80] bg-white">
            <ListPageDemo flow="account-configurations" exampleLabel="Single config" ctaLabel="Add customer" onExit={goToPreviousPage}>
              {({ isOpen, onClose }) => (
                <FlowProviders>
                  <CreateCustomerModal isOpen={isOpen} onClose={onClose} />
                </FlowProviders>
              )}
            </ListPageDemo>
          </div>
        ) : null}

        {activeDemo === "send" ? (
          <div key="send-demo" className="example-ui fixed inset-0 z-[80] bg-white">
            <ListPageDemo flow="payouts" exampleLabel="Send money" ctaLabel="Send money" ctaIcon="send" onExit={goToPreviousPage}>
              {({ isOpen, onClose }) => (
                <FlowProviders>
                  <SendMoneyCreationEditor isOpen={isOpen} onClose={onClose} />
                </FlowProviders>
              )}
            </ListPageDemo>
          </div>
        ) : null}
    </>
  )
}

export function StandardLandingPage() {
  return <StandardDocs />
}
