const STORAGE_KEY = 'inactiveGroups';
const COLORS = new Set(['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange']);

const clone = (value) => structuredClone(value);

function isSnapshot(snapshot) {
  return snapshot
    && typeof snapshot.id === 'string'
    && typeof snapshot.title === 'string'
    && COLORS.has(snapshot.color)
    && typeof snapshot.collapsed === 'boolean'
    && typeof snapshot.closedAt === 'string'
    && Array.isArray(snapshot.tabs)
    && snapshot.tabs.length > 0
    && snapshot.tabs.every((tab) => tab && typeof tab.url === 'string' && tab.url && typeof tab.title === 'string');
}

export function createInactiveGroupStore({ storage, makeId = () => crypto.randomUUID(), now = () => new Date().toISOString() }) {
  if (!storage || typeof storage.get !== 'function' || typeof storage.set !== 'function') {
    throw new TypeError('A storage adapter with get and set is required.');
  }
  const load = async () => {
    const value = (await storage.get(STORAGE_KEY))?.[STORAGE_KEY];
    return Array.isArray(value) && value.every(isSnapshot) ? clone(value) : [];
  };
  const save = async (snapshots) => {
    await storage.set({ [STORAGE_KEY]: clone(snapshots) });
    return clone(snapshots);
  };

  return {
    async listInactiveGroups() {
      return load();
    },
    async saveInactiveGroup(group) {
      const snapshot = { id: makeId(), closedAt: now(), ...clone(group) };
      if (!isSnapshot(snapshot)) throw new TypeError('Inactive group snapshot is invalid.');
      const snapshots = await load();
      snapshots.push(snapshot);
      await save(snapshots);
      return clone(snapshot);
    },
    async removeInactiveGroup(id) {
      const snapshots = await load();
      const remaining = snapshots.filter((snapshot) => snapshot.id !== id);
      await save(remaining);
      return remaining;
    },
  };
}

export function extensionInactiveGroupStore() {
  return createInactiveGroupStore({ storage: browser.storage.local });
}
