import { loadCurrentWindowGroups, subscribeToCurrentWindowGroupChanges } from '../shared/native-group-reader.js';
import { renderGroupList } from '../shared/group-view.js';
import { DEFAULT_GROUP_LAYOUT } from '../shared/ui-defaults.js';

const root = document.querySelector('#groups');
const status = document.querySelector('#status');
const search = document.querySelector('#search');
async function refresh() {
  try {
    const query = search.value.trim().toLocaleLowerCase();
    const groups = (await loadCurrentWindowGroups(browser)).filter((group) => group.title.toLocaleLowerCase().includes(query));
    renderGroupList(root, groups, { variant: DEFAULT_GROUP_LAYOUT, mode: 'live' });
    status.textContent = '';
  } catch (error) {
    root.replaceChildren();
    status.textContent = `Could not read tab groups: ${error.message}`;
  }
}
search.addEventListener('input', refresh);
refresh();
subscribeToCurrentWindowGroupChanges(browser, refresh);
