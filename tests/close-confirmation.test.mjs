import assert from 'node:assert/strict';
import test from 'node:test';

const moduleUrl = new URL('../shared/close-confirmation.js', import.meta.url);
const { closeConfirmationContent } = await import(moduleUrl).catch(() => ({}));

test('writes a clear close-and-save confirmation', () => {
  assert.deepEqual(closeConfirmationContent({ title: 'builder', tabs: [{}, {}, {}] }), {
    title: 'Save and close “builder”?',
    detail: '3 tabs will be closed. The group will remain available under Inactive groups.',
  });
});
