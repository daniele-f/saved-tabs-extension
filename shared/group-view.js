const COLOR_VALUES = { grey: '#718096', blue: '#276cc4', red: '#c63636', yellow: '#d89b00', green: '#16834f', pink: '#cf5a8d', purple: '#7446b8', cyan: '#087f8c', orange: '#d76a13' };

export function groupCardCapabilities(section) {
  if (section === 'active') return { actionLabel: 'Close group', detailsLabel: 'Show tabs' };
  if (section === 'inactive') return { actionLabel: 'Restore group', detailsLabel: 'Show tabs' };
  throw new TypeError('Group cards must be active or inactive.');
}

function groupCard(group, variant, section, onAction) {
  const capabilities = groupCardCapabilities(section);
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

  const action = document.createElement('button');
  action.type = 'button';
  action.className = 'group-action';
  action.textContent = capabilities.actionLabel;
  action.addEventListener('click', () => onAction(group));

  const details = document.createElement('details');
  details.className = 'group-details';
  const detailsSummary = document.createElement('summary');
  const detailsLabel = document.createElement('span');
  detailsLabel.textContent = capabilities.detailsLabel;
  const meta = document.createElement('span');
  meta.className = 'group-meta';
  meta.textContent = `${group.tabs.length} tabs · ${section === 'active' ? group.state : 'inactive'}`;
  detailsSummary.append(detailsLabel, meta);
  const list = document.createElement('ul');
  for (const tab of group.tabs) {
    const item = document.createElement('li');
    item.textContent = tab.title;
    list.append(item);
  }
  details.append(detailsSummary, list);
  card.append(summary, action, details);
  return card;
}

function groupSection(title, groups, variant, section, onAction) {
  const element = document.createElement('section');
  element.className = `group-section group-section--${section}`;
  const heading = document.createElement('h2');
  heading.textContent = title;
  element.append(heading);
  if (!groups.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = `No ${section} groups.`;
    element.append(empty);
    return element;
  }
  const list = document.createElement('div');
  list.className = 'group-list';
  groups.forEach((group) => list.append(groupCard(group, variant, section, onAction)));
  element.append(list);
  return element;
}

export function renderGroupSections(root, { activeGroups, inactiveGroups, variant = 'expandable', onClose, onRestore }) {
  root.replaceChildren(
    groupSection('Active groups', activeGroups, variant, 'active', onClose),
    groupSection('Inactive groups', inactiveGroups, variant, 'inactive', onRestore),
  );
}
