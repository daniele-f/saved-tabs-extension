import { loadCurrentWindowGroups, subscribeToCurrentWindowGroupChanges } from '../shared/native-group-reader.js';
import { extensionInactiveGroupStore } from '../shared/inactive-group-store.js';
import { closeLiveGroup, restoreInactiveGroup } from '../shared/group-lifecycle.js';
import { renderGroupSections } from '../shared/group-view.js';
import { DEFAULT_GROUP_LAYOUT } from '../shared/ui-defaults.js';

const root = document.querySelector('#groups');
const status = document.querySelector('#status');
const search = document.querySelector('#search');
const inactiveStore = extensionInactiveGroupStore();
const closeMessage = (group) => `Close group “${group.title}”? This closes ${group.tabs.length} tabs and keeps a restorable copy.`;

async function closeGroup(group) {
  if (!window.confirm(closeMessage(group))) return;
  try {
    await closeLiveGroup({ browserApi: browser, inactiveStore, group });
    await refresh();
    status.textContent = `Closed “${group.title}” and saved it as inactive.`;
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

async function refresh() {
  try {
    const query = search.value.trim().toLocaleLowerCase();
    const [activeGroups, inactiveGroups] = await Promise.all([
      loadCurrentWindowGroups(browser),
      inactiveStore.listInactiveGroups(),
    ]);
    renderGroupSections(root, {
      activeGroups: activeGroups.filter((group) => group.title.toLocaleLowerCase().includes(query)),
      inactiveGroups: inactiveGroups.filter((group) => group.title.toLocaleLowerCase().includes(query)),
      variant: DEFAULT_GROUP_LAYOUT,
      onClose: closeGroup,
      onRestore: restoreGroup,
    });
    status.textContent = '';
  } catch (error) {
    root.replaceChildren();
    status.textContent = `Could not read tab groups: ${error.message}`;
  }
}
search.addEventListener('input', refresh);
refresh();
subscribeToCurrentWindowGroupChanges(browser, refresh);
browser.storage.onChanged.addListener((_changes, areaName) => { if (areaName === 'local') refresh(); });
