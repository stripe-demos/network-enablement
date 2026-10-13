// Network page: the connected-accounts list with the Stripe network onboarding
// dialog on top. The dialog opens on every fresh visit (each mount of this
// route); tab switches inside /network don't remount, so they don't reopen it.
import { useCallback, useState } from 'react'
import { NetworkTab } from '../listPages'
import { dashboardStorage } from '../../lib/storage'
import NetworkOnboarding from './NetworkOnboarding'

const STORAGE_KEY = 'network-onboarding'

export default function NetworkPage() {
  const [open, setOpen] = useState(true)
  const close = useCallback(() => setOpen(false), [])
  const complete = useCallback(({ optedIn, selectedAccountIds }) => {
    dashboardStorage.setItem(STORAGE_KEY, JSON.stringify({ optedIn, selectedAccountIds, completedAt: new Date().toISOString() }))
    setOpen(false)
  }, [])

  return (
    <>
      <NetworkTab />
      <NetworkOnboarding open={open} onClose={close} onComplete={complete} />
    </>
  )
}
