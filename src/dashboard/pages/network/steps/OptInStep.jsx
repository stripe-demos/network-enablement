// Network onboarding step 2: Opt in. Explains the give-and-get, lets the
// platform choose what to share (with a live preview of its network profile)
// and collects explicit consent. The footer's "Agree and continue" stays
// disabled until the consent checkbox is ticked.
//
// state.shareSettings keys: businessProfile (always on), industryAndCountries,
// businessTypes, volumeRange, discoverable. state.consented holds the checkbox.
import { useEffect } from 'react'
import {
  Badge, BusinessIcon, Checkbox, Divider, Icon, LinkIcon, StarIcon, Switch, color, radius, type,
} from '@dashboard/ui'

const DEFAULT_SHARE_SETTINGS = {
  businessProfile: true,
  industryAndCountries: true,
  businessTypes: true,
  volumeRange: false,
  discoverable: true,
}

const SHARE_OPTIONS = [
  { key: 'businessProfile', label: 'Business profile', description: 'Your business name, logo and website. Required to join.', required: true },
  { key: 'industryAndCountries', label: 'Industry and countries served', description: 'Helps us match you with businesses in your market.' },
  { key: 'businessTypes', label: 'Types of businesses you serve', description: 'Shows businesses whether your platform is a fit for them.' },
  { key: 'volumeRange', label: 'Approximate volume range', description: 'A broad range, never exact figures.' },
  { key: 'discoverable', label: 'Let businesses find and contact you', description: 'Appear in network search and receive connection requests.' },
]

// Simulated profile for the sample account.
const PLATFORM = {
  name: 'Rocketrides',
  website: 'rocketrides.io',
  industry: 'E-commerce · Online storefronts',
  countries: 'United States, United Kingdom, Canada, Australia',
  businessTypes: ['Apparel brands', 'Beauty and wellness', 'Home goods'],
  volumeRange: '$10M–$50M annual volume',
}

function GlobeIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1.5 8h13M8 1.25c1.9 2 2.75 4.25 2.75 6.75S9.9 12.75 8 14.75C6.1 12.75 5.25 10.5 5.25 8S6.1 3.25 8 1.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function SearchIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function LockIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.75" y="6.75" width="10.5" height="8" rx="1.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.25 6.75V4.5a2.75 2.75 0 0 1 5.5 0v2.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

const SHARE_ITEMS = [
  { icon: <BusinessIcon />, title: 'Your business profile', description: 'Name, logo and website, so others can recognize you.' },
  { icon: <GlobeIcon />, title: 'Where and who you serve', description: 'Your industry, countries served and the types of businesses on your platform.' },
  { icon: <Icon name="barChart12" size={16} />, title: 'Your approximate size', description: 'Only if you choose to, as a broad volume range.' },
]

const GET_ITEMS = [
  { icon: <StarIcon />, title: 'Matches with complementary businesses', description: 'Meet businesses already on Stripe that fit your platform, not competitors for your accounts.' },
  { icon: <SearchIcon />, title: 'Discovery by new businesses', description: 'Get found by businesses looking for a platform like yours.' },
  { icon: <LinkIcon />, title: 'Faster onboarding', description: 'Accounts you invite can connect by reusing information they’ve already verified with Stripe.' },
]

function BenefitList({ title, items }) {
  return (
    <section
      className="flex flex-col"
      style={{ gap: 16, padding: 24, border: `1px solid ${color.borderDefault}`, borderRadius: radius.lg }}
    >
      <h2 style={{ ...type.subsectionTitle, margin: 0 }}>{title}</h2>
      <ul className="flex flex-col" style={{ gap: 16, margin: 0, padding: 0, listStyle: 'none' }}>
        {items.map(item => (
          <li key={item.title} className="flex" style={{ gap: 12 }}>
            <span
              className="inline-flex items-center justify-center"
              style={{ width: 32, height: 32, flex: 'none', borderRadius: radius.md, background: color.brand50, color: color.brand500 }}
            >
              {item.icon}
            </span>
            <div className="flex flex-col" style={{ gap: 2 }}>
              <span style={type.label}>{item.title}</span>
              <span style={{ ...type.bodySmall, color: color.subdued }}>{item.description}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ShareToggleRow({ option, checked, onChange }) {
  return (
    <div className="flex items-start" style={{ gap: 16, padding: '16px 0' }}>
      <div className="flex flex-1 flex-col" style={{ gap: 2, minWidth: 0 }}>
        <span className="flex items-center" style={{ ...type.label, gap: 8 }}>
          {option.label}
          {option.required && <Badge>Required</Badge>}
        </span>
        <span style={{ ...type.bodySmall, color: color.subdued }}>{option.description}</span>
      </div>
      <div style={{ paddingTop: 2 }}>
        <Switch label={option.label} hideLabel checked={checked} disabled={option.required} onChange={onChange} />
      </div>
    </div>
  )
}

function PreviewField({ label, children }) {
  return (
    <div className="flex flex-col" style={{ gap: 2 }}>
      <span style={type.caption}>{label}</span>
      <span style={type.bodySmall}>{children}</span>
    </div>
  )
}

function NetworkProfilePreview({ settings }) {
  return (
    <div className="flex flex-col" style={{ gap: 8 }}>
      <span style={{ ...type.caption, fontWeight: 600 }}>How your platform appears in the network</span>
      <div
        aria-live="polite"
        className="flex flex-col"
        style={{ gap: 16, padding: 20, background: color.surface, border: `1px solid ${color.borderDefault}`, borderRadius: radius.lg }}
      >
        <div className="flex items-center" style={{ gap: 12 }}>
          <span
            aria-hidden="true"
            className="inline-flex items-center justify-center"
            style={{ width: 40, height: 40, flex: 'none', borderRadius: radius.lg, background: '#000000', color: color.surface, fontSize: 16, fontWeight: 600 }}
          >
            R
          </span>
          <div className="flex flex-1 flex-col" style={{ minWidth: 0 }}>
            <span style={type.label}>{PLATFORM.name}</span>
            <span style={{ ...type.caption }}>{PLATFORM.website}</span>
          </div>
          {settings.discoverable ? <Badge tone="info">Open to connect</Badge> : <Badge>Matches only</Badge>}
        </div>

        {settings.industryAndCountries && (
          <>
            <PreviewField label="Industry">{PLATFORM.industry}</PreviewField>
            <PreviewField label="Countries served">{PLATFORM.countries}</PreviewField>
          </>
        )}
        {settings.businessTypes && (
          <div className="flex flex-col" style={{ gap: 6 }}>
            <span style={type.caption}>Serves</span>
            <div className="flex flex-wrap" style={{ gap: 6 }}>
              {PLATFORM.businessTypes.map(t => <Badge key={t}>{t}</Badge>)}
            </div>
          </div>
        )}
        {settings.volumeRange && <PreviewField label="Size">{PLATFORM.volumeRange}</PreviewField>}

        <Divider />
        <span style={type.caption}>
          {settings.discoverable
            ? 'Shown in network search. Businesses can send you connection requests.'
            : 'Hidden from network search. Only businesses you’re matched with can see this profile.'}
        </span>
      </div>
    </div>
  )
}

export default function OptInStep({ state, setState, onValidChange }) {
  const settings = { ...DEFAULT_SHARE_SETTINGS, ...state.shareSettings, businessProfile: true }
  const consented = Boolean(state.consented)

  // Persist the defaults so later steps see them even if nothing is toggled.
  useEffect(() => {
    setState(prev => ({ shareSettings: { ...DEFAULT_SHARE_SETTINGS, ...prev.shareSettings, businessProfile: true } }))
  }, [setState])

  useEffect(() => { onValidChange(consented) }, [consented, onValidChange])

  const setSetting = (key, value) => setState(prev => ({ shareSettings: { ...DEFAULT_SHARE_SETTINGS, ...prev.shareSettings, [key]: value } }))

  return (
    <div className="flex flex-col" style={{ gap: 40 }}>
      <header className="flex flex-col" style={{ gap: 8 }}>
        <h1 style={{ ...type.pageTitle, margin: 0 }}>Join the Stripe network</h1>
        <p style={{ ...type.body, fontSize: 16, lineHeight: '24px', color: color.subdued, margin: 0, maxWidth: 640 }}>
          Share your platform’s profile with other businesses on Stripe, and get matched with businesses that complement yours.
        </p>
      </header>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <BenefitList title="What you share" items={SHARE_ITEMS} />
        <BenefitList title="What you get" items={GET_ITEMS} />
      </div>

      <section className="flex flex-col" style={{ gap: 16 }}>
        <div className="flex flex-col" style={{ gap: 4 }}>
          <h2 style={{ ...type.sectionTitle, margin: 0 }}>Choose what to share</h2>
          <p style={{ ...type.body, color: color.subdued, margin: 0 }}>You can change these settings at any time.</p>
        </div>
        <div className="grid items-start" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 360px)', gap: 32 }}>
          <div className="flex flex-col">
            {SHARE_OPTIONS.map((option, i) => (
              <div key={option.key} style={{ borderTop: i > 0 ? `1px solid ${color.neutral50}` : undefined }}>
                <ShareToggleRow option={option} checked={settings[option.key]} onChange={v => setSetting(option.key, v)} />
              </div>
            ))}
          </div>
          <div style={{ padding: 16, background: color.wellBackground, borderRadius: radius.xl, outline: `1px solid ${color.borderSubtle}` }}>
            <NetworkProfilePreview settings={settings} />
          </div>
        </div>
      </section>

      <div
        className="flex items-start"
        style={{ gap: 12, padding: 16, borderRadius: radius.lg, background: color.neutral25, border: `1px solid ${color.borderSubtle}` }}
      >
        <span style={{ color: color.subdued, display: 'inline-flex', paddingTop: 2 }}><LockIcon /></span>
        <div className="flex flex-col" style={{ gap: 2 }}>
          <span style={type.label}>Your connected accounts’ details are never shared without their permission.</span>
          <span style={{ ...type.bodySmall, color: color.subdued }}>
            Each connected account chooses for itself whether it’s discoverable in the network.
          </span>
        </div>
      </div>

      <div className="flex flex-col" style={{ gap: 8 }}>
        <Checkbox
          checked={consented}
          onChange={checked => setState({ consented: checked })}
          label={(
            <span style={type.body}>
              I agree to share this information with the Stripe network and to the{' '}
              <a href="#" className="dui-link" onClick={e => e.preventDefault()} style={{ ...type.link, fontWeight: 400 }}>
                Stripe network terms
              </a>
            </span>
          )}
        />
        <span style={{ ...type.caption, paddingLeft: 22 }}>Required to join. You can leave the network at any time.</span>
      </div>
    </div>
  )
}
