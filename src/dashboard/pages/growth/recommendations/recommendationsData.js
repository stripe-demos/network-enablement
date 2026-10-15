// Recommendations tab data, from Figma "Growth Studio – Recommendations".
// `filter` is the chip a card counts toward; `tag` is the label on the card.

export const LEAD =
  'Based on your platform data and peer benchmarks, we estimate over $163K in additional monthly margin across pricing, payment methods, and integration improvements.'

export const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'expansion', label: 'Expansion' },
  { id: 'integration', label: 'Integration' },
]

export const SECTIONS = [
  { id: 'highest-impact', title: 'Highest impact', featured: true },
  { id: 'expand-revenue', title: 'Expand revenue' },
  { id: 'recover-margin', title: 'Recover margin' },
]

export const RECOMMENDATIONS = [
  {
    id: 'ach-pricing',
    section: 'highest-impact',
    filter: 'pricing',
    tag: 'Pricing',
    title: 'Improve ACH pricing',
    description: 'Your ACH take rate is 94bps below peers. Adjusting pricing could close the gap.',
    impact: '$49.5K',
  },
  {
    id: 'reverse-transfers',
    section: 'highest-impact',
    filter: 'integration',
    tag: 'Integration',
    title: 'Reverse transfers on disputes',
    description: 'Recover margin lost when disputed transfers aren’t reversed to connected accounts',
    impact: '$49.5K',
  },
  {
    id: 'bnpl',
    section: 'highest-impact',
    filter: 'expansion',
    tag: 'Product expansion',
    title: 'Offer Buy Now, Pay Later',
    description: '523 eligible accounts don’t offer BNPL. Enabling it could drive higher order values at checkout.',
    impact: '$49.5K',
  },
  {
    id: 'instant-payouts',
    section: 'expand-revenue',
    filter: 'expansion',
    tag: 'Product expansion',
    title: 'Promote Instant Payouts',
    description: '938 eligible accounts aren’t using Instant Payouts. Promotional pricing could drive first-time usage.',
    impact: '$49.5K',
  },
  {
    id: 'apple-pay',
    section: 'expand-revenue',
    filter: 'expansion',
    tag: 'Payment methods',
    title: 'Offer Apple Pay',
    description: '1,204 eligible accounts don’t offer Apple Pay. Enabling it could speed up checkout and increase conversion.',
    impact: '$49.5K',
  },
  {
    id: 'ach-direct-debit',
    section: 'expand-revenue',
    filter: 'expansion',
    tag: 'Payment methods',
    title: 'Accept ACH Direct Debit',
    description: '847 eligible accounts don’t accept ACH. Enabling it could reduce processing costs for recurring payments.',
    impact: '$49.5K',
  },
  {
    id: 'link',
    section: 'expand-revenue',
    filter: 'expansion',
    tag: 'Payment methods',
    title: 'Offer Link',
    description: '1,105 eligible accounts don’t offer Link. Enabling it could boost conversion with autofilled payments.',
    impact: '$49.5K',
  },
  {
    id: 'application-fee',
    section: 'recover-margin',
    filter: 'pricing',
    tag: 'Pricing',
    title: 'Add application fee',
    description: 'Some charges have no platform earnings. Adding fees could improve your margin.',
    impact: '$49.5K',
  },
  {
    id: 'affirm-pricing',
    section: 'recover-margin',
    filter: 'pricing',
    tag: 'Pricing',
    title: 'Improve Affirm pricing',
    description: 'Your Affirm take rate is 60bps below peers. Adjusting pricing could close the gap.',
    impact: '$49.5K',
  },
  {
    id: 'card-pricing',
    section: 'recover-margin',
    filter: 'pricing',
    tag: 'Pricing',
    title: 'Improve card pricing',
    description: 'Your card take rate is 60bps below peers. Adjusting pricing could close the gap.',
    impact: '$49.5K',
  },
]
