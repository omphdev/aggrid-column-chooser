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

      let newAvailable = [...state.availableColumns];
      let newSelected = [...state.selectedColumns];
      
      // Collect items to move
      const itemsToMove: ColumnItem[] = [];
      
      for (const id of ids) {
        const item = findItemInTree(state.availableColumns, id);
        if (item) {
          itemsToMove.push(deepCloneItem(item));
        }
      }
      
      // Remove items from source
      for (const id of ids) {
        newAvailable = removeItemFromTree(newAvailable, id);
      }
      
      // Add items to destination
      for (const item of itemsToMove) {
        if (state.isFlatView) {
          newSelected = insertItemIntoFlatList(
            newSelected, 
            item, 
            state.originalAllColumns,
            dropPosition.targetId, 
            dropPosition.insertBefore,
            false // Don't respect groups in selected panel
          );
        } else {
          newSelected = insertItemIntoTreeAtPosition(
            newSelected, 
            item, 
            state.originalAllColumns,
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
      
      // Generate grid columns
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