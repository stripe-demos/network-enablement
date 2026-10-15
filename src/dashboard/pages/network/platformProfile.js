// Simulated onboarding profile for the platform joining the Stripe network.
// `businessDescription` is what the platform typed during onboarding; the other
// fields are what Stripe derives from it and from onboarding answers. The
// "Find connected accounts" step ranks businesses against this profile
// (see recommendAccounts.js).
import { savedBusinessDescription } from '../connect-setup/connectSetupStore'

export const PLATFORM_PROFILE = {
  name: 'Rocketrides',
  // Public business profile shown to the network (Opt in step).
  handle: 'rocketrides',
  logo: '/dashboard-assets/network/rocketrides.svg',
  tagline: 'Online storefronts for independent brands that sell direct.',
  website: 'rocketrides.io',
  address: ['500 Howard St', 'San Francisco, CA 94105'],
  businessDescription:
    'We help independent apparel, beauty, home goods and accessories brands sell direct to customers. Most of our brands are in the US, UK, Canada and Australia.',

  // Derived fields. Each `phrase` appears verbatim in the description, so a
  // recommendation can point at the words it matched.
  industriesServed: [
    { industry: 'Apparel', phrase: 'apparel' },
    { industry: 'Beauty', phrase: 'beauty' },
    { industry: 'Home goods', phrase: 'home goods' },
    { industry: 'Accessories', phrase: 'accessories' },
  ],
  businessTypesServed: [{ businessType: 'Direct-to-consumer brand', phrase: 'sell direct to customers' }],
  countries: ['United States', 'United Kingdom', 'Canada', 'Australia'],
  // Monthly volume of a typical connected account, as VOLUME_RANGES entries.
  typicalAccountSize: { label: '$10k–$100k/mo', volumeRanges: ['$10k–$50k/mo', '$50k–$100k/mo'] },
}

// Words that name each candidate industry. The longest match wins, so
// "food and beverage" beats "food". Used to read the industries out of a description typed in setup.
const INDUSTRY_WORDS = {
  Apparel: ['apparel', 'clothing', 'fashion', 'knitwear', 'streetwear'],
  Beauty: ['beauty', 'skincare', 'skin care', 'cosmetics', 'makeup'],
  'Home goods': ['home goods', 'homewares', 'homeware', 'furniture', 'candles', 'home decor'],
  Accessories: ['accessories', 'jewelry', 'jewellery', 'bags', 'watches'],
  'Food and beverage': ['food and beverage', 'food', 'beverages', 'coffee', 'snacks', 'drinks', 'restaurants'],
  Outdoor: ['outdoor', 'camping', 'hiking', 'cycling'],
  Wellness: ['wellness', 'fitness', 'yoga', 'supplements'],
}
const DIRECT_TO_CUSTOMER = /sells? direct(?:ly)? to (?:customers|consumers)|direct[- ]to[- ](?:consumer|customer)s?|\bd2c\b|\bdtc\b/i

/** The longest of `words` that appears in the description, or null. */
function findPhrase(description, words) {
  const lower = description.toLowerCase()
  return [...words].sort((x, y) => y.length - x.length).find(word => new RegExp(`\\b${word}\\b`).test(lower)) ?? null
}

/** Derive the matching fields from a typed description; the rest stays simulated. */
function profileFromDescription(description) {
  const industriesServed = Object.entries(INDUSTRY_WORDS)
    .map(([industry, words]) => ({ industry, phrase: findPhrase(description, words) }))
    .filter(i => i.phrase)
  const direct = description.match(DIRECT_TO_CUSTOMER)
  return {
    ...PLATFORM_PROFILE,
    businessDescription: description,
    industriesServed,
    businessTypesServed: direct ? [{ businessType: 'Direct-to-consumer brand', phrase: direct[0].toLowerCase() }] : [],
  }
}

let cachedDescription = ''
let cachedProfile = PLATFORM_PROFILE

/**
 * The profile the Find accounts step ranks against. Once Connect setup has
 * saved a business description, its industries and business type come from
 * that text; otherwise it's the simulated PLATFORM_PROFILE. Read it at use
 * time, since setup can change it. Same object until the description changes.
 */
export function getPlatformProfile() {
  const description = savedBusinessDescription()
  if (description !== cachedDescription) {
    cachedDescription = description
    cachedProfile = description ? profileFromDescription(description) : PLATFORM_PROFILE
  }
  return cachedProfile
}

/** What the platform said it does: the description typed in Connect setup, or the simulated one. */
export const getPlatformBusinessDescription = () => getPlatformProfile().businessDescription
