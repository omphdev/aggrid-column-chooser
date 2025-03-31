import { useState, useCallback, useMemo } from 'react';
import { ExtendedColDef } from '../components/types';

interface UseColumnFilteringProps {
  availableColumns: ExtendedColDef[];
  selectedColumns: ExtendedColDef[];
  localColumnGroups: any[];
}

interface FilterState {
  field: string;
  operator: string;
  value: string;
}

export const useColumnFiltering = ({
  availableColumns,
  selectedColumns,
  localColumnGroups
}: UseColumnFilteringProps) => {
  const [filters, setFilters] = useState<FilterState[]>([]);

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

  // Function to apply filters to columns
  const applyFilters = useCallback((columns: ExtendedColDef[]) => {
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

  // Function to apply filters to groups
  const applyFiltersToGroups = useCallback((groups: any[]) => {
    if (filters.length === 0) return groups;
    
    return groups.map(group => ({
      ...group,
      columns: applyFilters(group.columns)
    })).filter(group => group.columns.length > 0);
  }, [filters, applyFilters]);

  // Memoized filtered results
  const filteredResults = useMemo(() => ({
    availableColumns: applyFilters(availableColumns),
    selectedColumns: applyFilters(selectedColumns),
    groups: applyFiltersToGroups(localColumnGroups)
  }), [
    availableColumns,
    selectedColumns,
    localColumnGroups,
    applyFilters,
    applyFiltersToGroups
  ]);

  return {
    filters,
    addFilter,
    removeFilter,
    updateFilter,
    clearFilters,
    filteredResults
  };
}; 