'use client'

import { useEffect, useRef, useState } from "react"

import { CreationModalShell } from "@/components/creation-workspace/CreationModalShell"
import { getFormTokens } from "@/components/creation-workspace/forms/shared/formTokens"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"

import {
  CONFIGURATION_OPTIONS,
  highlightAccountDescription,
  recommendConfigurationsFromDescription,
  type ClassificationHighlight,
  type ConfigurationKind,
  type UserPath,
} from "./model"
import VoiceGlowViz from "./VoiceGlowViz"
import useSpeechRecognition, { isSpeechRecognitionSupported, startMicrophone, stopMicrophone } from "./useSpeechRecognition"

const DESCRIPTION_LIMIT = 10000

export function DescribeAccountModal({
  isOpen,
  userPath,
  existing,
  selected,
  initialStep = "describe",
  initialRecommended,
  onClose,
  onApply,
}: {
  isOpen: boolean
  userPath?: UserPath
  existing: ConfigurationKind[]
  selected: ConfigurationKind[]
  initialStep?: "describe" | "recommend"
  initialRecommended?: ConfigurationKind[]
  onClose: () => void
  onApply: (next: ConfigurationKind[]) => void
}) {
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recommendAbort = useRef<AbortController | null>(null)
  const highlightAbort = useRef<AbortController | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const spokenBaseRef = useRef("")
  const [description, setDescription] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [step, setStep] = useState<"describe" | "recommend">("describe")
  const [status, setStatus] = useState<"idle" | "thinking" | "ready">("idle")
  const [recommended, setRecommended] = useState<ConfigurationKind[]>([])
  const [picked, setPicked] = useState<ConfigurationKind[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [micStream, setMicStream] = useState<MediaStream | null>(null)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [highlights, setHighlights] = useState<ClassificationHighlight[]>([])
  const [highlightPending, setHighlightPending] = useState(false)
  const voiceRingRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      recommendAbort.current?.abort()
      recommendAbort.current = null
      highlightAbort.current?.abort()
      highlightAbort.current = null
      setDescription("")
      setFiles([])
      setStep("describe")
      setStatus("idle")
      setRecommended([])
      setPicked([])
      setIsRecording(false)
      setMicStream((current) => {
        stopMicrophone(current)
        return null
      })
      setVoiceError(null)
      setHighlights([])
      setHighlightPending(false)
      spokenBaseRef.current = ""
      return
    }
    if (initialStep === "recommend") {
      const next = (initialRecommended ?? []).filter((id) => !existing.includes(id))
      setStep("recommend")
      setRecommended(next)
      setPicked(next)
      setStatus("ready")
    }
  }, [existing, initialRecommended, initialStep, isOpen])

  useEffect(() => {
    if (!isOpen || step !== "describe") return
    if (description.trim().length < 8) {
      setHighlights([])
      setHighlightPending(false)
      return
    }
    setHighlights(highlightAccountDescription(description, userPath))
    setHighlightPending(true)
    highlightAbort.current?.abort()
    const controller = new AbortController()
    highlightAbort.current = controller
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/recommend-configurations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ description, userPath }),
        })
        const payload = response.ok ? await response.json().catch(() => null) : null
        if (controller.signal.aborted) return
        if (Array.isArray(payload?.highlights)) setHighlights(payload.highlights)
      } catch (error) {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) return
      } finally {
        if (!controller.signal.aborted) setHighlightPending(false)
      }
    }, isRecording ? 280 : 480)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [description, userPath, isRecording, isOpen, step])

  useSpeechRecognition(isRecording, {
    onResult: ({ finalText, interimText }) => {
      const spoken = `${finalText} ${interimText}`.replace(/\s+/g, " ").trim()
      const next = [spokenBaseRef.current, spoken].filter(Boolean).join(" ")
      setDescription(next.slice(0, DESCRIPTION_LIMIT))
      setVoiceError(null)
    },
    onError: (error) => {
      if (error.error === "no-speech" || error.error === "aborted") return
      stopMicrophone(micStream)
      setMicStream(null)
      setIsRecording(false)
      if (error.error === "not-allowed" || error.error === "service-not-allowed") {
        setVoiceError("Microphone access was blocked. Allow it in your browser to dictate.")
        return
      }
      if (error.error === "unsupported") {
        setVoiceError("Voice input isn’t supported in this browser. Try Chrome, Edge, or Safari.")
        return
      }
      if (error.error === "network") {
        setVoiceError("Voice input needs a network connection.")
        return
      }
      setVoiceError("Couldn’t capture voice input. Try again, or type instead.")
    },
  })

  const toggleRecording = async () => {
    if (isRecording) {
      stopMicrophone(micStream)
      setMicStream(null)
      setIsRecording(false)
      return
    }
    if (!isSpeechRecognitionSupported()) {
      setVoiceError("Voice input isn’t supported in this browser. Try Chrome, Edge, or Safari.")
      return
    }
    spokenBaseRef.current = description.trim()
    setVoiceError(null)
    try {
      const stream = await startMicrophone()
      setMicStream(stream)
    } catch {
      setVoiceError("Microphone access was blocked. Allow it in your browser to dictate.")
      return
    }
    setIsRecording(true)
  }

  const showSaasWhy = initialStep === "recommend"
    && recommended.includes("customer")
    && recommended.includes("merchant")
  const canContinue = description.trim().length > 0 && status !== "thinking"
  const canApply = step === "recommend" && picked.length > 0

  const continueFromDescription = async () => {
    if (!canContinue) return
    stopMicrophone(micStream)
    setMicStream(null)
    setIsRecording(false)
    setStatus("thinking")
    recommendAbort.current?.abort()
    const controller = new AbortController()
    recommendAbort.current = controller
    try {
      const response = await fetch("/api/recommend-configurations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          description,
          userPath,
          files: files.map((file) => file.name),
        }),
      })
      const payload = response.ok ? await response.json().catch(() => null) : null
      const fromApi = Array.isArray(payload?.configurations) ? payload.configurations as ConfigurationKind[] : null
      const next = (fromApi ?? recommendConfigurationsFromDescription(description, userPath))
        .filter((id) => !existing.includes(id))
      if (controller.signal.aborted) return
      setRecommended(next)
      setPicked(next)
      setStatus("ready")
      setStep("recommend")
    } catch (error) {
      if (controller.signal.aborted) return
      const next = recommendConfigurationsFromDescription(description, userPath)
        .filter((id) => !existing.includes(id))
      setRecommended(next)
      setPicked(next)
      setStatus("ready")
      setStep("recommend")
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.warn("[describe-account] recommendation request failed", error)
      }
    }
  }

  const apply = () => {
    if (step !== "recommend" || picked.length === 0) return
    onApply(Array.from(new Set([...selected, ...picked])))
    onClose()
  }

  const primary = step === "recommend"
    ? {
        label: "Apply",
        disabled: !canApply,
        onClick: apply,
      }
    : {
        label: status === "thinking" ? "Analyzing" : "Continue",
        disabled: !canContinue,
        onClick: continueFromDescription,
      }

  return (
    <CreationModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={step === "recommend" ? "Recommended configurations" : "Tell us about the account"}
      modalWidth="w-[560px]"
      headerActions={
        <button
          type="button"
          aria-label="Close"
          className={`${tokens.closeButtonClass} shrink-0 self-start`}
          onClick={onClose}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      }
      footer={
        <div className={`flex items-center gap-[12px] border-t border-[#ECF1F6] bg-white px-[20px] py-[12px] ${step === "recommend" ? "justify-between" : "justify-end"}`}>
          {step === "recommend" ? (
            <p className="min-w-0 text-[13px] font-[400] leading-[18px] tracking-[-0.08px] text-[#596171]">
              Still unsure?{" "}
              <button
                type="button"
                className="font-[500] text-[#533AFD] transition-colors hover:text-[#4730E0]"
                onClick={() => {
                  setStep("describe")
                  setStatus("idle")
                }}
              >
                Describe this account to us.
              </button>
            </p>
          ) : null}
          <div className="flex shrink-0 items-center gap-[8px]">
            {step === "recommend" && initialStep !== "recommend" ? (
              <button
                type="button"
                className={tokens.secondaryButtonClass}
                onClick={() => {
                  setStep("describe")
                  setStatus("idle")
                }}
              >
                Back
              </button>
            ) : null}
            <button
              key={step}
              type="button"
              disabled={primary.disabled}
              className={primary.disabled ? `${tokens.primaryButtonClass} cursor-not-allowed opacity-45` : tokens.primaryButtonClass}
              onClick={primary.onClick}
            >
              {status === "thinking" && step === "describe" ? <ButtonSpinner /> : null}
              {primary.label}
            </button>
          </div>
        </div>
      }
    >
      <div className="min-h-[240px] overflow-y-auto px-[20px] py-[16px]">
        {step === "describe" ? (
        <div>
          <p className="mb-[6px] text-[13px] font-[400] leading-[20px] tracking-[-0.08px] text-[#353A44]">
            Describe how this account uses your platform and how money moves between you.
          </p>
          <div className={`relative isolate overflow-hidden rounded-[12px] bg-white ${isRecording ? "border border-transparent" : "border border-[#E6EAF0]"}`}>
            {isRecording ? (
              <>
                <div
                  ref={voiceRingRef}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-[1px] z-[1] rounded-[11px] p-px origin-center"
                  style={{
                    background: "conic-gradient(from var(--voice-angle, 0deg), #FF80B5, #FF8A3D, #FFC24B, #B06AFF, #FF80B5)",
                    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    opacity: 0.38,
                  }}
                />
                <VoiceGlowViz
                  active={isRecording}
                  origin="center"
                  stream={micStream}
                  ringRef={voiceRingRef}
                  className="pointer-events-none absolute inset-0 z-0"
                />
              </>
            ) : null}
            <div className="relative z-[2]">
              {description ? (
                <div
                  ref={overlayRef}
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words px-[12px] pb-[6px] pt-[12px] text-[13px] font-[400] leading-[20px] tracking-[-0.08px] text-[#353A44] ${highlightPending ? "t-jev-mark-pending" : ""}`}
                >
                  <HighlightedDescription text={description} highlights={highlights} />
                </div>
              ) : null}
              <textarea
                autoFocus
                maxLength={DESCRIPTION_LIMIT}
                className={`relative min-h-[160px] w-full resize-none border-0 bg-transparent px-[12px] pb-[6px] pt-[12px] text-[13px] font-[400] leading-[20px] tracking-[-0.08px] outline-none ${
                  description
                    ? "text-transparent caret-[#353A44] selection:bg-[#533AFD]/20"
                    : "text-[#353A44] placeholder:text-[#8B95A3]"
                }`}
                placeholder={userPath === "direct"
                  ? "Create an account for a contractor who invoices us as a customer and receives payouts."
                  : "This account sells gym memberships through our platform and gets paid directly by their customers. We charge them a fee for using our platform."}
                value={description}
                readOnly={isRecording}
                aria-live={isRecording ? "polite" : undefined}
                onScroll={(event) => {
                  if (overlayRef.current) overlayRef.current.scrollTop = event.currentTarget.scrollTop
                }}
                onChange={(event) => setDescription(event.target.value.slice(0, DESCRIPTION_LIMIT))}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.preventDefault()
                    continueFromDescription()
                  }
                }}
              />
            </div>
            <div className="relative z-[2] flex flex-wrap items-center gap-[8px] px-[12px] pb-[10px] pr-[72px]">
              <button
                type="button"
                aria-label={isRecording ? "Stop recording" : "Dictate"}
                aria-pressed={isRecording}
                className={`flex h-[24px] w-[24px] items-center justify-center rounded-[6px] transition-colors ${
                  isRecording
                    ? "bg-[#675DFF] text-white hover:bg-[#5A50EE]"
                    : "bg-[#F1F3F5] text-[#3C4257] hover:bg-[#E8ECF0]"
                }`}
                onClick={toggleRecording}
              >
                {isRecording ? <StopIcon /> : <MicIcon />}
              </button>
              <button
                type="button"
                className="flex h-[28px] items-center gap-[6px] rounded-[6px] bg-[#F1F3F5] px-[8px] text-[13px] font-[500] leading-[18px] text-[#3C4257] transition-colors hover:bg-[#E8ECF0]"
                onClick={() => fileInputRef.current?.click()}
              >
                <PlusIcon />
                Add files or photos
              </button>
              {files.map((file) => (
                <span key={`${file.name}-${file.size}`} className="flex h-[28px] max-w-[180px] items-center gap-[6px] rounded-[6px] bg-[#F1F3F5] px-[8px] text-[13px] leading-[18px] text-[#3C4257]">
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    className="text-[#6C7688] hover:text-[#1A2C44]"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => setFiles((current) => current.filter((item) => item !== file))}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.txt,.doc,.docx"
                multiple
                className="hidden"
                onChange={(event) => {
                  const next = Array.from(event.target.files ?? [])
                  if (next.length > 0) setFiles((current) => [...current, ...next])
                  event.target.value = ""
                }}
              />
            </div>
            <span className="pointer-events-none absolute bottom-[8px] right-[12px] z-[2] text-[13px] leading-[18px] text-[#6C7688]">
              {description.length.toLocaleString()}/{DESCRIPTION_LIMIT.toLocaleString()}
            </span>
          </div>
          {highlights.length > 0 || (isRecording && description.trim().length >= 8) ? (
            <HighlightLegend highlights={highlights} listening={isRecording && highlightPending} />
          ) : null}
          {voiceError ? (
            <p className="mt-[8px] text-[13px] leading-[18px] text-[#C45500]">{voiceError}</p>
          ) : null}
        </div>
        ) : (
          <RecommendedResult ids={recommended} saasWhy={showSaasWhy} />
        )}
      </div>
    </CreationModalShell>
  )
}

const RESULT_HEADING = "text-[14px] font-[500] leading-[20px] tracking-[-0.08px] text-[#1A2C44]"
const RESULT_BODY = "mt-[6px] text-[13px] font-[400] leading-[20px] tracking-[-0.08px] text-[#353A44]"
const RESULT_STACK = "flex flex-col gap-[16px]"

function BoldName({ children }: { children: string }) {
  return <span className="font-[600]">{children}</span>
}

function recommendedTitles(ids: ConfigurationKind[]) {
  return ids.flatMap((id) => {
    const option = CONFIGURATION_OPTIONS.find((candidate) => candidate.id === id)
    return option ? [option.title] : []
  })
}

function RecommendedCombination({ ids }: { ids: ConfigurationKind[] }) {
  const titles = recommendedTitles(ids)
  if (titles.length === 0) return <>No new configurations to add for this account.</>
  if (titles.length === 1) return <>The <BoldName>{titles[0]}</BoldName> configuration.</>
  if (titles.length === 2) {
    return <>A combination of <BoldName>{titles[0]}</BoldName> and <BoldName>{titles[1]}</BoldName>.</>
  }
  return (
    <>
      A combination of{" "}
      {titles.slice(0, -1).map((title, index) => (
        <span key={title}>
          {index > 0 ? ", " : null}
          <BoldName>{title}</BoldName>
        </span>
      ))}
      , and <BoldName>{titles[titles.length - 1]!}</BoldName>.
    </>
  )
}

const WHY_CLAUSE: Record<ConfigurationKind, string> = {
  customer: "lets them make one-time or recurring payments to you",
  merchant: "lets this account accept payments from their own customers",
  recipient: "lets them receive transfers or payouts from you",
}

function RecommendedWhy({ ids, saasWhy }: { ids: ConfigurationKind[]; saasWhy: boolean }) {
  if (saasWhy) {
    return (
      <>
        You run a platform for yoga studios. The <BoldName>Merchant</BoldName> configuration lets a studio charge their clients directly. The <BoldName>Customer</BoldName> configuration lets a studio use the money they earned to pay your subscription fees.
      </>
    )
  }
  const clauses = ids.filter((id) => Boolean(WHY_CLAUSE[id]))
  if (clauses.length === 0) return <>We don’t have a new configuration to add from that description.</>
  return (
    <>
      {clauses.map((id, index) => {
        const option = CONFIGURATION_OPTIONS.find((candidate) => candidate.id === id)
        if (!option) return null
        return (
          <span key={id}>
            {index === 0 ? "The " : " and the "}
            <BoldName>{option.title}</BoldName>
            {" "}configuration {WHY_CLAUSE[id]}
          </span>
        )
      })}
      .
    </>
  )
}

function RecommendedResult({ ids, saasWhy }: { ids: ConfigurationKind[]; saasWhy: boolean }) {
  if (ids.length === 0) {
    return (
      <p className="text-[13px] font-[400] leading-[20px] tracking-[-0.08px] text-[#353A44]">
        No new configurations to add for this account.
      </p>
    )
  }
  return (
    <div className={RESULT_STACK}>
      <div>
        <p className={RESULT_HEADING}>What we recommend</p>
        <p className={RESULT_BODY}><RecommendedCombination ids={ids} /></p>
      </div>
      <div>
        <p className={RESULT_HEADING}>Why?</p>
        <p className={RESULT_BODY}><RecommendedWhy ids={ids} saasWhy={saasWhy} /></p>
      </div>
    </div>
  )
}

const HIGHLIGHT_MARK: Record<ConfigurationKind, string> = {
  customer: "t-jev-mark t-jev-mark-customer",
  recipient: "t-jev-mark t-jev-mark-recipient",
  merchant: "t-jev-mark t-jev-mark-merchant",
}

const HIGHLIGHT_DOT: Record<ConfigurationKind, string> = {
  customer: "bg-[#2E7CF6]",
  recipient: "bg-[#533AFD]",
  merchant: "bg-[#039C7D]",
}

function HighlightedDescription({
  text,
  highlights,
}: {
  text: string
  highlights: ClassificationHighlight[]
}) {
  const parts: Array<{ key: string; value: string; kind?: ConfigurationKind }> = []
  let cursor = 0
  for (const highlight of highlights) {
    if (highlight.end <= cursor || highlight.start >= text.length) continue
    const start = Math.max(highlight.start, cursor)
    if (start > cursor) parts.push({ key: `t${cursor}`, value: text.slice(cursor, start) })
    parts.push({ key: `h${start}`, value: text.slice(start, highlight.end), kind: highlight.kind })
    cursor = highlight.end
  }
  if (cursor < text.length) parts.push({ key: `t${cursor}`, value: text.slice(cursor) })
  return (
    <>
      {parts.map((part) => part.kind
        ? <mark key={part.key} className={HIGHLIGHT_MARK[part.kind]}>{part.value}</mark>
        : <span key={part.key}>{part.value}</span>)}
    </>
  )
}

function HighlightLegend({
  highlights,
  listening,
}: {
  highlights: ClassificationHighlight[]
  listening: boolean
}) {
  const kinds = CONFIGURATION_OPTIONS
    .map((option) => option.id)
    .filter((id) => highlights.some((highlight) => highlight.kind === id))
  return (
    <div className="mt-[8px] flex flex-wrap items-center gap-x-[10px] gap-y-[4px]">
      {kinds.map((id) => {
        const option = CONFIGURATION_OPTIONS.find((candidate) => candidate.id === id)
        if (!option) return null
        return (
          <span key={id} className="inline-flex items-center gap-[6px] text-[13px] leading-[18px] text-[#596171]">
            <span className={`h-[7px] w-[7px] rounded-full ${HIGHLIGHT_DOT[id]}`} />
            {option.title}
          </span>
        )
      })}
      {listening ? (
        <span className="text-[13px] leading-[18px] text-[#8B95A3]">
          {kinds.length > 0 ? "Updating from Jev…" : "Listening for account shape…"}
        </span>
      ) : null}
    </div>
  )
}

function ButtonSpinner() {
  return (
    <svg className="mr-[6px] animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" />
      <path d="M10.5 6a4.5 4.5 0 0 0-4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="5" y="1.5" width="4" height="7" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3.2 7.2a3.8 3.8 0 0 0 7.6 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M7 11v1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 11C8.76142 11 11 8.76142 11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 4.5H4.5V7.5H7.5V4.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
