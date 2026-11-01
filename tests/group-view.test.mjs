import assert from 'node:assert/strict';
import test from 'node:test';

const moduleUrl = new URL('../shared/group-view.js', import.meta.url);
const groupView = await import(moduleUrl).catch(() => ({}));

test('uses one close action for active Firefox groups', () => {
  assert.deepEqual(groupView.groupCardCapabilities('active'), {
    actionLabel: 'Save & Hide',
    detailsLabel: 'Show tabs',
  });
});

test('uses one restore action for inactive group snapshots', () => {
  assert.deepEqual(groupView.groupCardCapabilities('inactive'), {
    actionLabel: 'Restore',
    detailsLabel: 'Show tabs',
  });
});

test('reduces a tab URL to the compact host shown beneath its title', () => {
  assert.equal(groupView.tabHostLabel({ url: 'https://www.example.com/path?source=panel' }), 'www.example.com');
  assert.equal(groupView.tabHostLabel({ url: 'about:preferences' }), 'about:preferences');
  assert.equal(groupView.tabHostLabel({}), '');
});

test('uses the web fallback icon only when a tab has no favicon', () => {
  assert.equal(groupView.tabIconKind({ favIconUrl: 'https://example.com/favicon.ico' }), 'favicon');
  assert.equal(groupView.tabIconKind({}), 'web-fallback');
});

test('toggles the expanded state for a group card', () => {
  assert.equal(groupView.nextExpandedState(false), true);
  assert.equal(groupView.nextExpandedState(true), false);
});

test('only active-group tab rows can focus a Firefox tab', () => {
  assert.deepEqual(groupView.groupTabCapabilities('active'), { canFocus: true });
  assert.deepEqual(groupView.groupTabCapabilities('inactive'), { canFocus: false });
});

test('rejects unknown group-card sections', () => {
  assert.throws(() => groupView.groupCardCapabilities('unknown'), /active or inactive/i);
});
