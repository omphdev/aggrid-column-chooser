import { BehaviorSubject } from 'rxjs';
import { ColumnDefinition, ColumnItem } from '../types';
import { convertToTreeStructure, generateGridColumns, removeSelectedFromAvailable } from '../utils/columnUtils';

// Dashboard state interface
export interface DashboardState {
  // Column definitions from the consumer application
  columnDefinitions: ColumnDefinition[];
  // Selected column IDs (ordered as they should appear in the grid)
  selectedColumnIds: string[];
  // Available columns in tree structure (derived from columnDefinitions)
  availableColumns: ColumnItem[];
  // Selected columns in flat structure (derived from selectedColumnIds and columnDefinitions)
  selectedColumns: ColumnItem[];
  // AG Grid column definitions (derived from selectedColumns)
  gridColumnDefs: any[];
  // Data for the grid
  gridData: any[];
  // UI state
  isFlatView: boolean;
}

// Interface for state updates
interface StateChange {
  state: DashboardState;
  message: string;
  details?: any;
}

// Initial state
const initialState: DashboardState = {
  columnDefinitions: [],
  selectedColumnIds: [],
  availableColumns: [],
  selectedColumns: [],
  gridColumnDefs: [],
  gridData: [],
  isFlatView: false
};

// Dashboard state service class
class DashboardStateService {
  // BehaviorSubject to hold state
  private state = new BehaviorSubject<StateChange>({
    state: initialState,
    message: 'Initial state'
  });

  // Get current state
  get value(): DashboardState {
    return this.state.value.state;
  }

  // Subscribe to state changes
  subscribe(callback: (value: DashboardState) => void) {
    return this.state.subscribe(change => callback(change.state));
  }

  // Update state
  next(newState: Partial<DashboardState>, message: string, details?: any) {
    const currentState = this.state.value.state;
    const updatedState = {
      ...currentState,
      ...newState
    };
    
    this.state.next({
      state: updatedState,
      message,
      details
    });
    
    return updatedState;
  }

  // Initialize with column definitions and optional data
  initialize(columnDefinitions: ColumnDefinition[], data: any[] = []) {
    // Convert column definitions to tree structure for available columns
    const availableColumns = convertToTreeStructure(columnDefinitions);
    
    this.next({
      columnDefinitions,
      availableColumns,
      selectedColumnIds: [],
      selectedColumns: [],
      gridColumnDefs: [],
      gridData: data
    }, 'Initialize dashboard state');
  }

  // Update selected column IDs
  updateSelectedColumns(columnIds: string[]) {
    const { columnDefinitions, availableColumns } = this.value;
    
    // Create a map for quick lookup
    const columnMap = new Map(
      columnDefinitions.map(col => [col.id, col])
    );
    
    // Create selected columns from IDs
    const selectedColumns = columnIds
      .filter(id => columnMap.has(id))
      .map(id => {
        const colDef = columnMap.get(id)!;
        return {
          id: colDef.id,
          name: colDef.groupPath[colDef.groupPath.length - 1], // Use last part of path as name
          field: colDef.field
        };
      });
    
    // Generate grid column definitions
    const gridColumnDefs = generateGridColumns(selectedColumns);
    
    // Also update available columns to remove the selected ones
    const updatedAvailableColumns = removeSelectedFromAvailable(availableColumns, columnIds);
    
    // Update state
    this.next({
      selectedColumnIds: columnIds,
      selectedColumns,
      gridColumnDefs,
      availableColumns: updatedAvailableColumns
    }, 'Update selected columns');
  }

  // Toggle flat view
  toggleFlatView(isFlatView: boolean) {
    this.next({ isFlatView }, 'Toggle flat view');
  }
}

// Create and export singleton instance
const dashboardStateService = new DashboardStateService();
export default dashboardStateService;