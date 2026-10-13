// Ranks network businesses against a platform's onboarding profile. Kept simple
// and additive so every point can be explained in the UI.
//
//   Industry named in the business description     +3
//   Business type the platform serves              +2
//   Ready to connect (reuses info given to Stripe) +2
//   Country the platform serves                    +1
//   Typical account size                           +1 (adjacent band +0.5)
//
// Businesses that already use a platform doing the same job are left out, so
// matches stay complementary.
import { VOLUME_RANGES } from './networkCandidates'

export const WEIGHTS = { industry: 3, businessType: 2, readyToConnect: 2, country: 1, size: 1 }

/** Businesses it makes sense to suggest at all. */
export const isComplementary = candidate => !candidate.usesSimilarPlatform

function sizeFit(candidate, profile) {
  const band = VOLUME_RANGES.indexOf(candidate.volumeRange)
  const typical = profile.typicalAccountSize.volumeRanges.map(r => VOLUME_RANGES.indexOf(r))
  if (typical.includes(band)) return 1
  if (typical.some(t => Math.abs(t - band) === 1)) return 0.5
  return 0
}

/**
 * Score one business. Returns { score, reasons, why } where `reasons` lists the
 * signals that matched (strongest first) and `why` is a short line for the UI.
 */
export function scoreCandidate(candidate, profile) {
  const reasons = []
  const industry = profile.industriesServed.find(i => i.industry === candidate.industry)
  if (industry) reasons.push({ key: 'industry', points: WEIGHTS.industry, label: `Matches “${industry.phrase}” in your description` })
  const type = profile.businessTypesServed.find(t => t.businessType === candidate.businessType)
  if (type) reasons.push({ key: 'businessType', points: WEIGHTS.businessType, label: `Matches “${type.phrase}”` })
  if (candidate.readyToConnect) reasons.push({ key: 'readyToConnect', points: WEIGHTS.readyToConnect, label: 'Ready to connect' })
  if (profile.countries.includes(candidate.country)) reasons.push({ key: 'country', points: WEIGHTS.country, label: `Based in ${candidate.country}` })
  const size = sizeFit(candidate, profile)
  if (size) reasons.push({ key: 'size', points: WEIGHTS.size * size, label: 'Typical size for your platform' })

  const score = reasons.reduce((sum, r) => sum + r.points, 0)
  // Two reasons fit on one line: the description match (or business type), then readiness.
  const lead = reasons.find(r => r.key === 'industry') ?? reasons.find(r => r.key === 'businessType')
  const ready = reasons.find(r => r.key === 'readyToConnect')
  const why = [lead, ready ?? reasons.find(r => r !== lead)].filter(Boolean).map(r => r.label).join(' · ')
  return { score, reasons, why }
}

/** All complementary businesses, best match first (stable for ties). */
export function rankCandidates(candidates, profile) {
  return candidates
    .filter(isComplementary)
    .map(candidate => ({ candidate, ...scoreCandidate(candidate, profile) }))
    .sort((a, b) => b.score - a.score) // Array#sort is stable, so ties keep data order
}

/**
 * Top `count` recommendations. Takes the best match from each industry in the
 * description first, so the shortlist covers what the platform said it serves,
 * then fills any remaining slots by score.
 */
export function recommendCandidates(ranked, count = 4) {
  const picks = []
  const seen = new Set()
  for (const r of ranked) {
    if (picks.length === count) break
    const industryMatch = r.reasons.some(x => x.key === 'industry')
    if (industryMatch && !seen.has(r.candidate.industry)) {
      seen.add(r.candidate.industry)
      picks.push(r)
    }
  }
  for (const r of ranked) {
    if (picks.length === count) break
    if (!picks.includes(r)) picks.push(r)
  }
  return picks.sort((a, b) => ranked.indexOf(a) - ranked.indexOf(b))
}
