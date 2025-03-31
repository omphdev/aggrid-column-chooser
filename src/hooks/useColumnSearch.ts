import { useState, useCallback, useMemo } from 'react';
import { ExtendedColDef } from '../components/types';

interface UseColumnSearchProps {
  availableColumns: ExtendedColDef[];
  selectedColumns: ExtendedColDef[];
  localColumnGroups: any[];
}

export const useColumnSearch = ({
  availableColumns,
  selectedColumns,
  localColumnGroups
}: UseColumnSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAvailableColumns, setFilteredAvailableColumns] = useState<ExtendedColDef[]>([]);
  const [filteredSelectedColumns, setFilteredSelectedColumns] = useState<ExtendedColDef[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<any[]>([]);

  // Function to filter columns based on search term
  const filterColumns = useCallback((columns: ExtendedColDef[], term: string) => {
    if (!term) return columns;
    
    const searchLower = term.toLowerCase();
    return columns.filter(col => 
      col.headerName?.toLowerCase().includes(searchLower) ||
      col.field.toLowerCase().includes(searchLower)
    );
  }, []);

  // Function to filter groups based on search term
  const filterGroups = useCallback((groups: any[], term: string) => {
    if (!term) return groups;
    
    const searchLower = term.toLowerCase();
    return groups.filter(group => {
      const groupNameMatch = group.name.toLowerCase().includes(searchLower);
      const columnMatches = group.columns.some((col: ExtendedColDef) =>
        col.headerName?.toLowerCase().includes(searchLower) ||
        col.field.toLowerCase().includes(searchLower)
      );
      
      return groupNameMatch || columnMatches;
    }).map(group => ({
      ...group,
      columns: filterColumns(group.columns, term)
    }));
  }, [filterColumns]);

  // Function to handle search term changes
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    
    const filteredAvailable = filterColumns(availableColumns, term);
    const filteredSelected = filterColumns(selectedColumns, term);
    const filteredGroupList = filterGroups(localColumnGroups, term);
    
    setFilteredAvailableColumns(filteredAvailable);
    setFilteredSelectedColumns(filteredSelected);
    setFilteredGroups(filteredGroupList);
  }, [availableColumns, selectedColumns, localColumnGroups, filterColumns, filterGroups]);

  // Memoized filtered results
  const filteredResults = useMemo(() => ({
    availableColumns: searchTerm ? filteredAvailableColumns : availableColumns,
    selectedColumns: searchTerm ? filteredSelectedColumns : selectedColumns,
    groups: searchTerm ? filteredGroups : localColumnGroups
  }), [
    searchTerm,
    filteredAvailableColumns,
    filteredSelectedColumns,
    filteredGroups,
    availableColumns,
    selectedColumns,
    localColumnGroups
  ]);

  return {
    searchTerm,
    handleSearch,
    filteredResults
  };
}; 