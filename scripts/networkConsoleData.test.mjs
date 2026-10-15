import test from 'node:test';
import assert from 'node:assert/strict';
import { NETWORK_MATCHES, RECOMMENDED_MATCHES, answerKind, JOIN_OPTIONS, isNetworkPrompt } from '../src/console/data/networkOnboarding.js';
import { NETWORK_CANDIDATES } from '../src/dashboard/pages/network/networkCandidates.js';

// Console keeps its own copy of the network content; the ids must match the
// Dashboard's so a result handed back marks the right accounts as invited.
test('Console network matches are Dashboard candidates with the same names', () => {
  const byId = new Map(NETWORK_CANDIDATES.map(candidate => [candidate.id, candidate]));
  for (const match of NETWORK_MATCHES) {
    const candidate = byId.get(match.id);
    assert.ok(candidate, `${match.name} (${match.id}) is not a Dashboard candidate`);
    assert.equal(match.name, candidate.name);
    assert.ok(!candidate.usesSimilarPlatform, `${match.name} uses a similar platform and is never suggested`);
  }
  assert.equal(RECOMMENDED_MATCHES.length, 4);
});

test('network prompts start the conversation; unrelated prompts do not', () => {
  // The Dashboard's handoff prompt (NETWORK_CONSOLE_PROMPT in openNetworkOnboarding.js).
  assert.ok(isNetworkPrompt('Help me find my first connected accounts on the Stripe network'));
  assert.ok(isNetworkPrompt('invite connected accounts'));
  for (const prompt of ['Find revenue opportunities I might be missing', 'Why are payments failing?', '']) {
    assert.equal(isNetworkPrompt(prompt), false, prompt);
  }
});

test('typed answers to the join question', () => {
  assert.equal(answerKind(JOIN_OPTIONS.agree, JOIN_OPTIONS), 'agree');
  assert.equal(answerKind('yes, join', JOIN_OPTIONS), 'agree');
  assert.equal(answerKind('not now', JOIN_OPTIONS), 'decline');
  assert.equal(answerKind('what do I share?', JOIN_OPTIONS), 'terms');
  assert.equal(answerKind('hmm', JOIN_OPTIONS), null);
});
