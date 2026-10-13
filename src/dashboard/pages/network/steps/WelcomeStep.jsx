// Network onboarding step 1: Welcome. Explains what the Stripe network does
// for a newly onboarded Connect platform. Static content only; the shell's
// footer owns the "Get started" button, and this step is valid by default.
import {
  BusinessIcon, DocumentIcon, PayoutIcon, SailChevronRightIcon, color, font, radius, type,
} from '@dashboard/ui'

const BENEFITS = [
  {
    Icon: BusinessIcon,
    title: 'Find businesses that fit your platform',
    body: 'Discover businesses already on Stripe that match your industry, location and the services you offer.',
  },
  {
    Icon: DocumentIcon,
    title: 'Onboard accounts with less work',
    body: 'Businesses can reuse details they’ve already provided to Stripe, so there are fewer forms and fewer steps to connect.',
  },
  {
    Icon: PayoutIcon,
    title: 'Reach your first payments sooner',
    body: 'Accounts that reuse their Stripe info are much more likely to get payouts enabled, so you can go live faster.',
  },
]

const STEPS = [
  { title: 'Join the network', body: 'Share your business profile' },
  { title: 'Find accounts', body: 'See businesses that fit your platform' },
  { title: 'Invite them to connect', body: 'They onboard with their Stripe info' },
]

const STATS = [
  { value: '84%', label: 'of accounts that reuse their Stripe info get payouts enabled', fill: color.brand500 },
  { value: '12%', label: 'of accounts that start from scratch get payouts enabled', fill: color.neutral300 },
]

// Network diagram geometry (px, in a DIAGRAM x DIAGRAM box).
const DIAGRAM = 320
const CENTER = DIAGRAM / 2
const ORBIT = 118
const NODES = [
  { angle: -90, connected: true },
  { angle: -30, connected: true },
  { angle: 30, connected: false },
  { angle: 90, connected: true },
  { angle: 150, connected: false },
  { angle: 210, connected: false },
].map(n => {
  const rad = (n.angle * Math.PI) / 180
  return { ...n, x: CENTER + ORBIT * Math.cos(rad), y: CENTER + ORBIT * Math.sin(rad) }
})

const iconTile = {
  width: 32,
  height: 32,
  borderRadius: radius.lg,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  background: color.brand50,
  color: color.actionPrimary,
}

function NetworkDiagram() {
  return (
    <figure
      data-wireframe-frame="card"
      style={{
        margin: 0,
        padding: 24,
        borderRadius: radius.xl,
        background: color.wellBackground,
        border: `1px solid ${color.neutral50}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div aria-hidden="true" style={{ position: 'relative', width: DIAGRAM, height: DIAGRAM, maxWidth: '100%' }}>
        <svg width={DIAGRAM} height={DIAGRAM} viewBox={`0 0 ${DIAGRAM} ${DIAGRAM}`} style={{ position: 'absolute', inset: 0 }}>
          <circle cx={CENTER} cy={CENTER} r={ORBIT} fill="none" stroke={color.neutral100} strokeDasharray="2 6" />
          {NODES.map(n => (
            <line
              key={n.angle}
              x1={CENTER}
              y1={CENTER}
              x2={n.x}
              y2={n.y}
              stroke={n.connected ? color.brand300 : color.neutral100}
              strokeWidth={n.connected ? 1.5 : 1}
              strokeDasharray={n.connected ? undefined : '4 4'}
            />
          ))}
        </svg>

        {NODES.map(n => (
          <span
            key={n.angle}
            style={{
              position: 'absolute',
              left: n.x - 20,
              top: n.y - 20,
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: color.surface,
              color: n.connected ? color.actionPrimary : color.neutral400,
              boxShadow: `inset 0 0 0 1px ${n.connected ? color.brand300 : color.neutral100}`,
            }}
          >
            <BusinessIcon size={16} />
          </span>
        ))}

        <span
          style={{
            position: 'absolute',
            left: CENTER - 44,
            top: CENTER - 44,
            width: 88,
            height: 88,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            background: color.brand500,
            color: '#FFFFFF',
            boxShadow: `0 0 0 8px ${color.brand50}`,
            ...type.caption,
            fontWeight: 600,
            lineHeight: '14px',
          }}
        >
          Your
          <br />
          platform
        </span>
      </div>

      <figcaption style={{ ...type.caption, textAlign: 'center', maxWidth: 280 }}>
        Millions of businesses already run on Stripe. Joining puts your platform in front of the ones that fit.
      </figcaption>
    </figure>
  )
}

function BenefitCard({ Icon, title, body }) {
  return (
    <li
      data-wireframe-frame="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 20,
        borderRadius: radius.lg,
        border: `1px solid ${color.neutral50}`,
        background: color.surface,
      }}
    >
      <span aria-hidden="true" style={iconTile}><Icon size={16} /></span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h3 style={{ ...type.label, margin: 0 }}>{title}</h3>
        <p style={{ ...type.body, margin: 0, color: color.subdued }}>{body}</p>
      </div>
    </li>
  )
}

function StatStrip() {
  return (
    <section
      aria-labelledby="network-welcome-stats"
      data-wireframe-frame="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 24,
        borderRadius: radius.lg,
        background: color.wellBackground,
        border: `1px solid ${color.neutral50}`,
      }}
    >
      <h2 id="network-welcome-stats" style={{ ...type.subsectionTitle, margin: 0 }}>
        Reusing Stripe info helps accounts get set up
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
        {STATS.map(s => (
          <div key={s.value} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontFamily: font.display, fontSize: 32, fontWeight: 700, lineHeight: '40px', color: color.textHeading, fontFeatureSettings: '"lnum" 1, "tnum" 1' }}>
                {s.value}
              </span>
              <span style={{ ...type.body, color: color.subdued }}>{s.label}</span>
            </p>
            <div aria-hidden="true" style={{ height: 6, borderRadius: radius.pill, background: color.neutral50, overflow: 'hidden' }}>
              <div style={{ width: s.value, height: '100%', borderRadius: radius.pill, background: s.fill }} />
            </div>
          </div>
        ))}
      </div>
      <p style={{ ...type.caption, margin: 0 }}>Based on Stripe internal data on accounts that start onboarding.</p>
    </section>
  )
}

function HowItWorks() {
  return (
    <section aria-labelledby="network-welcome-how" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 id="network-welcome-how" style={{ ...type.subsectionTitle, margin: 0 }}>How it works</h2>
      <ol style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, margin: 0, padding: 0, listStyle: 'none' }}>
        {STEPS.map((s, i) => (
          <li key={s.title} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {i > 0 && (
              <span aria-hidden="true" style={{ display: 'inline-flex', color: color.neutral300 }}>
                <SailChevronRightIcon size={12} />
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...type.caption,
                  fontWeight: 600,
                  color: color.actionPrimary,
                  background: color.brand50,
                }}
              >
                {i + 1}
              </span>
              <span style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={type.label}>{s.title}</span>
                <span style={type.caption}>{s.body}</span>
              </span>
            </span>
          </li>
        ))}
      </ol>
      <p style={{ ...type.body, margin: 0, color: color.subdued }}>
        It works both ways: the profile you share helps the network grow, and helps other businesses find and connect with you.
      </p>
    </section>
  )
}

export default function WelcomeStep() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      {/* Hero */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', alignItems: 'center', gap: 48 }}>
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h1 style={{ ...type.pageTitle, margin: 0 }}>Grow faster with the Stripe network</h1>
            <p style={{ ...type.metricMedium, margin: 0 }}>
              Find businesses already on Stripe that fit your platform, and help them start accepting payments with you sooner.
            </p>
          </div>
        </div>
        <NetworkDiagram />
      </div>

      {/* Benefits */}
      <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, margin: 0, padding: 0, listStyle: 'none' }}>
        {BENEFITS.map(b => <BenefitCard key={b.title} {...b} />)}
      </ul>

      <StatStrip />

      <HowItWorks />
    </div>
  )
}
