import { extensionGroupStore } from '../shared/group-store.js';
import { messages } from '../shared/messages.js';
import { MARKER, buildBookmarkPlan, removeTrackedNodes } from './bookmark-manager.js';

const PROVENANCE_KEY = 'prototypeBookmarks';
const MODE_KEY = 'bookmarkMode';

async function getProvenance() {
  return (await browser.storage.local.get(PROVENANCE_KEY))[PROVENANCE_KEY] ?? [];
}

async function toolbarFolderId() {
  const tree = await browser.bookmarks.getTree();
  const toolbar = tree[0]?.children?.find((node) => node.id === 'toolbar_____');
  if (!toolbar) throw new Error('Firefox bookmarks toolbar was not found. No prototype bookmarks were created.');
  return toolbar.id;
}

async function applyBookmarkMode(mode) {
  if (!['none', 'individual', 'folder'].includes(mode)) throw new TypeError('Unsupported bookmark experiment.');
  await removeTrackedNodes(browser.bookmarks, await getProvenance());
  const provenance = [];
  if (mode !== 'none') {
    const groups = await extensionGroupStore().loadGroups();
    const plan = buildBookmarkPlan(mode, groups, browser.runtime.getURL('group/group.html'));
    const parents = new Map([['toolbar', await toolbarFolderId()]]);
    for (const item of plan) {
      const node = await browser.bookmarks.create({ parentId: parents.get(item.parentKey), title: item.title, ...(item.kind === 'bookmark' ? { url: item.url } : {}) });
      parents.set(item.key, node.id);
      provenance.push({ id: node.id, marker: MARKER, mode, parentId: node.parentId, title: node.title });
    }
  }
  await browser.storage.local.set({ [PROVENANCE_KEY]: provenance, [MODE_KEY]: mode });
  return { mode, count: provenance.length };
}

async function removePrototypeBookmarks() {
  await removeTrackedNodes(browser.bookmarks, await getProvenance());
  await browser.storage.local.set({ [PROVENANCE_KEY]: [], [MODE_KEY]: 'none' });
  return { mode: 'none', count: 0 };
}

browser.runtime.onMessage.addListener((message) => {
  if (message.type === messages.APPLY_BOOKMARK_MODE) return applyBookmarkMode(message.mode);
  if (message.type === messages.REMOVE_PROTOTYPE_BOOKMARKS) return removePrototypeBookmarks();
  if (message.type === messages.GET_BOOKMARK_STATUS) return browser.storage.local.get([MODE_KEY, PROVENANCE_KEY]);
  return undefined;
});

browser.menus.create({ id: 'open-playground', title: 'Open Saved Tab Groups UX Playground', contexts: ['action'] });
browser.menus.create({ id: 'bookmark-playground', title: 'Saved Tab Groups UX Playground', contexts: ['bookmark'] });
browser.menus.onClicked.addListener((info) => {
  if (info.menuItemId === 'open-playground' || info.menuItemId === 'bookmark-playground') browser.runtime.openOptionsPage();
});
