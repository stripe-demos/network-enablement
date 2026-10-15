// Example business descriptions that cycle through the step-1 textarea while it
// is empty.
//
// All 11 are verbatim from the Figma "Placeholders" spec frame `1484:234953`.
// They sit there as two columns of loose text nodes, so the file encodes no
// shuffle order — this sequence is reading order and is arbitrary, which is fine
// since they cycle.
//
// Note: the composer frames render "We offer a ridesharing service…" while the
// spec frame says "We operate a ridesharing service…". The spec frame wins here.

export const PLACEHOLDERS = [
  'We offer bookstores a platform for selling books and merchandise online and in store. Each store charges its customers under its own name.',
  'We offer contractors a platform for invoicing clients, scheduling jobs, and tracking hours. Each contractor bills their clients directly.',
  'We host donation pages for nonprofits. Donors pay each nonprofit directly.',
  'We operate a ridesharing service. Riders pay us through our app, and we pay each driver right after the ride.',
  'We run a food delivery app. Customers pay us for the order, and we pass each restaurant its share immediately.',
  'We match businesses with vetted freelancers for short projects. Businesses pay us, and freelancers can cash out their earnings the same day.',
  'We host paid newsletters for independent writers. Readers pay us a monthly subscription, and each writer gets their share of every payment biweekly.',
  "We run a ticket marketplace. We charge customers at checkout for tickets from multiple hosts, and we don't pay a host until their event has happened.",
  'We sell handmade goods from independent shops. One cart can include items from several shops, customers pay us, and we pay each shop when its items ship.',
  'We run a marketplace for monthly sublets. Guests pay us the deposit and first month up front, and we pay each host after check-in.',
  'We run a crowdfunding site for creative projects. Backers pay us when a campaign reaches its goal, and creators get the money after the campaign closes.',
];
