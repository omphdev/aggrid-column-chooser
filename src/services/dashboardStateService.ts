import { BehaviorSubject } from 'rxjs';
import { ColumnDefinition, ColumnItem, ColumnGroup } from '../types';
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
  // Column groups (for organizing columns in the selected panel)
  columnGroups: ColumnGroup[];
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
  isFlatView: false,
  columnGroups: []
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

  // Initialize with column definitions, optional data, and column groups
  initialize(
    columnDefinitions: ColumnDefinition[], 
    data: any[] = [],
    columnGroups: ColumnGroup[] = []
  ) {
    // Convert column definitions to tree structure for available columns
    const availableColumns = convertToTreeStructure(columnDefinitions);
    
    this.next({
      columnDefinitions,
      availableColumns,
      selectedColumnIds: [],
      selectedColumns: [],
      gridColumnDefs: [],
      gridData: data,
      columnGroups
    }, 'Initialize dashboard state');
  }

  // Update selected column IDs
  updateSelectedColumns(columnIds: string[]) {
    const { columnDefinitions, columnGroups } = this.value;
    
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
    const gridColumnDefs = generateGridColumnsWithGroups(selectedColumns, columnGroups);
    
    // This ensures removed columns will be properly added back to the available panel
    const allAvailableColumns = convertToTreeStructure(columnDefinitions);
    const updatedAvailableColumns = removeSelectedFromAvailable(allAvailableColumns, columnIds);
    
    // Update state
    this.next({
      selectedColumnIds: columnIds,
      selectedColumns,
      gridColumnDefs,
      availableColumns: updatedAvailableColumns
    }, 'Update selected columns');
  }

  // Update column groups
  updateColumnGroups(columnGroups: ColumnGroup[]) {
    const { selectedColumns } = this.value;
    
    // Regenerate grid column definitions with the new groups
    const gridColumnDefs = generateGridColumnsWithGroups(selectedColumns, columnGroups);
    
    // Update state
    this.next({
      columnGroups,
      gridColumnDefs
    }, 'Update column groups');
  }

  // Toggle flat view
  toggleFlatView(isFlatView: boolean) {
    this.next({ isFlatView }, 'Toggle flat view');
  }
}

// Helper function to generate AG Grid column definitions with column groups
function generateGridColumnsWithGroups(columns: ColumnItem[], columnGroups: ColumnGroup[]) {
  // Create a map of column ID to column item for quick lookup
  const columnMap = new Map<string, ColumnItem>();
  columns.forEach(col => columnMap.set(col.id, col));
  
  // Create a map of column ID to group ID
  const columnToGroupMap = new Map<string, string>();
  columnGroups.forEach(group => {
    group.columnIds.forEach(columnId => {
      columnToGroupMap.set(columnId, group.id);
    });
  });
  
  // Create a map of group ID to group for quick lookup
  const groupMap = new Map<string, ColumnGroup>();
  columnGroups.forEach(group => groupMap.set(group.id, group));
  
  // Process columns in their original order
  const result: any[] = [];
  const processedGroups = new Set<string>();
  
  columns.forEach(col => {
    const groupId = columnToGroupMap.get(col.id);
    
    if (groupId) {
      // This column belongs to a group
      if (!processedGroups.has(groupId)) {
        // First time seeing this group, create the group definition
        const group = groupMap.get(groupId)!;
        const groupChildren = group.columnIds
          .filter(id => columnMap.has(id))
          .map(id => {
            const childCol = columnMap.get(id)!;
            return {
              field: childCol.field,
              headerName: childCol.name,
              sortable: true,
              filter: true,
              columnGroupId: groupId
            };
          });
        
        result.push({
          headerName: group.name,
          groupId: groupId,
          children: groupChildren
        });
        
        processedGroups.add(groupId);
      }
    } else {
      // This is an ungrouped column
      result.push({
        field: col.field,
        headerName: col.name,
        sortable: true,
        filter: true
      });
    }
  });
  
  return result;
}

// Create and export singleton instance
const dashboardStateService = new DashboardStateService();
export default dashboardStateService;