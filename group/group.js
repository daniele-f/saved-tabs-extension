import { extensionGroupStore } from '../shared/group-store.js';
import { bindGroupActions, renderGroupList } from '../shared/group-view.js';

const store = extensionGroupStore();
const root = document.querySelector('#groups');
const status = document.querySelector('#status');
const id = new URLSearchParams(location.search).get('group');
async function refresh() {
  const group = (await store.loadGroups()).find((entry) => entry.id === id);
  if (!group) {
    document.querySelector('#title').textContent = 'Mock group not found';
    root.replaceChildren();
    status.textContent = 'This link does not identify a current mock group.';
    return;
  }
  document.querySelector('#title').textContent = group.title;
  renderGroupList(root, [group], { variant: 'expandable' });
}
bindGroupActions(root, store, refresh, (message) => { status.textContent = message; });
refresh();
