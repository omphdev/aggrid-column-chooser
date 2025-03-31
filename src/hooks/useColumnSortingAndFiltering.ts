import { useState, useCallback, useMemo } from 'react';
import { ExtendedColDef } from '../components/types';

interface UseColumnSortingAndFilteringProps {
  availableColumns: ExtendedColDef[];
  selectedColumns: ExtendedColDef[];
  localColumnGroups: any[];
}

type SortField = 'headerName' | 'field';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  field: string;
  operator: string;
  value: string;
}

export const useColumnSortingAndFiltering = ({
  availableColumns,
  selectedColumns,
  localColumnGroups
}: UseColumnSortingAndFilteringProps) => {
  const [sortField, setSortField] = useState<SortField>('headerName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState<FilterState[]>([]);

  // Function to sort columns
  const sortColumns = useCallback((columns: ExtendedColDef[], field: SortField, direction: SortDirection) => {
    return [...columns].sort((a, b) => {
      const aValue = a[field]?.toLowerCase() || '';
      const bValue = b[field]?.toLowerCase() || '';
      
      if (direction === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  }, []);

  // Function to filter columns
  const filterColumns = useCallback((columns: ExtendedColDef[]) => {
    if (filters.length === 0) return columns;
    
    return columns.filter(col => {
      return filters.every(filter => {
        const value = col[filter.field as keyof ExtendedColDef]?.toString().toLowerCase() || '';
        const filterValue = filter.value.toLowerCase();
        
        switch (filter.operator) {
          case 'contains':
            return value.includes(filterValue);
          case 'equals':
            return value === filterValue;
          case 'startsWith':
            return value.startsWith(filterValue);
          case 'endsWith':
            return value.endsWith(filterValue);
          default:
            return true;
        }
      });
    });
  }, [filters]);

  // Function to sort and filter columns
  const sortAndFilterColumns = useCallback((columns: ExtendedColDef[]) => {
    const filteredColumns = filterColumns(columns);
    return sortColumns(filteredColumns, sortField, sortDirection);
  }, [filterColumns, sortColumns, sortField, sortDirection]);

  // Function to sort and filter groups
  const sortAndFilterGroups = useCallback((groups: any[]) => {
    if (filters.length === 0) return groups;
    
    return groups.map(group => ({
      ...group,
      columns: sortAndFilterColumns(group.columns)
    })).filter(group => group.columns.length > 0);
  }, [filters, sortAndFilterColumns]);

  // Function to handle sort field change
  const handleSortFieldChange = useCallback((field: SortField) => {
    setSortField(field);
    setSortDirection('asc');
  }, []);

  // Function to handle sort direction toggle
  const handleSortDirectionToggle = useCallback(() => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  // Function to add a filter
  const addFilter = useCallback((filter: FilterState) => {
    setFilters(prev => [...prev, filter]);
  }, []);

  // Function to remove a filter
  const removeFilter = useCallback((field: string) => {
    setFilters(prev => prev.filter(f => f.field !== field));
  }, []);

  // Function to update a filter
  const updateFilter = useCallback((field: string, updates: Partial<FilterState>) => {
    setFilters(prev => prev.map(f => 
      f.field === field ? { ...f, ...updates } : f
    ));
  }, []);

  // Function to clear all filters
  const clearFilters = useCallback(() => {
    setFilters([]);
  }, []);

  // Memoized sorted and filtered results
  const sortedAndFilteredResults = useMemo(() => ({
    availableColumns: sortAndFilterColumns(availableColumns),
    selectedColumns: sortAndFilterColumns(selectedColumns),
    groups: sortAndFilterGroups(localColumnGroups)
  }), [
    availableColumns,
    selectedColumns,
    localColumnGroups,
    sortAndFilterColumns,
    sortAndFilterGroups
  ]);

  return {
    sortField,
    sortDirection,
    filters,
    handleSortFieldChange,
    handleSortDirectionToggle,
    addFilter,
    removeFilter,
    updateFilter,
    clearFilters,
    sortedAndFilteredResults
  };
}; 