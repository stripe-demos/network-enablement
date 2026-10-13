// Network onboarding step 2: Opt in. A short terms summary and one required
// consent checkbox. The footer's "Agree and continue" stays disabled until
// state.consented is true.
import { useEffect } from 'react'
import { ChoiceRow, StepHeading } from '../networkControls'
import { ink, text } from '../networkTokens'

const TERMS = [
  { lead: 'Your profile is visible.', rest: 'Businesses on the network see your name, industry and countries served.' },
  { lead: 'You get matched', rest: 'with complementary businesses, and accounts you invite can reuse details they’ve already given Stripe.' },
  { lead: 'Your connected accounts stay private.', rest: 'Their details are never shared without their permission.' },
  { lead: 'You’re in control.', rest: 'Leave the network at any time.' },
]

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

      <ul
        aria-label="Stripe network terms summary"
        style={{
          margin: 0,
          padding: 16,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxHeight: 240,
          overflow: 'auto',
          boxSizing: 'border-box',
          border: `1px solid ${ink.divider}`,
          borderRadius: 8,
        }}
      >
        {TERMS.map(({ lead, rest }) => (
          <li key={lead} style={text.body}>
            <span style={text.bodyEmphasized}>{lead}</span> {rest}
          </li>
        ))}
      </ul>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <ChoiceRow
          type="checkbox"
          checked={consented}
          onChange={checked => setState({ consented: checked })}
          title="I agree to the Stripe network terms"
          description="Including sharing my platform profile on the network."
        />
        <a href="#" onClick={e => e.preventDefault()} style={{ ...text.link, textDecoration: 'none', alignSelf: 'flex-start' }}>
          Read the full Stripe network terms
        </a>
      </div>
    </div>
  )
}
