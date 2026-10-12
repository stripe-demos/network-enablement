import type { PageConfig, TabConfig, FilterDef } from '@dashboard/lib/listview/types';
import { CUSTOMERS_DATA } from './data';

const CUSTOMERS_COLUMNS: TabConfig['columns'] = [
  {
    id: 'customer',
    type: 'basic-text',
    label: 'Customer',
    searchable: true,
  },
  {
    id: 'description',
    type: 'basic-text',
    label: 'Description',
    searchable: true,
  },
  {
    id: 'email',
    type: 'basic-text',
    label: 'Email',
    searchable: true,
  },
  {
    id: 'payments',
    type: 'numerical',
    label: 'Payments',
    align: 'right',
  },
  {
    id: 'total-spend',
    type: 'currency',
    label: 'Total spend',
    align: 'right',
    colSpan: 2,
    dataKeys: { value: 'total-spend', code: 'currency' },
  },
  {
    id: 'created',
    type: 'date',
    label: 'Created',
    colSpan: 2,
  },
  {
    id: 'first-payment',
    type: 'basic-text',
    label: 'First payment',
  },
  {
    id: 'subscriptions',
    type: 'numerical',
    label: 'Subscriptions',
    align: 'right',
  },
  {
    id: 'balance',
    type: 'currency',
    label: 'Balance',
    align: 'right',
    colSpan: 2,
    dataKeys: { value: 'balance', code: 'balance-currency' },
    defaultVisible: false,
  },
  {
    id: 'balance-due',
    type: 'basic-text',
    label: 'Balance due',
    defaultVisible: false,
  },
  {
    id: 'balance-first-funding',
    type: 'basic-text',
    label: 'Balance first funding',
    defaultVisible: false,
  },
  {
    id: 'country',
    type: 'location',
    label: 'Country',
    defaultVisible: false,
  },
  {
    id: 'dispute-losses',
    type: 'currency',
    label: 'Dispute losses',
    align: 'right',
    colSpan: 2,
    dataKeys: { value: 'dispute-losses', code: 'currency' },
    defaultVisible: false,
  },
  {
    id: 'id',
    type: 'basic-text',
    label: 'ID',
    searchable: true,
    defaultVisible: false,
  },
  {
    id: 'last-payment',
    type: 'basic-text',
    label: 'Last payment',
    defaultVisible: false,
  },
  {
    id: 'name',
    type: 'basic-text',
    label: 'Name',
    searchable: true,
    defaultVisible: false,
  },
  {
    id: 'method',
    type: 'brand-icon',
    label: 'Payment method',
    iconSrc: '/dashboard-assets/icons/brandIcon16.svg',
    dataKeys: { secondary: 'method-secondary' },
    defaultVisible: false,
  },
  {
    id: 'refunded-volume',
    type: 'currency',
    label: 'Refunded volume',
    align: 'right',
    colSpan: 2,
    dataKeys: { value: 'refunded-volume', code: 'currency' },
    defaultVisible: false,
  },
];

const CUSTOMERS_FILTERS: FilterDef[] = [
  { id: 'email',            label: 'Email',            type: 'value' },
  { id: 'name',             label: 'Name',             type: 'value' },
  { id: 'balance',          label: 'Balance',          type: 'value' },
  { id: 'refunded-volume',  label: 'Refunded volume',  type: 'value' },
  { id: 'dispute-losses',   label: 'Dispute losses',   type: 'value' },
  { id: 'created',          label: 'Created',          type: 'date' },
  { id: 'type',             label: 'Type',             type: 'single-select', options: ['Individual', 'Company'] },
  { id: 'last-4',           label: 'Last 4 digits',    type: 'value' },
  { id: 'has-subscription', label: 'Has subscription', type: 'single-select', options: ['Yes', 'No'] },
  { id: 'delinquent',       label: 'Delinquent',       type: 'single-select', options: ['Yes', 'No'] },
];

const CUSTOMERS_ROW_ACTIONS: TabConfig['rowActions'] = [
  { label: 'Ask Console',         color: '#273951', consolePrompt: 'Tell me about {customer}', consoleContext: (row) => String(row.customer), dividerAfter: true },
  { label: 'Create invoice',      color: '#273951' },
  { label: 'Create subscription', color: '#273951' },
  { label: 'Delete customer',     color: '#C0123C' },
];

const ALL_CUSTOMERS_TAB: TabConfig = {
  tabId: 'all-customers',
  label: 'All customers',
  createActionLabel: 'Add customer',
  columns: CUSTOMERS_COLUMNS,
  filters: CUSTOMERS_FILTERS,
  data: CUSTOMERS_DATA,
  defaultViewChips: [
    {
      id: 'top-customers',
      label: 'Top customers',
      count: '29',
      sortCol: 'total-spend',
      sortDir: 'desc',
    },
    {
      id: 'first-time',
      label: 'First-time customers',
      count: '29',
      sortCol: 'first-payment',
      sortDir: 'desc',
    },
    {
      id: 'high-refunds',
      label: 'High refunds',
      count: '4',
      filters: [{ id: 'refunded-volume', filterName: 'Refunded volume', filterType: 'value', valueOp: 'is greater than', valueInput: '0' }],
      sortCol: 'refunded-volume',
      sortDir: 'desc',
    },
    {
      id: 'high-disputes',
      label: 'High disputes',
      count: '0',
      filters: [{ id: 'dispute-losses', filterName: 'Dispute losses', filterType: 'value', valueOp: 'is greater than', valueInput: '0' }],
      sortCol: 'dispute-losses',
      sortDir: 'desc',
    },
    {
      id: 'remaining-balances',
      label: 'Remaining balances',
      count: '18',
      filters: [{ id: 'balance', filterName: 'Balance', filterType: 'value', valueOp: 'is greater than', valueInput: '0' }],
      sortCol: 'balance',
      sortDir: 'desc',
      columns: ['balance', 'balance-due', 'customer', 'balance-first-funding'],
    },
  ],
  defaultPinnedIds: ['top-customers', 'first-time', 'high-refunds', 'high-disputes', 'remaining-balances'],
  rowActions: CUSTOMERS_ROW_ACTIONS,
  refundableField: 'subscriptions',
  refundableValue: '1',
};

const config: PageConfig = {
  pageId: 'customers',
  pageTitle: 'Customers',
  includeViewTotals: false,
  tabs: [ALL_CUSTOMERS_TAB],
};

export default config;
