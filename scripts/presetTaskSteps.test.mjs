import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRESET_TASK_STEPS } from '../src/console/data/presetTaskSteps.js';

// Guard the adapter boundary: every original tool/SQL preview must belong to
// exactly one step, including templates that aren't currently in the sidebar.
for (const name of ['RichConversation', 'SimpleConversation', 'SuspiciousRefundsConversation', 'ChatPatternsConversation', 'InteractiveCanvasConversation']) {
  const source = readFileSync(new URL(`../src/console/components/Conversation/${name}.jsx`, import.meta.url), 'utf8');
  for (const [, id, body] of source.matchAll(/<TaskPresentation preset="([^"]+)"([\s\S]*?)<\/TaskPresentation>/g)) {
    test(`${id}: every existing tool is assigned once and retains progress, context, and outcome`, () => {
      const labels = [
        ...Array.from(body.matchAll(/className="code-inline">([^<]+)</g), match => match[1]),
        ...Array.from(body.matchAll(/className="code-header">\s*<span>([^<]+)</g), match => match[1]),
      ];
      const steps = PRESET_TASK_STEPS[id];
      assert.ok(steps?.length);
      for (const label of labels) assert.equal(steps.filter(step => step.calls.includes(label)).length, 1, label);
      for (const step of steps) {
        for (const label of step.calls) assert.ok(labels.includes(label), label);
        assert.ok(step.message && step.detail && step.outcome && step.duration > 0);
      }
    });
  }
}
