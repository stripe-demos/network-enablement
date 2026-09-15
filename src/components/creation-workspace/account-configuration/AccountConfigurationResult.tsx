'use client'

import { useEffect, useRef, useState } from "react"

import { UxRationaleToast } from "@/components/creation-workspace/UxRationaleToast"
import { getFormTokens } from "@/components/creation-workspace/forms/shared/formTokens"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"

import type { AccountConfigurationPayload } from "./model"

export async function copyAccountOnboardingLink(link: string) {
  try {
    await navigator.clipboard.writeText(link)
  } catch {
    const textarea = document.createElement("textarea")
    textarea.value = link
    textarea.style.cssText = "position:fixed;opacity:0;pointer-events:none"
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand("copy")
    textarea.remove()
  }
}

function SuccessMark() {
  const [state, setState] = useState<"out" | "in">("out")
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const path = pathRef.current
    if (path) {
      const length = Math.ceil(path.getTotalLength())
      path.style.strokeDasharray = String(length)
      path.style.strokeDashoffset = String(length)
    }
    const duration = window.getComputedStyle(document.documentElement).getPropertyValue("--duration-fast").trim()
    const modalOpenDelay = duration.endsWith("ms")
      ? Number.parseFloat(duration)
      : Number.parseFloat(duration) * 1000
    let frame = 0
    const timer = window.setTimeout(() => {
      frame = window.requestAnimationFrame(() => setState("in"))
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : modalOpenDelay)
    return () => {
      window.clearTimeout(timer)
      window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <span className="t-success-check" data-state={state} aria-hidden="true">
      <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#675DFF] text-white shadow-[0_0_0_9px_rgba(103,93,255,0.10)]">
        <svg width="30" height="24" viewBox="0 0 30 24" fill="none"><path ref={pathRef} d="M3 12.5l7.5 7L27 3" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    </span>
  )
}

export function AccountSuccessPage({ payload, hugContent = false }: { payload: AccountConfigurationPayload; hugContent?: boolean }) {
  const [feedback, setFeedback] = useState("")
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)
  const accountCreated = payload.source === "new"
  const accountUpdated = !accountCreated && Boolean(payload.deactivatedConfigurations?.length)
  const onboarding = payload.onboarding

  const sendEmail = () => setFeedback(`Onboarding email sent to ${onboarding?.email || "the account"}.`)
  const copyLink = async () => {
    if (onboarding) await copyAccountOnboardingLink(onboarding.link)
    setFeedback("Onboarding link copied.")
  }

  return (
    <div className={`flex min-h-0 flex-1 flex-col items-center justify-center text-center ${hugContent ? "p-[120px]" : "px-[24px] py-[48px]"}`} data-account-success-page>
      <SuccessMark />
      <h2 className="mt-[24px] text-[24px] font-[650] leading-[30px] tracking-[-0.35px] text-[#1A2C44]">{accountCreated ? "Account created" : accountUpdated ? "Account updated" : `Configuration${payload.configurations.length === 1 ? "" : "s"} added`}</h2>
      <p className="mt-[8px] max-w-[600px] text-[13px] leading-[20px] text-[#596171]">
        {accountCreated && onboarding
          ? <><span className="block">The account can now finish any remaining setup.</span><span className="block">Send the onboarding link by email or copy it to share yourself.</span></>
          : accountCreated ? "The account can now finish any remaining setup." : "The selected account has been updated."}
      </p>
      {accountCreated && onboarding ? (
        <div className="mt-[16px] flex items-center justify-center gap-[8px]">
          <button type="button" aria-label="Copy secure onboarding link" className={tokens.secondaryButtonClass} onClick={copyLink}>Copy link</button>
          <button type="button" className={tokens.primaryButtonClass} onClick={sendEmail}>Send email</button>
        </div>
      ) : null}
      <UxRationaleToast message={feedback || null} onDismiss={() => setFeedback("")} />
    </div>
  )
}

export function AccountCompletionToast({
  payload,
  actionable,
  onDismiss,
}: {
  payload: AccountConfigurationPayload
  actionable: boolean
  onDismiss: () => void
}) {
  const [feedback, setFeedback] = useState("")
  const onboarding = payload.onboarding
  const accountCreated = payload.source === "new"
  const message = accountCreated
    ? payload.onboarding?.action === "copy-link"
      ? "Account created. Onboarding link copied."
      : payload.onboarding?.action === "send-email"
        ? `Account created. Onboarding email sent to ${payload.onboarding.email}.`
        : "Account created."
    : `Configuration${payload.configurations.length === 1 ? "" : "s"} added.`

  return (
    <div className="fixed bottom-[24px] right-[24px] z-[1200] w-[360px] max-w-[calc(100vw-48px)] rounded-[10px] border border-[#D4DEE9] bg-white p-[12px] shadow-[0_14px_36px_rgba(20,34,52,0.18)]" role="region" aria-live="polite" aria-label="Account creation status" data-account-completion-toast>
      <div className="flex items-start gap-[10px]">
        <span className="mt-[1px] flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-[#675DFF] text-white"><svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true"><path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-[600] leading-[17px] text-[#1A2C44]">{message}</p>
          {actionable && onboarding ? (
            <div className="mt-[9px] flex flex-wrap gap-[6px]">
              <button type="button" className="rounded-[6px] border border-[#D4DEE9] bg-white px-[8px] py-[5px] text-[11px] font-[600] text-[#273951] hover:bg-[#F5F6F8]" onClick={async () => { await copyAccountOnboardingLink(onboarding.link); setFeedback("Link copied.") }}>Copy link</button>
              <button type="button" className="rounded-[6px] bg-[#675DFF] px-[8px] py-[5px] text-[11px] font-[600] text-white hover:bg-[#5B52F0]" onClick={() => setFeedback(`Email sent to ${onboarding.email}.`)}>Send email</button>
            </div>
          ) : null}
          {feedback ? <p className="mt-[7px] text-[11px] font-[600] leading-[16px] text-[#037060]">{feedback}</p> : null}
        </div>
        <button type="button" aria-label="Dismiss notification" className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[5px] text-[#818DA0] hover:bg-[#F5F6F8] hover:text-[#273951]" onClick={onDismiss}>×</button>
      </div>
    </div>
  )
}
