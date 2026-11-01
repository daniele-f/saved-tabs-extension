# Saved Tab Groups — UX Playground

A Firefox Desktop Manifest V3 prototype for comparing a toolbar popup and sidebar without touching real browser tabs or native Firefox tab groups.

## Safety boundary

This prototype currently starts with twenty temporary scroll-test groups. It never reads, creates, opens, closes, groups, ungroups, or rearranges browser tabs.

The prototype does **not** create or modify native bookmarks.

## Install temporarily in Firefox

1. Open `about:debugging` in Firefox Desktop.
2. Choose **This Firefox**.
3. Select **Load Temporary Add-on**.
4. Choose this project’s `manifest.json`.
5. Open the extension’s **Manage** entry, then **Preferences** to open UX Playground.

Firefox removes temporary add-ons when it restarts. The project targets the current Firefox Desktop release.

## Comparing the interfaces

- **Toolbar popup:** Firefox initially places the extension action on the bookmarks toolbar, but it can put the button in the `>>` overflow menu when that toolbar has insufficient space. Click the extension button to open the expandable group list. Use **Customize Toolbar** to move it; the extension cannot force a later placement.
- **Sidebar:** choose **Open sidebar** in UX Playground or enable it through Firefox’s sidebar UI. It provides the empty state and will become the persistent group browser once real data support is connected.

## Temporary test data

Twenty `Scroll test` groups are seeded from `data/default-groups.json` so the popup and sidebar can be evaluated with a scrollbar. They are temporary test data and will be removed before real Firefox group-data integration.

## Feasibility comparison

| Surface | Firefox APIs | Fully supported | Limitation |
| --- | --- | --- | --- |
| Toolbar popup | `action`, `storage` | One extension action, popup UI | Firefox controls toolbar placement and popup closes on blur |
| Sidebar | `sidebarAction`, `storage` | Persistent searchable extension panel | Users control visibility; styling applies only inside the extension panel |

Firefox supports native tab-group APIs for a future implementation, but this prototype deliberately does not request or call them. The next implementation phase will establish whether a final product can exactly restore a native group or read real open/closed group state.

## Development checks

```powershell
npm test
rg -n "browser\.(tabs|tabGroups|sessions)|chrome\.(tabs|tabGroups|sessions)" .
```
