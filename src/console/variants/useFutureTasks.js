import { useSyncExternalStore } from 'react';

const KEY = 'console-future-tasks';
const listeners = new Set();
let enabled = false;
try { enabled = localStorage.getItem(KEY) === 'true'; } catch { /* Session-only fallback. */ }
const notify = () => listeners.forEach(listener => listener());
window.addEventListener('storage', event => {
  if (event.key !== KEY && event.key !== null) return;
  enabled = event.newValue === 'true';
  notify();
});
export const getFutureTasks = () => enabled;
export function setFutureTasks(value) {
  enabled = value;
  try { localStorage.setItem(KEY, String(value)); } catch { /* Keep the in-memory choice. */ }
  notify();
}
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function useFutureTasks() {
  return [useSyncExternalStore(subscribe, getFutureTasks, () => false), setFutureTasks];
}
