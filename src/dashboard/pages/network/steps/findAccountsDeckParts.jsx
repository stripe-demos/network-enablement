// Presentational pieces for step 3, version A ("Swipe"): goal dots, match
// reasons, stack edges, key hints and the inline "Browse all businesses" list.
import { useId, useMemo, useState } from 'react'
import { ChoiceRow, FilterSelect, FilterToggle, GoalRing, SearchInput, TextButton } from '../networkControls'
import { ink, text } from '../networkTokens'
import { VerifiedHandleTooltip } from '../NetworkTooltip'
import {
  COUNTRY_OPTIONS,
  GO_LIVE_ACCOUNTS,
  INDUSTRY_OPTIONS,
  NO_FILTERS,
  RANKED,
  VOLUME_OPTIONS,
  matchesFilters,
} from './findAccountsDeckData'

const ASSETS = '/dashboard-assets/network'
const PAGE_SIZE = 5

function VerifiedShield() {
  return (
    <span style={{ position: 'relative', width: 12, height: 12, flexShrink: 0 }}>
      <img src={`${ASSETS}/profile-shield.svg`} alt="Verified" width="10.5" height="12" style={{ position: 'absolute', top: 0, left: 0.75, display: 'block' }} />
    </span>
  )
}

/** Gray @handle pill with the verified badge. Verified pills explain the badge on hover and focus. */
function HandlePill({ handle, verified }) {
  const style = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: 9999, background: '#F5F6F8' }
  const contents = (
    <>
      <span style={{ fontSize: 12, fontWeight: 400, lineHeight: '16px', color: '#353A44', whiteSpace: 'nowrap' }}>{`@${handle}`}</span>
      {verified && <VerifiedShield />}
    </>
  )
  return verified ? <VerifiedHandleTooltip style={style}>{contents}</VerifiedHandleTooltip> : <span style={style}>{contents}</span>
}

/** Sail progress ring toward go-live, with the count beside it. */
export function GoalDots({ count, total }) {
  const invited = count > GO_LIVE_ACCOUNTS ? `${count} invited` : `${count} of ${GO_LIVE_ACCOUNTS} invited`
  const label = total ? `${invited} · ${total} businesses` : invited
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <GoalRing count={count} goal={GO_LIVE_ACCOUNTS} />
      <span style={{ ...text.bodyEmphasized }}>{label}</span>
    </span>
  )
}

/**
 * Cards waiting behind the active one, peeking out above it (Figma Treasury
 * Rewards 2241:106175): 8px tabs, each inset 16px more than the one in front.
 */
export function StackPeek({ depth }) {
  return Array.from({ length: 2 }, (_, i) => {
    const level = 2 - i // the deepest tab first
    return (
      <div
        key={level}
        aria-hidden="true"
        style={{
          alignSelf: 'center',
          width: `calc(100% - ${level * 32}px)`,
          height: 8,
          marginBottom: -1,
          boxSizing: 'border-box',
          background: level === 2 ? '#FBFCFD' : '#FFFFFF',
          border: '1px solid #D4DEE9',
          borderBottom: 'none',
          borderRadius: '8px 8px 0 0',
          opacity: level <= depth ? 1 : 0,
          transition: 'opacity 160ms ease',
        }}
      />
    )
  })
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0, marginTop: 2 }}>
      <circle cx="8" cy="8" r="8" fill={ink.brandTint} />
      <path d="M4.8 8.2 7 10.4 11.2 5.8" fill="none" stroke={ink.brand} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function MatchReasons({ reasons }) {
  return (
    <section aria-label="Why it’s a match" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px', background: ink.areaFill, borderRadius: 8 }}>
      <span style={{ ...text.bodyEmphasized }}>Why it’s a match</span>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: 0, padding: 0, listStyle: 'none' }}>
        {reasons.map(r => (
          <li key={r.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}>
            <CheckIcon />
            {/* Copy is written to fit one line; the ellipsis is only a safety net. */}
            <span style={{ ...text.body, color: ink.primary, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {r.title}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * Sail arrowLeft / arrowRight (12px, from the Treasury Rewards Figma 2227:105484),
 * shown on Skip and Invite as their keyboard shortcuts. Drawn as a mask so it
 * takes the button's text color.
 */
export function KeyHint({ direction }) {
  const src = `/dashboard-assets/network/arrow-${direction === 'left' ? 'left' : 'right'}.svg`
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        flexShrink: 0,
        width: 12,
        height: 12,
        backgroundColor: 'currentColor',
        maskImage: `url("${src}")`,
        WebkitMaskImage: `url("${src}")`,
        maskSize: '12px 12px',
        WebkitMaskSize: '12px 12px',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
      }}
    />
  )
}

/** 40px tile with the business initial. */
function InitialTile({ name }) {
  return (
    <span aria-hidden="true" style={{ flexShrink: 0, width: 40, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: ink.areaFill, borderRadius: 4, ...text.title, color: ink.secondary }}>
      {name.charAt(0)}
    </span>
  )
}

function Identity({ candidate }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 8, rowGap: 2 }}>
      <span>{candidate.name}</span>
      <HandlePill handle={candidate.handle} verified={candidate.verified !== false} />
    </span>
  )
}

const describe = c => [c.industry, c.country, c.readyToConnect && 'Ready to connect'].filter(Boolean).join(' · ')

/** Inline search and filters over every business, best match first. */
export function BrowseAll({ selected, onToggle }) {
  const inputId = useId()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(NO_FILTERS)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const filtering = query.trim().length > 0 || Object.keys(NO_FILTERS).some(k => filters[k] !== NO_FILTERS[k])
  const results = useMemo(() => RANKED.map(r => r.candidate).filter(c => matchesFilters(c, query, filters)), [query, filters])
  const visible = results.slice(0, visibleCount)
  const n = results.length

  const reset = () => setVisibleCount(PAGE_SIZE)
  const updateFilter = (key, value) => { setFilters(prev => ({ ...prev, [key]: value })); reset() }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label htmlFor={inputId} style={{ ...text.body, color: ink.strong, paddingBottom: 8 }}>Search the network</label>
      <SearchInput id={inputId} value={query} onChange={v => { setQuery(v); reset() }} placeholder="Search by name, handle or keyword" />

      <div role="group" aria-label="Filters" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        <FilterSelect label="Industry" allLabel="All industries" value={filters.industry} options={INDUSTRY_OPTIONS} onChange={v => updateFilter('industry', v)} />
        <FilterSelect label="Country" allLabel="All countries" value={filters.country} options={COUNTRY_OPTIONS} onChange={v => updateFilter('country', v)} />
        <FilterSelect label="Monthly volume" allLabel="Any volume" value={filters.volumeRange} options={VOLUME_OPTIONS} onChange={v => updateFilter('volumeRange', v)} />
        <FilterToggle label="Ready to connect only" pressed={filters.readyOnly} onChange={v => updateFilter('readyOnly', v)} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
        <p aria-live="polite" style={{ ...text.body, flex: '1 0 0', margin: 0 }}>
          {filtering ? `${n} ${n === 1 ? 'business matches' : 'businesses match'}` : `${n} businesses, best match first`}
        </p>
        {filtering && <TextButton onClick={() => { setQuery(''); setFilters(NO_FILTERS); reset() }}>Clear filters</TextButton>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
        {visible.map(c => (
          <ChoiceRow
            key={c.id}
            type="checkbox"
            checked={selected.has(c.id)}
            onChange={next => onToggle(c.id, next)}
            leading={<InitialTile name={c.name} />}
            title={<Identity candidate={c} />}
            description={describe(c)}
          />
        ))}
        {n === 0 && (
          <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ ...text.bodyEmphasized, margin: 0 }}>No businesses match</p>
            <p style={{ ...text.body, margin: 0 }}>Try a different search or fewer filters.</p>
          </div>
        )}
      </div>

      {n > visible.length && (
        <div style={{ marginTop: 12 }}>
          <TextButton onClick={() => setVisibleCount(c => c + PAGE_SIZE)}>Show more</TextButton>
        </div>
      )}
    </div>
  )
}
