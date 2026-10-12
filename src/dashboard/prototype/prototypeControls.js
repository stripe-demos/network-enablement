import { dashboardStorage } from '../lib/storage';
export const SIDEBAR_PROTOTYPE_CONTROLS_KEY = 'dashboard:prototype-controls:sidebar'
export const SIDEBAR_PROTOTYPE_CONTROLS_CHANNEL = 'dashboard:prototype-controls:sidebar'

export const DEFAULT_SIDEBAR_PROTOTYPE_CONTROLS = {
  sidebarTransitionMs: 300,
  sidebarFadeMs: 160,
  contentTransitionMs: 300,
  contentFadeMs: 160,
  sideDirection: 'none',
  contentDirection: 'none',
  keepPinnedSectionsStatic: true,
  reducedMotion: false,
}

function normalizeDirection(value, fallback) {
  return ['none', 'left', 'right', 'up', 'down'].includes(value) ? value : fallback
}

function directionOffset(direction) {
  switch (direction) {
    case 'left':
      return { x: '-12px', y: '0px' }
    case 'right':
      return { x: '12px', y: '0px' }
    case 'up':
      return { x: '0px', y: '12px' }
    case 'down':
      return { x: '0px', y: '-12px' }
    default:
      return { x: '0px', y: '0px' }
  }
}

export function normalizeSidebarPrototypeControls(values = {}) {
  return {
    ...DEFAULT_SIDEBAR_PROTOTYPE_CONTROLS,
    ...values,
    sidebarTransitionMs: clampNumber(values.sidebarTransitionMs, 120, 1200, DEFAULT_SIDEBAR_PROTOTYPE_CONTROLS.sidebarTransitionMs),
    sidebarFadeMs: clampNumber(values.sidebarFadeMs, 0, 800, DEFAULT_SIDEBAR_PROTOTYPE_CONTROLS.sidebarFadeMs),
    contentTransitionMs: clampNumber(values.contentTransitionMs, 120, 1200, DEFAULT_SIDEBAR_PROTOTYPE_CONTROLS.contentTransitionMs),
    contentFadeMs: clampNumber(values.contentFadeMs, 0, 800, DEFAULT_SIDEBAR_PROTOTYPE_CONTROLS.contentFadeMs),
    sideDirection: normalizeDirection(values.sideDirection, DEFAULT_SIDEBAR_PROTOTYPE_CONTROLS.sideDirection),
    contentDirection: normalizeDirection(values.contentDirection, DEFAULT_SIDEBAR_PROTOTYPE_CONTROLS.contentDirection),
    keepPinnedSectionsStatic: values.keepPinnedSectionsStatic === true,
    reducedMotion: values.reducedMotion === true,
  }
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, number))
}

export function readSidebarPrototypeControls() {
  try {
    const raw = dashboardStorage.getItem(SIDEBAR_PROTOTYPE_CONTROLS_KEY)
    return normalizeSidebarPrototypeControls(raw ? JSON.parse(raw) : {})
  } catch {
    return DEFAULT_SIDEBAR_PROTOTYPE_CONTROLS
  }
}

export function applySidebarPrototypeControls(values) {
  const controls = normalizeSidebarPrototypeControls(values)
  const root = document.documentElement
  const sidebarMs = controls.reducedMotion ? 1 : controls.sidebarTransitionMs
  const sidebarFadeMs = controls.reducedMotion ? 1 : controls.sidebarFadeMs
  const contentMs = controls.reducedMotion ? 1 : controls.contentTransitionMs
  const contentFadeMs = controls.reducedMotion ? 1 : controls.contentFadeMs
  const sidebarOffset = directionOffset(controls.sideDirection)
  const contentOffset = directionOffset(controls.contentDirection)

  root.style.setProperty('--prototype-sidebar-transition-ms', `${sidebarMs}ms`)
  root.style.setProperty('--prototype-sidebar-fade-ms', `${sidebarFadeMs}ms`)
  root.style.setProperty('--prototype-content-transition-ms', `${contentMs}ms`)
  root.style.setProperty('--prototype-content-fade-ms', `${contentFadeMs}ms`)
  root.style.setProperty('--prototype-content-delay-ms', controls.reducedMotion ? '0ms' : '120ms')
  root.style.setProperty('--prototype-sidebar-enter-x', sidebarOffset.x)
  root.style.setProperty('--prototype-sidebar-enter-y', sidebarOffset.y)
  root.style.setProperty('--prototype-content-enter-x', contentOffset.x)
  root.style.setProperty('--prototype-content-enter-y', contentOffset.y)
  root.setAttribute('data-prototype-sidebar-direction', controls.sideDirection)
  root.setAttribute('data-prototype-content-direction', controls.contentDirection)
  root.setAttribute('data-prototype-sidebar-static-sections', controls.keepPinnedSectionsStatic ? 'true' : 'false')
  root.setAttribute('data-prototype-reduced-motion', controls.reducedMotion ? 'true' : 'false')
  return controls
}
