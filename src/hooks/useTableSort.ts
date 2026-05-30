import { useState, useMemo, useCallback } from 'react';

type SortDirection = 'asc' | 'desc' | null;

interface UseTableSortOptions<T> {
  defaultField?: keyof T;
  defaultDirection?: SortDirection;
}

export function useTableSort<T>(items: T[], options: UseTableSortOptions<T> = {}) {
  const { defaultField, defaultDirection = null } = options;
  const [sortField, setSortField] = useState<keyof T | null>(defaultField ?? null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultDirection);

  const handleSort = useCallback((field: keyof T) => {
    if (sortField === field) {
      setSortDirection((prev) =>
        prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'
      );
      if (sortDirection === 'desc') setSortField(null);
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  const sortedItems = useMemo(() => {
    if (!sortField || !sortDirection) return items;
    return [...items].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [items, sortField, sortDirection]);

  const getSortIcon = useCallback((field: keyof T) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : sortDirection === 'desc' ? '↓' : null;
  }, [sortField, sortDirection]);

  return {
    sortedItems,
    sortField,
    sortDirection,
    handleSort,
    getSortIcon,
  };
}
