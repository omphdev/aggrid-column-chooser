// hooks/useColumnManagement.ts
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { ColumnItem, ColumnDefinition, PositionedDragEvent } from '../types';
import { ColDef, GridApi } from 'ag-grid-community';
import { 
  toggleExpand,
  countSelectedItems,
  convertToAgGridColumns,
  findItemInTree,
  removeItemFromTree,
  deepCloneColumnItem
} from '../utils/treeUtils';
import {
  toggleSelect,
  selectAll,
  clearSelection
} from '../utils/selectionUtils';
import {
  handleDragStartForAvailable,
  handleDragStartForSelected,
  processDragDrop,
  insertItemIntoTreeAtIndex,
  insertItemIntoFlatList
} from '../utils/dragDropUtils';
import { 
  convertToFlatColumns,
  getLeafNodeIds,
  flattenTree
} from '../utils/columnConverter';

// Export the props interface
export interface ColumnManagementProps {
  allPossibleColumns: ColumnItem[];
  mockData: any[];
  onSelectedColumnsChange?: (columns: ColumnDefinition[]) => void;
  flatViewSelected?: boolean;
}

export const useColumnManagement = ({ 
  allPossibleColumns,
  mockData,
  onSelectedColumnsChange,
  flatViewSelected = false
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

  // Track the flat view state internally too
  const [isFlatView, setIsFlatView] = useState(flatViewSelected);
  
  // Update the internal flat view state when the prop changes
  useEffect(() => {
    setIsFlatView(flatViewSelected);
  }, [flatViewSelected]);

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
      lastSelectedAvailableId,
      false // Available columns are usually not in flat view
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
      lastSelectedSelectedId,
      isFlatView // Pass the current flat view state
    );
    
    setSelectedColumns(updatedColumns);
    setLastSelectedSelectedId(updatedLastSelected);
  }, [selectedColumns, lastSelectedSelectedId, isFlatView]);

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

  // Enhanced drop handlers for positioned drops
  const handleDropToSelected = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const positionedEvent = e as PositionedDragEvent;
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain')) as { 
        ids: string[], 
        source: string 
      };
      
      if (data.source === 'available' && data.ids && data.ids.length > 0) {
        // Create new arrays to avoid mutation
        let newAvailable = [...availableColumns];
        let newSelected = [...selectedColumns];
        
        // Get drop position information
        const targetId = positionedEvent.dropPosition?.targetId;
        const insertBefore = positionedEvent.dropPosition?.insertBefore ?? true;
        
        // Process each selected item
        for (const draggedItemId of data.ids) {
          const draggedItem = findItemInTree(availableColumns, draggedItemId);
          
          if (draggedItem) {
            // Clone the dragged item
            const clonedItem = deepCloneColumnItem(draggedItem);
            
            // Remove from available
            newAvailable = removeItemFromTree(newAvailable, draggedItemId);
            
            // Add to selected at the specific position
            if (isFlatView) {
              newSelected = insertItemIntoFlatList(
                newSelected, 
                clonedItem, 
                allPossibleColumns,
                targetId, 
                insertBefore
              );
            } else {
              newSelected = insertItemIntoTreeAtIndex(
                newSelected, 
                clonedItem, 
                allPossibleColumns,
                targetId,
                insertBefore
              );
            }
          }
        }
        
        // Update states
        setAvailableColumns(newAvailable);
        setSelectedColumns(newSelected);
        
        // Update main grid
        updateMainGridColumns(newSelected);
        
        // Clear selections after drag
        clearSelectionAvailable();
        clearSelectionSelected();
      }
    } catch (err) {
      console.error('Error processing drag data:', err);
    }
  }, [availableColumns, selectedColumns, allPossibleColumns, clearSelectionAvailable, clearSelectionSelected, updateMainGridColumns, isFlatView]);

  const handleDropToAvailable = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const positionedEvent = e as PositionedDragEvent;
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain')) as { 
        ids: string[], 
        source: string 
      };
      
      if (data.source === 'selected' && data.ids && data.ids.length > 0) {
        // Create new arrays to avoid mutation
        let newAvailable = [...availableColumns];
        let newSelected = [...selectedColumns];
        
        // Get drop position information
        const targetId = positionedEvent.dropPosition?.targetId;
        const insertBefore = positionedEvent.dropPosition?.insertBefore ?? true;
        
        // Process each selected item
        for (const draggedItemId of data.ids) {
          const draggedItem = findItemInTree(selectedColumns, draggedItemId);
          
          if (draggedItem) {
            // Clone the dragged item
            const clonedItem = deepCloneColumnItem(draggedItem);
            
            // Remove from selected
            newSelected = removeItemFromTree(newSelected, draggedItemId);
            
            // Add to available at the specific position
            // We don't use flat view for available columns normally, but the logic is here
            if (false) { // Could make this configurable if needed
              newAvailable = insertItemIntoFlatList(
                newAvailable, 
                clonedItem, 
                allPossibleColumns,
                targetId, 
                insertBefore
              );
            } else {
              newAvailable = insertItemIntoTreeAtIndex(
                newAvailable, 
                clonedItem, 
                allPossibleColumns,
                targetId,
                insertBefore
              );
            }
          }
        }
        
        // Update states
        setAvailableColumns(newAvailable);
        setSelectedColumns(newSelected);
        
        // Update main grid
        updateMainGridColumns(newSelected);
        
        // Clear selections after drag
        clearSelectionAvailable();
        clearSelectionSelected();
      }
    } catch (err) {
      console.error('Error processing drag data:', err);
    }
  }, [availableColumns, selectedColumns, allPossibleColumns, clearSelectionAvailable, clearSelectionSelected, updateMainGridColumns, isFlatView]);

  // Handler for reordering within the selected columns panel
  const handleSelectedItemReorder = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const positionedEvent = e as PositionedDragEvent;
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain')) as { 
        ids: string[], 
        source: string 
      };
      
      if (data.source === 'selected' && data.ids && data.ids.length > 0) {
        // Get drop position information
        const targetId = positionedEvent.dropPosition?.targetId;
        const insertBefore = positionedEvent.dropPosition?.insertBefore ?? true;
        
        // Don't do anything if dropping onto itself
        if (data.ids.length === 1 && data.ids[0] === targetId) {
          return;
        }
        
        // Create a new array to avoid mutation
        let newSelected = [...selectedColumns];
        
        // Process each selected item
        for (const draggedItemId of data.ids) {
          // First remove the item
          const draggedItem = findItemInTree(newSelected, draggedItemId);
          
          if (draggedItem) {
            // Clone the dragged item
            const clonedItem = deepCloneColumnItem(draggedItem);
            
            // Remove from selected
            newSelected = removeItemFromTree(newSelected, draggedItemId);
            
            // Add back at the new position
            if (isFlatView) {
              newSelected = insertItemIntoFlatList(
                newSelected, 
                clonedItem, 
                allPossibleColumns,
                targetId, 
                insertBefore
              );
            } else {
              newSelected = insertItemIntoTreeAtIndex(
                newSelected, 
                clonedItem, 
                allPossibleColumns,
                targetId,
                insertBefore
              );
            }
          }
        }
        
        // Update state
        setSelectedColumns(newSelected);
        
        // Update main grid
        updateMainGridColumns(newSelected);
        
        // Clear selections after drag
        clearSelectionSelected();
      }
    } catch (err) {
      console.error('Error processing reorder data:', err);
    }
  }, [selectedColumns, allPossibleColumns, clearSelectionSelected, updateMainGridColumns, isFlatView]);

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
    isFlatView,
    
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
    handleSelectedItemReorder,
    onGridReady,
    setIsFlatView
  };
};