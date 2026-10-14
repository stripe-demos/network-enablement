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

export type Step = { title: string; target: EntryTarget }

const STEPS = {
  enablement: { title: "Connect › Enablement", target: { kind: "href", href: "/dashboard/connect/enablement" } },
  joinNetwork: { title: "Join the network", target: { kind: "href", href: "/dashboard/connect/enablement?network-onboarding=welcome" } },
  findAccounts: { title: "Find accounts", target: { kind: "href", href: "/dashboard/connect/enablement?network-onboarding=find-accounts" } },
  networkList: { title: "Network list", target: { kind: "href", href: "/dashboard/network/all" } },
  createAccount: { title: "Account creation", target: { kind: "demo", demo: "account" } },
  singleConfig: { title: "Single config", target: { kind: "demo", demo: "singleConfig" } },
  invoice: { title: "Invoice", target: { kind: "demo", demo: "invoice" } },
  subscription: { title: "Subscription", target: { kind: "demo", demo: "subscription" } },
  sendMoney: { title: "Send money", target: { kind: "demo", demo: "send" } },
} satisfies Record<string, Step>

// Dashboard steps say whether the platform already has connected accounts, so
// the Network list shows the right state (see the Dashboard's networkInvites.js).
function withAccounts(steps: Step[], accounts: "none" | "existing"): Step[] {
  return steps.map((step) => {
    if (step.target.kind !== "href") return step
    const separator = step.target.href.includes("?") ? "&" : "?"
    return { ...step, target: { kind: "href", href: `${step.target.href}${separator}network-accounts=${accounts}` } }
  })
}

// A flow either has steps, or groups sub-flows (shown indented under it).
export type Flow = { title: string; steps: Step[]; comingSoon?: boolean; children?: Flow[] }

export type Journey = { title: string; flows: Flow[] }

export const JOURNEYS: Journey[] = [
  {
    title: "Platform journey",
    flows: [
      { title: "New platform", steps: withAccounts([STEPS.enablement, STEPS.joinNetwork, STEPS.findAccounts, STEPS.networkList], "none") },
      {
        title: "Existing platform",
        steps: [],
        children: [
          { title: "No accounts", steps: withAccounts([STEPS.networkList, STEPS.joinNetwork, STEPS.findAccounts], "none") },
          {
            title: "Has accounts",
            steps: withAccounts([STEPS.networkList, STEPS.joinNetwork, STEPS.findAccounts], "existing"),
            comingSoon: true,
          },
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
]
