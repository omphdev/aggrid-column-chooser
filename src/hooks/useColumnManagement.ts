// hooks/useColumnManagement.ts
import { useState, useCallback, useEffect, useMemo } from 'react';
import { ColumnItem, ColumnDefinition } from '../types';
import { ColDef, GridApi } from 'ag-grid-community';
import { 
  toggleExpand,
  countSelectedItems,
  convertToAgGridColumns
} from '../utils/treeUtils';
import {
  toggleSelect,
  selectAll,
  clearSelection
} from '../utils/selectionUtils';
import {
  handleDragStartForAvailable,
  handleDragStartForSelected,
  processDragDrop
} from '../utils/dragDropUtils';
import { 
  convertToFlatColumns,
  getLeafNodeIds 
} from '../utils/columnConverter';

// Export the props interface
export interface ColumnManagementProps {
  allPossibleColumns: ColumnItem[];
  mockData: any[];
  onSelectedColumnsChange?: (columns: ColumnDefinition[]) => void;
}

export const useColumnManagement = ({ 
  allPossibleColumns,
  mockData,
  onSelectedColumnsChange
}: ColumnManagementProps) => {
  // State for the main grid columns and data
  const [rowData, setRowData] = useState<any[]>([]);
  const [mainGridColumns, setMainGridColumns] = useState<ColDef[]>([]);
  
  // State for the column chooser
  const [availableColumns, setAvailableColumns] = useState<ColumnItem[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<ColumnItem[]>([]);
  
  // Grid API references
  const [mainGridApi, setMainGridApi] = useState<GridApi | null>(null);

  // State to track last selected item (for shift-click range selection)
  const [lastSelectedAvailableId, setLastSelectedAvailableId] = useState<string | null>(null);
  const [lastSelectedSelectedId, setLastSelectedSelectedId] = useState<string | null>(null);

  // Memoized values
  const selectedAvailableCount = useMemo(() => 
    countSelectedItems(availableColumns), [availableColumns]
  );
  
  const selectedSelectedCount = useMemo(() => 
    countSelectedItems(selectedColumns), [selectedColumns]
  );

  // Default column definitions for the main grid
  const defaultColDef = useMemo<ColDef>(() => ({
    flex: 1,
    minWidth: 100,
    resizable: true,
    sortable: true,
    filter: true
  }), []);

  // Toggle expand for available columns
  const toggleExpandAvailable = useCallback((itemId: string) => {
    setAvailableColumns(prev => toggleExpand(prev, itemId));
  }, []);

  // Toggle expand for selected columns
  const toggleExpandSelected = useCallback((itemId: string) => {
    setSelectedColumns(prev => toggleExpand(prev, itemId));
  }, []);

  // Update main grid columns and notify of changes if callback provided
  const updateMainGridColumns = useCallback((selectedCols: ColumnItem[]) => {
    const newColumns = convertToAgGridColumns(selectedCols);
    setMainGridColumns(newColumns);
    
    // If there's a callback to notify of selected columns changes
    if (onSelectedColumnsChange) {
      const flatColumns = convertToFlatColumns(selectedCols);
      onSelectedColumnsChange(flatColumns);
    }
  }, [onSelectedColumnsChange]);

  // Toggle selection handlers
  const toggleSelectAvailable = useCallback((itemId: string, isMultiSelect: boolean, isRangeSelect: boolean) => {
    const [updatedColumns, updatedLastSelected] = toggleSelect(
      availableColumns,
      itemId,
      isMultiSelect,
      isRangeSelect,
      lastSelectedAvailableId
    );
    
    setAvailableColumns(updatedColumns);
    setLastSelectedAvailableId(updatedLastSelected);
  }, [availableColumns, lastSelectedAvailableId]);

  const toggleSelectSelected = useCallback((itemId: string, isMultiSelect: boolean, isRangeSelect: boolean) => {
    const [updatedColumns, updatedLastSelected] = toggleSelect(
      selectedColumns,
      itemId,
      isMultiSelect,
      isRangeSelect,
      lastSelectedSelectedId
    );
    
    setSelectedColumns(updatedColumns);
    setLastSelectedSelectedId(updatedLastSelected);
  }, [selectedColumns, lastSelectedSelectedId]);

  // Select all handlers
  const selectAllAvailable = useCallback(() => {
    setAvailableColumns(prev => selectAll(prev));
  }, []);

  const selectAllSelected = useCallback(() => {
    setSelectedColumns(prev => selectAll(prev));
  }, []);

  // Clear selection handlers
  const clearSelectionAvailable = useCallback(() => {
    setAvailableColumns(prev => clearSelection(prev));
    setLastSelectedAvailableId(null);
  }, []);

  const clearSelectionSelected = useCallback(() => {
    setSelectedColumns(prev => clearSelection(prev));
    setLastSelectedSelectedId(null);
  }, []);

  // Event handlers for drag and drop
  const handleAvailableItemDragStart = useCallback((e: React.DragEvent, item: ColumnItem) => {
    handleDragStartForAvailable(e, item, availableColumns);
  }, [availableColumns]);

  const handleSelectedItemDragStart = useCallback((e: React.DragEvent, item: ColumnItem) => {
    handleDragStartForSelected(e, item, selectedColumns);
  }, [selectedColumns]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDropToSelected = useCallback((e: React.DragEvent) => {
    const clearSelections = () => {
      clearSelectionAvailable();
      clearSelectionSelected();
    };
    
    const { newAvailable, newSelected } = processDragDrop(
      e, 
      'available', 
      availableColumns, 
      selectedColumns, 
      allPossibleColumns,
      clearSelections
    );
    
    setAvailableColumns(newAvailable);
    setSelectedColumns(newSelected);
    updateMainGridColumns(newSelected);
  }, [availableColumns, selectedColumns, allPossibleColumns, clearSelectionAvailable, clearSelectionSelected, updateMainGridColumns]);

  const handleDropToAvailable = useCallback((e: React.DragEvent) => {
    const clearSelections = () => {
      clearSelectionAvailable();
      clearSelectionSelected();
    };
    
    const { newAvailable, newSelected } = processDragDrop(
      e, 
      'selected', 
      availableColumns, 
      selectedColumns, 
      allPossibleColumns,
      clearSelections
    );
    
    setAvailableColumns(newAvailable);
    setSelectedColumns(newSelected);
    updateMainGridColumns(newSelected);
  }, [availableColumns, selectedColumns, allPossibleColumns, clearSelectionAvailable, clearSelectionSelected, updateMainGridColumns]);

  // Initialize state
  useEffect(() => {
    // Set initial data
    setRowData(mockData);
    
    // Set up initial available columns (all possible columns with expanded state)
    setAvailableColumns(allPossibleColumns);
    
    // Set up initial selected columns (empty)
    setSelectedColumns([]);
    
    // Set up initial main grid columns (empty)
    updateMainGridColumns([]);
  }, [allPossibleColumns, mockData, updateMainGridColumns]);

  // Handle grid ready event
  const onGridReady = useCallback((params: { api: GridApi }) => {
    setMainGridApi(params.api);
  }, []);

  return {
    // State
    rowData,
    mainGridColumns,
    availableColumns,
    selectedColumns,
    mainGridApi,
    defaultColDef,
    selectedAvailableCount,
    selectedSelectedCount,
    
    // Event handlers
    toggleExpandAvailable,
    toggleExpandSelected,
    toggleSelectAvailable,
    toggleSelectSelected,
    selectAllAvailable,
    selectAllSelected,
    clearSelectionAvailable,
    clearSelectionSelected,
    handleAvailableItemDragStart,
    handleSelectedItemDragStart,
    handleDragOver,
    handleDropToSelected,
    handleDropToAvailable,
    onGridReady
  };
};