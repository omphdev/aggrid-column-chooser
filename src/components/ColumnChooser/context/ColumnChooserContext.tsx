import React, { createContext, useContext, useReducer, useMemo, ReactNode, useCallback } from 'react';
import { ExtendedColDef, ColumnGroup, OperationType, ColumnGroupAction } from '../../../types';

// Context state interface
interface ColumnChooserState {
  availableColumns: ExtendedColDef[];
  selectedColumns: ExtendedColDef[];
  columnGroups: ColumnGroup[];
  selectedItems: string[];
  expandedGroups: Set<string>;
  expandedSelectedGroups: Set<string>;
  searchTerm: string;
}

// Action types for the reducer
type ActionType = 
  | { type: 'SET_AVAILABLE_COLUMNS', columns: ExtendedColDef[] }
  | { type: 'SET_SELECTED_COLUMNS', columns: ExtendedColDef[] }
  | { type: 'SET_COLUMN_GROUPS', groups: ColumnGroup[] }
  | { type: 'ADD_TO_SELECTED', columns: ExtendedColDef[], index?: number }
  | { type: 'REMOVE_FROM_SELECTED', columnIds: string[] }
  | { type: 'REORDER_SELECTED', columnId: string, targetIndex: number, selectedItems: string[] }
  | { type: 'REORDER_GROUP', groupName: string, targetIndex: number }
  | { type: 'MOVE_UP', columnIds: string[] }
  | { type: 'MOVE_DOWN', columnIds: string[] }
  | { type: 'SELECT_ITEMS', ids: string[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'TOGGLE_GROUP', groupPath: string, panelType: 'available' | 'selected' }
  | { type: 'ADD_TO_GROUP', groupName: string, columnIds: string[] }
  | { type: 'REMOVE_FROM_GROUP', groupName: string, columnIds: string[] }
  | { type: 'CREATE_GROUP', groupName: string, columnIds: string[] }
  | { type: 'SET_SEARCH_TERM', term: string }
  | { type: 'CLEAR_ALL' };

// Context interface
interface ColumnChooserContextProps {
  state: ColumnChooserState;
  addToSelected: (columnIds: string[], index?: number) => void;
  removeFromSelected: (columnIds: string[]) => void;
  reorderSelected: (columnId: string, targetIndex: number, selectedItems: string[]) => void;
  reorderGroup: (groupName: string, targetIndex: number) => void;
  moveUp: (columnIds: string[]) => void;
  moveDown: (columnIds: string[]) => void;
  selectItems: (ids: string[]) => void;
  clearSelection: () => void;
  toggleGroup: (groupPath: string, panelType: 'available' | 'selected') => void;
  addToGroup: (groupName: string, columnIds: string[]) => void;
  removeFromGroup: (groupName: string, columnIds: string[]) => void;
  createGroup: (groupName: string, columnIds: string[]) => void;
  setSearchTerm: (term: string) => void;
  clearAll: () => void;
  onColumnChanged: (columns: ExtendedColDef[], operationType: OperationType) => void;
  onColumnGroupChanged: (headerName: string, action: ColumnGroupAction, replacementName?: string) => void;
}

// Create the context
const ColumnChooserContext = createContext<ColumnChooserContextProps | undefined>(undefined);

// The reducer function for state updates
function columnChooserReducer(state: ColumnChooserState, action: ActionType): ColumnChooserState {
  switch (action.type) {
    case 'SET_AVAILABLE_COLUMNS':
      return {
        ...state,
        availableColumns: action.columns
      };
    
    case 'SET_SELECTED_COLUMNS':
      return {
        ...state,
        selectedColumns: action.columns
      };
    
    case 'SET_COLUMN_GROUPS':
      return {
        ...state,
        columnGroups: action.groups
      };
    
    case 'ADD_TO_SELECTED': {
      // Find columns in available that need to be moved
      const columnsToMove = state.availableColumns.filter(col => 
        action.columns.some(c => c.field === col.field)
      );
      
      if (columnsToMove.length === 0) return state;
      
      // Remove columns from available
      const newAvailable = state.availableColumns.filter(col => 
        !action.columns.some(c => c.field === col.field)
      );
      
      // Add columns to selected at specified index or at the end
      let newSelected = [...state.selectedColumns];
      const index = action.index !== undefined ? action.index : newSelected.length;
      
      newSelected = [
        ...newSelected.slice(0, index),
        ...columnsToMove.map(col => ({ ...col, hide: false })),
        ...newSelected.slice(index)
      ];
      
      return {
        ...state,
        availableColumns: newAvailable,
        selectedColumns: newSelected
      };
    }
    
    case 'REMOVE_FROM_SELECTED': {
      // Find columns in selected that need to be moved
      const columnsToMove = state.selectedColumns.filter(col => 
        action.columnIds.includes(col.field)
      );
      
      if (columnsToMove.length === 0) return state;
      
      // Remove columns from selected
      const newSelected = state.selectedColumns.filter(col => 
        !action.columnIds.includes(col.field)
      );
      
      // Add columns to available
      const newAvailable = [
        ...state.availableColumns,
        ...columnsToMove.map(col => ({ ...col, hide: true }))
      ];
      
      // Update column groups to remove these columns
      const newGroups = state.columnGroups.map(group => ({
        ...group,
        children: group.children.filter(child => !action.columnIds.includes(child))
      })).filter(group => group.children.length > 0);
      
      return {
        ...state,
        availableColumns: newAvailable,
        selectedColumns: newSelected,
        columnGroups: newGroups,
        selectedItems: state.selectedItems.filter(id => !action.columnIds.includes(id))
      };
    }
    
    case 'REORDER_SELECTED': {
      // If dragging multiple items
      const isMultiDrag = state.selectedItems.includes(action.columnId) && state.selectedItems.length > 1;
      const itemsToReorder = isMultiDrag ? state.selectedItems : [action.columnId];
      
      // Create a deep copy of selectedColumns
      const newSelected = [...state.selectedColumns];
      
      // Find indices of items to move
      const indices = itemsToReorder
        .map(id => newSelected.findIndex(col => col.field === id))
        .filter(idx => idx !== -1)
        .sort((a, b) => a - b);
      
      if (indices.length === 0) return state;
      
      // Extract columns to move
      const columnsToMove = indices.map(idx => newSelected[idx]);
      
      // Remove columns from original positions (from end to avoid index shifting)
      for (let i = indices.length - 1; i >= 0; i--) {
        newSelected.splice(indices[i], 1);
      }
      
      // Calculate adjusted target index
      let adjustedIndex = action.targetIndex;
      for (const idx of indices) {
        if (idx < action.targetIndex) {
          adjustedIndex--;
        }
      }
      
      // Insert columns at the target position
      newSelected.splice(
        Math.max(0, Math.min(adjustedIndex, newSelected.length)), 
        0, 
        ...columnsToMove
      );
      
      return {
        ...state,
        selectedColumns: newSelected
      };
    }
    
    case 'REORDER_GROUP': {
      // Find the group
      const group = state.columnGroups.find(g => g.headerName === action.groupName);
      if (!group) return state;
      
      // Get columns in this group
      const groupColumns = state.selectedColumns.filter(col => 
        group.children.includes(col.field)
      );
      
      if (groupColumns.length === 0) return state;
      
      // Remove group columns from selected
      const remainingColumns = state.selectedColumns.filter(col => 
        !group.children.includes(col.field)
      );
      
      // Calculate the actual target index
      const targetIndex = Math.max(0, Math.min(action.targetIndex, remainingColumns.length));
      
      // Create new selected columns array with group at the target position
      const newSelected = [
        ...remainingColumns.slice(0, targetIndex),
        ...groupColumns,
        ...remainingColumns.slice(targetIndex)
      ];
      
      return {
        ...state,
        selectedColumns: newSelected
      };
    }
    
    case 'MOVE_UP': {
      if (action.columnIds.length === 0) return state;
      
      const newSelected = [...state.selectedColumns];
      const indices = action.columnIds
        .map(id => newSelected.findIndex(col => col.field === id))
        .filter(idx => idx !== -1)
        .sort((a, b) => a - b); // Sort in ascending order
      
      // Can't move up if the first item is already at the top
      if (indices[0] === 0) return state;
      
      // Move each selected item up one position
      indices.forEach(idx => {
        const temp = newSelected[idx];
        newSelected[idx] = newSelected[idx - 1];
        newSelected[idx - 1] = temp;
      });
      
      return {
        ...state,
        selectedColumns: newSelected
      };
    }
    
    case 'MOVE_DOWN': {
      if (action.columnIds.length === 0) return state;
      
      const newSelected = [...state.selectedColumns];
      const indices = action.columnIds
        .map(id => newSelected.findIndex(col => col.field === id))
        .filter(idx => idx !== -1)
        .sort((a, b) => b - a); // Sort in descending order
      
      // Can't move down if the last item is already at the bottom
      if (indices[0] === newSelected.length - 1) return state;
      
      // Move each selected item down one position
      indices.forEach(idx => {
        const temp = newSelected[idx];
        newSelected[idx] = newSelected[idx + 1];
        newSelected[idx + 1] = temp;
      });
      
      return {
        ...state,
        selectedColumns: newSelected
      };
    }
    
    case 'SELECT_ITEMS':
      return {
        ...state,
        selectedItems: action.ids
      };
    
    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedItems: []
      };
    
    case 'TOGGLE_GROUP': {
      const expandedSet = action.panelType === 'available' 
        ? new Set(state.expandedGroups) 
        : new Set(state.expandedSelectedGroups);
      
      if (expandedSet.has(action.groupPath)) {
        expandedSet.delete(action.groupPath);
      } else {
        expandedSet.add(action.groupPath);
      }
      
      return action.panelType === 'available'
        ? { ...state, expandedGroups: expandedSet }
        : { ...state, expandedSelectedGroups: expandedSet };
    }
    
    case 'ADD_TO_GROUP': {
      if (!action.groupName || action.columnIds.length === 0) return state;
      
      // Find the group
      const groupIndex = state.columnGroups.findIndex(g => g.headerName === action.groupName);
      if (groupIndex === -1) return state;
      
      // Update the group with new children
      const newGroups = [...state.columnGroups];
      newGroups[groupIndex] = {
        ...newGroups[groupIndex],
        children: Array.from(new Set([...newGroups[groupIndex].children, ...action.columnIds]))
      };
      
      return {
        ...state,
        columnGroups: newGroups
      };
    }
    
    case 'REMOVE_FROM_GROUP': {
      if (!action.groupName || action.columnIds.length === 0) return state;
      
      // Find the group
      const groupIndex = state.columnGroups.findIndex(g => g.headerName === action.groupName);
      if (groupIndex === -1) return state;
      
      // Update groups by removing the specified columns
      const newGroups = [...state.columnGroups];
      const updatedChildren = newGroups[groupIndex].children.filter(
        child => !action.columnIds.includes(child)
      );
      
      if (updatedChildren.length === 0) {
        // Remove the group if it becomes empty
        newGroups.splice(groupIndex, 1);
      } else {
        // Update the group with remaining children
        newGroups[groupIndex] = {
          ...newGroups[groupIndex],
          children: updatedChildren
        };
      }
      
      return {
        ...state,
        columnGroups: newGroups
      };
    }
    
    case 'CREATE_GROUP': {
      if (!action.groupName || action.columnIds.length === 0) return state;
      
      // Check if group already exists
      const existingGroupIndex = state.columnGroups.findIndex(
        g => g.headerName === action.groupName
      );
      
      let newGroups: ColumnGroup[];
      
      if (existingGroupIndex !== -1) {
        // Update existing group
        newGroups = [...state.columnGroups];
        newGroups[existingGroupIndex] = {
          ...newGroups[existingGroupIndex],
          children: Array.from(
            new Set([...newGroups[existingGroupIndex].children, ...action.columnIds])
          )
        };
      } else {
        // Create new group
        newGroups = [
          ...state.columnGroups,
          {
            headerName: action.groupName,
            children: action.columnIds,
            isExpanded: true
          }
        ];
      }
      
      return {
        ...state,
        columnGroups: newGroups,
        expandedSelectedGroups: new Set([
          ...Array.from(state.expandedSelectedGroups),
          action.groupName
        ])        
      };
    }
    
    case 'SET_SEARCH_TERM':
      return {
        ...state,
        searchTerm: action.term
      };
    
    case 'CLEAR_ALL': {
      // Move all selected columns to available
      const newAvailable = [
        ...state.availableColumns,
        ...state.selectedColumns.map(col => ({ ...col, hide: true }))
      ];
      
      return {
        ...state,
        availableColumns: newAvailable,
        selectedColumns: [],
        columnGroups: [],
        selectedItems: []
      };
    }
    
    default:
      return state;
  }
}

// Provider component
interface ColumnChooserProviderProps {
  children: ReactNode;
  columnDefs: ExtendedColDef[];
  columnGroups?: ColumnGroup[];
  onColumnChanged: (columns: ExtendedColDef[], operationType: OperationType) => void;
  onColumnGroupChanged?: (headerName: string, action: ColumnGroupAction, replacementName?: string) => void;
}

export const ColumnChooserProvider: React.FC<ColumnChooserProviderProps> = ({
  children,
  columnDefs,
  columnGroups = [],
  onColumnChanged,
  onColumnGroupChanged
}) => {
  // Initialize state
  const initialState: ColumnChooserState = useMemo(() => {
    const available = columnDefs.filter(col => col.hide === true);
    const selected = columnDefs.filter(col => col.hide !== true);
    
    // Initialize expanded groups
    const expandedAvailable = new Set<string>();
    const expandedSelected = new Set<string>();
    
    // Auto-expand all groups initially
    columnDefs.forEach(col => {
      if (col.groupPath) {
        let path = '';
        col.groupPath.forEach(segment => {
          path = path ? `${path}.${segment}` : segment;
          if (col.hide === true) {
            expandedAvailable.add(path);
          } else {
            expandedSelected.add(path);
          }
        });
      }
    });
    
    columnGroups.forEach(group => {
      expandedSelected.add(group.headerName);
    });
    
    return {
      availableColumns: available,
      selectedColumns: selected,
      columnGroups: columnGroups,
      selectedItems: [],
      expandedGroups: expandedAvailable,
      expandedSelectedGroups: expandedSelected,
      searchTerm: ''
    };
  }, [columnDefs, columnGroups]);
  
  // Create reducer
  const [state, dispatch] = useReducer(columnChooserReducer, initialState);
  
  // Callbacks
  const addToSelected = useCallback((columnIds: string[], index?: number) => {
    const columns = state.availableColumns.filter(col => columnIds.includes(col.field));
    dispatch({ type: 'ADD_TO_SELECTED', columns, index });
    onColumnChanged(
      [...state.selectedColumns, ...columns.map(col => ({ ...col, hide: false }))],
      'ADD'
    );
  }, [state.availableColumns, state.selectedColumns, onColumnChanged]);
  
  const removeFromSelected = useCallback((columnIds: string[]) => {
    dispatch({ type: 'REMOVE_FROM_SELECTED', columnIds });
    const newSelectedColumns = state.selectedColumns.filter(
      col => !columnIds.includes(col.field)
    );
    onColumnChanged(newSelectedColumns, 'REMOVE');
    
    // Notify about any empty groups
    if (onColumnGroupChanged) {
      state.columnGroups.forEach(group => {
        const updatedChildren = group.children.filter(
          child => !columnIds.includes(child)
        );
        if (group.children.length > 0 && updatedChildren.length === 0) {
          onColumnGroupChanged(group.headerName, 'REMOVE');
        }
      });
    }
  }, [state.selectedColumns, state.columnGroups, onColumnChanged, onColumnGroupChanged]);
  
  const reorderSelected = useCallback((columnId: string, targetIndex: number, selectedItems: string[]) => {
    dispatch({ type: 'REORDER_SELECTED', columnId, targetIndex, selectedItems });
    
    // Notify about reordering
    // This is a bit complex as we need to determine the new order after reordering
    // In a real implementation, you'd compute the new order based on the reordering logic
    const isMultiDrag = selectedItems.includes(columnId) && selectedItems.length > 1;
    const itemsToReorder = isMultiDrag ? selectedItems : [columnId];
    
    // This is just a skeleton - actual implementation would need to mirror the reducer logic
    // to compute the exact new order
    onColumnChanged(state.selectedColumns, 'REORDER');
  }, [state.selectedColumns, onColumnChanged]);
  
  const reorderGroup = useCallback((groupName: string, targetIndex: number) => {
    dispatch({ type: 'REORDER_GROUP', groupName, targetIndex });
    // Notify about reordering similar to above
    onColumnChanged(state.selectedColumns, 'REORDER');
  }, [state.selectedColumns, onColumnChanged]);
  
  const moveUp = useCallback((columnIds: string[]) => {
    dispatch({ type: 'MOVE_UP', columnIds });
    onColumnChanged(state.selectedColumns, 'REORDER');
  }, [state.selectedColumns, onColumnChanged]);
  
  const moveDown = useCallback((columnIds: string[]) => {
    dispatch({ type: 'MOVE_DOWN', columnIds });
    onColumnChanged(state.selectedColumns, 'REORDER');
  }, [state.selectedColumns, onColumnChanged]);
  
  const selectItems = useCallback((ids: string[]) => {
    dispatch({ type: 'SELECT_ITEMS', ids });
  }, []);
  
  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);
  
  const toggleGroup = useCallback((groupPath: string, panelType: 'available' | 'selected') => {
    dispatch({ type: 'TOGGLE_GROUP', groupPath, panelType });
  }, []);
  
  const addToGroup = useCallback((groupName: string, columnIds: string[]) => {
    dispatch({ type: 'ADD_TO_GROUP', groupName, columnIds });
    if (onColumnGroupChanged) {
      onColumnGroupChanged(groupName, 'UPDATE');
    }
  }, [onColumnGroupChanged]);
  
  const removeFromGroup = useCallback((groupName: string, columnIds: string[]) => {
    dispatch({ type: 'REMOVE_FROM_GROUP', groupName, columnIds });
    
    // Find the group to check if it will be empty after removal
    const group = state.columnGroups.find(g => g.headerName === groupName);
    if (group) {
      const remainingChildren = group.children.filter(
        child => !columnIds.includes(child)
      );
      
      if (remainingChildren.length === 0 && onColumnGroupChanged) {
        onColumnGroupChanged(groupName, 'REMOVE');
      } else if (onColumnGroupChanged) {
        onColumnGroupChanged(groupName, 'UPDATE');
      }
    }
  }, [state.columnGroups, onColumnGroupChanged]);
  
  const createGroup = useCallback((groupName: string, columnIds: string[]) => {
    dispatch({ type: 'CREATE_GROUP', groupName, columnIds });
    if (onColumnGroupChanged) {
      onColumnGroupChanged(groupName, 'UPDATE');
    }
  }, [onColumnGroupChanged]);
  
  const setSearchTerm = useCallback((term: string) => {
    dispatch({ type: 'SET_SEARCH_TERM', term });
  }, []);
  
  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
    onColumnChanged([], 'REMOVE');
    
    // Notify about all groups being removed
    if (onColumnGroupChanged) {
      state.columnGroups.forEach(group => {
        onColumnGroupChanged(group.headerName, 'REMOVE');
      });
    }
  }, [state.columnGroups, onColumnChanged, onColumnGroupChanged]);
  
  // Create memoized context value
  const contextValue = useMemo(() => ({
    state,
    addToSelected,
    removeFromSelected,
    reorderSelected,
    reorderGroup,
    moveUp,
    moveDown,
    selectItems,
    clearSelection,
    toggleGroup,
    addToGroup,
    removeFromGroup,
    createGroup,
    setSearchTerm,
    clearAll,
    onColumnChanged,
    onColumnGroupChanged: onColumnGroupChanged || (() => {console.log('here')})
  }), [
    state,
    addToSelected,
    removeFromSelected,
    reorderSelected,
    reorderGroup,
    moveUp,
    moveDown,
    selectItems,
    clearSelection,
    toggleGroup,
    addToGroup,
    removeFromGroup,
    createGroup,
    setSearchTerm,
    clearAll,
    onColumnChanged,
    onColumnGroupChanged
  ]);
  
  return (
    <ColumnChooserContext.Provider value={contextValue}>
      {children}
    </ColumnChooserContext.Provider>
  );
};

// Custom hook to use the context
export function useColumnChooser() {
  const context = useContext(ColumnChooserContext);
  if (context === undefined) {
    throw new Error('useColumnChooser must be used within a ColumnChooserProvider');
  }
  return context;
}