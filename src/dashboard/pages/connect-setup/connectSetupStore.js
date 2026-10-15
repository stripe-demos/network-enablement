// Shared state for the Connect setup flow (ported from connect-onboarding
// prototype4's dashboard model). The setup dialog writes it; the Setup guide on
// Home and the network recommendations read it. Stored as one record under
// 'connect-setup-v1' in sessionStorage, so every new tab starts with setup not
// done (a reload keeps it), the same as the network onboarding record.
//
//   { config, autoLiability, acknowledgedWaivers, setupComplete, business: { website, description } }
//
// autoLiability is the liability value the funds-flow cascade overrode, so
// switching back to direct charges restores it (see data/dependencies.js).
import { useSyncExternalStore } from 'react'
import { createDashboardStorage } from '../../lib/storage'
import { RECOMMENDED } from './data/config'
import { applyDependencies } from './data/dependencies'

const KEY = 'connect-setup-v1'
const storage = createDashboardStorage(() => window.sessionStorage)
/** Change event; state is per tab, so no cross-tab sync is needed. */
export const CONNECT_SETUP_EVENT = 'dashboard:connect-setup-change'

const initialState = () => ({
  config: { ...RECOMMENDED },
  autoLiability: null,
  acknowledgedWaivers: [],
  setupComplete: false,
  business: { website: '', description: '' },
})

let cachedRaw
let cachedState = initialState()

/** The current setup state. Same identity until something changes. */
export function getConnectSetup() {
  const raw = storage.getItem(KEY)
  if (raw !== cachedRaw) {
    cachedRaw = raw
    try {
      const parsed = raw ? JSON.parse(raw) : null
      const base = initialState()
      cachedState = parsed && typeof parsed === 'object'
        ? { ...base, ...parsed, config: { ...base.config, ...parsed.config }, business: { ...base.business, ...parsed.business } }
        : base
    } catch {
      cachedState = initialState()
    }
  }
  return cachedState
}

function write(patch) {
  storage.setItem(KEY, JSON.stringify({ ...getConnectSetup(), ...patch }))
  window.dispatchEvent(new Event(CONNECT_SETUP_EVENT))
}

/** Change one setting, applying the funds-flow → liability dependency. */
export function updateSetting(settingId, value) {
  const { config, autoLiability } = getConnectSetup()
  const applied = applyDependencies(config, settingId, value, autoLiability)
  write({ config: applied.config, autoLiability: applied.autoLiability })
}

/** Replace the config wholesale (Skip's preset, Reset to defaults). */
export function applyConfig(config) {
  write({ config: { ...getConnectSetup().config, ...config }, autoLiability: null })
}

export function acknowledgeWaiver(waiverId) {
  const { acknowledgedWaivers } = getConnectSetup()
  if (!acknowledgedWaivers.includes(waiverId)) write({ acknowledgedWaivers: [...acknowledgedWaivers, waiverId] })
}

/** What the user entered on Describe your business. */
export function setBusiness(business) {
  write({ business: { ...getConnectSetup().business, ...business } })
}

export function completeSetup() {
  if (!getConnectSetup().setupComplete) write({ setupComplete: true })
}

/** Forget everything (prototype reset). */
export function resetConnectSetup() {
  storage.removeItem(KEY)
  window.dispatchEvent(new Event(CONNECT_SETUP_EVENT))
}

/** The business description saved by setup, or '' when there isn't one. */
export const savedBusinessDescription = () => getConnectSetup().business.description.trim()

function subscribe(onChange) {
  window.addEventListener(CONNECT_SETUP_EVENT, onChange)
  return () => window.removeEventListener(CONNECT_SETUP_EVENT, onChange)
}

export function useConnectSetup() {
  return useSyncExternalStore(subscribe, getConnectSetup)
}
