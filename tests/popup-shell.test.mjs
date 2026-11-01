import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('ships a single expandable popup layout without a layout picker', async () => {
  const html = await readFile(new URL('../popup/popup.html', import.meta.url), 'utf8');

  assert.equal(html.includes('<select'), false);
  assert.equal(html.includes('Compact list'), false);
  assert.equal(html.includes('Colored chips'), false);
  assert.equal(html.includes('Minimal list'), false);
});

test('connects both panels to live groups and inactive snapshots', async () => {
  const [popup, sidebar] = await Promise.all([
    readFile(new URL('../popup/popup.js', import.meta.url), 'utf8'),
    readFile(new URL('../sidebar/sidebar.js', import.meta.url), 'utf8'),
  ]);

  for (const script of [popup, sidebar]) {
    assert.match(script, /native-group-reader/);
    assert.match(script, /inactive-group-store/);
    assert.match(script, /group-lifecycle/);
    assert.match(script, /group-search/);
    assert.match(script, /renderGroupSections/);
  }
  assert.match(sidebar, /storage\.onChanged/);
  assert.doesNotMatch(popup, /tabs\.(remove|create|group)/);
  assert.doesNotMatch(sidebar, /tabs\.(remove|create|group)/);
});

test('uses the dark-focus panel treatment with action before disclosure', async () => {
  const [css, popup, sidebar, groupView] = await Promise.all([
    readFile(new URL('../shared/ui.css', import.meta.url), 'utf8'),
    readFile(new URL('../popup/popup.html', import.meta.url), 'utf8'),
    readFile(new URL('../sidebar/sidebar.html', import.meta.url), 'utf8'),
    readFile(new URL('../shared/group-view.js', import.meta.url), 'utf8'),
  ]);

  assert.match(css, /background:\s*light-dark\(#f7f8fb,\s*#14171d\)/);
  assert.match(css, /\.group-card\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto\s+auto/s);
  assert.match(css, /\.group-toggle\s*\{[^}]*grid-column:\s*3/s);
  assert.match(css, /\.toggle-chevron\s*\{[^}]*transition:\s*\.25s\s*ease-in-out/s);
  assert.match(css, /\.toggle-chevron span\s*\{[^}]*transition:\s*\.25s\s*ease-in-out/s);
  assert.match(css, /\.toggle-chevron span:nth-child\(1\)\s*\{[^}]*transform:\s*translateX\(-5px\)\s+rotate\(-50deg\)/s);
  assert.match(css, /\.toggle-chevron span:nth-child\(2\)\s*\{[^}]*transform:\s*translateX\(5px\)\s+rotate\(50deg\)/s);
  assert.match(css, /\.group-toggle\[aria-expanded="true"\]\s+\.toggle-chevron span:nth-child\(1\)\s*\{[^}]*transform:\s*translateX\(-5px\)\s+rotate\(-130deg\)/s);
  assert.match(css, /\.group-toggle\[aria-expanded="true"\]\s+\.toggle-chevron span:nth-child\(2\)\s*\{[^}]*transform:\s*translateX\(5px\)\s+rotate\(130deg\)/s);
  assert.match(groupView, /toggleChevron\.className = 'toggle-chevron'/);
  assert.match(css, /\.group-details\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/s);
  assert.match(css, /\.group-action\s*\{[^}]*grid-column:\s*2/s);
  assert.match(css, /\.group-action\s*\{[^}]*padding-inline:\s*8px[^}]*color:\s*#fff/s);
  assert.match(css, /\.group-tab:is\(button\):focus-visible/);
  assert.match(popup, /class="search-icon"/);
  assert.match(sidebar, /class="search-icon"/);
  assert.match(css, /\.group-card\.is-expanded::after/);
  assert.match(css, /\.group-card:not\(\.is-expanded\):hover\s*\{[^}]*background:\s*color-mix/s);
  assert.match(css, /\.group-details li \+ li\s*\{[^}]*border-top/s);
  assert.doesNotMatch(css, /\.group-details ul\s*\{[^}]*border-top/s);
  assert.match(css, /\.tab-favicon\s*\{[^}]*grid-row:\s*1\s*\/\s*span\s*2[^}]*align-self:\s*center/s);
  assert.doesNotMatch(css, /linear-gradient/);
});
