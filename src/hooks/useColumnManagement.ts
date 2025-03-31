import { useState, useCallback, useRef, useMemo } from 'react';
import { ExtendedColDef, ColumnGroup } from '../components/types';

interface UseColumnManagementProps {
  availableColumns: ExtendedColDef[];
  selectedColumns: ExtendedColDef[];
  localColumnGroups: ColumnGroup[];
  onColumnChanged: (columns: ExtendedColDef[], operation: string) => void;
  setAvailableColumns: (columns: ExtendedColDef[]) => void;
  setSelectedColumns: (columns: ExtendedColDef[]) => void;
}

export const useColumnManagement = ({
  availableColumns,
  selectedColumns,
  localColumnGroups,
  onColumnChanged,
  setAvailableColumns,
  setSelectedColumns
}: UseColumnManagementProps) => {
  // Flag to prevent multiple state updates during reordering
  const isReorderingRef = useRef<boolean>(false);
  const lastReorderTimeRef = useRef<number>(0);

  // Initialize columns and groups
  const initializeColumns = useCallback((columns: ExtendedColDef[]) => {
    setAvailableColumns(columns);
    setSelectedColumns([]);
  }, [setAvailableColumns, setSelectedColumns]);

  // Function to add columns to selected panel
  const addColumns = useCallback((columnIds: string[]) => {
    const columnsToAdd = availableColumns.filter(col => columnIds.includes(col.field));
    const newSelectedColumns = [...selectedColumns, ...columnsToAdd];
    
    setSelectedColumns(newSelectedColumns);
    onColumnChanged(newSelectedColumns, 'ADD');
  }, [availableColumns, selectedColumns, onColumnChanged]);

  // Function to remove columns from selected panel
  const removeColumns = useCallback((columnIds: string[]) => {
    const newSelectedColumns = selectedColumns.filter(col => !columnIds.includes(col.field));
    
    setSelectedColumns(newSelectedColumns);
    onColumnChanged(newSelectedColumns, 'REMOVE');
  }, [selectedColumns, onColumnChanged]);

  // Function to reorder columns
  const reorderColumns = useCallback((columnIds: string[]) => {
    if (isReorderingRef.current) return;
    
    const now = Date.now();
    if (now - lastReorderTimeRef.current < 100) return;
    
    isReorderingRef.current = true;
    lastReorderTimeRef.current = now;
    
    const newSelectedColumns = columnIds
      .map(id => selectedColumns.find(col => col.field === id))
      .filter((col): col is ExtendedColDef => col !== undefined);
    
    setSelectedColumns(newSelectedColumns);
    onColumnChanged(newSelectedColumns, 'REORDER');
    
    setTimeout(() => {
      isReorderingRef.current = false;
    }, 100);
  }, [selectedColumns, onColumnChanged]);

  // Function to update column properties
  const updateColumn = useCallback((columnId: string, updates: Partial<ExtendedColDef>) => {
    const newSelectedColumns = selectedColumns.map(col => 
      col.field === columnId ? { ...col, ...updates } : col
    );
    
    setSelectedColumns(newSelectedColumns);
    onColumnChanged(newSelectedColumns, 'UPDATE');
  }, [selectedColumns, onColumnChanged]);

  // Function to clear selected columns
  const clearSelectedColumns = useCallback(() => {
    setSelectedColumns([]);
    onColumnChanged([], 'CLEAR');
  }, [onColumnChanged]);

  // Memoized column management state
  const columnManagementState = useMemo(() => ({
    availableColumns,
    selectedColumns,
    localColumnGroups,
    getColumnById: (columnId: string) => 
      selectedColumns.find(col => col.field === columnId) ||
      availableColumns.find(col => col.field === columnId)
  }), [availableColumns, selectedColumns, localColumnGroups]);

  return {
    ...columnManagementState,
    initializeColumns,
    addColumns,
    removeColumns,
    reorderColumns,
    updateColumn,
    clearSelectedColumns
  };
}; 