# Saved Tab Groups UX Playground — Design

> **Decision update:** The native-bookmark experiments were removed at the user's request after live evaluation. The implemented prototype now contains only the toolbar-popup and sidebar comparisons and does not request the Bookmarks API.

## Intent

Build an installable Firefox Desktop Manifest V3 WebExtension that compares supported user-interface choices for a future saved-tab-groups product. It is a UX and feasibility prototype: it uses editable local mock records only and never reads, creates, groups, ungroups, opens, closes, or otherwise changes browser tabs or native Firefox tab groups.

The prototype helps decide whether the eventual product should emphasize a toolbar popup, a sidebar, individual bookmark shortcuts, or a bookmarks folder. The currently preferred long-term candidates are the toolbar popup and sidebar, while the bookmark designs remain opt-in experiments.

## Goals

- Install through Firefox `about:debugging` as a temporary add-on.
- Use vanilla HTML, CSS, JavaScript, local JSON mock data, and supported Firefox WebExtension APIs only.
- Deliver four real, inspectable Firefox surfaces: an action popup, a sidebar, individual bookmarks, and a bookmarks-toolbar folder.
- Let the user edit mock groups and simulate restore, save-and-close, rename, recolor, reorder, delete, and expand actions.
- Keep the toolbar popup and sidebar available at all times; Firefox users control whether they are visible and where the action is placed.
- Make bookmark artifacts explicitly opt-in, mutually exclusive, identifiable, tracked, and safely removable.
- Clearly distinguish real Firefox UI integration from extension-owned simulations.
- Include installation, cleanup, and feasibility documentation.

## Non-goals and safety constraints

- No `tabs`, `tabGroups`, `sessions`, native-tab-group, or URL-opening behavior in this prototype.
- No read or modification of existing user bookmarks, except locating the bookmarks-toolbar parent and verifying IDs tracked by this extension.
- No automatic creation of bookmarks on installation, startup, reload, or data reset.
- No experimental APIs, browser-chrome changes, `userChrome.css`, backend, telemetry, or external dependencies.
- No claim that individual native bookmark items can be given arbitrary colored backgrounds or dynamically styled.

## Chosen approach

### Always available: action popup and sidebar

The manifest declares one MV3 `action` with `default_popup` and `default_area: "personaltoolbar"`, plus `sidebar_action` and `options_ui`. Firefox supports `personaltoolbar` only as an initial action placement. It remembers placement and users may relocate or hide the action via Customize Toolbar; the extension cannot later move it programmatically. The sidebar is available to Firefox but may be closed or hidden by the user.

The popup offers switchable compact, chips, expandable, and minimal layouts. The sidebar offers compact/expanded group rows, a search filter, and open/closed mock state. Both render the same state and perform only local simulations.

### Opt-in, mutually exclusive: bookmark experiment

The UX Playground options page has a radio selection, defaulting to **No bookmarks**:

1. **Individual group shortcuts**: create one `[STG Demo] <group>` bookmark for every mock group on the real bookmarks toolbar.
2. **Dedicated folder**: create a `[STG Demo] Saved groups` folder on the real bookmarks toolbar. It contains mock group links and a subfolder variant for comparison.

Applying a choice removes only currently tracked, prototype-owned artifacts and then creates the chosen structure sequentially. It never searches broadly or deletes an item merely because a title happens to match. "Remove all prototype bookmarks" acts only on stored IDs after confirming each node is still present and owned by the prototype; manually deleted/moved nodes are skipped and removed from tracking.

The dedicated-folder experiment intentionally contains **both** variants in one menu: a clearly labeled direct-link section with one safe extension-page link per group, and a clearly labeled `Groups with tabs` section with one subfolder per group. Each group subfolder contains safe extension-page mock-tab entries. This makes the native-menu click-depth comparison visible without creating a second toolbar folder.

Prototype bookmarks point only to a bundled extension detail page, for example `moz-extension://…/group.html?group=vacatures`. That page identifies the mock group and offers simulated actions. It never opens any sample-tab URL. A dedicated extension page is the closest supported equivalent to a native bookmark-triggered restore action.

## Alternatives considered

| Model | Trade-off | Decision |
| --- | --- | --- |
| One active UI that hides all other surfaces | Clean, but prevents natural side-by-side testing and cannot truly deactivate all Firefox surfaces | Rejected |
| Independent toggles for every UI, including both bookmark variants | Maximum comparison flexibility, but clutters the native toolbar and risks accidental duplicate artifacts | Rejected |
| Always-declared popup and sidebar; exactly one opt-in bookmark experiment | Keeps native surfaces testable, toolbar clean, and cleanup unambiguous | Chosen |

## Mock data and state

`data/default-groups.json` is the single source of initial demonstration data. It includes:

- Vacatures — yellow, 5 tabs, closed
- Python — green, 3 tabs, closed
- Peppol — red, 4 tabs, open
- Gaming — blue, 8 tabs, closed
- Development — purple, 6 tabs, open

Each group supplies sample titles and URLs, but those URLs are display-only. A `storage` module clones defaults into `browser.storage.local`, owns reset behavior, stores UI preferences, and records a provenance object for every created bookmark node: ID, mode, parent ID, title, and prototype marker. UI modules read/write through this module rather than embedding their own data copies.

## Interactions

Every extension-owned surface uses the same action model:

- Restore changes a mock group from Closed to Open and shows a clear "simulated — no browser tabs changed" notice.
- Save and close changes the mock group from Open to Closed.
- Rename, recolor, delete, reorder, and expand update only local mock state.
- Reset restores the default data and does **not** create or remove bookmark structures; bookmark cleanup remains a deliberate action.
- The options page shows current bookmark experiment status and provides links/buttons to open the options page, popup where Firefox permits user-gesture opening, and sidebar from a direct user gesture.

## Architecture

- `manifest.json`: MV3 metadata, `action`, `sidebar_action`, `options_ui`, background service worker, and only `storage`, `bookmarks`, and `menus` permissions as needed.
- `data/default-groups.json`: immutable mock seeds.
- `shared/`: group-store, message protocol, formatters, and bookmark-provenance helpers.
- `background/`: bookmark create/remove/reconciliation, action-menu items, and message handling.
- `popup/`, `sidebar/`, `options/`, `group/`: isolated HTML/CSS/JS surfaces that call shared state/actions.
- `docs/`: README/feasibility matrix and installation/cleanup instructions.

No module may import or call any Tabs or Tab Groups API.

## Feasibility matrix to ship with prototype

| Surface | Supported APIs | Fully supported | Limit/workaround |
| --- | --- | --- | --- |
| Action popup | `action`, `storage` | Popup UI, local simulations, action context menu | One action only; initial `personaltoolbar` placement is not dynamically movable; popup closes on blur |
| Sidebar | `sidebarAction`, `storage` | Searchable persistent extension UI and local simulations | User controls whether it is visible; extension styling is limited to its own panel |
| Individual bookmarks | `bookmarks`, `storage`, `menus` | Creating marked bookmarks, bookmark context menus, bundled detail page | Native bookmark backgrounds/styles cannot be customized; clicking cannot restore a group without implementing real tab logic later |
| Bookmarks folder | `bookmarks`, `storage`, `menus` | Folder/subfolder menu behavior, tracked cleanup | Requires an extra native click; Firefox owns the menu layout and styling |

The future extension can use supported Firefox tab-group APIs to inspect and manipulate native groups, but this prototype intentionally does not evaluate real persistence/restoration. Therefore it cannot yet prove whether a final restoration can exactly recreate a native group or distinguish real open/closed group state; only mock state does that here.

## Verification and documentation

- Target the user's current Firefox Desktop release. The README will name the version used for validation and note that no backward-compatibility guarantee is made for older Firefox releases.
- Validate manifest loading in `about:debugging`.
- Exercise every simulated action in popup, sidebar, group detail, and options pages; reload the temporary add-on and verify local state retention/reset behavior.
- Create each bookmark experiment, verify only `[STG Demo]` artifacts appear, switch modes, manually remove/move an artifact, and confirm cleanup skips it safely.
- Verify no tab or sample URL is opened during every interaction.
- Document API support, styling limits, native toolbar rearrangement behavior, available bookmark/action context menus, and all simulation boundaries in `README.md`.

## Builder decisions left open

- Exact visual styling, icon geometry, string copy, and screen-reader wording may be chosen to fit Firefox’s visual language.
- The builder may use a small shared rendering helper or plain DOM builders; no framework or dependency may be added.
