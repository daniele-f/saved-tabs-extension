# Saved Tab Groups UX Playground Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a temporary-installable Firefox MV3 extension that safely compares mock saved-tab-group interfaces without interacting with real tabs or native groups.

**Architecture:** A shared mock-group store seeds and persists data from local JSON through `browser.storage.local`; all extension pages use a shared renderer/action layer. The MV3 service worker owns only prototype-bookmark lifecycle and inter-page messages. Popup, sidebar, options, and safe group-detail pages are independent HTML surfaces sharing the same state.

**Tech Stack:** Firefox Desktop Manifest V3, vanilla HTML/CSS/JavaScript, `browser.storage`, `browser.bookmarks`, `browser.menus`, Node built-in test runner.

**Spec:** `docs/2026-10-29-saved-tab-groups-ux-playground-design.md`

## Global Constraints

- Target the user's current Firefox Desktop release; validate through `about:debugging`.
- Use only supported Firefox APIs and no third-party dependencies or backend.
- Never import or invoke `tabs`, `tabGroups`, `sessions`, or an API that opens/closes/groups browser tabs.
- All group/tab records come from `data/default-groups.json`; sample tab URLs are display-only and never navigated to.
- Declare popup and sidebar as always available; `action.default_area` is `personaltoolbar` only as the initial Firefox-controlled placement.
- Bookmark experiments are opt-in, mutually exclusive, clearly marked `[STG Demo]`, provenance-tracked, and never created automatically.
- Cleanup acts only on IDs/provenance created by this extension and tolerates manually deleted or moved nodes.

## Review Focus

- A malformed or stale stored group record must fall back to immutable defaults rather than crashing an extension surface; test in Task 1.
- A missing or manually deleted tracked bookmark must be skipped during removal and purged from local tracking; test in Task 3.
- Switching bookmark modes must never remove a similarly named user bookmark; test in Task 3 with a non-prototype ID.
- Every mock state mutation must persist across popup/sidebar reloads and reset only on explicit reset; test in Task 2.
- No generated bookmark may contain a sample website URL; test in Task 3 by asserting every generated URL begins with the extension detail-page path.

---

## File structure

- `manifest.json`: MV3 extension metadata, permissions, action, sidebar, options, service worker.
- `data/default-groups.json`: immutable seed group records and sample display-only tabs.
- `shared/group-store.js`: validation, storage seed/reset, and mock mutations.
- `shared/group-view.js`: common DOM rendering and simulated group action bindings.
- `shared/messages.js`: message names and `browser.runtime.sendMessage` wrapper.
- `background/service-worker.js`: message routing, bookmark lifecycle, action/bookmark context menus.
- `background/bookmark-manager.js`: pure bookmark plan/provenance/reconciliation functions.
- `popup/*`, `sidebar/*`, `options/*`, `group/*`: four extension-owned UI surfaces.
- `icons/saved-groups.svg`: scalable action icon.
- `tests/group-store.test.mjs`, `tests/bookmark-manager.test.mjs`: Node unit tests for logic without Firefox.
- `README.md`: installation, switching, safety, cleanup, and feasibility matrix.

### Task 1: Extension manifest and resilient mock store

**Files:**
- Create: `manifest.json`
- Create: `data/default-groups.json`
- Create: `shared/group-store.js`
- Create: `shared/messages.js`
- Create: `icons/saved-groups.svg`
- Create: `tests/group-store.test.mjs`

**Interfaces:**
- Produces: `loadGroups() -> Promise<Group[]>`, `resetGroups() -> Promise<Group[]>`, `updateGroup(id, patch) -> Promise<Group[]>`, `reorderGroups(ids) -> Promise<Group[]>`.
- Produces: `Group = { id, title, color, state: 'open'|'closed', tabs: Array<{title,url}> }`.

- [ ] **Step 1: Write failing group-store tests**

Test `loadGroups` seeds the five named defaults, corrupted storage returns defaults, `updateGroup('vacatures', {state:'open'})` persists only mock state, and `reorderGroups` preserves all IDs exactly once.

- [ ] **Step 2: Run the group-store test to verify it fails**

Run: `node --test tests/group-store.test.mjs`

Expected: FAIL because `shared/group-store.js` does not exist.

- [ ] **Step 3: Implement the immutable seed data and store functions**

Create `data/default-groups.json` with the five specified groups and display-only sample tabs. Implement the exported functions in `shared/group-store.js` against an injected storage adapter so Node tests can use an in-memory adapter and extension pages can use `browser.storage.local`.

- [ ] **Step 4: Create the minimal MV3 manifest and icon**

Declare `manifest_version: 3`, an action with `default_popup: 'popup/popup.html'` and `default_area: 'personaltoolbar'`, `sidebar_action`, `options_ui`, a module service worker, and only `storage`, `bookmarks`, and `menus` permissions. Do not declare tab-related permissions. Add a simple local SVG icon.

- [ ] **Step 5: Run the group-store test to verify it passes**

Run: `node --test tests/group-store.test.mjs`

Expected: PASS.

### Task 2: Shared simulated group UI plus popup and sidebar

**Files:**
- Create: `shared/group-view.js`
- Create: `shared/ui.css`
- Create: `popup/popup.html`
- Create: `popup/popup.js`
- Create: `sidebar/sidebar.html`
- Create: `sidebar/sidebar.js`
- Modify: `tests/group-store.test.mjs`

**Interfaces:**
- Consumes: `loadGroups`, `updateGroup`, `reorderGroups` from `shared/group-store.js`.
- Produces: `renderGroupList(root, groups, options) -> void` and `bindGroupActions(root, refresh) -> void`.

- [ ] **Step 1: Extend the failing test for persistence across reloads**

Add a test that mutates `Vacatures` to `open`, creates a fresh store instance over the same adapter, and asserts the state remains `open` until `resetGroups` is called.

- [ ] **Step 2: Run the group-store test to verify it fails**

Run: `node --test tests/group-store.test.mjs`

Expected: FAIL until the store uses persistent data correctly.

- [ ] **Step 3: Implement shared rendering and the popup layouts**

Implement `renderGroupList` with compact, chip, expandable, and minimal variants. Each row exposes accessible Restore, Save and close, Rename, Change color, Delete, Move earlier/later, and Expand controls. Actions call the shared store and announce a visible `Simulated — no browser tabs changed` status.

- [ ] **Step 4: Implement the sidebar surface**

Render a compact searchable group list with colored labels, expandable display-only tab details, and the same simulated actions. Filtering must match titles case-insensitively and must not inspect browser tabs.

- [ ] **Step 5: Run tests and manually validate both surfaces**

Run: `node --test tests/group-store.test.mjs`

Expected: PASS.

In Firefox `about:debugging`, open the action popup and sidebar. Verify each mutation appears in the other surface after refresh and no browser tab changes.

### Task 3: Safe bookmark-plan logic and service-worker lifecycle

**Files:**
- Create: `background/bookmark-manager.js`
- Create: `background/service-worker.js`
- Create: `tests/bookmark-manager.test.mjs`

**Interfaces:**
- Consumes: `Group[]` from `loadGroups()`.
- Produces: `buildBookmarkPlan(mode, groups, extensionBaseUrl) -> BookmarkPlan[]`, `isOwnedPrototypeNode(node, provenance) -> boolean`, `reconcileTrackedNodes(api, provenance) -> Promise<Provenance>`.
- Accepts `mode: 'none'|'individual'|'folder'`.

- [ ] **Step 1: Write failing bookmark-manager tests**

Assert individual mode creates one `[STG Demo]` item per group; folder mode creates one `[STG Demo] Saved groups` root with a direct-link section and a `Groups with tabs` section containing per-group subfolders; all link URLs use the supplied extension detail base URL, never a sample URL; stale IDs are removed from provenance; a non-prototype user node is never selected for deletion.

- [ ] **Step 2: Run the bookmark-manager test to verify it fails**

Run: `node --test tests/bookmark-manager.test.mjs`

Expected: FAIL because `background/bookmark-manager.js` does not exist.

- [ ] **Step 3: Implement pure bookmark-plan and provenance helpers**

Implement the exported functions with no direct `browser` global access. A group bookmark points to `group/group.html?group=<encoded-id>`; subfolder tab entries point to the same bundled page with `group` and `tab` parameters.

- [ ] **Step 4: Implement service-worker messages and native menus**

On explicit options-page requests only, use `browser.bookmarks` to reconcile tracked IDs, remove only confirmed owned nodes, and create a selected plan sequentially under the toolbar folder. Store provenance in `browser.storage.local`. Add `menus` entries for the extension action and prototype bookmark context only; handlers may open extension options/detail pages or perform mock-data actions, never browser-tab actions.

- [ ] **Step 5: Run tests and manually validate lifecycle safety**

Run: `node --test tests/bookmark-manager.test.mjs`

Expected: PASS.

In Firefox, create each mode, switch mode, manually delete one generated item, then run cleanup. Confirm only `[STG Demo]` items are affected and no sample site opens.

### Task 4: UX Playground options and safe detail page

**Files:**
- Create: `options/options.html`
- Create: `options/options.js`
- Create: `group/group.html`
- Create: `group/group.js`
- Modify: `shared/ui.css`

**Interfaces:**
- Consumes: message names from `shared/messages.js`, shared group store/view, `BookmarkPlan` mode values.
- Produces: options controls that send `APPLY_BOOKMARK_MODE`, `REMOVE_PROTOTYPE_BOOKMARKS`, and group-state messages.

- [ ] **Step 1: Write a failing options interaction test harness**

Using a minimal fake DOM/message adapter, assert the radio default is `none`, selecting exactly one of `individual`/`folder` sends that mode only after Apply, and Remove sends the explicit cleanup message.

- [ ] **Step 2: Run the options test to verify it fails**

Run: `node --test tests/options.test.mjs`

Expected: FAIL because the options module/test fixture does not exist.

- [ ] **Step 3: Implement UX Playground settings**

Show a clear comparison of all four approaches, editable mock group names/colors, Reset demonstration data, current bookmark mode/status, mutually exclusive bookmark radio controls, Apply, and Remove all prototype bookmarks. Explain that Firefox Customize Toolbar controls action placement and that sidebar visibility remains user controlled.

- [ ] **Step 4: Implement the bundled safe group detail page**

Read only the `group`/optional `tab` query parameters, render the matching mock record, and use the shared simulated actions. Invalid parameters show an extension-owned not-found state and do not navigate elsewhere.

- [ ] **Step 5: Run tests and manually validate settings/detail behavior**

Run: `node --test tests/options.test.mjs`

Expected: PASS.

In Firefox, open Options, edit and reset a group, apply every bookmark radio mode, then click generated bookmarks. Confirm each opens only the bundled detail page.

### Task 5: Documentation, installation, and end-to-end verification

**Files:**
- Create: `README.md`
- Modify: `docs/2026-10-29-saved-tab-groups-ux-playground-design.md`

**Interfaces:**
- Consumes: final manifest/UI behavior and manual verification results.
- Produces: installation, switching, cleanup, and feasibility documentation.

- [ ] **Step 1: Document expected API/UX claims before final manual verification**

Add README sections for `about:debugging` installation, popup/sidebar access, mutually exclusive bookmark modes, manual cleanup, and no-real-tabs safety boundaries. Include a feasibility table covering APIs, native styling limits, tab-group restoration limitations, one-click reality, context menus, toolbar rearrangement, and the current Firefox version used to validate.

- [ ] **Step 2: Run all logic tests**

Run: `node --test tests/*.test.mjs`

Expected: PASS with group-store, bookmark-manager, and options tests.

- [ ] **Step 3: Validate temporary installation end to end in Firefox**

Load the manifest through `about:debugging`, exercise popup, sidebar, options, individual bookmarks, folder variants, safe detail links, reset, deletion, manual-deletion recovery, and cleanup. Record the Firefox version and any confirmed platform behavior in the README.

- [ ] **Step 4: Perform a static API-safety audit**

Run: `rg -n "browser\\.(tabs|tabGroups|sessions)|chrome\\.(tabs|tabGroups|sessions)" .`

Expected: no matches outside explanatory documentation that explicitly says those APIs are unused.

- [ ] **Step 5: Review deliverables against the design**

Confirm all source files are present, manifest installs, README links each approach to its real Firefox surface, and no generated bookmark structure exists until an explicit settings action.
