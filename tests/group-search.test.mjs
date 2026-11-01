import assert from 'node:assert/strict';
import test from 'node:test';

const moduleUrl = new URL('../shared/group-search.js', import.meta.url);
const { filterGroupsBySearch } = await import(moduleUrl).catch(() => ({}));

const groups = [{
  id: '1',
  title: 'Research',
  tabs: [
    { id: 1, title: 'Mozilla support' },
    { id: 2, title: 'Cats' },
    { id: 3, title: 'MDN tab groups', url: 'https://github.com/mozilla' },
  ],
}];

test('searching tab titles expands the group and hides non-matches behind show more', () => {
  assert.deepEqual(filterGroupsBySearch(groups, 'mdn'), [{
    ...groups[0],
    visibleTabs: [{ id: 3, title: 'MDN tab groups', url: 'https://github.com/mozilla' }],
    hiddenTabs: [{ id: 1, title: 'Mozilla support' }, { id: 2, title: 'Cats' }],
    forceExpanded: true,
  }]);
});

test('searching a group name keeps all of its tabs visible', () => {
  assert.deepEqual(filterGroupsBySearch(groups, 'research'), [{
    ...groups[0],
    visibleTabs: groups[0].tabs,
    hiddenTabs: [],
    forceExpanded: true,
  }]);
});

test('searching a tab URL finds the tab even when its title does not match', () => {
  assert.deepEqual(filterGroupsBySearch(groups, 'github'), [{
    ...groups[0],
    visibleTabs: [{ id: 3, title: 'MDN tab groups', url: 'https://github.com/mozilla' }],
    hiddenTabs: [{ id: 1, title: 'Mozilla support' }, { id: 2, title: 'Cats' }],
    forceExpanded: true,
  }]);
});

test('an empty search leaves groups unmodified', () => {
  assert.equal(filterGroupsBySearch(groups, ''), groups);
});
