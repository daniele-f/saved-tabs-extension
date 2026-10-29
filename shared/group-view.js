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

export function buildGroupEditPatch(group, { title, color }) {
  return {
    ...buildGroupMutation(group, { type: 'rename', title }).patch,
    ...buildGroupMutation(group, { type: 'color', color }).patch,
  };
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
  summary.append(dot, title, dragHandle(group.id, group.title));
  const actions = document.createElement('div');
  actions.className = 'group-actions';
  actions.append(button(group.state === 'closed' ? 'Restore' : 'Save & close', group.state === 'closed' ? 'restore' : 'save-close', group.id));
  actions.append(button('Edit', 'edit', group.id), button('Delete', 'delete', group.id));
  const editor = document.createElement('form');
  editor.className = 'group-editor';
  editor.dataset.groupId = group.id;
  editor.hidden = true;
  const titleInput = document.createElement('input');
  titleInput.name = 'title';
  titleInput.value = group.title;
  titleInput.setAttribute('aria-label', 'Group name');
  const colorSelect = document.createElement('select');
  colorSelect.name = 'color';
  colorSelect.setAttribute('aria-label', 'Group color');
  Object.keys(COLOR_VALUES).forEach((color) => {
    const option = document.createElement('option');
    option.value = color;
    option.textContent = color[0].toUpperCase() + color.slice(1);
    option.selected = color === group.color;
    colorSelect.append(option);
  });
  const save = document.createElement('button');
  save.type = 'submit';
  save.className = 'group-action';
  save.textContent = 'Save';
  const cancel = button('Cancel', 'cancel-edit', group.id);
  editor.append(titleInput, colorSelect, save, cancel);
  const details = document.createElement('details');
  details.className = 'group-details';
  const detailsSummary = document.createElement('summary');
  const detailsLabel = document.createElement('span');
  detailsLabel.textContent = 'Show mock tabs';
  detailsSummary.append(detailsLabel, meta);
  const list = document.createElement('ul');
  for (const tab of group.tabs) {
    const item = document.createElement('li');
    item.textContent = tab.title;
    list.append(item);
  }
  details.append(detailsSummary, list);
  const primary = document.createElement('div');
  primary.className = 'group-primary';
  primary.append(summary, actions, editor);
  card.append(primary, details);
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
  let dragPreview = null;
  root.addEventListener('dragstart', (event) => {
    const handle = event.target.closest('.group-drag-handle');
    if (!handle) return;
    draggedId = handle.dataset.groupId;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', draggedId);
    const card = handle.closest('.group-card');
    card.classList.add('is-dragging');
    dragPreview = card.cloneNode(true);
    dragPreview.classList.remove('is-dragging');
    dragPreview.classList.add('drag-preview');
    document.body.append(dragPreview);
    event.dataTransfer.setDragImage(dragPreview, 18, 18);
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
    dragPreview?.remove();
    dragPreview = null;
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
  root.addEventListener('submit', async (event) => {
    const editor = event.target.closest('.group-editor');
    if (!editor) return;
    event.preventDefault();
    const groups = await store.loadGroups();
    const group = groups.find((entry) => entry.id === editor.dataset.groupId);
    if (!group) return;
    try {
      const patch = buildGroupEditPatch(group, Object.fromEntries(new FormData(editor)));
      await store.updateGroup(group.id, patch);
      announce(`Updated mock group “${patch.title}”.`);
      await refresh();
    } catch (error) {
      announce(error.message);
    }
  });
  root.addEventListener('click', async (event) => {
    const control = event.target.closest('button[data-action]');
    if (!control) return;
    const { action, groupId } = control.dataset;
    const groups = await store.loadGroups();
    const group = groups.find((entry) => entry.id === groupId);
    if (!group) return;
    try {
      if (action === 'edit') {
        root.querySelectorAll('.group-editor').forEach((editor) => { editor.hidden = true; });
        const editor = control.closest('.group-card').querySelector('.group-editor');
        editor.hidden = false;
        editor.querySelector('input[name="title"]').focus();
        return;
      } else if (action === 'cancel-edit') {
        control.closest('.group-editor').hidden = true;
        return;
      } else if (action === 'delete') {
        if (!window.confirm(`Delete the mock group “${group.title}”?`)) return;
        await store.deleteGroup(groupId);
        announce(`Deleted mock group “${group.title}”.`);
      } else if (action !== 'drag') {
        let request = { type: action };
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
