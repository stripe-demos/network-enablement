// Network onboarding step 2: Opt in. A short terms summary and one required
// consent checkbox. The footer's "Agree and continue" stays disabled until
// state.consented is true.
import { useEffect } from 'react'
import { BusinessIcon, LinkIcon, SettingsIcon } from '@dashboard/ui'
import { Checkbox, StepHeading } from '../networkControls'
import { ink, text } from '../networkTokens'
import BusinessProfileCard from '../BusinessProfileCard'
import { PLATFORM_PROFILE } from '../platformProfile'

function LockIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.75" y="7" width="10.5" height="7.5" rx="1.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

// What you get leads, so the benefit is the first thing read.
const TERMS = [
  { Icon: LinkIcon, lead: 'You get matched', rest: 'with complementary businesses, and accounts you invite can reuse details they’ve already given Stripe.' },
  { Icon: BusinessIcon, lead: 'Your profile is visible.', rest: 'Businesses on the network see your name, industry and countries served.' },
  { Icon: LockIcon, lead: 'Your connected accounts stay private.', rest: 'Their details are never shared without their permission.' },
  { Icon: SettingsIcon, lead: 'You’re in control.', rest: 'Leave the network at any time.' },
]

function TermIcon({ Icon }) {
  return (
    <span
      aria-hidden="true"
      style={{
        flexShrink: 0,
        width: 32,
        height: 32,
        borderRadius: 8,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: ink.brandTint,
        color: ink.brand,
      }}
    >
      <Icon size={16} />
    </span>
  )
}

export default function OptInStep({ state, setState, onValidChange }) {
  const consented = Boolean(state.consented)

  useEffect(() => {
    onValidChange(consented)
  }, [consented, onValidChange])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <StepHeading title="Join the Stripe network.">
        Share your platform profile to get matched with businesses on Stripe.
      </StepHeading>

      {/* Uniform 24px around the card; the bottom gets 8px more because the card's
          drop shadow (40px down, 20px blur) fills part of that gap and would
          otherwise make it read tighter than the top and sides. */}
      <section
        aria-label="How your profile appears on the network"
        style={{ padding: '24px 24px 32px', background: ink.areaFill, borderRadius: 8 }}
      >
        <BusinessProfileCard {...PLATFORM_PROFILE} width="100%" />
      </section>

      <ul
        aria-label="Stripe network terms summary"
        style={{
          margin: 0,
          padding: 16,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxHeight: 280,
          overflow: 'auto',
          boxSizing: 'border-box',
          border: `1px solid ${ink.divider}`,
          borderRadius: 8,
        }}
      >
        {TERMS.map(({ Icon, lead, rest }) => (
          <li key={lead} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <TermIcon Icon={Icon} />
            <span style={{ ...text.body, paddingTop: 6 }}>
              <span style={text.bodyEmphasized}>{lead}</span> {rest}
            </span>
          </li>
        ))}
      </ul>

      <Checkbox checked={consented} onChange={checked => setState({ consented: checked })}>
        I agree to the{' '}
        <a
          href="#"
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
          }}
          style={{ ...text.link, textDecoration: 'none' }}
        >
          Stripe network terms
        </a>
      </Checkbox>
    </div>
  )
}
