# Saved Tab Groups — UX Playground

A Firefox Desktop Manifest V3 prototype for comparing four saved-tab-group interfaces without touching real browser tabs or native Firefox tab groups.

## Safety boundary

This prototype uses only local mock data. Its buttons simulate state changes and visibly say so. It never reads, creates, opens, closes, groups, ungroups, or rearranges browser tabs; sample URLs are displayed as data only and are never opened.

The only native data it can create is explicitly requested `[STG Demo]` bookmark content. It is never created on installation, startup, reload, or reset.

## Install temporarily in Firefox

1. Open `about:debugging` in Firefox Desktop.
2. Choose **This Firefox**.
3. Select **Load Temporary Add-on**.
4. Choose this project’s `manifest.json`.
5. Open the extension’s **Manage** entry, then **Preferences** to open UX Playground.

Firefox removes temporary add-ons when it restarts. The project targets the current Firefox Desktop release; record the Firefox version used when comparing behavior.

## Comparing the interfaces

- **Toolbar popup:** the extension action starts with `default_area: "personaltoolbar"`, which Firefox uses only on first placement. Click its action button to open the compact group list and layout selector. Firefox users can move or hide it in **Customize Toolbar**; the extension cannot move it later.
- **Sidebar:** choose **Open sidebar** in UX Playground or enable it through Firefox’s sidebar UI. It provides search, expandable mock tabs, and the same simulated actions as the popup.
- **Individual bookmarks:** in UX Playground select **Individual group shortcuts** and click **Apply bookmark experiment**. Firefox creates one `[STG Demo]` bookmark per mock group on the native bookmarks toolbar.
- **Bookmarks folder:** select **One Saved groups folder** instead. It creates one `[STG Demo] Saved groups` toolbar folder containing both direct mock-group links and a `Groups with tabs` subfolder variant.

Bookmark mode is mutually exclusive: applying a different mode cleans up only IDs previously created and tracked by this prototype, then creates the newly selected structure. Use **Remove prototype bookmarks** to clean up. Manually deleted/moved prototype nodes are safely skipped.

Generated bookmark links open a bundled mock-group detail page. They do not open sample websites or restore browser tabs.

## Mock interactions

Vacatures, Python, Peppol, Gaming, and Development are seeded from `data/default-groups.json`. Restore, Save & close, Rename, Color, Delete, reorder, and expansion change only `browser.storage.local` mock records. **Reset demonstration data** restores the seed records and does not create or remove bookmarks.

## Feasibility comparison

| Surface | Firefox APIs | Fully supported | Limitation / workaround |
| --- | --- | --- | --- |
| Toolbar popup | `action`, `storage`, `menus` | One extension action, popup UI, action context menu | One action only; popup closes on blur; users control placement after first install |
| Sidebar | `sidebarAction`, `storage` | Persistent searchable extension panel | Users control visibility; styling applies only inside the extension panel |
| Individual bookmarks | `bookmarks`, `storage`, `menus` | Creating tracked bookmarks and bookmark context menus | Firefox owns native bookmark styling; custom colored backgrounds are not possible; a bookmark opens the safe detail-page equivalent, not a native restoration |
| Bookmarks folder | `bookmarks`, `storage`, `menus` | Native folder/subfolder menus | Requires extra clicks; Firefox owns menu layout and styling |

Firefox supports native tab-group APIs for a future implementation, but this prototype deliberately does not request or call them. Therefore it cannot establish whether a final product can exactly restore a native group, read real open/closed group state, or provide real one-click restoration. Its open/closed state and colored labels are mock-only.

Native context menus are available for the extension action and Firefox bookmark items via the `menus` API. Toolbar item order may be changed by users; tracked cleanup is ID-based rather than position-based.

## Development checks

```powershell
npm test
rg -n "browser\.(tabs|tabGroups|sessions)|chrome\.(tabs|tabGroups|sessions)" .
```

The test suite covers mock persistence, malformed local state, simulated mutations, safe bookmark URLs, mutual-exclusion selection, stale bookmark IDs, and protection against similarly named user bookmarks.
