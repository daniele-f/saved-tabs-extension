import { extensionGroupStore } from '../shared/group-store.js';
import { bindGroupActions, renderGroupList } from '../shared/group-view.js';
import { DEFAULT_GROUP_LAYOUT } from '../shared/ui-defaults.js';

const store = extensionGroupStore();
const root = document.querySelector('#groups');
const status = document.querySelector('#status');
const layout = document.querySelector('#layout');
layout.value = DEFAULT_GROUP_LAYOUT;
async function refresh() { renderGroupList(root, await store.loadGroups(), { variant: layout.value }); }
bindGroupActions(root, store, refresh, (message) => { status.textContent = message; });
layout.addEventListener('change', refresh);
refresh();
