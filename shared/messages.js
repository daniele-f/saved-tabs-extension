export const messages = Object.freeze({
  APPLY_BOOKMARK_MODE: 'apply-bookmark-mode',
  REMOVE_PROTOTYPE_BOOKMARKS: 'remove-prototype-bookmarks',
  GET_BOOKMARK_STATUS: 'get-bookmark-status',
});

export function sendMessage(type, payload = {}) {
  return browser.runtime.sendMessage({ type, ...payload });
}
