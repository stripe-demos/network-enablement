// Prototype controls for the Enablement module: which placement is on (one at
// a time), and which contextual nudges have been dismissed. Saved with the Dashboard's
// storage prefix and broadcast with a window event so every placement updates
// at once.
import { useSyncExternalStore } from 'react'
import { dashboardStorage } from '../lib/storage'

const KEY = 'prototype-controls:enablement'
export const ENABLEMENT_PROTOTYPE_CONTROLS_EVENT = 'dashboard:prototype-controls:enablement'

export const ENABLEMENT_PLACEMENTS = [
  { id: 'enablementPage', label: 'Embedded · Enablement page' },
  { id: 'growthPage', label: 'Embedded · Growth page' },
  { id: 'floatie', label: 'Floatie (after Connect setup)' },
  { id: 'nudge', label: 'Contextual nudge' },
]

export const DEFAULT_ENABLEMENT_PROTOTYPE_CONTROLS = { placement: 'enablementPage', dismissedNudges: [] }

let cachedRaw
let cached = DEFAULT_ENABLEMENT_PROTOTYPE_CONTROLS

export function readEnablementPrototypeControls() {
  const raw = dashboardStorage.getItem(KEY)
  if (raw !== cachedRaw) {
    cachedRaw = raw
    let parsed
    try { parsed = raw ? JSON.parse(raw) : {} } catch { parsed = {} }
    const next = { ...DEFAULT_ENABLEMENT_PROTOTYPE_CONTROLS }
    if (ENABLEMENT_PLACEMENTS.some(p => p.id === parsed.placement)) next.placement = parsed.placement
    if (Array.isArray(parsed.dismissedNudges)) next.dismissedNudges = parsed.dismissedNudges.filter(id => typeof id === 'string')
    cached = next
  }
  return cached
}

export function writeEnablementPrototypeControls(partial) {
  dashboardStorage.setItem(KEY, JSON.stringify({ ...readEnablementPrototypeControls(), ...partial }))
  window.dispatchEvent(new Event(ENABLEMENT_PROTOTYPE_CONTROLS_EVENT))
}

/** Back to the defaults (only the Enablement page placement on, no nudges dismissed). */
export function resetEnablementPrototypeControls() {
  dashboardStorage.removeItem(KEY)
  window.dispatchEvent(new Event(ENABLEMENT_PROTOTYPE_CONTROLS_EVENT))
}

function subscribe(onChange) {
  window.addEventListener(ENABLEMENT_PROTOTYPE_CONTROLS_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(ENABLEMENT_PROTOTYPE_CONTROLS_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

export function useEnablementPrototypeControls() {
  return useSyncExternalStore(subscribe, readEnablementPrototypeControls, () => DEFAULT_ENABLEMENT_PROTOTYPE_CONTROLS)
}
