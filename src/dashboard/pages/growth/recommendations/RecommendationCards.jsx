// Recommendation cards: the pink "Highest impact" cards and the gray-headed
// grid cards. Both share the category tag, "…" menu and impact badge.
import { OverflowMenu, color, font } from '@dashboard/ui'

const ASSETS = '/dashboard-assets/growth'
const subdued = '#3C4F69'

function CategoryTag({ children }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: 2, fontSize: 12, fontWeight: 600, lineHeight: '16px', letterSpacing: -0.2, color: subdued, whiteSpace: 'nowrap' }}>
      <img src={`${ASSETS}/rec-tag.svg`} alt="" width={12} height={12} />
      {children}
    </span>
  )
}

function ImpactBadge({ value }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '1px 4px', borderRadius: 6, border: '1px solid #D1FAB3', background: '#EAFCDD', color: '#217005', fontSize: 12, fontWeight: 600, lineHeight: '16px', letterSpacing: -0.2, alignSelf: 'flex-start' }}>
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <path d="M6 3.5 9.5 8h-7z" fill="#2B8700" />
      </svg>
      <span aria-label={`Estimated impact ${value}`}>{value}</span>
    </span>
  )
}

function CardMenu({ rec, onDismiss }) {
  return (
    <OverflowMenu
      label={`More options for ${rec.title}`}
      menuLabel={rec.title}
      items={[
        { label: 'Learn more' },
        { label: 'Dismiss', onSelect: () => onDismiss(rec.id) },
      ]}
      style={{ width: 24, height: 20, color: '#50617A' }}
    />
  )
}

// Figma's blurred pink ellipse and line-art pattern; offsets are per card.
function Decoration({ gradient, pattern }) {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: gradient.left, top: gradient.top, width: 1914.392, height: 1993.893, display: 'flex', alignItems: 'center', justifyContent: 'center', mixBlendMode: 'darken' }}>
        <div style={{ position: 'relative', flex: 'none', width: 1282.212, height: 1546.225, transform: 'rotate(32.71deg)' }}>
          <img src={`${ASSETS}/rec-gradient.svg`} alt="" style={{ position: 'absolute', inset: '-17.45% -21.04%', width: '142.08%', height: '134.9%', maxWidth: 'none' }} />
        </div>
      </div>
      {pattern && (
        <img
          src={`${ASSETS}/rec-pattern.svg`}
          alt=""
          style={{ position: 'absolute', left: pattern.left, top: pattern.top, width: pattern.width, height: pattern.width * 1.9408, maxWidth: 'none' }}
        />
      )}
    </div>
  )
}

/** A "Highest impact" card. `large` is the left feature card. */
export function FeaturedCard({ rec, large = false, gradient, pattern, onDismiss }) {
  return (
    <article
      style={{
        position: 'relative',
        overflow: 'hidden',
        isolation: 'isolate',
        flex: 1,
        minWidth: 0,
        minHeight: large ? 365 : 178,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 16,
        padding: 20,
        borderRadius: 8,
        background: color.surface,
      }}
    >
      <Decoration gradient={gradient} pattern={pattern} />
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: large ? 16 : 8 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <CategoryTag>{rec.tag}</CategoryTag>
          <CardMenu rec={rec} onDismiss={onDismiss} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h3 style={{ margin: 0, fontFamily: font.display, fontSize: 24, fontWeight: 700, lineHeight: '32px', letterSpacing: 0.3, color: color.textStrong }}>{rec.title}</h3>
          <p style={{ margin: 0, fontSize: 16, lineHeight: '24px', letterSpacing: -0.31, color: subdued }}>{rec.description}</p>
        </div>
      </div>
      <div style={{ position: 'relative', display: 'flex' }}>
        <ImpactBadge value={rec.impact} />
      </div>
    </article>
  )
}

/** A grid card: gray header strip with the tag and menu, white body. */
export function RecommendationCard({ rec, onDismiss }) {
  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 4, borderRadius: 10, background: '#F4F7FA' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 4 }}>
        <CategoryTag>{rec.tag}</CategoryTag>
        <CardMenu rec={rec} onDismiss={onDismiss} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 20px', borderRadius: 8, background: color.surface }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, lineHeight: '24px', letterSpacing: -0.31, color: color.textStrong }}>{rec.title}</h3>
          <p style={{ margin: 0, fontSize: 14, lineHeight: '20px', letterSpacing: -0.15, color: subdued }}>{rec.description}</p>
        </div>
        <ImpactBadge value={rec.impact} />
      </div>
    </article>
  )
}
