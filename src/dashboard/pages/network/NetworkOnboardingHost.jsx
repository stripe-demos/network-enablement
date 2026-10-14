// The one mounted Stripe network onboarding dialog. Open it with
// openNetworkOnboarding() (Enablement's checklist, the prototype control panel).
// Finishing the dialog saves the result for Enablement, Network and the sidebar.
import { useCallback, useEffect, useState } from 'react'
import NetworkOnboarding from './NetworkOnboarding'
import { saveNetworkOnboarding } from './networkInvites'
import { OPEN_NETWORK_ONBOARDING_EVENT } from './openNetworkOnboarding'

export default function NetworkOnboardingHost() {
  // session bumps on every open so a reopen (e.g. on another step) starts fresh.
  const [request, setRequest] = useState({ open: false, session: 0, initialStep: undefined })

  useEffect(() => {
    const onOpen = event => {
      setRequest(prev => ({ open: true, session: prev.session + 1, initialStep: event.detail?.initialStep }))
    }
    window.addEventListener(OPEN_NETWORK_ONBOARDING_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_NETWORK_ONBOARDING_EVENT, onOpen)
  }, [])

  const close = useCallback(() => setRequest(prev => ({ ...prev, open: false })), [])
  const complete = useCallback(({ optedIn, selectedAccountIds }) => {
    saveNetworkOnboarding({ optedIn, selectedAccountIds })
    setRequest(prev => ({ ...prev, open: false }))
  }, [])

  return (
    <NetworkOnboarding
      key={request.session}
      open={request.open}
      onClose={close}
      onComplete={complete}
      initialStep={request.initialStep}
    />
  )
}
