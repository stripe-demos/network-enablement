/** @typedef {number[]} MultiChartRowSizes — array of 1s and 2s, sums to panel count */

export function defaultRowSizes(n) {
  if (n === 2) return [1, 1];
  if (n === 3) return [1, 2];
  if (n === 4) return [2, 2];
  return Array(n).fill(1);
}

export function defaultPanelsWithIds(tabId, registryPanels) {
  return registryPanels.map((p, i) => ({ ...p, id: `${tabId}-p${i}` }));
}

export const MULTI_CHART_TAB_IDS = ['multi2', 'multi3', 'multi4'];
