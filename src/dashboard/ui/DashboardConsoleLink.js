import { launchConsole } from '../../integration/consoleHandoff';

// Dashboard controls enter the canonical Console; there is no second chat UI.
const navigation = {
  openConsole: () => launchConsole(),
  askConsole: ({ prompt = '' } = {}) => launchConsole(prompt),
};

export function useDashboardConsole() {
  return navigation;
}
