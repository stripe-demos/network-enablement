// Network onboarding step 3, version B ("Profile cards"): lead with trust and
// identity. The platform's business description leads, with a link to edit it
// in Settings. Recommendations show below as business profile cards, 4 per page
// in a 2-column grid with a pager under it (logo tile, name, @handle with the verified shield, a short
// description and why it's recommended), each with an Invite toggle. Hovering
// or focusing a handle explains that the business is verified. Under the
// grid, a compact search with the same filters lists everything else as
// smaller profile rows. Selection lives in state.selectedAccountIds; invites go
// out when the user clicks "Done" in the shell's footer.
//
// The cards are drawn inline rather than with BusinessProfileCard: its 40px drop
// shadow, 24px radius and 16px type are built for a single hero card, and its
// website and address block has no data here. These cards keep its look (white,
// hairline border, rounded logo tile, handle pill) at a grid-friendly scale.
import { useId, useMemo, useState } from 'react'
import { NETWORK_CANDIDATES, VOLUME_RANGES } from '../networkCandidates'
import { PLATFORM_PROFILE } from '../platformProfile'
import { rankCandidates, recommendCandidates } from '../recommendAccounts'
import { FilterSelect, FilterToggle, GoalRing, SearchInput, SectionLabel, StepHeading, TextButton } from '../networkControls'
import { ink, text } from '../networkTokens'
import { VerifiedHandleTooltip } from '../NetworkTooltip'

const ASSETS = '/dashboard-assets/network'
const GO_LIVE_ACCOUNTS = 4
const PAGE_SIZE = 4
const CARDS_PER_PAGE = 4
const RECOMMENDED_COUNT = 12
const CARD_BORDER = 'rgba(58,74,106,0.1)' // BusinessProfileCard hairline
const BUTTON_BORDER = '#D3DEE9'
const HANDLE_FILL = '#F5F6F8'
const HANDLE_TEXT = '#353A44'

const RANKED = rankCandidates(NETWORK_CANDIDATES, PLATFORM_PROFILE)
const RECOMMENDED = recommendCandidates(RANKED, RECOMMENDED_COUNT)
const CARD_PAGES = Math.ceil(RECOMMENDED.length / CARDS_PER_PAGE)
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

/** Rounded logo tile with the business initial (profile card logo, scaled). */
function LogoTile({ name, size }) {
  return (
    <span
      aria-hidden="true"
      style={{
        flexShrink: 0,
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: ink.areaFill,
        border: `1px solid ${ink.divider}`,
        boxSizing: 'border-box',
        borderRadius: size >= 40 ? 10 : 8,
        ...text.title,
        fontSize: size >= 40 ? 16 : 14,
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
  const style = { display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 0, maxWidth: '100%', padding: '2px 6px', boxSizing: 'border-box', borderRadius: 9999, background: HANDLE_FILL }
  const contents = (
    <>
      <span style={{ fontSize: 12, fontWeight: 400, lineHeight: '16px', color: HANDLE_TEXT, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`@${handle}`}</span>
      {verified && <VerifiedShield label="Verified" />}
    </>
  )
  // Verified pills explain the badge on hover and focus.
  return verified ? <VerifiedHandleTooltip style={style}>{contents}</VerifiedHandleTooltip> : <span style={style}>{contents}</span>
}

/**
 * Invite toggle. "Invite" with a plus; pressed, it reads "Invited" with a check
 * in brand color. `block` stretches it to the card width.
 */
function InviteButton({ name, pressed, onChange, block }) {
  const [focused, setFocused] = useState(false)
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={`${pressed ? 'Invited' : 'Invite'} ${name}`}
      onClick={() => onChange(!pressed)}
      onFocus={e => setFocused(e.target.matches(':focus-visible'))}
      onBlur={() => setFocused(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        flexShrink: 0,
        width: block ? '100%' : undefined,
        minWidth: block ? undefined : 84,
        height: block ? 32 : 28,
        boxSizing: 'border-box',
        padding: '0 12px',
        border: `1px solid ${pressed ? ink.brandTint : BUTTON_BORDER}`,
        borderRadius: 8,
        background: pressed ? ink.brandTint : '#FFFFFF',
        boxShadow: focused ? '0 0 0 3px rgba(83,58,253,0.16)' : pressed ? 'none' : '0px 1px 1px 0px rgba(33,37,44,0.08)',
        outline: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        ...text.bodyEmphasized,
        color: pressed ? ink.brand : ink.primary,
      }}
    >
      <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" style={{ flexShrink: 0 }}>
        {pressed
          ? <path d="M1.8 5.2 4 7.4 8.4 2.6" fill="none" stroke={ink.brand} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          : <path d="M5 1.5v7M1.5 5h7" fill="none" stroke={ink.primary} strokeWidth="1.4" strokeLinecap="round" />}
      </svg>
      {pressed ? 'Invited' : 'Invite'}
    </button>
  )
}

/** Business profile card for a recommendation. Brand border when invited. */
function ProfileCard({ candidate, why, invited, onToggle }) {
  return (
    <article
      data-wireframe-frame="card"
      aria-label={candidate.name}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minWidth: 0,
        boxSizing: 'border-box',
        padding: 16,
        background: '#FFFFFF',
        border: `1px solid ${invited ? ink.brand : CARD_BORDER}`,
        // A second, inset ring so the selected border reads at 2px without shifting layout.
        boxShadow: invited ? `inset 0 0 0 1px ${ink.brand}` : '0px 2px 5px 0px rgba(53,58,68,0.06)',
        borderRadius: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <LogoTile name={candidate.name} size={40} />
        <div style={{ flex: '1 0 0', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
          <span style={{ ...text.title, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{candidate.name}</span>
          <HandlePill handle={candidate.handle} verified={candidate.verified !== false} />
        </div>
      </div>

      <p style={{ ...text.bodyEmphasized, fontWeight: 400, margin: 0 }}>{candidate.description}</p>

      <p style={{ ...text.body, fontSize: 12, lineHeight: '16px', margin: 0, display: 'flex', gap: 6 }}>
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0, marginTop: 2 }}>
          <path d="M6 1 7.2 4.8 11 6 7.2 7.2 6 11 4.8 7.2 1 6 4.8 4.8Z" fill={ink.brand} />
        </svg>
        <span>{why}</span>
      </p>

      <div style={{ marginTop: 'auto', paddingTop: 4 }}>
        <InviteButton name={candidate.name} pressed={invited} onChange={next => onToggle(candidate.id, next)} block />
      </div>
    </article>
  )
}

/** Smaller profile row for search results. */
function ProfileRow({ candidate, invited, onToggle }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 8px 8px 8px',
        background: '#FFFFFF',
        border: `1px solid ${invited ? ink.brand : ink.divider}`,
        borderRadius: 8,
      }}
    >
      <LogoTile name={candidate.name} size={32} />
      <div style={{ flex: '1 0 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ ...text.bodyEmphasized, flexShrink: 0 }}>{candidate.name}</span>
          <HandlePill handle={candidate.handle} verified={candidate.verified !== false} />
        </span>
        <span style={{ ...text.body, fontSize: 12, lineHeight: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {`${candidate.description} · ${describe(candidate)}`}
        </span>
      </div>
      <InviteButton name={candidate.name} pressed={invited} onChange={next => onToggle(candidate.id, next)} />
    </div>
  )
}

/** The platform's business description, quoted, with a link to edit it in Settings. */
function BusinessDescription() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <span style={{ ...text.bodyEmphasized, flex: '1 0 0' }}>Your business description</span>
        <a
          href="#"
          onClick={e => e.preventDefault()}
          style={{ ...text.link, textDecoration: 'none', flexShrink: 0 }}
        >
          Edit in Settings
        </a>
      </span>
      <p style={{ ...text.body, margin: 0 }}>{`“${PLATFORM_PROFILE.businessDescription}”`}</p>
      <p style={{ ...text.body, fontSize: 12, lineHeight: '16px', margin: '4px 0 0', color: ink.secondary }}>
        We recommend businesses that match it.
      </p>
    </div>
  )
}

/** 12px Sail arrow drawn as a mask so it takes the button's text color. */
function PagerArrow({ direction }) {
  const src = `${ASSETS}/arrow-${direction}.svg`
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: 12,
        height: 12,
        backgroundColor: 'currentColor',
        maskImage: `url("${src}")`,
        WebkitMaskImage: `url("${src}")`,
        maskSize: '12px 12px',
        WebkitMaskSize: '12px 12px',
      }}
    />
  )
}

function PagerButton({ direction, disabled, onClick }) {
  return (
    <button
      type="button"
      aria-label={direction === 'left' ? 'Previous recommendations' : 'Next recommendations'}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        padding: 0,
        border: `1px solid ${BUTTON_BORDER}`,
        borderRadius: 8,
        background: '#FFFFFF',
        color: ink.primary,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      <PagerArrow direction={direction} />
    </button>
  )
}

/** Previous / "1 of 3" / next, under the card grid. */
function CardPager({ page, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <PagerButton direction="left" disabled={page === 0} onClick={() => onChange(page - 1)} />
      <span aria-live="polite" style={{ ...text.body, minWidth: 48, textAlign: 'center' }}>{`${page + 1} of ${CARD_PAGES}`}</span>
      <PagerButton direction="right" disabled={page === CARD_PAGES - 1} onClick={() => onChange(page + 1)} />
    </div>
  )
}

/** Quiet "N of 4 invited" line with a Sail progress ring. */
function GoalProgress({ count }) {
  const message = count >= GO_LIVE_ACCOUNTS
    ? `${count} invited · We’ll send invitations when you click Done`
    : `${count} of ${GO_LIVE_ACCOUNTS} invited · Going live takes ${GO_LIVE_ACCOUNTS} connected accounts`
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
      <GoalRing count={count} goal={GO_LIVE_ACCOUNTS} />
      <p aria-live="polite" style={{ ...text.body, margin: 0 }}>{message}</p>
    </div>
  )
}

export default function FindAccountsCardsStep({ state, setState }) {
  const inputId = useId()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(NO_FILTERS)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [cardPage, setCardPage] = useState(0)
  const selected = useMemo(() => new Set(state.selectedAccountIds ?? []), [state.selectedAccountIds])

  const filtering = query.trim().length > 0 || Object.keys(NO_FILTERS).some(k => filters[k] !== NO_FILTERS[k])
  // Unfiltered, results continue where the cards stop. Searching or filtering
  // shows every match, recommended ones included.
  const results = useMemo(
    () => RANKED.map(r => r.candidate).filter(c => (filtering || !RECOMMENDED_IDS.has(c.id)) && matches(c, query, filters)),
    [query, filters, filtering],
  )
  const visible = results.slice(0, visibleCount)
  // Businesses invited from search stay on screen after the search changes.
  const visibleIds = new Set(visible.map(c => c.id))
  const pinned = RANKED.map(r => r.candidate).filter(c => selected.has(c.id) && !RECOMMENDED_IDS.has(c.id) && !visibleIds.has(c.id))

  const resetPaging = () => setVisibleCount(PAGE_SIZE)
  const updateQuery = next => {
    setQuery(next)
    resetPaging()
  }
  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    resetPaging()
  }
  const clearFilters = () => {
    setQuery('')
    setFilters(NO_FILTERS)
    resetPaging()
  }

  const toggle = (id, next) => {
    const nextSet = new Set(selected)
    if (next) nextSet.add(id)
    else nextSet.delete(id)
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

      <BusinessDescription />

      <section aria-label="Recommended businesses" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          {RECOMMENDED.slice(cardPage * CARDS_PER_PAGE, (cardPage + 1) * CARDS_PER_PAGE).map(({ candidate, why }) => (
            <ProfileCard key={candidate.id} candidate={candidate} why={why} invited={selected.has(candidate.id)} onToggle={toggle} />
          ))}
        </div>
        {CARD_PAGES > 1 && <CardPager page={cardPage} onChange={setCardPage} />}
      </section>

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
          {pinned.map(c => <ProfileRow key={c.id} candidate={c} invited onToggle={toggle} />)}
          {visible.map(c => <ProfileRow key={c.id} candidate={c} invited={selected.has(c.id)} onToggle={toggle} />)}
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
