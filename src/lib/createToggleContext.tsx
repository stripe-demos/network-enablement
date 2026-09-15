'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

type ToggleContextValue<T> = {
  value: T
  setValue: (next: T) => void
}

type TogglePersistence = boolean | "local" | "session"

function getStorage(persist: TogglePersistence): Storage | null {
  if (typeof window === "undefined" || !persist) return null
  return persist === "session" ? window.sessionStorage : window.localStorage
}

function readStorage<T>(key: string, fallback: T, persist: TogglePersistence): T {
  if (typeof window === "undefined") return fallback
  try {
    const storage = getStorage(persist)
    const stored = storage?.getItem(key)
    if (stored != null) return JSON.parse(stored) as T
  } catch {}
  return fallback
}

export function createToggleContext<T>(displayName: string, defaultValue: T, persist: TogglePersistence = false) {
  const storageKey = `toggle_${displayName}`
  const Ctx = createContext<ToggleContextValue<T> | null>(null)
  Ctx.displayName = displayName

  function Provider({ children, initial, ignorePersisted = false }: { children: ReactNode; initial?: T; ignorePersisted?: boolean }) {
    const [value, setValue] = useState<T>(initial ?? defaultValue)
    useEffect(() => {
      // `ignorePersisted` forces this instance to start from `initial` every mount, ignoring
      // any stored value — e.g. the checkout editor always opens in tree nav regardless of the
      // globally-toggled default. Live toggles still work; they just don't seed the next open.
      if (persist && !ignorePersisted) {
        const stored = readStorage(storageKey, initial ?? defaultValue, persist)
        setValue(stored)
      }
    }, [])
    const setAndPersist = useCallback((next: T) => {
      setValue(next)
      if (persist && typeof window !== "undefined") {
        try { getStorage(persist)?.setItem(storageKey, JSON.stringify(next)) } catch {}
      }
    }, [])
    const ctx = useMemo(() => ({ value, setValue: setAndPersist }), [value, setAndPersist])
    return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>
  }

  function useValue(): ToggleContextValue<T> {
    const ctx = useContext(Ctx)
    if (!ctx) return { value: defaultValue, setValue: () => {} }
    return ctx
  }

  return { Provider, useValue } as const
}
