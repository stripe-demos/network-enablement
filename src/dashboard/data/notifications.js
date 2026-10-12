// DashboardToolbar bell dropdown content. kind: 'action' (needs the user) | 'update' (FYI).
export const notifications = [
  {
    id: 'negative-balance',
    kind: 'action',
    title: 'Set the minimum in USD to cover your negative balance',
    body: 'Pending refunds process when your balance is positive. If it stays negative, we may attempt to debit your bank account.',
    time: '1h ago',
  },
  {
    id: 'dispute',
    kind: 'action',
    title: 'Respond to a dispute by Oct 14',
    body: 'A customer disputed a $240.00 payment as fraudulent. Submit evidence before the deadline to contest it.',
    time: '3h ago',
  },
  {
    id: 'verification',
    kind: 'action',
    title: 'Verify your business details',
    body: 'We need a few more details about Rocketrides to keep payouts enabled. Provide them by Oct 21.',
    time: 'Yesterday',
  },
  {
    id: 'payout',
    kind: 'update',
    title: 'Your $11,633.07 payout is on its way',
    body: 'It should arrive in your Chase account ending in 6789 on Oct 8.',
    time: '2h ago',
  },
  {
    id: 'radar',
    kind: 'update',
    title: 'Radar blocked 3 high-risk payments',
    body: 'Radar stopped $1,284.00 in likely fraudulent payments this week. Review them in Fraud tools.',
    time: 'Yesterday',
  },
  {
    id: 'login',
    kind: 'update',
    title: 'New sign-in to your account',
    body: 'Kevin Yien signed in from Chrome on macOS near San Francisco, CA. If this wasn’t you, reset your password.',
    time: 'Oct 5',
  },
  {
    id: 'api-version',
    kind: 'update',
    title: 'A new API version is available',
    body: 'API version 2026-09-30 adds new fields to PaymentIntents. Review the changelog and upgrade when you’re ready.',
    time: 'Oct 3',
  },
  {
    id: 'report',
    kind: 'update',
    title: 'Your September balance report is ready',
    body: 'Download the monthly summary of your balance activity from Reports.',
    time: 'Oct 1',
  },
]
