import { useMemo, useSyncExternalStore } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Variant discovery & selection.
//
// Designers don't touch a registry file — every folder under src/variants/
// (other than this hook itself) is auto-loaded by Vite. A folder becomes a
// variant by exporting a `meta` object and (for non-layout scopes) a default
// React component.
//
// Folder convention:
//   src/variants/<id>/
//     meta.js     // { id, label, scope, slot? }
//     index.jsx   // export default function MyVariant(props) { ... }
//
// `scope` is one of:
//   - 'element' — replaces a single component slot. Requires `slot`.
//                 Slot names match the keys in the SLOTS map in Home.jsx
//                 (e.g. 'Sidebar', 'ConversationPanel', 'Canvas').
//   - 'page'    — replaces the entire <Home /> page. No slot.
//   - 'layout'  — pure config flag (e.g. Small/Large). Component-less.
//                 Layout variants are mutually exclusive within the same
//                 `group` (default group: 'layout').
//
// Selection lives in the URL so designers can share links:
//   ?p=<page-variant-id>
//   ?e=<comma-separated-element-variant-ids>
//   ?l=<comma-separated-layout-variant-ids>
// ─────────────────────────────────────────────────────────────────────────────

const metaModules = import.meta.glob('./*/meta.js', { eager: true });
const componentModules = import.meta.glob('./*/index.jsx', { eager: true });

// Built-in layout variants — preserved from the original prototype's
// Small/Large toggle. Designers don't add new ones via folders; element
// or page variants are the way to add new picker entries. Listing them
// here lets useVariants.setLayout find their group for the clear logic.
const BUILTIN_LAYOUTS = [
  { id: 'large', label: 'Large', scope: 'layout', group: 'canvasLayout', Component: null, _builtIn: true },
];

function buildRegistry() {
  const out = [...BUILTIN_LAYOUTS];
  for (const [path, mod] of Object.entries(metaModules)) {
    const meta = mod.meta || mod.default;
    if (!meta || !meta.id) continue;
    const folder = path.replace(/^\.\//, '').split('/')[0];
    const componentPath = `./${folder}/index.jsx`;
    const Component = componentModules[componentPath]?.default ?? null;
    out.push({ ...meta, Component, _folder: folder });
  }
  return out;
}

const REGISTRY = buildRegistry();

// ── URL-state store (subscribable) ──────────────────────────────────────────
const listeners = new Set();
function notify() {
  listeners.forEach((fn) => fn());
}
window.addEventListener('popstate', notify);

function getSnapshot() {
  return window.location.search;
}
function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function parseParams(search) {
  const sp = new URLSearchParams(search);
  const split = (v) => (v ? v.split(',').filter(Boolean) : []);
  return {
    page: sp.get('p') || null,
    elements: new Set(split(sp.get('e'))),
    layouts: new Set(split(sp.get('l'))),
  };
}

function writeParams(next) {
  const sp = new URLSearchParams(window.location.search);
  if (next.page) sp.set('p', next.page);
  else sp.delete('p');
  if (next.elements.size) sp.set('e', [...next.elements].join(','));
  else sp.delete('e');
  if (next.layouts.size) sp.set('l', [...next.layouts].join(','));
  else sp.delete('l');
  const qs = sp.toString();
  const url = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash;
  window.history.replaceState(null, '', url);
  notify();
}

// ── Public hook ─────────────────────────────────────────────────────────────
export function useVariants() {
  const search = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const state = useMemo(() => parseParams(search), [search]);

  // Group by scope for the picker UI.
  const byScope = useMemo(() => {
    const g = { element: [], page: [], layout: [] };
    REGISTRY.forEach((v) => {
      if (g[v.scope]) g[v.scope].push(v);
    });
    return g;
  }, []);

  // Resolve the active page-variant component (null = render default Home).
  const ActivePage = useMemo(() => {
    if (!state.page) return null;
    return REGISTRY.find((v) => v.scope === 'page' && v.id === state.page)?.Component ?? null;
  }, [state.page]);

  // Resolve element overrides keyed by slot name. Last-write-wins if two
  // variants target the same slot — the picker prevents that on the UI side.
  const elementOverrides = useMemo(() => {
    const out = {};
    state.elements.forEach((id) => {
      const v = REGISTRY.find((x) => x.scope === 'element' && x.id === id);
      if (v?.slot && v.Component) out[v.slot] = v.Component;
    });
    return out;
  }, [state.elements]);

  // Layout flags as a Set<string> the page can branch on (e.g. 'large').
  const layoutFlags = state.layouts;

  function setPage(id) {
    writeParams({ ...state, page: id || null });
  }
  function toggleElement(id) {
    const next = new Set(state.elements);
    next.has(id) ? next.delete(id) : next.add(id);
    // Within element scope we enforce one-per-slot to avoid ambiguity.
    const variant = REGISTRY.find((x) => x.scope === 'element' && x.id === id);
    if (variant?.slot && next.has(id)) {
      REGISTRY.forEach((other) => {
        if (other.id !== id && other.scope === 'element' && other.slot === variant.slot) {
          next.delete(other.id);
        }
      });
    }
    writeParams({ ...state, elements: next });
  }
  function setLayout(group, id) {
    // Layout group is single-select. Other layout variants in the same group
    // are removed when one is picked. Pass id=null to clear the group.
    const next = new Set(state.layouts);
    REGISTRY.forEach((v) => {
      if (v.scope === 'layout' && (v.group || 'layout') === group) {
        next.delete(v.id);
      }
    });
    if (id) next.add(id);
    writeParams({ ...state, layouts: next });
  }

  return {
    registry: REGISTRY,
    byScope,
    selected: state,
    ActivePage,
    elementOverrides,
    layoutFlags,
    setPage,
    toggleElement,
    setLayout,
  };
}
