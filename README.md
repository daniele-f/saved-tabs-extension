# Saved Tab Groups

A Firefox Desktop Manifest V3 extension that shows the tab groups in your current browser window in a toolbar popup and sidebar.

## Safety boundary

The extension reads native Firefox group metadata and tab titles for the current browser window. It never creates, opens, closes, groups, ungroups, moves, renames, recolors, expands, collapses, or rearranges browser tabs or groups.

The prototype does **not** create or modify native bookmarks.

## Install temporarily in Firefox

1. Open `about:debugging` in Firefox Desktop.
2. Choose **This Firefox**.
3. Select **Load Temporary Add-on**.
4. Choose this project’s `manifest.json`.
5. Open the extension’s **Manage** entry, then **Preferences** to open its settings page.

Firefox removes temporary add-ons when it restarts. The project targets the current Firefox Desktop release.

## Comparing the interfaces

- **Toolbar popup:** Firefox initially places the extension action on the bookmarks toolbar, but it can put the button in the `>>` overflow menu when that toolbar has insufficient space. Click the extension button to open the expandable group list. Use **Customize Toolbar** to move it; the extension cannot force a later placement.
- **Sidebar:** choose **Open sidebar** in Settings or enable it through Firefox’s sidebar UI. It is a persistent, searchable view of groups from the current Firefox window and refreshes when those groups change.

## Native data

Create and manage groups through Firefox’s normal tab-group UI. The extension shows their native title, color, collapsed/expanded state, member-tab count, and expandable tab titles. Groups in other Firefox windows are not shown.

## Feasibility comparison

| Surface | Firefox APIs | Fully supported | Limitation |
| --- | --- | --- | --- |
| Toolbar popup | `action`, `tabGroups`, `tabs` | One extension action, read-only current-window group view | Firefox controls toolbar placement and popup closes on blur |
| Sidebar | `sidebarAction`, `tabGroups`, `tabs` | Persistent searchable current-window group view | Users control visibility; styling applies only inside the extension panel |

Firefox’s native tab-group APIs provide the current collapsed/expanded state. This extension deliberately has no write path.

## Development checks

```powershell
npm test
rg -n "browser\.(tabs|tabGroups|sessions)|chrome\.(tabs|tabGroups|sessions)" .
```
