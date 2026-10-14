// Network page before the user has joined the Stripe network (no completed
// onboarding, or completed but opted out). Laid out after Figma "Screen" in
// Sally's Sandbox (node 329:47023): a large headline, pill button and supporting
// points on the left (centered vertically), and a tall hero panel on the right
// (here, the whole turning network globe), filling the viewport's height. The button opens the shared onboarding
// dialog (NetworkOnboardingHost). Once the user opts in and finishes,
// NetworkTab shows the list views instead.
import { color } from '@dashboard/ui'
import { ink, text } from './networkTokens'
import NetworkGlobe from './NetworkGlobe'
import LiveBusinessCount from './LiveBusinessCount'
import { openNetworkOnboarding } from './openNetworkOnboarding'

// Fill the viewport under the toolbar (60px), the main area's bottom padding
// (48px) and the developers bar (48px), with the page's own 32px top padding.
const PAGE_HEIGHT = 'calc(100vh - 156px)'
const MIN_HEIGHT = 560
const ARROW = '/dashboard-assets/network/arrow-right.svg'

const VALUE_POINTS = [
  { title: 'Find businesses on Stripe', body: 'Get matched with businesses that fit your platform.' },
  { title: 'Already verified', body: 'They’ve completed Stripe onboarding, so they can start sooner.' },
  { title: 'Invite them to connect', body: 'Send invites and track them here as they join your platform.' },
]

const listReset = { margin: 0, padding: 0, listStyle: 'none' }

/** Pill button with a trailing arrow (Figma "Get started with Payments"). */
function JoinButton() {
  return (
    <button
      type="button"
      onClick={() => openNetworkOnboarding()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 40,
        padding: '0 18px',
        border: 0,
        borderRadius: 9999,
        background: color.actionPrimary,
        color: '#FFFFFF',
        fontFamily: 'inherit',
        fontSize: 14,
        fontWeight: 500,
        lineHeight: '20px',
        cursor: 'pointer',
      }}
    >
      Join the network
      <span
        aria-hidden="true"
        style={{
          width: 12,
          height: 12,
          backgroundColor: 'currentColor',
          maskImage: `url("${ARROW}")`,
          WebkitMaskImage: `url("${ARROW}")`,
          maskSize: '12px 12px',
          WebkitMaskSize: '12px 12px',
        }}
      />
    </button>
  )
}

/** optedOut: the user finished onboarding but declined; shows a short note. */
export default function NetworkLanding({ optedOut = false }) {
  return (
    <section
      aria-labelledby="network-landing-title"
      style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.8fr) minmax(0, 1fr)', gap: 48, height: PAGE_HEIGHT, minHeight: MIN_HEIGHT, boxSizing: 'border-box', paddingTop: 32 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 40, minWidth: 0, paddingLeft: 40 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 20 }}>
          <h1
            id="network-landing-title"
            style={{ margin: 0, maxWidth: 420, fontSize: 40, fontWeight: 500, lineHeight: 1.1, letterSpacing: -0.4, color: ink.primary }}
          >
            Join the Stripe network
          </h1>
          <p style={{ ...text.body, fontSize: 15, lineHeight: '22px', margin: 0, maxWidth: 400 }}>
            Find and invite from <LiveBusinessCount /> businesses already on Stripe.
          </p>
          {optedOut && (
            <p style={{ ...text.body, margin: 0 }}>You opted out of the network. You can join anytime.</p>
          )}
          <JoinButton />
        </div>

        <ul style={{ ...listReset, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
          {VALUE_POINTS.map(point => (
            <li key={point.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span
                aria-hidden="true"
                style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 9999, background: ink.brandTint, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <path d="M2 5.2 4 7.2 8 2.8" fill="none" stroke={ink.brand} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={text.bodyEmphasized}>{point.title}</span>
                <span style={text.body}>{point.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div data-wireframe-frame="card" style={{ position: 'relative', minWidth: 0, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <NetworkGlobe height="fill" full legend />
        </div>
      </div>
    </section>
  )
}
