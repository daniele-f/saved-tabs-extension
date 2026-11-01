# Close and Restore Groups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Safely close native Firefox groups into restorable inactive snapshots and restore them back into the current browser window.

**Architecture:** A dedicated snapshot store persists extension-owned closed-group records in `browser.storage.local`. A lifecycle module performs close and restore operations against injected Firefox APIs; the existing native reader and renderer combine live current-window groups with persisted inactive snapshots in two visible sections.

**Tech Stack:** Firefox Manifest V3 WebExtensions, vanilla JavaScript modules, `browser.storage.local`, Node’s built-in test runner.

**Spec:** `docs/superpowers/specs/2026-11-01-close-and-restore-groups-design.md`

## Global Constraints

- Add `storage` alongside existing `tabs` and `tabGroups` permissions; do not request host permissions.
- Create snapshots only after a user confirms the group-close action and before closing any tabs.
- Active means a current-window native group; Inactive means an extension-owned snapshot only.
- Restore only into the current browser window and remove a snapshot only after full native restoration succeeds.
- Preserve a snapshot if closing or restoring fails, including when a native `beforeunload` prompt interrupts close.
- Never include private-window groups or create a new group-creation flow.

## Review Focus

- A snapshot must retain the URL/title/order/color/collapsed state required for restore; test in Task 1.
- Existing storage data that is malformed must not crash either panel or be restored; test in Task 1.
- A rejected `tabs.remove` must leave the snapshot available, even if the native group remains active; test in Task 2.
- A restore failure after some tabs are created must retain the snapshot and report the error; test in Task 2.
- Live groups from another Firefox window and arbitrary browser history must never appear in Active or Inactive; test in Tasks 3–4.

---

### Task 1: Inactive-group snapshot store

**Files:**
- Create: `shared/inactive-group-store.js`
- Create: `tests/inactive-group-store.test.mjs`

**Interfaces:**
- Produces: `createInactiveGroupStore({ storage, makeId })`.
- Produces: `listInactiveGroups()`, `saveInactiveGroup(snapshot)`, and `removeInactiveGroup(id)`.
- Snapshot shape: `{ id, title, color, collapsed, tabs: Array<{ url, title }>, closedAt }`.

- [ ] **Step 1: Write failing snapshot-store tests**

```js
const saved = await store.saveInactiveGroup({ title: 'Research', color: 'purple', collapsed: true, tabs: [{ url: 'https://example.com', title: 'Example' }] });
assert.equal((await store.listInactiveGroups())[0].id, 'saved-1');
assert.deepEqual(await malformedStore.listInactiveGroups(), []);
```

- [ ] **Step 2: Run the new test file to verify it fails**

Run: `node --test tests/inactive-group-store.test.mjs`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the snapshot store**

Store all snapshots beneath one extension-owned key, validate every persisted record, generate an ID and ISO `closedAt` at save time, and return immutable clones. Invalid stored data reads as an empty list rather than throwing.

- [ ] **Step 4: Run the snapshot-store tests to verify they pass**

Run: `node --test tests/inactive-group-store.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add shared/inactive-group-store.js tests/inactive-group-store.test.mjs
git commit -m "feat: store inactive group snapshots"
```

### Task 2: Native close and restore lifecycle

**Files:**
- Create: `shared/group-lifecycle.js`
- Create: `tests/group-lifecycle.test.mjs`
- Modify: `shared/native-group-reader.js`
- Modify: `tests/native-group-reader.test.mjs`

**Interfaces:**
- Consumes: live groups with `nativeGroupId`, `windowId`, `collapsed`, and tabs containing `id`, `url`, `title`, and `index`.
- Produces: `closeLiveGroup({ browserApi, inactiveStore, group }) => Promise<Snapshot>`.
- Produces: `restoreInactiveGroup({ browserApi, inactiveStore, snapshot, windowId }) => Promise<void>`.

- [ ] **Step 1: Write failing lifecycle and enriched-reader tests**

Assert that `closeLiveGroup` stores an ordered snapshot before calling `tabs.remove`; a rejected removal keeps that snapshot. Assert that restore creates tabs in stored order, groups their IDs in the supplied window, updates title/color/collapsed state, and deletes the snapshot only on success.

- [ ] **Step 2: Run the relevant tests to verify they fail**

Run: `node --test tests/native-group-reader.test.mjs tests/group-lifecycle.test.mjs`

Expected: FAIL because the lifecycle module and native IDs/URLs are absent.

- [ ] **Step 3: Implement the lifecycle functions and enrich the reader**

Include the native IDs and complete tab restore fields in the reader’s internal live-group objects; renderer code must continue to display only safe title/color/state/count data. On restore, call `tabs.create` for every saved URL, then `tabs.group`, then `tabGroups.update`; leave the snapshot intact if any call rejects.

- [ ] **Step 4: Run the lifecycle tests to verify they pass**

Run: `node --test tests/native-group-reader.test.mjs tests/group-lifecycle.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add shared/group-lifecycle.js shared/native-group-reader.js tests/group-lifecycle.test.mjs tests/native-group-reader.test.mjs
git commit -m "feat: close and restore native tab groups"
```

### Task 3: Active/inactive section renderer

**Files:**
- Modify: `shared/group-view.js`
- Modify: `shared/ui.css`
- Modify: `tests/group-view.test.mjs`

**Interfaces:**
- Consumes: `{ activeGroups: LiveGroup[], inactiveGroups: Snapshot[], onClose(group), onRestore(snapshot) }`.
- Produces: `renderGroupSections(root, options)` with active and inactive headings, group cards, and explicit close/restore controls.

- [ ] **Step 1: Write failing section-capability tests**

Assert that an active card exposes exactly `Close group`, an inactive card exposes exactly `Restore group`, and both retain the shared expandable tab details.

- [ ] **Step 2: Run the renderer tests to verify they fail**

Run: `node --test tests/group-view.test.mjs`

Expected: FAIL because the split-section interface does not exist.

- [ ] **Step 3: Implement `renderGroupSections`**

Render two labelled sections in a stable Active-then-Inactive order. The Active button must carry only the live group ID; the Inactive button must carry only the snapshot ID. Keep no drag, rename, color, or delete control.

- [ ] **Step 4: Run renderer tests to verify they pass**

Run: `node --test tests/group-view.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add shared/group-view.js shared/ui.css tests/group-view.test.mjs
git commit -m "feat: split active and inactive group sections"
```

### Task 4: Panel wiring, confirmations, and storage refresh

**Files:**
- Modify: `manifest.json`
- Modify: `popup/popup.js`
- Modify: `sidebar/sidebar.js`
- Modify: `popup/popup.html`
- Modify: `sidebar/sidebar.html`
- Modify: `README.md`
- Modify: `tests/manifest.test.mjs`
- Modify: `tests/popup-shell.test.mjs`

**Interfaces:**
- Consumes: `createInactiveGroupStore`, `closeLiveGroup`, `restoreInactiveGroup`, and `renderGroupSections`.
- Produces: both panels with confirmed native close/restore actions and live refresh on `storage.onChanged` plus native tab/group events.

- [ ] **Step 1: Write failing manifest and panel-shell tests**

Assert that manifest permissions are `storage`, `tabGroups`, and `tabs`; both panel scripts import the inactive store/lifecycle module; and the live UI copy identifies Active and Inactive sections.

- [ ] **Step 2: Run the full suite to verify it fails**

Run: `npm test`

Expected: FAIL because storage and the new panel action wiring are absent.

- [ ] **Step 3: Wire panels to the lifecycle**

On **Close group**, use `window.confirm` with the exact group title and tab count; on approval call `closeLiveGroup`, then refresh. On **Restore group**, call `restoreInactiveGroup` into the current window, then refresh. Render errors in the existing live region. Sidebar also refreshes when extension storage changes.

- [ ] **Step 4: Run automated verification**

Run: `npm test`

Expected: PASS.

Run: `rg -n "tabs\.(remove|create|group)|tabGroups\.update|storage\.local" shared popup sidebar`

Expected: every write call is confined to `group-lifecycle.js` or the inactive snapshot store; panels only call lifecycle functions.

- [ ] **Step 5: Manually verify in Firefox**

Reload the temporary add-on, create a normal non-private two-tab group, close it through the extension, confirm it enters Inactive, then restore it. Verify title/color/order and that the inactive snapshot disappears only after success. Cancel one close confirmation and verify no change.

- [ ] **Step 6: Commit**

```powershell
git add manifest.json popup sidebar shared README.md tests
git commit -m "feat: close and restore saved tab groups"
```
