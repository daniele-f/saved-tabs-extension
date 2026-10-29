import { extensionGroupStore } from '../shared/group-store.js';
import { bindGroupActions, renderGroupList } from '../shared/group-view.js';

const store = extensionGroupStore();
const root = document.querySelector('#groups');
const status = document.querySelector('#status');
const refresh = async () => renderGroupList(root, await store.loadGroups(), { variant: 'expandable' });
const announce = (message) => { status.textContent = message; };
bindGroupActions(root, store, refresh, announce);
document.querySelector('#reset').addEventListener('click', async () => { await store.resetGroups(); await refresh(); announce('Restored the original mock groups.'); });
document.querySelector('#open-sidebar').addEventListener('click', () => browser.sidebarAction.open());
refresh();
