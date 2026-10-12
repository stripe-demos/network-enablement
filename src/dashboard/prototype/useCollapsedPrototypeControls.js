import { dashboardStorageKey } from '../lib/storage';
import { useEffect, useState } from 'react'
import {
  COLLAPSED_PROTOTYPE_CONTROLS_CHANNEL,
  COLLAPSED_PROTOTYPE_CONTROLS_KEY,
  applyCollapsedPrototypeControls,
  readCollapsedPrototypeControls,
} from './collapsedPrototypeControls'

export function useCollapsedPrototypeControls() {
  const [controls, setControls] = useState(readCollapsedPrototypeControls)

  useEffect(() => {
    let channel

    const apply = (nextControls) => {
      const applied = applyCollapsedPrototypeControls(nextControls)
      setControls(applied)
    }

    apply(readCollapsedPrototypeControls())

    const handleStorage = (event) => {
      if (event.key === dashboardStorageKey(COLLAPSED_PROTOTYPE_CONTROLS_KEY)) {
        apply(readCollapsedPrototypeControls())
      }
    }

    window.addEventListener('storage', handleStorage)

    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(COLLAPSED_PROTOTYPE_CONTROLS_CHANNEL)
      channel.onmessage = (event) => apply(event.data)
    }

    return () => {
      window.removeEventListener('storage', handleStorage)
      channel?.close()
    }
  }, [])

  return controls
}
