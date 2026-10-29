import assert from 'node:assert/strict';
import test from 'node:test';

const moduleUrl = new URL('../shared/group-view.js', import.meta.url);
const groupView = await import(moduleUrl).catch(() => ({}));

const vacatures = { id: 'vacatures', title: 'Vacatures', color: 'yellow', state: 'closed', tabs: [] };

test('builds a restore mutation that only opens mock state', () => {
  assert.equal(typeof groupView.buildGroupMutation, 'function');
  assert.deepEqual(groupView.buildGroupMutation(vacatures, { type: 'restore' }), {
    patch: { state: 'open' },
    notice: 'Simulated restore — no browser tabs changed.',
  });
});

test('builds a save-and-close mutation for an open mock group', () => {
  const group = { ...vacatures, state: 'open' };

  assert.deepEqual(groupView.buildGroupMutation(group, { type: 'save-close' }), {
    patch: { state: 'closed' },
    notice: 'Simulated save and close — no browser tabs changed.',
  });
});

test('rejects an empty mock-group rename', () => {
  assert.throws(() => groupView.buildGroupMutation(vacatures, { type: 'rename', title: '   ' }), /title/i);
});
