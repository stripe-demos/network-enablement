// Enablement › Onboarding — what connected accounts are asked for during
// onboarding, beside a preview of the hosted onboarding flow.
import { useEffect, useRef, useState } from 'react'
import {
  Button, Checkbox, CheckCircleIcon, ChevronUpDownIcon, Divider, Popover, SearchField, Switch, TextField,
  color, radius, shadow, type,
} from '@dashboard/ui'
import { OnboardingPreview } from './BrandingView'

const PREVIEW_BUSINESS_NAME = 'Stripe Singapore shop'
const SAVE_CONFIRMATION_MS = 2400

const ONBOARDING_COUNTRIES = [
  { id: 'AU', name: 'Australia', flag: '🇦🇺' },
  { id: 'AT', name: 'Austria', flag: '🇦🇹' },
  { id: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { id: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { id: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  { id: 'CA', name: 'Canada', flag: '🇨🇦' },
  { id: 'HR', name: 'Croatia', flag: '🇭🇷' },
  { id: 'CY', name: 'Cyprus', flag: '🇨🇾' },
  { id: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { id: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { id: 'EE', name: 'Estonia', flag: '🇪🇪' },
  { id: 'FI', name: 'Finland', flag: '🇫🇮' },
  { id: 'FR', name: 'France', flag: '🇫🇷' },
  { id: 'DE', name: 'Germany', flag: '🇩🇪' },
  { id: 'GI', name: 'Gibraltar', flag: '🇬🇮' },
  { id: 'GR', name: 'Greece', flag: '🇬🇷' },
  { id: 'HK', name: 'Hong Kong SAR China', flag: '🇭🇰' },
  { id: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { id: 'IN', name: 'India', flag: '🇮🇳' },
  { id: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { id: 'IT', name: 'Italy', flag: '🇮🇹' },
  { id: 'JP', name: 'Japan', flag: '🇯🇵' },
  { id: 'LV', name: 'Latvia', flag: '🇱🇻' },
  { id: 'LI', name: 'Liechtenstein', flag: '🇱🇮' },
  { id: 'LT', name: 'Lithuania', flag: '🇱🇹' },
  { id: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { id: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { id: 'MT', name: 'Malta', flag: '🇲🇹' },
  { id: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { id: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { id: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { id: 'NO', name: 'Norway', flag: '🇳🇴' },
  { id: 'PL', name: 'Poland', flag: '🇵🇱' },
  { id: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { id: 'RO', name: 'Romania', flag: '🇷🇴' },
  { id: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { id: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { id: 'SI', name: 'Slovenia', flag: '🇸🇮' },
  { id: 'ES', name: 'Spain', flag: '🇪🇸' },
  { id: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { id: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { id: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { id: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { id: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { id: 'US', name: 'United States', flag: '🇺🇸' },
]

const DEFAULT_SETTINGS = {
  selectedCountries: ['AU', 'CA', 'FR', 'TH', 'GB', 'US'],
  oauthEnabled: false,
  redirectUri: 'https://example.com/connect/oauth',
  networkedOnboarding: true,
  requireGovernmentId: true,
  requireSelfie: false,
  climateEnabled: false,
  collectTaxIds: true,
  showLocalPaymentMethods: true,
  supportEmail: 'support@example.com',
  supportUrl: 'https://example.com/support',
  privacyPolicyUrl: 'https://example.com/privacy',
}

function FormSection({ title, description, children }) {
  return (
    <div className="flex flex-col" style={{ gap: 16 }}>
      <div className="flex flex-col" style={{ gap: 4 }}>
        {title && <div style={type.subsectionTitle}>{title}</div>}
        {description && <div style={{ ...type.bodySmall, color: color.subdued }}>{description}</div>}
      </div>
      {children}
    </div>
  )
}

/** On/off toggle with a trailing label. */
/** Filterable multi-select: a summary trigger opening a checkbox list. */
function CountryMultiSelect({ selected, onChange }) {
  const anchorRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const chosen = ONBOARDING_COUNTRIES.filter(c => selected.includes(c.id))
  const matches = ONBOARDING_COUNTRIES.filter(c => c.name.toLowerCase().includes(query.trim().toLowerCase()))
  const allSelected = chosen.length === ONBOARDING_COUNTRIES.length

  const toggle = (id) => onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id])

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Countries"
        onClick={() => setOpen(o => !o)}
        className="flex items-center"
        style={{
          width: '100%', minHeight: 32, padding: '4px 10px', gap: 8, textAlign: 'left', cursor: 'pointer',
          background: color.surface, border: `1px solid ${open ? color.brand500 : color.neutral100}`, borderRadius: radius.md, boxShadow: shadow.button,
        }}
      >
        <span className="flex-1 min-w-0" style={{ ...type.body, color: chosen.length ? color.textStrong : color.placeholder }}>
          {chosen.length ? chosen.map(c => `${c.flag} ${c.name}`).join(', ') : 'Select countries'}
        </span>
        <ChevronUpDownIcon />
      </button>
      <Popover anchorRef={anchorRef} open={open} onClose={() => setOpen(false)} label="Countries" style={{ width: 320, padding: 8, borderRadius: radius.lg }}>
        <SearchField value={query} onChange={setQuery} placeholder="Filter countries" />
        <div className="flex items-center justify-between" style={{ padding: '8px 4px 4px' }}>
          <span style={type.caption}>{chosen.length} selected</span>
          <button
            type="button"
            onClick={() => onChange(allSelected ? [] : ONBOARDING_COUNTRIES.map(c => c.id))}
            style={{ ...type.link, fontSize: 12, lineHeight: '16px', background: 'none', border: 'none', padding: 0 }}
          >
            {allSelected ? 'Clear all' : 'Select all'}
          </button>
        </div>
        <div role="listbox" aria-multiselectable="true" className="flex flex-col" style={{ maxHeight: 260, overflowY: 'auto', gap: 2 }}>
          {matches.map(c => (
            <div key={c.id} role="option" aria-selected={selected.includes(c.id)} style={{ padding: '6px 4px' }}>
              <Checkbox checked={selected.includes(c.id)} onChange={() => toggle(c.id)} label={`${c.flag} ${c.name}`} />
            </div>
          ))}
          {matches.length === 0 && <div style={{ ...type.body, color: color.subdued, padding: '6px 4px' }}>No countries match</div>}
        </div>
      </Popover>
    </>
  )
}

function SaveConfirmation() {
  return (
    <div role="status" aria-live="polite" className="flex items-center" style={{ gap: 6, color: color.positive }}>
      <CheckCircleIcon />
      <span style={{ ...type.bodySmall, color: color.positive }}>Onboarding settings saved</span>
    </div>
  )
}

export default function OnboardingView({ previewBusinessName = PREVIEW_BUSINESS_NAME }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)
  const saveTimeoutRef = useRef(null)

  useEffect(() => () => clearTimeout(saveTimeoutRef.current), [])

  const update = (patch) => setSettings(s => ({ ...s, ...patch }))
  const field = (key) => ({ value: settings[key], onChange: (value) => update({ [key]: value }) })
  const toggle = (key) => ({ checked: settings[key], onChange: (checked) => update({ [key]: checked }) })

  const handleSave = () => {
    clearTimeout(saveTimeoutRef.current)
    setShowSaveConfirmation(true)
    saveTimeoutRef.current = setTimeout(() => setShowSaveConfirmation(false), SAVE_CONFIRMATION_MS)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 3fr)', width: '100%', alignItems: 'start' }}>
      <div className="flex flex-col" style={{ paddingTop: 16, paddingRight: 32, gap: 24, borderRight: `1px solid ${color.neutral50}` }}>
        <FormSection
          title="Countries"
          description="Select the countries where you'll onboard connected accounts. Only applies if you control pricing and Stripe is responsible for negative balance liability."
        >
          <CountryMultiSelect selected={settings.selectedCountries} onChange={selectedCountries => update({ selectedCountries })} />
        </FormSection>

        <Divider />

        <FormSection title="OAuth" description="Let connected accounts connect to your platform with OAuth.">
          <Switch label="Enable OAuth" {...toggle('oauthEnabled')} />
          <TextField label="Redirect URI" {...field('redirectUri')} />
          <div className="flex flex-col" style={{ gap: 4 }}>
            <span style={{ ...type.caption, fontWeight: 600 }}>Client ID</span>
            <span style={type.bodySmall}>ca_test_4eC39HqLyjWDarjtT1zdp7dc</span>
          </div>
        </FormSection>

        <Divider />

        <FormSection
          title="Networked onboarding"
          description="Allow connected accounts to skip verification when they've already been verified on another platform."
        >
          <Switch label="Enable networked onboarding" {...toggle('networkedOnboarding')} />
        </FormSection>

        <Divider />

        <FormSection
          title="Identity verification"
          description="Choose how Stripe verifies the identity of people associated with connected accounts."
        >
          <Switch label="Require a government ID" {...toggle('requireGovernmentId')} />
          <Switch label="Require a selfie" {...toggle('requireSelfie')} />
        </FormSection>

        <Divider />

        <FormSection
          title="Climate programs"
          description="Give connected accounts the option to contribute a portion of their revenue to Stripe Climate."
        >
          <Switch label="Show Climate during onboarding" {...toggle('climateEnabled')} />
        </FormSection>

        <Divider />

        <FormSection
          title="Tax"
          description="Collect tax IDs and other tax information from connected accounts during onboarding."
        >
          <Switch label="Collect tax information" {...toggle('collectTaxIds')} />
        </FormSection>

        <Divider />

        <FormSection
          title="Regional"
          description="Apply country-specific requirements and local payment method options during onboarding."
        >
          <Switch label="Show local payment methods" {...toggle('showLocalPaymentMethods')} />
        </FormSection>

        <Divider />

        <FormSection title="Public details" description="These details appear to connected accounts during onboarding.">
          <TextField label="Support email" type="email" {...field('supportEmail')} />
          <TextField label="Support URL" {...field('supportUrl')} />
          <TextField label="Privacy policy URL" {...field('privacyPolicyUrl')} />
        </FormSection>

        <div className="flex items-center justify-end" style={{ gap: 16 }}>
          {showSaveConfirmation && <SaveConfirmation />}
          <Button variant="primary" onClick={handleSave}>Save</Button>
        </div>
      </div>

      <div
        className="flex flex-col"
        style={{ position: 'sticky', top: 0, minWidth: 0, minHeight: 480, background: color.wellBackground, padding: '24px 24px 24px 32px', gap: 16 }}
      >
        <div style={type.subsectionTitle}>Preview</div>
        <OnboardingPreview businessName={previewBusinessName} />
      </div>
    </div>
  )
}
