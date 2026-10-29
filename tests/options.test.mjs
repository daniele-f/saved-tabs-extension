import assert from 'node:assert/strict';
import test from 'node:test';

const moduleUrl = new URL('../options/options.js', import.meta.url);
const options = await import(moduleUrl).catch(() => ({}));

test('returns no bookmark artifacts when the default radio is selected', () => {
  assert.equal(typeof options.selectedBookmarkMode, 'function');
  assert.equal(options.selectedBookmarkMode([{ value: 'none', checked: true }, { value: 'individual', checked: false }, { value: 'folder', checked: false }]), 'none');
});

test('requires exactly one supported bookmark experiment', () => {
  assert.throws(() => options.selectedBookmarkMode([{ value: 'individual', checked: true }, { value: 'folder', checked: true }]), /exactly one/i);
});
