import { useEffect, useRef } from "react"

type SpeechResult = {
  finalText: string
  interimText: string
}

type SpeechRecognitionResultLike = {
  isFinal: boolean
  0: { transcript: string }
}

type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultLike>
}

export type SpeechRecognitionErrorLike = {
  error?: string
  message?: string
}

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives?: number
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

// Keep the live instance reachable so Chromium doesn't garbage-collect it mid-session.
let liveRecognition: SpeechRecognitionLike | null = null

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function isSpeechRecognitionSupported() {
  return Boolean(getSpeechRecognitionCtor())
}

export async function unlockMicrophone() {
  return startMicrophone()
}

export async function startMicrophone() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("getUserMedia is not available")
  }
  return navigator.mediaDevices.getUserMedia({ audio: true })
}

export function stopMicrophone(stream: MediaStream | null | undefined) {
  stream?.getTracks().forEach((track) => track.stop())
}

export default function useSpeechRecognition(
  active: boolean,
  {
    lang = "en-US",
    onResult,
    onError,
  }: {
    lang?: string
    onResult?: (result: SpeechResult) => void
    onError?: (error: SpeechRecognitionErrorLike) => void
  } = {},
) {
  const onResultRef = useRef(onResult)
  const onErrorRef = useRef(onError)
  onResultRef.current = onResult
  onErrorRef.current = onError

  useEffect(() => {
    if (!active) return undefined

    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      onErrorRef.current?.({ error: "unsupported", message: "unsupported" })
      return undefined
    }

    const rec = new Ctor()
    liveRecognition = rec
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 1
    rec.lang = lang

    let stopped = false

    rec.onresult = (event) => {
      let finalText = ""
      let interimText = ""
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i]
        const piece = result[0]?.transcript ?? ""
        if (result.isFinal) finalText += piece
        else interimText += piece
      }
      onResultRef.current?.({ finalText, interimText })
    }

    rec.onerror = (event) => {
      if (stopped) return
      onErrorRef.current?.(event)
    }

    rec.onend = () => {
      if (stopped) return
      window.setTimeout(() => {
        if (stopped || liveRecognition !== rec) return
        try {
          rec.start()
        } catch {
          // Already starting / stopping.
        }
      }, 80)
    }

    try {
      rec.start()
    } catch {
      onErrorRef.current?.({ error: "audio-capture", message: "Could not start voice input." })
    }

    return () => {
      stopped = true
      if (liveRecognition === rec) liveRecognition = null
      try {
        rec.onresult = null
        rec.onerror = null
        rec.onend = null
        rec.stop()
      } catch {
        try {
          rec.abort()
        } catch {
          // Nothing to stop.
        }
      }
    }
  }, [active, lang])
}
