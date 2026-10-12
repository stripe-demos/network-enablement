// Vary discovery work independently from chart-building work. The cube starts
// only after all discovery calls, when the explicit chart-creation call arrives.
export const PRE_CHART_CALL_COUNTS = [4, 6, 8, 10];
export const CHART_PREPARATION_SECONDS = [3, 5, 7, 10];
export const TOOL_CALL_INTERVAL_MS = 1000;
export const INITIAL_THINKING_MS = 4000;
let previousAnalysisCount;
let previousChartCount;

export function isTaskRunning(phase) {
  return Boolean(phase && phase !== 'complete' && phase !== 'cancelled');
}

function pickCount(choices, previous) {
  const available = choices.filter(count => count !== previous);
  return available[Math.floor(Math.random() * available.length)];
}

function pickAnalysisCount() {
  previousAnalysisCount = pickCount(PRE_CHART_CALL_COUNTS, previousAnalysisCount);
  return previousAnalysisCount;
}

function pickChartCount() {
  previousChartCount = pickCount(CHART_PREPARATION_SECONDS, previousChartCount);
  return previousChartCount;
}

export const REVENUE_TASK = {
  name: 'Analyze revenue performance',
  detail: 'Reviewing payment data and preparing a revenue-over-time chart.',
  analysisCalls: [
    'Finding the revenue data source',
    'Loading the payments schema',
    'Querying settled payments',
    'Calculating daily revenue',
    'Comparing the previous period',
    'Checking currency totals',
    'Validating refunded amounts',
    'Grouping revenue by date',
    'Checking for missing dates',
    'Verifying the revenue trend',
  ],
  chartCall: 'Creating a revenue chart',
};

const CHART_CALLS = [
  'Choosing chart axes',
  'Building chart series',
  'Formatting chart values',
  'Applying chart labels',
  'Checking chart scales',
  'Preparing chart tooltips',
  'Checking the chart legend',
  'Validating plotted totals',
];

export function createChartTaskTimeline(task, {
  analysisCallCount = pickAnalysisCount(),
  chartCallCount = pickChartCount(),
} = {}) {
  const labels = [
    ...task.analysisCalls.slice(0, analysisCallCount),
    task.chartCall,
    ...CHART_CALLS.slice(0, chartCallCount - 2),
    'Finalizing chart data',
  ];
  const calls = labels.map((label, index) => ({ id: `tool-${index + 1}`, label }));
  const taskCopy = { name: task.name, detail: task.detail };
  return [
    {
      delay: 0,
      update: { taskPhase: 'initial-thinking', taskCopy, taskCalls: [] },
    },
    ...calls.map((_, index) => ({
      delay: INITIAL_THINKING_MS + index * TOOL_CALL_INTERVAL_MS,
      update: {
        taskPhase: index >= analysisCallCount ? 'preparing' : index === 0 ? 'reading' : 'thinking',
        taskCopy,
        taskCalls: calls.slice(0, index + 1),
      },
    })),
    {
      delay: INITIAL_THINKING_MS + calls.length * TOOL_CALL_INTERVAL_MS,
      update: { taskPhase: 'complete', taskCopy, taskCalls: calls },
    },
  ];
}
