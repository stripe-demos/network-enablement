// Growth › Recommendations, from Figma "Growth Studio – Recommendations":
// a lead estimate, category chips that filter the cards, a "Highest impact"
// feature block and card grids per section. "…" › Dismiss hides a card for
// the browser session.
import { useState } from 'react'
import { color, font } from '@dashboard/ui'
import { createDashboardStorage } from '../../lib/storage'
import { FeaturedCard, RecommendationCard } from './recommendations/RecommendationCards'
import { FILTERS, LEAD, RECOMMENDATIONS, SECTIONS } from './recommendations/recommendationsData'

const session = createDashboardStorage(() => window.sessionStorage)
const DISMISSED_KEY = 'growth:dismissed-recommendations'

function readDismissed() {
  try { return JSON.parse(session.getItem(DISMISSED_KEY)) ?? [] } catch { return [] }
}

// Gradient and pattern offsets from Figma, by position in the feature block.
const FEATURE_ART = [
  { gradient: { left: -434.9, top: -84 }, pattern: { left: 150, top: 140, width: 460 } },
  { gradient: { left: -324.9, top: -164 } },
  { gradient: { left: -434.9, top: -74 } },
]

function FilterChip({ label, count, selected, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 8px',
        borderRadius: 8,
        border: `1px solid ${color.borderDefault}`,
        background: selected ? '#F4F7FA' : color.surface,
        fontFamily: 'inherit',
        fontSize: 14,
        lineHeight: '20px',
        letterSpacing: -0.15,
        color: selected ? color.textStrong : '#3C4F69',
        cursor: 'pointer',
      }}
    >
      <span style={{ fontWeight: 600 }}>{label}</span>
      {selected
        ? <span>{count}</span>
        : (
          <span style={{ minWidth: 20, padding: '2px 6px', borderRadius: 10, background: color.borderDefault, fontSize: 12, fontWeight: 600, lineHeight: '16px', letterSpacing: -0.2, color: color.textStrong, textAlign: 'center', boxSizing: 'border-box' }}>
            {count}
          </span>
        )}
    </button>
  )
}

function SectionTitle({ children }) {
  return (
    <h2 style={{ margin: 0, fontFamily: font.display, fontSize: 20, fontWeight: 700, lineHeight: '28px', letterSpacing: 0.1, color: color.textStrong }}>
      {children}
    </h2>
  )
}

function FeatureBlock({ recs, onDismiss }) {
  const [lead, ...rest] = recs
  return (
    <div style={{ display: 'flex', gap: 8, padding: 8, borderRadius: 12, background: '#F4F7FA' }}>
      <FeaturedCard rec={lead} large {...FEATURE_ART[0]} onDismiss={onDismiss} />
      {rest.length > 0 && (
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rest.map((rec, i) => (
            <FeaturedCard key={rec.id} rec={rec} {...FEATURE_ART[i + 1]} onDismiss={onDismiss} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function RecommendationsTab() {
  const [filter, setFilter] = useState('all')
  const [dismissed, setDismissed] = useState(readDismissed)

  const dismiss = (id) => {
    const next = [...dismissed, id]
    setDismissed(next)
    session.setItem(DISMISSED_KEY, JSON.stringify(next))
  }

  const available = RECOMMENDATIONS.filter(r => !dismissed.includes(r.id))
  const countFor = id => (id === 'all' ? available.length : available.filter(r => r.filter === id).length)
  const shown = filter === 'all' ? available : available.filter(r => r.filter === filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ margin: 0, fontSize: 18, lineHeight: '28px', letterSpacing: -0.3, color: color.textStrong }}>{LEAD}</p>
        <div role="group" aria-label="Filter recommendations" style={{ display: 'flex', gap: 8 }}>
          {FILTERS.map(f => (
            <FilterChip key={f.id} label={f.label} count={countFor(f.id)} selected={filter === f.id} onClick={() => setFilter(f.id)} />
          ))}
        </div>
      </div>

      {SECTIONS.map((section) => {
        const recs = shown.filter(r => r.section === section.id)
        if (recs.length === 0) return null
        return (
          <section key={section.id} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SectionTitle>{section.title}</SectionTitle>
            {section.featured
              ? <FeatureBlock recs={recs} onDismiss={dismiss} />
              : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
                  {recs.map(rec => <RecommendationCard key={rec.id} rec={rec} onDismiss={dismiss} />)}
                </div>
              )}
          </section>
        )
      })}

      {shown.length === 0 && (
        <p style={{ margin: 0, fontSize: 14, lineHeight: '20px', color: color.subdued }}>No recommendations in this category.</p>
      )}
    </div>
  )
}
