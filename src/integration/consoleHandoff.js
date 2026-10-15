// The surfaces share navigation data only, never components or design tokens.
export const DASHBOARD_URL = '/dashboard/';
export const CONSOLE_URL = '/console/?new=1';
const HANDOFF_KEY = 'dashboardConsoleHandoff';
const RETURN_KEY = 'consoleDashboardHandoff';

export function launchConsole(prompt = '', { replace = false, browser = window } = {}) {
  const state = { [HANDOFF_KEY]: { prompt: typeof prompt === 'string' ? prompt.trim() : '' } };
  // Carry the prompt in history state, not in URLs or cross-tab storage. Reload
  // loads Console's own HTML/CSS entry point. Back returns to the Dashboard.
  browser.history[replace ? 'replaceState' : 'pushState'](state, '', CONSOLE_URL);
  browser.location.reload();
}

export function consumeConsoleHandoff(history) {
  const state = history.state;
  if (!state || !Object.hasOwn(state, HANDOFF_KEY)) return null;
  const { [HANDOFF_KEY]: handoff, ...remaining } = state;
  history.replaceState(remaining, '');
  return handoff && typeof handoff.prompt === 'string' && handoff.prompt.trim()
    ? { prompt: handoff.prompt.trim() }
    : null;
}

// The return trip: Console opens a Dashboard page and can carry a finished
// Stripe network onboarding result, so the Dashboard records it as done.
export function launchDashboard(path = DASHBOARD_URL, { networkOnboarding } = {}, { replace = false, browser = window } = {}) {
  const url = typeof path === 'string' && path.startsWith(DASHBOARD_URL) ? path : DASHBOARD_URL;
  const result = cleanNetworkOnboarding(networkOnboarding);
  const state = result ? { [RETURN_KEY]: { networkOnboarding: result } } : null;
  browser.history[replace ? 'replaceState' : 'pushState'](state, '', url);
  browser.location.reload();
}

export function consumeDashboardHandoff(history) {
  const state = history.state;
  if (!state || !Object.hasOwn(state, RETURN_KEY)) return null;
  const { [RETURN_KEY]: handoff, ...remaining } = state;
  history.replaceState(remaining, '');
  const networkOnboarding = cleanNetworkOnboarding(handoff?.networkOnboarding);
  return networkOnboarding ? { networkOnboarding } : null;
}

function cleanNetworkOnboarding(result) {
  if (!result || typeof result.optedIn !== 'boolean' || !Array.isArray(result.selectedAccountIds)) return null;
  return {
    optedIn: result.optedIn,
    selectedAccountIds: result.selectedAccountIds.filter(id => typeof id === 'string'),
  };
}
