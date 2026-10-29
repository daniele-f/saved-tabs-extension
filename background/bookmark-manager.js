const MARKER = 'stg-demo-v1';
const detailUrl = (baseUrl, groupId, tabIndex) => `${baseUrl}?group=${encodeURIComponent(groupId)}${tabIndex === undefined ? '' : `&tab=${tabIndex}`}`;

export function buildBookmarkPlan(mode, groups, extensionBaseUrl) {
  if (mode === 'none') return [];
  if (mode === 'individual') return groups.map((group) => ({ key: `group-${group.id}`, parentKey: 'toolbar', kind: 'bookmark', title: `[STG Demo] ${group.title}`, url: detailUrl(extensionBaseUrl, group.id) }));
  if (mode !== 'folder') throw new TypeError(`Unsupported bookmark mode: ${mode}`);
  const plan = [
    { key: 'root', parentKey: 'toolbar', kind: 'folder', title: '[STG Demo] Saved groups' },
    { key: 'direct', parentKey: 'root', kind: 'folder', title: 'Direct group links' },
  ];
  groups.forEach((group) => plan.push({ key: `direct-${group.id}`, parentKey: 'direct', kind: 'bookmark', title: `[STG Demo] ${group.title}`, url: detailUrl(extensionBaseUrl, group.id) }));
  plan.push({ key: 'with-tabs', parentKey: 'root', kind: 'folder', title: 'Groups with tabs' });
  groups.forEach((group) => {
    plan.push({ key: `folder-${group.id}`, parentKey: 'with-tabs', kind: 'folder', title: group.title });
    group.tabs.forEach((tab, index) => plan.push({ key: `tab-${group.id}-${index}`, parentKey: `folder-${group.id}`, kind: 'bookmark', title: tab.title, url: detailUrl(extensionBaseUrl, group.id, index) }));
  });
  return plan;
}

export function isOwnedPrototypeNode(node, provenance) {
  return Boolean(node && provenance.some((entry) => entry.id === node.id && entry.marker === MARKER));
}

export async function removeTrackedNodes(api, provenance) {
  for (const entry of [...provenance].reverse()) {
    if (entry.marker !== MARKER) continue;
    try {
      const [node] = await api.get(entry.id);
      if (isOwnedPrototypeNode(node, [entry])) await api.removeTree(entry.id);
    } catch {
      // A user may delete or move a prototype node; it is safe to forget it.
    }
  }
  return [];
}

export { MARKER };
