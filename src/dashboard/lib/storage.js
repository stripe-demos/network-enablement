// All Dashboard preferences are isolated from Console, including imported controls.
export const dashboardStorageKey = key => `dashboard:${key}`;

export function createDashboardStorage(getStorage) {
  return {
    getItem(key) {
      try { return getStorage().getItem(dashboardStorageKey(key)); } catch { return null; }
    },
    setItem(key, value) {
      try { getStorage().setItem(dashboardStorageKey(key), value); } catch { /* Keep the current UI state. */ }
    },
    removeItem(key) {
      try { getStorage().removeItem(dashboardStorageKey(key)); } catch { /* Storage can be unavailable. */ }
    },
  };
}

export const dashboardStorage = createDashboardStorage(() => window.localStorage);
