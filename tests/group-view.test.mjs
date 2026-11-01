import assert from 'node:assert/strict';
import test from 'node:test';

const moduleUrl = new URL('../shared/group-view.js', import.meta.url);
const groupView = await import(moduleUrl).catch(() => ({}));

test('uses one close action for active Firefox groups', () => {
  assert.deepEqual(groupView.groupCardCapabilities('active'), {
    actionLabel: 'Close group',
    detailsLabel: 'Show tabs',
  });
});

test('uses one restore action for inactive group snapshots', () => {
  assert.deepEqual(groupView.groupCardCapabilities('inactive'), {
    actionLabel: 'Restore group',
    detailsLabel: 'Show tabs',
  });
});

test('rejects unknown group-card sections', () => {
  assert.throws(() => groupView.groupCardCapabilities('unknown'), /active or inactive/i);
});
