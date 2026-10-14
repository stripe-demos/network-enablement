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

export type Journey = { title: string; flows: { title: string; steps: Step[] }[] }

export const JOURNEYS: Journey[] = [
  {
    title: "Platform journey",
    flows: [
      { title: "New platform", steps: [STEPS.enablement, STEPS.joinNetwork, STEPS.findAccounts, STEPS.networkList] },
      { title: "Existing platform", steps: [STEPS.networkList, STEPS.joinNetwork, STEPS.findAccounts] },
    ],
  },
  {
    title: "Connected account journey",
    flows: [
      { title: "New connected account", steps: [STEPS.createAccount, STEPS.invoice, STEPS.sendMoney] },
      { title: "Existing connected account", steps: [STEPS.networkList, STEPS.singleConfig, STEPS.subscription] },
    ],
  },
]
