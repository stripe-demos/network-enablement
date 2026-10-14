// Prototype panel section: Stripe network onboarding (step 3 version, start
// step, reset the demo). Every toggle acts at once: it opens the onboarding
// dialog on that step, or moves an open dialog there, so there's no separate
// "Open" button. Clicking the selected toggle again re-triggers it. The dialog
// opens beneath the panel (the panel has the higher z-index) and focus stays
// on the toggle.
import { useId, useRef } from 'react'
import { FIND_ACCOUNTS_VARIANTS } from '../pages/network/steps/findAccountsVariants'
import { invitedAccountIds, isNetworkOnboardingComplete, resetNetworkOnboarding, useNetworkOnboarding } from '../pages/network/networkInvites'
import { closeNetworkOnboarding, openNetworkOnboarding } from '../pages/network/openNetworkOnboarding'
import { resetNetworkPrototypeControls, useNetworkPrototypeControls, writeNetworkPrototypeControls } from './networkPrototypeControls'

const START_STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'opt-in', label: 'Opt in' },
  { id: 'find-accounts', label: 'Find accounts' },
]

// Short names for the toggles; the full label stays as the tooltip, the
// accessible name and the hint under the group. Unknown ids fall back to
// splitting "A · Long name" on the dot.
const VARIANT_SHORT_NAMES = { deck: 'Swipe', cards: 'Cards' }

function splitVariantLabel(variant) {
  const [letter, ...rest] = variant.label.split(' · ')
  const full = rest.join(' · ') || variant.label
  return { letter: rest.length ? letter : '', short: VARIANT_SHORT_NAMES[variant.id] ?? full, full }
}

const ARROW_STEP = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }

function showStep(initialStep) {
  openNetworkOnboarding({ initialStep, keepFocus: true })
}

function resetDemo() {
  closeNetworkOnboarding()
  resetNetworkOnboarding()
  resetNetworkPrototypeControls()
}

export default function NetworkOnboardingPrototypeSection() {
  const fieldId = useId()
  const variantRefs = useRef([])
  const { findAccountsVariant, startStep } = useNetworkPrototypeControls()
  const selectedIndex = Math.max(0, FIND_ACCOUNTS_VARIANTS.findIndex(v => v.id === findAccountsVariant))
  const selectedVariant = splitVariantLabel(FIND_ACCOUNTS_VARIANTS[selectedIndex])

  // One toggle is always on, so arrows (and Home/End) move focus and the
  // selection together, like a segmented control. Choosing a version shows it
  // on step 3; an open dialog switches live (FindAccountsVariantStep subscribes).
  function selectVariant(index) {
    writeNetworkPrototypeControls({ findAccountsVariant: FIND_ACCOUNTS_VARIANTS[index].id, startStep: 'find-accounts' })
    showStep('find-accounts')
  }

  function selectStartStep(id) {
    writeNetworkPrototypeControls({ startStep: id })
    showStep(id)
  }

  function onVariantKeyDown(event) {
    const count = FIND_ACCOUNTS_VARIANTS.length
    let next
    if (event.key in ARROW_STEP) next = (selectedIndex + ARROW_STEP[event.key] + count) % count
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = count - 1
    else return
    event.preventDefault()
    selectVariant(next)
    variantRefs.current[next]?.focus()
  }

  const onboarding = useNetworkOnboarding()
  const done = isNetworkOnboardingComplete(onboarding)
  const invites = invitedAccountIds(onboarding).length

  return (
    <>
      <div className="dash-proto-panel__field">
        <span className="dash-proto-panel__label" id={`${fieldId}-variant`}>Step 3 version</span>
        <div
          className="dash-proto-panel__segmented"
          role="group"
          aria-labelledby={`${fieldId}-variant`}
          aria-describedby={`${fieldId}-variant-hint`}
          onKeyDown={onVariantKeyDown}
        >
          {FIND_ACCOUNTS_VARIANTS.map((variant, index) => {
            const { letter, short } = splitVariantLabel(variant)
            const pressed = index === selectedIndex
            return (
              <button
                key={variant.id}
                ref={node => { variantRefs.current[index] = node }}
                type="button"
                aria-pressed={pressed}
                aria-label={variant.label}
                title={variant.label}
                tabIndex={pressed ? 0 : -1}
                className="dash-proto-panel__segment"
                onClick={() => selectVariant(index)}
              >
                {letter && <span className="dash-proto-panel__segment-prefix" aria-hidden="true">{letter}</span>}
                {short}
              </button>
            )
          })}
        </div>
        <p className="dash-proto-panel__hint" id={`${fieldId}-variant-hint`}>
          {selectedVariant.letter ? `${selectedVariant.letter} · ` : ''}{selectedVariant.full}
        </p>
      </div>

      <div className="dash-proto-panel__field">
        <span className="dash-proto-panel__label" id={`${fieldId}-start`}>Start on step</span>
        <div className="dash-proto-panel__segmented" role="group" aria-labelledby={`${fieldId}-start`}>
          {START_STEPS.map(step => (
            <button
              key={step.id}
              type="button"
              aria-pressed={startStep === step.id}
              className="dash-proto-panel__segment"
              onClick={() => selectStartStep(step.id)}
            >
              {step.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dash-proto-panel__actions">
        <button type="button" className="dash-proto-panel__button" onClick={resetDemo} aria-describedby={`${fieldId}-reset-hint`}>
          Reset network demo
        </button>
      </div>
      <p className="dash-proto-panel__hint" id={`${fieldId}-reset-hint`}>
        Closes the dialog, clears the result and sets these controls back to Swipe and Welcome.
      </p>
      <p className="dash-proto-panel__hint" aria-live="polite">
        {done ? `Status: completed · ${invites} ${invites === 1 ? 'invite' : 'invites'}` : 'Status: not completed'}
      </p>
    </>
  )
}
