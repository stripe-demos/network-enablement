// Per-chat seed content. Mirrors `chatData` in prototypes/main/index.html.

export const CHAT_CONTENT = {
  'failed-payments': {
    rich: true,
    prompt:
      'Pull all failed payments over $500 from December, break them down by decline code, issuing bank, and BIN range. I want to see which failure patterns are systemic versus one-off, and flag any merchants with retry rates above 15%. If you can cross-reference against the November baseline that would be helpful too.',
    task: 'Find payments',
    tools: 4,
  },
  'suspicious-refunds': {
    rich: false,
    prompt:
      'Flag any customers with more than 3 refunds in the last 30 days. Include the total refunded amount and original charge details.',
    task: 'Scan refund activity',
    tools: 4,
    response:
      '<p>I found 18 customers with more than 3 refunds in the past 30 days. Here\'s what stands out:</p><ul><li><strong>Highest refund count:</strong> <code>cus_R8k2mNpQ</code> with 11 refunds totaling $4,280</li><li><strong>Pattern detected:</strong> 6 of the 18 customers share the same BIN range (424242), suggesting possible card testing</li><li><strong>Refund-to-charge ratio:</strong> 3 customers have ratios above 80%, which typically triggers Stripe\'s early fraud warning</li></ul><p>I\'d recommend reviewing the top 6 accounts flagged in the artifact. Two of them have active disputes pending.</p>',
  },
  'mrr-breakdown': {
    rich: false,
    prompt: "What's my current MRR broken down by plan tier? Include the change from last month.",
    task: 'Calculate MRR',
    tools: 2,
    response:
      "<p>Here's your MRR breakdown by plan tier as of today:</p><ul><li><strong>Enterprise:</strong> $182,400/mo — up 6.2% from last month (+$10,600)</li><li><strong>Pro:</strong> $94,300/mo — up 3.1% (+$2,830)</li><li><strong>Starter:</strong> $23,100/mo — down 1.4% (-$328)</li></ul><p>Total MRR is <strong>$299,800</strong>, up 4.6% month-over-month. Enterprise growth is driving most of the increase — 8 new accounts landed in the last 2 weeks. Starter churn is slightly elevated; 12 downgrades this month vs. 7 last month.</p>",
  },
  'customer-investigation': {
    rich: false,
    prompt: "Look into all charge disputes filed by Acme Corp (cus_Nk4pLmQ9) in the last 90 days. What's the pattern?",
    task: 'Investigate disputes',
    tools: 5,
    response:
      "<p>Acme Corp has filed 7 disputes in the last 90 days totaling $12,340. Here's the pattern:</p><ul><li><strong>Dispute reason:</strong> All 7 are <code>product_not_received</code> — none are fraud-related</li><li><strong>Timing:</strong> Disputes are filed exactly 14 days after each charge, suggesting an internal process rather than genuine non-delivery</li><li><strong>Win rate:</strong> You've won 2 of 3 that have been resolved, with strong delivery evidence</li></ul><p>This looks like a procurement team following a standard review process rather than actual fraud. I'd recommend reaching out to their accounts payable contact to streamline — the remaining 4 disputes are still open and within the response window.</p>",
  },
};
