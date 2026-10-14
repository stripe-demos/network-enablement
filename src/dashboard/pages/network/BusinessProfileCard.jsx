// Business profile card, as defined in Figma "Business Profiles in FOX"
// (node 190:73280). Shows how a business appears to others on the network.
// `width` defaults to the Figma 300px; pass '100%' to fill a container.
// `handleTooltip` makes the @handle pill a focusable trigger for a tooltip
// explaining the verified badge (step 3's matching deck). Off by default, so the
// platform's own profile in the Opt in step has none.
// `surface="deck"` restyles the frame as the stacked card from Figma "Treasury
// Rewards" (node 2241:106175): a hairline border, 8px radius, a soft drop shadow and
// the waves and soft gradient behind the content. The profile content is the same.
import { VerifiedHandleTooltip } from './NetworkTooltip'

const ASSETS = '/dashboard-assets/network'
const NEUTRAL_900 = '#21252C'
const TEXT_DEFAULT = '#353A44'
const BACKGROUND_OFFSET = '#F5F6F8'
const HANDLE_PILL = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: 9999, background: BACKGROUND_OFFSET }

const PROFILE_FRAME = {
  padding: '24px 24px 18px',
  border: '1px solid rgba(58,74,106,0.1)',
  borderRadius: 24,
  filter: 'drop-shadow(0px 40px 20px rgba(53,58,68,0.12))',
}
const DECK_FRAME = {
  position: 'relative',
  overflow: 'hidden',
  padding: 16,
  border: '1px solid #D4DEE9',
  borderRadius: 8,
  // A lighter, tighter take on the profile card's shadow, so it doesn't spill
  // onto the buttons under the deck.
  filter: 'drop-shadow(0px 12px 16px rgba(53,58,68,0.07)) drop-shadow(0px 2px 4px rgba(53,58,68,0.04))',
}

/** Waves and gradient behind the deck card, placed as in the Figma frame. */
function DeckDecoration() {
  return (
    <span aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* Same overhang as the 278px Figma card (84.5px left, 90.5px right), stretched to
          the card's width; the SVG uses preserveAspectRatio="none", so it scales cleanly. */}
      <span style={{ position: 'absolute', left: -84.5, right: -90.5, top: -65, height: 288 }}>
        <img src={`${ASSETS}/card-waves.svg`} alt="" width="453" height="288" style={{ display: 'block', width: '100%', height: '100%' }} />
      </span>
      {/* Anchored to the right edge so it sits behind the top-right corner at any width. */}
      <span style={{ position: 'absolute', right: -187.5, top: -45, width: 319, height: 235, transform: 'scaleX(-1)' }}>
        <img src={`${ASSETS}/card-gradient.svg`} alt="" width="635" height="442" style={{ display: 'block', maxWidth: 'none' }} />
      </span>
    </span>
  )
}

export default function BusinessProfileCard({ name, handle, logo, tagline, website, address = [], width = 300, handleTooltip = false, surface = 'profile' }) {
  const deck = surface === 'deck'
  const handlePill = (
    <>
      <span style={{ fontSize: 12, lineHeight: '16px', color: TEXT_DEFAULT, whiteSpace: 'nowrap' }}>{`@${handle}`}</span>
      <span style={{ position: 'relative', width: 12, height: 12, flexShrink: 0 }}>
        <img src={`${ASSETS}/profile-shield.svg`} alt="Verified profile" width="10.5" height="12" style={{ position: 'absolute', top: 0, left: 0.75, display: 'block' }} />
      </span>
    </>
  )
  return (
    <div
      data-wireframe-frame="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        width,
        boxSizing: 'border-box',
        background: '#FFFFFF',
        ...(deck ? DECK_FRAME : PROFILE_FRAME),
      }}
    >
      {deck && <DeckDecoration />}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 12, overflow: 'hidden', background: '#000000' }}>
          <img src={logo} alt="" width="44" height="44" style={{ display: 'block', width: 44, height: 44, objectFit: 'cover' }} />
        </span>
        <span style={{ flex: '1 0 0', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
          <span style={{ fontSize: 16, fontWeight: 700, lineHeight: '24px', letterSpacing: -0.31, color: NEUTRAL_900, fontFeatureSettings: '"lnum" 1, "pnum" 1' }}>
            {name}
          </span>
          {handleTooltip
            ? <VerifiedHandleTooltip style={HANDLE_PILL}>{handlePill}</VerifiedHandleTooltip>
            : <span style={HANDLE_PILL}>{handlePill}</span>}
        </span>
      </div>

      <p style={{ position: 'relative', margin: 0, fontSize: 16, lineHeight: '24px', letterSpacing: -0.31, color: NEUTRAL_900, fontFeatureSettings: '"lnum" 1, "tnum" 1' }}>
        {tagline}
      </p>

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, lineHeight: '20px', letterSpacing: -0.15, color: NEUTRAL_900 }}>
        <span style={{ textDecoration: 'underline', textUnderlinePosition: 'from-font' }}>{website}</span>
        <span>
          {address.map(line => <span key={line} style={{ display: 'block' }}>{line}</span>)}
        </span>
      </div>
    </div>
  )
}
