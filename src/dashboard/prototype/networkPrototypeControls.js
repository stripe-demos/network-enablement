// Prototype controls for the Stripe network onboarding flow, set from the
// control panel in the Developers bar. Saved with the Dashboard's storage prefix
// and broadcast with a window event so an open dialog switches immediately.
import { useSyncExternalStore } from 'react'
import { dashboardStorage } from '../lib/storage'

const KEY = 'prototype-controls:network'
export const NETWORK_PROTOTYPE_CONTROLS_EVENT = 'dashboard:prototype-controls:network'

// A stored id that's no longer listed (e.g. the removed 'list' version) falls
// back to the default.
export const FIND_ACCOUNTS_VARIANT_IDS = ['deck', 'cards']
export const START_STEP_IDS = ['welcome', 'opt-in', 'find-accounts']
export const DEFAULT_NETWORK_PROTOTYPE_CONTROLS = { findAccountsVariant: 'deck', startStep: 'welcome' }

let cachedRaw
let cached = DEFAULT_NETWORK_PROTOTYPE_CONTROLS

export function readNetworkPrototypeControls() {
  const raw = dashboardStorage.getItem(KEY)
  if (raw !== cachedRaw) {
    cachedRaw = raw
    let parsed
    try { parsed = raw ? JSON.parse(raw) : {} } catch { parsed = {} }
    cached = {
      ...DEFAULT_NETWORK_PROTOTYPE_CONTROLS,
      findAccountsVariant: FIND_ACCOUNTS_VARIANT_IDS.includes(parsed.findAccountsVariant)
        ? parsed.findAccountsVariant
        : DEFAULT_NETWORK_PROTOTYPE_CONTROLS.findAccountsVariant,
      startStep: START_STEP_IDS.includes(parsed.startStep)
        ? parsed.startStep
        : DEFAULT_NETWORK_PROTOTYPE_CONTROLS.startStep,
    }
  }
  return cached
}

export function writeNetworkPrototypeControls(partial) {
  dashboardStorage.setItem(KEY, JSON.stringify({ ...readNetworkPrototypeControls(), ...partial }))
  window.dispatchEvent(new Event(NETWORK_PROTOTYPE_CONTROLS_EVENT))
}

/** Back to the defaults (step 3 version: Swipe, start step: Welcome). */
export function resetNetworkPrototypeControls() {
  dashboardStorage.removeItem(KEY)
  window.dispatchEvent(new Event(NETWORK_PROTOTYPE_CONTROLS_EVENT))
}

function subscribe(onChange) {
  window.addEventListener(NETWORK_PROTOTYPE_CONTROLS_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(NETWORK_PROTOTYPE_CONTROLS_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

export function useNetworkPrototypeControls() {
  return useSyncExternalStore(subscribe, readNetworkPrototypeControls, () => DEFAULT_NETWORK_PROTOTYPE_CONTROLS)
}
