import { ColumnState, ColumnAction } from './types';
import { 
  toggleExpandState, 
  toggleItemSelection, 
  selectAllItems,
  clearAllSelections,
  findItemInTree,
  deepCloneItem,
  removeItemFromTree,
  insertItemIntoTreeAtPosition,
  insertItemIntoFlatList,
  generateGridColumns
} from './columnOperations';
import { ColumnItem } from '../../types';

// Initial state
export const initialState: ColumnState = {
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

// Reducer function
export function columnReducer(state: ColumnState, action: ColumnAction): ColumnState {
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
        false // Available columns always in tree view
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
      
    case 'MOVE_SELECTED_UP': {
      // Only proceed if there are selected items
      if (!state.selectedColumns.some(col => col.selected)) {
        return state;
      }
      
      // Get all selected IDs
      const selectedIds = state.selectedColumns
        .filter(col => col.selected)
        .map(col => col.id);
      
      // Copy the current selected columns
      let newSelectedColumns = [...state.selectedColumns];
      
      // Sort selectedIds by their current position to maintain relative order
      const positionMap = new Map<string, number>();
      newSelectedColumns.forEach((col, index) => {
        positionMap.set(col.id, index);
      });
      
      selectedIds.sort((a, b) => {
        const posA = positionMap.get(a) || 0;
        const posB = positionMap.get(b) || 0;
        return posA - posB;
      });
      
      // Move each selected item up (if possible)
      for (const id of selectedIds) {
        const currentIndex = newSelectedColumns.findIndex(col => col.id === id);
        if (currentIndex > 0) {
          // Check if the item above is also selected
          const itemAbove = newSelectedColumns[currentIndex - 1];
          if (!itemAbove.selected) {
            // Swap with item above
            const temp = newSelectedColumns[currentIndex];
            newSelectedColumns[currentIndex] = newSelectedColumns[currentIndex - 1];
            newSelectedColumns[currentIndex - 1] = temp;
          }
        }
      }
      
      // Generate new grid columns
      const mainGridColumns = newSelectedColumns.map(col => ({
        field: col.field,
        headerName: col.name,
        sortable: true,
        filter: true
      }));
      
      return {
        ...state,
        selectedColumns: newSelectedColumns,
        mainGridColumns
      };
    }

    case 'MOVE_SELECTED_DOWN': {
      // Only proceed if there are selected items
      if (!state.selectedColumns.some(col => col.selected)) {
        return state;
      }
      
      // Get all selected IDs
      const selectedIds = state.selectedColumns
        .filter(col => col.selected)
        .map(col => col.id);
      
      // Copy the current selected columns
      let newSelectedColumns = [...state.selectedColumns];
      
      // Sort selectedIds by their current position in reverse order
      // This ensures we move bottom items first to avoid ordering issues
      const positionMap = new Map<string, number>();
      newSelectedColumns.forEach((col, index) => {
        positionMap.set(col.id, index);
      });
      
      selectedIds.sort((a, b) => {
        const posA = positionMap.get(a) || 0;
        const posB = positionMap.get(b) || 0;
        return posB - posA; // Sort in reverse order
      });
      
      // Move each selected item down (if possible)
      for (const id of selectedIds) {
        const currentIndex = newSelectedColumns.findIndex(col => col.id === id);
        if (currentIndex < newSelectedColumns.length - 1) {
          // Check if the item below is also selected
          const itemBelow = newSelectedColumns[currentIndex + 1];
          if (!itemBelow.selected) {
            // Swap with item below
            const temp = newSelectedColumns[currentIndex];
            newSelectedColumns[currentIndex] = newSelectedColumns[currentIndex + 1];
            newSelectedColumns[currentIndex + 1] = temp;
          }
        }
      }
      
      // Generate new grid columns
      const mainGridColumns = newSelectedColumns.map(col => ({
        field: col.field,
        headerName: col.name,
        sortable: true,
        filter: true
      }));
      
      return {
        ...state,
        selectedColumns: newSelectedColumns,
        mainGridColumns
      };
    }

    case 'CLEAR_SELECTED': {
      // If there are no selected columns, nothing to do
      if (state.selectedColumns.length === 0) {
        return state;
      }
    
      // Track existing item IDs in the available columns
      const existingAvailableIds = new Set<string>();
      const collectIds = (items: ColumnItem[]) => {
        for (const item of items) {
          existingAvailableIds.add(item.id);
          if (item.children && item.children.length > 0) {
            collectIds(item.children);
          }
        }
      };
      collectIds(state.availableColumns);
    
      // Copy of available columns to modify
      let newAvailable = [...state.availableColumns];
      
      // Process each column from selected columns
      for (const column of state.selectedColumns) {
        // Skip if this ID already exists in available columns
        if (existingAvailableIds.has(column.id)) {
          continue;
        }
        
        // Find where this column belongs in the original structure
        const findGroupPath = (id: string, items: ColumnItem[], currentPath: string[] = []): string[] => {
          for (const item of items) {
            if (item.id === id) {
              return [...currentPath];
            }
            
            if (item.children && item.children.length > 0) {
              const path = findGroupPath(id, item.children, [...currentPath, item.id]);
              if (path.length > 0) {
                return path;
              }
            }
          }
          
          return [];
        };
        
        const groupPath = findGroupPath(column.id, state.originalAllColumns);
        
        // If no path found or empty path (root level), add to root
        if (groupPath.length === 0) {
          newAvailable.push({
            ...column,
            selected: false
          });
          existingAvailableIds.add(column.id);
          continue;
        }
        
        // Item belongs in a group structure - rebuild path as needed
        let currentItems = newAvailable;
        
        for (let i = 0; i < groupPath.length; i++) {
          const groupId = groupPath[i];
          let group = currentItems.find(item => item.id === groupId);
          
          if (!group) {
            // Find group info from original structure
            const findOriginalGroup = (id: string, items: ColumnItem[]): ColumnItem | null => {
              for (const item of items) {
                if (item.id === id) {
                  return item;
                }
                
                if (item.children && item.children.length > 0) {
                  const found = findOriginalGroup(id, item.children);
                  if (found) return found;
                }
              }
              
              return null;
            };
            
            const originalGroup = findOriginalGroup(groupId, state.originalAllColumns);
            if (!originalGroup) {
              // If we can't find the group, add at current level
              currentItems.push({
                ...column,
                selected: false
              });
              existingAvailableIds.add(column.id);
              break;
            }
            
            // Create new group
            group = {
              id: originalGroup.id,
              name: originalGroup.name,
              field: originalGroup.field,
              expanded: true,
              selected: false,
              children: []
            };
            
            currentItems.push(group);
          }
          
          // Ensure group has children array
          if (!group.children) {
            group.children = [];
          }
          
          // Move to next level in hierarchy
          currentItems = group.children;
          // We don't need to track the parent since we're not using it
        }
        
        // Now add the column to the last level
        if (currentItems && !currentItems.some(item => item.id === column.id)) {
          currentItems.push({
            ...column,
            selected: false,
            children: undefined // Remove children for leaf nodes
          });
          existingAvailableIds.add(column.id);
        }
      }
      
      return {
        ...state,
        availableColumns: newAvailable,
        selectedColumns: [],
        mainGridColumns: []
      };
    }

    case 'MOVE_TO_SELECTED': {
      const { ids, dropPosition } = action.payload;
      console.log('MOVE_TO_SELECTED action triggered', { ids, dropPosition });

      // Create new copies of arrays
      let newAvailable = [...state.availableColumns];
      
      // Get a completely flat version of the selected columns
      // We'll bypass the grouping structure entirely
      const flattenItems = (items: ColumnItem[]): ColumnItem[] => {
        const result: ColumnItem[] = [];
        
        const flatten = (itemList: ColumnItem[]) => {
          for (const item of itemList) {
            if (item.field) { // Only include leaf nodes with fields
              // Create a copy without children
              const flatItem = { ...item };
              delete flatItem.children;
              result.push(flatItem);
            }
            
            if (item.children && item.children.length > 0) {
              flatten(item.children);
            }
          }
        };
        
        flatten(items);
        return result;
      };
      
      // Get current flat selected columns
      let flatSelectedColumns = flattenItems(state.selectedColumns);
      
      // Collect items to move, using a Set to track IDs and prevent duplicates
      const itemsToMove: ColumnItem[] = [];
      const addedItemIds = new Set<string>();
      
      // Find each item to move in the available columns tree
      for (const id of ids) {
        const findItem = (items: ColumnItem[]): ColumnItem | null => {
          for (const item of items) {
            if (item.id === id) {
              return item;
            }
            
            if (item.children && item.children.length > 0) {
              const childResult = findItem(item.children);
              if (childResult) return childResult;
            }
          }
          
          return null;
        };
        
        const item = findItem(state.availableColumns);
        
        if (item) {
          if (item.field) {
            // This is a field item - add it directly if not already added
            if (!addedItemIds.has(item.id)) {
              const flatItem = { ...item };
              delete flatItem.children;
              itemsToMove.push(flatItem);
              addedItemIds.add(item.id);
            }
          } else if (item.children && item.children.length > 0) {
            // This is a group - add all its leaf node children if not already added
            const groupChildren = flattenItems([item]);
            // Only add items with fields (leaf nodes) that haven't been added yet
            for (const child of groupChildren) {
              if (!addedItemIds.has(child.id)) {
                itemsToMove.push(child);
                addedItemIds.add(child.id);
              }
            }
          }
        }
      }
      
      console.log('Items to move:', itemsToMove.map(i => i.name));
      
      // Remove items from available
      for (const id of Array.from(addedItemIds)) {
        // For groups, we need to also remove all child items
        const removeGroupAndChildren = (items: ColumnItem[], id: string): ColumnItem[] => {
          // First find the item
          const itemIndex = items.findIndex(item => item.id === id);
          
          if (itemIndex >= 0) {
            const item = items[itemIndex];
            
            // If it's a group, collect all child IDs
            if (item.children && item.children.length > 0) {
              // Gather all child IDs
              const getAllChildIds = (children: ColumnItem[]): string[] => {
                let childIds: string[] = [];
                
                for (const child of children) {
                  childIds.push(child.id);
                  
                  if (child.children && child.children.length > 0) {
                    childIds = [...childIds, ...getAllChildIds(child.children)];
                  }
                }
                
                return childIds;
              };
              
              // Get all child IDs
              const childIds = getAllChildIds(item.children);
              
              // Make a copy of the array without the group
              let result = [...items];
              result.splice(itemIndex, 1);
              
              // Remove all children recursively
              for (const childId of childIds) {
                result = removeGroupAndChildren(result, childId);
              }
              
              return result;
            } else {
              // Just remove this item
              return [...items.slice(0, itemIndex), ...items.slice(itemIndex + 1)];
            }
          }
          
          // If not found at this level, check children
          return items.map(item => {
            if (item.children && item.children.length > 0) {
              return {
                ...item,
                children: removeGroupAndChildren(item.children, id)
              };
            }
            return item;
          });
        };
        
        newAvailable = removeGroupAndChildren(newAvailable, id);
      }
      
      // Handle the insertion into the flat selected list
      if (dropPosition.targetId) {
        // Find target in the flat list
        const targetIndex = flatSelectedColumns.findIndex(col => col.id === dropPosition.targetId);
        
        if (targetIndex >= 0) {
          // Calculate insertion index
          const insertIndex = dropPosition.insertBefore ? targetIndex : targetIndex + 1;
          console.log(`Insert position found: index ${insertIndex} (before: ${dropPosition.insertBefore})`);
          
          // Insert all items at that position
          flatSelectedColumns.splice(insertIndex, 0, ...itemsToMove);
        } else {
          // Target not found, append to the end
          console.log('Target not found in selected columns, appending to end');
          flatSelectedColumns = [...flatSelectedColumns, ...itemsToMove];
        }
      } else {
        // No target specified, append to the end
        console.log('No target specified, appending to end');
        flatSelectedColumns = [...flatSelectedColumns, ...itemsToMove];
      }
      
      // Generate grid columns from the flat list
      const mainGridColumns = flatSelectedColumns.map(col => ({
        field: col.field,
        headerName: col.name,
        sortable: true,
        filter: true
      }));
      
      return {
        ...state,
        availableColumns: newAvailable,
        selectedColumns: flatSelectedColumns, // Use the flat list directly
        mainGridColumns
      };
    }
      
    case 'MOVE_TO_AVAILABLE': {
      const { ids, dropPosition } = action.payload;

      console.log('MOVE_TO_AVAILABLE action triggered', { ids, dropPosition });

      let newAvailable = [...state.availableColumns];
      let newSelected = [...state.selectedColumns];
      
      // Collect items to move
      const itemsToMove: ColumnItem[] = [];
      
      for (const id of ids) {
        const item = findItemInTree(state.selectedColumns, id);
        if (item) {
          itemsToMove.push(deepCloneItem(item));
        }
      }
      
      // Remove items from source
      for (const id of ids) {
        newSelected = removeItemFromTree(newSelected, id);
      }
      
      // Add items to destination
      for (const item of itemsToMove) {
        newAvailable = insertItemIntoTreeAtPosition(
          newAvailable, 
          item, 
          state.originalAllColumns,
          dropPosition.targetId,
          dropPosition.insertBefore,
          true // Respect groups when moving back to available
        );
        
        // For subsequent items, insert after the one we just added
        if (dropPosition.targetId) {
          dropPosition.targetId = item.id;
          dropPosition.insertBefore = false;
        }
      }
      
      // Generate grid columns
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
      
      // Skip if dropping onto self
      if (ids.length === 1 && ids[0] === dropPosition.targetId) {
        return state;
      }
      
      let newSelected = [...state.selectedColumns];
      
      // Collect items to move
      const itemsToMove: ColumnItem[] = [];
      
      for (const id of ids) {
        const item = findItemInTree(newSelected, id);
        if (item) {
          itemsToMove.push(deepCloneItem(item));
        }
      }
      
      // Remove items from source
      for (const id of ids) {
        newSelected = removeItemFromTree(newSelected, id);
      }
      
      // Add items back at new position
      for (const item of itemsToMove) {
        if (state.isFlatView) {
          newSelected = insertItemIntoFlatList(
            newSelected, 
            item, 
            state.originalAllColumns,
            dropPosition.targetId, 
            dropPosition.insertBefore,
            false // Don't respect groups in reordering
          );
        } else {
          newSelected = insertItemIntoTreeAtPosition(
            newSelected, 
            item, 
            state.originalAllColumns,
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
      
      // Generate grid columns
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