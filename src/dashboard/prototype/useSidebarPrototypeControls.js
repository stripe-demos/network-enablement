import { dashboardStorageKey } from '../lib/storage';
import { useEffect, useState } from 'react'
import {
  SIDEBAR_PROTOTYPE_CONTROLS_CHANNEL,
  SIDEBAR_PROTOTYPE_CONTROLS_KEY,
  applySidebarPrototypeControls,
  readSidebarPrototypeControls,
} from './prototypeControls'

export function useSidebarPrototypeControls() {
  const [controls, setControls] = useState(readSidebarPrototypeControls)

  useEffect(() => {
    let channel

    const apply = (nextControls) => {
      const applied = applySidebarPrototypeControls(nextControls)
      setControls(applied)
    }

    apply(readSidebarPrototypeControls())

    const handleStorage = (event) => {
      if (event.key === dashboardStorageKey(SIDEBAR_PROTOTYPE_CONTROLS_KEY)) {
        apply(readSidebarPrototypeControls())
      }
    }

    window.addEventListener('storage', handleStorage)

    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(SIDEBAR_PROTOTYPE_CONTROLS_CHANNEL)
      channel.onmessage = (event) => apply(event.data)
    }

    return () => {
      window.removeEventListener('storage', handleStorage)
      channel?.close()
    }
  }, [])

  return controls
}
