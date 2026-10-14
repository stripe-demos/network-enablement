// Network onboarding step 3: pick a few businesses already on Stripe to invite.
// One job, top to bottom: a short list recommended from the platform's
// business description (with the "why" for each), a quiet count toward the 4 accounts it takes to go live, then search
// with inline filter chips for everything else. Each row shows the business
// profile identity (name, @handle and verified badge, as in BusinessProfileCard);
// hovering or focusing the handle explains that the business is verified.
// Selection lives in state.selectedAccountIds; invites go out when the user
// clicks "Done" in the shell's footer.
import { useId, useMemo, useState } from 'react'
import { NETWORK_CANDIDATES, VOLUME_RANGES } from '../networkCandidates'
import { PLATFORM_PROFILE } from '../platformProfile'
import { rankCandidates, recommendCandidates } from '../recommendAccounts'
import {
  ChoiceRow,
  FilterSelect,
  FilterToggle,
  GoalRing,
  RecommendedGroup,
  SearchInput,
  SectionLabel,
  StepHeading,
  TextButton,
} from '../networkControls'
import { ink, text } from '../networkTokens'
import { VerifiedHandleTooltip } from '../NetworkTooltip'

const ASSETS = '/dashboard-assets/network'
const GO_LIVE_ACCOUNTS = 4
const PAGE_SIZE = 5

const RANKED = rankCandidates(NETWORK_CANDIDATES, PLATFORM_PROFILE)
const RECOMMENDED = recommendCandidates(RANKED, GO_LIVE_ACCOUNTS)
const RECOMMENDED_IDS = new Set(RECOMMENDED.map(r => r.candidate.id))
const ORDER = RANKED.map(r => r.candidate.id)

const uniqueOptions = values => [...new Set(values)].sort().map(v => ({ value: v, label: v }))
const INDUSTRY_OPTIONS = uniqueOptions(RANKED.map(r => r.candidate.industry))
const COUNTRY_OPTIONS = uniqueOptions(RANKED.map(r => r.candidate.country))
const VOLUME_OPTIONS = VOLUME_RANGES.map(v => ({ value: v, label: v.replace('/mo', '') }))

const NO_FILTERS = { industry: '', country: '', volumeRange: '', readyOnly: false }

const describe = c => [c.industry, c.country, c.readyToConnect && 'Ready to connect'].filter(Boolean).join(' · ')

function matches(candidate, query, filters) {
  if (filters.industry && candidate.industry !== filters.industry) return false
  if (filters.country && candidate.country !== filters.country) return false
  if (filters.volumeRange && candidate.volumeRange !== filters.volumeRange) return false
  if (filters.readyOnly && !candidate.readyToConnect) return false
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [candidate.name, candidate.handle, candidate.description, candidate.industry, candidate.country].some(v => v.toLowerCase().includes(q))
}

/** 40px tile with the business initial (Modal / 86 leading icon). */
function InitialTile({ name }) {
  return (
    <span
      aria-hidden="true"
      style={{
        flexShrink: 0,
        width: 40,
        height: 40,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: ink.areaFill,
        borderRadius: 4,
        ...text.title,
        color: ink.secondary,
      }}
    >
      {name.charAt(0)}
    </span>
  )
}

/** 12px verified shield (10.5×12 artwork, offset like BusinessProfileCard). */
function VerifiedShield({ label }) {
  return (
    <span style={{ position: 'relative', width: 12, height: 12, flexShrink: 0 }}>
      <img src={`${ASSETS}/profile-shield.svg`} alt={label ?? ''} width="10.5" height="12" style={{ position: 'absolute', top: 0, left: 0.75, display: 'block' }} />
    </span>
  )
}

/** Gray @handle pill with the verified badge (Figma "Business Profiles in FOX"). */
function HandlePill({ handle, verified }) {
  const style = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: 9999, background: '#F5F6F8' }
  const contents = (
    <>
      <span style={{ fontSize: 12, fontWeight: 400, lineHeight: '16px', letterSpacing: 0, color: '#353A44', whiteSpace: 'nowrap' }}>{`@${handle}`}</span>
      {verified && <VerifiedShield label="Verified" />}
    </>
  )
  // Verified pills explain the badge on hover and focus.
  return verified ? <VerifiedHandleTooltip style={style}>{contents}</VerifiedHandleTooltip> : <span style={style}>{contents}</span>
}

/** Name with the profile handle pill beside it, on the same line. */
function ProfileIdentity({ candidate }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 8, rowGap: 2 }}>
      <span>{candidate.name}</span>
      <HandlePill handle={candidate.handle} verified={candidate.verified !== false} />
    </span>
  )
}

function CandidateRow({ candidate, description, checked, onToggle }) {
  return (
    <ChoiceRow
      type="checkbox"
      checked={checked}
      onChange={next => onToggle(candidate.id, next)}
      leading={<InitialTile name={candidate.name} />}
      title={<ProfileIdentity candidate={candidate} />}
      description={description ?? describe(candidate)}
    />
  )
}

/** Group label: what the list is based on, quoting the platform's own words. */
function BasedOnLabel() {
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span>Recommended from your business description</span>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span
          title={PLATFORM_PROFILE.businessDescription}
          style={{ ...text.body, flex: '1 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {`“${PLATFORM_PROFILE.businessDescription}”`}
        </span>
        <TextButton onClick={() => {}}>Edit</TextButton>
      </span>
    </span>
  )
}

/** Quiet count toward go-live, with a Sail progress ring. */
function GoalProgress({ count }) {
  const message = count >= GO_LIVE_ACCOUNTS
    ? `${count} selected · We’ll send invites when you click Done`
    : `${count} of ${GO_LIVE_ACCOUNTS} selected · Going live takes ${GO_LIVE_ACCOUNTS} connected accounts`
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
      <GoalRing count={count} goal={GO_LIVE_ACCOUNTS} />
      <p aria-live="polite" style={{ ...text.body, margin: 0 }}>{message}</p>
    </div>
  )
}

export default function FindAccountsStep({ state, setState }) {
  const inputId = useId()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(NO_FILTERS)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const selected = useMemo(() => new Set(state.selectedAccountIds ?? []), [state.selectedAccountIds])

  const filtering = query.trim().length > 0 || Object.keys(NO_FILTERS).some(k => filters[k] !== NO_FILTERS[k])
  // Unfiltered, the list continues where the recommendations stop. Once the user
  // searches or filters, every match shows, recommended ones included.
  const results = useMemo(
    () => RANKED.map(r => r.candidate).filter(c => (filtering || !RECOMMENDED_IDS.has(c.id)) && matches(c, query, filters)),
    [query, filters, filtering],
  )
  const visible = results.slice(0, visibleCount)
  // Businesses picked from search stay on screen after the search changes.
  const visibleIds = new Set(visible.map(c => c.id))
  const pinned = RANKED.map(r => r.candidate).filter(c => selected.has(c.id) && !RECOMMENDED_IDS.has(c.id) && !visibleIds.has(c.id))

  const updateQuery = next => {
    setQuery(next)
    setVisibleCount(PAGE_SIZE)
  }
  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setVisibleCount(PAGE_SIZE)
  }
  const clearFilters = () => {
    setQuery('')
    setFilters(NO_FILTERS)
    setVisibleCount(PAGE_SIZE)
  }

  const toggle = (id, next) => {
    const nextSet = new Set(selected)
    if (next) nextSet.add(id)
    else nextSet.delete(id)
    // Keep a stable order that matches the ranking.
    setState({ selectedAccountIds: ORDER.filter(cid => nextSet.has(cid)) })
  }

  const n = results.length
  const countLabel = filtering
    ? `${n} ${n === 1 ? 'business matches' : 'businesses match'}`
    : `${n} more businesses, best match first`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 12 }}>
        <StepHeading title="Find your first connected accounts.">
          Invite businesses already on Stripe to connect to your platform.
        </StepHeading>
      </div>

      <RecommendedGroup label={<BasedOnLabel />}>
        {RECOMMENDED.map(({ candidate, why }) => (
          <CandidateRow key={candidate.id} candidate={candidate} description={why} checked={selected.has(candidate.id)} onToggle={toggle} />
        ))}
      </RecommendedGroup>

      <GoalProgress count={selected.size} />

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <SectionLabel>
          <label htmlFor={inputId}>Find more businesses</label>
        </SectionLabel>
        <SearchInput id={inputId} value={query} onChange={updateQuery} placeholder="Search by name, handle or keyword" />

        <div role="group" aria-label="Filters" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <FilterSelect label="Industry" allLabel="All industries" value={filters.industry} options={INDUSTRY_OPTIONS} onChange={v => updateFilter('industry', v)} />
          <FilterSelect label="Country" allLabel="All countries" value={filters.country} options={COUNTRY_OPTIONS} onChange={v => updateFilter('country', v)} />
          <FilterSelect label="Monthly volume" allLabel="Any volume" value={filters.volumeRange} options={VOLUME_OPTIONS} onChange={v => updateFilter('volumeRange', v)} />
          <FilterToggle label="Ready to connect only" pressed={filters.readyOnly} onChange={v => updateFilter('readyOnly', v)} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
          <p aria-live="polite" style={{ ...text.body, flex: '1 0 0', margin: 0 }}>{countLabel}</p>
          {filtering && <TextButton onClick={clearFilters}>Clear filters</TextButton>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
          {pinned.map(c => <CandidateRow key={c.id} candidate={c} checked onToggle={toggle} />)}
          {visible.map(c => <CandidateRow key={c.id} candidate={c} checked={selected.has(c.id)} onToggle={toggle} />)}
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
    </div>
  )
}
