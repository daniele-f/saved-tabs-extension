const NATIVE_COLORS = new Set(['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange']);

export function nativeGroupColor(color) {
  return NATIVE_COLORS.has(color) ? color : 'grey';
}

export async function loadCurrentWindowGroups(browserApi) {
  const currentWindow = await browserApi.windows.getCurrent();
  const nativeGroups = await browserApi.tabGroups.query({});
  const groupsWithTabs = await Promise.all(nativeGroups
    .filter((group) => group.windowId === currentWindow.id)
    .map(async (group) => ({
      group,
      tabs: (await browserApi.tabs.query({ groupId: group.id })).sort((a, b) => a.index - b.index),
    })));

  return groupsWithTabs
    .sort((a, b) => (a.tabs[0]?.index ?? Infinity) - (b.tabs[0]?.index ?? Infinity))
    .map(({ group, tabs }) => ({
      id: String(group.id),
      title: group.title || 'Untitled group',
      color: nativeGroupColor(group.color),
      state: group.collapsed ? 'collapsed' : 'expanded',
      tabs: tabs.map((tab) => ({ title: tab.title || 'Untitled tab' })),
    }));
}

export function subscribeToCurrentWindowGroupChanges(browserApi, refresh) {
  let active = true;
  let queued = false;
  const scheduleRefresh = () => {
    if (!active || queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      if (active) void refresh();
    });
  };
  const events = [
    browserApi.tabGroups.onCreated,
    browserApi.tabGroups.onMoved,
    browserApi.tabGroups.onRemoved,
    browserApi.tabGroups.onUpdated,
    browserApi.tabs.onCreated,
    browserApi.tabs.onMoved,
    browserApi.tabs.onRemoved,
    browserApi.tabs.onUpdated,
  ];
  events.forEach((event) => event.addListener(scheduleRefresh));
  return () => {
    active = false;
    events.forEach((event) => event.removeListener(scheduleRefresh));
  };
}
