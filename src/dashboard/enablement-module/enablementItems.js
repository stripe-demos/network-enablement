// The Enablement module's items, grouped by product. Every placement
// (embedded, floatie, contextual nudge) renders from this list; which ones are
// on is set in the prototype panel (prototype/enablementPrototypeControls.js).
//   before / highlight / after — the embedded row's sentence
//   shortLabel — the floatie's row label (280px wide)
//   nudge — { paths, text, action } for the contextual nudge on those routes
// Billing is placeholder content: its rows are disabled.
import { isNetworkOnboardingComplete, useNetworkOnboarding } from '../pages/network/networkInvites'
import { openNetworkOnboarding } from '../pages/network/openNetworkOnboarding'

export const ENABLEMENT_PRODUCTS = [
  {
    id: 'connect',
    title: 'Connect',
    items: [
      {
        id: 'network',
        onOpen: () => openNetworkOnboarding(),
        before: 'Onboard faster with accounts already on the ',
        highlight: 'Stripe network',
        after: '',
        shortLabel: 'Onboard with the Stripe network',
        nudge: { paths: ['/network'], text: '12 of your accounts are already on the Stripe network. Onboard them faster.', action: 'Get started' },
      },
      {
        id: 'capital',
        to: '/connect/capital',
        before: 'Add capabilities like ',
        highlight: 'Capital and Treasury',
        after: ' to your connected accounts',
        shortLabel: 'Add Capital and Treasury',
        nudge: { paths: ['/balances'], text: 'Offer Capital and Treasury to your connected accounts.', action: 'Learn more' },
      },
      {
        id: 'pricing',
        to: '/connect/pricing',
        before: 'Set ',
        highlight: 'what connected accounts pay',
        after: ' with the platform pricing tool',
        shortLabel: 'Set what accounts pay',
        nudge: { paths: ['/transactions'], text: 'Set what connected accounts pay with the platform pricing tool.', action: 'Set up pricing' },
      },
      {
        id: 'apps',
        to: '/apps',
        before: 'Supercharge your platform with ',
        highlight: 'prebuilt skills and agents',
        after: ' from Platform Apps',
        shortLabel: 'Add skills and agents',
        nudge: { paths: ['/apps'], text: 'Supercharge your platform with prebuilt skills and agents.', action: 'Browse apps' },
      },
    ],
  },
  {
    id: 'billing',
    title: 'Billing',
    items: [
      { id: 'invoice-reminders', disabled: true, shortLabel: 'Automate invoice reminders' },
      { id: 'customer-portal', disabled: true, shortLabel: 'Add a customer portal' },
      { id: 'smart-retries', disabled: true, shortLabel: 'Recover failed payments' },
    ],
  },
]

export const CONNECT_ITEMS = ENABLEMENT_PRODUCTS[0].items
export const ALL_ITEMS = ENABLEMENT_PRODUCTS.flatMap(product => product.items)

/** { [itemId]: true } for finished items. Only the network row tracks progress. */
export function useEnablementDone() {
  return { network: isNetworkOnboardingComplete(useNetworkOnboarding()) }
}
