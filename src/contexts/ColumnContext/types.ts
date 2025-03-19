import { ColDef, GridApi } from 'ag-grid-community';
import { ColumnItem } from '../../types';

// State interface
export interface ColumnState {
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

// Drop position interface
export interface DropPosition {
  targetId?: string;
  insertBefore: boolean;
}

// Expanded action types to include new actions
export type ColumnAction =
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
  | { type: 'SET_GRID_API'; payload: { api: GridApi } }
  | { type: 'MOVE_SELECTED_UP' }
  | { type: 'MOVE_SELECTED_DOWN' }
  | { type: 'CLEAR_SELECTED' };

// Context interface
export interface ColumnContextValue {
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
  // New actions
  moveSelectedUp: () => void;
  moveSelectedDown: () => void;
  clearSelected: () => void;
  moveItemToSelected: (id: string) => void;
  moveItemToAvailable: (id: string) => void;
}