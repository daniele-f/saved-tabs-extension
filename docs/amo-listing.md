# Firefox Add-ons submission

Name: Saved Tab Groups

Summary: Save, close, search, and restore Firefox tab groups from a toolbar popup or sidebar.

Author: daniele-f

License: MIT

Support: https://github.com/daniele-f/saved-tabs-extension/issues

Homepage: https://github.com/daniele-f/saved-tabs-extension

## Description

Keep Firefox tab groups handy without keeping every tab open.

- View native tab groups in the current window from the toolbar popup or sidebar.
- Search group names, tab titles, and URLs.
- Save and close a group after confirmation, then restore its tabs, title, color, and collapsed state later.
- Switch directly to an open tab.
- Keep saved groups in local Firefox storage, with no account or analytics.

Requires Firefox Desktop 140 or later. Create groups using Firefox's native tab-group controls. Active groups belong to the current window; inactive groups are snapshots saved by this extension in the current profile. Saving stores URLs, not page state, form contents, or browsing history. Removing the extension removes its saved groups.

## Reviewer notes

Plain JavaScript, HTML, CSS, and SVG; no compilation, minification, remote executable code, or build dependencies. The release ZIP contains the original runtime sources. No account or credentials required.

Create a native Firefox group with two ordinary https tabs. Open the extension popup or sidebar, expand the group, search for a tab, and click a result to focus it. Select Save & close, confirm, and verify the inactive snapshot. Select Restore and verify the native group returns and the snapshot disappears. Test cancellation of the close confirmation as well.

## Submission checklist

- Upload dist/saved-tab-groups-0.1.0.zip as the extension package.
- Choose MIT and use the description above.
- Paste PRIVACY.md into the privacy-policy field.
- Add screenshots from a clean Firefox profile using non-sensitive example tabs.
- Complete Mozilla's declarations consistently with PRIVACY.md; review favicon requests when answering data questions.
- Run the manual reviewer scenario above before submitting.
- Preserve the existing extension ID for future updates and increase the manifest version for each release.
