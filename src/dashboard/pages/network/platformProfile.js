// Simulated onboarding profile for the platform joining the Stripe network.
// `businessDescription` is what the platform typed during onboarding; the other
// fields are what Stripe derives from it and from onboarding answers. The
// "Find connected accounts" step ranks businesses against this profile
// (see recommendAccounts.js).

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
