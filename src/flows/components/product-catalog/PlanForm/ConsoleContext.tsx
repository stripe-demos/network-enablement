"use client"

import { createContext, useContext, type ReactNode } from "react"

export type ConsoleContextItem = {
  nodeType: string
  nodeName: string
  fieldName: string
}

type ConsoleContextValue = {
  openConsole: (item: ConsoleContextItem) => void
}

const ConsoleContext = createContext<ConsoleContextValue | null>(null)

type ConsoleProviderProps = {
  onOpenConsole: (item: ConsoleContextItem) => void
  children: ReactNode
}

export function ConsoleProvider({ onOpenConsole, children }: ConsoleProviderProps) {
  return (
    <ConsoleContext.Provider value={{ openConsole: onOpenConsole }}>
      {children}
    </ConsoleContext.Provider>
  )
}

export function useConsole() {
  const ctx = useContext(ConsoleContext)
  return ctx?.openConsole ?? null
}

export function SparkleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="group flex h-[16px] w-[16px] items-center justify-center rounded-[4px] transition-colors hover:bg-[#F0EEFF]"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        className="text-[#9CA3B0] transition-colors group-hover:text-[#675DFF]"
      >
        <path
          d="M6 1L6.9 3.6L9.5 4.5L6.9 5.4L6 8L5.1 5.4L2.5 4.5L5.1 3.6L6 1Z"
          fill="currentColor"
        />
        <path
          d="M9.5 7L10 8.5L11.5 9L10 9.5L9.5 11L9 9.5L7.5 9L9 8.5L9.5 7Z"
          fill="currentColor"
          opacity="0.6"
        />
      </svg>
    </button>
  )
}
