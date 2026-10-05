'use client'

import { useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { useReducedMotion } from "framer-motion"

import {
  buildAccountApiLlmPrompt,
  buildAccountApiResponse,
  collapseToSectionRoots,
  collectJsonPaths,
  isAccountApiPreviewEmpty,
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
  children,
}: {
  path: string
  isNew: boolean
  children: ReactNode
}) {
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = useState(() => Boolean(reduceMotion) || !isNew)

  useLayoutEffect(() => {
    if (open) return
    const id = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(id)
  }, [open])

  return (
    <div
      data-json-path={path}
      className="grid [overflow-anchor:none] transition-[grid-template-rows] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
    >
      <div className={`min-h-0 overflow-hidden pl-[12px] ${isNew ? "api-json-new" : ""}`}>
        {children}
      </div>
    </div>
  )
}

function JsonNode({
  value,
  path,
  newPaths,
}: {
  value: unknown
  path: string
  newPaths: Set<string>
}) {
  if (isCompact(value)) return <JsonInline value={value} />

  const entries = Object.entries(value as Record<string, unknown>)
  return (
    <>
      <Punct>{"{"}</Punct>
      {entries.map(([key, child], index) => {
        const childPath = path ? `${path}.${key}` : key
        return (
          <ExpandRow key={childPath} path={childPath} isNew={newPaths.has(childPath)}>
            <span className="text-[#8FCBFF]">"{key}"</span>
            <Punct>: </Punct>
            <JsonNode value={child} path={childPath} newPaths={newPaths} />
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
  const seenSerialized = useRef<string | null>(null)
  const addedPaths = useRef<Set<string>>(new Set())
  const copiedTimeout = useRef<number | undefined>(undefined)

  if (seenSerialized.current !== serialized) {
    const next = new Set(collectJsonPaths(JSON.parse(serialized) as Record<string, unknown>))
    addedPaths.current = previousPaths.current
      ? collapseToSectionRoots([...next].filter((path) => !previousPaths.current?.has(path)))
      : new Set()
    previousPaths.current = next
    seenSerialized.current = serialized
  }

  const newPaths = addedPaths.current

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
            <JsonNode value={payload} path="" newPaths={new Set()} />
            <p className="mt-[12px] font-sans text-[12px] leading-[18px] text-[#7D92A8]">
              Choose an existing account or create a new one to start building this response.
            </p>
          </div>
        ) : (
          <JsonNode value={payload} path="" newPaths={newPaths} />
        )}
      </div>
    </div>
  )
}
