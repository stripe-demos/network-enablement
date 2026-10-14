// Full-page dialog that onboards a platform to the Stripe network in three
// steps. This file is the shell only: the header, progress panel, footer and
// step routing. Each step's content lives in ./steps/.
//
// Step contract — every step component receives:
//   state          { optedIn: boolean, shareSettings: {}, selectedAccountIds: string[] }
//   setState(next) merges a partial object, or takes an updater fn (prev => partial)
//   onValidChange(bool) gates the primary button for that step
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Button, FadeSlideIn, color, font, radius } from '@dashboard/ui'
import WelcomeStep from './steps/WelcomeStep'
import OptInStep from './steps/OptInStep'
import FindAccountsStep from './steps/FindAccountsStep'

const STEPS = [
  { id: 'welcome', label: 'Welcome', primary: 'Get started', Component: WelcomeStep, validByDefault: true },
  { id: 'opt-in', label: 'Opt in', primary: 'Agree and continue', Component: OptInStep, validByDefault: false },
  { id: 'find-accounts', label: 'Find connected accounts', primary: 'Done', Component: FindAccountsStep, validByDefault: true },
]

const INITIAL_STATE = { optedIn: false, shareSettings: {}, selectedAccountIds: [] }

const Z_INDEX = 10020 // above Drawer (10011), toasts (10002) and the app chrome
const ASSETS = '/dashboard-assets/network'
const CONTENT_MAX_WIDTH = 520 // Figma content column

// Dialog base and progress panel follow Figma "Modal / 88" (Dashboard visual
// refresh, node 42590:5905): a floating sheet on a backdrop, a header bar, a
// progress panel on the left (260px here; 320px in Figma) and the step on the right.
const MODAL_SHADOW = '0px 16px 32px -8px rgba(20,34,52,0.04), 0px 8px 16px -4px rgba(20,34,52,0.05), 0px 2px 4px -1px rgba(20,34,52,0.05), 0px 1px 2px 0px rgba(20,34,52,0.06), 0px 0px 3px 0px rgba(20,34,52,0.06)'
const PANEL_SHADOW = '0px 4px 7px 0px rgba(0,0,0,0.01), 0px 3px 6px 0px rgba(0,0,0,0.01), 0px 2px 5px 0px rgba(0,0,0,0.01), 0px 1px 4px 0px rgba(0,0,0,0.01), 0px 0px 2px 0px rgba(0,0,0,0.02)'
const AREA_FILL = '#F6F9FC'
const BACKDROP = 'rgba(182,192,205,0.7)'
const STEP_UPCOMING = '#7D8FA2'
const TEXT_PRIMARY = '#081524'
const TEXT_SECONDARY = '#4F647A'
const pillButton = { height: 40, padding: '10px 12px', borderRadius: 9999, fontSize: 13, fontWeight: 500, lineHeight: '20px', letterSpacing: -0.065, boxShadow: 'none' }

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Step rows are 20px markers 16px apart.
const CONNECTOR_LENGTH = (STEPS.length - 1) * (20 + 16)

function StepProgress({ current }) {
  return (
    <nav aria-label="Progress" style={{ position: 'relative', width: '100%' }}>
      {/* Connector from the first step marker to the last, centered on the 20px circles. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: 10, top: 11, width: 0, height: CONNECTOR_LENGTH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img
          src={`${ASSETS}/progress-line.svg`}
          alt=""
          width="293"
          height="1"
          style={{ display: 'block', flexShrink: 0, maxWidth: 'none', width: CONNECTOR_LENGTH, transform: 'rotate(90deg)' }}
        />
      </div>
      <ol style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16, margin: 0, padding: '1px 0', listStyle: 'none' }}>
        {STEPS.map((step, i) => {
          const active = i === current
          const done = i < current
          return (
            <li key={step.id} aria-current={active ? 'step' : undefined} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 100,
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: active || done ? color.actionPrimary : STEP_UPCOMING,
                  color: color.surface,
                  fontSize: 11,
                  lineHeight: '16px',
                  letterSpacing: -0.055,
                }}
              >
                {i + 1}
              </span>
              <span style={{ flex: '1 0 0', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13, fontWeight: 500, lineHeight: '20px', letterSpacing: -0.065, color: active ? TEXT_PRIMARY : TEXT_SECONDARY }}>
                {step.label}
                {done && <span className="sr-only"> (completed)</span>}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0.1, 1] }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z_INDEX,
        isolation: 'isolate',
        display: 'flex',
        flexDirection: 'column',
        padding: 32,
        fontFamily: font.text,
        color: color.text,
        outline: 'none',
      }}
    >
      <div aria-hidden="true" onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 1, background: BACKDROP }} />

      <motion.div
        initial={{ y: 12, scale: 0.99 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 12, scale: 0.99 }}
        transition={{ duration: 0.22, ease: [0.2, 0, 0.1, 1] }}
        style={{
          position: 'relative',
          zIndex: 2,
          flex: '1 0 0',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          padding: 4,
          background: 'rgba(255,255,255,0.72)',
          borderRadius: 12,
          boxShadow: MODAL_SHADOW,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <header style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 24, background: color.surface, borderRadius: radius.lg }}>
          <h2 id={titleId} style={{ margin: 0, fontSize: 15, fontWeight: 600, lineHeight: '20px', letterSpacing: -0.075, color: color.textStrong }}>
            Grow with the Stripe network
            <span className="sr-only">{`: ${step.label}, step ${stepIndex + 1} of ${STEPS.length}`}</span>
          </h2>
          <button
            type="button"
            aria-label="Close"
            title="Close"
            onClick={onClose}
            style={{ display: 'flex', width: 24, height: 24, padding: 0, border: 0, background: 'none', cursor: 'pointer', borderRadius: radius.sm }}
          >
            <img src={`${ASSETS}/close.svg`} alt="" width="24" height="24" style={{ display: 'block' }} />
          </button>
        </header>

        {/* Panels */}
        <div style={{ flex: '1 0 0', minHeight: 0, display: 'flex', gap: 4, background: AREA_FILL, borderRadius: `${radius.lg}px ${radius.lg}px 0 0`, overflow: 'hidden' }}>
          <aside
            style={{
              flexShrink: 0,
              width: 260,
              padding: 24,
              boxSizing: 'border-box',
              background: color.surface,
              borderRadius: `2px ${radius.lg}px ${radius.lg}px ${radius.lg}px`,
              boxShadow: PANEL_SHADOW,
              overflowY: 'auto',
            }}
          >
            <StepProgress current={stepIndex} />
          </aside>

          <section style={{ flex: '1 0 0', minWidth: 0, display: 'flex', flexDirection: 'column', background: color.surface, borderRadius: `${radius.lg}px 0 0 ${radius.lg}px`, overflow: 'hidden' }}>
            <div ref={scrollRef} tabIndex={-1} style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', outline: 'none' }}>
              <FadeSlideIn
                transitionKey={step.id}
                appear
                data-network-onboarding-step={step.id}
                style={{ maxWidth: CONTENT_MAX_WIDTH, margin: '0 auto', padding: '48px 32px 32px', boxSizing: 'content-box' }}
              >
                <StepComponent key={step.id} state={state} setState={setState} onValidChange={onValidChange} />
              </FadeSlideIn>
            </div>

            {/* Footer */}
            <footer style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '16px 24px', background: color.surface }}>
              <div style={{ flex: '1 0 0', minWidth: 0 }}>
                {stepIndex > 0 && (
                  <Button variant="secondary" onClick={() => goTo(stepIndex - 1)} style={{ ...pillButton, background: '#F1F6FB', color: '#142333', outline: 'none' }}>
                    Back
                  </Button>
                )}
              </div>
              <div style={{ flex: '1 0 0', minWidth: 0, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="primary" onClick={handlePrimary} disabled={!valid} style={{ ...pillButton, background: color.actionPrimary }}>
                  {step.primary}
                </Button>
              </div>
            </footer>
          </section>
        </div>
      </motion.div>
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
