import { loadCurrentWindowGroups } from '../shared/native-group-reader.js';
import { extensionInactiveGroupStore } from '../shared/inactive-group-store.js';
import { closeLiveGroup, restoreInactiveGroup } from '../shared/group-lifecycle.js';
import { confirmSaveAndClose } from '../shared/close-confirmation.js';
import { renderGroupSections } from '../shared/group-view.js';
import { filterGroupsBySearch } from '../shared/group-search.js';
import { DEFAULT_GROUP_LAYOUT } from '../shared/ui-defaults.js';

const root = document.querySelector('#groups');
const status = document.querySelector('#status');
const search = document.querySelector('#search');
const clearSearch = document.querySelector('#clear-search');
const inactiveStore = extensionInactiveGroupStore();

async function closeGroup(group) {
  if (!await confirmSaveAndClose(group)) return;
  try {
    await closeLiveGroup({ browserApi: browser, inactiveStore, group });
    await refresh();
    status.textContent = `Moved tab group “${group.title}” to inactive.`;
  } catch (error) {
    await refresh();
    status.textContent = `Could not close “${group.title}”: ${error.message}`;
  }
}

async function restoreGroup(snapshot) {
  try {
    const { id: windowId } = await browser.windows.getCurrent();
    await restoreInactiveGroup({ browserApi: browser, inactiveStore, snapshot, windowId });
    await refresh();
    status.textContent = `Restored “${snapshot.title}”.`;
  } catch (error) {
    await refresh();
    status.textContent = `Could not restore “${snapshot.title}”: ${error.message}`;
  }
}

async function focusTab(tab) {
  try {
    await browser.tabs.update(tab.id, { active: true });
  } catch (error) {
    status.textContent = `Could not switch to “${tab.title}”: ${error.message}`;
  }
}

async function refresh() {
  try {
    const query = search.value;
    const [activeGroups, inactiveGroups] = await Promise.all([
      loadCurrentWindowGroups(browser),
      inactiveStore.listInactiveGroups(),
    ]);
    renderGroupSections(root, {
      activeGroups: filterGroupsBySearch(activeGroups, query),
      inactiveGroups: filterGroupsBySearch(inactiveGroups, query),
      variant: DEFAULT_GROUP_LAYOUT,
      onClose: closeGroup,
      onRestore: restoreGroup,
      onFocusTab: focusTab,
    });
  } catch (error) {
    root.replaceChildren();
    status.textContent = `Could not read tab groups: ${error.message}`;
  }
}

function updateSearchClearButton() {
  clearSearch.hidden = !search.value;
}

search.addEventListener('input', () => {
  updateSearchClearButton();
  refresh();
});
clearSearch.addEventListener('click', () => {
  search.value = '';
  updateSearchClearButton();
  refresh();
  search.focus();
});
refresh();
