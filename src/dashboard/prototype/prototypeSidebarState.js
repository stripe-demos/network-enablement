import { dashboardStorage } from '../lib/storage';
const DEFAULT_COLLAPSED_PROTOTYPE_VIEWS = new Set(['collapsed', 'chrome-search'])

export function getPrototypeSidebarStorageKey(prototypeView) {
  return prototypeView ? `prototype-sidebar-collapsed:v2:${prototypeView}` : null
}

export function getPrototypeSidebarDefaultCollapsed(prototypeView) {
  return DEFAULT_COLLAPSED_PROTOTYPE_VIEWS.has(prototypeView)
}

export function readPrototypeSidebarCollapsed(prototypeView, fallback = false) {
  const key = getPrototypeSidebarStorageKey(prototypeView)
  if (!key || typeof window === 'undefined') return fallback
  const stored = dashboardStorage.getItem(key)
  return stored === null ? fallback : stored === 'true'
}

export function writePrototypeSidebarCollapsed(prototypeView, collapsed) {
  const key = getPrototypeSidebarStorageKey(prototypeView)
  if (!key || typeof window === 'undefined') return
  dashboardStorage.setItem(key, String(collapsed))
}

export function getPrototypeSidebarCollapsedFromParams(params) {
  const prototypeView = params?.get('prototypeView')
  if (!prototypeView) return false
  const fallback = params.get('sidebar') === 'collapsed' || getPrototypeSidebarDefaultCollapsed(prototypeView)
  return readPrototypeSidebarCollapsed(prototypeView, fallback)
}

export function syncPrototypeSidebarParam(params) {
  const prototypeView = params?.get('prototypeView')
  if (!prototypeView) return params

  if (getPrototypeSidebarCollapsedFromParams(params)) {
    params.set('sidebar', 'collapsed')
  } else {
    params.delete('sidebar')
  }

  return params
}

export function getCurrentPrototypeParams() {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return params.get('prototypeView') ? params : null
}
