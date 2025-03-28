// src/components/ColumnChooser/context/ColumnChooserContext.tsx
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { 
  TreeNode, 
  SelectedNode, 
  SelectedGroup, 
  DragItem, 
  ColumnChangeEvent,
  ExtendedColDef
} from '../types';

// State type definition
export interface ColumnChooserState {
  // Column data
  availableColumns: TreeNode[];
  selectedColumns: SelectedNode[];
  selectedGroups: SelectedGroup[];
  
  // Selection state
  selectedAvailableIds: string[];
  selectedSelectedIds: string[];
  
  // Drag and drop state
  draggedItem: DragItem | null;
  dropTarget: string | null;
  dropPosition: number | null;
  
  // Search state
  availableSearchQuery: string;
  selectedSearchQuery: string;
  
  // UI state
  isColumnChooserVisible: boolean;
  contextMenu: {
    visible: boolean;
    x: number;
    y: number;
    targetId?: string;
    targetType?: 'column' | 'group';
  };
  
  // Dialog state
  showCreateGroupDialog: boolean;
  showRenameGroupDialog: boolean;
  groupDialogName: string;
  targetGroupId: string | null;
}

// Define all possible actions
export type ColumnChooserAction =
  | { type: 'SET_AVAILABLE_COLUMNS', payload: TreeNode[] }
  | { type: 'SET_SELECTED_COLUMNS', payload: SelectedNode[] }
  | { type: 'SET_SELECTED_GROUPS', payload: SelectedGroup[] }
  | { type: 'SET_SELECTED_AVAILABLE_IDS', payload: string[] }
  | { type: 'SET_SELECTED_SELECTED_IDS', payload: string[] }
  | { type: 'SET_DRAGGED_ITEM', payload: DragItem | null }
  | { type: 'SET_DROP_TARGET', payload: string | null }
  | { type: 'SET_DROP_POSITION', payload: number | null }
  | { type: 'SET_AVAILABLE_SEARCH_QUERY', payload: string }
  | { type: 'SET_SELECTED_SEARCH_QUERY', payload: string }
  | { type: 'TOGGLE_COLUMN_CHOOSER_VISIBILITY' }
  | { type: 'SET_CONTEXT_MENU', payload: ColumnChooserState['contextMenu'] }
  | { type: 'SHOW_CREATE_GROUP_DIALOG', payload: boolean }
  | { type: 'SHOW_RENAME_GROUP_DIALOG', payload: boolean }
  | { type: 'SET_GROUP_DIALOG_NAME', payload: string }
  | { type: 'SET_TARGET_GROUP_ID', payload: string | null }
  | { type: 'ADD_SELECTED_COLUMNS', payload: { columns: ExtendedColDef[], index?: number } }
  | { type: 'REMOVE_SELECTED_COLUMNS', payload: string[] }
  | { type: 'REORDER_SELECTED_COLUMNS', payload: ExtendedColDef[] }
  | { type: 'CREATE_GROUP', payload: { name: string, columnIds: string[] } }
  | { type: 'REMOVE_GROUP', payload: string }
  | { type: 'UPDATE_GROUP', payload: { groupId: string, newName: string } }
  | { type: 'ADD_TO_GROUP', payload: { groupId: string, columnIds: string[] } }
  | { type: 'REMOVE_FROM_GROUP', payload: { groupId: string, columnIds: string[] } }
  | { type: 'UPDATE_GROUP_COLUMNS', payload: { groupId: string, columnIds: string[] } }
  | { type: 'RESET_DRAG_STATE' };

// Create context with dispatch and state
interface ColumnChooserContextType {
  state: ColumnChooserState;
  dispatch: React.Dispatch<ColumnChooserAction>;
  // Helper actions
  handleColumnSelectionChange: (event: ColumnChangeEvent) => void;
  handleColumnGroupChange: (headerName: string, action: 'REMOVE' | 'UPDATE', replaceName?: string) => void;
  moveColumnOutOfGroup: (columnId: string, groupId: string, targetPosition?: number) => void;
}

const ColumnChooserContext = createContext<ColumnChooserContextType | undefined>(undefined);

// Initial state
const initialState: ColumnChooserState = {
  availableColumns: [],
  selectedColumns: [],
  selectedGroups: [],
  selectedAvailableIds: [],
  selectedSelectedIds: [],
  draggedItem: null,
  dropTarget: null,
  dropPosition: null,
  availableSearchQuery: '',
  selectedSearchQuery: '',
  isColumnChooserVisible: false,
  contextMenu: {
    visible: false,
    x: 0,
    y: 0
  },
  showCreateGroupDialog: false,
  showRenameGroupDialog: false,
  groupDialogName: '',
  targetGroupId: null
};

// Reducer function
function columnChooserReducer(state: ColumnChooserState, action: ColumnChooserAction): ColumnChooserState {
  switch (action.type) {
    case 'SET_AVAILABLE_COLUMNS':
      return { ...state, availableColumns: action.payload };
      
    case 'SET_SELECTED_COLUMNS':
      return { ...state, selectedColumns: action.payload };
      
    case 'SET_SELECTED_GROUPS':
      return { ...state, selectedGroups: action.payload };
      
    case 'SET_SELECTED_AVAILABLE_IDS':
      return { ...state, selectedAvailableIds: action.payload };
      
    case 'SET_SELECTED_SELECTED_IDS':
      return { ...state, selectedSelectedIds: action.payload };
      
    case 'SET_DRAGGED_ITEM':
      return { ...state, draggedItem: action.payload };
      
    case 'SET_DROP_TARGET':
      return { ...state, dropTarget: action.payload };
      
    case 'SET_DROP_POSITION':
      return { ...state, dropPosition: action.payload };
      
    case 'SET_AVAILABLE_SEARCH_QUERY':
      return { ...state, availableSearchQuery: action.payload };
      
    case 'SET_SELECTED_SEARCH_QUERY':
      return { ...state, selectedSearchQuery: action.payload };
      
    case 'TOGGLE_COLUMN_CHOOSER_VISIBILITY':
      return { ...state, isColumnChooserVisible: !state.isColumnChooserVisible };
      
    case 'SET_CONTEXT_MENU':
      return { ...state, contextMenu: action.payload };
      
    case 'SHOW_CREATE_GROUP_DIALOG':
      return { ...state, showCreateGroupDialog: action.payload };
      
    case 'SHOW_RENAME_GROUP_DIALOG':
      return { ...state, showRenameGroupDialog: action.payload };
      
    case 'SET_GROUP_DIALOG_NAME':
      return { ...state, groupDialogName: action.payload };
      
    case 'SET_TARGET_GROUP_ID':
      return { ...state, targetGroupId: action.payload };
    
    case 'ADD_SELECTED_COLUMNS': {
      const { columns, index } = action.payload;
      const newNodes = columns.map(col => ({
        id: col.id!,
        name: col.headerName || col.field || 'Unnamed Column',
        column: col
      }));
      
      let newSelectedColumns;
      
      if (index !== undefined) {
        // Insert at specific position
        newSelectedColumns = [...state.selectedColumns];
        newSelectedColumns.splice(index, 0, ...newNodes);
      } else {
        // Append to the end
        newSelectedColumns = [...state.selectedColumns, ...newNodes];
      }
      
      return { ...state, selectedColumns: newSelectedColumns };
    }
    
    case 'REMOVE_SELECTED_COLUMNS': {
      const removeIds = action.payload;
      const newSelectedColumns = state.selectedColumns.filter(node => !removeIds.includes(node.id));
      
      // Also remove these columns from any groups they might be in
      const newSelectedGroups = state.selectedGroups.map(group => ({
        ...group,
        children: group.children.filter(id => !removeIds.includes(id))
      }));
      
      return { 
        ...state, 
        selectedColumns: newSelectedColumns,
        selectedGroups: newSelectedGroups
      };
    }
    
    case 'REORDER_SELECTED_COLUMNS': {
      const newNodes = action.payload.map(col => ({
        id: col.id!,
        name: col.headerName || col.field || 'Unnamed Column',
        column: col
      }));
      
      return { ...state, selectedColumns: newNodes };
    }
    
    case 'CREATE_GROUP': {
      const { name, columnIds } = action.payload;
      
      const newGroup: SelectedGroup = {
        id: `group-${Math.random().toString(36).substring(2, 9)}`,
        name,
        children: columnIds
      };
      
      return { 
        ...state, 
        selectedGroups: [...state.selectedGroups, newGroup],
        selectedSelectedIds: [] // Clear selection after creating group
      };
    }
    
    case 'REMOVE_GROUP': {
      const groupId = action.payload;
      return {
        ...state,
        selectedGroups: state.selectedGroups.filter(g => g.id !== groupId)
      };
    }
    
    case 'UPDATE_GROUP': {
      const { groupId, newName } = action.payload;
      return {
        ...state,
        selectedGroups: state.selectedGroups.map(group =>
          group.id === groupId ? { ...group, name: newName } : group
        )
      };
    }
    
    case 'ADD_TO_GROUP': {
      const { groupId, columnIds } = action.payload;
      return {
        ...state,
        selectedGroups: state.selectedGroups.map(group =>
          group.id === groupId
            ? { ...group, children: [...new Set([...group.children, ...columnIds])] }
            : group
        ),
        selectedSelectedIds: [] // Clear selection after adding to group
      };
    }
    
    case 'REMOVE_FROM_GROUP': {
      const { groupId, columnIds } = action.payload;
      return {
        ...state,
        selectedGroups: state.selectedGroups.map(group =>
          group.id === groupId
            ? { ...group, children: group.children.filter(id => !columnIds.includes(id)) }
            : group
        )
      };
    }
    
    case 'UPDATE_GROUP_COLUMNS': {
      const { groupId, columnIds } = action.payload;
      return {
        ...state,
        selectedGroups: state.selectedGroups.map(group =>
          group.id === groupId
            ? { ...group, children: columnIds }
            : group
        )
      };
    }
    
    case 'RESET_DRAG_STATE':
      return {
        ...state,
        draggedItem: null,
        dropTarget: null,
        dropPosition: null
      };
      
    default:
      return state;
  }
}

// Provider component
interface ColumnChooserProviderProps {
  children: React.ReactNode;
  availableColumns: TreeNode[];
  selectedColumns: SelectedNode[];
  selectedGroups: SelectedGroup[];
  onColumnChanged: (event: ColumnChangeEvent) => void;
  onColumnGroupChanged?: (headerName: string, action: 'REMOVE' | 'UPDATE', replaceName?: string) => void;
}

export const ColumnChooserProvider: React.FC<ColumnChooserProviderProps> = ({ 
  children,
  availableColumns,
  selectedColumns,
  selectedGroups,
  onColumnChanged,
  onColumnGroupChanged 
}) => {
  const [state, dispatch] = useReducer(columnChooserReducer, {
    ...initialState,
    availableColumns,
    selectedColumns,
    selectedGroups
  });
  
  // Update state when props change
  useEffect(() => {
    dispatch({ type: 'SET_AVAILABLE_COLUMNS', payload: availableColumns });
    dispatch({ type: 'SET_SELECTED_COLUMNS', payload: selectedColumns });
    dispatch({ type: 'SET_SELECTED_GROUPS', payload: selectedGroups });
  }, [availableColumns, selectedColumns, selectedGroups]);
  
  // Helper to get columns that belong to a group
  const getGroupColumns = useCallback((groupId: string) => {
    const group = state.selectedGroups.find(g => g.id === groupId);
    if (!group) return [];
    
    return state.selectedColumns.filter(col => group.children.includes(col.id));
  }, [state.selectedGroups, state.selectedColumns]);

  // Helper to get column IDs in a group
  const getGroupColumnIds = useCallback((groupId: string): string[] => {
    const group = state.selectedGroups.find(g => g.id === groupId);
    return group ? [...group.children] : [];
  }, [state.selectedGroups]);

  // Helper to get columns that don't belong to any group
  const getUngroupedColumns = useCallback(() => {
    const groupedColumnIds = state.selectedGroups.flatMap(g => g.children);
    return state.selectedColumns.filter(col => !groupedColumnIds.includes(col.id));
  }, [state.selectedGroups, state.selectedColumns]);
  
  // Handle column selection changes
  const handleColumnSelectionChange = useCallback((event: ColumnChangeEvent) => {
    const { items, operationType, index } = event;
    
    switch (operationType) {
      case 'ADD':
        dispatch({ 
          type: 'ADD_SELECTED_COLUMNS', 
          payload: { columns: items, index } 
        });
        break;
        
      case 'REMOVE':
        dispatch({ 
          type: 'REMOVE_SELECTED_COLUMNS', 
          payload: items.map(col => col.id!) 
        });
        break;
        
      case 'REORDER':
        dispatch({ 
          type: 'REORDER_SELECTED_COLUMNS', 
          payload: items 
        });
        break;
    }
    
    // Call the parent callback
    onColumnChanged(event);
  }, [onColumnChanged]);
  
  // Handle column group changes
  const handleColumnGroupChange = useCallback((
    headerName: string,
    action: 'REMOVE' | 'UPDATE',
    replaceName?: string
  ) => {
    if (action === 'REMOVE') {
      const groupToRemove = state.selectedGroups.find(g => g.name === headerName);
      if (groupToRemove) {
        dispatch({ type: 'REMOVE_GROUP', payload: groupToRemove.id });
      }
    } else if (action === 'UPDATE' && replaceName) {
      const groupToUpdate = state.selectedGroups.find(g => g.name === headerName);
      if (groupToUpdate) {
        dispatch({ 
          type: 'UPDATE_GROUP', 
          payload: { groupId: groupToUpdate.id, newName: replaceName } 
        });
      }
    }
    
    // Call the parent callback if provided
    if (onColumnGroupChanged) {
      onColumnGroupChanged(headerName, action, replaceName);
    }
  }, [state.selectedGroups, onColumnGroupChanged]);
  
  // Move a column out of a group
  const moveColumnOutOfGroup = useCallback((
    columnId: string, 
    groupId: string, 
    targetPosition?: number
  ) => {
    console.log('Moving column out of group', { columnId, groupId, targetPosition });
    
    // 1. Remove the column from the group
    const updatedGroupIds = getGroupColumnIds(groupId).filter(id => id !== columnId);
    dispatch({ 
      type: 'UPDATE_GROUP_COLUMNS', 
      payload: { groupId, columnIds: updatedGroupIds } 
    });
    
    // 2. Update the overall column order if a specific position is requested
    if (targetPosition !== undefined) {
      // Get the current order
      const newOrder = [...state.selectedColumns];
      
      // Find the column we're moving
      const columnToMove = newOrder.find(col => col.id === columnId);
      if (!columnToMove) return;
      
      // Get ungrouped columns
      const ungroupedColumns = getUngroupedColumns();
      
      // Remove the moved column from its current position
      const remainingColumns = newOrder.filter(col => col.id !== columnId);
      
      // Determine insert position in the full column list
      let insertIndex;
      
      if (targetPosition >= ungroupedColumns.length) {
        // Add to the end of ungrouped columns
        insertIndex = remainingColumns.length;
      } else {
        // Find the target ungrouped column's position in the full list
        const targetColId = ungroupedColumns[targetPosition].id;
        insertIndex = remainingColumns.findIndex(col => col.id === targetColId);
        
        if (insertIndex === -1) {
          insertIndex = remainingColumns.length;
        }
      }
      
      // Insert at the calculated position
      remainingColumns.splice(insertIndex, 0, columnToMove);
      
      // Update the grid
      handleColumnSelectionChange({
        items: remainingColumns.map(node => node.column),
        operationType: 'REORDER'
      });
    }
  }, [
    getGroupColumnIds, 
    getUngroupedColumns, 
    state.selectedColumns, 
    handleColumnSelectionChange
  ]);
  
  const contextValue = {
    state,
    dispatch,
    handleColumnSelectionChange,
    handleColumnGroupChange,
    moveColumnOutOfGroup
  };
  
  return (
    <ColumnChooserContext.Provider value={contextValue}>
      {children}
    </ColumnChooserContext.Provider>
  );
};

// Hook for consuming the context
export const useColumnChooser = () => {
  const context = useContext(ColumnChooserContext);
  if (context === undefined) {
    throw new Error('useColumnChooser must be used within a ColumnChooserProvider');
  }
  return context;
};