// The one mounted Connect setup dialog and its step flow (ported from
// connect-onboarding prototype4's App.jsx). Open it with openConnectSetup()
// (Home's setup guide) or a `?connect-setup=1` link (the Network enablement
// landing page). The config, agreements, business details and completion live
// in connectSetupStore.js, so they survive closing the dialog; finishing lands
// on Enablement, whose network onboarding ranks against the saved description.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import SetupConnectDialog from './components/SetupConnectDialog'
import SetupButton from './components/SetupButton'
import ThinkingCloud from './components/ThinkingCloud'
import StepWaiver from './components/StepWaiver'
import useDescriptionAnalysis from './components/useDescriptionAnalysis'
import StepDescribe from './steps/StepDescribe'
import StepReview from './steps/StepReview'
import StepBuild from './steps/StepBuild'
import { BUSINESS } from './data/business'
import { RECOMMENDED } from './data/config'
import { applicableWaivers } from './data/waivers'
import { LOADING_LINES } from './data/loadingLines'
import { buildPrompt } from './data/promptTemplate'
import { acknowledgeWaiver, applyConfig, completeSetup, setBusiness, updateSetting, useConnectSetup } from './connectSetupStore'
import { CLOSE_CONNECT_SETUP_EVENT, OPEN_CONNECT_SETUP_EVENT, openConnectSetup } from './openConnectSetup'

const LINK_PARAM = 'connect-setup'
// The params NetworkOnboardingHost applies and drops (see the deep link below).
const NETWORK_LINK_PARAMS = ['network-onboarding', 'network-accounts', 'prototype-reset']

// The "Skip" escape hatch on step 1 drops the user onto a standard platform
// preset instead of the guided flow: direct charges, Stripe-hosted onboarding,
// Express dashboards, Stripe-owned liability, and connected accounts paying fees.
const PLATFORM_DEFAULT = {
  onboardingMethod: 'stripe-hosted',
  dashboardAccess: 'express',
  chargeType: 'direct',
  feeCollection: 'connected-accounts',
  negativeBalanceLiability: 'stripe',
}

const STEPS = [
  { number: 1, label: 'Describe your business' },
  { number: 2, label: 'Review setup' },
  { number: 3, label: 'Build your integration' },
]

export default function ConnectSetupHost() {
  const navigate = useNavigate()
  const { config, setupComplete, acknowledgedWaivers, business } = useConnectSetup()
  const { website, description } = business

  const [dialogOpen, setDialogOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  // The dynamic waiver flow lives between Review setup and Build. `waiverIndex`
  // is the active waiver (null when not in the waiver flow). Acknowledgements
  // are recorded in the store on Continue; `waiverChecks` holds the checkbox
  // state in between, keyed by id, and falls back to the store when unset.
  const [waiverIndex, setWaiverIndex] = useState(null)
  const [waiverChecks, setWaiverChecks] = useState({})
  // True when the user reached Review setup via "Skip" — Review shows different
  // copy since nothing was inferred from a business description.
  const [skippedSetup, setSkippedSetup] = useState(false)
  // The final "Build your integration" step gates "View Dashboard" behind doing
  // something with the prompt — copying it, emailing it, or opening the guide.
  // Taking any of those also marks the last rail step complete.
  const [buildActionTaken, setBuildActionTaken] = useState(false)
  // A staged attachment counts as intent on its own: the design keeps the textarea
  // empty yet satisfies both checks and enables Continue.
  const [fileIntent, setFileIntent] = useState(false)

  const analysis = useDescriptionAnalysis(description, dialogOpen && step === 1 && !loading)
  const checks = fileIntent
    ? analysis.checks.map(check => ({ ...check, satisfied: true }))
    : analysis.checks
  const canContinueFromDescribe = fileIntent || checks.every(check => check.satisfied)
  const isDefaultConfig = useMemo(
    () => Object.keys(RECOMMENDED).every(key => config[key] === RECOMMENDED[key]),
    [config],
  )

  const goToStep = next => {
    setLoading(false)
    setExpandedId(null)
    setWaiverIndex(null)
    setSkippedSetup(false)
    // Describe remounts without its staged file, so the file no longer counts.
    if (next === 1) setFileIntent(false)
    setStep(next)
  }

  // Waivers required by the current config, in display order.
  const waivers = useMemo(() => applicableWaivers(config), [config])
  // The prompt carries what the user actually typed in step 1, falling back to
  // the sample business when a field is empty.
  const prompt = useMemo(
    () =>
      buildPrompt({
        business: {
          ...BUSINESS,
          description: description.trim() || BUSINESS.description,
          website: website.trim() || BUSINESS.website,
        },
        config,
        waivers,
      }),
    [config, description, website, waivers],
  )
  // `activeWaiver` is the single form on screen.
  const activeWaiver = waiverIndex != null ? waivers[waiverIndex] : null
  const activeWaiverAck = activeWaiver
    ? (waiverChecks[activeWaiver.id] ?? acknowledgedWaivers.includes(activeWaiver.id))
    : false

  // Leaving Review setup: run the waiver flow first when any apply, else Build.
  const continueFromReview = () => {
    setExpandedId(null)
    if (waivers.length > 0) setWaiverIndex(0)
    else goToStep(3)
  }
  const continueFromWaiver = () => {
    acknowledgeWaiver(activeWaiver.id)
    if (waiverIndex < waivers.length - 1) setWaiverIndex(waiverIndex + 1)
    else goToStep(3)
  }
  const backFromWaiver = () => {
    if (waiverIndex > 0) setWaiverIndex(waiverIndex - 1)
    else setWaiverIndex(null)
  }
  // Back from Build re-enters the last waiver when there is one.
  const backFromBuild = () => {
    setLoading(false)
    if (waivers.length > 0) {
      setStep(2)
      setWaiverIndex(waivers.length - 1)
    } else {
      goToStep(2)
    }
  }

  // Rail model: the waivers nest under "Review setup" as sub-steps, so the rail
  // shows progress through them while Review setup stays active.
  const railSteps = useMemo(() => {
    const statusFor = n => (step > n ? 'complete' : step === n ? 'active' : 'upcoming')
    const reviewSubSteps = waivers.map((waiver, i) => {
      let status = 'upcoming'
      if (step > 2) status = 'complete'
      else if (step === 2 && waiverIndex != null) {
        status = i < waiverIndex ? 'complete' : i === waiverIndex ? 'active' : 'upcoming'
      }
      return { label: waiver.navLabel, status }
    })
    // On the final step, taking a build action (copy / email / open guide) flips
    // it from active to complete.
    const buildStatus = step === 3 && buildActionTaken ? 'complete' : statusFor(3)
    return [
      { label: STEPS[0].label, status: statusFor(1) },
      { label: STEPS[1].label, status: statusFor(2), subSteps: reviewSubSteps },
      { label: STEPS[2].label, status: buildStatus },
    ]
  }, [step, waiverIndex, waivers, buildActionTaken])

  const runInference = () => {
    setExpandedId(null)
    setSkippedSetup(false)
    setLoading(true)
  }

  // Step 1 escape hatch: skip describing/inference, apply the standard platform
  // preset, and jump to Review setup.
  const skipSetup = () => {
    setLoading(false)
    setExpandedId(null)
    setWaiverIndex(null)
    setSkippedSetup(true)
    applyConfig({ ...PLATFORM_DEFAULT })
    setStep(2)
  }

  // Opens on Describe your business, or on Review setup once setup is complete,
  // keeping any config already confirmed so Review shows what the user chose.
  // Until setup is complete, each open walks the agreements and the build step
  // again (checkboxes fall back to what the store recorded). Opening an already
  // open dialog leaves it where it is.
  const openSetup = useCallback(() => {
    if (dialogOpen) return
    setLoading(false)
    setExpandedId(null)
    setWaiverIndex(null)
    setSkippedSetup(false)
    setFileIntent(false)
    if (!setupComplete) {
      setWaiverChecks({})
      setBuildActionTaken(false)
    }
    setStep(setupComplete ? 2 : 1)
    setDialogOpen(true)
  }, [dialogOpen, setupComplete])
  const close = useCallback(() => setDialogOpen(false), [])

  useEffect(() => {
    window.addEventListener(OPEN_CONNECT_SETUP_EVENT, openSetup)
    window.addEventListener(CLOSE_CONNECT_SETUP_EVENT, close)
    return () => {
      window.removeEventListener(OPEN_CONNECT_SETUP_EVENT, openSetup)
      window.removeEventListener(CLOSE_CONNECT_SETUP_EVENT, close)
    }
  }, [openSetup, close])

  // Applies a deep link once, then drops its param so a reload doesn't reopen
  // it. Waits for the network host to apply and drop its own params first: a
  // link's `prototype-reset=1` must run before the dialog opens, and two hosts
  // editing the query in one pass would overwrite each other.
  const [searchParams, setSearchParams] = useSearchParams()
  const linked = searchParams.has(LINK_PARAM)
  const networkLinkPending = NETWORK_LINK_PARAMS.some(param => searchParams.has(param))
  useEffect(() => {
    if (!linked || networkLinkPending) return
    openConnectSetup()
    setSearchParams(params => {
      params.delete(LINK_PARAM)
      return params
    }, { replace: true })
  }, [linked, networkLinkPending, setSearchParams])

  // Finishing lands on Enablement, where the network onboarding picks up from
  // its checklist.
  const finishSetup = () => {
    completeSetup()
    setDialogOpen(false)
    navigate('/connect/enablement')
  }

  const footer = () => {
    if (step === 1) {
      return {
        right: (
          <>
            <SetupButton variant="secondary" size="lg" onClick={skipSetup}>
              Skip
            </SetupButton>
            <SetupButton
              variant="primary"
              size="lg"
              disabled={!canContinueFromDescribe}
              onClick={runInference}
            >
              Continue
            </SetupButton>
          </>
        ),
      }
    }

    // A waiver step: Back walks the waivers/Review setup, Continue is gated on
    // the acknowledgment checkbox.
    if (step === 2 && activeWaiver) {
      return {
        left: (
          <SetupButton variant="secondary" size="lg" onClick={backFromWaiver}>
            Back
          </SetupButton>
        ),
        right: (
          <SetupButton
            variant="primary"
            size="lg"
            disabled={!activeWaiverAck}
            onClick={continueFromWaiver}
          >
            Continue
          </SetupButton>
        ),
      }
    }

    if (step === 2) {
      return {
        left: (
          <SetupButton variant="secondary" size="lg" onClick={() => goToStep(1)}>
            Back
          </SetupButton>
        ),
        right: (
          <>
            <SetupButton
              variant="secondary"
              size="lg"
              icon="refresh"
              disabled={isDefaultConfig}
              onClick={() => applyConfig({ ...RECOMMENDED })}
            >
              Reset to defaults
            </SetupButton>
            <SetupButton variant="primary" size="lg" onClick={continueFromReview}>
              Continue
            </SetupButton>
          </>
        ),
      }
    }

    return {
      left: (
        <SetupButton variant="secondary" size="lg" onClick={backFromBuild}>
          Back
        </SetupButton>
      ),
      right: (
        <SetupButton
          variant="primary"
          size="lg"
          disabled={!buildActionTaken}
          onClick={finishSetup}
        >
          View Dashboard
        </SetupButton>
      ),
    }
  }

  const body = () => {
    if (loading) {
      return (
        <ThinkingCloud
          lines={LOADING_LINES}
          onDone={() => {
            setLoading(false)
            setStep(2)
          }}
        />
      )
    }

    if (step === 1) {
      return (
        <StepDescribe
          businessName={BUSINESS.name}
          website={website}
          onWebsiteChange={value => setBusiness({ website: value })}
          description={description}
          onDescriptionChange={value => setBusiness({ description: value })}
          checks={checks}
          analysis={analysis}
          onFileIntentChange={setFileIntent}
        />
      )
    }

    if (step === 2 && activeWaiver) {
      return (
        <StepWaiver
          waiver={activeWaiver}
          acknowledged={activeWaiverAck}
          onAcknowledgedChange={checked =>
            setWaiverChecks(prev => ({ ...prev, [activeWaiver.id]: checked }))
          }
        />
      )
    }

    if (step === 2) {
      return (
        <StepReview
          config={config}
          skipped={skippedSetup}
          onConfigChange={(settingId, value) => updateSetting(settingId, value)}
          expandedId={expandedId}
          onToggleExpanded={settingId =>
            setExpandedId(prev => (prev === settingId ? null : settingId))
          }
        />
      )
    }

    return <StepBuild prompt={prompt} onActionTaken={() => setBuildActionTaken(true)} />
  }

  if (!dialogOpen) return null

  const { left: footerLeft = null, right: footerRight = null } = loading ? {} : footer()

  return (
    <SetupConnectDialog
      steps={railSteps}
      showRail={!loading}
      showFooter={!loading}
      transitionKey={loading ? 'loading' : waiverIndex != null ? `waiver-${waiverIndex}` : `step-${step}`}
      onClose={close}
      footerLeft={footerLeft}
      footerRight={footerRight}
    >
      {body()}
    </SetupConnectDialog>
  )
}
