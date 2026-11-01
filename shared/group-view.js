const COLOR_VALUES = { grey: '#718096', blue: '#276cc4', red: '#c63636', yellow: '#d89b00', green: '#16834f', pink: '#cf5a8d', purple: '#7446b8', cyan: '#087f8c', orange: '#d76a13' };

export function groupCardCapabilities(mode = 'live') {
  if (mode !== 'live') throw new TypeError('Only live Firefox group cards are supported.');
  return { detailsLabel: 'Show tabs', draggable: false, showControls: false };
}

function groupCard(group, variant) {
  const capabilities = groupCardCapabilities();
  const card = document.createElement('article');
  card.className = `group-card group-card--${variant}`;
  const summary = document.createElement('div');
  summary.className = 'group-summary';
  const dot = document.createElement('span');
  dot.className = 'group-color';
  dot.style.backgroundColor = COLOR_VALUES[group.color] ?? COLOR_VALUES.grey;
  dot.setAttribute('aria-label', `${group.color} group color`);
  const title = document.createElement('strong');
  title.textContent = group.title;
  summary.append(dot, title);

  const details = document.createElement('details');
  details.className = 'group-details';
  const detailsSummary = document.createElement('summary');
  const detailsLabel = document.createElement('span');
  detailsLabel.textContent = capabilities.detailsLabel;
  const meta = document.createElement('span');
  meta.className = 'group-meta';
  meta.textContent = `${group.tabs.length} tabs · ${group.state}`;
  detailsSummary.append(detailsLabel, meta);
  const list = document.createElement('ul');
  for (const tab of group.tabs) {
    const item = document.createElement('li');
    item.textContent = tab.title;
    list.append(item);
  }
  details.append(detailsSummary, list);
  card.append(summary, details);
  return card;
}

export function renderGroupList(root, groups, { variant = 'expandable', mode = 'live', emptyMessage = 'No tab groups in this window.' } = {}) {
  groupCardCapabilities(mode);
  root.replaceChildren();
  if (!groups.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = emptyMessage;
    root.append(empty);
    return;
  }
  groups.forEach((group) => root.append(groupCard(group, variant)));
}
