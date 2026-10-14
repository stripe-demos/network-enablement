// Opens the Stripe network onboarding dialog from anywhere in the Dashboard.
// NetworkOnboardingHost (mounted once in DashboardLayout) listens for these
// events and owns the only dialog instance.
export const OPEN_NETWORK_ONBOARDING_EVENT = 'dashboard:open-network-onboarding'
export const CLOSE_NETWORK_ONBOARDING_EVENT = 'dashboard:close-network-onboarding'

/**
 * Opens the dialog, or, if it's already open, moves it to initialStep while
 * keeping its state.
 *   initialStep: 'welcome' | 'opt-in' | 'find-accounts' (optional)
 *   keepFocus:   leave focus where it is (e.g. on a prototype panel control
 *                that sits above the dialog) instead of moving it into the dialog.
 */
export function openNetworkOnboarding({ initialStep, keepFocus = false } = {}) {
  window.dispatchEvent(new CustomEvent(OPEN_NETWORK_ONBOARDING_EVENT, { detail: { initialStep, keepFocus } }))
}

/** Closes the dialog without saving. No-op when it's closed. */
export function closeNetworkOnboarding() {
  window.dispatchEvent(new Event(CLOSE_NETWORK_ONBOARDING_EVENT))
}
