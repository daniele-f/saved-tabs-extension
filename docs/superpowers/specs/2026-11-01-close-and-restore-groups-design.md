# Close and restore groups

## Intent

Let the extension safely close a real Firefox tab group while preserving a local, restorable snapshot of that group. The popup and sidebar will separate currently open groups from groups that the user deliberately closed through this extension.

## Goals

- Split each panel into **Active groups** and **Inactive groups**.
- Active groups are the native Firefox tab groups in the current browser window.
- An active card has a **Close group** button with an explicit confirmation that includes its tab count.
- Confirming close records the group title, color, and ordered tab URLs locally before closing the real tabs.
- An inactive card has **Restore group**, which recreates the tabs in the current window, groups them, and reapplies the native title/color.
- A restored snapshot is removed only after the complete native group is recreated successfully; it moves from Inactive to Active.

## Non-goals

- Tracking groups that Firefox closes outside this extension.
- Creating groups through an extension-specific creation flow.
- Cross-device synchronization, backup export, or permanent reusable copies.
- Restoring a group into a different browser window.

## Approach

Use two stacked, always-visible sections rather than a filter or switcher. This lets the user see both current native groups and saved closed groups together, while making the change in state clear.

`browser.storage.local` holds only explicit close snapshots, local to this Firefox profile. On close, storage is committed before `browser.tabs.remove()` is called. On restore, tabs are created in their saved order, grouped via `browser.tabs.group()`, and metadata is reapplied with `browser.tabGroups.update()`. If a restore fails at any step, keep the inactive snapshot and report the error instead of deleting it.

## Data model

Each inactive snapshot is JSON-safe and contains:

```js
{
  id: "saved-<uuid>",
  title: "Project research",
  color: "purple",
  tabs: [{ url: "https://example.com/", title: "Example" }],
  closedAt: "2026-11-01T12:00:00.000Z"
}
```

Native `groupId` values are intentionally not persisted: Firefox can reuse or change them after restore.

## Safety rules

- Request `storage` in addition to the existing `tabs` and `tabGroups` permissions.
- No tabs are closed without the browser’s native `beforeunload` handling and an extension confirmation first.
- Never snapshot or show private-window groups.
- Never delete a snapshot until its complete restore succeeds.
- The inactive section lists only snapshots made by this extension, never inferred browser history.
- If Firefox cancels or partly blocks a close, retain the snapshot in Inactive. The original may remain in Active too; this intentional temporary duplicate is safer than losing recovery data.

## Acceptance checks

- Closing a 3-tab active group asks for confirmation, then removes the native group and places a matching 3-tab inactive card in both panels.
- Dismissing confirmation changes nothing.
- Restoring recreates a same-title, same-color group with the stored URLs in original order and moves it to Active.
- A failed restore leaves its inactive card intact and shows an error.
- Native groups manually created/closed in Firefox affect only Active; they do not appear in Inactive.
