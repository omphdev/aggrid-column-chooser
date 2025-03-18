// src/types/index.ts
import { GridApi } from 'ag-grid-community';

// Base column item structure - represents a column in the column chooser
export interface ColumnItem {
  id: string;
  name: string;
  field: string;
  children?: ColumnItem[];
  expanded?: boolean;
  selected?: boolean;
}

// Column definition for the grid with path information
export interface ColumnDefinition {
  id: string;
  field: string;
  hide?: boolean;
  groupPath: string[];
}

// Custom column group structure to be passed
export interface CustomColumnGroup {
  headerName: string;
  children: string[]; // Array of column field names
  id?: string; // Optional ID for tracking
}

// Item for drag and drop operations
export interface DragItem {
  id: string;
  type: string;
}

// Props for tree item component
export interface TreeItemProps {
  item: ColumnItem;
  onDragStart: (e: React.DragEvent, item: ColumnItem) => void;
  toggleExpand: (id: string) => void;
  toggleSelect: (id: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  depth: number;
  index: number;
  onDragOver?: (e: React.DragEvent, element: HTMLElement | null, itemId: string) => void;
  onDragLeave?: () => void;
}

// Props for tree view component
export interface TreeViewProps {
  items: ColumnItem[];
  onDragStart: (e: React.DragEvent, item: ColumnItem) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  title: string;
  toggleExpand: (id: string) => void;
  toggleSelect: (id: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  selectedCount: number;
  flatView?: boolean; // Toggle between flat and tree views
  showGroupLabels?: boolean; // Show group labels in flat view
  onItemReorder?: (e: React.DragEvent) => void; // Callback for handling reordering within the same panel
}

// Props for flat item component
export interface FlatItemProps {
  item: ColumnItem;
  index: number;
  flatIndex?: number;
  onDragStart: (e: React.DragEvent, item: ColumnItem) => void;
  toggleSelect: (id: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  onDragOver?: (e: React.DragEvent, element: HTMLElement | null, itemId: string) => void;
  onDragLeave?: () => void;
  groupName?: string;
  showGroupLabels?: boolean;
}

// Props for draggable tree item
export interface DraggableTreeItemProps {
  item: ColumnItem;
  depth?: number;
  onClick: (e: React.MouseEvent) => void;
  onExpand?: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent, item: ColumnItem) => void;
  className?: string;
  isSelected?: boolean;
  isExpanded?: boolean;
  hasChildren?: boolean;
  isDragTarget?: boolean;
  dragInsertBefore?: boolean;
}

// Props for drop indicator
export interface DropIndicatorProps {
  top: number;
  left?: number;
  right?: number;
  text?: string;
}

// Props for tree view header
export interface TreeViewHeaderProps {
  title: string;
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

// Column management hook props
export interface ColumnManagementProps {
  allPossibleColumns: ColumnItem[];
  mockData: any[];
  onSelectedColumnsChange?: (columns: ColumnDefinition[]) => void;
  flatViewSelected?: boolean;
}

// Extended DragEvent to include drop position information
export interface PositionedDragEvent extends React.DragEvent {
  dropPosition?: {
    targetId?: string;
    insertBefore: boolean;
  }
}

// Props for main column chooser component
export interface ColumnChooserProps {
  onSelectedColumnsChange?: (columns: ColumnDefinition[]) => void;
  initialData?: any[];
}

// Props for available columns component
export interface AvailableColumnsProps {
  title?: string;
}

// Props for selected columns component
export interface SelectedColumnsProps {
  title?: string;
  flatView?: boolean;
  showGroupLabels?: boolean;
}

// Props for main grid component
export interface MainGridProps {
  height?: number | string;
}

// Props for the column provider with custom groups support
export interface ColumnProviderProps {
  children: React.ReactNode;
  allPossibleColumns: ColumnItem[];
  initialData: any[];
  customGroups?: CustomColumnGroup[];
  onSelectedColumnsChange?: (columns: ColumnDefinition[]) => void;
}

// Props for custom groups manager component
export interface CustomGroupsManagerProps {
  onGroupsChange?: (groups: CustomColumnGroup[]) => void;
}

// Props for column groups integration component
export interface ColumnGroupsIntegrationProps {
  initialGroups?: CustomColumnGroup[];
  onGroupsChange?: (groups: CustomColumnGroup[]) => void;
  showDebugger?: boolean;
}

// Props for column debugger component
export interface ColumnDebuggerProps {
  columns: ColumnItem[];
  customGroups?: CustomColumnGroup[];
}