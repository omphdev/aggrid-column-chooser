import { ColDef } from 'ag-grid-community';

// Extended column definition with groupPath for hierarchical organization
export interface ExtendedColDef extends ColDef {
  field: string; // Make field required for our implementation
  groupPath?: string[]; // Path for hierarchical grouping (e.g., ['Basic Info', 'Personal'])
  hide?: boolean; // Whether the column is hidden
}

// Column group definition
export interface ColumnGroup {
  headerName: string; // Display name of the group
  children: string[]; // Column fields in this group
  isExpanded?: boolean; // Whether the group is expanded
}

// Operation types for column changes
export type OperationType = 
  | 'ADD' 
  | 'REMOVE' 
  | 'REORDER' 
  | 'ADD_AT_INDEX' 
  | 'REORDER_AT_INDEX';

// Action types for column groups
export type ColumnGroupAction = 'REMOVE' | 'UPDATE';

// Column chooser props
export interface ColumnChooserProps {
  columnDefs: ExtendedColDef[]; // All column definitions
  columnGroups?: ColumnGroup[]; // Initial column groups
  onColumnChanged: (columns: ExtendedColDef[], operationType: OperationType) => void; // Callback when columns change
  onColumnGroupChanged?: (headerName: string, action: ColumnGroupAction, replacementName?: string) => void; // Callback when groups change
}

// Tree node structure for hierarchical columns
export interface ColumnTreeNode {
  type: 'column' | 'group';
  id: string;
  name: string;
  children?: ColumnTreeNode[];
  column?: ExtendedColDef;
  level: number;
  parentPath?: string[];
}

// Drag item types for react-dnd
export enum DragItemTypes {
  COLUMN = 'column',
  GROUP = 'group'
}

// Drag item data
export interface DragItem {
  type: DragItemTypes;
  id: string;
  sourcePanel: 'available' | 'selected'; // Ensure this is a literal type
  sourceGroup?: string;
  multiple?: boolean;
  items?: string[];
}

// Search settings
export interface SearchSettings {
  searchTerm: string;
  caseSensitive: boolean;
  exactMatch: boolean;
}