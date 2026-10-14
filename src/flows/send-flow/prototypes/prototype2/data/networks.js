/**
 * Stablecoin networks, ported from SendModal2.jsx:574-580 (same five, same logos).
 *
 * These are product names, so they're written as product names. They used to be
 * uppercased to match the frame's selected value ("BASE"), but a whole dropdown of
 * shouted words reads as tickers, and nothing else in the flow sets type in caps.
 */
export const NETWORKS = [
  { id: 'base', label: 'Base', logo: '/logos/networks/base.png' },
  { id: 'ethereum', label: 'Ethereum', logo: '/logos/networks/eth.png' },
  { id: 'phantom', label: 'Phantom', logo: '/logos/networks/phantom.png' },
  { id: 'solana', label: 'Solana', logo: '/logos/networks/sol.png' },
  { id: 'tempo', label: 'Tempo', logo: '/logos/networks/tempo.png' },
];

export function network(id) {
  return NETWORKS.find((n) => n.id === id) ?? NETWORKS[0];
}

/**
 * The only token on offer. Shown as a read-only field rather than a dropdown
 * because there's nothing to choose between — the frame greys it out.
 */
export const TOKEN = { id: 'usdc', label: 'Digital USD', currency: 'USDC' };
