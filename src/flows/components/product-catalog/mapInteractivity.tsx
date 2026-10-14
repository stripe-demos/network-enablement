'use client'

import { createToggleContext } from "@/lib/createToggleContext"

const { Provider: MapInteractivityProvider, useValue } =
  createToggleContext<boolean>("MapInteractivity", false)

function useMapInteractivity() {
  const { value: mapInteractive, setValue: setMapInteractive } = useValue()
  return { mapInteractive, setMapInteractive }
}

export { MapInteractivityProvider, useMapInteractivity }
