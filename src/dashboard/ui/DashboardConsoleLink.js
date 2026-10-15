import { launchConsole } from '../../integration/consoleHandoff';

// Dashboard controls enter the canonical Console; there is no second chat UI.
const navigation = {
  openConsole: () => launchConsole(),
  askConsole: ({ prompt = '' } = {}) => launchConsole(prompt),
};

/** The same navigation, for code outside components (e.g. openNetworkOnboarding). */
export const dashboardConsole = navigation;

export function useDashboardConsole() {
  return navigation;
}
