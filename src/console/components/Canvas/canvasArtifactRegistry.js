import {
  CanvasTabIconBarChart,
  CanvasTabIconCode,
  CanvasTabIconList,
  CanvasTabIconNote,
} from './tab-icons/CanvasTabIcons';
import { CANVAS_TAB_ORDER } from './canvasTabOrder';
import welcomeMarkdown from '../../data/welcome-to-console.md?raw';
import { SIMULATED_RESPONSE_CHARTS } from '../../data/simulatedResponses';

/**
 * Canonical canvas artifact kinds. Each tab resolves to exactly one.
 * - chart / multiChart / table: visual canvas (Chart / BarChart / Table)
 * - code / markdown: editor chrome (Save + preview/code) + matching body
 */
/** Icon component per artifact type (tabs + overflow rows use the same mapping). */
export const ARTIFACT_TYPE_ICONS = {
  chart: CanvasTabIconBarChart,
  multiChart: CanvasTabIconBarChart,
  table: CanvasTabIconList,
  code: CanvasTabIconCode,
  markdown: CanvasTabIconNote,
};

/** @param {string} t */
export function artifactShowsEditorChrome(t) {
  return t === 'markdown' || t === 'code';
}

/**
 * Per-tab content keyed by `CANVAS_TAB_ORDER` id. `artifactType` drives icon + body routing; `label` is the canvas content header title (matches the tab pill).
 * @typedef {'line' | 'bar'} ChartVariant
 * @typedef {{ chartVariant: ChartVariant, headingLarge: string, sub: string, legendLabel?: string, series1Label?: string, series2Label?: string, chartDataKey?: string, barDataKey?: string, id?: string }} MultiChartPanel
 * @type {Record<string, { artifactType: keyof typeof ARTIFACT_TYPE_ICONS, label: string, heading: string, headingLarge: string, sub: string, chartVariant?: ChartVariant, legendLabel?: string, panels?: MultiChartPanel[] }>}
 */
const TAB_MODELS_BY_ID = {
  ...SIMULATED_RESPONSE_CHARTS,
  welcome: {
    artifactType: 'markdown',
    label: 'Welcome to Console',
    heading: 'Welcome to Console',
    headingLarge: 'Welcome to Console',
    sub: 'Your guide to Console',
    markdownContent: welcomeMarkdown,
  },
  chart: {
    artifactType: 'chart',
    chartVariant: 'line',
    label: 'Revenue over time',
    heading: 'Revenue over time – Dec 2025',
    headingLarge: 'Revenue over time',
    sub: 'Dec 2025',
    sourceLabel: 'Billing Overview',
    sourceTooltip: 'From your Billing Overview data. Data as of 1 hour ago.',
    sourceItems: [{ label: 'Billing Overview', type: 'dashboard' }],
    freshnessLabel: 'Generated 5h ago',
  },
  multi2: {
    artifactType: 'multiChart',
    label: 'API health',
    heading: 'API health — latency and error budget',
    headingLarge: 'API health',
    sub: 'Last 24h',
    sourceLabel: 'API Monitoring',
    sourceTooltip: 'From your API Monitoring data. Data as of 30 minutes ago.',
    sourceItems: [{ label: 'API Monitoring', type: 'dashboard' }, { label: 'API latency', type: 'code', sqlId: 'sql-api-latency' }, { label: 'API throughput', type: 'code', sqlId: 'sql-api-throughput' }],
    freshnessLabel: 'Generated 30m ago',
    panels: [
      {
        chartVariant: 'line',
        headingLarge: 'API latency',
        sub: 'p99 and p50 · Dec 2025',
        chartDataKey: 'latency',
        series1Label: 'p99',
        series2Label: 'p50',
      },
      {
        chartVariant: 'bar',
        headingLarge: 'Error budget',
        sub: 'Burn by hour',
        barDataKey: 'queueDepth',
        legendLabel: 'Events',
      },
    ],
  },
  multi3: {
    artifactType: 'multiChart',
    label: 'Platform metrics',
    heading: 'Platform metrics — volume, depth, and error rate',
    headingLarge: 'Platform metrics',
    sub: 'Dec 2025',
    sourceLabel: 'Platform Analytics',
    sourceTooltip: 'From your Platform Analytics data. Data as of 1 hour ago.',
    sourceItems: [{ label: 'Platform Monitoring', type: 'dashboard' }, { label: 'API throughput', type: 'code', sqlId: 'sql-api-throughput' }, { label: 'Queue depth', type: 'code', sqlId: 'sql-queue-depth' }],
    freshnessLabel: 'Generated 1h ago',
    panels: [
      {
        chartVariant: 'line',
        headingLarge: 'Request volume',
        sub: 'rpm · Dec 2025',
        chartDataKey: 'requestVolume',
        series1Label: 'Past 30 days',
        series2Label: 'Previous period',
      },
      {
        chartVariant: 'bar',
        headingLarge: 'Queue depth',
        sub: 'By hour',
        barDataKey: 'queueDepth',
        legendLabel: 'Volume',
      },
      {
        chartVariant: 'line',
        headingLarge: 'Error rate',
        sub: 'Rolling 7d',
        chartDataKey: 'successRate',
        series1Label: 'Current period',
        series2Label: 'Previous period',
      },
    ],
  },
  multi4: {
    artifactType: 'multiChart',
    label: 'Growth overview',
    heading: 'Growth overview — north star, conversion, throughput, latency',
    headingLarge: 'Growth overview',
    sub: 'Q4 2025',
    sourceLabel: 'Growth Metrics',
    sourceTooltip: 'From your Growth Metrics data. Data as of 1 hour ago.',
    sourceItems: [{ label: 'Growth metrics', type: 'dashboard' }, { label: 'Active merchants', type: 'code', sqlId: 'sql-active-merchants' }, { label: 'Revenue trend', type: 'code', sqlId: 'sql-revenue-trend' }, { label: 'Conversion funnel', type: 'api' }, { label: 'Radar rule configuration', type: 'doc' }],
    freshnessLabel: 'Generated 2m ago',
    panels: [
      {
        chartVariant: 'line',
        headingLarge: 'Active merchants',
        sub: 'Dec 2025',
        chartDataKey: 'northStar',
        series1Label: 'This period',
        series2Label: 'Previous period',
      },
      {
        chartVariant: 'bar',
        headingLarge: 'Conversion funnel',
        sub: 'Dec 2025',
        barDataKey: 'conversion',
        legendLabel: 'Users',
      },
      {
        chartVariant: 'bar',
        headingLarge: 'API throughput',
        sub: 'By region · req/s',
        barDataKey: 'throughput',
        legendLabel: 'req/s',
      },
      {
        chartVariant: 'line',
        headingLarge: 'API latency',
        sub: 'p99 and p50 · Dec 2025',
        chartDataKey: 'latency',
        series1Label: 'p99',
        series2Label: 'p50',
      },
    ],
  },
  table: {
    artifactType: 'table',
    label: 'Failed payments',
    heading: 'Failed payments >$500 in December 2025',
    headingLarge: 'Failed payments',
    sub: 'Greater than $500 in December 2025',
    sourceLabel: 'Payments',
    sourceTooltip: 'From your Payments data. Data as of 1 hour ago.',
    sourceItems: [{ label: 'Payments', type: 'dashboard' }, { label: 'Card details', type: 'code', sqlId: 'sql-card-details' }],
    freshnessLabel: 'Generated 3h ago',
  },
  text: {
    artifactType: 'markdown',
    label: 'Tax skill',
    heading: 'Tax skill',
    headingLarge: 'Tax skill',
    sub: 'Updated Mar 30, 12:30 PM',
  },
  ext01: {
    artifactType: 'code',
    label: 'Failed payments',
    heading: 'Failed payments query',
    headingLarge: 'Failed payments query',
    sub: 'SQL · December 2025',
    freshnessLabel: 'Generated 2m ago',
  },
  ext03: {
    artifactType: 'markdown',
    label: 'Radar ruleset diff',
    heading: 'Radar ruleset diff — staging vs prod',
    headingLarge: 'Radar ruleset diff',
    sub: 'Markdown · rules configuration',
  },
  ext04: {
    artifactType: 'table',
    label: 'Shipping labels export',
    heading: 'Shipping labels export — December batch',
    headingLarge: 'Shipping labels export',
    sub: 'December batch',
    sourceItems: [
      { label: 'Radar rule configuration', type: 'doc' },
      { label: 'Shipping label exports', type: 'doc' },
      { label: 'PDF template localization', type: 'doc' },
    ],
    freshnessLabel: 'Generated 4h ago',
  },
  ext05: {
    artifactType: 'markdown',
    label: 'PDF template',
    heading: 'PDF template localization',
    headingLarge: 'PDF template',
    sub: 'Markdown · localization',
  },
  ext06: {
    artifactType: 'code',
    label: 'Webhook handler',
    heading: 'Webhook handler',
    headingLarge: 'Webhook handler',
    sub: 'TypeScript · payment_intent.succeeded',
  },
  ext08: {
    artifactType: 'chart',
    chartVariant: 'bar',
    label: 'Queue depth',
    heading: 'Terminal queue depth by hour',
    headingLarge: 'Queue depth',
    sub: 'Hourly · last 24h',
    legendLabel: 'Volume',
    sourceItems: [
      { label: 'Webhook endpoints', type: 'api' },
      { label: 'Terminal queue', type: 'api' },
      { label: 'Subscriber cohorts', type: 'api' },
    ],
    freshnessLabel: 'Generated 15m ago',
  },
  ext09: {
    artifactType: 'table',
    label: 'Weekly subscribers',
    heading: 'Weekly active subscribers by cohort',
    headingLarge: 'Weekly active subscribers',
    sub: 'By cohort',
    sourceItems: [
      { label: 'Webhook endpoints', type: 'api' },
      { label: 'Terminal queue', type: 'api' },
      { label: 'Subscriber cohorts', type: 'api' },
    ],
    freshnessLabel: 'Generated 15m ago',
  },
  inline01: {
    artifactType: 'table',
    label: 'Revenue by customer',
    heading: 'Top customers by failed payment volume',
    headingLarge: 'Top customers',
    sub: 'By failed $ · December 2025',
    sourceItems: [
      { label: 'Growth metrics', type: 'dashboard' },
      { label: 'Revenue trend', type: 'code', sqlId: 'sql-revenue-trend' },
    ],
    freshnessLabel: 'Generated 2h ago',
  },
  inline02: {
    artifactType: 'table',
    label: 'Decline breakdown',
    heading: 'Decline breakdown — December 2025',
    headingLarge: 'Decline breakdown',
    sub: 'Customer · BIN · Amount · Date · Decline code',
    sourceItems: [
      { label: 'Payments', type: 'dashboard' },
      { label: 'Card details', type: 'code', sqlId: 'sql-card-details' },
      { label: 'Issuer metadata', type: 'api' },
    ],
    freshnessLabel: 'Generated 3h ago',
  },
  // ── Suspicious refunds chat ─────────────────────────────────────────────────
  'refund-trend': {
    artifactType: 'chart',
    chartVariant: 'bar',
    label: 'Refund rate',
    heading: 'Refund rate by payment method',
    headingLarge: 'Refund rate',
    sub: 'Last 7 days · by method',
    barDataKey: 'throughput',
    legendLabel: 'Refunds',
    sourceItems: [{ label: 'Suspicious refunds', type: 'code', sqlId: 'refund-query' }],
    freshnessLabel: 'Generated 1h ago',
  },
  'refund-table': {
    artifactType: 'table',
    label: 'Flagged transactions',
    heading: 'Flagged refund transactions — May 2026',
    headingLarge: 'Flagged transactions',
    sub: 'May 25–Jun 1, 2026',
    sourceItems: [{ label: 'Suspicious refunds', type: 'code', sqlId: 'refund-query' }],
    freshnessLabel: 'Generated 1h ago',
  },
  'refund-report': {
    artifactType: 'markdown',
    label: 'Risk summary',
    heading: 'Risk summary — May 2026',
    headingLarge: 'Risk summary',
    sub: 'Automated analysis',
  },
  'refund-bins': {
    artifactType: 'table',
    label: 'BIN analysis',
    heading: 'Refund rate by card BIN',
    headingLarge: 'BIN analysis',
    sub: 'May 25–Jun 1, 2026 · top offenders',
    sourceItems: [
      { label: 'Radar', type: 'dashboard' },
      { label: 'Suspicious refunds', type: 'code', sqlId: 'refund-query' },
    ],
    freshnessLabel: 'Generated 1h ago',
  },
  'refund-query': {
    artifactType: 'code',
    label: 'Refund query',
    heading: 'Suspicious refund query',
    headingLarge: 'Suspicious refund query',
    sub: 'SQL · May 2026',
    freshnessLabel: 'Generated 1h ago',
  },
  // Sigma queries opened from an expanded source list. These live outside
  // CANVAS_TAB_ORDER — they only appear once a source row is clicked.
  'sql-active-merchants': {
    artifactType: 'code',
    label: 'Active merchants',
    heading: 'Active merchants query',
    headingLarge: 'Active merchants',
    sub: 'SQL · Dec 2025',
    freshnessLabel: 'Generated 2m ago',
  },
  'sql-revenue-trend': {
    artifactType: 'code',
    label: 'Revenue trend',
    heading: 'Revenue trend query',
    headingLarge: 'Revenue trend',
    sub: 'SQL · Dec 2025',
    freshnessLabel: 'Generated 2m ago',
  },
  'sql-api-latency': {
    artifactType: 'code',
    label: 'API latency',
    heading: 'API latency query',
    headingLarge: 'API latency',
    sub: 'SQL · Last 24h',
    freshnessLabel: 'Generated 30m ago',
  },
  'sql-api-throughput': {
    artifactType: 'code',
    label: 'API throughput',
    heading: 'API throughput query',
    headingLarge: 'API throughput',
    sub: 'SQL · Last 24h',
    freshnessLabel: 'Generated 30m ago',
  },
  'sql-queue-depth': {
    artifactType: 'code',
    label: 'Queue depth',
    heading: 'Queue depth query',
    headingLarge: 'Queue depth',
    sub: 'SQL · Dec 18, 2025',
    freshnessLabel: 'Generated 1h ago',
  },
  'sql-card-details': {
    artifactType: 'code',
    label: 'Card details',
    heading: 'Card details query',
    headingLarge: 'Card details',
    sub: 'SQL · Dec 2025',
    freshnessLabel: 'Generated 3h ago',
  },
};

/**
 * Ordered list aligned to `CANVAS_TAB_ORDER` (throws if a tab id is missing a model).
 *
 * Nothing imports this, but don't delete it: evaluating it at module load is
 * what enforces that every ordered tab has a model, so a missing entry fails
 * loudly here instead of silently rendering a tab with fallback metadata.
 */
export const CANVAS_TAB_MODELS = CANVAS_TAB_ORDER.map((id) => {
  const m = TAB_MODELS_BY_ID[id];
  if (!m) {
    throw new Error(`[canvasArtifactRegistry] Missing TAB_MODELS_BY_ID entry for tab id "${id}"`);
  }
  return { id, ...m };
});

function buildTabEntry({ id, artifactType, label, heading, headingLarge, sub, chartVariant, legendLabel, panels, sourceLabel, sourceTooltip, sourceItems, freshnessLabel, markdownContent, dataset }) {
  return [
    id,
    {
      artifactType,
      label,
      heading,
      headingLarge,
      sub,
      ...(markdownContent !== undefined ? { markdownContent } : {}),
      ...(sourceLabel ? { sourceLabel } : {}),
      ...(sourceTooltip ? { sourceTooltip } : {}),
      ...(sourceItems ? { sourceItems } : {}),
      ...(freshnessLabel ? { freshnessLabel } : {}),
      ...(artifactType === 'chart'
        ? {
            chartVariant: chartVariant ?? 'line',
            ...(dataset ? { dataset } : {}),
            ...(typeof legendLabel === 'string' ? { legendLabel } : {}),
          }
        : {}),
      ...(artifactType === 'multiChart' && Array.isArray(panels) ? { panels } : {}),
    },
  ];
}

/**
 * Tab row data keyed by id — includes ALL registry entries, not just the default
 * CANVAS_TAB_ORDER set, so dynamically-added tabs (e.g. expanded from chat) work.
 */
const _baseTabData = Object.fromEntries(
  Object.entries(TAB_MODELS_BY_ID).map(([id, m]) => buildTabEntry({ id, ...m })),
);

// For every multiChart entry, register each panel as its own chart entry so
// the artifact picker can surface individual charts alongside the parent tab.
for (const [id, data] of Object.entries(_baseTabData)) {
  if (data.artifactType === 'multiChart' && Array.isArray(data.panels)) {
    data.panels.forEach((panel, i) => {
      _baseTabData[`${id}-${i}`] = {
        artifactType: 'chart',
        label: panel.headingLarge,
        heading: `${panel.headingLarge} — ${panel.sub}`,
        headingLarge: panel.headingLarge,
        sub: panel.sub,
        chartVariant: panel.chartVariant ?? 'line',
        ...(typeof panel.legendLabel === 'string' ? { legendLabel: panel.legendLabel } : {}),
      };
    });
  }
}

export const CANVAS_TAB_DATA = _baseTabData;

/** Tab id → icon component — covers ALL registry entries including panel IDs. */
export const CANVAS_TAB_ICONS = Object.fromEntries(
  Object.entries(CANVAS_TAB_DATA).map(([id, { artifactType }]) => {
    const Icon = ARTIFACT_TYPE_ICONS[artifactType];
    if (!Icon) {
      throw new Error(`[canvasArtifactRegistry] No icon for artifactType "${artifactType}"`);
    }
    return [id, Icon];
  }),
);

/**
 * Expands a list of tab IDs so that each multiChart entry is immediately
 * followed by its individual panel IDs. Deduplicates across both sources
 * (chat artifactIds + visibleCanvasTabIds) so the picker never shows repeats.
 */
/**
 * Resolves a panel ID (e.g. "multi3-0") back to its parent multiChart tab ID.
 * Returns the ID unchanged if it's already a top-level tab or unrecognised.
 */
export function getParentTabId(id) {
  const match = id.match(/^(.+)-(\d+)$/);
  if (match && CANVAS_TAB_DATA[match[1]]?.artifactType === 'multiChart') {
    return match[1];
  }
  return id;
}

export function expandTabIdsWithPanels(tabIds) {
  const seen = new Set();
  const result = [];
  for (const id of tabIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
    const data = CANVAS_TAB_DATA[id];
    if (data?.artifactType === 'multiChart' && Array.isArray(data.panels)) {
      data.panels.forEach((_, i) => {
        const panelId = `${id}-${i}`;
        if (!seen.has(panelId)) {
          seen.add(panelId);
          result.push(panelId);
        }
      });
    }
  }
  return result;
}

const SVG_OPEN = `<svg width="11" height="11" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">`;
const SVG_CLOSE = `</svg>`;

const ARTIFACT_TYPE_SVG = {
  chart: SVG_OPEN +
    `<path d="M10.4999 1.40625C10.4999 1.04381 10.2061 0.75 9.84369 0.75C9.48125 0.75 9.18744 1.04381 9.18744 1.40625V7.96875C9.18744 8.33119 9.48125 8.625 9.84369 8.625C10.2061 8.625 10.4999 8.33119 10.4999 7.96875V1.40625Z" fill="currentColor"/>` +
    `<path d="M1.95049 1.40625C1.95049 1.07488 1.68186 0.806248 1.35049 0.806248C1.01912 0.806248 0.750488 1.07488 0.750488 1.40625V9.9C0.750488 10.6456 1.3549 11.25 2.10049 11.25H10.9698C11.3012 11.25 11.5698 10.9814 11.5698 10.65C11.5698 10.3186 11.3012 10.05 10.9698 10.05H2.10049C2.01764 10.05 1.95049 9.98284 1.95049 9.9V1.40625Z" fill="currentColor"/>` +
    `<path d="M6.84369 2.625C7.20613 2.625 7.49994 2.91881 7.49994 3.28125V7.96875C7.49994 8.33119 7.20613 8.625 6.84369 8.625C6.48125 8.625 6.18744 8.33119 6.18744 7.96875V3.28125C6.18744 2.91881 6.48125 2.625 6.84369 2.625Z" fill="currentColor"/>` +
    `<path d="M4.49994 5.15625C4.49994 4.79381 4.20613 4.5 3.84369 4.5C3.48125 4.5 3.18744 4.79381 3.18744 5.15625V7.96875C3.18744 8.33119 3.48125 8.625 3.84369 8.625C4.20613 8.625 4.49994 8.33119 4.49994 7.96875V5.15625Z" fill="currentColor"/>` +
    SVG_CLOSE,
  table: SVG_OPEN +
    `<path d="M1.3125 3.1875C1.82812 3.1875 2.25 2.76562 2.25 2.25C2.25 1.73438 1.82812 1.3125 1.3125 1.3125C0.796875 1.3125 0.375 1.73438 0.375 2.25C0.375 2.775 0.796875 3.1875 1.3125 3.1875Z" fill="currentColor"/>` +
    `<path d="M1.3125 6.9375C1.82812 6.9375 2.25 6.51562 2.25 6C2.25 5.48438 1.82812 5.0625 1.3125 5.0625C0.796875 5.0625 0.375 5.48438 0.375 6C0.375 6.525 0.796875 6.9375 1.3125 6.9375Z" fill="currentColor"/>` +
    `<path d="M1.3125 10.6875C1.82812 10.6875 2.25 10.2656 2.25 9.75C2.25 9.23438 1.82812 8.8125 1.3125 8.8125C0.796875 8.8125 0.375 9.23438 0.375 9.75C0.375 10.275 0.796875 10.6875 1.3125 10.6875Z" fill="currentColor"/>` +
    `<path fill-rule="evenodd" clip-rule="evenodd" d="M3 2.15625C3 1.79381 3.29381 1.5 3.65625 1.5H10.9688C11.3312 1.5 11.625 1.79381 11.625 2.15625C11.625 2.51869 11.3312 2.8125 10.9688 2.8125H3.65625C3.29381 2.8125 3 2.51869 3 2.15625Z" fill="currentColor"/>` +
    `<path fill-rule="evenodd" clip-rule="evenodd" d="M3 6.00073C3 5.6383 3.29381 5.34448 3.65625 5.34448H10.9688C11.3312 5.34448 11.625 5.6383 11.625 6.00073C11.625 6.36317 11.3312 6.65698 10.9688 6.65698H3.65625C3.29381 6.65698 3 6.36317 3 6.00073Z" fill="currentColor"/>` +
    `<path fill-rule="evenodd" clip-rule="evenodd" d="M3 9.84375C3 9.48131 3.29381 9.1875 3.65625 9.1875H10.9688C11.3312 9.1875 11.625 9.48131 11.625 9.84375C11.625 10.2062 11.3312 10.5 10.9688 10.5H3.65625C3.29381 10.5 3 10.2062 3 9.84375Z" fill="currentColor"/>` +
    SVG_CLOSE,
  markdown: SVG_OPEN +
    `<path d="M3 7.3125C3 7.00184 3.25184 6.75 3.5625 6.75H5.0625C5.37316 6.75 5.625 7.00184 5.625 7.3125C5.625 7.62316 5.37316 7.875 5.0625 7.875H3.5625C3.25184 7.875 3 7.62316 3 7.3125Z" fill="currentColor"/>` +
    `<path d="M3.5625 3.75C3.25184 3.75 3 4.00184 3 4.3125C3 4.62316 3.25184 4.875 3.5625 4.875H8.0625C8.37316 4.875 8.625 4.62316 8.625 4.3125C8.625 4.00184 8.37316 3.75 8.0625 3.75H3.5625Z" fill="currentColor"/>` +
    `<path fill-rule="evenodd" clip-rule="evenodd" d="M0.75 9.375V2.625C0.75 1.58947 1.58947 0.75 2.625 0.75H9.375C10.4105 0.75 11.25 1.58947 11.25 2.625V7.62868C11.25 8.0265 11.092 8.40804 10.8107 8.68934L8.68934 10.8107C8.40804 11.092 8.02651 11.25 7.62868 11.25L2.625 11.25C1.58947 11.25 0.75 10.4105 0.75 9.375ZM1.875 9.375L1.875 2.625C1.875 2.21079 2.21079 1.875 2.625 1.875L9.375 1.875C9.78922 1.875 10.125 2.21079 10.125 2.625V6.375L7.6875 6.375C6.96263 6.375 6.375 6.96263 6.375 7.6875L6.375 10.125L2.625 10.125C2.21079 10.125 1.875 9.78921 1.875 9.375ZM7.5 10.125H7.62868C7.72814 10.125 7.82352 10.0855 7.89385 10.0152L10.0152 7.89384C10.0855 7.82352 10.125 7.72814 10.125 7.62868V7.5H7.6875C7.58395 7.5 7.5 7.58395 7.5 7.6875V10.125Z" fill="currentColor"/>` +
    SVG_CLOSE,
  code: SVG_OPEN +
    `<path d="M6.27403 1.22888C6.34094 0.883217 6.67539 0.657234 7.02105 0.724136C7.36672 0.791038 7.5927 1.12549 7.5258 1.47116L5.72584 10.7711C5.65894 11.1168 5.32448 11.3428 4.97882 11.2759C4.63315 11.209 4.40717 10.8745 4.47407 10.5288L6.27403 1.22888Z" fill="currentColor"/>` +
    `<path d="M3.9007 2.54908C4.14966 2.79804 4.14967 3.20168 3.90071 3.45064L1.35156 5.99983L3.4508 8.09907C3.69976 8.34803 3.69976 8.75167 3.4508 9.00063C3.20184 9.24959 2.7982 9.24959 2.54924 9.00063L0.296555 6.74795C0.106674 6.55807 0 6.30053 0 6.032V5.96766C0 5.69913 0.106672 5.4416 0.296549 5.25172L2.99914 2.54909C3.2481 2.30013 3.65174 2.30012 3.9007 2.54908Z" fill="currentColor"/>` +
    `<path d="M8.54923 2.99935C8.79818 2.75039 9.20183 2.75038 9.45079 2.99933L11.7034 5.25185C11.8933 5.44173 12 5.69927 12 5.96781V6.03215C12 6.30068 11.8933 6.55821 11.7034 6.74809L9.00082 9.4507C8.75186 9.69966 8.34822 9.69966 8.09926 9.4507C7.8503 9.20175 7.8503 8.7981 8.09925 8.54914L10.6484 5.99998L8.54925 3.90091C8.30028 3.65196 8.30027 3.24831 8.54923 2.99935Z" fill="currentColor"/>` +
    SVG_CLOSE,
};
ARTIFACT_TYPE_SVG.multiChart = ARTIFACT_TYPE_SVG.chart;

/** Returns an SVG HTML string for a given tab id, for use in chip innerHTML. */
export function getTabIconSvgHtml(tabId) {
  const data = CANVAS_TAB_DATA[tabId];
  return data ? (ARTIFACT_TYPE_SVG[data.artifactType] ?? '') : '';
}
