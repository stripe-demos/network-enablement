// Network onboarding step 3: find businesses already on Stripe and invite them
// to connect. Selection lives in state.selectedAccountIds; invites go out when
// the user clicks "Done" in the shell's footer.
import { useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  CheckCircleIcon,
  Checkbox,
  ChevronDownIcon,
  EmptyState,
  SearchField,
  StarIcon,
  Tabs,
  color,
  radius,
  type,
} from '@dashboard/ui'
import { NETWORK_CANDIDATES } from '../networkCandidates'

const GO_LIVE_GOAL = 4

const TABS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'search', label: 'Search' },
]

const VOLUME_ORDER = ['Under $10k/mo', '$10k–$50k/mo', '$50k–$100k/mo', '$100k–$500k/mo', '$500k–$1M/mo']

const uniqueSorted = key => [...new Set(NETWORK_CANDIDATES.map(c => c[key]))].sort()
const INDUSTRIES = uniqueSorted('industry')
const COUNTRIES = uniqueSorted('country')
const VOLUMES = VOLUME_ORDER.filter(v => NETWORK_CANDIDATES.some(c => c.volumeRange === v))
const RECOMMENDED = NETWORK_CANDIDATES.filter(c => c.recommended)

const EMPTY_FILTERS = { industry: '', country: '', volume: '', readyOnly: false }

function plural(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`
}

function ReadyBadge() {
  return <Badge tone="success">Ready to connect</Badge>
}

function Meta({ candidate }) {
  return (
    <div style={{ ...type.caption, color: color.subdued }}>
      {[candidate.industry, candidate.country, candidate.volumeRange].join(' · ')}
    </div>
  )
}

/** Go-live nudge with an "N of 4" progress meter. */
function GoLiveNudge({ count }) {
  const done = Math.min(count, GO_LIVE_GOAL)
  const reached = count >= GO_LIVE_GOAL
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '12px 16px',
        borderRadius: radius.lg,
        background: color.wellBackground,
        outline: `1px solid ${color.borderSubtle}`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0, ...type.body }}>
        {reached
          ? "You've invited enough accounts to go live once they connect."
          : `Platforms go live with ${GO_LIVE_GOAL} connected accounts. Invite at least ${GO_LIVE_GOAL} to get there sooner.`}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div
          role="progressbar"
          aria-label="Invites toward going live"
          aria-valuemin={0}
          aria-valuemax={GO_LIVE_GOAL}
          aria-valuenow={done}
          style={{ display: 'flex', gap: 4 }}
        >
          {Array.from({ length: GO_LIVE_GOAL }, (_, i) => (
            <span
              key={i}
              style={{ width: 24, height: 6, borderRadius: 3, background: i < done ? color.brand500 : color.neutral100, transition: 'background 150ms' }}
            />
          ))}
        </div>
        <span style={{ ...type.label, fontVariantNumeric: 'tabular-nums' }}>{`${done} of ${GO_LIVE_GOAL}`}</span>
      </div>
    </div>
  )
}

/** Sticky selection summary, pinned to the top of the dialog's scroll area. */
function SelectionSummary({ count, onClear }) {
  return (
    <div
      aria-live="polite"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        minHeight: 32,
        padding: '10px 0',
        background: color.surface,
        borderBottom: `1px solid ${color.neutral50}`,
      }}
    >
      <span style={{ ...type.body, color: count ? color.text : color.subdued }}>
        {count
          ? `${plural(count, 'account')} selected. We'll send invites when you finish.`
          : 'No accounts selected yet. Invite businesses below.'}
      </span>
      {count > 0 && (
        <Button variant="ghost" size="sm" onClick={onClear}>Clear selection</Button>
      )}
    </div>
  )
}

function InviteButton({ name, invited, onToggle }) {
  return (
    <Button
      variant={invited ? 'secondary' : 'primary'}
      size="sm"
      aria-pressed={invited}
      aria-label={invited ? `Invited ${name}. Click to remove.` : `Invite ${name}`}
      onClick={onToggle}
      icon={invited ? <span style={{ display: 'inline-flex', color: color.positive }}><CheckCircleIcon size={12} /></span> : null}
    >
      {invited ? 'Invited' : 'Invite'}
    </Button>
  )
}

function RecommendedCard({ candidate, invited, onToggle }) {
  return (
    <Card
      bordered
      style={{
        padding: 20,
        gap: 12,
        height: '100%',
        boxSizing: 'border-box',
        ...(invited ? { borderColor: color.brand300, boxShadow: `0 0 0 1px ${color.brand300}` } : null),
        transition: 'border-color 150ms, box-shadow 150ms',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ ...type.subsectionTitle, marginBottom: 2 }}>{candidate.name}</div>
          <Meta candidate={candidate} />
        </div>
        {candidate.readyToConnect && <ReadyBadge />}
      </div>
      <div style={{ ...type.body, color: color.subdued }}>{candidate.description}</div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          padding: '8px 10px',
          borderRadius: radius.md,
          background: color.neutral25,
          ...type.bodySmall,
        }}
      >
        <span aria-hidden="true" style={{ display: 'inline-flex', marginTop: 2, color: color.brand500 }}><StarIcon size={14} /></span>
        <span>
          <span style={{ display: 'block', fontWeight: 600 }}>Recommended because</span>
          {candidate.reason}
        </span>
      </div>
      <div style={{ marginTop: 'auto', paddingTop: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <InviteButton name={candidate.name} invited={invited} onToggle={onToggle} />
      </div>
    </Card>
  )
}

/** Filter pill with a transparent native <select> over it (stays above the dialog, unlike popovers). */
function SelectPill({ label, value, options, onChange, allLabel }) {
  const [focused, setFocused] = useState(false)
  const active = value !== ''
  return (
    <span
      className={`dui-filter-pill${active ? ' dui-filter-pill--active' : ''}`}
      style={{ position: 'relative', ...(focused ? { outline: '2px solid #8DC4F6', outlineOffset: 1 } : null) }}
    >
      <span style={{ color: active ? color.subdued : undefined }}>{label}</span>
      {active && (
        <>
          <span aria-hidden="true" style={{ width: 1, height: 12, background: color.neutral100, margin: '0 2px', display: 'inline-block' }} />
          <span style={{ color: color.actionPrimary }}>{value}</span>
        </>
      )}
      <ChevronDownIcon style={{ width: 10, height: 10 }} />
      <select
        aria-label={label}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', font: 'inherit' }}
      >
        <option value="">{allLabel}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </span>
  )
}

function matchesQuery(candidate, q) {
  if (!q) return true
  const haystack = [candidate.name, candidate.description, candidate.industry, candidate.country].join(' ').toLowerCase()
  return q.toLowerCase().split(/\s+/).filter(Boolean).every(word => haystack.includes(word))
}

const th = { ...type.caption, fontWeight: 600, color: color.subdued, textAlign: 'left', padding: '8px 12px', whiteSpace: 'nowrap' }
const td = { ...type.body, padding: '12px', verticalAlign: 'top' }

function SearchPanel({ selected, onToggle, onSetMany }) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const setFilter = patch => setFilters(prev => ({ ...prev, ...patch }))

  const results = useMemo(
    () => NETWORK_CANDIDATES.filter(c =>
      matchesQuery(c, query.trim())
      && (!filters.industry || c.industry === filters.industry)
      && (!filters.country || c.country === filters.country)
      && (!filters.volume || c.volumeRange === filters.volume)
      && (!filters.readyOnly || c.readyToConnect)),
    [query, filters],
  )

  const hasCriteria = query.trim() !== '' || filters.industry || filters.country || filters.volume || filters.readyOnly
  const clearAll = () => { setQuery(''); setFilters(EMPTY_FILTERS) }

  const selectedInResults = results.filter(c => selected.has(c.id)).length
  const allChecked = results.length > 0 && selectedInResults === results.length
  const someChecked = selectedInResults > 0 && !allChecked

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        onKeyDown={e => {
          // Escape clears the search first instead of closing the dialog.
          if (e.key === 'Escape' && query && e.target.tagName === 'INPUT') {
            e.preventDefault()
            setQuery('')
          }
        }}
      >
        <SearchField value={query} onChange={setQuery} placeholder="Search by business name, industry, or location" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <SelectPill label="Industry" allLabel="All industries" value={filters.industry} options={INDUSTRIES} onChange={v => setFilter({ industry: v })} />
        <SelectPill label="Country" allLabel="All countries" value={filters.country} options={COUNTRIES} onChange={v => setFilter({ country: v })} />
        <SelectPill label="Monthly volume" allLabel="Any volume" value={filters.volume} options={VOLUMES} onChange={v => setFilter({ volume: v })} />
        <button
          type="button"
          className={`dui-filter-pill${filters.readyOnly ? ' dui-filter-pill--active' : ''}`}
          aria-pressed={filters.readyOnly}
          onClick={() => setFilter({ readyOnly: !filters.readyOnly })}
        >
          {filters.readyOnly && <CheckCircleIcon size={10} />}
          Ready to connect only
        </button>
        {hasCriteria && (
          <Button variant="ghost" size="sm" onClick={clearAll}>Clear all</Button>
        )}
      </div>

      <div style={{ ...type.caption, color: color.subdued, paddingTop: 4 }} aria-live="polite">
        {hasCriteria ? `${plural(results.length, 'result')}` : `${plural(results.length, 'business', 'businesses')} on Stripe`}
      </div>

      {results.length === 0 ? (
        <div style={{ border: `1px solid ${color.neutral50}`, borderRadius: radius.xl }}>
          <EmptyState
            title="No matching businesses"
            description="Try a different search term or remove some filters."
            action={<Button variant="secondary" size="sm" onClick={clearAll}>Clear search and filters</Button>}
          />
        </div>
      ) : (
        <div style={{ border: `1px solid ${color.neutral50}`, borderRadius: radius.xl, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: color.neutral25, borderBottom: `1px solid ${color.neutral50}` }}>
                <th style={{ ...th, width: 20, paddingRight: 0 }}>
                  <Checkbox
                    checked={allChecked}
                    indeterminate={someChecked}
                    onChange={() => onSetMany(results.map(c => c.id), !allChecked)}
                    label={<span className="sr-only">Select all results</span>}
                  />
                </th>
                <th style={th}>Business</th>
                <th style={th}>Industry</th>
                <th style={th}>Country</th>
                <th style={th}>Monthly volume</th>
                <th style={th}><span className="sr-only">Status</span></th>
              </tr>
            </thead>
            <tbody>
              {results.map((c, i) => {
                const checked = selected.has(c.id)
                return (
                  <tr
                    key={c.id}
                    onClick={() => onToggle(c.id)}
                    style={{
                      cursor: 'pointer',
                      background: checked ? '#F7F6FF' : undefined,
                      borderTop: i ? `1px solid ${color.neutral50}` : undefined,
                    }}
                  >
                    <td style={{ ...td, paddingRight: 0 }} onClick={e => e.stopPropagation()}>
                      <Checkbox checked={checked} onChange={() => onToggle(c.id)} label={<span className="sr-only">{`Select ${c.name}`}</span>} />
                    </td>
                    <td style={td}>
                      <div style={type.label}>{c.name}</div>
                      <div style={{ ...type.caption, marginTop: 2 }}>{c.description}</div>
                    </td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>{c.industry}</td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>{c.country}</td>
                    <td style={{ ...td, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{c.volumeRange}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{c.readyToConnect && <ReadyBadge />}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function FindAccountsStep({ state, setState }) {
  const [tab, setTab] = useState('recommended')
  const selectedIds = state.selectedAccountIds
  const selected = useMemo(() => new Set(selectedIds ?? []), [selectedIds])

  // Preserve candidate order so the list sent on "Done" is stable.
  const commit = nextSet => setState({ selectedAccountIds: NETWORK_CANDIDATES.map(c => c.id).filter(id => nextSet.has(id)) })

  const toggle = id => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    commit(next)
  }

  const setMany = (ids, on) => {
    const next = new Set(selected)
    ids.forEach(id => (on ? next.add(id) : next.delete(id)))
    commit(next)
  }

  const count = selected.size

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ ...type.pageTitle, margin: 0 }}>Find connected accounts</h1>
      <p style={{ ...type.body, fontSize: 16, lineHeight: '24px', color: color.subdued, margin: '8px 0 0', maxWidth: 640 }}>
        Invite businesses already on Stripe. They can connect by reusing information they've already verified.
      </p>

      <div style={{ marginTop: 24 }}>
        <GoLiveNudge count={count} />
      </div>

      <div style={{ marginTop: 24 }}>
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
      </div>

      <SelectionSummary count={count} onClear={() => setState({ selectedAccountIds: [] })} />

      <div style={{ marginTop: 16 }}>
        {tab === 'recommended' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ ...type.caption, color: color.subdued }}>
              Matched to your connected accounts: DTC brands in apparel, beauty, home and accessories.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {RECOMMENDED.map(c => (
                <RecommendedCard key={c.id} candidate={c} invited={selected.has(c.id)} onToggle={() => toggle(c.id)} />
              ))}
            </div>
          </div>
        ) : (
          <SearchPanel selected={selected} onToggle={toggle} onSetMany={setMany} />
        )}
      </div>
    </div>
  )
}
