import { dashboardStorageKey } from '../lib/storage';
import { useEffect, useState } from 'react'
import {
  SEARCH_PROTOTYPE_CONTROLS_CHANNEL,
  SEARCH_PROTOTYPE_CONTROLS_KEY,
  applySearchPrototypeControls,
  readSearchPrototypeControls,
} from './searchPrototypeControls'

export function useSearchPrototypeControls() {
  const [controls, setControls] = useState(readSearchPrototypeControls)

  useEffect(() => {
    let channel

    const apply = (nextControls) => {
      const applied = applySearchPrototypeControls(nextControls)
      setControls(applied)
    }

    apply(readSearchPrototypeControls())

    const handleStorage = (event) => {
      if (event.key === dashboardStorageKey(SEARCH_PROTOTYPE_CONTROLS_KEY)) {
        apply(readSearchPrototypeControls())
      }
    }

    window.addEventListener('storage', handleStorage)

    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(SEARCH_PROTOTYPE_CONTROLS_CHANNEL)
      channel.onmessage = (event) => apply(event.data)
    }

    return () => {
      window.removeEventListener('storage', handleStorage)
      channel?.close()
    }
  }, [])

  return controls
}
