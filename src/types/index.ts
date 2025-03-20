export interface ColumnDefinition {
  id: string;
  field: string;
  groupPath: string[];
  hide?: boolean;
}

// Update the ColumnItem interface in src/types/index.ts

export interface ColumnItem {
  id: string;
  name: string;
  field?: string;       // Optional field name (may be empty for groups)
  children?: ColumnItem[];
  expanded?: boolean;   // Whether a group is expanded
  selected?: boolean;   // Whether the item is selected
  isGroup?: boolean;    // Whether this is a column group
  groupId?: string;     // ID of the original group if this is a group
  parentGroupId?: string; // ID of parent group this item belongs to, if any
}

export interface ColumnGroup {
  id: string;
  name: string;
  columnIds: string[];
}

export interface DragItem {
  id: string;
  source: 'available' | 'selected';
  itemName: string;
  ids: string[];
  type?: 'column' | 'group';  // Type of the dragged item
  groupId?: string;           // ID of the group if dragging a group
}

export interface DropPosition {
  targetId?: string;
  insertBefore: boolean;
}

// Props for drop indicator component
export interface DropIndicatorProps {
  top: number;
  left?: number;
  right?: number;
  text?: string;
}

// Props for tree view header component
export interface TreeViewHeaderProps {
  title: string;
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

// Extended DragEvent to include drop position information
export interface PositionedDragEvent extends React.DragEvent<HTMLElement> {
  dropPosition?: {
    targetId?: string;
    insertBefore: boolean;
  }
}

// State tracking for tree views
export interface TreeViewUIState {
  expandedIds: Set<string>;
  dragOverItemId: string | null;
  isDraggedOver: boolean;
  insertBefore: boolean;
}

export interface SelectionState {
  selectedIds: Set<string>;
  lastSelectedId: string | null;
}

// Props for the main ColumnChooser component
export interface ColumnChooserProps {
  availableColumns: ColumnItem[];
  selectedColumns: ColumnItem[];
  isFlatView: boolean;
  columnGroups: ColumnGroup[];
  onSelectedColumnsChange: (columnIds: string[]) => void;
  onColumnGroupsChange: (columnGroups: ColumnGroup[]) => void;
}