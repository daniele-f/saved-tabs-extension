import assert from 'node:assert/strict';
import test from 'node:test';

const moduleUrl = new URL('../shared/inactive-group-store.js', import.meta.url);
const inactiveGroups = await import(moduleUrl).catch(() => ({}));

function memoryStorage(initial = {}) {
  const data = structuredClone(initial);
  return {
    async get(key) { return key in data ? { [key]: structuredClone(data[key]) } : {}; },
    async set(value) { Object.assign(data, structuredClone(value)); },
  };
}

const research = {
  title: 'Research', color: 'purple', collapsed: true,
  tabs: [{ url: 'https://example.com/', title: 'Example' }],
};

test('stores and lists an inactive group snapshot', async () => {
  const store = inactiveGroups.createInactiveGroupStore({
    storage: memoryStorage(), makeId: () => 'saved-1', now: () => '2026-11-01T12:00:00.000Z',
  });

  const saved = await store.saveInactiveGroup(research);

  assert.deepEqual(saved, { id: 'saved-1', closedAt: '2026-11-01T12:00:00.000Z', ...research });
  assert.deepEqual(await store.listInactiveGroups(), [saved]);
});

test('ignores malformed stored snapshots', async () => {
  const store = inactiveGroups.createInactiveGroupStore({
    storage: memoryStorage({ inactiveGroups: [{ id: 'bad', tabs: [] }] }), makeId: () => 'saved-1', now: () => '2026-11-01T12:00:00.000Z',
  });

  assert.deepEqual(await store.listInactiveGroups(), []);
});

test('removes one inactive group snapshot by ID', async () => {
  const storage = memoryStorage();
  const store = inactiveGroups.createInactiveGroupStore({ storage, makeId: () => 'saved-1', now: () => '2026-11-01T12:00:00.000Z' });
  await store.saveInactiveGroup(research);

  await store.removeInactiveGroup('saved-1');

  assert.deepEqual(await store.listInactiveGroups(), []);
});
