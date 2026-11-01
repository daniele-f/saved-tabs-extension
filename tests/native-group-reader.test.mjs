import assert from 'node:assert/strict';
import test from 'node:test';

const moduleUrl = new URL('../shared/native-group-reader.js', import.meta.url);
const nativeGroups = await import(moduleUrl).catch(() => ({}));

function browserApiFixture() {
  const tabsByGroup = new Map([
    [15, [
      { index: 4, title: 'Firefox source' },
      { index: 3, title: 'MDN' },
    ]],
    [16, [{ index: 8, title: 'Other window tab' }]],
    [17, [{ index: 1, title: 'First tab' }]],
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
      id: '17', title: 'Untitled group', color: 'grey', state: 'expanded',
      tabs: [{ title: 'First tab' }],
    },
    {
      id: '15', title: 'Research', color: 'purple', state: 'collapsed',
      tabs: [{ title: 'MDN' }, { title: 'Firefox source' }],
    },
  ]);
});

test('preserves every Firefox native tab-group color for rendering', () => {
  assert.deepEqual(
    ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'].map(nativeGroups.nativeGroupColor),
    ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'],
  );
});
