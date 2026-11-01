import { loadCurrentWindowGroups } from '../shared/native-group-reader.js';
import { renderGroupList } from '../shared/group-view.js';
import { DEFAULT_GROUP_LAYOUT } from '../shared/ui-defaults.js';

const root = document.querySelector('#groups');
const status = document.querySelector('#status');
async function refresh() {
  try {
    renderGroupList(root, await loadCurrentWindowGroups(browser), { variant: DEFAULT_GROUP_LAYOUT, mode: 'live' });
    status.textContent = '';
  } catch (error) {
    root.replaceChildren();
    status.textContent = `Could not read tab groups: ${error.message}`;
  }
}
refresh();
