import assert from 'node:assert/strict';
import test from 'node:test';

const moduleUrl = new URL('../shared/native-group-reader.js', import.meta.url);
const nativeGroups = await import(moduleUrl).catch(() => ({}));

function browserApiFixture() {
  const tabsByGroup = new Map([
    [15, [
      { id: 151, index: 4, title: 'Firefox source', url: 'https://firefox-source.example/' },
      { id: 150, index: 3, title: 'MDN', url: 'https://developer.mozilla.org/' },
    ]],
    [16, [{ id: 160, index: 8, title: 'Other window tab', url: 'https://other.example/' }]],
    [17, [{ id: 170, index: 1, title: 'First tab', url: 'https://first.example/' }]],
  ]);
  return {
    windows: { getCurrent: async () => ({ id: 1 }) },
    tabGroups: {
      query: async () => [
        { id: 15, windowId: 1, title: 'Research', color: 'purple', collapsed: true },
        { id: 16, windowId: 2, title: 'Other window', color: 'red', collapsed: false },
        { id: 17, windowId: 1, title: '', color: 'grey', collapsed: false },
      ],
    },
    tabs: { query: async ({ groupId }) => tabsByGroup.get(groupId) },
  };
}

test('reads only current-window groups with ordered native tabs', async () => {
  const groups = await nativeGroups.loadCurrentWindowGroups(browserApiFixture());

  assert.deepEqual(groups, [
    {
      id: '17', nativeGroupId: 17, windowId: 1, title: 'Untitled group', color: 'grey', collapsed: false, state: 'expanded',
      tabs: [{ id: 170, title: 'First tab', url: 'https://first.example/' }],
    },
    {
      id: '15', nativeGroupId: 15, windowId: 1, title: 'Research', color: 'purple', collapsed: true, state: 'collapsed',
      tabs: [{ id: 150, title: 'MDN', url: 'https://developer.mozilla.org/' }, { id: 151, title: 'Firefox source', url: 'https://firefox-source.example/' }],
    },
  ]);
});

test('preserves every Firefox native tab-group color for rendering', () => {
  assert.deepEqual(
    ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'].map(nativeGroups.nativeGroupColor),
    ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'],
  );
});

function browserEvent() {
  const listeners = new Set();
  return {
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); },
    emit() { listeners.forEach((listener) => listener()); },
  };
}

test('coalesces native group and tab events into one refresh', async () => {
  const events = Array.from({ length: 8 }, browserEvent);
  const browserApi = {
    tabGroups: { onCreated: events[0], onMoved: events[1], onRemoved: events[2], onUpdated: events[3] },
    tabs: { onCreated: events[4], onMoved: events[5], onRemoved: events[6], onUpdated: events[7] },
  };
  let refreshes = 0;
  const unsubscribe = nativeGroups.subscribeToCurrentWindowGroupChanges(browserApi, () => { refreshes += 1; });

  events[0].emit();
  events[7].emit();
  await new Promise((resolve) => queueMicrotask(resolve));
  unsubscribe();
  events[3].emit();

  assert.equal(refreshes, 1);
});
