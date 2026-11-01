export function closeConfirmationContent(group) {
  return {
    title: `Save and close “${group.title}”?`,
    detail: `${group.tabs.length} tabs will be closed. The group will remain available under Inactive groups.`,
  };
}

export function confirmSaveAndClose(group) {
  const content = closeConfirmationContent(group);
  const dialog = document.createElement('dialog');
  dialog.className = 'close-confirmation';

  const heading = document.createElement('h2');
  heading.textContent = content.title;
  const detail = document.createElement('p');
  detail.textContent = content.detail;
  const actions = document.createElement('div');
  actions.className = 'close-confirmation-actions';
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'close-confirmation-cancel';
  cancel.textContent = 'Cancel';
  const confirm = document.createElement('button');
  confirm.type = 'button';
  confirm.className = 'close-confirmation-confirm';
  confirm.textContent = 'Save and Close';
  actions.append(cancel, confirm);
  dialog.append(heading, detail, actions);
  document.body.append(dialog);

  return new Promise((resolve) => {
    const finish = (confirmed) => {
      dialog.close();
      dialog.remove();
      resolve(confirmed);
    };
    cancel.addEventListener('click', () => finish(false));
    confirm.addEventListener('click', () => finish(true));
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      finish(false);
    });
    dialog.showModal();
    confirm.focus();
  });
}
