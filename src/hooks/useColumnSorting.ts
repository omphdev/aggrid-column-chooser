import { useState, useCallback, useMemo } from 'react';
import { ExtendedColDef } from '../components/types';

interface UseColumnSortingProps {
  availableColumns: ExtendedColDef[];
  selectedColumns: ExtendedColDef[];
  localColumnGroups: any[];
}

type SortField = 'headerName' | 'field';
type SortDirection = 'asc' | 'desc';

export const useColumnSorting = ({
  availableColumns,
  selectedColumns,
  localColumnGroups
}: UseColumnSortingProps) => {
  const [sortField, setSortField] = useState<SortField>('headerName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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

  // Function to sort groups
  const sortGroups = useCallback((groups: any[], field: SortField, direction: SortDirection) => {
    return [...groups].sort((a, b) => {
      const aValue = a.name.toLowerCase();
      const bValue = b.name.toLowerCase();
      
      if (direction === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    }).map(group => ({
      ...group,
      columns: sortColumns(group.columns, field, direction)
    }));
  }, [sortColumns]);

  // Function to handle sort field change
  const handleSortFieldChange = useCallback((field: SortField) => {
    setSortField(field);
    setSortDirection('asc');
  }, []);

  // Function to handle sort direction toggle
  const handleSortDirectionToggle = useCallback(() => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  // Memoized sorted results
  const sortedResults = useMemo(() => ({
    availableColumns: sortColumns(availableColumns, sortField, sortDirection),
    selectedColumns: sortColumns(selectedColumns, sortField, sortDirection),
    groups: sortGroups(localColumnGroups, sortField, sortDirection)
  }), [
    availableColumns,
    selectedColumns,
    localColumnGroups,
    sortField,
    sortDirection,
    sortColumns,
    sortGroups
  ]);

  return {
    sortField,
    sortDirection,
    handleSortFieldChange,
    handleSortDirectionToggle,
    sortedResults
  };
}; 