// Prototype controls for the Stripe network onboarding flow, set from the
// control panel in the Developers bar. Saved with the Dashboard's storage prefix
// and broadcast with a window event so an open dialog switches immediately.
import { useSyncExternalStore } from 'react'
import { dashboardStorage } from '../lib/storage'

const KEY = 'prototype-controls:network'
export const NETWORK_PROTOTYPE_CONTROLS_EVENT = 'dashboard:prototype-controls:network'

export const FIND_ACCOUNTS_VARIANT_IDS = ['list', 'cards', 'deck']
export const DEFAULT_NETWORK_PROTOTYPE_CONTROLS = { findAccountsVariant: 'list' }

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
    }
  }
  return cached
}

export function writeNetworkPrototypeControls(partial) {
  dashboardStorage.setItem(KEY, JSON.stringify({ ...readNetworkPrototypeControls(), ...partial }))
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
