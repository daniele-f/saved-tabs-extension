const COLOR_VALUES = { yellow: '#d89b00', green: '#16834f', red: '#c63636', blue: '#276cc4', purple: '#7446b8' };

export function reorderedGroupIds(ids, draggedId, targetId) {
  if (draggedId === targetId) return [...ids];
  const remaining = ids.filter((id) => id !== draggedId);
  const targetIndex = remaining.indexOf(targetId);
  if (targetIndex < 0 || !ids.includes(draggedId)) return [...ids];
  remaining.splice(targetIndex, 0, draggedId);
  return remaining;
}

export function buildGroupMutation(group, action) {
  switch (action.type) {
    case 'restore':
      return { patch: { state: 'open' }, notice: 'Simulated restore — no browser tabs changed.' };
    case 'save-close':
      return { patch: { state: 'closed' }, notice: 'Simulated save and close — no browser tabs changed.' };
    case 'rename': {
      const title = action.title?.trim();
      if (!title) throw new TypeError('A mock group title is required.');
      return { patch: { title }, notice: `Renamed mock group to “${title}”.` };
    }
    case 'color':
      if (!COLOR_VALUES[action.color]) throw new TypeError('Choose a supported mock group color.');
      return { patch: { color: action.color }, notice: `Changed mock group color to ${action.color}.` };
    default:
      throw new TypeError(`Unsupported mock action: ${action.type}`);
  }
}

function button(label, action, id) {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = 'group-action';
  element.textContent = label;
  element.dataset.action = action;
  element.dataset.groupId = id;
  return element;
}

function dragHandle(id, title) {
  const element = document.createElement('span');
  element.className = 'group-drag-handle';
  element.textContent = '☰';
  element.dataset.groupId = id;
  element.draggable = true;
  element.setAttribute('role', 'img');
  element.setAttribute('aria-label', `Drag ${title} to reorder`);
  return element;
}

function groupCard(group, variant) {
  const card = document.createElement('article');
  card.className = `group-card group-card--${variant}`;
  card.dataset.groupId = group.id;
  const summary = document.createElement('div');
  summary.className = 'group-summary';
  const dot = document.createElement('span');
  dot.className = 'group-color';
  dot.style.backgroundColor = COLOR_VALUES[group.color];
  dot.setAttribute('aria-label', `${group.color} group color`);
  const title = document.createElement('strong');
  title.textContent = group.title;
  const meta = document.createElement('span');
  meta.className = 'group-meta';
  meta.textContent = `${group.tabs.length} tabs · ${group.state}`;
  summary.append(dot, title, meta, dragHandle(group.id, group.title));
  const actions = document.createElement('div');
  actions.className = 'group-actions';
  actions.append(button(group.state === 'closed' ? 'Restore' : 'Save & close', group.state === 'closed' ? 'restore' : 'save-close', group.id));
  actions.append(button('Rename', 'rename', group.id), button('Color', 'color', group.id), button('Delete', 'delete', group.id));
  const details = document.createElement('details');
  details.className = 'group-details';
  const detailsSummary = document.createElement('summary');
  detailsSummary.textContent = 'Show mock tabs';
  const list = document.createElement('ul');
  for (const tab of group.tabs) {
    const item = document.createElement('li');
    item.textContent = tab.title;
    list.append(item);
  }
  details.append(detailsSummary, list);
  card.append(summary, actions, details);
  return card;
}

export function renderGroupList(root, groups, { variant = 'compact', emptyMessage = 'No mock groups match.' } = {}) {
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

export function bindGroupActions(root, store, refresh, announce) {
  let draggedId = null;
  root.addEventListener('dragstart', (event) => {
    const handle = event.target.closest('.group-drag-handle');
    if (!handle) return;
    draggedId = handle.dataset.groupId;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', draggedId);
    handle.closest('.group-card').classList.add('is-dragging');
  });
  root.addEventListener('dragover', (event) => {
    const card = event.target.closest('.group-card');
    if (!card || !draggedId || card.dataset.groupId === draggedId) return;
    event.preventDefault();
    card.classList.add('is-drop-target');
  });
  root.addEventListener('dragleave', (event) => event.target.closest('.group-card')?.classList.remove('is-drop-target'));
  root.addEventListener('dragend', () => {
    draggedId = null;
    root.querySelectorAll('.is-dragging, .is-drop-target').forEach((element) => element.classList.remove('is-dragging', 'is-drop-target'));
  });
  root.addEventListener('drop', async (event) => {
    const card = event.target.closest('.group-card');
    const sourceId = draggedId ?? event.dataTransfer.getData('text/plain');
    if (!card || !sourceId || card.dataset.groupId === sourceId) return;
    event.preventDefault();
    const groups = await store.loadGroups();
    await store.reorderGroups(reorderedGroupIds(groups.map((group) => group.id), sourceId, card.dataset.groupId));
    announce('Reordered mock groups.');
    await refresh();
  });
  root.addEventListener('click', async (event) => {
    const control = event.target.closest('button[data-action]');
    if (!control) return;
    const { action, groupId } = control.dataset;
    const groups = await store.loadGroups();
    const group = groups.find((entry) => entry.id === groupId);
    if (!group) return;
    try {
      if (action === 'delete') {
        if (!window.confirm(`Delete the mock group “${group.title}”?`)) return;
        await store.deleteGroup(groupId);
        announce(`Deleted mock group “${group.title}”.`);
      } else if (action !== 'drag') {
        let request = { type: action };
        if (action === 'rename') request = { type: action, title: window.prompt('Mock group name', group.title) };
        if (action === 'color') request = { type: action, color: window.prompt('Color: yellow, green, red, blue, or purple', group.color) };
        if ((action === 'rename' && request.title === null) || (action === 'color' && request.color === null)) return;
        const mutation = buildGroupMutation(group, request);
        await store.updateGroup(groupId, mutation.patch);
        announce(mutation.notice);
      }
      await refresh();
    } catch (error) {
      announce(error.message);
    }
  });
}
