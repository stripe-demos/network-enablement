import { dashboardStorage } from '../lib/storage';
export const BACK_BUTTON_PROTOTYPE_CONTROLS_KEY = 'dashboard:prototype-controls:back-button'
export const BACK_BUTTON_PROTOTYPE_CONTROLS_CHANNEL = 'dashboard:prototype-controls:back-button'

export const DEFAULT_BACK_BUTTON_PROTOTYPE_CONTROLS = {
  position: 'replace-tenant',
  style: 'no-outline',
  destination: 'go-back',
  dashboardIconTop: false,
  dashboardLayout: 'off',
}

function normalizeOption(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback
}

export function normalizeBackButtonPrototypeControls(values = {}) {
  const legacyStyleMap = {
    default: 'no-outline',
    subtle: 'outline',
    filled: 'gray',
  }
  const style = legacyStyleMap[values.style] || values.style

  return {
    ...DEFAULT_BACK_BUTTON_PROTOTYPE_CONTROLS,
    ...values,
    position: normalizeOption(
      values.position,
      ['under-tenant', 'replace-tenant', 'chat-header', 'floating-bottom', 'replace-dashboard'],
      DEFAULT_BACK_BUTTON_PROTOTYPE_CONTROLS.position,
    ),
    style: normalizeOption(style, ['outline', 'no-outline', 'gray'], DEFAULT_BACK_BUTTON_PROTOTYPE_CONTROLS.style),
    destination: normalizeOption(values.destination, ['home', 'back-to', 'go-back'], DEFAULT_BACK_BUTTON_PROTOTYPE_CONTROLS.destination),
    dashboardIconTop: values.dashboardIconTop === true,
    dashboardLayout: normalizeOption(values.dashboardLayout, ['off', 'icon-top', 'linear'], DEFAULT_BACK_BUTTON_PROTOTYPE_CONTROLS.dashboardLayout),
  }
}

export function readBackButtonPrototypeControls() {
  try {
    const raw = dashboardStorage.getItem(BACK_BUTTON_PROTOTYPE_CONTROLS_KEY)
    return normalizeBackButtonPrototypeControls(raw ? JSON.parse(raw) : {})
  } catch {
    return DEFAULT_BACK_BUTTON_PROTOTYPE_CONTROLS
  }
}

export function applyBackButtonPrototypeControls(values) {
  const controls = normalizeBackButtonPrototypeControls(values)
  const root = document.documentElement
  root.setAttribute('data-prototype-back-button-position', controls.position)
  root.setAttribute('data-prototype-back-button-style', controls.style)
  root.setAttribute('data-prototype-back-button-destination', controls.destination)
  root.setAttribute('data-prototype-back-button-dashboard-icon-top', controls.dashboardIconTop ? 'true' : 'false')
  root.setAttribute('data-prototype-back-button-dashboard-layout', controls.dashboardLayout)
  return controls
}
