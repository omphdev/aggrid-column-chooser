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
        
        // Collect items to move
        const itemsToMove: ColumnItem[] = [];
        
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
              // This is a field item - add it directly
              const flatItem = { ...item };
              delete flatItem.children;
              itemsToMove.push(flatItem);
            } else if (item.children && item.children.length > 0) {
              // This is a group - add all its leaf node children
              const groupChildren = flattenItems([item]);
              // Only add items with fields (leaf nodes)
              itemsToMove.push(...groupChildren);
            }
          }
        }
        
        console.log('Items to move:', itemsToMove.map(i => i.name));
        
        // Remove items from available
        for (const id of ids) {
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