# Live current-window groups

## Intent

Replace the temporary mock data with a read-only view of the Firefox tab groups in the browser window that owns the popup or sidebar. Group creation remains Firefox's normal tab-group UI; the extension does not create, move, rename, recolor, close, expand, collapse, or otherwise modify tabs or groups.

## Goals

- Render each native group’s title, color, collapsed/expanded state, and tab count in the popup and sidebar.
- Show the grouped tabs’ titles in the existing expandable card details.
- Refresh when native group membership or metadata changes while the sidebar is open.
- Make the live cards visibly read-only: no mock edit, delete, restore, save-and-close, or drag controls.

## Non-goals

- Persisting closed/saved groups separately from Firefox session restore.
- Showing groups from other browser windows.
- Any mutation of Firefox tabs or tab groups.

## Approaches

1. **Current-window read-only view — selected.** Query native groups, filter them to the current window, query their member tabs, and render them in the shared card component. It matches the context of the popup and sidebar and avoids mixing unrelated windows.
2. **All-window view.** Aggregate every browser window’s groups and label them by window. This is more comprehensive but would make the compact popup harder to scan.
3. **Extension-managed saved snapshots.** Store a separate saved collection and restore it later. This conflicts with the decision to create groups only through Firefox’s normal UI and is deferred.

## Implementation decisions

- Add `tabGroups` and `tabs` permissions. `tabGroups` permits reading native group metadata; `tabs` is needed to show tab titles.
- Add a native-group reader that calls `browser.windows.getCurrent()`, `browser.tabGroups.query()`, and `browser.tabs.query({ groupId })`, returning the existing renderer’s group-shaped data.
- The reader maps Firefox’s `collapsed` boolean to the displayed `collapsed` or `expanded` state and preserves the native color.
- Extend the shared renderer with a read-only mode. It retains expandable tab details but omits every mutating control and drag handle.
- Popup reads on open. Sidebar reads on load and listens to tab-group and tab events to refresh its live view. Event listeners only trigger a new read; they do not mutate Firefox state.
- The existing mock store and test fixture data are removed from the live popup/sidebar path. Unit tests use injected browser API fakes to verify current-window filtering, tab attachment, and read-only rendering.

## Acceptance checks

- A temporary add-on with at least one Firefox tab group shows that group in both panels.
- A group in another Firefox window is not shown.
- Group title, color, collapsed/expanded state, and tab count match Firefox.
- Card details expose the group’s tab titles.
- No live card shows controls that change Firefox or mock data.
- Creating, renaming, recoloring, collapsing, or changing membership through Firefox’s UI refreshes the sidebar without reloading it.
