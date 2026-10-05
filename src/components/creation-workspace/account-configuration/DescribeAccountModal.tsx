'use client'

import { useEffect, useRef, useState } from "react"

import { CreationModalShell } from "@/components/creation-workspace/CreationModalShell"
import { Checkbox } from "@/components/creation-workspace/forms/shared/Checkbox"
import { getFormTokens } from "@/components/creation-workspace/forms/shared/formTokens"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"

import {
  getConfigurationOptions,
  recommendConfigurationsFromDescription,
  type ConfigurationKind,
  type UserPath,
} from "./model"
import VoiceGlowViz from "./VoiceGlowViz"
import useSpeechRecognition, { isSpeechRecognitionSupported, unlockMicrophone } from "./useSpeechRecognition"

const DESCRIPTION_LIMIT = 10000

export function DescribeAccountModal({
  isOpen,
  userPath,
  existing,
  selected,
  onClose,
  onApply,
}: {
  isOpen: boolean
  userPath?: UserPath
  existing: ConfigurationKind[]
  selected: ConfigurationKind[]
  onClose: () => void
  onApply: (next: ConfigurationKind[]) => void
}) {
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const thinkTimer = useRef<number | null>(null)
  const spokenBaseRef = useRef("")
  const [description, setDescription] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [step, setStep] = useState<"describe" | "recommend">("describe")
  const [status, setStatus] = useState<"idle" | "thinking" | "ready">("idle")
  const [recommended, setRecommended] = useState<ConfigurationKind[]>([])
  const [picked, setPicked] = useState<ConfigurationKind[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      if (thinkTimer.current) window.clearTimeout(thinkTimer.current)
      setDescription("")
      setFiles([])
      setStep("describe")
      setStatus("idle")
      setRecommended([])
      setPicked([])
      setIsRecording(false)
      setVoiceError(null)
      spokenBaseRef.current = ""
    }
  }, [isOpen])

  useSpeechRecognition(isRecording, {
    onResult: ({ finalText, interimText }) => {
      const spoken = `${finalText} ${interimText}`.replace(/\s+/g, " ").trim()
      const next = [spokenBaseRef.current, spoken].filter(Boolean).join(" ")
      setDescription(next.slice(0, DESCRIPTION_LIMIT))
      setVoiceError(null)
    },
    onError: (error) => {
      if (error.error === "no-speech" || error.error === "aborted") return
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
      await unlockMicrophone()
    } catch {
      setVoiceError("Microphone access was blocked. Allow it in your browser to dictate.")
      return
    }
    setIsRecording(true)
  }

  const options = getConfigurationOptions(userPath).filter((option) => recommended.includes(option.id))
  const canContinue = description.trim().length > 0 && status !== "thinking"
  const canApply = step === "recommend" && picked.length > 0

  const toggle = (id: ConfigurationKind) => {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  const continueFromDescription = () => {
    if (!canContinue) return
    setStatus("thinking")
    if (thinkTimer.current) window.clearTimeout(thinkTimer.current)
    thinkTimer.current = window.setTimeout(() => {
      const next = recommendConfigurationsFromDescription(description, userPath)
        .filter((id) => !existing.includes(id))
      setRecommended(next)
      setPicked(next)
      setStatus("ready")
      setStep("recommend")
    }, 350)
  }

  const apply = () => {
    if (!canApply) return
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
        label: status === "thinking" ? "Finding…" : "Continue",
        disabled: !canContinue,
        onClick: continueFromDescription,
      }

  return (
    <CreationModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={step === "recommend" ? "Recommended configurations" : "Tell us about this account"}
      subtitle={step === "recommend"
        ? "Select what this account should be able to do, then apply them to the form."
        : "Describe what they do, then continue to see recommended configurations."}
      modalWidth="w-[560px]"
      footer={
        <div className="flex items-center justify-end gap-[8px] border-t border-[#ECF1F6] bg-white px-[20px] py-[12px]">
          <button
            type="button"
            className={tokens.secondaryButtonClass}
            onClick={step === "recommend"
              ? () => {
                  setStep("describe")
                  setStatus("idle")
                }
              : onClose}
          >
            {step === "recommend" ? "Back" : "Close"}
          </button>
          <button
            type="button"
            disabled={primary.disabled}
            className={primary.disabled ? `${tokens.primaryButtonClass} cursor-not-allowed opacity-45` : tokens.primaryButtonClass}
            onClick={primary.onClick}
          >
            {primary.label}
          </button>
        </div>
      }
    >
      <div className="flex min-h-0 flex-col gap-[16px] overflow-y-auto px-[20px] py-[16px]">
        {step === "describe" ? (
        <div>
          <div className={`relative isolate overflow-hidden rounded-[12px] bg-white ${isRecording ? "border border-transparent" : "border border-[#E6EAF0]"}`}>
            {isRecording ? (
              <>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-[1] rounded-[12px] p-px opacity-90 animate-[voiceBorderSpin_8s_linear_infinite]"
                  style={{
                    background: "conic-gradient(from var(--voice-angle, 0deg), #FF80B5, #FF8A3D, #FFC24B, #B06AFF, #FF80B5)",
                    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                  }}
                />
                <VoiceGlowViz
                  active={isRecording}
                  origin="center"
                  capture={false}
                  className="pointer-events-none absolute inset-0 z-0"
                />
              </>
            ) : null}
            <textarea
              autoFocus
              maxLength={DESCRIPTION_LIMIT}
              className="relative z-[2] min-h-[132px] w-full resize-none border-0 bg-transparent px-[12px] pb-[6px] pt-[12px] text-[12px] font-[400] leading-[16px] tracking-[-0.024px] text-[#353A44] outline-none placeholder:text-[#8B95A3]"
              placeholder={userPath === "direct"
                ? "Create an account for a contractor who invoices us as a customer and receives payouts."
                : "Create an account for a seller who accepts customer payments, invoices us, and receives payouts."}
              value={description}
              readOnly={isRecording}
              aria-live={isRecording ? "polite" : undefined}
              onChange={(event) => setDescription(event.target.value.slice(0, DESCRIPTION_LIMIT))}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault()
                  continueFromDescription()
                }
              }}
            />
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
                className="flex h-[24px] items-center gap-[5px] rounded-[6px] bg-[#F1F3F5] px-[8px] text-[11px] font-[500] leading-[16px] text-[#3C4257] transition-colors hover:bg-[#E8ECF0]"
                onClick={() => fileInputRef.current?.click()}
              >
                <PlusIcon />
                Add files or photos
              </button>
              {files.map((file) => (
                <span key={`${file.name}-${file.size}`} className="flex h-[24px] max-w-[180px] items-center gap-[5px] rounded-[6px] bg-[#F1F3F5] px-[8px] text-[11px] leading-[16px] text-[#3C4257]">
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
            <span className="pointer-events-none absolute bottom-[8px] right-[12px] z-[2] text-[11px] leading-[16px] text-[#6C7688]">
              {description.length.toLocaleString()}/{DESCRIPTION_LIMIT.toLocaleString()}
            </span>
          </div>
          {isRecording && !voiceError ? (
            <p className="mt-[8px] text-[11px] leading-[16px] text-[#6C7688]">Listening… speak to describe this account.</p>
          ) : null}
          {voiceError ? (
            <p className="mt-[8px] text-[11px] leading-[16px] text-[#C45500]">{voiceError}</p>
          ) : null}
        </div>
        ) : options.length > 0 ? (
          <div className="flex flex-col gap-[8px]">
            <p className="text-[11px] font-[500] leading-[16px] text-[#6C7688]">Recommended</p>
            <div className="divide-y divide-[#ECF1F6] overflow-hidden rounded-[8px] border border-[#E3E8EF] bg-white">
              {options.map((option) => {
                const checked = picked.includes(option.id)
                return (
                  <div
                    key={option.id}
                    className={`flex min-h-[48px] items-center gap-[9px] px-[11px] py-[9px] ${checked ? "bg-[#F8F7FF]" : "hover:bg-[#F8FAFB]"}`}
                  >
                    <Checkbox
                      checked={checked}
                      label={checked ? `Remove ${option.title} recommendation` : `Keep ${option.title} recommendation`}
                      onChange={() => toggle(option.id)}
                    />
                    <button type="button" className="flex min-w-0 flex-1 items-center justify-between gap-[12px] text-left" onClick={() => toggle(option.id)}>
                      <span className={`text-[12px] font-[600] leading-[16px] ${checked ? "text-[#533AFD]" : "text-[#1A2C44]"}`}>{option.title}</span>
                      <span className="shrink-0 whitespace-nowrap text-right text-[11px] leading-[16px] text-[#6C7688]">{option.relationship}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <p className="text-[12px] leading-[18px] text-[#6C7688]">No new configurations to add for this account.</p>
        )}
      </div>
    </CreationModalShell>
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
