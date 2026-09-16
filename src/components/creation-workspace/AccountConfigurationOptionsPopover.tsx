'use client'

import { useCallback, useEffect, useRef, useState } from "react"

import {
  useAccountOnboardingStyle,
  type AccountOnboardingStyle,
} from "@/components/creation-workspace/accountOnboardingStyle"
import {
  useAccountSelectionStyle,
  type AccountSelectionStyle,
} from "@/components/creation-workspace/accountSelectionStyle"
import {
  useAccountConflictNudgeMode,
  type AccountConflictNudgeMode,
} from "@/components/creation-workspace/accountConflictNudgeMode"
import {
  useAccountPropertiesLayout,
  type AccountPropertiesLayout,
} from "@/components/creation-workspace/accountPropertiesLayout"

const SELECTION_OPTIONS: ReadonlyArray<{
  value: AccountSelectionStyle
  label: string
  description: string
}> = [
  {
    value: "picker",
    label: "Picker",
    description: "Create a new account inline from the Account field.",
  },
  {
    value: "related-modal",
    label: "Modal",
    description: "Create the account in a Simple modal, then return here.",
  },
  {
    value: "source-toggle",
    label: "Toggle",
    description: "Switch between existing and new account forms.",
  },
]

const ONBOARDING_OPTIONS: ReadonlyArray<{
  value: AccountOnboardingStyle
  label: string
  description: string
}> = [
  {
    value: "pre-save",
    label: "Form",
    description: "Choose Send email or Copy link before creating the account.",
  },
  {
    value: "toast-actions",
    label: "Toast",
    description: "After creating, choose Send email or Copy link from a toast.",
  },
  {
    value: "success-page",
    label: "Page",
    description: "After creating, choose Send email or Copy link on a confirmation page.",
  },
]

const CONFLICT_NUDGE_OPTIONS: ReadonlyArray<{
  value: AccountConflictNudgeMode
  label: string
  description: string
}> = [
  {
    value: "automatic",
    label: "Auto",
    description: "Appears for a unique match, such as accounts@juniperyoga.example.",
  },
  {
    value: "always",
    label: "Show",
    description: "Shows the Juniper match after any email is entered.",
  },
  {
    value: "off",
    label: "Hide",
    description: "Suppresses the existing-account nudge.",
  },
]

const PROPERTIES_LAYOUT_OPTIONS: ReadonlyArray<{
  value: AccountPropertiesLayout
  label: string
  description: string
}> = [
  {
    value: "combined",
    label: "Combined",
    description: "Edit capabilities and account properties together in one row.",
  },
  {
    value: "separate",
    label: "Separate",
    description: "Edit capabilities and account properties in separate rows.",
  },
]

type PopoverState = "closed" | "open" | "closing"

function optionButtonClass(selected: boolean) {
  return `rounded-[5px] px-[9px] py-[6px] text-[12px] font-[600] leading-[16px] transition-colors ${
    selected
      ? "bg-white text-[#353A44] shadow-[0_1px_2px_rgba(33,37,44,0.14)]"
      : "text-[#68778B] hover:bg-white/60 hover:text-[#353A44]"
  }`
}

export function AccountConfigurationOptionsPopover() {
  const { accountSelectionStyle, setAccountSelectionStyle } = useAccountSelectionStyle()
  const { accountOnboardingStyle, setAccountOnboardingStyle } = useAccountOnboardingStyle()
  const { accountConflictNudgeMode, setAccountConflictNudgeMode } = useAccountConflictNudgeMode()
  const { accountPropertiesLayout, setAccountPropertiesLayout } = useAccountPropertiesLayout()
  const [popoverState, setPopoverState] = useState<PopoverState>("closed")
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isOpen = popoverState === "open"

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const closePopover = useCallback((restoreFocus = false) => {
    clearCloseTimer()
    setPopoverState("closing")
    const closeMs = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--dropdown-close-dur"),
    ) || 150
    closeTimerRef.current = setTimeout(() => {
      setPopoverState("closed")
      closeTimerRef.current = null
    }, closeMs)
    if (restoreFocus) triggerRef.current?.focus()
  }, [clearCloseTimer])

  const togglePopover = () => {
    if (isOpen) {
      closePopover()
      return
    }
    clearCloseTimer()
    setPopoverState("open")
  }

  useEffect(() => clearCloseTimer, [clearCloseTimer])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) closePopover(true)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      event.preventDefault()
      event.stopPropagation()
      closePopover(true)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [closePopover, isOpen])

  const selectionDescription = SELECTION_OPTIONS.find(
    (option) => option.value === accountSelectionStyle,
  )?.description
  const onboardingDescription = ONBOARDING_OPTIONS.find(
    (option) => option.value === accountOnboardingStyle,
  )?.description
  const conflictNudgeDescription = CONFLICT_NUDGE_OPTIONS.find(
    (option) => option.value === accountConflictNudgeMode,
  )?.description
  const propertiesLayoutDescription = PROPERTIES_LAYOUT_OPTIONS.find(
    (option) => option.value === accountPropertiesLayout,
  )?.description

  return (
    <div ref={rootRef} className="relative flex h-full items-center">
      <button
        ref={triggerRef}
        type="button"
        className="rounded-[5px] px-[2px] py-[4px] text-[13px] font-[500] text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        aria-controls="account-configuration-options"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={togglePopover}
      >
        Options
      </button>

      <div
        id="account-configuration-options"
        role="dialog"
        aria-label="Account configuration options"
        aria-hidden={!isOpen}
        data-origin="bottom-right"
        className={`t-dropdown absolute bottom-[calc(100%+14px)] right-[-10px] max-h-[calc(100vh-80px)] w-[360px] max-w-[calc(100vw-16px)] overflow-y-auto rounded-[10px] border border-[#DDE4EB] bg-white p-[14px] text-[#353A44] shadow-[0_18px_45px_-8px_rgba(10,16,28,0.28),0_4px_12px_-4px_rgba(10,16,28,0.18)] ${
          popoverState === "open" ? "is-open" : popoverState === "closing" ? "is-closing" : ""
        }`}
      >
        <div>
          <p className="text-[13px] font-[650] leading-[18px] text-[#273951]">Account configuration options</p>
          <p className="mt-[2px] text-[11px] leading-[16px] text-[#68778B]">
            Choose a new or existing account and one or more configurations. The same flow handles merchant-only, recipient-only, all configurations, and existing-account additions, revealing payout and onboarding details only when needed.
          </p>
        </div>

        <div className="mt-[13px] border-t border-[#EBEEF1] pt-[12px]">
          <p className="text-[11px] font-[600] leading-[16px] text-[#526378]">Account selection</p>
          <div role="group" aria-label="Account selection" className="mt-[6px] grid grid-cols-3 gap-[2px] rounded-[7px] bg-[#F1F4F7] p-[2px]">
            {SELECTION_OPTIONS.map((option) => {
              const selected = accountSelectionStyle === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  tabIndex={isOpen ? 0 : -1}
                  aria-pressed={selected}
                  className={optionButtonClass(selected)}
                  onClick={() => setAccountSelectionStyle(option.value)}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
          <p aria-live="polite" className="mt-[6px] min-h-[16px] text-[11px] leading-[16px] text-[#68778B]">
            {selectionDescription}
          </p>
        </div>

        <div className="mt-[12px] border-t border-[#EBEEF1] pt-[12px]">
          <p className="text-[11px] font-[600] leading-[16px] text-[#526378]">Account properties</p>
          <div role="group" aria-label="Account properties layout" className="mt-[6px] grid grid-cols-2 gap-[2px] rounded-[7px] bg-[#F1F4F7] p-[2px]">
            {PROPERTIES_LAYOUT_OPTIONS.map((option) => {
              const selected = accountPropertiesLayout === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  tabIndex={isOpen ? 0 : -1}
                  aria-pressed={selected}
                  className={optionButtonClass(selected)}
                  onClick={() => setAccountPropertiesLayout(option.value)}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
          <p aria-live="polite" className="mt-[6px] min-h-[16px] text-[11px] leading-[16px] text-[#68778B]">
            {propertiesLayoutDescription}
          </p>
        </div>

        <div className="mt-[12px] border-t border-[#EBEEF1] pt-[12px]">
          <div className="flex items-center justify-between gap-[12px]">
            <p className="text-[11px] font-[600] leading-[16px] text-[#526378]">Existing-account nudge</p>
            <span className="rounded-full bg-[#F1F4F7] px-[7px] py-[2px] text-[9px] font-[600] leading-[13px] text-[#68778B]">New accounts only</span>
          </div>
          <div role="group" aria-label="Existing-account nudge" className="mt-[7px] grid grid-cols-3 gap-[2px] rounded-[7px] bg-[#F1F4F7] p-[2px]">
            {CONFLICT_NUDGE_OPTIONS.map((option) => {
              const selected = accountConflictNudgeMode === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  tabIndex={isOpen ? 0 : -1}
                  aria-pressed={selected}
                  className={optionButtonClass(selected)}
                  onClick={() => setAccountConflictNudgeMode(option.value)}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
          <p aria-live="polite" className="mt-[6px] min-h-[16px] text-[11px] leading-[16px] text-[#68778B]">
            {conflictNudgeDescription}
          </p>
        </div>

        <div className="mt-[12px] border-t border-[#EBEEF1] pt-[12px]">
          <div className="flex items-center justify-between gap-[12px]">
            <p className="text-[11px] font-[600] leading-[16px] text-[#526378]">Onboarding handoff</p>
            <span className="rounded-full bg-[#F1F4F7] px-[7px] py-[2px] text-[9px] font-[600] leading-[13px] text-[#68778B]">New accounts only</span>
          </div>
          <p className="mt-[4px] text-[10px] leading-[15px] text-[#68778B]">
            Every option supports sending the email or copying the link. Only the timing changes.
          </p>
          <div role="group" aria-label="Onboarding handoff" className="mt-[7px] grid grid-cols-3 gap-[2px] rounded-[7px] bg-[#F1F4F7] p-[2px]">
            {ONBOARDING_OPTIONS.map((option) => {
              const selected = accountOnboardingStyle === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  tabIndex={isOpen ? 0 : -1}
                  aria-pressed={selected}
                  className={optionButtonClass(selected)}
                  onClick={() => setAccountOnboardingStyle(option.value)}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
          <p aria-live="polite" className="mt-[6px] min-h-[16px] text-[11px] leading-[16px] text-[#68778B]">
            {onboardingDescription}
          </p>
        </div>
      </div>
    </div>
  )
}
