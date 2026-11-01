# Dark Focus Panels — Design

## Intent

Refresh the Saved Tab Groups popup and sidebar so both match the selected dark-focus mockup: compact, high-contrast, and easy to scan, while preserving all existing group, tab, search, close, restore, and theme behavior.

## Goals

- Use a graphite dark surface, restrained dividers, and colored group rails/dots.
- Make each group row clearly structured: identity and metadata on the left, text action next, expand control on the far right.
- Keep one expandable group detail area visually connected to its parent group.
- Apply the system consistently to both popup and sidebar through the shared stylesheet.

## Non-goals

- No changes to extension behavior, storage, labels, permissions, or data model.
- No new controls, menus, or tab-management capability.

## Approaches considered

1. Quiet navigator: lightweight list with color rails and text actions. Cleanest, but less distinct in a narrow panel.
2. Color-indexed cards: individual pale cards. More approachable, but too spacious for a panel used to scan many groups.
3. Dark focus panels (selected): compact graphite rows, subtle tinted expansion, color rails, and action-before-chevron ordering. This gives the clearest visual hierarchy while keeping density practical.

## Implementation notes

- Update `shared/ui.css` only, keeping the existing semantic HTML and JavaScript contract intact.
- Respect the browser and OS color preference with a matching light-mode fallback, while dark mode follows the chosen reference most closely.
- Preserve keyboard focus states, accessible labels, and responsive widths.

## Verification

- Run the existing Node test suite.
- Inspect the popup/sidebar markup and stylesheet for unchanged selectors required by the renderer.
