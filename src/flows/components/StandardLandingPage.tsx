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
import { AuthorPill } from "@/components/landing/AuthorPill"
import { DEMO_HASH, JOURNEYS, type DemoKey } from "@/components/landing/entryPoints"
import { JourneyFlow } from "@/components/landing/JourneyFlow"

const SendMoneyCreationEditor = dynamic(
  () => import("@/components/creation-workspace/SendMoneyCreationEditor").then((mod) => ({ default: mod.SendMoneyCreationEditor })),
  { ssr: false },
)

const TYPE = {
  pageTitle: "doc-title text-[72px] font-[440] leading-[1.0] tracking-[-0.038em] text-[#142234]",
  sectionTitle: "doc-heading text-[#142234]",
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
        patternLabel="Network <> Connect enablement"
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
          <div className="flex flex-col items-start px-6 pt-[88px] pb-[56px] sm:px-[64px]">
            <h1 className={TYPE.pageTitle}>Network &lt;&gt; Connect enablement</h1>
            <div className="mt-6">
              <AuthorPill />
            </div>
            <p className="doc-lead mt-6 max-w-[680px] text-[20px] !font-[450] leading-[1.55] tracking-[-0.01em] !text-[#3F5064]">
              A shared prototype and user journeys for Connect enablement through Stripe Network, and for Network unified account creation flows.
            </p>
          </div>

          {JOURNEYS.map((journey) => (
            <section key={journey.title} className="flex flex-col items-start px-6 pb-[72px] sm:px-[64px]">
              <h2 className={TYPE.sectionTitle}>{journey.title}</h2>
              <div className="mt-8 w-full divide-y divide-[#E3E8EE] rounded-[14px] border border-[#E3E8EE] bg-white">
                {journey.flows.map((flow) => (
                  <JourneyFlow key={flow.title} flow={flow} onOpenDemo={openDemo} />
                ))}
              </div>
            </section>
          ))}

          <div className="flex-1" />
          <div className="border-t border-[#E6ECF1] bg-white" style={{ borderTopWidth: "0.5px" }}>
            <div className="flex flex-col items-start px-6 py-5 sm:px-[64px]">
              <div className="flex w-full flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-[600px]">
                  <h3 className="text-[18px] font-[500] leading-[1.3] tracking-[-0.01em] text-[#142234]">
                    Build on this prototype
                  </h3>
                  <p className="doc-body mt-2 text-[#5A6978]">
                    Branch off main for each idea and open a PR. The designs live in Figma.
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
                    href="https://github.com/stripe-demos/network-enablement"
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
              patternLabel="Network <> Connect enablement"
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
