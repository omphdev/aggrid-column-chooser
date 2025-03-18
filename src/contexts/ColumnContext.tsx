// src/contexts/ColumnContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
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
  isPartOfGroup
} from '../utils/dragDropUtils';
import { 
  convertToFlatColumns,
  convertToAgGridColumns,
  createColumnTreeFromCustomGroups,
  extractCustomGroupsFromColumns
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

  // Add a helper function to find or create a group in the selected columns
  const findOrCreateGroup = useCallback((groupId: string, groupName: string): ColumnItem => {
    // Find existing group
    const existingGroup = selectedColumns.find(col => col.id === groupId);
    if (existingGroup) {
      return existingGroup;
    }
    
    // Create new group if it doesn't exist
    const newGroup: ColumnItem = {
      id: groupId,
      name: groupName,
      field: '', // Groups don't have fields
      expanded: true,
      children: []
    };
    
    return newGroup;
  }, [selectedColumns]);

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
            
            // Check if this item is part of a group
            const isGrouped = isPartOfGroup(allPossibleColumns, draggedItemId);
            
            if (isGrouped) {
              // Find the group this item belongs to
              for (const group of allPossibleColumns) {
                if (!group.field && group.children && group.children.length > 0) {
                  // Check if this item is in this group or its subgroups
                  const findItem = (items: ColumnItem[]): boolean => {
                    for (const item of items) {
                      if (item.id === draggedItemId) {
                        return true;
                      }
                      if (item.children && item.children.length > 0) {
                        if (findItem(item.children)) {
                          return true;
                        }
                      }
                    }
                    return false;
                  };
                  
                  if (findItem(group.children)) {
                    // This item belongs to this group
                    let targetGroup = newSelected.find(item => item.id === group.id);
                    
                    // Create group if it doesn't exist
                    if (!targetGroup) {
                      targetGroup = {
                        id: group.id,
                        name: group.name,
                        field: '',
                        expanded: true,
                        children: []
                      };
                      newSelected.push(targetGroup);
                    }
                    
                    // Ensure children array exists
                    if (!targetGroup.children) {
                      targetGroup.children = [];
                    }
                    
                    // Add item to the group
                    if (targetId && targetGroup.children.find(item => item.id === targetId)) {
                      // If target is in this group, add item at the specific position
                      const targetIndex = targetGroup.children.findIndex(item => item.id === targetId);
                      const insertPos = insertBefore ? targetIndex : targetIndex + 1;
                      targetGroup.children.splice(insertPos, 0, clonedItem);
                    } else {
                      // Otherwise add at the end of the group
                      targetGroup.children.push(clonedItem);
                    }
                    
                    break;
                  }
                }
              }
            } else {
              // For ungrouped items, add directly to root level
              if (targetId) {
                // Find target position
                const targetIndex = newSelected.findIndex(item => item.id === targetId);
                if (targetIndex >= 0) {
                  // Target is in root level, insert at specific position
                  const insertPos = insertBefore ? targetIndex : targetIndex + 1;
                  newSelected.splice(insertPos, 0, clonedItem);
                } else {
                  // Target might be in a group, try to find its parent group
                  let found = false;
                  for (const group of newSelected) {
                    if (group.children) {
                      const childIndex = group.children.findIndex(item => item.id === targetId);
                      if (childIndex >= 0) {
                        // Target is in this group, but our item is not grouped
                        // Add it to root level adjacent to the group
                        const groupIndex = newSelected.indexOf(group);
                        const insertPos = insertBefore ? groupIndex : groupIndex + 1;
                        newSelected.splice(insertPos, 0, clonedItem);
                        found = true;
                        break;
                      }
                    }
                  }
                  
                  // If target not found, add at the end
                  if (!found) {
                    newSelected.push(clonedItem);
                  }
                }
              } else {
                // No target specified, add at the end
                newSelected.push(clonedItem);
              }
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
  }, [availableColumns, selectedColumns, allPossibleColumns, clearSelectionAvailable, clearSelectionSelected, updateMainGridColumns]);

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
            
            // Check if this item is part of a group in available columns
            const isGrouped = isPartOfGroup(allPossibleColumns, draggedItemId);
            
            if (isGrouped) {
              // Find the group this item belongs to
              for (const group of allPossibleColumns) {
                if (!group.field && group.children && group.children.length > 0) {
                  // Check if this item is in this group or its subgroups
                  const findItem = (items: ColumnItem[]): boolean => {
                    for (const item of items) {
                      if (item.id === draggedItemId) {
                        return true;
                      }
                      if (item.children && item.children.length > 0) {
                        if (findItem(item.children)) {
                          return true;
                        }
                      }
                    }
                    return false;
                  };
                  
                  if (findItem(group.children)) {
                    // This item belongs to this group
                    let targetGroup = newAvailable.find(item => item.id === group.id);
                    
                    // Create group if it doesn't exist
                    if (!targetGroup) {
                      targetGroup = {
                        id: group.id,
                        name: group.name,
                        field: '',
                        expanded: true,
                        children: []
                      };
                      newAvailable.push(targetGroup);
                    }
                    
                    // Ensure children array exists
                    if (!targetGroup.children) {
                      targetGroup.children = [];
                    }
                    
                    // Add item to the group
                    if (targetId && targetGroup.children.find(item => item.id === targetId)) {
                      // If target is in this group, add item at the specific position
                      const targetIndex = targetGroup.children.findIndex(item => item.id === targetId);
                      const insertPos = insertBefore ? targetIndex : targetIndex + 1;
                      targetGroup.children.splice(insertPos, 0, clonedItem);
                    } else {
                      // Otherwise add at the end of the group
                      targetGroup.children.push(clonedItem);
                    }
                    
                    break;
                  }
                }
              }
            } else {
              // For ungrouped items, add directly to root level
              if (targetId) {
                // Find target position
                const targetIndex = newAvailable.findIndex(item => item.id === targetId);
                if (targetIndex >= 0) {
                  // Target is in root level, insert at specific position
                  const insertPos = insertBefore ? targetIndex : targetIndex + 1;
                  newAvailable.splice(insertPos, 0, clonedItem);
                } else {
                  // Target might be in a group, try to find its parent group
                  let found = false;
                  for (const group of newAvailable) {
                    if (group.children) {
                      const childIndex = group.children.findIndex(item => item.id === targetId);
                      if (childIndex >= 0) {
                        // Target is in this group, but our item is not grouped
                        // Add it to root level adjacent to the group
                        const groupIndex = newAvailable.indexOf(group);
                        const insertPos = insertBefore ? groupIndex : groupIndex + 1;
                        newAvailable.splice(insertPos, 0, clonedItem);
                        found = true;
                        break;
                      }
                    }
                  }
                  
                  // If target not found, add at the end
                  if (!found) {
                    newAvailable.push(clonedItem);
                  }
                }
              } else {
                // No target specified, add at the end
                newAvailable.push(clonedItem);
              }
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
            const isGrouped = isPartOfGroup(allPossibleColumns, draggedItemId);
            
            if (isGrouped && !isFlatView) {
              // For grouped items, try to maintain group structure
              for (const group of newSelected) {
                if (!group.field && group.children) {
                  // Check if target is in this group
                  const targetInGroup = group.children.some(item => item.id === targetId);
                  
                  if (targetInGroup) {
                    // Add to this group at the target position
                    const targetIndex = group.children.findIndex(item => item.id === targetId);
                    const insertPos = insertBefore ? targetIndex : targetIndex + 1;
                    group.children.splice(insertPos, 0, clonedItem);
                    break;
                  }
                }
              }
            } else {
              // For flat view or ungrouped items, add at root level
              if (targetId) {
                const targetIndex = newSelected.findIndex(item => item.id === targetId);
                if (targetIndex >= 0) {
                  const insertPos = insertBefore ? targetIndex : targetIndex + 1;
                  newSelected.splice(insertPos, 0, clonedItem);
                } else {
                  // Target might be in a group
                  let found = false;
                  for (const group of newSelected) {
                    if (group.children) {
                      const childIndex = group.children.findIndex(item => item.id === targetId);
                      if (childIndex >= 0) {
                        // If flat view, add at root level
                        if (isFlatView) {
                          const groupIndex = newSelected.indexOf(group);
                          const insertPos = insertBefore ? groupIndex : groupIndex + 1;
                          newSelected.splice(insertPos, 0, clonedItem);
                        } else {
                          // If tree view, add to the group
                          const insertPos = insertBefore ? childIndex : childIndex + 1;
                          group.children.splice(insertPos, 0, clonedItem);
                        }
                        found = true;
                        break;
                      }
                    }
                  }
                  
                  // If target not found, add at the end
                  if (!found) {
                    newSelected.push(clonedItem);
                  }
                }
              } else {
                // No target, add at the end
                newSelected.push(clonedItem);
              }
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