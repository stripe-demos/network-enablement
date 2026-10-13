// Full-page "focus view" dialog that onboards a platform to the Stripe network
// in three steps. This file is the shell only: the top bar, progress, footer
// and step routing. Each step's content lives in ./steps/.
//
// Step contract — every step component receives:
//   state          { optedIn: boolean, shareSettings: {}, selectedAccountIds: string[] }
//   setState(next) merges a partial object, or takes an updater fn (prev => partial)
//   onValidChange(bool) gates the primary button for that step
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Button, FadeSlideIn, color, font, type, radius } from '@dashboard/ui'
import WelcomeStep from './steps/WelcomeStep'
import OptInStep from './steps/OptInStep'
import FindAccountsStep from './steps/FindAccountsStep'

const STEPS = [
  { id: 'welcome', label: 'Welcome', primary: 'Get started', Component: WelcomeStep, validByDefault: true },
  { id: 'opt-in', label: 'Opt in', primary: 'Agree and continue', Component: OptInStep, validByDefault: false },
  { id: 'find-accounts', label: 'Find accounts', primary: 'Done', Component: FindAccountsStep, validByDefault: true },
]

const INITIAL_STATE = { optedIn: false, shareSettings: {}, selectedAccountIds: [] }

const Z_INDEX = 10020 // above Drawer (10011), toasts (10002) and the app chrome
const CONTENT_MAX_WIDTH = 960
const GUTTER = 32
const footerButton = { height: 32, padding: '6px 12px' }

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 2.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M2 5.2l2 2L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StepProgress({ current }) {
  return (
    <ol aria-label="Progress" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, padding: 0, listStyle: 'none' }}>
      {STEPS.map((step, i) => {
        const done = i < current
        const active = i === current
        const marker = done || active ? color.brand500 : color.neutral100
        return (
          <li key={step.id} aria-current={active ? 'step' : undefined} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {i > 0 && <span aria-hidden="true" style={{ width: 24, height: 1, background: done || active ? color.brand300 : color.neutral100 }} />}
            <span
              aria-hidden="true"
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 600,
                color: done ? '#FFFFFF' : active ? color.brand500 : color.muted,
                background: done ? color.brand500 : color.surface,
                boxShadow: `inset 0 0 0 1.5px ${marker}`,
              }}
            >
              {done ? <CheckIcon /> : i + 1}
            </span>
            <span style={{ ...type.bodySmall, fontWeight: active ? 600 : 400, color: active ? color.text : color.subdued, whiteSpace: 'nowrap' }}>
              {step.label}
              {done && <span className="sr-only"> (completed)</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function OnboardingDialog({ onClose, onComplete }) {
  const titleId = useId()
  const dialogRef = useRef(null)
  const scrollRef = useRef(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [valid, setValid] = useState(STEPS[0].validByDefault)
  const [state, setStateRaw] = useState(INITIAL_STATE)

  const step = STEPS[stepIndex]
  const isLast = stepIndex === STEPS.length - 1

  const setState = useCallback(next => {
    setStateRaw(prev => ({ ...prev, ...(typeof next === 'function' ? next(prev) : next) }))
  }, [])
  const onValidChange = useCallback(v => setValid(Boolean(v)), [])

  const goTo = index => {
    setValid(STEPS[index].validByDefault)
    setStepIndex(index)
  }

  const handlePrimary = () => {
    if (!valid) return
    if (isLast) {
      onComplete?.({ optedIn: state.optedIn, selectedAccountIds: state.selectedAccountIds })
      return
    }
    // Clicking "Agree and continue" is the consent.
    if (step.id === 'opt-in') setState({ optedIn: true })
    goTo(stepIndex + 1)
  }

  // Body scroll lock + restore focus to whatever opened the dialog.
  useLayoutEffect(() => {
    const previouslyFocused = document.activeElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus({ preventScroll: true })
    return () => {
      document.body.style.overflow = overflow
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) previouslyFocused.focus({ preventScroll: true })
    }
  }, [])

  // Escape closes (steps can call e.preventDefault() to keep it open, e.g. for a nested menu).
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape' && !e.defaultPrevented) onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // New step: back to the top, focus inside the dialog for screen readers.
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    scrollRef.current?.scrollTo({ top: 0 })
    scrollRef.current?.focus({ preventScroll: true })
  }, [stepIndex])

  // Keep Tab / Shift+Tab inside the dialog.
  const trapFocus = e => {
    if (e.key !== 'Tab') return
    const nodes = [...dialogRef.current.querySelectorAll(FOCUSABLE)].filter(n => n.offsetParent !== null || n === document.activeElement)
    if (!nodes.length) { e.preventDefault(); return }
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    const inside = dialogRef.current.contains(document.activeElement)
    if (e.shiftKey && (document.activeElement === first || !inside || document.activeElement === dialogRef.current)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
      e.preventDefault()
      first.focus()
    }
  }

  const StepComponent = step.Component

  return (
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      onKeyDown={trapFocus}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.22, ease: [0.2, 0, 0.1, 1] }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z_INDEX,
        background: color.surface,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: font.text,
        fontSize: 16,
        color: color.text,
        outline: 'none',
      }}
    >
      {/* Top bar */}
      <header
        style={{
          flexShrink: 0,
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 16,
          height: 60,
          padding: `0 ${GUTTER - 8}px`,
          borderBottom: `1px solid ${color.neutral50}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            type="button"
            aria-label="Close"
            title="Close"
            onClick={onClose}
            className="dui-btn dui-btn--ghost dui-btn--icon"
            style={{ width: 32, height: 32, color: color.subdued, borderRadius: radius.md }}
          >
            <CloseIcon />
          </button>
        </div>
        <h2 id={titleId} style={{ ...type.label, margin: 0, fontSize: 16, lineHeight: '24px', letterSpacing: -0.31, textAlign: 'center' }}>
          Stripe network
          <span className="sr-only">{`: ${step.label}, step ${stepIndex + 1} of ${STEPS.length}`}</span>
        </h2>
        <div style={{ display: 'flex', justifyContent: 'flex-end', minWidth: 0, overflow: 'hidden' }}>
          <StepProgress current={stepIndex} />
        </div>
      </header>

      {/* Content */}
      <div ref={scrollRef} tabIndex={-1} style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', outline: 'none' }}>
        <FadeSlideIn
          transitionKey={step.id}
          appear
          data-network-onboarding-step={step.id}
          style={{ maxWidth: CONTENT_MAX_WIDTH, margin: '0 auto', padding: `48px ${GUTTER}px 64px`, boxSizing: 'content-box' }}
        >
          <StepComponent key={step.id} state={state} setState={setState} onValidChange={onValidChange} />
        </FadeSlideIn>
      </div>

      {/* Footer */}
      <footer style={{ flexShrink: 0, borderTop: `1px solid ${color.neutral50}`, background: color.surface }}>
        <div
          style={{
            maxWidth: CONTENT_MAX_WIDTH,
            margin: '0 auto',
            padding: `16px ${GUTTER}px`,
            boxSizing: 'content-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <div>
            {stepIndex > 0 && (
              <Button variant="secondary" onClick={() => goTo(stepIndex - 1)} style={footerButton}>Back</Button>
            )}
          </div>
          <Button variant="primary" onClick={handlePrimary} disabled={!valid} style={footerButton}>
            {step.primary}
          </Button>
        </div>
      </footer>
    </motion.div>
  )
}

/**
 * Props:
 *   open        boolean
 *   onClose()   X button or Escape
 *   onComplete({ optedIn, selectedAccountIds })   "Done" on the last step
 * Step state resets every time the dialog opens.
 */
export default function NetworkOnboarding({ open, onClose, onComplete }) {
  return createPortal(
    <AnimatePresence>
      {open && <OnboardingDialog key="network-onboarding" onClose={onClose} onComplete={onComplete} />}
    </AnimatePresence>,
    document.body,
  )
}
