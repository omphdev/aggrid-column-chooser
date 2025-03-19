import React, { createContext, useContext, useReducer, ReactNode, useCallback, useMemo } from 'react';
import { ColDef, GridApi } from 'ag-grid-community';
import { ColumnState, ColumnContextValue, DropPosition } from './types';
import { initialState, columnReducer } from './reducer';
import { countSelectedItems } from './columnOperations';

// Fix TypeScript import
import { ColumnItem } from '../../types';

// Create context
const ColumnContext = createContext<ColumnContextValue | undefined>(undefined);

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
  
  // New actions for buttons
  const moveSelectedUp = useCallback(() => {
    dispatch({ type: 'MOVE_SELECTED_UP' });
  }, []);
  
  const moveSelectedDown = useCallback(() => {
    dispatch({ type: 'MOVE_SELECTED_DOWN' });
  }, []);
  
  const clearSelected = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTED' });
  }, []);

  const moveItemToSelected = useCallback((id: string) => {
    const dropPosition = { insertBefore: false }; // Add to end
    dispatch({ type: 'MOVE_TO_SELECTED', payload: { ids: [id], dropPosition } });
  }, []);
  
  const moveItemToAvailable = useCallback((id: string) => {
    const dropPosition = { insertBefore: false }; // Add to end
    dispatch({ type: 'MOVE_TO_AVAILABLE', payload: { ids: [id], dropPosition } });
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
    getDefaultColDef,
    // New actions
    moveSelectedUp,
    moveSelectedDown,
    clearSelected,
    moveItemToSelected,
    moveItemToAvailable,
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
    getDefaultColDef,
    moveSelectedUp,
    moveSelectedDown,
    clearSelected,
    moveItemToSelected,
    moveItemToAvailable,
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