// Console prompt suggestions extracted from the Console prompt taxonomy doc.
// Each entry has a `keywords` array for lightweight matching and a `prompts`
// array of 2-3 surfaceable suggestions. Ordered from most specific to least.

export const PROMPT_RULES = [
  {
    id: 'failed-payments',
    keywords: ['fail', 'failed', 'failing', 'decline', 'declined', 'declines', 'card declined', 'insufficient', 'payment', 'payments', 'retry', 'retrying', 'blocked', 'rejected'],
    prompts: [
      { text: 'What\'s driving my failed payments this week?', type: 'Diagnose' },
      { text: 'Show me failed payments I should retry', type: 'Execute' },
      { text: 'Is there a pattern in my decline codes this month?', type: 'Analyze' },
    ],
  },
  {
    id: 'disputes',
    keywords: ['dispute', 'disputes', 'disputed', 'chargeback', 'chargebacks', 'respond', 'response', 'evidence', 'win', 'lost', 'cb'],
    prompts: [
      { text: 'What\'s causing the spike in my dispute rate?', type: 'Diagnose' },
      { text: 'Show me disputes I need to respond to this week', type: 'Execute' },
      { text: 'Which payment methods have the most disputes?', type: 'Analyze' },
    ],
  },
  {
    id: 'revenue',
    keywords: ['revenue', 'gross volume', 'net volume', 'volume', 'growth', 'sales', 'earnings', 'income', 'money', 'trend', 'trending', 'performance', 'total'],
    prompts: [
      { text: 'How is my gross volume trending this month?', type: 'Analyze' },
      { text: 'What\'s driving my revenue growth this month?', type: 'Diagnose' },
      { text: 'Compare this quarter\'s performance to last quarter', type: 'Analyze' },
    ],
  },
  {
    id: 'mrr-billing',
    keywords: ['mrr', 'arr', 'churn', 'churned', 'churning', 'subscription', 'subscriptions', 'subscriber', 'billing', 'invoice', 'invoices', 'invoicing', 'plan', 'plans', 'recurring', 'monthly', 'annual', 'overdue', 'past due', 'upgrade', 'downgrade', 'expansion'],
    prompts: [
      { text: 'How is my MRR trending this month?', type: 'Analyze' },
      { text: 'What\'s my churn rate and what\'s driving it?', type: 'Diagnose' },
      { text: 'Show me past-due invoices ready to follow up on', type: 'Execute' },
    ],
  },
  {
    id: 'customers',
    keywords: ['customer', 'customers', 'user', 'users', 'client', 'clients', 'buyer', 'account', 'accounts', 'top customer', 'jenny', 'alex', 'sam', 'who', 'contact', 'email'],
    prompts: [
      { text: 'Who are my top customers by revenue this quarter?', type: 'Analyze' },
      { text: 'What\'s the full history of this customer\'s payments?', type: 'Analyze' },
      { text: 'Which customers are showing signs of churn?', type: 'Diagnose' },
    ],
  },
  {
    id: 'payouts-balance',
    keywords: ['payout', 'payouts', 'balance', 'transfer', 'transfers', 'funds', 'cash', 'bank', 'withdraw', 'withdrawal', 'settlement', 'deposit', 'available', 'pending'],
    prompts: [
      { text: 'When does my next payout land and how much is it?', type: 'Analyze' },
      { text: 'What\'s my current balance broken down by type?', type: 'Analyze' },
      { text: 'Why is my payout lower than last month?', type: 'Diagnose' },
    ],
  },
  {
    id: 'webhooks-api',
    keywords: ['webhook', 'webhooks', 'api', 'developer', 'workbench', 'integration', 'event', 'events', 'endpoint', 'endpoints', 'request', 'requests', 'error', 'errors', 'debug', 'log', 'logs', 'delivery', 'retries'],
    prompts: [
      { text: 'Why are my webhooks failing?', type: 'Diagnose' },
      { text: 'What\'s the best practice for API versioning?', type: 'Analyze' },
      { text: 'Help me set up webhooks for subscription lifecycle events', type: 'Configure' },
    ],
  },
  {
    id: 'connect',
    keywords: ['connect', 'connected', 'platform', 'rocket rides', 'stripe shop', 'merchant', 'merchants', 'seller', 'sellers', 'marketplace', 'sub-account', 'subaccount', 'fleet', 'restricted', 'onboarding'],
    prompts: [
      { text: 'Show me my Connect volume month by month', type: 'Analyze' },
      { text: 'Which connected accounts are showing signs of churn?', type: 'Diagnose' },
      { text: 'Show me connected accounts with issues I need to resolve', type: 'Execute' },
    ],
  },
  {
    id: 'fraud-radar',
    keywords: ['fraud', 'radar', 'rule', 'rules', 'block', 'blocking', 'suspicious', 'refund', 'refunds', 'risk', 'risky', 'scam', 'flagged', 'dispute', 'prevention', 'abuse'],
    prompts: [
      { text: 'What\'s driving my failed payments over the last 30 days?', type: 'Diagnose' },
      { text: 'Which Radar rules are blocking the most legitimate payments?', type: 'Analyze' },
      { text: 'Help me write a rule based on my recent fraud patterns', type: 'Configure' },
    ],
  },
  {
    id: 'settings',
    keywords: ['setting', 'settings', 'payment method', 'payment methods', 'team', 'access', 'permission', 'permissions', 'tax', 'configure', 'config', 'setup', 'enable', 'disable', 'checkout', 'branding'],
    prompts: [
      { text: 'Which payment methods should I enable for my customer mix?', type: 'Configure' },
      { text: 'Who on my team has access to what?', type: 'Analyze' },
      { text: 'Help me optimize my checkout for higher conversion', type: 'Configure' },
    ],
  },
  {
    id: 'products',
    keywords: ['product', 'products', 'price', 'prices', 'pricing', 'catalog', 'meter', 'meters', 'usage', 'item', 'items', 'sku', 'tier', 'tiers', 'feature', 'features'],
    prompts: [
      { text: 'Which of my products are driving the most revenue?', type: 'Analyze' },
      { text: 'Show me which plans have the highest churn rate', type: 'Diagnose' },
    ],
  },
  {
    id: 'orient',
    keywords: ['brief', 'summary', 'overview', 'today', 'week', 'morning', 'catch up', 'catchup', 'update', 'status', 'whats up', "what's up", 'happening', 'focus', 'urgent', 'priority'],
    prompts: [
      { text: 'Give me my daily brief', type: 'Orient' },
      { text: 'What should I focus on this week?', type: 'Orient' },
      { text: 'Is anything unusual in my payments today?', type: 'Diagnose' },
    ],
  },
]

// Default prompts shown when the input is focused but empty
export const DEFAULT_PROMPTS = [
  { text: 'Give me my daily brief', type: 'Orient' },
  { text: 'Is anything unusual in my payments today?', type: 'Diagnose' },
  { text: 'Show me failed payments I should retry', type: 'Execute' },
  { text: 'How is my MRR trending this month?', type: 'Analyze' },
  { text: 'Catch me up — what happened since I was last here?', type: 'Orient' },
]

// Returns { prompts, score } for a query.
// score >= 2: strong match (section goes near top)
// score === 1: weak match (section goes near bottom)
// score === 0: no match (section goes at bottom, prompts list is empty)
// The "Ask Console: ..." passthrough is always appended by the caller.
export function getConsolePrompts(query, limit = 5) {
  if (!query.trim()) return { prompts: DEFAULT_PROMPTS.slice(0, limit), score: 0 }

  const q = query.toLowerCase()

  // Split query into words for prefix matching
  const qWords = q.split(/\s+/).filter(Boolean)

  const scored = PROMPT_RULES.map((rule) => {
    let score = 0
    for (const kw of rule.keywords) {
      if (q.includes(kw)) {
        // Full keyword present in query — strong signal
        score += 2
      } else if (qWords.some((word) => word.length >= 2 && kw.startsWith(word))) {
        // A query word is a prefix of a keyword — medium signal
        score += 1
      } else if (qWords.some((word) => word.length >= 3 && kw.includes(word))) {
        // A query word appears anywhere inside a keyword — weak signal
        score += 0.5
      }
    }
    return { rule, score }
  }).filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)

  if (scored.length === 0) {
    return { prompts: [], score: 0 }
  }

  const results = []
  for (const { rule } of scored) {
    for (const prompt of rule.prompts) {
      if (results.length >= limit) break
      if (!results.find((p) => p.text === prompt.text)) results.push(prompt)
    }
    if (results.length >= limit) break
  }

  const topScore = scored[0].score
  return { prompts: results, score: topScore }
}
