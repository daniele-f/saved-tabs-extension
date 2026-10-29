import assert from 'node:assert/strict';
import test from 'node:test';

const moduleUrl = new URL('../shared/group-store.js', import.meta.url);
const groupStore = await import(moduleUrl).catch(() => ({}));

const defaults = [
  { id: 'vacatures', title: 'Vacatures', color: 'yellow', state: 'closed', tabs: Array(5).fill({ title: 'Job', url: 'https://example.invalid/jobs' }) },
  { id: 'python', title: 'Python', color: 'green', state: 'closed', tabs: Array(3).fill({ title: 'Python', url: 'https://example.invalid/python' }) },
  { id: 'peppol', title: 'Peppol', color: 'red', state: 'open', tabs: Array(4).fill({ title: 'Peppol', url: 'https://example.invalid/peppol' }) },
  { id: 'gaming', title: 'Gaming', color: 'blue', state: 'closed', tabs: Array(8).fill({ title: 'Gaming', url: 'https://example.invalid/gaming' }) },
  { id: 'development', title: 'Development', color: 'purple', state: 'open', tabs: Array(6).fill({ title: 'Development', url: 'https://example.invalid/development' }) },
];

function memoryStorage(initial = {}) {
  const data = structuredClone(initial);
  return {
    async get(key) { return key in data ? { [key]: structuredClone(data[key]) } : {}; },
    async set(value) { Object.assign(data, structuredClone(value)); },
  };
}

test('creates a store API for local mock groups', () => {
  assert.equal(typeof groupStore.createGroupStore, 'function');
});

test('seeds the five required demonstration groups', async () => {
  const store = groupStore.createGroupStore({ storage: memoryStorage(), loadDefaults: async () => defaults });
  const groups = await store.loadGroups();

  assert.deepEqual(groups.map(({ id, title, color, state, tabs }) => [id, title, color, state, tabs.length]), [
    ['vacatures', 'Vacatures', 'yellow', 'closed', 5],
    ['python', 'Python', 'green', 'closed', 3],
    ['peppol', 'Peppol', 'red', 'open', 4],
    ['gaming', 'Gaming', 'blue', 'closed', 8],
    ['development', 'Development', 'purple', 'open', 6],
  ]);
});

test('falls back to immutable defaults when persisted groups are malformed', async () => {
  const store = groupStore.createGroupStore({ storage: memoryStorage({ mockGroups: [{ title: 'Broken' }] }), loadDefaults: async () => defaults });

  assert.equal((await store.loadGroups())[0].id, 'vacatures');
});

test('persists a simulated restore without touching anything outside mock storage', async () => {
  const storage = memoryStorage();
  const store = groupStore.createGroupStore({ storage, loadDefaults: async () => defaults });
  await store.loadGroups();
  await store.updateGroup('vacatures', { state: 'open' });
  const reloadedStore = groupStore.createGroupStore({ storage, loadDefaults: async () => defaults });

  assert.equal((await reloadedStore.loadGroups()).find((group) => group.id === 'vacatures').state, 'open');
});

test('reorders all groups exactly once', async () => {
  const store = groupStore.createGroupStore({ storage: memoryStorage(), loadDefaults: async () => defaults });
  await store.loadGroups();
  const groups = await store.reorderGroups(['development', 'gaming', 'peppol', 'python', 'vacatures']);

  assert.deepEqual(groups.map((group) => group.id), ['development', 'gaming', 'peppol', 'python', 'vacatures']);
});
