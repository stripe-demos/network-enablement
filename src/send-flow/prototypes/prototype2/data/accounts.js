/**
 * Source accounts for the "Pay from" control, grouped as 429:224264 groups them
 * (Primary / Financial / Operational, across USD/GBP/EUR/USDC).
 *
 * Balances seeded from SendModal2.jsx:725-738.
 */
export const ACCOUNTS = [
  {
    id: 'primary_usd',
    group: 'Primary',
    name: 'Primary account',
    currency: 'USD',
    country: 'US',
    balance: 124350,
    logo: '/logos/fa/USD.png',
  },
  {
    id: 'fa_usd',
    group: 'Financial',
    name: 'Financial account',
    currency: 'USD',
    country: 'US',
    balance: 47024.22,
    logo: '/logos/fa/USD.png',
  },
  {
    id: 'fa_gbp',
    group: 'Financial',
    name: 'GBP Operating',
    currency: 'GBP',
    country: 'GB',
    balance: 48720,
    logo: '/logos/fa/GBP.png',
  },
  {
    id: 'fa_eur',
    group: 'Financial',
    name: 'EMEA Finance',
    currency: 'EUR',
    country: 'DE',
    balance: 67890,
    logo: '/logos/fa/EUR.png',
  },
  {
    id: 'fa_usdc',
    group: 'Financial',
    name: 'USDC Wallet',
    currency: 'USDC',
    country: null,
    balance: 32500,
    logo: '/logos/fa/USDC.png',
  },
  {
    id: 'op_usd',
    group: 'Operational',
    name: 'Operating',
    currency: 'USD',
    country: 'US',
    balance: 123.41,
    logo: '/logos/fa/USD.png',
  },
  {
    id: 'op_gbp',
    group: 'Operational',
    name: 'Capital',
    currency: 'GBP',
    country: 'GB',
    balance: 3204.81,
    logo: '/logos/fa/GBP.png',
  },
];

/**
 * Group ids (which each account's `group` points at) paired with what the
 * dropdown calls them. The label carries a noun: "Primary" / "Financial" /
 * "Operational" alone are bare adjectives, and the distinction between the last
 * two means nothing to anyone outside the team that drew the taxonomy.
 */
export const ACCOUNT_GROUPS = [
  { id: 'Primary', label: 'Primary balance' },
  { id: 'Financial', label: 'Financial accounts' },
  { id: 'Operational', label: 'Operational accounts' },
];

export function account(id) {
  return ACCOUNTS.find((a) => a.id === id) ?? null;
}
