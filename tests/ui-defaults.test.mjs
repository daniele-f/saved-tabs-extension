import assert from 'node:assert/strict';
import test from 'node:test';

const moduleUrl = new URL('../shared/ui-defaults.js', import.meta.url);
const defaults = await import(moduleUrl).catch(() => ({}));

test('uses expandable groups as the shared default presentation', () => {
  assert.equal(defaults.DEFAULT_GROUP_LAYOUT, 'expandable');
});
