const COLOR_VALUES = { grey: '#718096', blue: '#276cc4', red: '#c63636', yellow: '#d89b00', green: '#16834f', pink: '#cf5a8d', purple: '#7446b8', cyan: '#087f8c', orange: '#d76a13' };
const CHIP_VALUES = { grey: '#d7dce4', blue: '#aac9ff', red: '#ffb8b8', yellow: '#ffe18b', green: '#9de4b9', pink: '#ffc0dd', purple: '#e5b9ff', cyan: '#a4ebef', orange: '#ffc492' };

export function groupCardCapabilities(section) {
  if (section === 'active') return { actionLabel: 'Save & Hide', detailsLabel: 'Show tabs' };
  if (section === 'inactive') return { actionLabel: 'Restore', detailsLabel: 'Show tabs' };
  throw new TypeError('Group cards must be active or inactive.');
}

export function tabHostLabel(tab) {
  if (!tab?.url) return '';
  try {
    return new URL(tab.url).host || tab.url;
  } catch {
    return tab.url;
  }
}

export function tabIconKind(tab) {
  return tab?.favIconUrl ? 'favicon' : 'web-fallback';
}

export function nextExpandedState(isExpanded) {
  return !isExpanded;
}

export function groupTabCapabilities(section) {
  if (section === 'active') return { canFocus: true };
  if (section === 'inactive') return { canFocus: false };
  throw new TypeError('Group cards must be active or inactive.');
}

function groupCard(group, variant, section, onAction, onFocusTab) {
  const capabilities = groupCardCapabilities(section);
  const tabCapabilities = groupTabCapabilities(section);
  const card = document.createElement('article');
  card.className = `group-card group-card--${variant}`;
  card.style.setProperty('--group-color', COLOR_VALUES[group.color] ?? COLOR_VALUES.grey);
  card.style.setProperty('--group-chip-color', CHIP_VALUES[group.color] ?? CHIP_VALUES.grey);
  const summary = document.createElement('div');
  summary.className = 'group-summary';
  const identity = document.createElement('div');
  identity.className = 'group-identity';
  const title = document.createElement('strong');
  title.textContent = group.title;
  const groupContext = document.createElement('span');
  groupContext.className = 'group-context';
  groupContext.textContent = `${group.tabs.length} tabs · ${section === 'active' ? group.state : 'closed'}`;
  identity.append(title, groupContext);
  summary.append(identity);

  const action = document.createElement('button');
  action.type = 'button';
  action.className = 'group-action';
  action.textContent = capabilities.actionLabel;
  action.addEventListener('click', () => onAction(group));

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'group-toggle';
  toggle.setAttribute('aria-label', `${capabilities.detailsLabel} for ${group.title}`);
  const toggleChevron = document.createElement('span');
  toggleChevron.className = 'toggle-chevron';
  toggleChevron.setAttribute('aria-hidden', 'true');
  toggleChevron.append(document.createElement('span'), document.createElement('span'));
  toggle.append(toggleChevron);
  const details = document.createElement('section');
  details.className = 'group-details';
  const list = document.createElement('ul');
  const appendTab = (tab) => {
    const item = document.createElement('li');
    const row = tabCapabilities.canFocus && tab.id != null ? document.createElement('button') : document.createElement('span');
    row.className = 'group-tab';
    if (tabCapabilities.canFocus && tab.id != null) {
      row.type = 'button';
      row.title = `Switch to ${tab.title}`;
      row.addEventListener('click', () => onFocusTab(tab));
    }
    if (tabIconKind(tab) === 'favicon') {
      const favicon = document.createElement('img');
      favicon.className = 'tab-favicon';
      favicon.src = tab.favIconUrl;
      favicon.alt = '';
      row.append(favicon);
    } else {
      const fallbackIcon = document.createElement('span');
      fallbackIcon.className = 'tab-favicon tab-favicon--fallback';
      fallbackIcon.setAttribute('aria-hidden', 'true');
      row.append(fallbackIcon);
    }
    const label = document.createElement('span');
    label.className = 'tab-title';
    label.textContent = tab.title;
    row.append(label);
    const host = tabHostLabel(tab);
    if (host) {
      const secondary = document.createElement('span');
      secondary.className = 'tab-host';
      secondary.textContent = host;
      row.append(secondary);
    }
    item.append(row);
    list.append(item);
  };
  (group.visibleTabs ?? group.tabs).forEach(appendTab);
  details.append(list);
  if (group.hiddenTabs?.length) {
    const showMore = document.createElement('button');
    showMore.type = 'button';
    showMore.className = 'show-more-tabs';
    showMore.textContent = `Show ${group.hiddenTabs.length} more`;
    showMore.addEventListener('click', () => {
      group.hiddenTabs.forEach(appendTab);
      showMore.remove();
    });
    details.append(showMore);
  }
  const setExpanded = (isExpanded) => {
    card.classList.toggle('is-expanded', isExpanded);
    details.hidden = !isExpanded;
    toggle.setAttribute('aria-expanded', String(isExpanded));
  };
  setExpanded(Boolean(group.forceExpanded));
  toggle.addEventListener('click', () => setExpanded(nextExpandedState(card.classList.contains('is-expanded'))));
  card.append(summary, action, toggle, details);
  return card;
}

function groupSection(title, groups, variant, section, onAction, onFocusTab) {
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
  groups.forEach((group) => list.append(groupCard(group, variant, section, onAction, onFocusTab)));
  element.append(list);
  return element;
}

export function renderGroupSections(root, { activeGroups, inactiveGroups, variant = 'expandable', onClose, onRestore, onFocusTab = () => {} }) {
  root.replaceChildren(
    groupSection('Active', activeGroups, variant, 'active', onClose, onFocusTab),
    groupSection('Inactive', inactiveGroups, variant, 'inactive', onRestore, onFocusTab),
  );
}
