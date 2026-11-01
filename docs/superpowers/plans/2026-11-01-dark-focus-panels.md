# Dark Focus Panels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the popup and sidebar visually match the approved dark-focus Saved Tab Groups mockup without changing their behavior.

**Architecture:** Keep the existing shared semantic markup and renderer unchanged. Add a small stylesheet contract test, then restyle only `shared/ui.css`, which both panels already load, using existing class names and CSS custom properties.

**Tech Stack:** Vanilla HTML, CSS, JavaScript, Node.js built-in test runner.

**Spec:** `docs/superpowers/specs/2026-11-01-dark-focus-panels-design.md`

## Global Constraints

- Change presentation only; preserve group, tab, search, close, restore, storage, and permission behavior.
- Use the shared stylesheet so popup and sidebar remain visually identical.
- Preserve keyboard focus treatment and accessible labels.

## Review Focus

- System light mode must remain legible even though dark mode is the source-of-truth visual direction.
- Long group titles and action labels must not overlap the far-right chevron.
- Open group details must stay visually attached to their group without obscuring tab focus states.
- Existing color custom properties must continue to distinguish Firefox group colors.
- Popup width must remain usable at its 280px minimum.

---

### Task 1: Lock the panel visual contract

**Files:**
- Modify: `tests/popup-shell.test.mjs`
- Modify: `shared/ui.css`

**Interfaces:**
- Consumes: Existing panel selectors from `popup/popup.html`, `sidebar/sidebar.html`, and `shared/group-view.js`.
- Produces: Stable CSS selectors for dark focus panel structure and keyboard focus.

- [ ] **Step 1: Write the failing stylesheet contract test**

Add a test that reads `shared/ui.css` and asserts the presence of dark panel styling, the `.group-card::before` color rail, the `.group-action`-before-chevron row layout, and `.group-tab:focus-visible`.

- [ ] **Step 2: Run the popup shell test to verify it fails**

Run: `node --test tests/popup-shell.test.mjs`
Expected: FAIL because the new dark-focus declarations are absent.

- [ ] **Step 3: Restyle `shared/ui.css` to match the approved mockup**

Use a graphite surface, quiet dividers, compact panel spacing, color rails and dots derived from the existing group color variables, a subtle tinted expanded group, text actions placed before the far-right details chevron, and high-contrast interactive states. Retain all existing selectors used by the renderer and a legible `light-dark()` fallback.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `node --test tests/popup-shell.test.mjs`
Expected: PASS.

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: all tests PASS with zero failures.

- [ ] **Step 6: Commit the visual refresh**

```bash
git add shared/ui.css tests/popup-shell.test.mjs docs/superpowers/specs/2026-11-01-dark-focus-panels-design.md docs/superpowers/plans/2026-11-01-dark-focus-panels.md
git commit -m "feat: restyle saved tab group panels"
```

## Self-review

- Spec coverage: Task 1 implements the shared dark-focus treatment, swapped action/chevron order, expanded state, and accessibility constraints; no behavioral files change.
- Type consistency: No JavaScript interfaces change.
- Review focus: The visual-contract test protects selectors; manual rendering review is still required for narrow width, long titles, and OS theme changes.
- Proportion: One visual-only task matches the narrow scope.
