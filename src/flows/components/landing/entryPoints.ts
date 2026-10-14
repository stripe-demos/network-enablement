// The journeys on the Network enablement landing page. Each flow is a row of
// steps; each step opens a Dashboard page or a creation flow.

export type DemoKey = "invoice" | "subscription" | "account" | "singleConfig" | "send"

export const DEMO_HASH: Record<DemoKey, string> = {
  invoice: "invoice",
  subscription: "subscription",
  account: "account-creation",
  singleConfig: "single-config",
  send: "send-money",
}

export type EntryTarget = { kind: "href"; href: string } | { kind: "demo"; demo: DemoKey }

// A step without a target is a placeholder for a flow that isn't built yet.
export type Step = { title: string; target?: EntryTarget }

const STEPS = {
  enablement: { title: "Go-live checklist", target: { kind: "href", href: "/dashboard/connect/enablement" } },
  joinNetwork: { title: "Join the network", target: { kind: "href", href: "/dashboard/connect/enablement?network-onboarding=welcome" } },
  findAccounts: { title: "Find accounts", target: { kind: "href", href: "/dashboard/connect/enablement?network-onboarding=find-accounts" } },
  networkList: { title: "Network list", target: { kind: "href", href: "/dashboard/network/all" } },
  createAccount: { title: "Create account", target: { kind: "demo", demo: "account" } },
  singleConfig: { title: "Add configuration", target: { kind: "demo", demo: "singleConfig" } },
  invoice: { title: "Invoice", target: { kind: "demo", demo: "invoice" } },
  subscription: { title: "Subscription", target: { kind: "demo", demo: "subscription" } },
  sendMoney: { title: "Send money", target: { kind: "demo", demo: "send" } },
} satisfies Record<string, Step>

const placeholders = (...titles: string[]): Step[] => titles.map((title) => ({ title }))

// Dashboard steps say whether the platform already has connected accounts, so
// the Network list shows the right state (see the Dashboard's networkInvites.js).
function withAccounts(steps: Step[], accounts: "none" | "existing"): Step[] {
  return steps.map((step) => {
    if (step.target?.kind !== "href") return step
    const separator = step.target.href.includes("?") ? "&" : "?"
    return { ...step, target: { kind: "href", href: `${step.target.href}${separator}network-accounts=${accounts}` } }
  })
}

// A flow either has steps, or groups sub-flows (shown indented under it).
/** Where a flow's Open flow link goes: its first step, with the Dashboard demo reset. */
export function openFlowTarget(flow: { steps: Step[] }): EntryTarget | undefined {
  const target = flow.steps[0]?.target
  if (target?.kind !== "href") return target
  const separator = target.href.includes("?") ? "&" : "?"
  return { kind: "href", href: `${target.href}${separator}prototype-reset=1` }
}

export type Flow = { title: string; steps: Step[]; comingSoon?: boolean; children?: Flow[] }

export type Journey = { title: string; flows: Flow[] }

export const JOURNEYS: Journey[] = [
  {
    title: "Platform journey",
    flows: [
      { title: "New platform", steps: withAccounts([STEPS.enablement, STEPS.joinNetwork, STEPS.findAccounts, STEPS.networkList], "none") },
      { title: "Existing platform: no accounts", steps: withAccounts([STEPS.networkList, STEPS.joinNetwork, STEPS.findAccounts], "none") },
      {
        title: "Existing platform: has accounts",
        steps: withAccounts([STEPS.networkList, STEPS.joinNetwork, STEPS.findAccounts], "existing"),
        comingSoon: true,
        children: [
          { title: "Treasury", steps: placeholders("Add Treasury", "Choose accounts", "Open financial accounts", "Move funds"), comingSoon: true },
          { title: "Send money", steps: placeholders("Choose recipient", "Payout method", "Payout details", "Review"), comingSoon: true },
          { title: "Contextual flow", steps: placeholders("Step 1", "Step 2", "Step 3"), comingSoon: true },
        ],
      },
    ],
  },
  {
    title: "Connected account journey",
    flows: [
      { title: "New connected account", steps: [STEPS.createAccount, STEPS.invoice, STEPS.sendMoney], comingSoon: true },
      {
        title: "Existing connected account",
        steps: [...withAccounts([STEPS.networkList], "existing"), STEPS.singleConfig, STEPS.subscription],
        comingSoon: true,
      },
    ],
  },
  {
    title: "Direct journey",
    flows: [
      { title: "New business", steps: placeholders("Step 1", "Step 2", "Step 3"), comingSoon: true },
      { title: "Existing business", steps: placeholders("Step 1", "Step 2", "Step 3"), comingSoon: true },
    ],
  },
]
