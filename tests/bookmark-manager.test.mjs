import assert from 'node:assert/strict';
import test from 'node:test';

const moduleUrl = new URL('../background/bookmark-manager.js', import.meta.url);
const bookmarks = await import(moduleUrl).catch(() => ({}));
const groups = [
  { id: 'vacatures', title: 'Vacatures', tabs: [{ title: 'Job alerts', url: 'https://example.invalid/jobs' }] },
  { id: 'python', title: 'Python', tabs: [{ title: 'Docs', url: 'https://example.invalid/python' }] },
];

test('builds individual prototype bookmarks that only link to extension detail pages', () => {
  assert.equal(typeof bookmarks.buildBookmarkPlan, 'function');
  const plan = bookmarks.buildBookmarkPlan('individual', groups, 'moz-extension://demo/group/group.html');

  assert.deepEqual(plan.map((item) => item.title), ['[STG Demo] Vacatures', '[STG Demo] Python']);
  assert.ok(plan.every((item) => item.url.startsWith('moz-extension://demo/group/group.html?group=')));
  assert.ok(plan.every((item) => !item.url.includes('example.invalid')));
});

test('builds a folder plan with direct links and group subfolders', () => {
  const plan = bookmarks.buildBookmarkPlan('folder', groups, 'moz-extension://demo/group/group.html');

  assert.deepEqual(plan.map((item) => item.title), ['[STG Demo] Saved groups', 'Direct group links', '[STG Demo] Vacatures', '[STG Demo] Python', 'Groups with tabs', 'Vacatures', 'Job alerts', 'Python', 'Docs']);
  assert.equal(plan[5].kind, 'folder');
  assert.ok(plan[6].url.includes('group=vacatures&tab=0'));
});

test('never considers a similarly named user bookmark to be prototype-owned', () => {
  assert.equal(bookmarks.isOwnedPrototypeNode({ id: 'user-1', title: '[STG Demo] Vacatures' }, [{ id: 'prototype-1', marker: 'stg-demo-v1' }]), false);
});

test('reconciles stale prototype IDs without deleting user nodes', async () => {
  const removed = [];
  const api = {
    async get(id) { if (id === 'gone') throw new Error('missing'); return [{ id, title: '[STG Demo] Vacatures' }]; },
    async removeTree(id) { removed.push(id); },
  };
  const tracked = [{ id: 'gone', marker: 'stg-demo-v1' }, { id: 'kept', marker: 'stg-demo-v1' }, { id: 'user-1' }];
  const result = await bookmarks.removeTrackedNodes(api, tracked);

  assert.deepEqual(removed, ['kept']);
  assert.deepEqual(result, []);
});
