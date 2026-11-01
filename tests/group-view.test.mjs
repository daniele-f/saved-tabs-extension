import assert from 'node:assert/strict';
import test from 'node:test';

const moduleUrl = new URL('../shared/group-view.js', import.meta.url);
const groupView = await import(moduleUrl).catch(() => ({}));

test('uses read-only capabilities for live Firefox groups', () => {
  assert.deepEqual(groupView.groupCardCapabilities('live'), {
    detailsLabel: 'Show tabs',
    draggable: false,
    showControls: false,
  });
});

test('rejects the removed mock-card mode', () => {
  assert.throws(() => groupView.groupCardCapabilities('mock'), /live Firefox/i);
});
