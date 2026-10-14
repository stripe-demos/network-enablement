// Enablement "Get more from your platform" checklist (Figma 11038:39006,
// "Recommended"). Each row links to the page that completes the step; the
// Stripe network row opens the network onboarding dialog instead, and shows as
// done once the dialog has been completed (it can still be reopened).
import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircleIcon, color, type, radius, tokens } from '@dashboard/ui'
import NetworkOnboarding from '../network/NetworkOnboarding'
import { isNetworkOnboardingComplete, saveNetworkOnboarding, useNetworkOnboarding } from '../network/networkInvites'

const ASSETS = '/dashboard-assets/enablement'

const ITEMS = [
  { id: 'network', opensNetwork: true, before: 'Onboard faster with accounts already on the ', highlight: 'Stripe network', after: '' },
  { id: 'capital', to: '/connect/capital', before: 'Add capabilities like ', highlight: 'Capital and Treasury', after: ' to your connected accounts' },
  { id: 'apps', to: '/apps', before: 'Supercharge your platform with ', highlight: 'prebuilt skills and agents', after: ' from Platform Apps' },
]

const text = { ...type.bodySmall, lineHeight: '18px' }

function ChecklistRow({ item, onOpenNetwork, done = false }) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const Row = item.opensNetwork ? 'button' : Link
  const rowProps = item.opensNetwork ? { type: 'button', onClick: onOpenNetwork } : { to: item.to }
  return (
    <Row
      {...rowProps}
      data-wireframe-frame="card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={e => setFocused(e.currentTarget.matches(':focus-visible'))}
      onBlur={() => setFocused(false)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        padding: 16,
        background: hovered ? color.neutral25 : color.surface,
        border: `1px solid ${hovered ? color.borderDefault : color.neutral50}`,
        borderRadius: radius.lg,
        outline: 'none',
        boxShadow: focused ? `0 0 0 2px ${color.surface}, 0 0 0 4px ${color.brand500}` : 'none',
        textDecoration: 'none',
        width: '100%',
        textAlign: 'left',
        font: 'inherit',
        cursor: 'pointer',
        transition: `background ${tokens.ease.fast}, border-color ${tokens.ease.fast}`,
      }}
    >
      <span style={{ ...text, flex: '1 0 0', minWidth: 0, color: color.textStrong }}>
        {item.before}
        <span style={{ color: color.actionPrimary }}>{item.highlight}</span>
        {item.after}
      </span>
      {done ? (
        <span aria-label="Done" role="img" style={{ display: 'inline-flex', flexShrink: 0, color: color.brand500 }}>
          <CheckCircleIcon size={20} />
        </span>
      ) : (
        <img src={`${ASSETS}/progress-ring-0.svg`} alt="" style={{ display: 'block', flexShrink: 0 }} />
      )}
    </Row>
  )
}

export default function GoLiveChecklist() {
  const [networkOpen, setNetworkOpen] = useState(false)
  const onboarding = useNetworkOnboarding()
  const networkDone = isNetworkOnboardingComplete(onboarding)
  const openNetwork = useCallback(() => setNetworkOpen(true), [])
  const closeNetwork = useCallback(() => setNetworkOpen(false), [])
  const completeNetwork = useCallback(({ optedIn, selectedAccountIds }) => {
    saveNetworkOnboarding({ optedIn, selectedAccountIds })
    setNetworkOpen(false)
  }, [])

  return (
    <section
      aria-label="Go live checklist"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: 4,
        borderRadius: radius.lg,
        overflow: 'hidden',
      }}
    >
      {/* Gradient wash, positioned and flipped as in Figma. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: -141.23,
          top: -74,
          width: 1265.603,
          height: 358.615,
          transform: 'rotate(180deg) scaleY(-1)',
          pointerEvents: 'none',
        }}
      >
        <img
          src={`${ASSETS}/checklist-gradient.svg`}
          alt=""
          style={{ position: 'absolute', left: '-18.33%', top: '-64.69%', display: 'block', maxWidth: 'none' }}
        />
      </div>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
        <img src={`${ASSETS}/checklist-flag.svg`} alt="" style={{ display: 'block', flexShrink: 0 }} />
        <span style={{ ...text, color: color.actionPrimary }}>Get more from your platform</span>
      </div>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {ITEMS.map(item => <ChecklistRow key={item.id} item={item} onOpenNetwork={openNetwork} done={item.opensNetwork && networkDone} />)}
      </div>
      <NetworkOnboarding open={networkOpen} onClose={closeNetwork} onComplete={completeNetwork} />
    </section>
  )
}
