// Opens the Stripe network onboarding dialog from anywhere in the Dashboard.
// NetworkOnboardingHost (mounted once in DashboardLayout) listens for these
// events and owns the only dialog instance. When the prototype panel sets the
// flow to Console, opening hands off to a Console conversation instead.
import { readNetworkPrototypeControls } from '../../prototype/networkPrototypeControls'
import { dashboardConsole } from '../../ui/DashboardConsoleLink'
export const OPEN_NETWORK_ONBOARDING_EVENT = 'dashboard:open-network-onboarding'
export const CLOSE_NETWORK_ONBOARDING_EVENT = 'dashboard:close-network-onboarding'
// Console starts its network onboarding conversation for this prompt.
export const NETWORK_CONSOLE_PROMPT = 'Help me find my first connected accounts on the Stripe network'

/**
 * Opens the dialog, or, if it's already open, moves it to initialStep while
 * keeping its state.
 *   initialStep: 'welcome' | 'opt-in' | 'find-accounts' (optional)
 *   keepFocus:   leave focus where it is (e.g. on a prototype panel control
 *                that sits above the dialog) instead of moving it into the dialog.
 *   surface:     'dialog' | 'console'; defaults to the prototype panel's choice.
 */
export function openNetworkOnboarding({ initialStep, keepFocus = false, surface } = {}) {
  if ((surface ?? readNetworkPrototypeControls().flowSurface) === 'console') {
    dashboardConsole.askConsole({ prompt: NETWORK_CONSOLE_PROMPT })
    return
  }
  window.dispatchEvent(new CustomEvent(OPEN_NETWORK_ONBOARDING_EVENT, { detail: { initialStep, keepFocus } }))
}

/** Closes the dialog without saving. No-op when it's closed. */
export function closeNetworkOnboarding() {
  window.dispatchEvent(new Event(CLOSE_NETWORK_ONBOARDING_EVENT))
}
