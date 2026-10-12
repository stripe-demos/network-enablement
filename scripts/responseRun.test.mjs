import test from 'node:test';
import assert from 'node:assert/strict';
import { createResponseRun } from '../src/console/data/responseRun.js';
import { createTextStream, getStreamedText } from '../src/console/data/taskStreaming.js';
import { canCollapseWithoutMovingResponse } from '../src/console/data/collapseVisibility.js';
import { getCheckpointDisclosure } from '../src/console/data/taskCollapse.js';

test('streaming advances through partial words without splitting Unicode characters', () => {
  const stream = createTextStream('Hello 🌎!');
  assert.equal(getStreamedText(stream, 0), '');
  assert.equal(getStreamedText(stream, 15), 'Hel');
  assert.equal(getStreamedText(stream, 35), 'Hello 🌎');
  assert.equal(getStreamedText(stream, stream.duration), stream.text);
});

test('short runs end with consecutive writing and execution steps, with time to inspect both', () => {
  const durations = new Set();
  for (const workCycles of [3, 4, 7]) {
    const { turn, timeline } = createResponseRun('preview', {}, { future: true, now: 0, workCycles });
    const run = turn.taskRun;
    assert.equal(run.steps.length, workCycles);
    assert.ok(run.steps.some(step => step.key === 'query'));
    const [write, execute] = run.steps.slice(-2);
    assert.deepEqual([write.label, execute.label], ['Writing file', 'Running code']);
    assert.equal(execute.message, '');
    assert.equal(execute.start, write.end);
    assert.ok(write.end - write.taskReveal >= 1800);
    assert.ok(execute.end - execute.taskReveal >= 4000);
    assert.ok(write.detail && execute.detail && execute.finding);
    assert.deepEqual(timeline.filter(stage => stage.update.taskPhase === 'preparing').map(stage => stage.delay), [write.start, execute.start]);
    assert.equal(timeline.find(stage => stage.delay === execute.end).update.taskPhase, 'streaming');
    for (let index = 0; index < run.steps.length; index++) {
      const step = run.steps[index];
      assert.ok(step.taskReveal >= step.messageStart + step.stream.duration + (step.message ? 300 : 0));
      if (index) assert.ok(step.messageStart >= run.steps[index - 1].taskReveal + 540);
    }
    assert.ok(run.responseStart >= run.steps.at(-1).taskReveal + 540);
    assert.ok(run.collapseAt > run.responseEnd);
    assert.ok(run.duration < 25000);
    assert.equal(timeline.at(-1).delay, run.responseEnd);
    assert.equal(timeline.at(-1).update.taskPhase, 'complete');
    assert.equal(timeline.at(-1).update.artifactId, 'chart');
    const delivery = timeline.filter(stage => stage.update.artifactReady);
    assert.equal(delivery.length, 1, 'canvas is delivered once, not reopened when text finishes');
    assert.equal(delivery[0].delay, execute.end - 700);
    assert.ok(delivery[0].delay > execute.taskReveal);
    assert.ok(delivery[0].delay < run.responseStart);
    assert.equal(delivery[0].update.assistant, undefined);
    assert.equal(delivery[0].update.taskPhase, undefined, 'delivery leaves Running code active');
    durations.add(run.duration);
  }
  assert.equal(durations.size, 3);
});

test('current task mode also streams before publishing final artifacts', () => {
  const { turn, timeline } = createResponseRun('suspicious-refunds', {}, {
    now: 0, taskOptions: { analysisCallCount: 4, chartCallCount: 3 },
  });
  const run = turn.taskRun;
  assert.equal(turn.assistant, '');
  assert.equal(timeline.at(-2).update.taskPhase, 'streaming');
  assert.ok(timeline.at(-2).delay < run.responseEnd);
  assert.equal(timeline.at(-1).update.artifactId, 'experiment-refund-chart');
  assert.equal(timeline.at(-1).update.artifactReady, true);
  assert.ok(getStreamedText(run.responseStream, 100).length < run.responseStream.text.length);
});

test('collapse only removes height that scrolling can absorb', () => {
  assert.equal(canCollapseWithoutMovingResponse({ scrollTop: 0, collapseHeight: 300 }), false);
  assert.equal(canCollapseWithoutMovingResponse({ scrollTop: 299, collapseHeight: 300 }), false);
  assert.equal(canCollapseWithoutMovingResponse({ scrollTop: 300, collapseHeight: 300 }), true);
  assert.equal(canCollapseWithoutMovingResponse({ scrollTop: 700, collapseHeight: 300 }), true);
});

test('withheld collapse and manual disclosure retain stable geometry', () => {
  const options = { anchored: true, autoCollapse: false };
  assert.deepEqual(getCheckpointDisclosure(4999, 5000, options), getCheckpointDisclosure(6000, 5000, options));
  const manual = getCheckpointDisclosure(5100, 5000, { anchored: true, completedExpanded: true });
  assert.equal(manual.expanded, true);
  assert.equal(manual.fold.phase, 'settled');
});
