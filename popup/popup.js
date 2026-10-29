import { extensionGroupStore } from '../shared/group-store.js';
import { bindGroupActions, renderGroupList } from '../shared/group-view.js';

const store = extensionGroupStore();
const root = document.querySelector('#groups');
const status = document.querySelector('#status');
const layout = document.querySelector('#layout');
async function refresh() { renderGroupList(root, await store.loadGroups(), { variant: layout.value }); }
bindGroupActions(root, store, refresh, (message) => { status.textContent = message; });
layout.addEventListener('change', refresh);
refresh();
