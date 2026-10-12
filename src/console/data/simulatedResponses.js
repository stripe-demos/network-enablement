import { REVENUE_TASK } from './chartPreparation.js';

const DEFAULT_RESPONSE = {
  task: REVENUE_TASK,
  assistant: 'Your business is looking healthy. Revenue is trending upward, with steady growth through the month. Here’s a chart of revenue over time to help you explore the trend.',
  artifactId: 'chart',
  sourceItems: [{ label: 'Billing Overview', type: 'dashboard' }],
};

// Response copy and sample data vary; timing, cancellation, and rendering do not.
const REFUNDS_RESPONSE = {
  artifactId: 'experiment-refund-chart',
  task: {
    name: 'Investigate suspicious refund activity',
    detail: 'Comparing refund rates across payment methods over the last seven days.',
    analysisCalls: [
      'Finding the refunds data source',
      'Loading the refunds schema',
      'Querying recent refunds',
      'Grouping refunds by payment method',
      'Comparing payment volumes',
      'Calculating refund rates',
      'Checking unusually large refunds',
      'Comparing the previous week',
      'Validating payment-method totals',
      'Verifying flagged refund patterns',
    ],
    chartCall: 'Creating a refund-rate chart',
  },
  assistant: 'Cards have the highest refund rate in this sample. I’ve plotted the breakdown by payment method so you can compare where the activity is concentrated.',
  sourceItems: [{ label: 'Payments', type: 'dashboard' }],
};

export function getSimulatedResponse(chatId) {
  return chatId === 'suspicious-refunds' ? REFUNDS_RESPONSE : DEFAULT_RESPONSE;
}

export const SIMULATED_RESPONSE_CHARTS = {
  'experiment-refund-chart': {
    artifactType: 'chart', chartVariant: 'bar',
    label: 'Refund rate', headingLarge: 'Refund rate by payment method',
    sub: 'Last 7 days · sample data', legendLabel: 'Refund rate',
    sourceItems: REFUNDS_RESPONSE.sourceItems,
    freshnessLabel: 'Generated just now',
    dataset: {
      barRel: [0.84, 0.32, 0.18, 0.46], maxVal: 5,
      xLabels: ['Cards', 'Bank debit', 'Bank transfer', 'Wallets'],
      formatY: value => `${Number(value.toFixed(1))}%`,
    },
  },
};
