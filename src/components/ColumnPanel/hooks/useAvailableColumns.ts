import { useState, useEffect } from 'react';
import { ExtendedColDef } from '../../types';

export interface UseAvailableColumnsProps {
  columnDefs: ExtendedColDef[];
  isReorderingRef: React.MutableRefObject<boolean>;
}

export function useAvailableColumns({
  columnDefs,
  isReorderingRef
}: UseAvailableColumnsProps) {
  // State for available columns
  const [availableColumns, setAvailableColumns] = useState<ExtendedColDef[]>([]);

  // Initialize available columns (columns with hide: true)
  useEffect(() => {
    // Don't update if we're in the middle of a reordering operation
    if (isReorderingRef.current) return;
    
    setAvailableColumns(columnDefs.filter(col => col.hide === true));
  }, [columnDefs, isReorderingRef]);

  // Function to add columns to a group in the available panel
  const addToGroup = (groupPath: string[], columnIds: string[]): string => {
    if (columnIds.length === 0 || !groupPath.length) return '';  // Return empty string instead of undefined
    
    // Create a deep copy of available columns
    const newAvailableColumns = JSON.parse(JSON.stringify(availableColumns));
    
    // Update group path for each selected column
    columnIds.forEach(columnId => {
      const columnIndex = newAvailableColumns.findIndex(col => col.field === columnId);
      if (columnIndex !== -1) {
        newAvailableColumns[columnIndex].groupPath = [...groupPath];
      }
    });
    
    // Update state
    setAvailableColumns(newAvailableColumns);
    
    return groupPath.join('.');
  };

  // Function to create a new group in the available panel
  const createNewGroup = (groupName: string, columnIds: string[]): string => {
    if (!groupName || columnIds.length === 0) return '';
    
    // Create a deep copy of available columns
    const newAvailableColumns = JSON.parse(JSON.stringify(availableColumns));
    
    // Update group path for each selected column
    columnIds.forEach(columnId => {
      const columnIndex = newAvailableColumns.findIndex(col => col.field === columnId);
      if (columnIndex !== -1) {
        newAvailableColumns[columnIndex].groupPath = [groupName];
      }
    });
    
    // Update state
    setAvailableColumns(newAvailableColumns);
    
    return groupName;
  };
  
  return {
    availableColumns,
    setAvailableColumns,
    addToGroup,
    createNewGroup
  };
}