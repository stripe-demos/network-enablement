// waivers.js
//
// Encodes the compliance "waivers" (acknowledgment steps) that appear
// dynamically between step 2 (Review setup) and step 3 (Build) of the
// Connect onboarding prototype. Which waivers show — and in what order —
// depends on the configuration the user selected in step 2.
//
// Each waiver's `applies(config)` predicate gates whether that
// acknowledgment step is required for a given config. The `config` object
// is a map of settingId -> value:
//   onboardingMethod:         'stripe-hosted' | 'embedded' | 'api'
//   dashboardAccess:          'full' | 'express' | 'embedded' | 'none'
//   chargeType:               'direct' | 'destination' | 'separate'
//   negativeBalanceLiability: 'stripe' | 'platform'
//
// Use `applicableWaivers(config)` to get the ordered list of waivers to
// render for the current config.

export const WAIVERS = [
  {
    id: 'negative-balances',
    navLabel: 'Liability for negative balances',
    title: 'Liability for negative balances.',
    subtitle:
      'Review and acknowledge your risk responsibilities and liability if you use API onboarding.',
    responsibilities: [
      {
        label: 'Liability for seller losses',
        detail:
          "You cover negative balances your connected accounts can't repay from chargebacks, refunds, or disputes.",
      },
      {
        label: 'Onboarding and compliance',
        detail:
          'You collect and verify the identity and compliance information Stripe requires for each account.',
      },
      {
        label: 'Risk underwriting',
        detail:
          "You assess each account's risk before enabling payments and set appropriate limits.",
      },
      {
        label: 'Risk monitoring and detection',
        detail:
          'You monitor account activity for fraud and suspicious behavior on an ongoing basis.',
      },
      {
        label: 'Risk actions to mitigate losses',
        detail:
          'You take timely action — holds, reserves, or offboarding — to limit losses.',
      },
      {
        label: 'Support for payment and risk inquiries',
        detail:
          'You handle payment and risk questions from your connected accounts directly.',
      },
    ],
    ackLabel:
      'I acknowledge I have reviewed and agree to my risk responsibilities and liability for negative balances.',
    applies: (config) =>
      config.onboardingMethod === 'api' ||
      config.negativeBalanceLiability === 'platform',
  },
  {
    id: 'refunds-chargebacks',
    navLabel: 'Liability for refunds and chargebacks',
    title: 'Liability for refunds and chargebacks.',
    subtitle: 'Review and acknowledge your responsibilities.',
    responsibilities: [
      {
        label: 'Refunds and chargebacks',
        detail:
          "You're responsible for funding refunds and covering chargebacks on payments you collect.",
      },
      {
        label: 'Onboarding and compliance',
        detail:
          'You collect and verify the required information from the accounts you onboard.',
      },
      {
        label: 'Support for payment and risk inquiries',
        detail:
          'You handle payment and risk questions from your connected accounts directly.',
      },
    ],
    ackLabel:
      'I acknowledge I have reviewed and agree to my responsibilities.',
    applies: (config) =>
      config.chargeType === 'destination' || config.chargeType === 'separate',
  },
  {
    id: 'ongoing-seller-compliance',
    navLabel: 'Ongoing seller compliance',
    title: 'Ongoing seller compliance.',
    subtitle:
      'Review and acknowledge your responsibility for ongoing seller compliance if you build your own dashboard.',
    responsibilities: [
      {
        label: 'Seller communication',
        detail:
          'You keep connected accounts informed about requirements, changes, and required actions.',
      },
      {
        label: 'Seller remediation',
        detail:
          'You follow up with accounts to resolve compliance gaps and collect any missing information.',
      },
    ],
    ackLabel:
      'I acknowledge I have reviewed and agree to my responsibility for ongoing seller compliance.',
    applies: (config) =>
      config.dashboardAccess === 'none' ||
      config.dashboardAccess === 'embedded',
  },
];

export function applicableWaivers(config = {}) {
  return WAIVERS.filter((w) => w.applies(config));
}
