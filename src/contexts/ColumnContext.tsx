// src/contexts/ColumnContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { GridApi, ColDef, ColGroupDef } from 'ag-grid-community';
import { ColumnItem, ColumnDefinition, CustomColumnGroup, ColumnProviderProps } from '../types';
import { 
  toggleExpand,
  countSelectedItems,
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
  insertItemIntoTreeAtIndex,
  insertItemIntoFlatList
} from '../utils/dragDropUtils';
import { 
  convertToFlatColumns,
  convertToAgGridColumns,
  createColumnTreeFromCustomGroups,
  extractCustomGroupsFromColumns,
  mergeCustomGroupsIntoColumns
} from '../utils/columnUtils';

// Context interface with custom groups support
interface ColumnContextType {
  // Data
  rowData: any[];
  mainGridColumns: (ColDef | ColGroupDef)[];
  availableColumns: ColumnItem[];
  selectedColumns: ColumnItem[];
  defaultColDef: ColDef;
  selectedAvailableCount: number;
  selectedSelectedCount: number;
  isFlatView: boolean;
  
  // Custom groups functions
  getCustomGroups: () => CustomColumnGroup[];
  applyCustomGroups: (groups: CustomColumnGroup[]) => void;
  
  // Actions
  toggleExpandAvailable: (itemId: string) => void;
  toggleExpandSelected: (itemId: string) => void;
  toggleSelectAvailable: (itemId: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  toggleSelectSelected: (itemId: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  selectAllAvailable: () => void;
  selectAllSelected: () => void;
  clearSelectionAvailable: () => void;
  clearSelectionSelected: () => void;
  handleAvailableItemDragStart: (e: React.DragEvent, item: ColumnItem) => void;
  handleSelectedItemDragStart: (e: React.DragEvent, item: ColumnItem) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDropToSelected: (e: React.DragEvent) => void;
  handleDropToAvailable: (e: React.DragEvent) => void;
  handleSelectedItemReorder: (e: React.DragEvent) => void;
  onGridReady: (params: { api: GridApi }) => void;
  setIsFlatView: (value: boolean) => void;
}

// Create the context
const ColumnContext = createContext<ColumnContextType | undefined>(undefined);

// Provider component
export const ColumnProvider: React.FC<ColumnProviderProps> = ({ 
  children, 
  allPossibleColumns,
  initialData,
  customGroups = [],
  onSelectedColumnsChange 
}) => {
  // State for the main grid columns and data
  const [rowData, setRowData] = useState<any[]>([]);
  const [mainGridColumns, setMainGridColumns] = useState<(ColDef | ColGroupDef)[]>([]);
  
  // State for the column chooser
  const [availableColumns, setAvailableColumns] = useState<ColumnItem[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<ColumnItem[]>([]);
  
  // Grid API references
  const [mainGridApi, setMainGridApi] = useState<GridApi | null>(null);

  // State to track last selected item (for shift-click range selection)
  const [lastSelectedAvailableId, setLastSelectedAvailableId] = useState<string | null>(null);
  const [lastSelectedSelectedId, setLastSelectedSelectedId] = useState<string | null>(null);

  // Track the flat view state
  const [isFlatView, setIsFlatView] = useState(false);
  
  // Track custom groups
  const [activeCustomGroups, setActiveCustomGroups] = useState<CustomColumnGroup[]>(customGroups);
  
  // Memoized counts
  const selectedAvailableCount = countSelectedItems(availableColumns);
  const selectedSelectedCount = countSelectedItems(selectedColumns);

  // Default column definitions for the main grid
  const defaultColDef: ColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true,
    sortable: true,
    filter: true
  };

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

  // Get current custom groups
  const getCustomGroups = useCallback((): CustomColumnGroup[] => {
    return extractCustomGroupsFromColumns(selectedColumns);
  }, [selectedColumns]);

  // Apply custom groups to the grid
  const applyCustomGroups = useCallback((groups: CustomColumnGroup[]) => {
    setActiveCustomGroups(groups);
    
    // Create a column structure from the custom groups
    const groupedColumns = createColumnTreeFromCustomGroups(availableColumns, groups);
    
    // Update the selected columns
    setSelectedColumns(groupedColumns);
    
    // Update the main grid columns
    updateMainGridColumns(groupedColumns);
  }, [availableColumns, updateMainGridColumns]);

  // Toggle expand for available columns
  const toggleExpandAvailable = useCallback((itemId: string) => {
    setAvailableColumns(prev => toggleExpand(prev, itemId));
  }, []);

  // Toggle expand for selected columns
  const toggleExpandSelected = useCallback((itemId: string) => {
    setSelectedColumns(prev => toggleExpand(prev, itemId));
  }, []);

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
    
    // Update the main grid columns
    updateMainGridColumns(updatedColumns);
  }, [selectedColumns, lastSelectedSelectedId, isFlatView, updateMainGridColumns]);

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
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain')) as { 
        ids: string[], 
        source: string 
      };
      
      if (data.source === 'available' && data.ids && data.ids.length > 0) {
        // Create new arrays to avoid mutation
        let newAvailable = [...availableColumns];
        let newSelected = [...selectedColumns];
        
        // Get drop position information from the extended event
        const positionedEvent = e as any;
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
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain')) as { 
        ids: string[], 
        source: string 
      };
      
      if (data.source === 'selected' && data.ids && data.ids.length > 0) {
        // Create new arrays to avoid mutation
        let newAvailable = [...availableColumns];
        let newSelected = [...selectedColumns];
        
        // Get drop position information from the extended event
        const positionedEvent = e as any;
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
            // We don't typically use flat view for available columns
            newAvailable = insertItemIntoTreeAtIndex(
              newAvailable, 
              clonedItem, 
              allPossibleColumns,
              targetId,
              insertBefore
            );
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
  }, [availableColumns, selectedColumns, allPossibleColumns, clearSelectionAvailable, clearSelectionSelected, updateMainGridColumns]);

  // Handler for reordering within the selected columns panel
  const handleSelectedItemReorder = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain')) as { 
        ids: string[], 
        source: string 
      };
      
      if (data.source === 'selected' && data.ids && data.ids.length > 0) {
        // Get drop position information from the extended event
        const positionedEvent = e as any;
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
    setRowData(initialData);
    
    // Set up initial available columns (all possible columns with expanded state)
    setAvailableColumns(allPossibleColumns);
    
    // Set initial custom groups
    setActiveCustomGroups(customGroups);
    
    // Set up initial selected columns (using custom groups if provided)
    if (customGroups && customGroups.length > 0) {
      const groupedColumns = createColumnTreeFromCustomGroups(allPossibleColumns, customGroups);
      setSelectedColumns(groupedColumns);
      updateMainGridColumns(groupedColumns);
    } else {
      setSelectedColumns([]);
      updateMainGridColumns([]);
    }
  }, [allPossibleColumns, initialData, customGroups, updateMainGridColumns]);

  // Handle grid ready event
  const onGridReady = useCallback((params: { api: GridApi }) => {
    setMainGridApi(params.api);
  }, []);

  // Create the context value
  const contextValue: ColumnContextType = {
    // Data
    rowData,
    mainGridColumns,
    availableColumns,
    selectedColumns,
    defaultColDef,
    selectedAvailableCount,
    selectedSelectedCount,
    isFlatView,
    
    // Custom groups functions
    getCustomGroups,
    applyCustomGroups,
    
    // Actions
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

  return (
    <ColumnContext.Provider value={contextValue}>
      {children}
    </ColumnContext.Provider>
  );
};

// Custom hook to use the column context
export const useColumnContext = () => {
  const context = useContext(ColumnContext);
  if (context === undefined) {
    throw new Error('useColumnContext must be used within a ColumnProvider');
  }
  return context;
};