// Content for the Stripe network onboarding conversation (and /go-live).
// Console's own copy of the Dashboard flow's content: the account ids match
// the Dashboard's network candidates so a finished result can be handed back
// (src/integration/consoleHandoff.js). Keep wording in step with the
// Dashboard dialog when either changes.

export const PLATFORM_NAME = 'Rocketrides';

// Recommended first: the best match for each industry Rocketrides serves.
export const NETWORK_MATCHES = [
  { id: 'acct_1PqK2hV7rL5xM1bS', name: 'Common Thread', industry: 'Apparel', country: 'United Kingdom', volume: '$50k–$100k/mo', why: 'Matches "apparel" in your description · Ready to connect', recommended: true },
  { id: 'acct_1PqB2mT8sL4yC6dE', name: 'Glow Theory', industry: 'Beauty', country: 'United States', volume: '$50k–$100k/mo', why: 'Matches "beauty" in your description · Ready to connect', recommended: true },
  { id: 'acct_1PqJ6tN0wA3fG9kC', name: 'Petal & Pine', industry: 'Home goods', country: 'United States', volume: '$10k–$50k/mo', why: 'Matches "home goods" in your description · Ready to connect', recommended: true },
  { id: 'acct_1PqP5wY6gM3rE8dX', name: 'Tidepool Goods', industry: 'Accessories', country: 'Canada', volume: '$10k–$50k/mo', why: 'Matches "accessories" in your description · Ready to connect', recommended: true },
  { id: 'acct_1PqV2gN5fT7yL3kD', name: 'Little Wren', industry: 'Apparel', country: 'Australia', volume: '$10k–$50k/mo', why: 'Sells direct to customers · Ready to connect' },
  { id: 'acct_1PqR3mJ5aP7uG6fZ', name: 'Verdant Skin', industry: 'Beauty', country: 'United Kingdom', volume: '$50k–$100k/mo', why: 'Sells direct to customers · Ready to connect' },
  { id: 'acct_1Pr0A6mT8lY4dR5pJ', name: 'Rove Eyewear', industry: 'Accessories', country: 'Australia', volume: '$50k–$100k/mo', why: 'Sells direct to customers · Ready to connect' },
  { id: 'acct_1PqZ3lS7kX9cQ1oH', name: 'Fernwood Botanics', industry: 'Home goods', country: 'United Kingdom', volume: '$10k–$50k/mo', why: 'Sells direct to customers · Ready to connect' },
  { id: 'acct_1PqA7hN3kR2vX9wB', name: 'Northwind Knitwear', industry: 'Apparel', country: 'United States', volume: '$100k–$500k/mo', why: 'Sells direct to customers · Ready to connect' },
  { id: 'acct_1PqE8yG2bX5mR1sL', name: 'Saltwater Studio', industry: 'Apparel', country: 'Australia', volume: '$100k–$500k/mo', why: 'Sells direct to customers · Ready to connect' },
  { id: 'acct_1Pr2C4oV6nA1fT8rL', name: 'Kelp Beauty', industry: 'Beauty', country: 'Canada', volume: 'Under $10k/mo', why: 'Sells direct to customers · Ready to connect' },
  { id: 'acct_1PqX4jQ6hV8aN2mF', name: 'Stillwater Home', industry: 'Home goods', country: 'Australia', volume: '$50k–$100k/mo', why: 'Sells direct to customers' },
];

export const RECOMMENDED_MATCHES = NETWORK_MATCHES.filter(match => match.recommended);

export const NETWORK_PROFILE_TAB_ID = 'network-profile';
export const NETWORK_MATCHES_TAB_ID = 'network-matches';

export const NETWORK_PROFILE_MARKDOWN = `# Your Stripe network profile

Businesses on the Stripe network see this profile when you're matched.

**${PLATFORM_NAME}** · @rocketrides
Online storefronts for independent brands that sell direct.

- **Industries served:** Apparel, beauty, home goods, accessories
- **Countries served:** United States, United Kingdom, Canada, Australia

## Stripe network terms

- **You get matched with complementary businesses.** Accounts you invite can reuse details they've already given Stripe.
- **Your profile is visible.** Businesses on the network see your name, industry and countries served.
- **Your connected accounts stay private.** Their details are never shared without their permission.
- **You're in control.** Leave the network at any time.
`;

export const JOIN_OPTIONS = {
  agree: 'Agree to the terms and join',
  terms: 'Show me the full terms',
  decline: 'Not now',
};

// /go-live: what's left to get the platform live. Only the network item runs
// here; the rest point to their Dashboard page.
export const GO_LIVE_OPTIONS = [
  { id: 'network', label: 'Onboard faster with accounts on the Stripe network' },
  { id: 'capital', label: 'Add Capital and Treasury', reply: 'Capital and Treasury are set up in the Dashboard. You can offer financing and money management to your connected accounts from there.', link: { label: 'Open Capital in Dashboard', path: '/dashboard/connect/capital' } },
  { id: 'pricing', label: 'Set what connected accounts pay', reply: 'The platform pricing tool lives in the Dashboard. You can set fees per account type and preview what accounts pay.', link: { label: 'Open Pricing in Dashboard', path: '/dashboard/connect/pricing' } },
  { id: 'apps', label: 'Add prebuilt skills and agents', reply: 'Platform Apps has prebuilt skills and agents you can add to your platform.', link: { label: 'Open Apps in Dashboard', path: '/dashboard/apps' } },
];

// Prompts that start the network conversation, including the Dashboard's
// handoff prompt ("Help me find my first connected accounts on the Stripe network").
export function isNetworkPrompt(text) {
  if (typeof text !== 'string') return false;
  return /stripe network/i.test(text) || /\b(find|invite|onboard)\b.*\bconnected accounts?\b/i.test(text);
}

export function answerKind(text, options) {
  const value = text.trim().toLowerCase();
  const exact = Object.entries(options).find(([, label]) => label.toLowerCase() === value);
  if (exact) return exact[0];
  if (/\b(no|not now|later|skip|cancel)\b/.test(value)) return 'decline';
  if (/\bterms?\b|\bprofile\b|\bshare\b/.test(value)) return 'terms';
  if (/\b(yes|agree|join|sure|ok|okay|continue)\b/.test(value)) return 'agree';
  return null;
}
