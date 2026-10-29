import { extensionGroupStore } from '../shared/group-store.js';
import { bindGroupActions, renderGroupList } from '../shared/group-view.js';
import { DEFAULT_GROUP_LAYOUT } from '../shared/ui-defaults.js';

const store = extensionGroupStore();
const root = document.querySelector('#groups');
const status = document.querySelector('#status');
const search = document.querySelector('#search');
async function refresh() {
  const query = search.value.trim().toLocaleLowerCase();
  const groups = (await store.loadGroups()).filter((group) => group.title.toLocaleLowerCase().includes(query));
  renderGroupList(root, groups, { variant: DEFAULT_GROUP_LAYOUT });
}
bindGroupActions(root, store, refresh, (message) => { status.textContent = message; });
search.addEventListener('input', refresh);
refresh();
