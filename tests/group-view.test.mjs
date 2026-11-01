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

test('moves a dragged group into the slot before another group', () => {
  assert.deepEqual(groupView.reorderedGroupIds(['vacatures', 'python', 'peppol'], 'peppol', 'vacatures'), ['peppol', 'vacatures', 'python']);
});

test('moves a dragged group into the slot after the final group', () => {
  assert.deepEqual(groupView.reorderedGroupIds(['vacatures', 'python', 'peppol'], 'vacatures', null), ['python', 'peppol', 'vacatures']);
});

test('keeps a group in place when dropped into its current slot', () => {
  assert.deepEqual(groupView.reorderedGroupIds(['vacatures', 'python'], 'python', null), ['vacatures', 'python']);
});

test('builds one validated patch for an edited name and color', () => {
  assert.deepEqual(groupView.buildGroupEditPatch(vacatures, { title: 'Jobs', color: 'purple' }), {
    title: 'Jobs',
    color: 'purple',
  });
});

test('uses read-only capabilities for live Firefox groups', () => {
  assert.deepEqual(groupView.groupCardCapabilities('live'), {
    detailsLabel: 'Show tabs',
    draggable: false,
    showControls: false,
  });
});
