import type { PageConfig, TabConfig, FilterDef } from '@dashboard/lib/listview/types';
import { S } from '@dashboard/lib/listview/statusStyles';
import { PRODUCT_CATALOG_DATA } from './data';
import { FEATURES_DATA } from './features-data';
import { COUPONS_DATA } from './coupons-data';
import { SHIPPING_RATES_DATA } from './shipping-rates-data';
import { TAX_RATES_DATA } from './tax-rates-data';
import { PRICING_TABLES_DATA } from './pricing-tables-data';

const SHARED_COLUMNS: TabConfig['columns'] = [
  {
    id: 'name',
    type: 'icon-box',
    label: 'Name',
    iconSrc: '/dashboard-assets/icons/product16.svg',
    searchable: true,
    filterOptions: [],
  },
  {
    id: 'updated',
    type: 'basic-text',
    label: 'Updated',
  },
  {
    id: 'tax-code',
    type: 'basic-text',
    label: 'Tax code',
    searchable: true,
  },
  {
    id: 'pricing',
    type: 'subtext',
    label: 'Pricing',
    dataKeys: { amount: 'pricing-amt', sub: 'pricing-sub' },
  },
  {
    id: 'tax-category',
    type: 'basic-text',
    label: 'Tax category',
    searchable: true,
  },
  {
    id: 'date',
    type: 'date',
    label: 'Created',
    colSpan: 2,
  },
  {
    id: 'status',
    type: 'status',
    label: 'Status',
    defaultVisible: false,
    statusMap: {
      'Active':   S.success,
      'Archived': S.default,
    },
  },
];

const SHARED_VIEW_CHIPS: TabConfig['defaultViewChips'] = [
  { id: 'active',   label: 'Active',   count: '5,832' },
  { id: 'archived', label: 'Archived', count: '66'    },
];

const SHARED_FILTERS: FilterDef[] = [
  { id: 'date',         label: 'Created',      type: 'date' },
  { id: 'status',       label: 'Status',       type: 'single-select', options: ['Active', 'Archived'] },
  { id: 'tax-code',     label: 'Tax code',     type: 'multi-select',  options: ['txcd_10202000', 'txcd_10101000', 'txcd_10103000'] },
  { id: 'tax-category', label: 'Tax category', type: 'multi-select',  options: ['Downloadable Software - personal use', 'Software as a Service (SaaS)', 'Services', 'Physical goods'] },
];

const SHARED_ROW_ACTIONS: TabConfig['rowActions'] = [
  { label: 'Copy ID', color: '#273951' },
  { label: 'Edit',    color: '#273951' },
  { label: 'Archive', color: '#273951' },
  { label: 'Delete',  color: '#C0123C' },
];

/**
 * Ask Console's prompt for a product row. Archived products raise who's still
 * on them; live ones, how they're doing in the terms their pricing implies.
 */
function productPrompt(row: Record<string, unknown>): string {
  const name = String(row.name);
  const pricing = `${row['pricing-amt']} ${row['pricing-sub']}`.toLowerCase();
  const recurring = /month|year/.test(pricing);
  if (row.status === 'Archived') {
    return recurring
      ? `Are any customers still subscribed to ${name}?`
      : `Are any customers still using ${name}?`;
  }
  if (recurring)                       return `How is revenue from ${name} trending?`;
  if (/usage/.test(pricing))           return `How is usage of ${name} trending?`;
  if (/custom|included/.test(pricing)) return `Which customers have ${name}?`;
  return `How are sales of ${name} trending?`;
}

const FEATURES_STATUS_MAP: NonNullable<TabConfig['columns'][number]['statusMap']> = {
  'Active':   S.success,
  'Archived': S.default,
};

const FEATURES_COLUMNS: TabConfig['columns'] = [
  { id: 'name',        type: 'basic-text', label: 'Name', searchable: true },
  { id: 'lookup-key',  type: 'id',         label: 'Lookup key', searchable: true },
  { id: 'status',      type: 'status',     label: 'Status', statusMap: FEATURES_STATUS_MAP },
];

const FEATURES_FILTERS: FilterDef[] = [
  { id: 'status', label: 'Status', type: 'single-select', options: ['Active', 'Archived'] },
];

const FEATURES_VIEW_CHIPS: TabConfig['defaultViewChips'] = [
  { id: 'feat-active',   label: 'Active',   count: '15', filters: [{ id: 'status', filterType: 'single-select', selectedValues: ['Active']   }] },
  { id: 'feat-archived', label: 'Archived', count: '5',  filters: [{ id: 'status', filterType: 'single-select', selectedValues: ['Archived'] }] },
];

const PLACEHOLDER_TAB = (tabId: string, label: string, createActionLabel?: string): TabConfig => ({
  tabId,
  label,
  createActionLabel,
  placeholder:      true,
  columns:          SHARED_COLUMNS,
  filters:          SHARED_FILTERS,
  data:             [],
  defaultViewChips: SHARED_VIEW_CHIPS,
  defaultPinnedIds: ['active', 'archived'],
  rowActions:       SHARED_ROW_ACTIONS,
  refundableField:  'status',
  refundableValue:  'Active',
});

const config: PageConfig = {
  pageId:    'product-catalog',
  pageTitle: 'Product Catalog',
  noSearch:  true,

  tabs: [
    {
      tabId:            'all-products',
      label:            'All products',
      createActionLabel: 'Create product',
      columns:          SHARED_COLUMNS,
      filters:          SHARED_FILTERS,
      data:             PRODUCT_CATALOG_DATA,
      defaultViewChips: SHARED_VIEW_CHIPS,
      defaultPinnedIds: ['active', 'archived'],
      rowActions: [
        { label: 'Ask Console', color: '#273951', consolePrompt: productPrompt, consoleContext: (row) => String(row.name), dividerAfter: true },
        { label: 'Edit',        color: '#273951' },
        { label: 'Archive',     color: '#273951' },
        { label: 'Delete',      color: '#C0123C' },
      ],
      refundableField:  'status',
      refundableValue:  'Active',
    },
    {
      tabId:            'features',
      label:            'Features',
      createActionLabel: 'Create feature',
      columns:          FEATURES_COLUMNS,
      filters:          FEATURES_FILTERS,
      data:             FEATURES_DATA as Record<string, unknown>[],
      defaultViewChips: FEATURES_VIEW_CHIPS,
      defaultPinnedIds: ['feat-active', 'feat-archived'],
      rowActions: [
        { label: 'Edit feature',    color: '#273951' },
        { label: 'Archive feature', color: '#C0123C' },
      ],
    },
    {
      tabId:            'coupons',
      label:            'Coupons',
      createActionLabel: 'Create coupon',
      columns: [
        { id: 'coupon',       type: 'basic-text', label: 'Coupon', searchable: true },
        {
          id: 'status',
          type: 'status',
          label: 'Status',
          statusMap: {
            Active: S.success,
            Expired: S.default,
          },
        },
        { id: 'terms',        type: 'basic-text', label: 'Terms', searchable: true },
        { id: 'redemptions',  type: 'numerical',  label: 'Redemptions' },
        { id: 'expires',      type: 'basic-text', label: 'Expires' },
      ],
      filters: [
        { id: 'percent-off',      label: 'Percent off',          type: 'value' },
        { id: 'max-redemptions',  label: 'Maximum redemptions',  type: 'value' },
        { id: 'redeem-by',        label: 'Redeem by',            type: 'date'  },
        { id: 'duration',         label: 'Duration',             type: 'single-select', options: ['Forever', 'Once', 'Repeating'] },
        { id: 'status',           label: 'Status',               type: 'single-select', options: ['Active', 'Expired'] },
      ] satisfies FilterDef[],
      data: COUPONS_DATA as Record<string, unknown>[],
      defaultViewChips: [
        { id: 'cpn-forever',   label: 'Forever',   count: '1',  filters: [{ id: 'duration', filterType: 'single-select', selectedValues: ['Forever']   }] },
        { id: 'cpn-once',      label: 'Once',      count: '14', filters: [{ id: 'duration', filterType: 'single-select', selectedValues: ['Once']      }] },
        { id: 'cpn-repeating', label: 'Repeating', count: '2',  filters: [{ id: 'duration', filterType: 'single-select', selectedValues: ['Repeating'] }] },
      ],
      defaultPinnedIds: ['cpn-forever', 'cpn-once', 'cpn-repeating'],
      rowActions: [
        { label: 'Edit',   color: '#273951' },
        { label: 'Delete', color: '#C0123C' },
      ],
    },
    {
      tabId:            'shipping-rates',
      label:            'Shipping rates',
      createActionLabel: 'Create shipping rate',
      columns: [
        { id: 'id',          type: 'id',         label: 'ID', searchable: true },
        { id: 'description', type: 'basic-text', label: 'Description', searchable: true },
        {
          id: 'amount', type: 'currency', label: 'Amount',
          align: 'right', colSpan: 2,
          dataKeys: { value: 'amount', code: 'currency' },
          searchable: true,
        },
        {
          id: 'status', type: 'status', label: 'Status',
          statusMap: { 'Active': S.success, 'Archived': S.default },
        },
        { id: 'created', type: 'date', label: 'Created', colSpan: 2 },
      ] satisfies TabConfig['columns'],
      filters: [
        { id: 'status', label: 'Status', type: 'single-select', options: ['Active', 'Archived'] },
      ] satisfies FilterDef[],
      data: SHIPPING_RATES_DATA as Record<string, unknown>[],
      defaultViewChips: [
        { id: 'sr-active',   label: 'Active',   count: '22', filters: [{ id: 'status', filterType: 'single-select', selectedValues: ['Active']   }] },
        { id: 'sr-archived', label: 'Archived', count: '5',  filters: [{ id: 'status', filterType: 'single-select', selectedValues: ['Archived'] }] },
      ],
      defaultPinnedIds: ['sr-active', 'sr-archived'],
      rowActions: [
        { label: 'Archive', color: '#273951' },
      ],
    },
    {
      tabId:            'tax-rates',
      label:            'Tax rates',
      createActionLabel: 'Create tax rate',
      columns: [
        { id: 'id',          type: 'id',         label: 'Tax rate ID', searchable: true },
        { id: 'type',        type: 'basic-text', label: 'Type', searchable: true },
        { id: 'region',      type: 'location', label: 'Region', searchable: true },
        { id: 'description', type: 'basic-text', label: 'Description', searchable: true },
        { id: 'rate',        type: 'numerical',  label: 'Rate', align: 'right' },
        { id: 'calculation', type: 'basic-text', label: 'Calculation', searchable: true },
        {
          id: 'status', type: 'status', label: 'Status',
          statusMap: { 'Active': S.success, 'Archived': S.default },
        },
        { id: 'created', type: 'date', label: 'Created', colSpan: 2 },
      ] satisfies TabConfig['columns'],
      filters: [
        { id: 'status',      label: 'Status',      type: 'single-select', options: ['Active', 'Archived'] },
        { id: 'calculation', label: 'Calculation', type: 'single-select', options: ['Inclusive', 'Exclusive'] },
        { id: 'created',     label: 'Created',     type: 'date' },
      ] satisfies FilterDef[],
      data: TAX_RATES_DATA as Record<string, unknown>[],
      defaultViewChips: [
        { id: 'tr-active',   label: 'Active',   count: '35', filters: [{ id: 'status', filterType: 'single-select', selectedValues: ['Active']   }] },
        { id: 'tr-archived', label: 'Archived', count: '2',  filters: [{ id: 'status', filterType: 'single-select', selectedValues: ['Archived'] }] },
      ],
      defaultPinnedIds: ['tr-active', 'tr-archived'],
      rowActions: [
        { label: 'Archive', color: '#273951' },
      ],
    },
    {
      tabId:            'pricing-tables',
      label:            'Pricing tables',
      createActionLabel: 'Create pricing table',
      columns: [
        { id: 'name',         type: 'basic-text', label: 'Name', searchable: true },
        {
          id: 'status', type: 'status', label: 'Status',
          statusMap: { 'Active': S.success, 'Inactive': S.default },
        },
        { id: 'embed-script', type: 'id',         label: 'Embed script' },
        { id: 'created', type: 'date', label: 'Created', colSpan: 2 },
      ] satisfies TabConfig['columns'],
      filters: [
        { id: 'status',  label: 'Status',  type: 'single-select', options: ['Active', 'Inactive'] },
        { id: 'created', label: 'Created', type: 'date' },
      ] satisfies FilterDef[],
      data: PRICING_TABLES_DATA,
      defaultViewChips: [
        { id: 'pt-active',   label: 'Active',   count: '17', filters: [{ id: 'status', filterType: 'single-select', selectedValues: ['Active']   }] },
        { id: 'pt-inactive', label: 'Inactive', count: '2',  filters: [{ id: 'status', filterType: 'single-select', selectedValues: ['Inactive'] }] },
      ],
      defaultPinnedIds: ['pt-active', 'pt-inactive'],
      rowActions: [
        { label: 'Change name', color: '#273951' },
        { label: 'Deactivate',  color: '#C0123C' },
      ],
    },
  ],
};

export default config;
