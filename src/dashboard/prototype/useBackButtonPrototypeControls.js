import { dashboardStorageKey } from '../lib/storage';
import { useEffect, useState } from 'react'
import {
  BACK_BUTTON_PROTOTYPE_CONTROLS_CHANNEL,
  BACK_BUTTON_PROTOTYPE_CONTROLS_KEY,
  applyBackButtonPrototypeControls,
  readBackButtonPrototypeControls,
} from './backButtonPrototypeControls'

export function useBackButtonPrototypeControls() {
  const [controls, setControls] = useState(readBackButtonPrototypeControls)

  useEffect(() => {
    let channel

    const apply = (nextControls) => {
      const applied = applyBackButtonPrototypeControls(nextControls)
      setControls(applied)
    }

    apply(readBackButtonPrototypeControls())

    const handleStorage = (event) => {
      if (event.key === dashboardStorageKey(BACK_BUTTON_PROTOTYPE_CONTROLS_KEY)) {
        apply(readBackButtonPrototypeControls())
      }
    }

    window.addEventListener('storage', handleStorage)

    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(BACK_BUTTON_PROTOTYPE_CONTROLS_CHANNEL)
      channel.onmessage = (event) => apply(event.data)
    }

    return () => {
      window.removeEventListener('storage', handleStorage)
      channel?.close()
    }
  }, [])

  return controls
}
