export function filterGroupsBySearch(groups, query) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return groups;

  return groups.flatMap((group) => {
    const groupMatches = group.title.toLocaleLowerCase().includes(normalizedQuery);
    const visibleTabs = group.tabs.filter((tab) => (
      tab.title.toLocaleLowerCase().includes(normalizedQuery)
      || tab.url?.toLocaleLowerCase().includes(normalizedQuery)
    ));
    if (!groupMatches && !visibleTabs.length) return [];
    return [{
      ...group,
      visibleTabs: groupMatches ? group.tabs : visibleTabs,
      hiddenTabs: groupMatches ? [] : group.tabs.filter((tab) => !visibleTabs.includes(tab)),
      forceExpanded: true,
    }];
  });
}
