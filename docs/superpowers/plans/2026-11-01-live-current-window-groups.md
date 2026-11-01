# Live Current-Window Groups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display the user’s real Firefox tab groups and their tabs, read-only, in the toolbar popup and sidebar for the current browser window.

**Architecture:** A new native-group reader will query the extension document’s current Firefox window, then join `browser.tabGroups.query()` results with each group’s tabs. The shared card renderer will gain a read-only live mode; popup reads once when opened and sidebar subscribes to native group/tab events while it is open.

**Tech Stack:** Firefox Manifest V3 WebExtensions, vanilla JavaScript modules, Node’s built-in test runner.

**Spec:** `docs/superpowers/specs/2026-11-01-live-current-window-groups-design.md`

## Global Constraints

- Request only `tabGroups` and `tabs` permissions for the live reader; do not request host permissions.
- Read only native group/tab data; do not create, move, rename, recolor, collapse, expand, close, group, or ungroup anything.
- Display only groups from the browser window containing the popup or sidebar.
- Do not preserve a separate extension-managed collection of closed/saved groups.
- Live cards retain expandable tab-title details but expose no mock-changing controls or drag handle.

## Review Focus

- A Firefox group with an empty title still renders as a clearly labelled untitled group; test in Task 1.
- A native `grey` group color and every supported Firefox color maps to a valid display color; test in Task 1.
- Groups and tabs from another window never leak into the current-window panel; test in Task 1.
- A sidebar refresh storm from several tab events does not leave stale groups; test the refresh subscription in Task 2.
- The live-card renderer cannot accidentally expose a mutating button or drag handle; inspect the rendered DOM in Task 2.

---

### Task 1: Native Firefox group reader

**Files:**
- Create: `shared/native-group-reader.js`
- Create: `tests/native-group-reader.test.mjs`

**Interfaces:**
- Produces: `loadCurrentWindowGroups(browserApi) => Promise<LiveGroup[]>` where `LiveGroup` is `{ id: string, title: string, color: string, state: 'collapsed' | 'expanded', tabs: Array<{ title: string }> }`.
- Produces: `nativeGroupColor(color) => string`, returning a renderer-supported color token for Firefox’s native color values.

- [ ] **Step 1: Write failing native-reader tests**

```js
assert.deepEqual(await loadCurrentWindowGroups(browserApi), [{
  id: '15', title: 'Research', color: 'purple', state: 'collapsed',
  tabs: [{ title: 'MDN' }, { title: 'Firefox source' }],
}]);
assert.equal(nativeGroupColor('grey'), 'grey');
```

Include a second-window group, ungrouped tabs, an empty title, and an event fake as the review-focus cases.

- [ ] **Step 2: Run the new test file to verify it fails**

Run: `node --test tests/native-group-reader.test.mjs`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement `loadCurrentWindowGroups(browserApi)` and `nativeGroupColor(color)`**

Call `browserApi.windows.getCurrent()`, filter `browserApi.tabGroups.query({})` by `windowId`, query tabs by each group ID, sort groups/tabs in Firefox order, use `Untitled group` for an empty title, and map `collapsed` to `collapsed`/`expanded`. Never call a modifying API.

- [ ] **Step 4: Run the native-reader tests to verify they pass**

Run: `node --test tests/native-group-reader.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add shared/native-group-reader.js tests/native-group-reader.test.mjs
git commit -m "feat: read current Firefox tab groups"
```

### Task 2: Read-only renderer and live refresh subscription

**Files:**
- Modify: `shared/group-view.js`
- Modify: `shared/ui.css`
- Modify: `shared/native-group-reader.js`
- Modify: `tests/group-view.test.mjs`
- Modify: `tests/native-group-reader.test.mjs`

**Interfaces:**
- Consumes: `LiveGroup[]` from `loadCurrentWindowGroups(browserApi)`.
- Produces: `renderGroupList(root, groups, { variant, mode: 'live' })` with expandable read-only cards.
- Produces: `subscribeToCurrentWindowGroupChanges(browserApi, refresh) => () => void`.

- [ ] **Step 1: Write failing read-only and subscription tests**

Assert that live rendering selects no action controls/drag handle and that listeners for `tabGroups.onCreated`, `onMoved`, `onRemoved`, `onUpdated`, plus `tabs.onCreated`, `onMoved`, `onRemoved`, `onUpdated`, call the supplied refresh function.

- [ ] **Step 2: Run the relevant tests to verify they fail**

Run: `node --test tests/group-view.test.mjs tests/native-group-reader.test.mjs`

Expected: FAIL because live mode and the subscription function do not exist.

- [ ] **Step 3: Implement live cards and `subscribeToCurrentWindowGroupChanges`**

Give `groupCard`/`renderGroupList` a `mode: 'live'` path that shows title, native-color dot, collapsed/expanded state, count, and details only. Remove controls and drag UI in that path. Attach the eight listeners in the reader and return a cleanup function that removes them; coalesce repeated event notifications into one queued refresh.

- [ ] **Step 4: Run the relevant tests to verify they pass**

Run: `node --test tests/group-view.test.mjs tests/native-group-reader.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add shared/native-group-reader.js shared/group-view.js shared/ui.css tests/native-group-reader.test.mjs tests/group-view.test.mjs
git commit -m "feat: render live tab groups read-only"
```

### Task 3: Connect popup and sidebar; retire the mock live path

**Files:**
- Modify: `manifest.json`
- Modify: `popup/popup.js`
- Modify: `sidebar/sidebar.js`
- Modify: `popup/popup.html`
- Modify: `sidebar/sidebar.html`
- Modify: `options/options.html`
- Modify: `README.md`
- Modify: `tests/manifest.test.mjs`
- Modify: `tests/popup-shell.test.mjs`
- Delete: `data/default-groups.json`
- Delete: `shared/group-store.js`
- Delete: `group/group.html`
- Delete: `group/group.js`
- Delete: `tests/group-store.test.mjs`

**Interfaces:**
- Consumes: `loadCurrentWindowGroups(browser)` and `subscribeToCurrentWindowGroupChanges(browser, refresh)`.
- Produces: live popup/sidebar panels with no mock storage or mock-data controls.

- [ ] **Step 1: Write failing manifest and panel-shell tests**

Assert that the manifest permissions are exactly `tabGroups` and `tabs`; popup/sidebar scripts import the native reader; and panel copy has no “mock”, “simulated”, or reset-demo UI.

- [ ] **Step 2: Run the test suite to verify it fails**

Run: `npm test`

Expected: FAIL because the manifest and panel scripts still use mock storage.

- [ ] **Step 3: Wire both panels to the native reader**

Replace mock store imports with `loadCurrentWindowGroups(browser)` and `renderGroupList(..., { variant: 'expandable', mode: 'live' })`. Popup refreshes once on open. Sidebar subscribes after first render and refreshes on native changes. Replace the manifest permissions; remove unused mock files and all mock-oriented copy.

- [ ] **Step 4: Run automated verification**

Run: `npm test`

Expected: PASS.

Run: `rg -n "mock|simulated|default-groups|group-store" manifest.json popup sidebar shared options README.md tests`

Expected: no live-panel/mock-store references; test fixture names are allowed only if still required by unit tests.

- [ ] **Step 5: Manually verify in Firefox**

Reload the temporary add-on in `about:debugging`, create two tab groups in the current window with Firefox’s normal UI, and open both extension panels. Confirm card metadata, tab details, current-window filtering, no mutating controls, and sidebar refresh after a Firefox-side group change.

- [ ] **Step 6: Commit**

```powershell
git add manifest.json popup sidebar options README.md tests
git rm data/default-groups.json shared/group-store.js group/group.html group/group.js tests/group-store.test.mjs
git commit -m "feat: show current Firefox tab groups"
```
