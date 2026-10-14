import { ACCOUNT_NAME } from '../../../components/Header';

/**
 * The sender's OWN linked accounts — where a payout to yourself goes.
 *
 * Separate from data/payoutMethods.js, which holds accounts belonging to recipients. The
 * two are the same shape on purpose: the flow's selectors, quote and Review all read a
 * "method", and a payout to your own bank is the same transaction as a payout to someone
 * else's, so making it a different shape would have meant special-casing every screen
 * downstream.
 *
 * Two kinds, as the frames show: bank accounts and stablecoin wallets. Bank artwork is
 * limited to what the repo has, so the accounts are named for the marks we can render —
 * the frame's Wells Fargo and TD Bank have no artwork here.
 */

export const EXTERNAL_GROUPS = [
  { id: 'bank', label: 'Bank accounts' },
  // "Stablecoin wallets", not "Wallets": the account holds a token, and the group name is
  // what tells the sender these rows are a different kind of thing from the banks above.
  { id: 'wallet', label: 'Stablecoin wallets' },
];

export const EXTERNAL_ACCOUNTS = [
  {
    id: 'ext_boa',
    group: 'bank',
    label: 'Bank of America',
    logo: '/logos/banks/boa.png',
    currency: 'USD',
    country: 'US',
    last4: '4856',
    badge: 'lastUsed',
  },
  {
    id: 'ext_capitalone',
    group: 'bank',
    label: 'Capital One',
    logo: '/logos/banks/capitalone.png',
    currency: 'USD',
    country: 'US',
    last4: '2153',
  },
  {
    id: 'ext_goldman',
    group: 'bank',
    label: 'Goldman Sachs',
    logo: '/logos/banks/goldmansachs.png',
    currency: 'USD',
    country: 'US',
    last4: '5801',
  },
  {
    id: 'ext_tempo',
    group: 'wallet',
    label: 'Tempo',
    logo: '/logos/networks/tempo.png',
    // The token the wallet holds, which is the currency as far as the quote is concerned.
    currency: 'USDC',
    country: 'US',
    // Truncated the way a wallet address is shown everywhere: enough of each end to
    // recognise, never enough to transcribe.
    address: 'F1··CnJN',
  },
  {
    id: 'ext_base',
    group: 'wallet',
    label: 'Base',
    logo: '/logos/networks/base.png',
    currency: 'USDC',
    country: 'US',
    address: 'Tp··cIS2',
  },
  {
    id: 'ext_solana',
    group: 'wallet',
    label: 'Solana',
    logo: '/logos/networks/sol.png',
    currency: 'USDC',
    country: 'US',
    address: 'M3··Ni08',
  },
];

export function externalAccount(id) {
  return EXTERNAL_ACCOUNTS.find((a) => a.id === id) ?? null;
}

/** The account the picker opens on: whichever was paid last. */
export function defaultExternalAccount() {
  return (
    EXTERNAL_ACCOUNTS.find((a) => a.badge === 'lastUsed') ??
    EXTERNAL_ACCOUNTS[0]
  );
}

/** "USD · Account ····4856" / "USDC · F1··CnJN" */
export function externalSublabel(a) {
  if (!a) return null;
  if (a.group === 'wallet') return `${a.currency} · ${a.address}`;
  return `${a.currency} · Account ····${a.last4}`;
}

/**
 * The rail an external payout takes.
 *
 * A standard payout to your own account is free — which is what lets the two amounts on
 * the form match, as the frame shows them. A wallet settles on its network, which is free
 * too, and both are declared in data/deliveryMethods.js rather than assumed here.
 */
export function externalRailFor(account) {
  return account?.group === 'wallet' ? 'usdc' : 'external_standard';
}

/**
 * Paying yourself still has a "recipient" as far as every downstream screen is concerned,
 * and it's the business. Review's To row then reads "Rocket Rides / USD · Bank of America
 * ····4856", which is exactly what the payout is.
 *
 * Not in data/recipients.js: it must never appear in search or Recent, and the surest way
 * to guarantee that is for the list never to contain it.
 */
export const SELF_RECIPIENT = {
  id: 'self',
  name: ACCOUNT_NAME,
  entity: 'self',
  country: 'US',
  currency: 'USD',
  isSelf: true,
};
