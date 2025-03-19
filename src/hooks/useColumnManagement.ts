import { useState, useCallback, useMemo } from 'react';
import { ColumnItem } from '../types';
import dashboardStateService from '../services/dashboardStateService';
import { countLeafNodes, findItemInTree, filterEmptyGroups } from '../utils/columnUtils';

/**
 * Props for the useColumnManagement hook
 */
export interface ColumnManagementProps {
  availableColumns: ColumnItem[];
  selectedColumns: ColumnItem[];
  isFlatView: boolean;
  onSelectedColumnsChange: (columnIds: string[]) => void;
}

/**
 * Custom hook to manage column interactions without using reducers
 */
export const useColumnManagement = ({
  availableColumns,
  selectedColumns,
  isFlatView,
  onSelectedColumnsChange
}: ColumnManagementProps) => {
  // Local state for selection tracking
  const [selectedAvailableIds, setSelectedAvailableIds] = useState<string[]>([]);
  const [selectedSelectedIds, setSelectedSelectedIds] = useState<string[]>([]);
  const [lastSelectedAvailableId, setLastSelectedAvailableId] = useState<string | null>(null);
  const [lastSelectedSelectedId, setLastSelectedSelectedId] = useState<string | null>(null);
  
  // Filtered available columns (remove empty groups)
  const filteredAvailableColumns = useMemo(() => 
    filterEmptyGroups(availableColumns),
    [availableColumns]
  );
  
  // Count leaf nodes
  const availableLeafCount = useMemo(() => 
    countLeafNodes(availableColumns),
    [availableColumns]
  );
  
  const selectedLeafCount = useMemo(() => 
    selectedColumns.length, // In the new architecture, selected columns are always flat
    [selectedColumns]
  );

  // Toggle expand available column groups
  const toggleExpandAvailable = useCallback((itemId: string) => {
    // Create updated column structure with toggled expand state
    const updateExpandState = (items: ColumnItem[]): ColumnItem[] => {
      return items.map(item => {
        if (item.id === itemId) {
          return { ...item, expanded: !item.expanded };
        }
        if (item.children && item.children.length > 0) {
          return { ...item, children: updateExpandState(item.children) };
        }
        return item;
      });
    };
    
    // Update available columns in dashboard state
    dashboardStateService.next({ 
      availableColumns: updateExpandState(availableColumns) 
    }, 'Toggle expand available column');
  }, [availableColumns]);
  
  // Toggle selection handling for available columns
  const toggleSelectAvailable = useCallback((itemId: string, isMultiSelect: boolean, isRangeSelect: boolean) => {
    console.log(`Toggle select available: ${itemId}, multiSelect: ${isMultiSelect}, rangeSelect: ${isRangeSelect}`);
    
    if (isRangeSelect && lastSelectedAvailableId) {
      // Implement range selection
      const allIds = getAllItemIds(availableColumns);
      const currentIndex = allIds.indexOf(itemId);
      const lastIndex = allIds.indexOf(lastSelectedAvailableId);
      
      if (currentIndex >= 0 && lastIndex >= 0) {
        const startIdx = Math.min(currentIndex, lastIndex);
        const endIdx = Math.max(currentIndex, lastIndex);
        const rangeIds = allIds.slice(startIdx, endIdx + 1);
        
        // Filter out duplicates
        const newSelectedIds = isMultiSelect 
          ? [...new Set([...selectedAvailableIds, ...rangeIds])]
          : rangeIds;
        
        setSelectedAvailableIds(newSelectedIds);
        setLastSelectedAvailableId(itemId);
        console.log(`Range selection from ${lastSelectedAvailableId} to ${itemId}, ${newSelectedIds.length} items selected`);
      } else {
        // Fall back to single selection if range boundaries not found
        handleSingleToggle();
      }
    } else {
      // Handle single selection toggle
      handleSingleToggle();
    }
    
    function handleSingleToggle() {
      setSelectedAvailableIds(prev => {
        const isCurrentlySelected = prev.includes(itemId);
        let newSelection: string[];
        
        if (isMultiSelect) {
          // Ctrl/Cmd+click: toggle this item, keep others
          newSelection = isCurrentlySelected
            ? prev.filter(id => id !== itemId)
            : [...prev, itemId];
        } else {
          // Simple click: select only this item, unless it's already the only selected item
          newSelection = (isCurrentlySelected && prev.length === 1)
            ? [] // Deselect if it's the only selected item
            : [itemId]; // Otherwise select just this one
        }
        
        console.log(`Single toggle ${itemId}, now selected: ${newSelection.join(', ')}`);
        return newSelection;
      });
      
      setLastSelectedAvailableId(itemId);
    }
  }, [availableColumns, selectedAvailableIds, lastSelectedAvailableId]);
  
  // Toggle selection handling for selected columns
  const toggleSelectSelected = useCallback((itemId: string, isMultiSelect: boolean, isRangeSelect: boolean) => {
    console.log(`Toggle select selected: ${itemId}, multiSelect: ${isMultiSelect}, rangeSelect: ${isRangeSelect}`);
    
    if (isRangeSelect && lastSelectedSelectedId) {
      // Implement range selection
      const allIds = selectedColumns.map(item => item.id);
      const currentIndex = allIds.indexOf(itemId);
      const lastIndex = allIds.indexOf(lastSelectedSelectedId);
      
      if (currentIndex >= 0 && lastIndex >= 0) {
        const startIdx = Math.min(currentIndex, lastIndex);
        const endIdx = Math.max(currentIndex, lastIndex);
        const rangeIds = allIds.slice(startIdx, endIdx + 1);
        
        // Filter out duplicates
        const newSelectedIds = isMultiSelect 
          ? [...new Set([...selectedSelectedIds, ...rangeIds])]
          : rangeIds;
        
        setSelectedSelectedIds(newSelectedIds);
        setLastSelectedSelectedId(itemId);
        console.log(`Range selection from ${lastSelectedSelectedId} to ${itemId}, ${newSelectedIds.length} items selected`);
      } else {
        // Fall back to single selection if range boundaries not found
        handleSingleToggle();
      }
    } else {
      // Handle single selection toggle
      handleSingleToggle();
    }
    
    function handleSingleToggle() {
      setSelectedSelectedIds(prev => {
        const isCurrentlySelected = prev.includes(itemId);
        let newSelection: string[];
        
        if (isMultiSelect) {
          // Ctrl/Cmd+click: toggle this item, keep others
          newSelection = isCurrentlySelected
            ? prev.filter(id => id !== itemId)
            : [...prev, itemId];
        } else {
          // Simple click: select only this item, unless it's already the only selected item
          newSelection = (isCurrentlySelected && prev.length === 1)
            ? [] // Deselect if it's the only selected item
            : [itemId]; // Otherwise select just this one
        }
        
        console.log(`Single toggle ${itemId}, now selected: ${newSelection.join(', ')}`);
        return newSelection;
      });
      
      setLastSelectedSelectedId(itemId);
    }
  }, [selectedColumns, selectedSelectedIds, lastSelectedSelectedId]);
  
  // Select all available columns
  const selectAllAvailable = useCallback(() => {
    const allIds = getAllItemIds(availableColumns);
    setSelectedAvailableIds(allIds);
    console.log(`Selected all available: ${allIds.length} items`);
  }, [availableColumns]);
  
  // Select all selected columns
  const selectAllSelected = useCallback(() => {
    const allIds = selectedColumns.map(item => item.id);
    setSelectedSelectedIds(allIds);
    console.log(`Selected all selected: ${allIds.length} items`);
  }, [selectedColumns]);
  
  // Clear selection for available columns
  const clearSelectionAvailable = useCallback(() => {
    setSelectedAvailableIds([]);
    setLastSelectedAvailableId(null);
    console.log('Cleared available selection');
  }, []);
  
  // Clear selection for selected columns
  const clearSelectionSelected = useCallback(() => {
    setSelectedSelectedIds([]);
    setLastSelectedSelectedId(null);
    console.log('Cleared selected selection');
  }, []);
  
  // Move items from available to selected
  const moveItemsToSelected = useCallback((ids: string[], dropPosition: { targetId?: string, insertBefore: boolean }) => {
    console.log(`Moving to selected: ${ids.join(', ')}, targetId: ${dropPosition.targetId || 'none'}, insertBefore: ${dropPosition.insertBefore}`);
    
    // Collect items to move
    const itemsToMove: {id: string, name: string, field: string}[] = [];
    const idSet = new Set(ids);
    
    // Helper function to find all items including children of groups
    const findAllItems = (items: ColumnItem[]) => {
      for (const item of items) {
        if (idSet.has(item.id)) {
          // If this is a group, collect all its leaf nodes
          if (item.children && item.children.length > 0) {
            // Get all leaf nodes from this group
            findAllLeafNodes(item.children);
          } else if (item.field) {
            // This is a leaf node
            itemsToMove.push({
              id: item.id,
              name: item.name,
              field: item.field
            });
          }
        } else if (item.children && item.children.length > 0) {
          // Keep searching in children
          findAllItems(item.children);
        }
      }
    };
    
    // Helper to find all leaf nodes in a subtree
    const findAllLeafNodes = (items: ColumnItem[]) => {
      for (const item of items) {
        if (item.children && item.children.length > 0) {
          findAllLeafNodes(item.children);
        } else if (item.field) {
          itemsToMove.push({
            id: item.id,
            name: item.name,
            field: item.field
          });
        }
      }
    };
    
    // Find all items to move
    findAllItems(availableColumns);
    
    console.log(`Found ${itemsToMove.length} items to move`);
    
    // Get current selected columns
    const currentSelectedIds = selectedColumns.map(col => col.id);
    
    // Determine new order of selected column IDs
    let newSelectedIds: string[];
    
    if (dropPosition.targetId) {
      // Find insertion index
      const targetIndex = currentSelectedIds.indexOf(dropPosition.targetId);
      if (targetIndex !== -1) {
        // Insert at the specified position
        const insertIndex = dropPosition.insertBefore ? targetIndex : targetIndex + 1;
        
        // Get ids to insert
        const idsToInsert = itemsToMove.map(item => item.id);
        
        // Remove any of these ids if they're already in the selected columns
        const filteredCurrentIds = currentSelectedIds.filter(id => !idSet.has(id));
        
        // Insert the ids at the right position
        newSelectedIds = [
          ...filteredCurrentIds.slice(0, insertIndex),
          ...idsToInsert,
          ...filteredCurrentIds.slice(insertIndex)
        ];
      } else {
        // Target not found, append to end
        newSelectedIds = [
          ...currentSelectedIds.filter(id => !idSet.has(id)),
          ...itemsToMove.map(item => item.id)
        ];
      }
    } else {
      // No target specified, append to end
      newSelectedIds = [
        ...currentSelectedIds.filter(id => !idSet.has(id)),
        ...itemsToMove.map(item => item.id)
      ];
    }
    
    // Notify parent of changes
    console.log(`New selected IDs: ${newSelectedIds.join(', ')}`);
    onSelectedColumnsChange(newSelectedIds);
    
    // Clear selections
    clearSelectionAvailable();
    clearSelectionSelected();
  }, [availableColumns, selectedColumns, onSelectedColumnsChange, clearSelectionAvailable, clearSelectionSelected]);
  
  // Move items from selected to available
  const moveItemsToAvailable = useCallback((ids: string[], dropPosition: { targetId?: string, insertBefore: boolean }) => {
    console.log(`Moving to available: ${ids.join(', ')}`);
    
    // Get current selected columns
    const currentSelectedIds = selectedColumns.map(col => col.id);
    
    // Filter out the ids to be removed
    const idSet = new Set(ids);
    const newSelectedIds = currentSelectedIds.filter(id => !idSet.has(id));
    
    // Notify parent of changes
    console.log(`New selected IDs after removal: ${newSelectedIds.join(', ')}`);
    onSelectedColumnsChange(newSelectedIds);
    
    // Clear selections
    clearSelectionAvailable();
    clearSelectionSelected();
  }, [selectedColumns, onSelectedColumnsChange, clearSelectionAvailable, clearSelectionSelected]);
  
  // Reorder selected columns - ensures that all selected items move together
  const reorderSelectedItems = useCallback((ids: string[], dropPosition: { targetId?: string, insertBefore: boolean }) => {
    if (!dropPosition.targetId) {
      return; // Need a target to reorder
    }
    
    // Skip if dragging onto itself (single item)
    if (ids.length === 1 && ids[0] === dropPosition.targetId) {
      return;
    }
    
    console.log(`Reordering in selected: ${ids.join(', ')}, target: ${dropPosition.targetId}, insertBefore: ${dropPosition.insertBefore}`);
    
    // Get current selected columns
    const currentSelectedIds = selectedColumns.map(col => col.id);
    console.log('Current order:', currentSelectedIds.join(', '));
    
    // Create a set of ids to move
    const idSet = new Set(ids);
    
    // Find the target index
    const targetIndex = currentSelectedIds.indexOf(dropPosition.targetId);
    if (targetIndex === -1) {
      console.log('Target not found');
      return; // Target not found
    }
    
    // Remove the items to be moved
    const remainingIds = currentSelectedIds.filter(id => !idSet.has(id));
    
    // Calculate the insertion index
    let insertIndex;
    if (dropPosition.insertBefore) {
      insertIndex = remainingIds.indexOf(dropPosition.targetId);
    } else {
      insertIndex = remainingIds.indexOf(dropPosition.targetId) + 1;
    }
    
    // Handle boundary cases
    if (insertIndex < 0) insertIndex = 0;
    if (insertIndex > remainingIds.length) insertIndex = remainingIds.length;
    
    console.log(`Insertion index: ${insertIndex}, remaining: ${remainingIds.join(', ')}`);
    
    // Create the new order
    const newSelectedIds = [
      ...remainingIds.slice(0, insertIndex),
      ...ids,
      ...remainingIds.slice(insertIndex)
    ];
    
    console.log('New order:', newSelectedIds.join(', '));
    
    // Notify parent of changes
    onSelectedColumnsChange(newSelectedIds);
    
    // Clear selections
    clearSelectionSelected();
  }, [selectedColumns, onSelectedColumnsChange, clearSelectionSelected]);
  
  // Move selected items up as a group
  const moveSelectedUp = useCallback(() => {
    if (selectedSelectedIds.length === 0) return;
    
    // Get current selected columns
    const currentSelectedIds = selectedColumns.map(col => col.id);
    
    // Find indices of all selected items
    const selectedIndices = selectedSelectedIds.map(id => 
      currentSelectedIds.indexOf(id)
    ).sort((a, b) => a - b);
    
    // Check if we can move up (if first selected is at position 0, can't move up)
    if (selectedIndices[0] === 0) return;
    
    // Clone the current order
    const newSelectedIds = [...currentSelectedIds];
    
    // Find the item directly above the topmost selected item
    const itemAboveIndex = selectedIndices[0] - 1;
    const itemAbove = newSelectedIds[itemAboveIndex];
    
    // Move the item above below all the selected items
    newSelectedIds.splice(itemAboveIndex, 1);
    newSelectedIds.splice(selectedIndices[selectedIndices.length - 1], 0, itemAbove);
    
    // Notify parent of changes
    onSelectedColumnsChange(newSelectedIds);
  }, [selectedColumns, selectedSelectedIds, onSelectedColumnsChange]);
  
  // Move selected items down as a group
  const moveSelectedDown = useCallback(() => {
    if (selectedSelectedIds.length === 0) return;
    
    // Get current selected columns
    const currentSelectedIds = selectedColumns.map(col => col.id);
    
    // Find indices of all selected items
    const selectedIndices = selectedSelectedIds.map(id => 
      currentSelectedIds.indexOf(id)
    ).sort((a, b) => a - b);
    
    // Check if we can move down (if last selected is at the end, can't move down)
    if (selectedIndices[selectedIndices.length - 1] === currentSelectedIds.length - 1) return;
    
    // Clone the current order
    const newSelectedIds = [...currentSelectedIds];
    
    // Find the item directly below the bottommost selected item
    const itemBelowIndex = selectedIndices[selectedIndices.length - 1] + 1;
    const itemBelow = newSelectedIds[itemBelowIndex];
    
    // Move the item below above all the selected items
    newSelectedIds.splice(itemBelowIndex, 1);
    newSelectedIds.splice(selectedIndices[0], 0, itemBelow);
    
    // Notify parent of changes
    onSelectedColumnsChange(newSelectedIds);
  }, [selectedColumns, selectedSelectedIds, onSelectedColumnsChange]);
  
  // Clear all selected columns
  const clearSelected = useCallback(() => {
    // Empty the selected columns
    onSelectedColumnsChange([]);
  }, [onSelectedColumnsChange]);
  
  // Move a single item to selected on double-click
  const moveItemToSelected = useCallback((id: string) => {
    // Find the item
    const item = findItemInTree(availableColumns, id);
    if (!item) return; // Item not found
    
    // If it's a group, collect all leaf nodes
    if (item.children && item.children.length > 0) {
      // Collect all leaf node IDs
      const leafNodeIds: string[] = [];
      
      const collectLeafIds = (items: ColumnItem[]) => {
        for (const child of items) {
          if (child.children && child.children.length > 0) {
            collectLeafIds(child.children);
          } else if (child.field) {
            leafNodeIds.push(child.id);
          }
        }
      };
      
      collectLeafIds(item.children);
      
      // Move all leaf nodes
      if (leafNodeIds.length > 0) {
        const dropPosition = { insertBefore: false }; // Add to end
        moveItemsToSelected(leafNodeIds, dropPosition);
      }
    } else if (item.field) {
      // It's a leaf node, move it directly
      // Get current selected columns
      const currentSelectedIds = selectedColumns.map(col => col.id);
      
      // Append the new id if not already selected
      if (!currentSelectedIds.includes(id)) {
        onSelectedColumnsChange([...currentSelectedIds, id]);
      }
    }
  }, [availableColumns, selectedColumns, onSelectedColumnsChange, moveItemsToSelected]);
  
  // Move a single item to available on double-click
  const moveItemToAvailable = useCallback((id: string) => {
    // Get current selected columns
    const currentSelectedIds = selectedColumns.map(col => col.id);
    
    // Remove the id if present
    if (currentSelectedIds.includes(id)) {
      onSelectedColumnsChange(currentSelectedIds.filter(colId => colId !== id));
    }
  }, [selectedColumns, onSelectedColumnsChange]);
  
  // Toggle flat view
  const setFlatView = useCallback((value: boolean) => {
    dashboardStateService.toggleFlatView(value);
  }, []);
  
  // Helper function to get all item IDs from a tree
  const getAllItemIds = (items: ColumnItem[]): string[] => {
    const result: string[] = [];
    
    const collectIds = (itemList: ColumnItem[]) => {
      for (const item of itemList) {
        if (item.field) { // Only collect leaf nodes with fields
          result.push(item.id);
        }
        
        if (item.children && item.children.length > 0) {
          collectIds(item.children);
        }
      }
    };
    
    collectIds(items);
    return result;
  };
  
  return {
    // Derived values
    filteredAvailableColumns,
    availableLeafCount,
    selectedLeafCount,
    selectedAvailableIds,
    selectedSelectedIds,
    
    // Actions
    toggleExpandAvailable,
    toggleSelectAvailable,
    toggleSelectSelected,
    selectAllAvailable,
    selectAllSelected,
    clearSelectionAvailable,
    clearSelectionSelected,
    moveItemsToSelected,
    moveItemsToAvailable,
    reorderSelectedItems,
    moveSelectedUp,
    moveSelectedDown,
    clearSelected,
    moveItemToSelected,
    moveItemToAvailable,
    setFlatView,
    
    // Helper functions
    getSelectedAvailableCount: () => selectedAvailableIds.length,
    getSelectedSelectedCount: () => selectedSelectedIds.length
  };
};

export default useColumnManagement;