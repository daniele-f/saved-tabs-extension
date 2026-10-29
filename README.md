# Saved Tab Groups — UX Playground

A Firefox Desktop Manifest V3 prototype for comparing a toolbar popup and sidebar without touching real browser tabs or native Firefox tab groups.

## Safety boundary

This prototype uses only local mock data. Its controls simulate state changes and visibly say so. It never reads, creates, opens, closes, groups, ungroups, or rearranges browser tabs; sample URLs are display-only and are never opened.

The prototype does **not** create or modify native bookmarks.

## Install temporarily in Firefox

1. Open `about:debugging` in Firefox Desktop.
2. Choose **This Firefox**.
3. Select **Load Temporary Add-on**.
4. Choose this project’s `manifest.json`.
5. Open the extension’s **Manage** entry, then **Preferences** to open UX Playground.

Firefox removes temporary add-ons when it restarts. The project targets the current Firefox Desktop release.

## Comparing the interfaces

- **Toolbar popup:** Firefox initially places the extension action on the bookmarks toolbar, but it can put the button in the `>>` overflow menu when that toolbar has insufficient space. Click the extension button to open the compact group list and layout selector. Use **Customize Toolbar** to move it; the extension cannot force a later placement.
- **Sidebar:** choose **Open sidebar** in UX Playground or enable it through Firefox’s sidebar UI. It provides search, expandable mock tabs, and the same simulated actions as the popup.

## Mock interactions

Vacatures, Python, Peppol, Gaming, and Development are seeded from `data/default-groups.json`. Restore, Save & close, Rename, Color, Delete, reorder, and expansion change only `browser.storage.local` mock records. **Reset demonstration data** restores the seed records.

## Feasibility comparison

| Surface | Firefox APIs | Fully supported | Limitation |
| --- | --- | --- | --- |
| Toolbar popup | `action`, `storage` | One extension action, popup UI | Firefox controls toolbar placement and popup closes on blur |
| Sidebar | `sidebarAction`, `storage` | Persistent searchable extension panel | Users control visibility; styling applies only inside the extension panel |

Firefox supports native tab-group APIs for a future implementation, but this prototype deliberately does not request or call them. It cannot establish whether a final product can exactly restore a native group or read real open/closed group state; its colored labels and states are mock-only.

## Development checks

```powershell
npm test
rg -n "browser\.(tabs|tabGroups|sessions)|chrome\.(tabs|tabGroups|sessions)" .
```
