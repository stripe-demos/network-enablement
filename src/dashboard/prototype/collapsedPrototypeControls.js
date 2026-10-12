import { dashboardStorage } from '../lib/storage';
export const COLLAPSED_PROTOTYPE_CONTROLS_KEY = 'dashboard:prototype-controls:collapsed'
export const COLLAPSED_PROTOTYPE_CONTROLS_CHANNEL = 'dashboard:prototype-controls:collapsed'

export const DEFAULT_COLLAPSED_PROTOTYPE_CONTROLS = {
  collapsedWidth: 64,
  iconOpacity: 100,
  tooltipOffsetX: -4,
  collapseIndicator: 'current',
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, number))
}

function normalizeIndicator(value, fallback) {
  return ['current', 'no-background', 'chevron'].includes(value) ? value : fallback
}

export function normalizeCollapsedPrototypeControls(values = {}) {
  return {
    ...DEFAULT_COLLAPSED_PROTOTYPE_CONTROLS,
    ...values,
    collapsedWidth: clampNumber(values.collapsedWidth, 52, 96, DEFAULT_COLLAPSED_PROTOTYPE_CONTROLS.collapsedWidth),
    iconOpacity: clampNumber(values.iconOpacity, 0, 100, DEFAULT_COLLAPSED_PROTOTYPE_CONTROLS.iconOpacity),
    tooltipOffsetX: clampNumber(values.tooltipOffsetX, -80, 80, DEFAULT_COLLAPSED_PROTOTYPE_CONTROLS.tooltipOffsetX),
    collapseIndicator: normalizeIndicator(values.collapseIndicator, DEFAULT_COLLAPSED_PROTOTYPE_CONTROLS.collapseIndicator),
  }
}

export function readCollapsedPrototypeControls() {
  try {
    const raw = dashboardStorage.getItem(COLLAPSED_PROTOTYPE_CONTROLS_KEY)
    return normalizeCollapsedPrototypeControls(raw ? JSON.parse(raw) : {})
  } catch {
    return DEFAULT_COLLAPSED_PROTOTYPE_CONTROLS
  }
}

export function applyCollapsedPrototypeControls(values) {
  const controls = normalizeCollapsedPrototypeControls(values)
  const root = document.documentElement
  root.style.setProperty('--prototype-collapsed-sidebar-width', `${controls.collapsedWidth}px`)
  root.style.setProperty('--prototype-collapsed-icon-opacity', String(controls.iconOpacity / 100))
  root.style.setProperty('--prototype-collapse-tooltip-offset-x', `${controls.tooltipOffsetX}px`)
  root.setAttribute('data-prototype-collapse-indicator', controls.collapseIndicator)
  return controls
}
