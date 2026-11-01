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
