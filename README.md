# Saved Tab Groups

A Firefox Desktop Manifest V3 extension that shows the tab groups in your current browser window in a toolbar popup and sidebar.

## Safety boundary

The extension reads native Firefox group metadata and tab titles for the current browser window. When you explicitly confirm **Close group**, it saves that group’s ordered tab URLs, title, color, and collapsed state locally, then closes its tabs. **Restore group** recreates the tabs and their native group in the current window.

The prototype does **not** create or modify native bookmarks.

## Install temporarily in Firefox

1. Open `about:debugging` in Firefox Desktop.
2. Choose **This Firefox**.
3. Select **Load Temporary Add-on**.
4. Choose this project’s `manifest.json`.

Firefox removes temporary add-ons when it restarts. The project targets the current Firefox Desktop release.

## Comparing the interfaces

- **Toolbar popup:** Firefox initially places the extension action on the bookmarks toolbar, but it can put the button in the `>>` overflow menu when that toolbar has insufficient space. Click the extension button to open the expandable group list. Use **Customize Toolbar** to move it; the extension cannot force a later placement.
- **Sidebar:** enable it through Firefox’s sidebar UI. It is a persistent, searchable view of groups from the current Firefox window and refreshes when those groups change.

## Active and inactive groups

Create groups through Firefox’s normal tab-group UI. **Active groups** are native groups in the current window. **Inactive groups** are local snapshots made only when you close an active group through this extension. A snapshot is retained until its complete restore succeeds; if Firefox interrupts a close because of unsaved changes, its snapshot remains available as a safety copy.

## Feasibility comparison

| Surface | Firefox APIs | Fully supported | Limitation |
| --- | --- | --- | --- |
| Toolbar popup | `action`, `tabGroups`, `tabs`, `storage` | Close/restore current-window group view | Firefox controls toolbar placement and popup closes on blur |
| Sidebar | `sidebarAction`, `tabGroups`, `tabs`, `storage` | Persistent searchable Active/Inactive group view | Users control visibility; styling applies only inside the extension panel |

Firefox’s native tab-group APIs provide the current collapsed/expanded state. The extension uses a deliberately narrow write path: it only closes a user-confirmed group and restores an extension-owned inactive snapshot. Snapshot data remains local to this Firefox profile.

## Development checks

```powershell
npm test
rg -n "browser\.(tabs|tabGroups|sessions)|chrome\.(tabs|tabGroups|sessions)" .
```
