// Campaign rows for this page load: deletes and duplicates survive tab
// switches and reset on reload.
import { useSyncExternalStore } from 'react'
import { CAMPAIGNS } from './campaignsData'

let campaigns = CAMPAIGNS
const listeners = new Set()

const setCampaigns = (next) => {
  campaigns = next
  listeners.forEach((fn) => fn())
}

const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const useCampaigns = () => useSyncExternalStore(subscribe, () => campaigns)

export function deleteCampaign(id) {
  setCampaigns(campaigns.filter((c) => c.id !== id))
}

// The copy is a fresh draft placed under the original.
export function duplicateCampaign(id) {
  const index = campaigns.findIndex((c) => c.id === id)
  if (index === -1) return
  const { name, productType, start, end, timezone } = campaigns[index]
  const copy = { id: `${id}_copy_${Date.now()}`, name: `${name} (copy)`, status: 'Draft', productType, start, end, timezone }
  setCampaigns([...campaigns.slice(0, index + 1), copy, ...campaigns.slice(index + 1)])
}
