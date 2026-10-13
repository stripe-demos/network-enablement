// Enablement › Branding — brand elements shared by every connected-account
// surface, with a live preview of onboarding and both dashboards.
import { useState } from 'react'
import { Divider, InfoIcon, Tabs, TextField, Tooltip, color, radius, type } from '@dashboard/ui'

const PREVIEW_TABS = [
  { id: 'onboarding', label: 'Onboarding experience' },
  { id: 'stripe-dashboard', label: 'Stripe Dashboard' },
  { id: 'express-dashboard', label: 'Express Dashboard' },
]

// The platform's own brand colours (simulated account data, not Dashboard tokens).
const DEFAULT_BRAND = { brandColor: '#000b80', accentColor: '#2a1d3a' }

const ON_BRAND = 'rgba(255,255,255,0.2)'
const ON_BRAND_TEXT = 'rgba(255,255,255,0.7)'

function BrandSection({ title, description, children }) {
  return (
    <div className="flex flex-col" style={{ gap: 16 }}>
      <div className="flex flex-col" style={{ gap: 4 }}>
        {title && <div style={type.subsectionTitle}>{title}</div>}
        <div style={{ ...type.bodySmall, color: color.subdued }}>{description}</div>
      </div>
      {children}
    </div>
  )
}

function AssetRow({ label, hint, children }) {
  return (
    <div className="flex items-center">
      <div className="flex flex-1 items-center" style={{ gap: 8 }}>
        <span style={type.body}>{label}</span>
        <Tooltip label={hint}><span className="inline-flex" style={{ color: color.subdued }}><InfoIcon /></span></Tooltip>
      </div>
      <div style={{ flex: 'none', paddingLeft: 24 }}>{children}</div>
    </div>
  )
}

function AssetTile({ background, round = false, children }) {
  return (
    <div
      className="flex items-center justify-center"
      style={{ width: 48, height: 48, borderRadius: round ? '50%' : radius.md, background, color: color.surface, fontSize: 16, fontWeight: 600 }}
    >
      {children}
    </div>
  )
}

/** Label plus a swatch-and-hex chip; the swatch opens the browser's colour picker. */
function ColorRow({ label, value, onChange }) {
  return (
    <div className="flex items-center">
      <span className="flex-1" style={type.body}>{label}</span>
      <label
        className="flex items-center"
        style={{ gap: 8, minWidth: 112, padding: '4px 8px', border: `1px solid ${color.neutral100}`, borderRadius: radius.md, cursor: 'pointer' }}
      >
        <span style={{ position: 'relative', width: 14, height: 14, borderRadius: radius.sm, flex: 'none', background: value }}>
          <input
            type="color"
            aria-label={label}
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
          />
        </span>
        <span style={type.bodySmall}>{value}</span>
      </label>
    </div>
  )
}

function SkeletonBar({ width, height = 10, background = color.neutral50 }) {
  return <div style={{ width, height, borderRadius: radius.sm, background, flex: 'none' }} />
}

function PreviewFrame({ style, children }) {
  return (
    <div
      style={{
        border: `1px solid ${color.borderDefault}`,
        borderRadius: radius.lg,
        overflow: 'hidden',
        background: color.surface,
        minHeight: 380,
        display: 'flex',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function Initial({ size, background, rounded = '50%', fontSize = 14 }) {
  return (
    <div
      className="flex items-center justify-center"
      style={{ width: size, height: size, borderRadius: rounded, background, color: color.surface, fontSize, fontWeight: 600, flex: 'none' }}
    >
      S
    </div>
  )
}

/** Hosted onboarding mock: brand-coloured side panel beside a skeleton form. Shared with the Onboarding tab. */
export function OnboardingPreview({ businessName, brandColor = DEFAULT_BRAND.brandColor, accentColor = DEFAULT_BRAND.accentColor }) {
  return (
    <PreviewFrame style={{ position: 'relative', flexDirection: 'column', gap: 16, padding: '32px 24px 24px 234px' }}>
      <div className="flex flex-col" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 210, background: brandColor, padding: 24, gap: 16 }}>
        <Initial size={40} background={ON_BRAND} />
        <div className="flex flex-col" style={{ gap: 4 }}>
          <div style={{ ...type.label, color: color.surface }}>{businessName}</div>
          <div style={{ ...type.bodySmall, color: ON_BRAND_TEXT }}>partners with Stripe for secure payments.</div>
        </div>
        <SkeletonBar width={72} height={7} background="rgba(255,255,255,0.25)" />
        <div className="flex" style={{ gap: 8, paddingTop: 32 }}>
          <SkeletonBar width={28} height={5} background="rgba(255,255,255,0.5)" />
          <SkeletonBar width={28} height={5} background={ON_BRAND} />
        </div>
      </div>

      <div className="flex flex-col" style={{ gap: 8, paddingTop: 4 }}>
        {[56, 42, 49].map(width => <SkeletonBar key={width} width={`${width}%`} />)}
      </div>
      <div style={{ height: 32, width: 116, borderRadius: radius.md, background: accentColor, flex: 'none' }} />
    </PreviewFrame>
  )
}

function StripeDashboardPreview({ businessName }) {
  return (
    <PreviewFrame>
      <div className="flex flex-col items-center" style={{ width: 72, flex: 'none', background: color.neutral25, padding: 16, gap: 8, borderRight: `1px solid ${color.borderDefault}` }}>
        <Initial size={40} background={color.brand500} rounded={radius.md} />
        {['64%', '48%', '56%', '40%'].map(width => <SkeletonBar key={width} width={width} height={6} />)}
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex items-center" style={{ padding: '16px 24px', borderBottom: `1px solid ${color.borderDefault}`, gap: 8 }}>
          <span style={type.label}>{businessName}</span>
        </div>
        <div className="flex flex-1 flex-col" style={{ padding: 24, gap: 16 }}>
          <SkeletonBar width="38%" height={12} />
          <SkeletonBar width="72%" />
          <SkeletonBar width="64%" />
          <SkeletonBar width="54%" />
        </div>
      </div>
    </PreviewFrame>
  )
}

function ExpressDashboardPreview({ businessName, brandColor }) {
  return (
    <PreviewFrame style={{ flexDirection: 'column' }}>
      <div className="flex items-center" style={{ background: brandColor, padding: '16px 24px', gap: 8 }}>
        <Initial size={32} background={ON_BRAND} fontSize={12} />
        <span style={{ ...type.label, color: color.surface }}>{businessName}</span>
      </div>
      <div className="flex flex-1 flex-col" style={{ padding: 24, gap: 16 }}>
        <SkeletonBar width="42%" height={12} />
        <SkeletonBar width="78%" />
        <SkeletonBar width="60%" />
        <div style={{ height: 32, width: 116, borderRadius: radius.md, background: brandColor, marginTop: 8 }} />
      </div>
    </PreviewFrame>
  )
}

export default function BrandingView({ showPreviewTabs = true, initialBusinessName = 'Stripe Singapore shop' }) {
  const [businessName, setBusinessName] = useState(initialBusinessName)
  const [brandColor, setBrandColor] = useState(DEFAULT_BRAND.brandColor)
  const [accentColor, setAccentColor] = useState(DEFAULT_BRAND.accentColor)
  const [previewTab, setPreviewTab] = useState(PREVIEW_TABS[0].id)

  const preview = {
    'onboarding': <OnboardingPreview businessName={businessName} brandColor={brandColor} accentColor={accentColor} />,
    'stripe-dashboard': <StripeDashboardPreview businessName={businessName} />,
    'express-dashboard': <ExpressDashboardPreview businessName={businessName} brandColor={brandColor} />,
  }

  return (
    <div className="flex items-stretch" style={{ width: '100%', minHeight: 600 }}>
      <div className="flex flex-col" style={{ width: 460, flex: 'none', paddingTop: 16, paddingRight: 32, gap: 24, borderRight: `1px solid ${color.neutral50}` }}>
        <BrandSection description="Updates to brand elements will apply to all dashboards and onboarding.">
          <TextField label="Business name" value={businessName} onChange={setBusinessName} />
          <AssetRow label="Icon" hint="Square image shown in compact spaces, like browser tabs.">
            <AssetTile background={color.brand500}>S</AssetTile>
          </AssetRow>
          <AssetRow label="Logo" hint="Wider image shown in headers and onboarding.">
            <AssetTile background={color.chartCategorical[2]} round>x</AssetTile>
          </AssetRow>
        </BrandSection>

        <Divider />

        <BrandSection
          title="Set theming"
          description="We recommend using a high contrast accent color to ensure your links are accessible."
        >
          <ColorRow label="Brand color" value={brandColor} onChange={setBrandColor} />
          <ColorRow label="Accent color" value={accentColor} onChange={setAccentColor} />
        </BrandSection>
      </div>

      <div className="flex flex-1 flex-col" style={{ minWidth: 0, background: color.wellBackground, padding: '24px 24px 24px 32px', gap: 16 }}>
        <div style={type.subsectionTitle}>Preview</div>
        {showPreviewTabs ? (
          <>
            <Tabs tabs={PREVIEW_TABS} value={previewTab} onChange={setPreviewTab} />
            <div role="tabpanel" className="flex flex-col flex-1">{preview[previewTab]}</div>
          </>
        ) : preview.onboarding}
      </div>
    </div>
  )
}
