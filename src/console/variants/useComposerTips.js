import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'console-tips-dismissed';
let dismissed = false;
try {
  dismissed = typeof window !== 'undefined' && window.sessionStorage.getItem(STORAGE_KEY) === 'true';
} catch { /* Keep the preference in memory if storage is unavailable. */ }
const listeners = new Set();

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function dismiss() {
  dismissed = true;
  try { window.sessionStorage.setItem(STORAGE_KEY, 'true'); } catch { /* Memory fallback. */ }
  listeners.forEach(listener => listener());
}

export function useComposerTips() {
  const hidden = useSyncExternalStore(subscribe, () => dismissed, () => false);
  return [!hidden, dismiss];
}
