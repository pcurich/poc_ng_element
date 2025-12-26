export function filterByPredicate<T>(
  items: T[],
  filter: Partial<T> | ((item: T) => boolean)
): T[] {
  if (typeof filter === 'function') {
    return items.filter(filter);
  }

  return items.filter(item => {
    for (const [key, value] of Object.entries(filter)) {
      if ((item as any)[key] !== value) {
        return false;
      }
    }
    return true;
  });
}

export function sortBy<T>(
  items: T[],
  key: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    const aValue = a[key];
    const bValue = b[key];
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

export function uniqueBy<T>(items: T[], key: keyof T): T[] {
  const seen = new Set();
  return items.filter(item => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}