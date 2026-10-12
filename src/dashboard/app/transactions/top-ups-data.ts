// ─── Anthropic — Top-ups tab row data ────────────────────────────────────────
// Stripe Issuing balance top-ups funded from Anthropic's JPMorgan Chase account.
// Used to pre-fund corporate card spend across engineering, research, and ops.

export const TOP_UPS_DATA: Record<string, unknown>[] = [
  // ─── 2026 ────────────────────────────────────────────────────────────────
  {
    amount: '$200,000.00', currency: 'USD', status: 'Pending',
    'source-name': 'JPMorgan Chase Bank, N.A.', 'source-account': '•••• 7731',
    description: 'Issuing balance top-up — engineering team cards',
    initiated: 'Apr 18, 2026', available: '—',
  },
  {
    amount: '$250,000.00', currency: 'USD', status: 'Succeeded',
    'source-name': 'JPMorgan Chase Bank, N.A.', 'source-account': '•••• 7731',
    description: 'Issuing balance top-up — model inference infrastructure',
    initiated: 'Apr 1, 2026', available: 'Apr 1, 2026',
  },
  {
    amount: '$150,000.00', currency: 'USD', status: 'Succeeded',
    'source-name': 'JPMorgan Chase Bank, N.A.', 'source-account': '•••• 7731',
    description: 'Issuing balance top-up — research operations, Q1 2026',
    initiated: 'Mar 14, 2026', available: 'Mar 14, 2026',
  },
  {
    amount: '$100,000.00', currency: 'USD', status: 'Succeeded',
    'source-name': 'JPMorgan Chase Bank, N.A.', 'source-account': '•••• 7731',
    description: 'Issuing balance top-up — general corporate expenses',
    initiated: 'Feb 28, 2026', available: 'Feb 28, 2026',
  },
  {
    amount: '$75,000.00', currency: 'USD', status: 'Succeeded',
    'source-name': 'JPMorgan Chase Bank, N.A.', 'source-account': '•••• 7731',
    description: 'Issuing balance top-up — marketing & events, Q1 2026',
    initiated: 'Jan 31, 2026', available: 'Jan 31, 2026',
  },
  {
    amount: '$500,000.00', currency: 'USD', status: 'Succeeded',
    'source-name': 'JPMorgan Chase Bank, N.A.', 'source-account': '•••• 7731',
    description: 'Issuing balance top-up — compute & infrastructure, Q1 2026',
    initiated: 'Jan 2, 2026', available: 'Jan 2, 2026',
  },
  // ─── 2025 ────────────────────────────────────────────────────────────────
  {
    amount: '$300,000.00', currency: 'USD', status: 'Succeeded',
    'source-name': 'JPMorgan Chase Bank, N.A.', 'source-account': '•••• 7731',
    description: 'Issuing balance top-up — research operations, Q4 2025',
    initiated: 'Oct 1, 2025', available: 'Oct 1, 2025',
  },
  {
    amount: '$125,000.00', currency: 'USD', status: 'Failed',
    'source-name': 'JPMorgan Chase Bank, N.A.', 'source-account': '•••• 7731',
    description: 'Issuing balance top-up — Anthropic internship program',
    initiated: 'Sep 1, 2025', available: '—',
  },
  {
    amount: '$125,000.00', currency: 'USD', status: 'Succeeded',
    'source-name': 'JPMorgan Chase Bank, N.A.', 'source-account': '•••• 7731',
    description: 'Issuing balance top-up — Anthropic internship program (retry)',
    initiated: 'Sep 3, 2025', available: 'Sep 3, 2025',
  },
  {
    amount: '$200,000.00', currency: 'USD', status: 'Succeeded',
    'source-name': 'JPMorgan Chase Bank, N.A.', 'source-account': '•••• 7731',
    description: 'Issuing balance top-up — travel & conference expenses, Q3',
    initiated: 'Jul 1, 2025', available: 'Jul 1, 2025',
  },
  {
    amount: '$400,000.00', currency: 'USD', status: 'Succeeded',
    'source-name': 'JPMorgan Chase Bank, N.A.', 'source-account': '•••• 7731',
    description: 'Issuing balance top-up — compute & infrastructure, Q2 2025',
    initiated: 'Apr 1, 2025', available: 'Apr 1, 2025',
  },
  {
    amount: '$80,000.00', currency: 'USD', status: 'Succeeded',
    'source-name': 'JPMorgan Chase Bank, N.A.', 'source-account': '•••• 7731',
    description: 'Issuing balance top-up — recruiting & onboarding, Q1 2025',
    initiated: 'Feb 14, 2025', available: 'Feb 14, 2025',
  },
  {
    amount: '$350,000.00', currency: 'USD', status: 'Succeeded',
    'source-name': 'JPMorgan Chase Bank, N.A.', 'source-account': '•••• 7731',
    description: 'Issuing balance top-up — compute & infrastructure, Q1 2025',
    initiated: 'Jan 3, 2025', available: 'Jan 3, 2025',
  },
  // ─── 2024 ────────────────────────────────────────────────────────────────
  {
    amount: '$225,000.00', currency: 'USD', status: 'Succeeded',
    'source-name': 'JPMorgan Chase Bank, N.A.', 'source-account': '•••• 7731',
    description: 'Issuing balance top-up — operations & travel, Q4 2024',
    initiated: 'Oct 1, 2024', available: 'Oct 1, 2024',
  },
  {
    amount: '$50,000.00', currency: 'USD', status: 'Succeeded',
    'source-name': 'JPMorgan Chase Bank, N.A.', 'source-account': '•••• 7731',
    description: 'Issuing balance top-up — safety research team expenses',
    initiated: 'Aug 15, 2024', available: 'Aug 15, 2024',
  },
  {
    amount: '$175,000.00', currency: 'USD', status: 'Succeeded',
    'source-name': 'JPMorgan Chase Bank, N.A.', 'source-account': '•••• 7731',
    description: 'Issuing balance top-up — compute & infrastructure, Q3 2024',
    initiated: 'Jul 1, 2024', available: 'Jul 1, 2024',
  },
  {
    amount: '$60,000.00', currency: 'USD', status: 'Succeeded',
    'source-name': 'JPMorgan Chase Bank, N.A.', 'source-account': '•••• 7731',
    description: "Issuing balance top-up — inaugural all-hands hackathon",
    initiated: 'May 20, 2024', available: 'May 20, 2024',
  },
  {
    amount: '$150,000.00', currency: 'USD', status: 'Succeeded',
    'source-name': 'JPMorgan Chase Bank, N.A.', 'source-account': '•••• 7731',
    description: 'Issuing balance top-up — compute & infrastructure, Q2 2024',
    initiated: 'Apr 1, 2024', available: 'Apr 1, 2024',
  },
  // ─── 2023 (initial Issuing rollout) ───────────────────────────────────────
  {
    amount: '$100,000.00', currency: 'USD', status: 'Succeeded',
    'source-name': 'JPMorgan Chase Bank, N.A.', 'source-account': '•••• 7731',
    description: 'Issuing balance top-up — general corporate expenses',
    initiated: 'Nov 30, 2023', available: 'Nov 30, 2023',
  },
  {
    amount: '$50,000.00', currency: 'USD', status: 'Succeeded',
    'source-name': 'JPMorgan Chase Bank, N.A.', 'source-account': '•••• 7731',
    description: 'Issuing balance top-up — initial Issuing program setup',
    initiated: 'Nov 22, 2023', available: 'Nov 22, 2023',
  },
];
