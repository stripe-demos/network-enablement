import type { PageConfig, TabConfig, FilterDef } from '@dashboard/lib/listview/types';
import { S } from '@dashboard/lib/listview/statusStyles';
import { PAYMENTS_DATA } from './payments-data';
import { PAYOUTS_DATA } from './payouts-data';
import { ALL_ACTIVITY_DATA } from './all-activity-data';
import { TOP_UPS_DATA } from './top-ups-data';

const SHARED_COLUMNS: TabConfig['columns'] = [
  {
    id: 'amount', type: 'currency', label: 'Amount',
    align: 'right', colSpan: 2,
    dataKeys: { value: 'amount', code: 'currency' },
    searchable: true,
  },
  {
    id: 'status', type: 'status', label: 'Status',
    searchable: true,
    statusMap: {
      'Succeeded':  S.success,
      'Refunded':   S.default,
      'Disputed':   S.warning,
      'Failed':     S.critical,
      'Pending':    S.warning,
      'Incomplete': S.default,
      'Blocked':    S.critical,
    },
  },
  {
    id: 'method', type: 'brand-icon', label: 'Payment method',
    iconSrc: '/dashboard-assets/icons/brandIcon16.svg',
    secondaryIconSrc: '/dashboard-assets/icons/link.svg',
    dataKeys: { secondary: 'method-secondary' },
    searchable: true,
  },
  {
    id: 'description', type: 'basic-text', label: 'Description',
    searchable: true,
  },
  {
    id: 'customer', type: 'basic-text', label: 'Customer',
    searchable: true,
  },
  {
    id: 'date', type: 'date', label: 'Date',
    colSpan: 2,
  },
  {
    id: 'transferred', type: 'numerical', label: 'Transferred',
    align: 'right',
  },
  {
    id: 'invoice', type: 'link', label: 'Invoice',
    searchable: true,
  },
];

const SHARED_FILTERS: FilterDef[] = [
  { id: 'status',      label: 'Status',      type: 'single-select', options: ['Succeeded', 'Refunded', 'Disputed', 'Failed', 'Pending', 'Incomplete', 'Blocked'] },
  { id: 'description', label: 'Description', type: 'multi-select',  options: ['Invoice payment', 'Subscription creation', 'Subscription payment', 'Purchase', 'Refund', 'ACH transfer', 'One-time charge', 'Platform fee', 'Top-up', 'Payout reversal'] },
  { id: 'date',        label: 'Date',        type: 'date' },
  { id: 'amount',      label: 'Amount',      type: 'value' },
];

const SHARED_VIEW_CHIPS: TabConfig['defaultViewChips'] = [
  { id: '2', label: 'Succeeded',  count: '1,473', filters: [{ id: 'status', filterName: 'Status', filterType: 'single-select', selectedValues: ['Succeeded'] }] },
  { id: '3', label: 'Refunded',   count: '43',   filters: [{ id: 'status', filterName: 'Status', filterType: 'single-select', selectedValues: ['Refunded']  }] },
  { id: '4', label: 'Disputed',   count: '7',    filters: [{ id: 'status', filterName: 'Status', filterType: 'single-select', selectedValues: ['Disputed']  }] },
  { id: '5', label: 'Failed',     count: '176',  filters: [{ id: 'status', filterName: 'Status', filterType: 'single-select', selectedValues: ['Failed']    }] },
  { id: '6', label: 'Uncaptured', count: '145'  },
  { id: '7', label: 'Blocked',    count: '23',   filters: [{ id: 'status', filterName: 'Status', filterType: 'single-select', selectedValues: ['Blocked']   }] },
];

const SHARED_ROW_ACTIONS: TabConfig['rowActions'] = [
  { label: 'Refund',   color: '#273951' },
  { label: 'Copy ID',  color: '#273951' },
  { label: 'Delete',   color: '#C0123C' },
];

// ─── Payouts tab ─────────────────────────────────────────────────────────────

const PAYOUTS_COLUMNS: TabConfig['columns'] = [
  {
    id: 'amount', type: 'currency', label: 'Amount',
    align: 'right', colSpan: 2,
    dataKeys: { value: 'amount', code: 'currency' },
  },
  {
    id: 'status', type: 'status', label: 'Status',
    searchable: true,
    statusMap: {
      'Paid':      S.success,
      'Failed':    S.critical,
      'Withdrawn': S.default,
    },
  },
  {
    id: 'destination', type: 'subtext', label: 'Destination',
    searchable: true,
    dataKeys: { amount: 'destination-name', sub: 'destination-card' },
  },
  {
    id: 'type', type: 'basic-text', label: 'Type',
    searchable: true,
  },
  {
    id: 'arrive-by', type: 'basic-text', label: 'Arrive by',
    searchable: true,
  },
];

const PAYOUTS_FILTERS: FilterDef[] = [
  { id: 'status',     label: 'Status',     type: 'single-select', options: ['Paid', 'Pending or in transit', 'Failed', 'Canceled'] },
  { id: 'type',       label: 'Method',     type: 'single-select', options: ['Instant', 'Standard'] },
  { id: 'arrive-by',  label: 'Date',       type: 'date' },
  { id: 'amount',     label: 'Amount',     type: 'value' },
];

const PAYOUTS_VIEW_CHIPS: TabConfig['defaultViewChips'] = [
  { id: 'paid', label: 'Paid',   count: '22', filters: [{ id: 'status', filterName: 'Status', filterType: 'single-select', selectedValues: ['Paid']     }] },
  { id: 'fail', label: 'Failed', count: '4',  filters: [{ id: 'status', filterName: 'Status', filterType: 'single-select', selectedValues: ['Failed']   }] },
];

const PAYOUTS_TAB: TabConfig = {
  tabId:            'payouts',
  label:            'Payouts',
  columns:          PAYOUTS_COLUMNS,
  filters:          PAYOUTS_FILTERS,
  data:             PAYOUTS_DATA,
  defaultViewChips: PAYOUTS_VIEW_CHIPS,
  defaultPinnedIds: ['paid', 'fail'],
  rowActions:       [{ label: 'View receipt', color: '#273951' }],
  refundableField:  'status',
  refundableValue:  'Paid',
};

// ─── Top-ups tab ──────────────────────────────────────────────────────────────

const TOP_UPS_COLUMNS: TabConfig['columns'] = [
  {
    id: 'amount', type: 'currency', label: 'Amount',
    align: 'right', colSpan: 2,
    dataKeys: { value: 'amount', code: 'currency' },
    searchable: true,
  },
  {
    id: 'source', type: 'subtext', label: 'Source',
    searchable: true,
    dataKeys: { amount: 'source-name', sub: 'source-account' },
  },
  {
    id: 'description', type: 'basic-text', label: 'Description',
    searchable: true,
  },
  {
    id: 'initiated', type: 'basic-text', label: 'Initiated',
  },
  {
    id: 'available', type: 'basic-text', label: 'Available',
  },
  {
    id: 'status', type: 'status', label: 'Status',
    searchable: true,
    statusMap: {
      'Pending':   S.warning,
      'Failed':    S.critical,
      'Succeeded': S.success,
      'Canceled':  S.default,
    },
  },
];

const TOP_UPS_FILTERS: FilterDef[] = [
  { id: 'initiated', label: 'Date',   type: 'date' },
  { id: 'amount',    label: 'Amount', type: 'value' },
  { id: 'status',    label: 'Status', type: 'single-select', options: ['Pending', 'Failed', 'Succeeded', 'Canceled'] },
];

const TOP_UPS_VIEW_CHIPS: TabConfig['defaultViewChips'] = [
  { id: 'tu-succeeded', label: 'Succeeded', count: '18', filters: [{ id: 'status', filterName: 'Status', filterType: 'single-select', selectedValues: ['Succeeded'] }] },
  { id: 'tu-pending',   label: 'Pending',   count: '1',  filters: [{ id: 'status', filterName: 'Status', filterType: 'single-select', selectedValues: ['Pending']   }] },
  { id: 'tu-failed',    label: 'Failed',    count: '1',  filters: [{ id: 'status', filterName: 'Status', filterType: 'single-select', selectedValues: ['Failed']    }] },
];

const TOP_UPS_TAB: TabConfig = {
  tabId:             'top-ups',
  label:             'Top-ups',
  createActionLabel: 'Top up',
  columns:           TOP_UPS_COLUMNS,
  filters:           TOP_UPS_FILTERS,
  data:              TOP_UPS_DATA,
  defaultViewChips:  TOP_UPS_VIEW_CHIPS,
  defaultPinnedIds:  ['tu-succeeded', 'tu-pending', 'tu-failed'],
  rowActions: [
    { label: 'View receipt', color: '#273951' },
  ],
  refundableField: 'status',
  refundableValue: 'Succeeded',
};

// ─── All activity tab ─────────────────────────────────────────────────────────

const ALL_ACTIVITY_COLUMNS: TabConfig['columns'] = [
  { id: 'amount',       type: 'numerical',  label: 'Amount',              align: 'right', searchable: true },
  { id: 'fees',         type: 'numerical',  label: 'Fees',                align: 'right' },
  { id: 'total',        type: 'numerical',  label: 'Total',               align: 'right', searchable: true },
  { id: 'type',         type: 'basic-text', label: 'Type', searchable: true },
  { id: 'balance-type', type: 'basic-text', label: 'Balance type', searchable: true },
  { id: 'description',  type: 'basic-text', label: 'Description', searchable: true },
  { id: 'balance-tx',   type: 'link',       label: 'Balance transaction', searchable: true },
  { id: 'created',      type: 'basic-text', label: 'Created' },
  { id: 'available-on', type: 'basic-text', label: 'Available on' },
];

const ALL_ACTIVITY_FILTERS: FilterDef[] = [
  { id: 'currency',     label: 'Currency',     type: 'single-select', options: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'] },
  { id: 'type',         label: 'Type',         type: 'single-select', options: ['Stripe fee', 'Refund', 'Refund failure', 'Adjustment', 'Payment', 'Payout'] },
  { id: 'balance-type', label: 'Balance type', type: 'single-select', options: ['Payments', 'Issuing', 'Connect'] },
  { id: 'created',      label: 'Created',      type: 'date' },
  { id: 'available-on', label: 'Available on', type: 'date' },
];

const ALL_ACTIVITY_VIEW_CHIPS: TabConfig['defaultViewChips'] = [
  { id: 'aa-refunds',  label: 'Refunds',     count: '6',  filters: [{ id: 'type', filterName: 'Type', filterType: 'single-select', selectedValues: ['Refund']         }] },
  { id: 'aa-fees',     label: 'Stripe fees', count: '22', filters: [{ id: 'type', filterName: 'Type', filterType: 'single-select', selectedValues: ['Stripe fee']     }] },
  { id: 'aa-failures', label: 'Failures',    count: '2',  filters: [{ id: 'type', filterName: 'Type', filterType: 'single-select', selectedValues: ['Refund failure'] }] },
];

const ALL_ACTIVITY_TAB: TabConfig = {
  tabId:            'all-activity',
  label:            'All activity',
  columns:          ALL_ACTIVITY_COLUMNS,
  filters:          ALL_ACTIVITY_FILTERS,
  data:             ALL_ACTIVITY_DATA,
  defaultViewChips: ALL_ACTIVITY_VIEW_CHIPS,
  defaultPinnedIds: ['aa-refunds', 'aa-fees'],
};

// ─── Payments tab ─────────────────────────────────────────────────────────────

/** Ask Console's prompt for a payment row: the question its status raises. */
function paymentPrompt(row: Record<string, unknown>): string {
  const payment = `the ${row.amount} payment from ${row.customer}`;
  switch (row.status) {
    case 'Failed':     return `Why did ${payment} fail?`;
    case 'Pending':    return `Why is ${payment} still pending?`;
    case 'Incomplete': return `Why is ${payment} incomplete?`;
    case 'Refunded':   return `Why was ${payment} refunded?`;
    case 'Disputed':   return `Why was ${payment} disputed?`;
    case 'Blocked':    return `Why was ${payment} blocked?`;
    default:           return `Tell me about ${payment}`;
  }
}

const PAYMENTS_TAB: TabConfig = {
  tabId:            'payments',
  label:            'Payments',
  createActionLabel: 'Create payment',
  columns:          SHARED_COLUMNS,
  filters:          SHARED_FILTERS,
  data:             PAYMENTS_DATA,
  defaultViewChips: SHARED_VIEW_CHIPS,
  defaultPinnedIds: ['2', '3', '4', '7'],
  rowActions: [
    { label: 'Ask Console',          color: '#273951', consolePrompt: paymentPrompt, consoleContext: (row) => ({ primary: String(row.amount), secondary: String(row.customer), label: `${row.amount} payment from ${row.customer}` }) },
    { label: 'Refund payment',       color: '#273951', group: 'Actions' },
    { label: 'Send receipt',         color: '#273951' },
    { label: 'Copy payment ID',      color: '#273951' },
    { label: 'View customer',        color: '#273951', group: 'Connections' },
    { label: 'View payment details', color: '#273951' },
  ],
  refundableField:  'status',
  refundableValue:  'Succeeded',
};

// ─────────────────────────────────────────────────────────────────────────────

const PLACEHOLDER_TAB = (tabId: string, label: string, createActionLabel?: string): TabConfig => ({
  tabId,
  label,
  createActionLabel,
  placeholder:      true,
  columns:          SHARED_COLUMNS,
  filters:          SHARED_FILTERS,
  data:             [],
  defaultViewChips: SHARED_VIEW_CHIPS,
  defaultPinnedIds: ['1', '2', '3', '4', '7'],
  rowActions:       SHARED_ROW_ACTIONS,
  refundableField:  'status',
  refundableValue:  'Succeeded',
});

const config: PageConfig = {
  pageId:    'transactions',
  pageTitle: 'Transactions',

  tabs: [
    PAYMENTS_TAB,
    PAYOUTS_TAB,
    TOP_UPS_TAB,
    ALL_ACTIVITY_TAB,
  ],
};

export default config;
