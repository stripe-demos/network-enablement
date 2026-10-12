'use client'

import type { FormEvent, ReactNode } from "react"

import "./cardCreateShell.css"

const CARD_CREATE_BUTTONS = {
  primary:
    "flex h-[28px] items-center whitespace-nowrap rounded-[6px] bg-[#675DFF] px-[8px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-white shadow-[0px_1px_1px_0px_rgba(20,19,78,0.32),0px_0px_0px_1px_#625AFA] transition-colors hover:bg-[#5B52F0]",
  primaryDisabled:
    "flex h-[28px] cursor-not-allowed items-center whitespace-nowrap rounded-[6px] border border-[#D4DEE9] bg-[#F5F6F8] px-[8px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#9CA3B0]",
  secondary:
    "flex h-[28px] items-center rounded-[6px] bg-white px-[8px] text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#353A44] shadow-[0px_1px_1px_0px_rgba(26,27,37,0.16),0px_0px_0px_1px_#D5DBE1] transition-colors hover:bg-[#F5F6F8]",
} as const

export const ACCOUNT_CREATE_FORM_ID = "account-create-form"

type CardCreateShellProps = {
  title: string
  form: ReactNode
  preview: ReactNode
  overlay?: ReactNode
  isOpen: boolean
  embedded?: boolean
  onDiscard: () => void
  onSubmit: () => void
  submitLabel?: string
  submitDisabled?: boolean
  submitDisabledReason?: string
  discardLabel?: string
}

export function CardCreateShell({
  title,
  form,
  preview,
  overlay,
  isOpen,
  embedded = false,
  onDiscard,
  onSubmit,
  submitLabel = "Save",
  submitDisabled = false,
  submitDisabledReason,
  discardLabel = "Discard",
}: CardCreateShellProps) {
  if (!isOpen) return null

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitDisabled) return
    onSubmit()
  }

  return (
    <div className={embedded ? "relative h-full min-h-0 w-full" : "fixed inset-0 z-30"} role="dialog" aria-modal="true">
      <main data-card-create-shell className="creation-workspace relative bg-white">
        <header className="creation-header">
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
              {title}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-[8px]">
            <button type="button" className={CARD_CREATE_BUTTONS.secondary} onClick={onDiscard}>
              {discardLabel}
            </button>
            <button
              type="submit"
              form={ACCOUNT_CREATE_FORM_ID}
              disabled={submitDisabled}
              title={submitDisabled ? submitDisabledReason : undefined}
              className={submitDisabled ? CARD_CREATE_BUTTONS.primaryDisabled : CARD_CREATE_BUTTONS.primary}
            >
              {submitLabel}
            </button>
          </div>
        </header>
        <div className="creation-columns">
          <section className="form-panel" aria-label="Account settings">
            <form id={ACCOUNT_CREATE_FORM_ID} className="form-content" onSubmit={handleSubmit}>
              {form}
            </form>
          </section>
          <aside className="preview-panel" aria-label="Account preview">
            {preview}
          </aside>
        </div>
        {overlay}
      </main>
    </div>
  )
}
