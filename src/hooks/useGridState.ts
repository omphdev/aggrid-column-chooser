import { useState, useCallback } from 'react';
import { ColumnItem, ColumnGroup } from '../types';

/**
 * A simple hook to manage grid state, replacing useDashboardState
 * Use this when you need to share grid state outside the Grid component
 */
export const useGridState = (initialState: {
  selectedColumns?: ColumnItem[],
  columnGroups?: ColumnGroup[],
  isFlatView?: boolean
} = {}) => {
  // State
  const [selectedColumns, setSelectedColumns] = useState<ColumnItem[]>(initialState.selectedColumns || []);
  const [columnGroups, setColumnGroups] = useState<ColumnGroup[]>(initialState.columnGroups || []);
  const [isFlatView, setIsFlatView] = useState<boolean>(initialState.isFlatView || false);
  
  // Callbacks
  const handleSelectedColumnsChange = useCallback((columns: ColumnItem[]) => {
    setSelectedColumns(columns);
  }, []);
  
  const handleColumnGroupsChange = useCallback((groups: ColumnGroup[]) => {
    setColumnGroups(groups);
  }, []);
  
  const toggleFlatView = useCallback(() => {
    setIsFlatView(prev => !prev);
  }, []);
  
  return {
    // State
    selectedColumns,
    columnGroups,
    isFlatView,
    
    // Actions
    setSelectedColumns: handleSelectedColumnsChange,
    setColumnGroups: handleColumnGroupsChange,
    toggleFlatView,
    
    // Selected column IDs for convenience
    selectedColumnIds: selectedColumns.map(col => col.id)
  };
};

export default useGridState;