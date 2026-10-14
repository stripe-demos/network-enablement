// Shared state for the Stripe network onboarding result. Enablement's checklist
// writes it when the dialog finishes; the Network list and the sidebar's Network
// item read it. Stored as one record under 'network-onboarding-v2' in
// sessionStorage, so every new tab starts with the task not done (a reload keeps
// it). The v2 key ignores records saved by earlier versions of the dialog.
//
//   { optedIn, selectedAccountIds, completedAt, seenAt }
//
// completedAt and seenAt are ISO timestamps. Invites are "unseen" until the
// Network page is visited after the latest completion (completedAt > seenAt).
import { useSyncExternalStore } from 'react'
import { createDashboardStorage } from '../../lib/storage'
import { NETWORK_CANDIDATES } from './networkCandidates'

const KEY = 'network-onboarding-v2'
const storage = createDashboardStorage(() => window.sessionStorage)
/** Change event; state is per tab, so no cross-tab sync is needed. */
export const NETWORK_ONBOARDING_EVENT = 'dashboard:network-onboarding-change'

let cachedRaw
let cachedRecord = null

/** The saved onboarding record, or null if the dialog hasn't been completed. */
export function getNetworkOnboarding() {
  const raw = storage.getItem(KEY)
  if (raw !== cachedRaw) {
    cachedRaw = raw
    try {
      const parsed = raw ? JSON.parse(raw) : null
      cachedRecord = parsed && typeof parsed === 'object' ? parsed : null
    } catch {
      cachedRecord = null
    }
  }
  return cachedRecord
}

function write(record) {
  storage.setItem(KEY, JSON.stringify(record))
  window.dispatchEvent(new Event(NETWORK_ONBOARDING_EVENT))
}

/** Save the dialog's result. Keeps the previous seenAt, so the new invites count as unseen. */
export function saveNetworkOnboarding({ optedIn, selectedAccountIds }) {
  const previous = getNetworkOnboarding()
  write({
    optedIn: Boolean(optedIn),
    selectedAccountIds: Array.isArray(selectedAccountIds) ? selectedAccountIds : [],
    completedAt: new Date().toISOString(),
    seenAt: previous?.seenAt ?? null,
  })
}

/** Forget the onboarding result (prototype reset): the task is not done and there are no invites. */
export function resetNetworkOnboarding() {
  storage.removeItem(KEY)
  window.dispatchEvent(new Event(NETWORK_ONBOARDING_EVENT))
}

/** Clear the unseen-invites indicator. No-op when there's nothing unseen. */
export function markNetworkSeen() {
  const record = getNetworkOnboarding()
  if (!hasUnseenInvites(record)) return
  write({ ...record, seenAt: new Date().toISOString() })
}

export const isNetworkOnboardingComplete = record => Boolean(record?.completedAt)

export const invitedAccountIds = record =>
  isNetworkOnboardingComplete(record) && Array.isArray(record.selectedAccountIds) ? record.selectedAccountIds : []

export function hasUnseenInvites(record) {
  if (invitedAccountIds(record).length === 0) return false
  if (!record.seenAt) return true
  return new Date(record.completedAt).getTime() > new Date(record.seenAt).getTime()
}

/** Number of invites added since the Network page was last visited. */
export const unseenInviteCount = record => (hasUnseenInvites(record) ? invitedAccountIds(record).length : 0)

function subscribe(onChange) {
  window.addEventListener(NETWORK_ONBOARDING_EVENT, onChange)
  return () => window.removeEventListener(NETWORK_ONBOARDING_EVENT, onChange)
}

/** The onboarding record, kept in sync across components and browser tabs. */
export function useNetworkOnboarding() {
  return useSyncExternalStore(subscribe, getNetworkOnboarding, () => null)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const formatDate = d => `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`

/**
 * Network list rows for the invited businesses, keyed like app/network/data.ts.
 * Invites have no email or money yet, so those cells render empty.
 */
export function invitedNetworkRows(record) {
  const ids = invitedAccountIds(record)
  if (ids.length === 0) return []
  const invitedOn = new Date(record.completedAt)
  const day = new Date(invitedOn.getFullYear(), invitedOn.getMonth(), invitedOn.getDate())
  const byId = new Map(NETWORK_CANDIDATES.map(c => [c.id, c]))
  return ids.map(id => byId.get(id)).filter(Boolean).map(candidate => ({
    'name': candidate.name,
    'status': 'Invited',
    'configurations': 'Merchant',
    'email': '',
    'country': candidate.country,
    'volume': '',
    'payment-balance': '',
    'total-spend': '',
    'currency': 'USD',
    'created': formatDate(day),
    'created-ts': day.getTime(),
    'id': candidate.id,
    'radar-match': 'No',
  }))
}
