// The one mounted Stripe network onboarding dialog. Open it with
// openNetworkOnboarding() (Enablement's checklist, the prototype control panel).
// Finishing the dialog saves the result for Enablement, Network and the sidebar.
import { useCallback, useEffect, useState } from 'react'
import NetworkOnboarding from './NetworkOnboarding'
import { saveNetworkOnboarding } from './networkInvites'
import { CLOSE_NETWORK_ONBOARDING_EVENT, OPEN_NETWORK_ONBOARDING_EVENT } from './openNetworkOnboarding'

const CLOSED = { open: false, session: 0, initialStep: undefined, keepFocus: false, jump: { step: undefined, nonce: 0, keepFocus: false } }

export default function NetworkOnboardingHost() {
  // Opening a closed dialog bumps session, so it starts fresh. Opening an
  // already open one bumps jump.nonce instead: the dialog moves to jump.step and
  // keeps its state (selections, consent).
  const [request, setRequest] = useState(CLOSED)

  useEffect(() => {
    const onOpen = event => {
      const { initialStep, keepFocus = false } = event.detail ?? {}
      setRequest(prev => (prev.open
        ? { ...prev, jump: { step: initialStep, nonce: prev.jump.nonce + 1, keepFocus } }
        : { ...CLOSED, open: true, session: prev.session + 1, initialStep, keepFocus }))
    }
    const onClose = () => setRequest(prev => (prev.open ? { ...prev, open: false } : prev))
    window.addEventListener(OPEN_NETWORK_ONBOARDING_EVENT, onOpen)
    window.addEventListener(CLOSE_NETWORK_ONBOARDING_EVENT, onClose)
    return () => {
      window.removeEventListener(OPEN_NETWORK_ONBOARDING_EVENT, onOpen)
      window.removeEventListener(CLOSE_NETWORK_ONBOARDING_EVENT, onClose)
    }
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
      keepFocus={request.keepFocus}
      jump={request.jump}
    />
  )
}
