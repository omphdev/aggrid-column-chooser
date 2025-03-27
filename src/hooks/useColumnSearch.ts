import { useState, useCallback, useMemo } from 'react';
import { ColumnItem } from '../types';
import { filterEmptyGroups } from '../utils/columnUtils';

interface UseColumnSearchProps {
  availableColumns: ColumnItem[];
  selectedColumns: ColumnItem[];
}

export const useColumnSearch = ({ availableColumns, selectedColumns }: UseColumnSearchProps) => {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOnlyAvailable, setSearchOnlyAvailable] = useState(true);

  // Filter columns based on search term
  const filterColumnsBySearch = useCallback((items: ColumnItem[], term: string): ColumnItem[] => {
    if (!term) return items;
    
    const searchLower = term.toLowerCase();
    
    const filterItem = (item: ColumnItem): boolean => {
      const matchesSearch = item.name.toLowerCase().includes(searchLower);
      if (item.children && item.children.length > 0) {
        const filteredChildren = item.children.filter(filterItem);
        if (filteredChildren.length > 0) {
          item.children = filteredChildren;
          return true;
        }
        return false;
      }
      return matchesSearch;
    };

    return items.filter(filterItem);
  }, []);

  // Filtered available columns (remove empty groups and apply search)
  const filteredAvailableColumns = useMemo(() => {
    let filtered = filterEmptyGroups(availableColumns);
    if (searchTerm) {
      filtered = filterColumnsBySearch(filtered, searchTerm);
    }
    return filtered;
  }, [availableColumns, searchTerm, filterColumnsBySearch]);

  // Filtered selected columns based on search
  const filteredSelectedColumns = useMemo(() => {
    if (!searchTerm || searchOnlyAvailable) return selectedColumns;
    return filterColumnsBySearch(selectedColumns, searchTerm);
  }, [selectedColumns, searchTerm, searchOnlyAvailable, filterColumnsBySearch]);

  return {
    searchTerm,
    setSearchTerm,
    searchOnlyAvailable,
    setSearchOnlyAvailable,
    filteredAvailableColumns,
    filteredSelectedColumns,
  };
}; 