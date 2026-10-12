// Seed data for the Apps menu, the Apps nav section, and the Apps overview page.
// Apps without `icon` render their initial.

export const installedApps = [
  { id: 'zapier', name: 'Zapier', icon: '/dashboard-assets/icons/apps/zapier.svg', badge: true, description: 'Automate workflows between Stripe and 6,000+ apps' },
  { id: 'billit', name: 'Billit e-invoicing', icon: '/dashboard-assets/icons/apps/avalara.svg', badge: true, description: 'Send compliant e-invoices across Europe' },
  { id: 'pizzazz', name: 'Pizzazz Loyalty', icon: '/dashboard-assets/icons/apps/linear.svg', badge: true, description: 'Reward repeat customers with points and perks' },
  { id: 'parcelcraft', name: 'Parcelcraft Shipping', icon: '/dashboard-assets/icons/apps/box.svg', badge: true, description: 'Buy and print shipping labels from the Dashboard' },
  { id: 'pokemon', name: 'Pokemon Party', icon: '/dashboard-assets/icons/apps/pokeball.svg', badge: true, description: 'Collectible rewards for your customers' },
  { id: 'raul-melo', name: 'Raul Melo Full Page Review', badge: true, description: 'Full-page review drawer for payments' },
  { id: 'datasync', name: 'Datasync Warehouse', icon: '/dashboard-assets/icons/apps/database.svg', badge: true, description: 'Stream Stripe data to your warehouse' },
  { id: 'minion', name: 'Minion Mailer', icon: '/dashboard-assets/icons/apps/mascot.svg', badge: true, description: 'Friendly receipt and dunning emails' },
  { id: 'chargeflow', name: 'Chargeflow', badge: true, description: 'Automated dispute management' },
  { id: 'dunning', name: 'Dunning Desk', badge: true, description: 'Recover failed subscription payments' },
]

export const popularApps = [
  { id: 'hubspot', name: 'HubSpot Data Sync', icon: '/dashboard-assets/icons/apps/hubspot.svg', description: 'Sync HubSpot customers and products with Stripe' },
  { id: 'intercom', name: 'Intercom', icon: '/dashboard-assets/icons/apps/intercom.svg', description: "View your customers' Stripe data directly from your Intercom inbox", external: true },
  { id: 'docusign', name: 'DocuSign eSignature', icon: '/dashboard-assets/icons/apps/docusign.svg', description: 'Bring payments and agreements together' },
]

/** Apps overview → Discover → Recommended apps. */
export const recommendedApps = {
  popular: {
    title: 'Popular this month',
    apps: [
      { id: 'hubspot-billing', name: 'HubSpot - Quote - Billing Sync', icon: '/dashboard-assets/icons/apps/hubspot-billing.svg', description: 'Connect & automate HubSpot to Stripe Billing for visibility, error-free billing', external: true },
      { id: 'intercom', name: 'Intercom', icon: '/dashboard-assets/icons/apps/intercom.svg', description: "View your customers' Stripe data directly from your Intercom inbox", external: true },
      { id: 'sendowl', name: 'SendOwl', icon: '/dashboard-assets/icons/apps/sendowl.svg', description: 'Automatically and securely deliver digital goods you sell with Stripe' },
    ],
  },
  new: {
    title: 'Best new apps and updates',
    apps: [
      { id: 'tolt', name: 'Tolt', icon: '/dashboard-assets/icons/apps/tolt.svg', description: 'Launch an affiliate program that pays out on your Stripe revenue', external: true },
      { id: 'cap-genius', name: 'Cap Genius AI', icon: '/dashboard-assets/icons/apps/cap-genius.svg', description: 'Review agency subscriptions and customer activity inside the Stripe Dashboard', external: true },
      { id: 'gofunnel', name: 'GoFunnel', icon: '/dashboard-assets/icons/apps/gofunnel.svg', description: 'Turn Stripe revenue data into cohort and funnel performance insights', external: true },
    ],
  },
  startups: {
    eyebrow: 'For your business',
    title: 'Apps used by startups',
    apps: [
      { id: 'firstpromoter', name: 'FirstPromoter', icon: '/dashboard-assets/icons/apps/firstpromoter.svg', description: 'Affiliate and referral tracking for SaaS' },
      { id: 'mercury', name: 'Mercury', icon: '/dashboard-assets/icons/apps/mercury.svg', description: 'Stripe revenue to your Mercury account in minutes' },
    ],
  },
}
