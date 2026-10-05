'use client'

import { useEffect, useRef, useState, type ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"

import { UxRationaleToast } from "@/components/creation-workspace/UxRationaleToast"
import { getFormTokens } from "@/components/creation-workspace/forms/shared/formTokens"
import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"

import { ACCOUNT_ONBOARDING_LINK, PAYOUT_METHODS, type AccountConfigurationPayload, type PayoutMethod } from "./model"

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

function SuccessMark({ size = "md" }: { size?: "sm" | "md" }) {
  const [state, setState] = useState<"out" | "in">("out")
  const pathRef = useRef<SVGPathElement>(null)
  const isSmall = size === "sm"

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
      <span className={`flex items-center justify-center rounded-full bg-[#675DFF] text-white ${isSmall ? "h-[36px] w-[36px] shadow-[0_0_0_6px_rgba(103,93,255,0.10)]" : "h-[50px] w-[50px] shadow-[0_0_0_6px_rgba(103,93,255,0.10)]"}`}>
        <svg width={isSmall ? 16 : 21} height={isSmall ? 13 : 17} viewBox="0 0 30 24" fill="none"><path ref={pathRef} d="M3 12.5l7.5 7L27 3" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    </span>
  )
}

const successEase = [0.22, 1, 0.36, 1] as const

function DirectSuccessCheck() {
  const reduceMotion = useReducedMotion()
  return (
    <span className="relative inline-flex h-[48px] w-[48px] items-center justify-center" aria-hidden="true">
      {reduceMotion ? null : (
        <motion.span
          className="absolute inset-0 rounded-full bg-[#675DFF]/20"
          initial={{ scale: 0.4, opacity: 0.7 }}
          animate={{ scale: 2.6, opacity: 0 }}
          transition={{ duration: 0.75, ease: successEase }}
        />
      )}
      <motion.span
        className="absolute inset-[-6px] rounded-full border border-[#675DFF]/25"
        initial={reduceMotion ? false : { scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: successEase }}
      />
      <motion.span
        className="relative flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#675DFF] text-white shadow-[0_6px_16px_rgba(103,93,255,0.28)]"
        initial={reduceMotion ? false : { scale: 0.2, rotate: -24 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 460, damping: 20 }}
      >
        <svg width="20" height="16" viewBox="0 0 30 24" fill="none">
          <motion.path
            d="M3 12.5l7.5 7L27 3"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduceMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.16, duration: 0.32, ease: successEase }}
          />
        </svg>
      </motion.span>
    </span>
  )
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CloseButton({ onClose }: { onClose?: () => void }) {
  if (!onClose) return null
  return (
    <button
      type="button"
      aria-label="Close"
      className="flex h-[28px] w-[28px] items-center justify-center rounded-[6px] text-[#818DA0] hover:bg-[#F5F6F8] hover:text-[#1A2C44]"
      onClick={onClose}
    >
      <CloseIcon />
    </button>
  )
}

function SuccessDismissChrome({
  onClose,
  onViewAccount,
  viewAccountClassName,
}: {
  onClose?: () => void
  onViewAccount?: () => void
  viewAccountClassName: string
}) {
  if (!onClose && !onViewAccount) return null
  return (
    <>
      <div className="absolute right-[16px] top-[16px] z-10">
        <CloseButton onClose={onClose} />
      </div>
      {onViewAccount ? (
        <div className="absolute bottom-[24px] right-[24px] z-10">
          <button type="button" className={viewAccountClassName} onClick={onViewAccount}>
            View account
          </button>
        </div>
      ) : null}
    </>
  )
}

function PreviewSuccessLayout({
  title,
  description,
  actions,
  preview,
  footer,
  onClose,
  onViewAccount,
  viewAccountClassName,
}: {
  title: string
  description: ReactNode
  actions?: ReactNode
  preview: ReactNode
  footer?: ReactNode
  onClose?: () => void
  onViewAccount?: () => void
  viewAccountClassName: string
}) {
  return (
    <div className="relative flex min-h-[min(600px,calc(100vh-96px))] w-[min(1080px,calc(100vw-96px))] bg-white" data-account-success-page>
      <div className="flex w-[440px] shrink-0 flex-col justify-center px-[48px] py-[32px]">
        <DirectSuccessCheck />
        <motion.h2
          className="mt-[16px] text-[26px] font-[650] leading-[32px] tracking-[-0.35px] text-[#1A2C44]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.35, ease: successEase }}
        >
          {title}
        </motion.h2>
        <motion.p
          className="mt-[10px] max-w-[400px] text-[14px] leading-[22px] text-[#596171]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.35, ease: successEase }}
        >
          {description}
        </motion.p>
        {actions ? (
          <motion.div
            className="mt-[20px] flex flex-wrap items-center gap-[8px]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.35, ease: successEase }}
          >
            {actions}
          </motion.div>
        ) : null}
      </div>
      <div className="relative flex min-w-0 flex-1 items-center justify-center bg-[#F6F9FC] px-[56px] py-[40px]">
        <div className="absolute right-[16px] top-[16px] z-10">
          <CloseButton onClose={onClose} />
        </div>
        <motion.div
          className="w-full max-w-[440px]"
          initial={{ opacity: 0, y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.22, duration: 0.5, ease: successEase }}
        >
          {preview}
        </motion.div>
      </div>
    </div>
  )
}

function ShareLinkButton({ onCopy }: { onCopy: () => Promise<void> }) {
  const [copied, setCopied] = useState(false)
  const hideTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(hideTimer.current), [])

  const copy = async () => {
    await onCopy()
    setCopied(true)
    window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <span className="relative inline-block">
      <button
        type="button"
        className="text-[#596171] underline decoration-[#C5CDD6] underline-offset-[3px] hover:text-[#1A2C44] hover:decoration-[#1A2C44]"
        onClick={copy}
      >
        share this link
      </button>
      <span
        className={`pointer-events-none absolute bottom-full left-1/2 mb-[6px] -translate-x-1/2 whitespace-nowrap rounded-[6px] bg-[#1A2C44] px-[8px] py-[4px] text-[11px] font-[600] leading-[14px] text-white shadow-[0_4px_12px_rgba(20,34,52,0.18)] transition-opacity ${copied ? "opacity-100" : "opacity-0"}`}
        role="status"
      >
        Copied
      </span>
    </span>
  )
}

function payoutContact(payload: AccountConfigurationPayload) {
  return "email" in payload.account && payload.account.email
    ? payload.account.email
    : payload.details.accountEmail
}

function payoutMethodLabels(methods: PayoutMethod[] | undefined) {
  const selected = (methods ?? []).filter((method) => method !== "stripe-balance")
  const ids = selected.length > 0 ? selected : (["bank-account", "debit-card"] as PayoutMethod[])
  return ids.map((id) => PAYOUT_METHODS.find((method) => method.id === id)?.label ?? id)
}

function EmailPreviewShell({
  subject,
  children,
}: {
  to: string
  subject: string
  children: ReactNode
}) {
  return (
    <div className="w-full max-w-[440px]" data-email-preview>
      <div className="overflow-hidden rounded-[12px] border border-[#E3E8EF] bg-white shadow-[0_18px_40px_rgba(20,34,52,0.10)]">
        <div className="flex items-center gap-[12px] border-b border-[#F0F3F7] px-[24px] py-[16px]">
          <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-[#6C7688] text-[13px] font-[700] text-white">S</span>
          <div className="min-w-0 text-[12px] leading-[18px] text-[#596171]">
            <p><span className="text-[#818DA0]">From:</span> Stripe</p>
            <p><span className="text-[#818DA0]">Subject:</span> {subject}</p>
          </div>
        </div>
        <div className="px-[24px] pb-[28px] pt-[20px]">{children}</div>
      </div>
    </div>
  )
}

function PayoutDetailsEmailPreview({
  to,
  methods,
}: {
  to: string
  methods: PayoutMethod[] | undefined
}) {
  const labels = payoutMethodLabels(methods)

  return (
    <EmailPreviewShell to={to} subject="Add your payout details">
      <h3 className="text-[22px] font-[650] leading-[28px] tracking-[-0.25px] text-[#1A2C44]">Add your payout details</h3>
      <p className="mt-[10px] text-[13px] leading-[20px] text-[#596171]">
        Use the link below to enter where you’d like to receive funds.
      </p>
      <div className="mt-[20px] rounded-[8px] bg-[#F6F9FC] px-[16px] py-[14px] text-left">
        <p className="text-[12px] font-[600] leading-[16px] text-[#273951]">You can add</p>
        <ul className="mt-[8px] list-disc pl-[18px] text-[13px] leading-[20px] text-[#596171]">
          {labels.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      </div>
      <div className="mt-[24px] flex h-[40px] items-center justify-center rounded-[8px] border border-[#D4DEE9] bg-[#F4F6F8] text-[13px] font-[600] text-[#6C7688]">
        Add payout details
      </div>
      <p className="mt-[12px] text-center text-[11px] leading-[16px] text-[#818DA0]">This link will expire in 3 days.</p>
    </EmailPreviewShell>
  )
}

function OnboardingEmailPreview({ to }: { to: string }) {
  return (
    <EmailPreviewShell to={to} subject="Finish setting up your account">
      <h3 className="text-[22px] font-[650] leading-[28px] tracking-[-0.25px] text-[#1A2C44]">Finish setting up your account</h3>
      <p className="mt-[10px] text-[13px] leading-[20px] text-[#596171]">
        Use the link below to provide any remaining information so this account can start using Stripe.
      </p>
      <div className="mt-[36px] flex h-[40px] items-center justify-center rounded-[8px] border border-[#D4DEE9] bg-[#F4F6F8] text-[13px] font-[600] text-[#6C7688]">
        Continue setup
      </div>
      <p className="mt-[16px] text-center text-[11px] leading-[16px] text-[#818DA0]">This link will expire in 7 days.</p>
    </EmailPreviewShell>
  )
}

export function AccountSuccessPage({ payload, hugContent = false, onClose, onViewAccount }: { payload: AccountConfigurationPayload; hugContent?: boolean; onClose?: () => void; onViewAccount?: () => void }) {
  const [feedback, setFeedback] = useState("")
  const [payoutEmailSent, setPayoutEmailSent] = useState(false)
  const [onboardingEmailSent, setOnboardingEmailSent] = useState(false)
  const { productFormStyle } = useProductFormStyle()
  const tokens = getFormTokens(productFormStyle)
  const primaryButtonClass = `${tokens.primaryButtonClass} !h-[32px] !px-[14px] !text-[13px]`
  const secondaryButtonClass = `${tokens.secondaryButtonClass} !h-[32px] !px-[14px] !text-[13px]`
  const accountCreated = payload.source === "new"
  const accountUpdated = !accountCreated && Boolean(payload.deactivatedConfigurations?.length)
  const onboarding = payload.onboarding
  const recipientAdded = payload.configurations.includes("recipient")
  const payoutEmail = payload.recipient?.email || payoutContact(payload)
  const isDirectRecipientCreated = payload.userPath === "direct" && accountCreated && recipientAdded
  const isDirectCustomerCreated = payload.userPath === "direct" && accountCreated && payload.configurations.includes("customer") && !recipientAdded
  const isPlatformCapabilityAdded = payload.userPath !== "direct" && (recipientAdded || payload.configurations.includes("merchant"))
  const showPayoutEmail = recipientAdded && !(accountCreated && onboarding) && !isDirectRecipientCreated && !isPlatformCapabilityAdded
  const showOnboardingActions = Boolean(accountCreated && onboarding) && !isDirectRecipientCreated && !isDirectCustomerCreated && !isPlatformCapabilityAdded
  const onboardingEmail = onboarding?.email || payoutContact(payload)
  const onboardingLink = onboarding?.link || ACCOUNT_ONBOARDING_LINK

  const sendEmail = () => {
    setOnboardingEmailSent(true)
    setFeedback(`Onboarding email sent to ${onboardingEmail || "the account"}.`)
  }
  const sendPayoutEmail = () => {
    setPayoutEmailSent(true)
    setFeedback(`Payout details email sent to ${payoutEmail || "the account"}.`)
  }
  const copyLink = async () => {
    await copyAccountOnboardingLink(onboardingLink)
  }

  const dismiss = onClose ?? onViewAccount

  if (isDirectRecipientCreated || showPayoutEmail) {
    return (
      <>
        <PreviewSuccessLayout
          title={accountCreated ? "Account created" : `Configuration${payload.configurations.length === 1 ? "" : "s"} added`}
          description={
            <>
              Send an email to <span className="font-[600] text-[#1A2C44]">{payoutEmail || "the account"}</span> to collect payout details.
            </>
          }
          actions={
            <>
              <button type="button" className={`${secondaryButtonClass} disabled:cursor-default disabled:opacity-60`} disabled={payoutEmailSent} onClick={sendPayoutEmail}>
                {payoutEmailSent ? "Email sent" : "Send email"}
              </button>
              <button type="button" className={primaryButtonClass} onClick={onViewAccount}>View account</button>
            </>
          }
          preview={<PayoutDetailsEmailPreview to={payoutEmail} methods={payload.recipient?.methods} />}
          onClose={dismiss}
          viewAccountClassName={primaryButtonClass}
        />
        <UxRationaleToast message={feedback || null} onDismiss={() => setFeedback("")} />
      </>
    )
  }

  if (isPlatformCapabilityAdded) {
    return (
      <>
        <PreviewSuccessLayout
          title={accountCreated ? "Account created" : `Configuration${payload.configurations.length === 1 ? "" : "s"} added`}
          description={
            <>
              Send an email to <span className="font-[600] text-[#1A2C44]">{onboardingEmail || "the account"}</span> to collect remaining information, or <ShareLinkButton onCopy={copyLink} />.
              <span className="mt-[8px] block">The link expires in 7 days.</span>
            </>
          }
          actions={
            <>
              <button type="button" className={`${secondaryButtonClass} disabled:cursor-default disabled:opacity-60`} disabled={onboardingEmailSent} onClick={sendEmail}>
                {onboardingEmailSent ? "Email sent" : "Send email"}
              </button>
              <button type="button" className={primaryButtonClass} onClick={onViewAccount}>View account</button>
            </>
          }
          preview={<OnboardingEmailPreview to={onboardingEmail} />}
          onClose={dismiss}
          viewAccountClassName={primaryButtonClass}
        />
        <UxRationaleToast message={feedback || null} onDismiss={() => setFeedback("")} />
      </>
    )
  }

  return (
    <div className={`relative flex min-h-0 flex-1 flex-col items-center justify-center text-center ${hugContent ? "p-[120px]" : "px-[24px] py-[48px]"}`} data-account-success-page>
      <SuccessDismissChrome onClose={dismiss} viewAccountClassName={primaryButtonClass} />
      <SuccessMark />
      <h2 className="mt-[24px] text-[24px] font-[650] leading-[30px] tracking-[-0.35px] text-[#1A2C44]">{accountCreated ? "Account created" : accountUpdated ? "Account updated" : `Configuration${payload.configurations.length === 1 ? "" : "s"} added`}</h2>
      <p className="mt-[8px] max-w-[600px] text-[13px] leading-[20px] text-[#596171]">
        {isDirectCustomerCreated
          ? "Edit account details or add configurations from this account’s page."
          : showOnboardingActions
            ? <><span className="block">The account can now finish any remaining setup.</span><span className="block">Send the onboarding link by email or copy it to share yourself.</span></>
            : accountCreated ? "The account can now finish any remaining setup." : "The selected account has been updated."}
      </p>
      {isDirectCustomerCreated || !showOnboardingActions ? (
        <div className="mt-[16px]">
          <button type="button" className={primaryButtonClass} onClick={onViewAccount}>View account</button>
        </div>
      ) : showOnboardingActions ? (
        <div className="mt-[16px] flex items-center justify-center gap-[8px]">
          <button type="button" aria-label="Copy secure onboarding link" className={secondaryButtonClass} onClick={copyLink}>Copy link</button>
          <button type="button" className={primaryButtonClass} onClick={sendEmail}>Send email</button>
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
