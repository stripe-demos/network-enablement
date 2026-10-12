// Completed histories for the authored conversations. Each entry describes one
// actual call (a file's inline status and preview belong to the same read).
// Call labels select the original JSX, preserving code and canvas handlers.
export const PRESET_TASK_STEPS = {
  'failed-payments': [
    {
      calls: ['Querying active merchants'], duration: 2000,
      message: 'I’ll check merchant activity first, then compare it with the failed payments.',
      detail: 'Query daily active merchants for December to establish the baseline for failure rates.',
      outcome: 'Retrieved 31 days of merchant activity, with steady growth through December.',
    },
    {
      calls: ['Fetching conversion funnel breakdown'], duration: 1000,
      message: 'Merchant activity is steady. I’ll check the conversion funnel for changes in payment success.',
      detail: 'Request the conversion funnel breakdown across the same reporting period.',
      outcome: 'The stage field is missing before December 1st. The conversion rate will use the merchants table instead.',
    },
    {
      calls: ['Reading file tax-skill.md', 'skill.md'], duration: 1000,
      message: 'The funnel breakdown is unavailable. I’ll use the merchant data and check how the $500 threshold applies by region.',
      detail: 'Read the tax skill definition before applying regional thresholds to the failed charges.',
      outcome: 'Loaded the regional rules for applying the $500 threshold.',
    },
    {
      calls: ['Querying Growth overview'], duration: 4000,
      message: 'The threshold rules are confirmed. I’ll finish the growth overview and group the failed charges by decline code.',
      detail: 'Combine the merchant baseline with failed charges above $500 to identify the largest concentrations.',
      outcome: 'Found 1,247 failed charges across 340 customers, concentrated in the 424242 BIN range. The growth overview and failed-payments breakdown are ready.',
    },
  ],
  'revenue-api': [
    {
      calls: ['Querying Revenue trend'], duration: 2000,
      message: 'I’ll compare daily revenue with API latency over the same December window.',
      detail: 'Pull succeeded-charge revenue from the billing aggregate table, grouped by day.',
      outcome: 'Revenue dips between December 14 and 16 against an otherwise flat month.',
    },
    {
      calls: ['Querying API latency percentiles'], duration: 3000,
      message: 'Revenue dips on December 14–16. I’ll check whether API latency rises over those dates.',
      detail: 'Retrieve the daily latency percentiles and align them with the revenue time series.',
      outcome: 'p99 latency reaches 1.2 seconds during the same December 14–16 window.',
    },
    {
      calls: ['Fetching error budget burn rate'], duration: 2000,
      message: 'The latency spike lines up with the revenue dip. I’ll check the error budget for another signal.',
      detail: 'Measure the error budget consumed during the two-day incident window.',
      outcome: '40% of the monthly error budget burned in 48 hours, consistent with a partial upstream gateway outage.',
    },
  ],
  'platform-metrics': [
    {
      calls: ['Querying API throughput'], duration: 2000,
      message: 'I’ll check request volume, errors, and queue depth, then prepare the SQL for staging.',
      detail: 'Query request volume at minute granularity across the reporting window.',
      outcome: 'Request volume peaks at 4.2K rpm on December 18.',
    },
    {
      calls: ['Fetching error rate by endpoint'], duration: 1000,
      message: 'Request volume peaks on December 18. I’ll check which endpoints contributed errors.',
      detail: 'Request endpoint-level error rates at the same minute granularity.',
      outcome: 'The metrics service rejected minute-level granularity. Queue depth will show where the backlog formed instead.',
    },
    {
      calls: ['Querying Queue depth'], duration: 2000,
      message: 'The endpoint breakdown is unavailable at that resolution. I’ll use hourly queue depth to locate the backlog.',
      detail: 'Retrieve queue depth in hourly buckets and check when the backlog clears.',
      outcome: 'The queue backlog clears by 02:00 each night.',
    },
    {
      calls: ['Writing file failedpayments.sql'], duration: 3000,
      message: 'I have the volume and queue data. I’ll save the query so you can change the dates and run it against staging.',
      detail: 'Export the combined query as a standalone SQL artifact.',
      outcome: 'failedpayments.sql is ready to open in the canvas.',
    },
  ],
  'ops-documents': [
    {
      calls: ['Searching Stripe docs'], duration: 2000,
      message: 'I’ll check the documentation before gathering the ruleset diff and shipping exports.',
      detail: 'Find the Radar configuration, shipping-label export, and PDF localization guides.',
      outcome: 'Found the governing references for velocity rules, carrier rows, and supported template locales.',
    },
    {
      calls: ['Computing Radar ruleset diff'], duration: 3000,
      message: 'The reference guides are available. I’ll compare the staging and production Radar rules.',
      detail: 'Compute the ruleset differences and identify changes affecting the flagged BIN range.',
      outcome: 'Found four rule changes, including two velocity checks added December 12 for the 424242 BIN range.',
    },
    {
      calls: ['Exporting December shipping labels'], duration: 2000,
      message: 'The ruleset has four changes. I’ll gather the December labels and check the localized template.',
      detail: 'Export the December label batch and verify the FR and DE template strings.',
      outcome: 'Retrieved 340 rows across 12 carriers. The updated French and German strings are present.',
    },
  ],
  'webhooks-cohorts': [
    {
      calls: ['Fetching webhook endpoint configuration'], duration: 2000,
      message: 'I’ll verify the deployed webhook handler, then check the queue and subscriber cohorts.',
      detail: 'Read the endpoint configuration and confirm the deployed payment_intent.succeeded handler revision.',
      outcome: 'The handler is registered for payment_intent.succeeded and its deployed revision matches HEAD.',
    },
    {
      calls: ['Fetching terminal queue depth'], duration: 2000,
      message: 'The deployed handler matches. I’ll check the last 24 hours of queue activity.',
      detail: 'Retrieve terminal queue depth to identify the peak and compare it with the batch window.',
      outcome: 'Queue depth peaks at 180 around 18:00, consistent with the nightly batch window.',
    },
    {
      calls: ['Fetching subscriber cohorts'], duration: 2000,
      message: 'The queue peak matches the batch window. I’ll check for changes in subscriber activity.',
      detail: 'Compare weekly active subscriber counts across cohorts.',
      outcome: 'Every cohort is stable week over week, with no churn spike.',
    },
  ],
  'card-details': [
    {
      calls: ['Querying Card details'], duration: 3000,
      message: 'I’ll pull the card-level details behind the failed charges over $500.',
      detail: 'Join failed charges with card metadata to retrieve the BIN prefix, timestamp, and raw decline code.',
      outcome: 'Retrieved the joined records, sorted by amount, with cents converted to dollars for display.',
    },
    {
      calls: ['Fetching issuer decline descriptions'], duration: 1000,
      message: 'The card records are ready. I’ll check for more detailed issuer explanations.',
      detail: 'Request the issuer descriptions associated with each decline code.',
      outcome: 'The issuer metadata service is rate limited. The table uses the raw decline codes already present on each charge.',
    },
  ],
  'suspicious-refunds': [
    {
      calls: ['Fetching Radar risk scores'], duration: 1000,
      message: 'I’ll check risk signals for the refunds from the last seven days.',
      detail: 'Request Radar scores to help identify refunds that need closer review.',
      outcome: 'Today’s review queue is still indexing, so Radar scores are unavailable. The refund table can provide the velocity signal instead.',
    },
    {
      calls: ['Querying Suspicious refunds'], duration: 4000,
      message: 'Risk scores are unavailable while the queue indexes. I’ll group refunds by card BIN and check their timing.',
      detail: 'Query recent refunds by card BIN, amount, and creation time to identify concentrated activity.',
      outcome: 'Found 47 flagged refunds totaling $18,240. One card BIN was refunded across 12 charges within four hours.',
    },
  ],
  'patterns': [
    {
      calls: ['Building pattern showcase'], duration: 2000,
      message: 'I’ll assemble the conversation patterns into one reference page.',
      detail: 'Collect the user prompt, task, response, table, artifacts, and elicitation fragments.',
      outcome: 'All six fragments were added to the showcase bundle.',
    },
    {
      calls: ['Fetching Figma library tokens'], duration: 1000,
      message: 'The six fragments are assembled. I’ll check the design tokens against the library.',
      detail: 'Request the library token definitions for comparison with the local fragments.',
      outcome: 'The Figma file requires interactive authentication. The local token definitions will be checked against the documentation instead.',
    },
    {
      calls: ['Searching Stripe docs'], duration: 2000,
      message: 'The library needs authentication. I’ll verify our local tokens against the documented reference.',
      detail: 'Find the design-token reference and compare the fragment values.',
      outcome: 'The fragments match the documented token values.',
    },
    {
      calls: ['Writing file patterns.md'], duration: 2000,
      message: 'The tokens match. I’ll save the reference page as markdown.',
      detail: 'Write the assembled patterns and their examples into patterns.md.',
      outcome: 'The markdown reference is ready in the canvas.',
    },
  ],
  'interactive-canvas': [
    {
      calls: ['Fetching Q4 revenue time-series'], duration: 2000,
      message: 'I’ll compare Q4 revenue with platform health over the same period.',
      detail: 'Retrieve the full-quarter revenue series as the baseline for the comparison.',
      outcome: 'The Q4 revenue series has no gaps.',
    },
    {
      calls: ['Reading file tax-skill.md'], duration: 1000,
      message: 'The revenue baseline is complete. I’ll check the regional threshold rules before comparing the failures.',
      detail: 'Read the tax skill definition for the thresholds applied to the revenue figures.',
      outcome: 'The regional threshold definitions are loaded.',
    },
    {
      calls: ['Querying Failed payments'], duration: 4000,
      message: 'The regional rules are confirmed. I’ll compare traffic spikes with failure rates, normalized by payment volume.',
      detail: 'Join request volume, queue depth, and payment failures across the same Q4 window.',
      outcome: 'The comparison is ready to review alongside the platform charts and filtered failure table.',
    },
  ],
  'simple-records': [
    {
      calls: ['Fetching requested records'], duration: 2000,
      message: 'I’ll retrieve the requested records and check the result before summarizing it.',
      detail: 'Query the Stripe API for the requested records and verify the returned fields.',
      outcome: 'The records were retrieved successfully with the expected fields present.',
    },
  ],
};
