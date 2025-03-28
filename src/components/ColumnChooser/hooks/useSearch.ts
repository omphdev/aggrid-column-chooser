import { useCallback } from 'react';
import { useColumnChooser } from '../context/ColumnChooserContext';
import { filterTree } from '../utils/treeUtils';

/**
 * Custom hook for search functionality
 */
export function useSearch() {
  const { state, dispatch } = useColumnChooser();
  
  // Handle available columns search
  const handleAvailableSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ 
      type: 'SET_AVAILABLE_SEARCH_QUERY', 
      payload: e.target.value 
    });
  }, [dispatch]);
  
  // Handle selected columns search
  const handleSelectedSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ 
      type: 'SET_SELECTED_SEARCH_QUERY', 
      payload: e.target.value 
    });
  }, [dispatch]);
  
  // Filter available columns based on search
  const filteredAvailableColumns = filterTree(
    state.availableColumns, 
    state.availableSearchQuery
  );
  
  // Filter selected columns based on search
  const filteredSelectedColumns = state.selectedSearchQuery
    ? state.selectedColumns.filter(col => 
        col.name.toLowerCase().includes(state.selectedSearchQuery.toLowerCase())
      )
    : state.selectedColumns;
  
  // Filter groups based on search
  const filteredGroups = state.selectedSearchQuery
    ? state.selectedGroups.filter(group => {
        const searchLower = state.selectedSearchQuery.toLowerCase();
        
        // Check if group name matches
        if (group.name.toLowerCase().includes(searchLower)) return true;
        
        // Check if any columns in the group match
        const groupColumns = state.selectedColumns.filter(col => 
          group.children.includes(col.id)
        );
        return groupColumns.some(col => 
          col.name.toLowerCase().includes(searchLower)
        );
      })
    : state.selectedGroups;
  
  return {
    availableSearchQuery: state.availableSearchQuery,
    selectedSearchQuery: state.selectedSearchQuery,
    handleAvailableSearchChange,
    handleSelectedSearchChange,
    filteredAvailableColumns,
    filteredSelectedColumns,
    filteredGroups
  };
}