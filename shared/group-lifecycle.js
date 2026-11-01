function snapshotFromLiveGroup(group) {
  return {
    title: group.title,
    color: group.color,
    collapsed: group.collapsed,
    tabs: group.tabs.map((tab) => ({ url: tab.url, title: tab.title })),
  };
}

export async function closeLiveGroup({ browserApi, inactiveStore, group }) {
  const snapshot = await inactiveStore.saveInactiveGroup(snapshotFromLiveGroup(group));
  await browserApi.tabs.remove(group.tabs.map((tab) => tab.id));
  return snapshot;
}

export async function restoreInactiveGroup({ browserApi, inactiveStore, snapshot, windowId }) {
  const tabs = [];
  for (const tab of snapshot.tabs) {
    tabs.push(await browserApi.tabs.create({ url: tab.url, windowId, active: false }));
  }
  const nativeGroupId = await browserApi.tabs.group({
    tabIds: tabs.map((tab) => tab.id),
    createProperties: { windowId },
  });
  await browserApi.tabGroups.update(nativeGroupId, {
    title: snapshot.title,
    color: snapshot.color,
    collapsed: snapshot.collapsed,
  });
  await inactiveStore.removeInactiveGroup(snapshot.id);
}
