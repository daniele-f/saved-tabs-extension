import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('ships a single expandable popup layout without a layout picker', async () => {
  const html = await readFile(new URL('../popup/popup.html', import.meta.url), 'utf8');

  assert.equal(html.includes('<select'), false);
  assert.equal(html.includes('Compact list'), false);
  assert.equal(html.includes('Colored chips'), false);
  assert.equal(html.includes('Minimal list'), false);
});
