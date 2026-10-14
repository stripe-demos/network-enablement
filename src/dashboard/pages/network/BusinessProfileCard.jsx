// Business profile card, as defined in Figma "Business Profiles in FOX"
// (node 190:73280). Shows how a business appears to others on the network.
// `width` defaults to the Figma 300px; pass '100%' to fill a container.
const ASSETS = '/dashboard-assets/network'
const NEUTRAL_900 = '#21252C'
const TEXT_DEFAULT = '#353A44'
const BACKGROUND_OFFSET = '#F5F6F8'

export default function BusinessProfileCard({ name, handle, logo, tagline, website, address = [], width = 300 }) {
  return (
    <div
      data-wireframe-frame="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        width,
        boxSizing: 'border-box',
        padding: '24px 24px 18px',
        background: '#FFFFFF',
        border: '1px solid rgba(58,74,106,0.1)',
        borderRadius: 24,
        filter: 'drop-shadow(0px 40px 20px rgba(53,58,68,0.12))',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 12, overflow: 'hidden', background: '#000000' }}>
          <img src={logo} alt="" width="44" height="44" style={{ display: 'block', width: 44, height: 44, objectFit: 'cover' }} />
        </span>
        <span style={{ flex: '1 0 0', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
          <span style={{ fontSize: 16, fontWeight: 700, lineHeight: '24px', letterSpacing: -0.31, color: NEUTRAL_900, fontFeatureSettings: '"lnum" 1, "pnum" 1' }}>
            {name}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: 9999, background: BACKGROUND_OFFSET }}>
            <span style={{ fontSize: 12, lineHeight: '16px', color: TEXT_DEFAULT, whiteSpace: 'nowrap' }}>{`@${handle}`}</span>
            <span style={{ position: 'relative', width: 12, height: 12, flexShrink: 0 }}>
              <img src={`${ASSETS}/profile-shield.svg`} alt="Verified profile" width="10.5" height="12" style={{ position: 'absolute', top: 0, left: 0.75, display: 'block' }} />
            </span>
          </span>
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 16, lineHeight: '24px', letterSpacing: -0.31, color: NEUTRAL_900, fontFeatureSettings: '"lnum" 1, "tnum" 1' }}>
        {tagline}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, lineHeight: '20px', letterSpacing: -0.15, color: NEUTRAL_900 }}>
        <span style={{ textDecoration: 'underline', textUnderlinePosition: 'from-font' }}>{website}</span>
        <span>
          {address.map(line => <span key={line} style={{ display: 'block' }}>{line}</span>)}
        </span>
      </div>
    </div>
  )
}
