// The surfaces share navigation data only, never components or design tokens.
export const DASHBOARD_URL = '/dashboard/';
export const CONSOLE_URL = '/console/?new=1';
const HANDOFF_KEY = 'dashboardConsoleHandoff';

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
