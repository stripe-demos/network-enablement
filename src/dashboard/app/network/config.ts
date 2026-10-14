import type { PageConfig, TabConfig, FilterDef, ViewChipConfig } from '@dashboard/lib/listview/types';
import { S } from '@dashboard/lib/listview/statusStyles';

// Rows come from the caller (NetworkTab builds them from the Stripe network
// onboarding result, plus the sample accounts in ./data.ts for a platform with
// existing accounts), so it's empty when a platform with no accounts joined
// without inviting anyone.

const STATUSES = ['Invited', 'Enabled', 'Rejected', 'Restricted soon', 'In review', 'Restricted'];

const NETWORK_COLUMNS: TabConfig['columns'] = [
  {
    id: 'name',
    type: 'basic-text',
    label: 'Name',
    searchable: true,
  },
  {
    id: 'status',
    type: 'status',
    label: 'Status',
    statusMap: {
      'Invited':         S.info,
      'Enabled':         S.success,
      'Rejected':        S.critical,
      'Restricted soon': S.warning,
      'In review':       S.info,
      'Restricted':      S.critical,
    },
  },
  {
    id: 'configurations',
    type: 'basic-text',
    label: 'Configurations',
  },
  {
    id: 'email',
    type: 'basic-text',
    label: 'Email',
    searchable: true,
  },
  {
    id: 'country',
    type: 'location',
    label: 'Country',
  },
  {
    id: 'volume',
    type: 'currency',
    label: 'Volume',
    align: 'right',
    colSpan: 2,
    dataKeys: { value: 'volume', code: 'currency' },
  },
  {
    id: 'payment-balance',
    type: 'currency',
    label: 'Payment balance',
    align: 'right',
    colSpan: 2,
    dataKeys: { value: 'payment-balance', code: 'currency' },
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
    label: 'Created on',
  },
  {
    id: 'id',
    type: 'basic-text',
    label: 'ID',
    searchable: true,
    defaultVisible: false,
  },
];

const NETWORK_FILTERS: FilterDef[] = [
  { id: 'name',            label: 'Name',              type: 'value' },
  { id: 'email',           label: 'Email',             type: 'value' },
  { id: 'status',          label: 'Status',            type: 'multi-select',  options: STATUSES },
  { id: 'volume',          label: 'Volume',            type: 'value' },
  { id: 'payment-balance', label: 'Payment balance',   type: 'value' },
  { id: 'total-spend',     label: 'Total spend',       type: 'value' },
  { id: 'created',         label: 'Created on',        type: 'date' },
  { id: 'radar-match',     label: 'Radar rule match',  type: 'single-select', options: ['Yes', 'No'] },
];

const NETWORK_ROW_ACTIONS: TabConfig['rowActions'] = [
  { label: 'Ask Console',  color: '#273951', consolePrompt: 'Tell me about {name}', consoleContext: (row) => String(row.name), dividerAfter: true },
  { label: 'View account', color: '#273951' },
  { label: 'Copy ID',      color: '#273951' },
  { label: 'Close account', color: '#C0123C' },
];

/** Rows whose comma-separated 'configurations' include the given role (case-insensitive). */
function rowsWithRole(rows: Record<string, unknown>[], role: string): Record<string, unknown>[] {
  const target = role.toLowerCase();
  return rows.filter(row =>
    String(row.configurations ?? '')
      .split(',')
      .some(part => part.trim().toLowerCase() === target),
  );
}

const countWhere = (rows: Record<string, unknown>[], key: string, value: string) =>
  rows.filter(row => row[key] === value).length.toLocaleString();

/**
 * View chips shared by every tab; counts are computed from that tab's rows.
 *
 * No chip (and no allViewConfig) sets sortCol: 'volume'. The template sorts by
 * string compare, which misorders formatted amounts ('$924,760.00' lands above
 * '$8,742,190.00'). Rows arrive in the intended order, so the unsorted
 * default keeps it.
 */
function viewChips(tabId: string, rows: Record<string, unknown>[]): ViewChipConfig[] {
  return [
    {
      id: `${tabId}-invited`,
      label: 'Invited',
      count: countWhere(rows, 'status', 'Invited'),
      filters: [{ id: 'status', filterName: 'Status', filterType: 'single-select', selectedValues: ['Invited'] }],
    },
    {
      id: `${tabId}-connected`,
      label: 'Connected accounts',
      count: countWhere(rows, 'status', 'Enabled'),
      filters: [{ id: 'status', filterName: 'Status', filterType: 'single-select', selectedValues: ['Enabled'] }],
    },
    {
      id: `${tabId}-restricted`,
      label: 'Restricted',
      count: countWhere(rows, 'status', 'Restricted'),
      filters: [{ id: 'status', filterName: 'Status', filterType: 'single-select', selectedValues: ['Restricted'] }],
    },
    {
      id: `${tabId}-restricted-soon`,
      label: 'Restricted soon',
      count: countWhere(rows, 'status', 'Restricted soon'),
      filters: [{ id: 'status', filterName: 'Status', filterType: 'single-select', selectedValues: ['Restricted soon'] }],
    },
    {
      id: `${tabId}-radar`,
      label: 'Radar rule matches',
      count: countWhere(rows, 'radar-match', 'Yes'),
      filters: [{ id: 'radar-match', filterName: 'Radar rule match', filterType: 'single-select', selectedValues: ['Yes'] }],
    },
  ];
}

/**
 * Shown on every tab when the user joined the network but invited no one. No
 * action: emptyState actions only navigate to a route.
 */
const NETWORK_EMPTY_STATE: TabConfig['emptyState'] = {
  title: 'You’re on the Stripe network',
  description: 'Businesses you invite to connect to your platform will show up here.',
};

function networkTab(tabId: string, label: string, data: Record<string, unknown>[], networkEmpty: boolean): TabConfig {
  const chips = viewChips(tabId, data);
  return {
    tabId,
    label,
    createActionLabel: 'Create',
    columns: NETWORK_COLUMNS,
    filters: NETWORK_FILTERS,
    data,
    defaultViewChips: chips,
    defaultPinnedIds: chips.map(chip => chip.id),
    rowActions: NETWORK_ROW_ACTIONS,
    refundableField: 'status',
    refundableValue: 'Enabled',
    emptyState: networkEmpty ? NETWORK_EMPTY_STATE : undefined,
  };
}

/** Network page config for the given rows. Tabs filter them by configuration. */
export function buildNetworkConfig(rows: Record<string, unknown>[]): PageConfig {
  const empty = rows.length === 0;
  return {
    pageId: 'network',
    pageTitle: 'Network',
    tabs: [
      networkTab('all',        'All',        rows, empty),
      networkTab('merchants',  'Merchants',  rowsWithRole(rows, 'merchant'), empty),
      networkTab('recipients', 'Recipients', rowsWithRole(rows, 'recipient'), empty),
      networkTab('customers',  'Customers',  rowsWithRole(rows, 'customer'), empty),
    ],
  };
}

export default buildNetworkConfig([]);
