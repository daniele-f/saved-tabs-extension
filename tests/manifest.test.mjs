import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('uses Firefox MV3 background scripts instead of a disabled service worker', async () => {
  const manifest = JSON.parse(await readFile(new URL('../manifest.json', import.meta.url), 'utf8'));

  assert.deepEqual(manifest.background.scripts, ['background/service-worker.js']);
  assert.equal(manifest.background.persistent, false);
  assert.equal('service_worker' in manifest.background, false);
});
