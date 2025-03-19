import React, { createContext, useContext, useReducer, ReactNode, useCallback, useMemo } from 'react';
import { ColDef, GridApi } from 'ag-grid-community';
import { ColumnItem, ColumnDefinition, DropPosition, PositionedDragEvent } from '../types';
import { convertToFlatColumns, flattenTreeWithParentInfo } from '../utils/columnUtils';

// State interface
// State interface
interface ColumnState {
  rowData: any[];
  mainGridColumns: ColDef[];
  availableColumns: ColumnItem[];
  selectedColumns: ColumnItem[];
  isFlatView: boolean;
  lastSelectedAvailableId: string | null;
  lastSelectedSelectedId: string | null;
  gridApi: GridApi | null;
  originalAllColumns: ColumnItem[]; // Reference to the original structure
}

// Initial state
const initialState: ColumnState = {
  rowData: [],
  mainGridColumns: [],
  availableColumns: [],
  selectedColumns: [],
  isFlatView: false,
  lastSelectedAvailableId: null,
  lastSelectedSelectedId: null,
  gridApi: null,
  originalAllColumns: []
};

// Action types
type ColumnAction =
  | { type: 'INITIALIZE'; payload: { allPossibleColumns: ColumnItem[]; initialData: any[] } }
  | { type: 'TOGGLE_EXPAND_AVAILABLE'; payload: { itemId: string } }
  | { type: 'TOGGLE_EXPAND_SELECTED'; payload: { itemId: string } }
  | { type: 'TOGGLE_SELECT_AVAILABLE'; payload: { itemId: string; isMultiSelect: boolean; isRangeSelect: boolean } }
  | { type: 'TOGGLE_SELECT_SELECTED'; payload: { itemId: string; isMultiSelect: boolean; isRangeSelect: boolean } }
  | { type: 'SELECT_ALL_AVAILABLE' }
  | { type: 'SELECT_ALL_SELECTED' }
  | { type: 'CLEAR_SELECTION_AVAILABLE' }
  | { type: 'CLEAR_SELECTION_SELECTED' }
  | { type: 'MOVE_TO_SELECTED'; payload: { ids: string[]; dropPosition: DropPosition } }
  | { type: 'MOVE_TO_AVAILABLE'; payload: { ids: string[]; dropPosition: DropPosition } }
  | { type: 'REORDER_SELECTED'; payload: { ids: string[]; dropPosition: DropPosition } }
  | { type: 'SET_FLAT_VIEW'; payload: { value: boolean } }
  | { type: 'SET_GRID_API'; payload: { api: GridApi } };

// Context interface
interface ColumnContextValue {
  state: ColumnState;
  // Actions
  initialize: (allPossibleColumns: ColumnItem[], initialData: any[]) => void;
  toggleExpandAvailable: (itemId: string) => void;
  toggleExpandSelected: (itemId: string) => void;
  toggleSelectAvailable: (itemId: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  toggleSelectSelected: (itemId: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  selectAllAvailable: () => void;
  selectAllSelected: () => void;
  clearSelectionAvailable: () => void;
  clearSelectionSelected: () => void;
  moveItemsToSelected: (ids: string[], dropPosition: DropPosition) => void;
  moveItemsToAvailable: (ids: string[], dropPosition: DropPosition) => void;
  reorderSelectedItems: (ids: string[], dropPosition: DropPosition) => void;
  setFlatView: (value: boolean) => void;
  setGridApi: (api: GridApi) => void;
  // Derived values
  getSelectedCount: (source: 'available' | 'selected') => number;
  getDefaultColDef: () => ColDef;
}

// Create the context
const ColumnContext = createContext<ColumnContextValue | undefined>(undefined);

// Reducer function
function columnReducer(state: ColumnState, action: ColumnAction): ColumnState {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...state,
        rowData: action.payload.initialData,
        availableColumns: action.payload.allPossibleColumns,
        selectedColumns: [],
        mainGridColumns: [],
        originalAllColumns: action.payload.allPossibleColumns // Store the original structure
      };
      
    case 'TOGGLE_EXPAND_AVAILABLE':
      return {
        ...state,
        availableColumns: toggleExpandState(state.availableColumns, action.payload.itemId)
      };
      
    case 'TOGGLE_EXPAND_SELECTED':
      return {
        ...state,
        selectedColumns: toggleExpandState(state.selectedColumns, action.payload.itemId)
      };
      
    case 'TOGGLE_SELECT_AVAILABLE': {
      const { itemId, isMultiSelect, isRangeSelect } = action.payload;
      const [updatedColumns, updatedLastSelected] = toggleItemSelection(
        state.availableColumns,
        itemId,
        isMultiSelect,
        isRangeSelect,
        state.lastSelectedAvailableId,
        false // Available columns are always in tree view
      );
      
      return {
        ...state,
        availableColumns: updatedColumns,
        lastSelectedAvailableId: updatedLastSelected
      };
    }
      
    case 'TOGGLE_SELECT_SELECTED': {
      const { itemId, isMultiSelect, isRangeSelect } = action.payload;
      const [updatedColumns, updatedLastSelected] = toggleItemSelection(
        state.selectedColumns,
        itemId,
        isMultiSelect,
        isRangeSelect,
        state.lastSelectedSelectedId,
        state.isFlatView
      );
      
      return {
        ...state,
        selectedColumns: updatedColumns,
        lastSelectedSelectedId: updatedLastSelected
      };
    }
      
    case 'SELECT_ALL_AVAILABLE':
      return {
        ...state,
        availableColumns: selectAllItems(state.availableColumns)
      };
      
    case 'SELECT_ALL_SELECTED':
      return {
        ...state,
        selectedColumns: selectAllItems(state.selectedColumns)
      };
      
    case 'CLEAR_SELECTION_AVAILABLE':
      return {
        ...state,
        availableColumns: clearAllSelections(state.availableColumns),
        lastSelectedAvailableId: null
      };
      
    case 'CLEAR_SELECTION_SELECTED':
      return {
        ...state,
        selectedColumns: clearAllSelections(state.selectedColumns),
        lastSelectedSelectedId: null
      };
      
    case 'MOVE_TO_SELECTED': {
      const { ids, dropPosition } = action.payload;
      let newAvailable = [...state.availableColumns];
      let newSelected = [...state.selectedColumns];
      
      // Make a copy of all selected items first before removing any
      const itemsToMove: ColumnItem[] = [];
      
      // Collect all items to be moved
      for (const id of ids) {
        const item = findItemInTree(state.availableColumns, id);
        if (item) {
          // Clone the item to avoid mutation
          itemsToMove.push(deepCloneItem(item));
        }
      }
      
      // Then remove all items from the source
      for (const id of ids) {
        newAvailable = removeItemFromTree(newAvailable, id);
      }
      
      // Now add all items to the destination in the same order they were in the source
      for (const item of itemsToMove) {
        // Add to selected at the appropriate position
        if (state.isFlatView) {
          newSelected = insertItemIntoFlatList(
            newSelected, 
            item, 
            state.originalAllColumns, // Use original structure for group reference
            dropPosition.targetId, 
            dropPosition.insertBefore,
            false // Don't respect groups in selected panel
          );
        } else {
          newSelected = insertItemIntoTreeAtPosition(
            newSelected, 
            item, 
            state.originalAllColumns, // Use original structure for group reference
            dropPosition.targetId,
            dropPosition.insertBefore,
            false // Don't respect groups in selected panel
          );
        }
        
        // For subsequent items, insert after the one we just added
        if (dropPosition.targetId) {
          dropPosition.targetId = item.id;
          dropPosition.insertBefore = false;
        }
      }
      
      // Generate grid columns from the new selected items
      const mainGridColumns = generateGridColumns(newSelected);
      
      return {
        ...state,
        availableColumns: newAvailable,
        selectedColumns: newSelected,
        mainGridColumns
      };
    }
      
    case 'MOVE_TO_AVAILABLE': {
      const { ids, dropPosition } = action.payload;
      let newAvailable = [...state.availableColumns];
      let newSelected = [...state.selectedColumns];
      
      // Make a copy of all selected items first before removing any
      const itemsToMove: ColumnItem[] = [];
      
      // Collect all items to be moved
      for (const id of ids) {
        const item = findItemInTree(state.selectedColumns, id);
        if (item) {
          // Clone the item to avoid mutation
          itemsToMove.push(deepCloneItem(item));
        }
      }
      
      // Then remove all items from the source
      for (const id of ids) {
        newSelected = removeItemFromTree(newSelected, id);
      }
      
      // Now add all items to the destination in the same order they were in the source
      for (const item of itemsToMove) {
        // Add to available (always in tree mode and respect groups)
        // Use originalAllColumns to properly find group membership
        newAvailable = insertItemIntoTreeAtPosition(
          newAvailable, 
          item, 
          state.originalAllColumns, // Use original structure for group reference
          dropPosition.targetId,
          dropPosition.insertBefore,
          true // Always respect groups when moving back to available
        );
        
        // For subsequent items, insert after the one we just added
        if (dropPosition.targetId) {
          dropPosition.targetId = item.id;
          dropPosition.insertBefore = false;
        }
      }
      
      // Generate grid columns from the new selected items
      const mainGridColumns = generateGridColumns(newSelected);
      
      return {
        ...state,
        availableColumns: newAvailable,
        selectedColumns: newSelected,
        mainGridColumns
      };
    }
      
    case 'REORDER_SELECTED': {
      const { ids, dropPosition } = action.payload;
      
      // Don't do anything if dropping onto itself
      if (ids.length === 1 && ids[0] === dropPosition.targetId) {
        return state;
      }
      
      let newSelected = [...state.selectedColumns];
      
      // Make a copy of all selected items first before removing any
      const itemsToMove: ColumnItem[] = [];
      
      // Collect all items to be moved
      for (const id of ids) {
        const item = findItemInTree(newSelected, id);
        if (item) {
          // Clone the item to avoid mutation
          itemsToMove.push(deepCloneItem(item));
        }
      }
      
      // Then remove all items from the source
      for (const id of ids) {
        newSelected = removeItemFromTree(newSelected, id);
      }
      
      // Now add all items to the destination in the same order they were in the source
      for (const item of itemsToMove) {
        // Add back at the new position
        if (state.isFlatView) {
          newSelected = insertItemIntoFlatList(
            newSelected, 
            item, 
            state.originalAllColumns, // Use original structure for group reference
            dropPosition.targetId, 
            dropPosition.insertBefore,
            false // Don't respect groups in reordering
          );
        } else {
          newSelected = insertItemIntoTreeAtPosition(
            newSelected, 
            item, 
            state.originalAllColumns, // Use original structure for group reference
            dropPosition.targetId,
            dropPosition.insertBefore,
            false // Don't respect groups in reordering
          );
        }

        // For subsequent items, insert after the one we just added
        if (dropPosition.targetId) {
          dropPosition.targetId = item.id;
          dropPosition.insertBefore = false;
        }
      }
      
      // Generate grid columns from the new selected items
      const mainGridColumns = generateGridColumns(newSelected);
      
      return {
        ...state,
        selectedColumns: newSelected,
        mainGridColumns
      };
    }
      
    case 'SET_FLAT_VIEW':
      return {
        ...state,
        isFlatView: action.payload.value
      };
      
    case 'SET_GRID_API':
      return {
        ...state,
        gridApi: action.payload.api
      };
      
    default:
      return state;
  }
}

// Provider component
interface ColumnProviderProps {
  children: ReactNode;
}

export const ColumnProvider: React.FC<ColumnProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(columnReducer, initialState);
  
  // Action creators
  const initialize = useCallback((allPossibleColumns: ColumnItem[], initialData: any[]) => {
    dispatch({ type: 'INITIALIZE', payload: { allPossibleColumns, initialData } });
  }, []);
  
  const toggleExpandAvailable = useCallback((itemId: string) => {
    dispatch({ type: 'TOGGLE_EXPAND_AVAILABLE', payload: { itemId } });
  }, []);
  
  const toggleExpandSelected = useCallback((itemId: string) => {
    dispatch({ type: 'TOGGLE_EXPAND_SELECTED', payload: { itemId } });
  }, []);
  
  const toggleSelectAvailable = useCallback((itemId: string, isMultiSelect: boolean, isRangeSelect: boolean) => {
    dispatch({ 
      type: 'TOGGLE_SELECT_AVAILABLE', 
      payload: { itemId, isMultiSelect, isRangeSelect } 
    });
  }, []);
  
  const toggleSelectSelected = useCallback((itemId: string, isMultiSelect: boolean, isRangeSelect: boolean) => {
    dispatch({ 
      type: 'TOGGLE_SELECT_SELECTED', 
      payload: { itemId, isMultiSelect, isRangeSelect } 
    });
  }, []);
  
  const selectAllAvailable = useCallback(() => {
    dispatch({ type: 'SELECT_ALL_AVAILABLE' });
  }, []);
  
  const selectAllSelected = useCallback(() => {
    dispatch({ type: 'SELECT_ALL_SELECTED' });
  }, []);
  
  const clearSelectionAvailable = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION_AVAILABLE' });
  }, []);
  
  const clearSelectionSelected = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION_SELECTED' });
  }, []);
  
  const moveItemsToSelected = useCallback((ids: string[], dropPosition: DropPosition) => {
    dispatch({ type: 'MOVE_TO_SELECTED', payload: { ids, dropPosition } });
    // Clear selections after move
    dispatch({ type: 'CLEAR_SELECTION_AVAILABLE' });
    dispatch({ type: 'CLEAR_SELECTION_SELECTED' });
  }, []);
  
  const moveItemsToAvailable = useCallback((ids: string[], dropPosition: DropPosition) => {
    dispatch({ type: 'MOVE_TO_AVAILABLE', payload: { ids, dropPosition } });
    // Clear selections after move
    dispatch({ type: 'CLEAR_SELECTION_AVAILABLE' });
    dispatch({ type: 'CLEAR_SELECTION_SELECTED' });
  }, []);
  
  const reorderSelectedItems = useCallback((ids: string[], dropPosition: DropPosition) => {
    dispatch({ type: 'REORDER_SELECTED', payload: { ids, dropPosition } });
    // Clear selection after reordering
    dispatch({ type: 'CLEAR_SELECTION_SELECTED' });
  }, []);
  
  const setFlatView = useCallback((value: boolean) => {
    dispatch({ type: 'SET_FLAT_VIEW', payload: { value } });
  }, []);
  
  const setGridApi = useCallback((api: GridApi) => {
    dispatch({ type: 'SET_GRID_API', payload: { api } });
  }, []);
  
  // Derived values
  const getSelectedCount = useCallback((source: 'available' | 'selected') => {
    const items = source === 'available' ? state.availableColumns : state.selectedColumns;
    return countSelectedItems(items);
  }, [state.availableColumns, state.selectedColumns]);
  
  const getDefaultColDef = useCallback(() => ({
    flex: 1,
    minWidth: 100,
    resizable: true,
    sortable: true,
    filter: true
  }), []);
  
  // Create context value
  const contextValue = useMemo(() => ({
    state,
    initialize,
    toggleExpandAvailable,
    toggleExpandSelected,
    toggleSelectAvailable,
    toggleSelectSelected,
    selectAllAvailable,
    selectAllSelected,
    clearSelectionAvailable,
    clearSelectionSelected,
    moveItemsToSelected,
    moveItemsToAvailable,
    reorderSelectedItems,
    setFlatView,
    setGridApi,
    getSelectedCount,
    getDefaultColDef
  }), [
    state,
    initialize,
    toggleExpandAvailable,
    toggleExpandSelected,
    toggleSelectAvailable,
    toggleSelectSelected,
    selectAllAvailable,
    selectAllSelected,
    clearSelectionAvailable,
    clearSelectionSelected,
    moveItemsToSelected,
    moveItemsToAvailable,
    reorderSelectedItems,
    setFlatView,
    setGridApi,
    getSelectedCount,
    getDefaultColDef
  ]);
  
  return (
    <ColumnContext.Provider value={contextValue}>
      {children}
    </ColumnContext.Provider>
  );
};

// Hook to use the column context
export const useColumnContext = () => {
  const context = useContext(ColumnContext);
  if (!context) {
    throw new Error('useColumnContext must be used within a ColumnProvider');
  }
  return context;
};

// Helper functions that operate on the trees of column items

// Toggle expansion state of an item
function toggleExpandState(items: ColumnItem[], itemId: string): ColumnItem[] {
  return items.map(item => {
    if (item.id === itemId) {
      return { ...item, expanded: !item.expanded };
    }
    if (item.children) {
      return {
        ...item,
        children: toggleExpandState(item.children, itemId)
      };
    }
    return item;
  });
}

// Toggle selection state of an item with support for multi-select
function toggleItemSelection(
  items: ColumnItem[],
  itemId: string,
  isMultiSelect: boolean,
  isRangeSelect: boolean,
  lastSelectedId: string | null,
  flatView: boolean
): [ColumnItem[], string | null] {
  let newLastSelectedId = itemId;
  
  // Handle range selection
  if (isRangeSelect && lastSelectedId) {
    const allItems = getAllVisibleItems(items, flatView);
    const currentIndex = allItems.findIndex(item => item.id === itemId);
    const lastIndex = allItems.findIndex(item => item.id === lastSelectedId);
    
    if (currentIndex >= 0 && lastIndex >= 0) {
      const startIdx = Math.min(currentIndex, lastIndex);
      const endIdx = Math.max(currentIndex, lastIndex);
      const rangeIds = new Set(allItems.slice(startIdx, endIdx + 1).map(item => item.id));
      
      return [
        updateSelectionState(items, (item) => {
          // If in range, always select
          if (rangeIds.has(item.id)) {
            return true;
          }
          // If not multi-select, deselect all items outside range
          if (!isMultiSelect && (item.selected === true) && !rangeIds.has(item.id)) {
            return false;
          }
          // Otherwise keep current selection
          return item.selected === true;
        }),
        newLastSelectedId
      ];
    }
  }
  
  // Regular selection toggle
  return [
    updateSelectionState(items, (item) => {
      if (item.id === itemId) {
        // Toggle this item
        return !(item.selected === true);
      }
      // If not multi-select, deselect all other items
      if (!isMultiSelect && !isRangeSelect && (item.selected === true)) {
        return false;
      }
      // Otherwise keep current selection
      return item.selected === true;
    }),
    newLastSelectedId
  ];
}

// Update selection state using a predicate function
function updateSelectionState(
  items: ColumnItem[],
  selectionPredicate: (item: ColumnItem) => boolean
): ColumnItem[] {
  return items.map(item => {
    const newSelectionState = selectionPredicate(item);
    
    if (item.children && item.children.length > 0) {
      return {
        ...item,
        selected: newSelectionState,
        children: updateSelectionState(item.children, selectionPredicate)
      };
    }
    
    return { ...item, selected: newSelectionState };
  });
}

// Select all items in a tree
function selectAllItems(items: ColumnItem[]): ColumnItem[] {
  return updateSelectionState(items, () => true);
}

// Clear all selections in a tree
function clearAllSelections(items: ColumnItem[]): ColumnItem[] {
  return updateSelectionState(items, () => false);
}

// Get all visible items as a flat list
function getAllVisibleItems(
  items: ColumnItem[],
  flatView: boolean
): { id: string, index: number }[] {
  const result: { id: string, index: number }[] = [];
  let index = 0;
  
  if (flatView) {
    // In flat view, we only include leaf nodes
    const processItems = (itemList: ColumnItem[]) => {
      for (const item of itemList) {
        if (item.field && (!item.children || item.children.length === 0)) {
          result.push({ id: item.id, index: index++ });
        }
        
        if (item.children && item.children.length > 0) {
          processItems(item.children);
        }
      }
    };
    
    processItems(items);
  } else {
    // In tree view, respect expansion state
    const processItems = (itemList: ColumnItem[]) => {
      for (const item of itemList) {
        result.push({ id: item.id, index: index++ });
        
        if (item.children && item.children.length > 0 && item.expanded) {
          processItems(item.children);
        }
      }
    };
    
    processItems(items);
  }
  
  return result;
}

// Find an item in the tree by ID
function findItemInTree(items: ColumnItem[], itemId: string): ColumnItem | null {
  for (const item of items) {
    if (item.id === itemId) {
      return item;
    }
    
    if (item.children) {
      const found = findItemInTree(item.children, itemId);
      if (found) return found;
    }
  }
  
  return null;
}

// Create a deep clone of an item and its children
function deepCloneItem(item: ColumnItem): ColumnItem {
  return {
    ...item,
    children: item.children ? item.children.map(deepCloneItem) : undefined,
    selected: false // Reset selection state when cloning
  };
}

// Remove an item from a tree by ID
function removeItemFromTree(items: ColumnItem[], itemId: string): ColumnItem[] {
  // First filter out the item at this level
  const result = items.filter(item => item.id !== itemId);
  
  // Then process children recursively
  const processedResult = result.map(item => {
    if (item.children && item.children.length > 0) {
      return {
        ...item,
        children: removeItemFromTree(item.children, itemId)
      };
    }
    return item;
  });
  
  // Filter out empty groups (groups with no children)
  return processedResult.filter(item => 
    !item.children || item.children.length > 0 || item.field
  );
}

// Insert an item into a tree at a specific position
function insertItemIntoTreeAtPosition(
  items: ColumnItem[],
  item: ColumnItem,
  allPossibleCols: ColumnItem[],
  targetId?: string,
  insertBefore: boolean = true,
  respectGroups: boolean = true
): ColumnItem[] {
  // If we should ignore groups (for example, in selected panel)
  if (!respectGroups) {
    if (targetId) {
      const targetIndex = items.findIndex(i => i.id === targetId);
      if (targetIndex >= 0) {
        // Insert before or after target
        const insertIndex = insertBefore ? targetIndex : targetIndex + 1;
        // Make sure we don't already have this item
        if (!items.some(existingItem => existingItem.id === item.id)) {
          items.splice(insertIndex, 0, item);
        }
        return items;
      }
    }
    
    // Add to the end if target not found
    if (!items.some(existingItem => existingItem.id === item.id)) {
      items.push(item);
    }
    
    return items;
  }

  // Normal group-based insertion (for available panel)
  // Find which group this item belongs to
  for (const group of allPossibleCols) {
    if (group.children && group.children.some(child => child.id === item.id)) {
      // Find or create the group in items
      let targetGroup = items.find(i => i.id === group.id);
      
      if (!targetGroup) {
        // Create the group if it doesn't exist
        targetGroup = {
          id: group.id,
          name: group.name,
          field: group.field,
          expanded: true,
          children: []
        };
        items.push(targetGroup);
      }
      
      if (!targetGroup.children) {
        targetGroup.children = [];
      }
      
      // If we have a target ID and it's in this group, insert at position
      if (targetId) {
        const targetIndex = targetGroup.children.findIndex(child => child.id === targetId);
        if (targetIndex >= 0) {
          // Insert before or after target
          const insertIndex = insertBefore ? targetIndex : targetIndex + 1;
          // Make sure we don't already have this item
          if (!targetGroup.children.some(child => child.id === item.id)) {
            targetGroup.children.splice(insertIndex, 0, item);
          }
          return items;
        }
      }
      
      // Add to the end of the group if target not found
      if (!targetGroup.children.some(child => child.id === item.id)) {
        targetGroup.children.push(item);
      }
      
      return items;
    }
  }
  
  // If not found in a group, handle as top-level item
  if (targetId) {
    const targetIndex = items.findIndex(i => i.id === targetId);
    if (targetIndex >= 0) {
      // Insert before or after target
      const insertIndex = insertBefore ? targetIndex : targetIndex + 1;
      // Make sure we don't already have this item
      if (!items.some(existingItem => existingItem.id === item.id)) {
        items.splice(insertIndex, 0, item);
      }
      return items;
    }
  }
  
  // Add to the end if target not found
  if (!items.some(existingItem => existingItem.id === item.id)) {
    items.push(item);
  }
  
  return items;
}

// Insert an item into a flat list at a specific position
function insertItemIntoFlatList(
  tree: ColumnItem[],
  item: ColumnItem,
  allPossibleCols: ColumnItem[],
  targetId?: string,
  insertBefore: boolean = true,
  respectGroups: boolean = true
): ColumnItem[] {
  // If we're in the selected panel, don't respect groups
  if (!respectGroups) {
    // Simply insert at the root level based on target position
    if (targetId) {
      // Find the item directly at the root level first
      let targetIndex = tree.findIndex(i => i.id === targetId);
      
      if (targetIndex >= 0) {
        // Found at root, insert directly
        const insertIndex = insertBefore ? targetIndex : targetIndex + 1;
        
        if (!tree.some(i => i.id === item.id)) {
          const newTree = [...tree];
          newTree.splice(insertIndex, 0, item);
          return newTree;
        }
      } else {
        // Item might be in a nested group
        // Flatten the entire tree to find the item's index
        const flatView = flattenTreeWithParentInfo(tree);
        const targetInfo = flatView.find(fi => fi.id === targetId);
        
        if (targetInfo) {
          // Found the target in a nested position
          if (!tree.some(i => i.id === item.id)) {
            // Add to the root level at the end
            return [...tree, item];
          }
        }
      }
    }
    
    // Default: add to the end if not found or no target
    if (!tree.some(i => i.id === item.id)) {
      return [...tree, item];
    }
    
    return tree;
  }
  
  // Original group-respecting behavior for Available panel
  // If no target, add to appropriate group and return
  if (!targetId) {
    return insertItemIntoTreeAtPosition(tree, item, allPossibleCols, undefined, true, true);
  }
  
  // First, find which group this item belongs to
  let itemGroupId = '';
  
  for (const group of allPossibleCols) {
    if (group.children && group.children.some(child => child.id === item.id)) {
      itemGroupId = group.id;
      break;
    }
  }
  
  // Get a flat representation of the tree
  const flatItems = flattenTreeWithParentInfo(tree);
  
  // Find the target item
  const targetItemInfo = flatItems.find(fi => fi.id === targetId);
  if (!targetItemInfo) {
    // If target not found, default to group insertion
    return insertItemIntoTreeAtPosition(tree, item, allPossibleCols, undefined, true, true);
  }
  
  // Determine where to insert
  const targetParentId = targetItemInfo.parentId;
  
  if (targetParentId) {
    // Target is in a group, insert into that group
    const newTree = [...tree];
    let targetGroup = findItemInTree(newTree, targetParentId);
    
    if (targetGroup && targetGroup.children) {
      const targetIndex = targetGroup.children.findIndex(child => child.id === targetId);
      const insertIndex = insertBefore ? targetIndex : targetIndex + 1;
      
      // Clone to avoid mutation
      const newGroup = { ...targetGroup };
      const newChildren = targetGroup.children ? [...targetGroup.children] : [];
      
      // Insert item if not already present
      if (!newChildren.some(child => child.id === item.id)) {
        newChildren.splice(insertIndex, 0, item);
      }
      
      newGroup.children = newChildren;
      
      // Update the group in the tree
      return newTree.map(treeItem => 
        treeItem.id === targetParentId ? newGroup : treeItem
      );
    }
  } else if (itemGroupId) {
    // Item has a defined group, insert into that group
    let targetGroup = findItemInTree(tree, itemGroupId);
    
    if (!targetGroup) {
      // Create the group if needed
      const groupInfo = findItemInTree(allPossibleCols, itemGroupId);
      if (groupInfo) {
        const newGroup: ColumnItem = {
          id: groupInfo.id,
          name: groupInfo.name,
          field: groupInfo.field,
          expanded: true,
          children: [item]
        };
        
        return [...tree, newGroup];
      }
    } else if (targetGroup.children) {
      // Add to existing group at end
      const newTree = [...tree];
      const groupIndex = newTree.findIndex(g => g.id === itemGroupId);
      
      if (groupIndex >= 0) {
        const newGroup = { ...newTree[groupIndex] };
        const newChildren = newGroup.children ? [...newGroup.children] : [];
        
        if (!newChildren.some(child => child.id === item.id)) {
          newChildren.push(item);
        }
        
        newGroup.children = newChildren;
        newTree[groupIndex] = newGroup;
        return newTree;
      }
    }
  }
  
  // Default to inserting at root level
  const targetIndex = tree.findIndex(i => i.id === targetId);
  const insertIndex = insertBefore ? targetIndex : targetIndex + 1;
  
  const newTree = [...tree];
  if (!newTree.some(i => i.id === item.id)) {
    newTree.splice(insertIndex, 0, item);
  }
  
  return newTree;
}

// Count selected items in a tree
function countSelectedItems(items: ColumnItem[]): number {
  let count = 0;
  
  const countSelected = (itemList: ColumnItem[]) => {
    for (const item of itemList) {
      if (item.selected) {
        count++;
      }
      
      if (item.children && item.children.length > 0) {
        countSelected(item.children);
      }
    }
  };
  
  countSelected(items);
  return count;
}

// Generate AG Grid column definitions from a tree of column items
function generateGridColumns(items: ColumnItem[]): ColDef[] {
  const result: ColDef[] = [];
  
  const processItem = (item: ColumnItem) => {
    if (item.field) {
      result.push({
        field: item.field,
        headerName: item.name,
        sortable: true,
        filter: true
      });
    }
    
    if (item.children && item.children.length > 0) {
      item.children.forEach(processItem);
    }
  };
  
  items.forEach(processItem);
  return result;
}