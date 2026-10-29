import { extensionGroupStore } from '../shared/group-store.js';
import { bindGroupActions, renderGroupList } from '../shared/group-view.js';
import { DEFAULT_GROUP_LAYOUT } from '../shared/ui-defaults.js';

const store = extensionGroupStore();
const root = document.querySelector('#groups');
const status = document.querySelector('#status');
async function refresh() { renderGroupList(root, await store.loadGroups(), { variant: DEFAULT_GROUP_LAYOUT }); }
bindGroupActions(root, store, refresh, (message) => { status.textContent = message; });
refresh();
