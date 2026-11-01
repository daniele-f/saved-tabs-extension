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

test('connects both panels to live groups and inactive snapshots', async () => {
  const [popup, sidebar] = await Promise.all([
    readFile(new URL('../popup/popup.js', import.meta.url), 'utf8'),
    readFile(new URL('../sidebar/sidebar.js', import.meta.url), 'utf8'),
  ]);

  for (const script of [popup, sidebar]) {
    assert.match(script, /native-group-reader/);
    assert.match(script, /inactive-group-store/);
    assert.match(script, /group-lifecycle/);
    assert.match(script, /renderGroupSections/);
  }
  assert.match(sidebar, /storage\.onChanged/);
  assert.doesNotMatch(popup, /tabs\.(remove|create|group)/);
  assert.doesNotMatch(sidebar, /tabs\.(remove|create|group)/);
});
