// Network onboarding step 1: Welcome. Sets expectations for the flow, with a
// live count of businesses already on the Stripe network. No inputs; the
// shell's footer owns the "Get started" button, and this step is valid by default.
import { ink, text } from '../networkTokens'
import { StepHeading } from '../networkControls'
import NetworkGlobe from '../NetworkGlobe'
import LiveBusinessCount from '../LiveBusinessCount'

// Mirrors the left progress panel's steps.
const STEPS = [
  { title: 'Opt in to the network', body: 'Review what you share and agree to the terms.' },
  { title: 'Get matched with businesses', body: 'See businesses that fit your platform, based on your business description.' },
  { title: 'Invite them to connect', body: 'Grow your platform with accounts that can start accepting payments sooner.' },
]

const listReset = { margin: 0, padding: 0, listStyle: 'none' }

function StepNumber({ n }) {
  return (
    <span
      aria-hidden="true"
      style={{
        flexShrink: 0,
        width: 20,
        height: 20,
        borderRadius: 9999,
        background: ink.areaFill,
        border: `1px solid ${ink.divider}`,
        boxSizing: 'border-box',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 500,
        lineHeight: '16px',
        color: ink.secondary,
      }}
    >
      {n}
    </span>
  )
}

function Section({ id, label, children }) {
  return (
    <section aria-labelledby={id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 id={id} style={{ ...text.bodyEmphasized, margin: 0 }}>{label}</h2>
      {children}
    </section>
  )
}

export default function WelcomeStep() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <NetworkGlobe />

      <StepHeading title="Find your first connected accounts on the Stripe network.">
        Grow with <LiveBusinessCount /> businesses already on the Stripe network.
      </StepHeading>

      <Section id="network-welcome-next" label="What to expect">
        <ol style={{ ...listReset, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {STEPS.map((step, i) => (
            <li key={step.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <StepNumber n={i + 1} />
              <span style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={text.bodyEmphasized}>{step.title}</span>
                <span style={text.body}>{step.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  )
}
