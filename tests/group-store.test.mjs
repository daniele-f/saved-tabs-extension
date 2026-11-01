import assert from 'node:assert/strict';
import test from 'node:test';

const moduleUrl = new URL('../shared/group-store.js', import.meta.url);
const groupStore = await import(moduleUrl).catch(() => ({}));

const defaults = Array.from({ length: 20 }, (_, index) => ({
  id: `scroll-test-${index + 1}`,
  title: `Scroll test ${String(index + 1).padStart(2, '0')}`,
  color: ['yellow', 'green', 'red', 'blue', 'purple'][index % 5],
  state: index % 2 === 0 ? 'closed' : 'open',
  tabs: [{ title: `Test tab ${index + 1}`, url: `https://example.invalid/scroll-test-${index + 1}` }],
}));

const sampleGroups = [
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

test('seeds twenty groups to exercise scrolling', async () => {
  const store = groupStore.createGroupStore({ storage: memoryStorage(), loadDefaults: async () => defaults });
  const groups = await store.loadGroups();

  assert.equal(groups.length, 20);
  assert.deepEqual(groups.map((group) => group.id), defaults.map((group) => group.id));
});

test('does not carry the previous empty-state data into the scroll test', async () => {
  const store = groupStore.createGroupStore({ storage: memoryStorage({ savedGroups: [] }), loadDefaults: async () => defaults });

  assert.equal((await store.loadGroups()).length, 20);
});

test('falls back to immutable defaults when persisted groups are malformed', async () => {
  const store = groupStore.createGroupStore({ storage: memoryStorage({ scrollbarTestGroups: [{ title: 'Broken' }] }), loadDefaults: async () => defaults });

  assert.deepEqual(await store.loadGroups(), defaults);
});

test('persists a simulated restore without touching anything outside mock storage', async () => {
  const storage = memoryStorage({ scrollbarTestGroups: sampleGroups });
  const store = groupStore.createGroupStore({ storage, loadDefaults: async () => defaults });
  await store.updateGroup('vacatures', { state: 'open' });
  const reloadedStore = groupStore.createGroupStore({ storage, loadDefaults: async () => defaults });

  assert.equal((await reloadedStore.loadGroups()).find((group) => group.id === 'vacatures').state, 'open');
});

test('reorders all groups exactly once', async () => {
  const store = groupStore.createGroupStore({ storage: memoryStorage({ scrollbarTestGroups: sampleGroups }), loadDefaults: async () => defaults });
  const groups = await store.reorderGroups(['development', 'gaming', 'peppol', 'python', 'vacatures']);

  assert.deepEqual(groups.map((group) => group.id), ['development', 'gaming', 'peppol', 'python', 'vacatures']);
});
