// Position and DOM node of the shared floatie column (FloatieStack.jsx).
// Panels portal into the node once it has mounted.
import { useSyncExternalStore } from 'react';

// Above the Workbench bar, left of the prototype controls trigger (a 32px
// circle 16px from the right edge; see .dash-proto-trigger in dashboard.css).
export const GUIDE_BOTTOM = 'calc(var(--dash-workbench-height, 48px) + 8px)';
export const GUIDE_RIGHT = 60;
export const GUIDE_WIDTH = 280;

let stackNode = null;
const listeners = new Set();

export function setFloatieStackNode(node) {
  stackNode = node;
  listeners.forEach((listener) => listener());
}

function subscribe(onChange) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** The stack's DOM node, or null before FloatieStack has mounted. */
export function useFloatieStackNode() {
  return useSyncExternalStore(subscribe, () => stackNode, () => null);
}
