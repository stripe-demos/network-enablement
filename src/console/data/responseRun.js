import { createChartTaskTimeline } from './chartPreparation.js';
import { getSimulatedResponse } from './simulatedResponses.js';
import { createTextStream } from './taskStreaming.js';
import { TASK_INTRO, FIRST_FINDING, LAST_FINDING, QUERY_SQL, UPCOMING_SQL } from './cardTaskScenario.js';
import { CHECKPOINT_RESPONSE_HOLD_MS, CHECKPOINT_HANDOFF_MS } from './taskCollapse.js';

const CARD_STEPS = [
  { key: 'source', label: 'Locate saved customer card data', message: 'I’ll locate your saved card data so I can check which customer cards are expiring.', detail: TASK_INTRO },
  { key: 'schema', label: 'Check which card details are available', message: 'Next, checking which card details are available. The expiration month and year will help separate expired cards from those coming up soon.' },
  { key: 'query', label: 'Find customers with expired cards', message: 'Checking for cards that have already expired.', code: QUERY_SQL, finding: FIRST_FINDING },
];
const CARD_EXECUTION_STEPS = [
  {
    key: 'write-file', label: 'Writing file', duration: 3400,
    message: 'One customer card expired in January 2026. I’ll put the expiration checks into a query file, then run it to check the next six months and prepare the summary.',
    detail: 'Writing card_expiration_summary.sql with separate checks for expired cards and upcoming expirations. Each result includes the customer ID and expiration date so the affected accounts can be reviewed.',
    code: `${QUERY_SQL}\n\n-- Check upcoming expirations\n${UPCOMING_SQL}`,
    finding: 'Saved card_expiration_summary.sql. The expiration checks are ready to run.',
  },
  {
    key: 'run-code', label: 'Running code', duration: 4400, message: '',
    detail: 'Running the saved queries against the customer card sample. Checking the returned expiration dates and customer counts before preparing the final summary.',
    tool: 'Run card_expiration_summary.sql', finding: LAST_FINDING,
  },
];
const CARD_RESPONSE = [
  'You have 13 customer cards to address:',
  '1 already expired (Jan 2026) — this customer may have payment failures if they have active subscriptions.',
  '12 expiring in Jan 2027 — about 3 months away; a good time to prompt customers to update their payment methods.',
  'Most of the upcoming expirations belong to customers with email addresses on file, so you can reach out proactively. If you use Stripe Billing, you can enable automatic card updates to let card networks push updated card details automatically.',
];

// Presentation follows the source's 300ms beats and character cadence. Vary
// the work separately so faster tasks cannot overtake their progress messages.
export function checkpointSteps(steps) {
  let previousReveal = -Infinity;
  return steps.map(step => {
    const stream = createTextStream(step.message);
    const messageStart = Math.max(step.start + 300, previousReveal + 540);
    const taskReveal = messageStart + (step.message ? stream.duration + 300 : 0);
    previousReveal = taskReveal;
    return { ...step, stream, messageStart, taskReveal };
  });
}

export const WORK_CYCLE_COUNTS = [3, 4, 7];
let previousCycles;
function chooseCycles() {
  const choices = WORK_CYCLE_COUNTS.filter(value => value !== previousCycles);
  previousCycles = choices[Math.floor(Math.random() * choices.length)];
  return previousCycles;
}

export function createResponseRun(chatId, submission, { future = false, now = Date.now(), workCycles = chooseCycles(), taskOptions } = {}) {
  const { task, ...originalResult } = getSimulatedResponse(chatId);
  let result = originalResult;
  let timeline;
  let steps;
  let title;
  if (future) {
    title = 'Check card expirations';
    // Shorter runs combine discovery into the expired-card query; every run
    // still ends with the same writing/execution pair and grounded findings.
    const samples = workCycles === 3 ? [{
      ...CARD_STEPS[2],
      message: 'I’ll review your saved card data and check which customer cards have already expired.',
      detail: 'Locating the saved card data, checking the expiration fields, and querying for expired cards before checking upcoming expirations.',
    }] : workCycles === 4 ? [CARD_STEPS[0], CARD_STEPS[2]] : [...CARD_STEPS];
    for (let index = 0; index < workCycles - 5; index++) samples.push({
      key: `validate-${index}`, label: index === 0 ? 'Validate customer contact details' : 'Check the expiration totals',
      message: index === 0 ? 'Checking which customers have an email address on file for a reminder.' : 'Verifying the totals before summarizing the results.',
    });
    samples.push(...CARD_EXECUTION_STEPS);
    let end = 1200;
    steps = samples.map((step, index) => {
      const start = end;
      end += step.duration ?? 1600 + (index % 3) * 350;
      return { ...step, id: step.key, start, end, detail: step.detail ?? `The request is to identify customer cards expiring soon. ${step.message}` };
    });
    result = { assistant: CARD_RESPONSE, artifactId: 'chart', sourceItems: [{ label: 'Payments', type: 'dashboard' }] };
    timeline = [
      { delay: 0, update: { taskPhase: 'initial-thinking', taskCopy: { name: title }, taskCalls: [] } },
      ...steps.map((step, index) => ({ delay: step.start, update: {
        taskPhase: step.key === 'write-file' || step.key === 'run-code' ? 'preparing' : 'thinking',
        taskCalls: steps.slice(0, index + 1).map(item => ({ id: item.id, label: item.label })),
      } })),
      { delay: end, update: { taskPhase: 'streaming' } },
    ];
  } else {
    title = task.name;
    timeline = createChartTaskTimeline(task, taskOptions);
    const callStages = timeline.slice(1, -1);
    steps = callStages.map((stage, index) => ({
      id: `tool-${index}`, label: stage.update.taskCalls.at(-1).label,
      message: stage.update.taskCalls.at(-1).label + '.', detail: task.detail,
      start: stage.delay, end: timeline[index + 2].delay,
    }));
  }
  const checkpoints = checkpointSteps(steps).map(step => future ? step : {
    ...step, messageStart: step.start, taskReveal: step.start + step.stream.duration + 300,
  });
  const toolsEnd = steps.at(-1).end;
  const responseStream = createTextStream([result.assistant].flat().join('\n\n'));
  // Only future runs serialize checkpoint presentation; switching the visual
  // treatment later must not change an existing job's schedule.
  const responseStart = Math.max(toolsEnd + 300, future ? checkpoints.at(-1).taskReveal + 540 : 0);
  const responseEnd = responseStart + responseStream.duration;
  const collapseAt = responseEnd + CHECKPOINT_RESPONSE_HOLD_MS;
  const taskRun = { startedAt: now, title, steps: checkpoints, toolsEnd, responseKind: future ? 'card-expirations' : 'text', responseStream, responseStart, responseEnd, collapseAt, duration: collapseAt + CHECKPOINT_HANDOFF_MS };
  timeline = timeline.filter(stage => stage.delay < toolsEnd);
  if (future) {
    // Deliver the canvas near the end of execution, leaving its entrance time
    // before the final answer starts. This does not finish the response job.
    timeline.push({ delay: toolsEnd - 700, update: { artifactId: result.artifactId, sourceItems: result.sourceItems, artifactReady: true } });
  }
  timeline.push({ delay: toolsEnd, update: { taskPhase: 'streaming' } });
  timeline.push({ delay: responseEnd, update: { taskPhase: 'complete', ...result, ...(!future ? { artifactReady: true } : {}) } });
  const turn = { ...submission, id: crypto.randomUUID(), assistant: '', taskRun, ...timeline[0].update };
  return { chatId, turn, timeline };
}
