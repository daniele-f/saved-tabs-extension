const STORAGE_KEY = 'scrollbarTestGroups';
const COLORS = new Set(['yellow', 'green', 'red', 'blue', 'purple']);
const STATES = new Set(['open', 'closed']);

const clone = (value) => structuredClone(value);

function isTab(tab) {
  return tab && typeof tab.title === 'string' && typeof tab.url === 'string';
}

function isGroup(group) {
  return group
    && typeof group.id === 'string'
    && typeof group.title === 'string'
    && COLORS.has(group.color)
    && STATES.has(group.state)
    && Array.isArray(group.tabs)
    && group.tabs.every(isTab);
}

function isValidGroupList(groups) {
  return Array.isArray(groups)
    && groups.every(isGroup)
    && new Set(groups.map((group) => group.id)).size === groups.length;
}

export function createGroupStore({ storage, loadDefaults }) {
  if (!storage || typeof storage.get !== 'function' || typeof storage.set !== 'function') {
    throw new TypeError('A storage adapter with get and set is required.');
  }

  async function defaults() {
    const groups = await loadDefaults();
    if (!isValidGroupList(groups)) throw new TypeError('Default mock groups are invalid.');
    return clone(groups);
  }

  async function save(groups) {
    await storage.set({ [STORAGE_KEY]: clone(groups) });
    return clone(groups);
  }

  return {
    async loadGroups() {
      const stored = await storage.get(STORAGE_KEY);
      if (isValidGroupList(stored?.[STORAGE_KEY])) return clone(stored[STORAGE_KEY]);
      return save(await defaults());
    },
    async resetGroups() {
      return save(await defaults());
    },
    async updateGroup(id, patch) {
      const allowed = ['title', 'color', 'state'];
      if (!patch || Object.keys(patch).some((key) => !allowed.includes(key))) {
        throw new TypeError('Only title, color, and state may be updated.');
      }
      const groups = await this.loadGroups();
      const group = groups.find((entry) => entry.id === id);
      if (!group) throw new RangeError(`Unknown mock group: ${id}`);
      const candidate = { ...group, ...patch };
      if (!isGroup(candidate)) throw new TypeError('Mock group update is invalid.');
      Object.assign(group, patch);
      return save(groups);
    },
    async deleteGroup(id) {
      const groups = await this.loadGroups();
      const filtered = groups.filter((group) => group.id !== id);
      if (filtered.length === groups.length) throw new RangeError(`Unknown mock group: ${id}`);
      return save(filtered);
    },
    async reorderGroups(ids) {
      const groups = await this.loadGroups();
      if (!Array.isArray(ids) || ids.length !== groups.length || new Set(ids).size !== groups.length) {
        throw new TypeError('Reorder must contain every mock group exactly once.');
      }
      const byId = new Map(groups.map((group) => [group.id, group]));
      if (ids.some((id) => !byId.has(id))) throw new TypeError('Reorder contains an unknown mock group.');
      return save(ids.map((id) => byId.get(id)));
    },
  };
}

export async function loadDefaultGroups(fetchImpl = fetch, sourceUrl = browser.runtime.getURL('data/default-groups.json')) {
  const response = await fetchImpl(sourceUrl);
  if (!response.ok) throw new Error(`Unable to load mock groups: ${response.status}`);
  return response.json();
}

export function extensionGroupStore() {
  return createGroupStore({ storage: browser.storage.local, loadDefaults: loadDefaultGroups });
}
