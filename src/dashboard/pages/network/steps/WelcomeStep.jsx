// Network onboarding step 1: Welcome. Sets expectations for the flow and helps
// a new platform decide whether joining the Stripe network is right for it now.
// Static content only; the shell's footer owns the "Get started" button, and
// this step is valid by default.
import { ink, text } from '../networkTokens'
import { StepHeading } from '../networkControls'
import NetworkGlobe from '../NetworkGlobe'

// Mirrors the left progress panel's steps.
const STEPS = [
  { title: 'Opt in to the network', body: 'Review what you share and agree to the terms.' },
  { title: 'Find accounts that fit your platform', body: 'Based on what your platform offers.' },
  { title: 'Invite them to connect', body: 'Choose who to invite.' },
]

const GOOD_FIT = [
  'You’re a new platform with fewer than 4 connected accounts.',
  'You want accounts that onboard faster by reusing their Stripe info.',
  'You’re open to being matched with complementary businesses.',
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
        Setup takes about 2 minutes.
      </StepHeading>

      <Section id="network-welcome-next" label="What happens next">
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

      <Section id="network-welcome-fit" label="It’s a good fit if">
        <ul style={{ ...listReset, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {GOOD_FIT.map(item => (
            <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span aria-hidden="true" style={{ flexShrink: 0, width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 4, height: 4, borderRadius: 9999, background: ink.secondary }} />
              </span>
              <span style={text.body}>{item}</span>
            </li>
          ))}
        </ul>
        <p style={{ ...text.body, margin: 0 }}>Not ready? You can join later from Enablement.</p>
      </Section>
    </div>
  )
}
