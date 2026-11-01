import assert from 'node:assert/strict';
import test from 'node:test';

const moduleUrl = new URL('../shared/group-lifecycle.js', import.meta.url);
const lifecycle = await import(moduleUrl).catch(() => ({}));

const liveGroup = {
  nativeGroupId: 9, windowId: 4, title: 'Research', color: 'purple', collapsed: true,
  tabs: [
    { id: 91, url: 'https://one.example/', title: 'One' },
    { id: 92, url: 'https://two.example/', title: 'Two' },
  ],
};

test('saves a group snapshot before closing its native tabs', async () => {
  const calls = [];
  const inactiveStore = { saveInactiveGroup: async (snapshot) => { calls.push(['save', snapshot]); return { id: 'saved-1', ...snapshot }; } };
  const browserApi = { tabs: { remove: async (ids) => { calls.push(['remove', ids]); } } };

  await lifecycle.closeLiveGroup({ browserApi, inactiveStore, group: liveGroup });

  assert.deepEqual(calls, [
    ['save', { title: 'Research', color: 'purple', collapsed: true, tabs: [{ url: 'https://one.example/', title: 'One' }, { url: 'https://two.example/', title: 'Two' }] }],
    ['remove', [91, 92]],
  ]);
});

test('keeps the saved snapshot when Firefox rejects a close', async () => {
  let saved = false;
  const inactiveStore = { saveInactiveGroup: async (snapshot) => { saved = true; return { id: 'saved-1', ...snapshot }; } };
  const browserApi = { tabs: { remove: async () => { throw new Error('beforeunload cancelled'); } } };

  await assert.rejects(lifecycle.closeLiveGroup({ browserApi, inactiveStore, group: liveGroup }), /beforeunload/);

  assert.equal(saved, true);
});

test('restores all tabs, groups them, reapplies metadata, then removes the snapshot', async () => {
  const calls = [];
  const snapshot = { id: 'saved-1', title: 'Research', color: 'purple', collapsed: true, tabs: [{ url: 'https://one.example/', title: 'One' }, { url: 'https://two.example/', title: 'Two' }] };
  const inactiveStore = { removeInactiveGroup: async (id) => { calls.push(['removeSnapshot', id]); } };
  let nextTabId = 100;
  const browserApi = {
    tabs: {
      create: async (options) => { calls.push(['create', options]); return { id: nextTabId += 1 }; },
      group: async (options) => { calls.push(['group', options]); return 77; },
    },
    tabGroups: { update: async (id, options) => { calls.push(['update', id, options]); } },
  };

  await lifecycle.restoreInactiveGroup({ browserApi, inactiveStore, snapshot, windowId: 4 });

  assert.deepEqual(calls, [
    ['create', { url: 'https://one.example/', windowId: 4, active: false }],
    ['create', { url: 'https://two.example/', windowId: 4, active: false }],
    ['group', { tabIds: [101, 102], createProperties: { windowId: 4 } }],
    ['update', 77, { title: 'Research', color: 'purple', collapsed: true }],
    ['removeSnapshot', 'saved-1'],
  ]);
});

test('keeps the snapshot when restore fails after creating tabs', async () => {
  const snapshot = { id: 'saved-1', title: 'Research', color: 'purple', collapsed: true, tabs: [{ url: 'https://one.example/', title: 'One' }] };
  let removed = false;
  const inactiveStore = { removeInactiveGroup: async () => { removed = true; } };
  const browserApi = {
    tabs: { create: async () => ({ id: 101 }), group: async () => { throw new Error('grouping failed'); } },
    tabGroups: { update: async () => {} },
  };

  await assert.rejects(lifecycle.restoreInactiveGroup({ browserApi, inactiveStore, snapshot, windowId: 4 }), /grouping failed/);

  assert.equal(removed, false);
});
