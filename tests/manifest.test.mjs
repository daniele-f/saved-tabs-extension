import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('does not ship the removed native-bookmark experiment', async () => {
  const manifest = JSON.parse(await readFile(new URL('../manifest.json', import.meta.url), 'utf8'));

  assert.equal(manifest.permissions.includes('bookmarks'), false);
  assert.equal(manifest.permissions.includes('menus'), false);
  assert.equal('background' in manifest, false);
});
