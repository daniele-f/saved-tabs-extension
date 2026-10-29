import { extensionGroupStore } from '../shared/group-store.js';
import { bindGroupActions, renderGroupList } from '../shared/group-view.js';
import { messages, sendMessage } from '../shared/messages.js';

export function selectedBookmarkMode(controls) {
  const selected = [...controls].filter((control) => control.checked && ['none', 'individual', 'folder'].includes(control.value));
  if (selected.length !== 1) throw new TypeError('Select exactly one bookmark experiment.');
  return selected[0].value;
}

if (typeof document !== 'undefined') {
  const store = extensionGroupStore();
  const root = document.querySelector('#groups');
  const status = document.querySelector('#status');
  const bookmarkStatus = document.querySelector('#bookmark-status');
  const refresh = async () => renderGroupList(root, await store.loadGroups(), { variant: 'expandable' });
  const announce = (message) => { status.textContent = message; };
  bindGroupActions(root, store, refresh, announce);
  document.querySelector('#reset').addEventListener('click', async () => { await store.resetGroups(); await refresh(); announce('Restored the original mock groups. No bookmark items were changed.'); });
  document.querySelector('#apply-bookmarks').addEventListener('click', async () => {
    try {
      const mode = selectedBookmarkMode(document.querySelectorAll('input[name="bookmark-mode"]'));
      const result = await sendMessage(messages.APPLY_BOOKMARK_MODE, { mode });
      bookmarkStatus.textContent = mode === 'none' ? 'No prototype bookmarks are present.' : `Created ${result.count} tracked prototype items.`;
    } catch (error) { bookmarkStatus.textContent = error.message; }
  });
  document.querySelector('#remove-bookmarks').addEventListener('click', async () => {
    await sendMessage(messages.REMOVE_PROTOTYPE_BOOKMARKS);
    document.querySelector('input[value="none"]').checked = true;
    bookmarkStatus.textContent = 'Cleared tracked prototype bookmark items.';
  });
  document.querySelector('#open-sidebar').addEventListener('click', () => browser.sidebarAction.open());
  sendMessage(messages.GET_BOOKMARK_STATUS).then((stored) => {
    const mode = stored.bookmarkMode ?? 'none';
    document.querySelector(`input[value="${mode}"]`).checked = true;
    bookmarkStatus.textContent = mode === 'none' ? 'No prototype bookmarks are present.' : `${stored.prototypeBookmarks?.length ?? 0} tracked prototype items are present.`;
  });
  refresh();
}
