import { dashboardStorage } from '../lib/storage';
import { useState, useEffect } from 'react';

const KEY = 'dashboard-sidenav-variant';
const DEFAULT = 'distinct';

const listeners = new Set();

function applyAttr(v) {
  document.documentElement.setAttribute('data-sidenav', v);
}

// Apply on load
applyAttr(dashboardStorage.getItem(KEY) || DEFAULT);

export function useSideNavVariant() {
  const [value, setValue] = useState(() => dashboardStorage.getItem(KEY) || DEFAULT);

  useEffect(() => {
    const handler = (v) => setValue(v);
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  function set(v) {
    dashboardStorage.setItem(KEY, v);
    applyAttr(v);
    setValue(v);
    listeners.forEach((fn) => fn(v));
  }

  return [value, set];
}
