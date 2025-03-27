import { ColDef, ColumnApi, GridApi, GridOptions } from 'ag-grid-community';

// Extend AG Grid's ColDef to include groupPath
export interface ExtendedColDef extends ColDef {
  groupPath: string[];
  id?: string; // Unique identifier for the column
}

// Column group definition
export interface ColumnGroup {
  headerName: string;
  children: string[]; // Array of column IDs
}

// Operation types for column changes
export type OperationType = 'ADD' | 'REMOVE' | 'REORDER';

// Group operation types
export type GroupOperationType = 'ADD' | 'REMOVE' | 'UPDATE';

// Column change event
export interface ColumnChangeEvent {
  items: ExtendedColDef[];
  operationType: OperationType;
  index?: number; // Optional index for insertion position
}

// Props for the ToolGrid component
export interface ToolGridProps {
  columnDefs: ExtendedColDef[];
  rowData: any[];
  columnGroups?: ColumnGroup[];
  onColumnChanged: (event: ColumnChangeEvent) => void;
  onColumnGroupChanged?: (headerName: string, action: 'REMOVE' | 'UPDATE', replaceName?: string) => void;
  gridOptions?: Partial<GridOptions>;
  className?: string;
}

// Structure for tree nodes in the available columns panel
export interface TreeNode {
  id: string;
  name: string;
  children: TreeNode[];
  column?: ExtendedColDef;
  isGroup: boolean;
  isExpanded?: boolean;
  parentPath?: string[];
}

// Structure for nodes in the selected columns panel
export interface SelectedNode {
  id: string;
  name: string;
  column: ExtendedColDef;
  groupId?: string; // ID of the group this column belongs to, if any
}

// Structure for groups in the selected columns panel
export interface SelectedGroup {
  id: string;
  name: string;
  children: string[]; // Array of column IDs
}

// Drag item structure
export interface DragItem {
  id: string;
  type: 'column' | 'group';
  source: 'available' | 'selected';
  parentId?: string;
  selectedIds?: string[]; // Array of selected IDs when dragging multiple items
}