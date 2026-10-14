'use client'

import { createToggleContext } from "@/lib/createToggleContext"

export type ConsoleSlideDirection = "right" | "left" | "left-header" | "overlay"

const { Provider: ConsoleSlideDirectionProvider, useValue } =
  createToggleContext<ConsoleSlideDirection>("ConsoleSlideDirection", "right", true)

function useConsoleSlideDirection() {
  const { value: consoleSlideDirection, setValue: setConsoleSlideDirection } = useValue()
  return { consoleSlideDirection, setConsoleSlideDirection }
}

export { ConsoleSlideDirectionProvider, useConsoleSlideDirection }
