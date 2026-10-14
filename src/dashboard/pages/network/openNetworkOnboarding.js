// Opens the Stripe network onboarding dialog from anywhere in the Dashboard.
// NetworkOnboardingHost (mounted once in DashboardLayout) listens for this event
// and owns the only dialog instance.
export const OPEN_NETWORK_ONBOARDING_EVENT = 'dashboard:open-network-onboarding'

/** initialStep: 'welcome' | 'opt-in' | 'find-accounts' (optional). */
export function openNetworkOnboarding({ initialStep } = {}) {
  window.dispatchEvent(new CustomEvent(OPEN_NETWORK_ONBOARDING_EVENT, { detail: { initialStep } }))
}
