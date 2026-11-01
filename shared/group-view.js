const COLOR_VALUES = { grey: '#718096', blue: '#276cc4', red: '#c63636', yellow: '#d89b00', green: '#16834f', pink: '#cf5a8d', purple: '#7446b8', cyan: '#087f8c', orange: '#d76a13' };

export function groupCardCapabilities(mode = 'mock') {
  return mode === 'live'
    ? { detailsLabel: 'Show tabs', draggable: false, showControls: false }
    : { detailsLabel: 'Show mock tabs', draggable: true, showControls: true };
}

export function reorderedGroupIds(ids, draggedId, targetId) {
  const remaining = ids.filter((id) => id !== draggedId);
  if (!ids.includes(draggedId)) return [...ids];
  const targetIndex = targetId === null ? remaining.length : remaining.indexOf(targetId);
  if (targetIndex < 0) return [...ids];
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
  element.setAttribute('role', 'img');
  element.setAttribute('aria-label', `Drag ${title} to reorder`);
  return element;
}

function groupCard(group, variant, mode) {
  const capabilities = groupCardCapabilities(mode);
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
  summary.append(dot, title);
  if (capabilities.draggable) summary.append(dragHandle(group.id, group.title));
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
  detailsLabel.textContent = capabilities.detailsLabel;
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
  primary.append(summary);
  if (capabilities.showControls) primary.append(actions, editor);
  card.append(primary, details);
  return card;
}

export function renderGroupList(root, groups, { variant = 'compact', mode = 'mock', emptyMessage = 'No saved tab groups yet.' } = {}) {
  root.replaceChildren();
  if (!groups.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = emptyMessage;
    root.append(empty);
    return;
  }
  groups.forEach((group) => root.append(groupCard(group, variant, mode)));
}

export function bindGroupActions(root, store, refresh, announce) {
  let activeDrag = null;
  const clearDropPosition = () => {
    root.querySelectorAll('.is-drop-before, .is-drop-after').forEach((element) => {
      element.classList.remove('is-drop-before', 'is-drop-after');
    });
  };
  const updateDropPosition = (clientY) => {
    clearDropPosition();
    activeDrag.hasDropPosition = false;
    const cards = [...root.querySelectorAll('.group-card')].filter((card) => card.dataset.groupId !== activeDrag.id);
    if (!cards.length) return;
    const beforeCard = cards.find((card) => {
      const rect = card.getBoundingClientRect();
      return clientY < rect.top + rect.height / 2;
    });
    activeDrag.hasDropPosition = true;
    if (beforeCard) {
      beforeCard.classList.add('is-drop-before');
      activeDrag.beforeId = beforeCard.dataset.groupId;
      return;
    }
    const lastCard = cards.at(-1);
    lastCard.classList.add('is-drop-after');
    activeDrag.beforeId = null;
  };
  const clearDragState = (settle = false) => {
    if (!activeDrag) return;
    const { card, preview } = activeDrag;
    card.classList.remove('is-dragging');
    clearDropPosition();
    if (settle) {
      preview.classList.add('is-settling');
      window.setTimeout(() => preview.remove(), 140);
    } else {
      preview.remove();
    }
    activeDrag = null;
  };
  root.addEventListener('pointerdown', (event) => {
    const handle = event.target.closest('.group-drag-handle');
    if (!handle || event.button !== 0) return;
    event.preventDefault();
    const card = handle.closest('.group-card');
    card.classList.add('is-dragging');
    const rect = card.getBoundingClientRect();
    const preview = card.cloneNode(true);
    preview.classList.remove('is-dragging');
    preview.classList.add('drag-preview');
    preview.style.width = `${rect.width}px`;
    preview.style.left = `${rect.left}px`;
    preview.style.top = `${rect.top}px`;
    document.body.append(preview);
    activeDrag = { id: handle.dataset.groupId, card, handle, preview, startY: event.clientY, beforeId: null, hasDropPosition: false };
    handle.setPointerCapture(event.pointerId);
  });
  root.addEventListener('pointermove', (event) => {
    if (!activeDrag) return;
    const { preview, startY } = activeDrag;
    preview.style.setProperty('--drag-y', `${event.clientY - startY}px`);
    updateDropPosition(event.clientY);
  });
  root.addEventListener('pointercancel', () => clearDragState());
  root.addEventListener('pointerup', async () => {
    if (!activeDrag) return;
    const { id, beforeId, hasDropPosition } = activeDrag;
    clearDragState(true);
    if (!hasDropPosition) return;
    const groups = await store.loadGroups();
    await store.reorderGroups(reorderedGroupIds(groups.map((group) => group.id), id, beforeId));
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
