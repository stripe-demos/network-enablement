'use client'

import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { useReducedMotion } from "framer-motion"

import {
  buildAccountApiLlmPrompt,
  buildAccountApiResponse,
  collapseToSectionRoots,
  collectJsonPaths,
  isAccountApiPreviewEmpty,
  mergeDisplayPayload,
  type AccountApiPreviewInput,
} from "./accountApiResponse"

function isPrimitive(value: unknown) {
  return value === null || typeof value !== "object"
}

function isCompact(value: unknown) {
  if (isPrimitive(value)) return true
  if (Array.isArray(value)) return value.every(isPrimitive)
  const entries = Object.entries(value as Record<string, unknown>)
  return entries.length <= 4 && entries.every(([, child]) => isPrimitive(child))
}

function Punct({ children }: { children: string }) {
  return <span className="text-[#7D92A8]">{children}</span>
}

function JsonInline({ value }: { value: unknown }) {
  if (typeof value === "string") return <span className="text-[#7EE0A8]">"{value}"</span>
  if (typeof value === "number" || typeof value === "boolean") {
    return <span className="text-[#F6C177]">{String(value)}</span>
  }
  if (value === null) return <span className="text-[#F6C177]">null</span>
  if (Array.isArray(value)) {
    return (
      <>
        <Punct>[</Punct>
        {value.map((item, index) => (
          <span key={index}>
            {index > 0 ? <Punct>, </Punct> : null}
            <JsonInline value={item} />
          </span>
        ))}
        <Punct>]</Punct>
      </>
    )
  }
  const entries = Object.entries(value as Record<string, unknown>)
  return (
    <>
      <Punct>{"{"}</Punct>
      {entries.map(([key, child], index) => (
        <span key={key}>
          {index > 0 ? <Punct>, </Punct> : null}
          <span className="text-[#8FCBFF]">"{key}"</span>
          <Punct>: </Punct>
          <JsonInline value={child} />
        </span>
      ))}
      <Punct>{"}"}</Punct>
    </>
  )
}

function ExpandRow({
  path,
  isNew,
  leaving = false,
  onLeft,
  children,
}: {
  path: string
  isNew: boolean
  leaving?: boolean
  onLeft?: (path: string) => void
  children: ReactNode
}) {
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = useState(() => Boolean(reduceMotion) || !isNew || leaving)

  useLayoutEffect(() => {
    if (leaving) {
      if (reduceMotion) {
        onLeft?.(path)
        return
      }
      const id = requestAnimationFrame(() => setOpen(false))
      const fallback = window.setTimeout(() => onLeft?.(path), 420)
      return () => {
        cancelAnimationFrame(id)
        window.clearTimeout(fallback)
      }
    }
    if (open) return
    const id = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(id)
  }, [leaving, open, onLeft, path, reduceMotion])

  return (
    <div
      data-json-path={path}
      className="grid [overflow-anchor:none] transition-[grid-template-rows] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      onTransitionEnd={(event) => {
        if (event.target !== event.currentTarget) return
        if (event.propertyName !== "grid-template-rows") return
        if (leaving && !open) onLeft?.(path)
      }}
    >
      <div className={`min-h-0 overflow-hidden pl-[12px] ${isNew && !leaving ? "api-json-new" : ""}`}>
        {children}
      </div>
    </div>
  )
}

function JsonNode({
  value,
  path,
  newPaths,
  leavingPaths = new Set(),
  onLeft,
}: {
  value: unknown
  path: string
  newPaths: Set<string>
  leavingPaths?: Set<string>
  onLeft?: (path: string) => void
}) {
  if (isCompact(value)) return <JsonInline value={value} />

  const entries = Object.entries(value as Record<string, unknown>)
  return (
    <>
      <Punct>{"{"}</Punct>
      {entries.map(([key, child], index) => {
        const childPath = path ? `${path}.${key}` : key
        return (
          <ExpandRow
            key={childPath}
            path={childPath}
            isNew={newPaths.has(childPath)}
            leaving={leavingPaths.has(childPath)}
            onLeft={onLeft}
          >
            <span className="text-[#8FCBFF]">"{key}"</span>
            <Punct>: </Punct>
            <JsonNode value={child} path={childPath} newPaths={newPaths} leavingPaths={leavingPaths} onLeft={onLeft} />
            {index < entries.length - 1 ? <Punct>,</Punct> : null}
          </ExpandRow>
        )
      })}
      <Punct>{"}"}</Punct>
    </>
  )
}

export function AccountApiPreview({
  embedded,
  ...input
}: AccountApiPreviewInput & { embedded?: boolean }) {
  const payload = buildAccountApiResponse(input)
  const isEmpty = isAccountApiPreviewEmpty(input)
  const serialized = JSON.stringify(payload)
  const [copied, setCopied] = useState(false)
  const previousPaths = useRef<Set<string> | null>(null)
  const addedPaths = useRef<Set<string>>(new Set())
  const realPayloadRef = useRef(payload)
  const copiedTimeout = useRef<number | undefined>(undefined)
  const [view, setView] = useState(() => ({
    serialized,
    display: payload,
    leaving: new Set<string>(),
  }))

  if (serialized !== view.serialized) {
    const next = new Set(collectJsonPaths(payload))
    addedPaths.current = previousPaths.current
      ? collapseToSectionRoots([...next].filter((path) => !previousPaths.current?.has(path)))
      : new Set()
    const newlyRemoved = previousPaths.current
      ? collapseToSectionRoots([...previousPaths.current].filter((path) => !next.has(path)))
      : new Set()
    const leaving = new Set(
      [...view.leaving, ...newlyRemoved].filter((path) => !next.has(path)),
    )
    previousPaths.current = next
    realPayloadRef.current = payload
    setView({
      serialized,
      leaving,
      display: leaving.size > 0
        ? mergeDisplayPayload(payload, view.display, "", leaving) as Record<string, unknown>
        : payload,
    })
  }

  const newPaths = addedPaths.current
  const handleLeft = useCallback((path: string) => {
    setView((current) => {
      if (!current.leaving.has(path)) return current
      const leaving = new Set(current.leaving)
      leaving.delete(path)
      const latest = realPayloadRef.current
      return {
        serialized: JSON.stringify(latest),
        leaving,
        display: leaving.size > 0
          ? mergeDisplayPayload(latest, current.display, "", leaving) as Record<string, unknown>
          : latest,
      }
    })
  }, [])

  async function copyForLlm() {
    try {
      await navigator.clipboard.writeText(buildAccountApiLlmPrompt(input, payload))
      setCopied(true)
      window.clearTimeout(copiedTimeout.current)
      copiedTimeout.current = window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className={embedded
      ? "flex w-full flex-col"
      : "flex w-full flex-col overflow-hidden rounded-[14px] border border-[#16324F] bg-[#0A2540] shadow-[0_10px_24px_rgba(10,37,64,0.18)]"}
    >
      <div className="flex h-[40px] shrink-0 items-center justify-between gap-[12px] border-b border-white/10 px-[14px]">
        <p className="truncate font-mono text-[11px] font-[600] leading-[16px] text-[#C5D4E3]">
          v2.core.account <span className="font-[500] text-[#7D92A8]">response</span>
        </p>
        {isEmpty ? null : (
          <button
            type="button"
            className="shrink-0 rounded-[6px] px-[8px] py-[4px] text-[11px] font-[600] leading-[16px] text-[#A3B8CD] transition-colors hover:bg-white/5 hover:text-white"
            onClick={copyForLlm}
          >
            {copied ? "Copied" : "Copy for LLM"}
          </button>
        )}
      </div>
      <div className="max-h-[min(520px,calc(100vh-220px))] overflow-auto px-[14px] py-[12px] font-mono text-[11px] leading-[18px] text-[#D7E2EC] [overflow-anchor:none]">
        {isEmpty ? (
          <div>
            <JsonNode value={payload} path="" newPaths={new Set()} leavingPaths={new Set()} />
            <p className="mt-[12px] font-sans text-[12px] leading-[18px] text-[#7D92A8]">
              Choose an existing account or create a new one to start building this response.
            </p>
          </div>
        ) : (
          <JsonNode
            value={view.display}
            path=""
            newPaths={newPaths}
            leavingPaths={view.leaving}
            onLeft={handleLeft}
          />
        )}
      </div>
    </div>
  )
}
