// Data for step 3, version A ("Swipe"): the deck order, the "why it's a
// match" reasons and the simulated public profile fields the business profile
// card needs. Ranking comes from recommendAccounts.js, so the deck and the
// cards version agree on who the best matches are.
import { NETWORK_CANDIDATES, VOLUME_RANGES } from '../networkCandidates'
import { PLATFORM_PROFILE } from '../platformProfile'
import { rankCandidates, recommendCandidates } from '../recommendAccounts'

export const GO_LIVE_ACCOUNTS = 4

export const RANKED = rankCandidates(NETWORK_CANDIDATES, PLATFORM_PROFILE)
const RECOMMENDED = recommendCandidates(RANKED, GO_LIVE_ACCOUNTS)

// The four recommendations (one per industry in the description) come first,
// then everyone else, best match first.
export const DECK = [...RECOMMENDED, ...RANKED.filter(r => !RECOMMENDED.includes(r))]
export const DECK_BY_ID = new Map(DECK.map(r => [r.candidate.id, r]))
export const RANK_ORDER = RANKED.map(r => r.candidate.id)

const PHRASES = new Map([
  ...PLATFORM_PROFILE.industriesServed.map(i => [`industry:${i.industry}`, i.phrase]),
  ...PLATFORM_PROFILE.businessTypesServed.map(t => [`businessType:${t.businessType}`, t.phrase]),
])

const withArticle = country => (country.startsWith('United') ? `the ${country}` : country)

/** Reasons for the "Why it’s a match" list: [{ key, title }]. */
// One line each (48 characters at most with real values), at most 5.
export const MAX_MATCH_REASONS = 5

export function matchReasons({ candidate, reasons }) {
  const out = reasons.map(r => {
    switch (r.key) {
      case 'industry':
        return { key: r.key, title: `Matches “${PHRASES.get(`industry:${candidate.industry}`)}” in your description` }
      case 'businessType':
        return { key: r.key, title: 'Sells direct to customers, like your brands' }
      case 'readyToConnect':
        return { key: r.key, title: 'Ready to connect with their Stripe details' }
      case 'country':
        return { key: r.key, title: `Based in ${withArticle(candidate.country)}, which you serve` }
      case 'size':
        return { key: r.key, title: `${candidate.volumeRange}, typical for your platform` }
      default:
        return null
    }
  }).filter(Boolean).slice(0, MAX_MATCH_REASONS)
  return out.length ? out : [{ key: 'verified', title: `Verified business in ${withArticle(candidate.country)}` }]
}

// Simulated public profile fields. Candidates only carry a name, handle and
// description, so the card's logo, website and address are derived here.
const CITY = {
  'United States': ['Brooklyn, NY 11201', 'Portland, OR 97209', 'Austin, TX 78701', 'Los Angeles, CA 90012'],
  'United Kingdom': ['London EC2A 4NE', 'Manchester M1 1AE', 'Bristol BS1 4DJ'],
  Canada: ['Toronto, ON M5V 2T6', 'Vancouver, BC V6B 1A1', 'Montréal, QC H2Y 1C6'],
  Australia: ['Melbourne VIC 3000', 'Sydney NSW 2000'],
  France: ['75003 Paris'],
  Germany: ['10115 Berlin'],
}
const STREETS = ['12 Market St', '48 Mill Rd', '210 Union Ave', '7 Harbour Ln', '95 Elm St', '3 Station Pl']
const TILE = { Apparel: '#2F3B4C', Beauty: '#7A3E5C', 'Home goods': '#3E5C4A', Accessories: '#5A4632' }

function hash(s) {
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}

function logoFor(candidate) {
  const fill = TILE[candidate.industry] ?? '#353A44'
  const initial = candidate.name.charAt(0)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><rect width="44" height="44" fill="${fill}"/><text x="22" y="29" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="20" font-weight="600" fill="#FFFFFF">${initial}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** Props for BusinessProfileCard. */
export function profileFor(candidate) {
  const h = hash(candidate.id)
  const cities = CITY[candidate.country] ?? [candidate.country]
  return {
    name: candidate.name,
    handle: candidate.handle,
    logo: logoFor(candidate),
    tagline: candidate.description,
    website: `${candidate.handle}.com`,
    address: [STREETS[h % STREETS.length], cities[h % cities.length]],
  }
}

// Browse all: search and filters over every business.
const uniqueOptions = values => [...new Set(values)].sort().map(v => ({ value: v, label: v }))
export const INDUSTRY_OPTIONS = uniqueOptions(RANKED.map(r => r.candidate.industry))
export const COUNTRY_OPTIONS = uniqueOptions(RANKED.map(r => r.candidate.country))
export const VOLUME_OPTIONS = VOLUME_RANGES.map(v => ({ value: v, label: v.replace('/mo', '') }))
export const NO_FILTERS = { industry: '', country: '', volumeRange: '', readyOnly: false }

export function matchesFilters(candidate, query, filters) {
  if (filters.industry && candidate.industry !== filters.industry) return false
  if (filters.country && candidate.country !== filters.country) return false
  if (filters.volumeRange && candidate.volumeRange !== filters.volumeRange) return false
  if (filters.readyOnly && !candidate.readyToConnect) return false
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [candidate.name, candidate.handle, candidate.description, candidate.industry, candidate.country].some(v => v.toLowerCase().includes(q))
}
