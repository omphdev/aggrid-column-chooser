// types.ts
import { GridApi } from 'ag-grid-community';

// Types for our column data structure
export interface ColumnItem {
  id: string;
  name: string;
  field: string;
  children?: ColumnItem[];
  expanded?: boolean;
  selected?: boolean;
}

// New interface for your specific column format
export interface ColumnDefinition {
  id: string;
  field: string;
  hide?: boolean;
  groupPath: string[];
}

export interface DragItem {
  id: string;
  type: string;
}

export interface TreeItemProps {
  item: ColumnItem;
  onDragStart: (e: React.DragEvent, item: ColumnItem) => void;
  toggleExpand: (id: string) => void;
  toggleSelect: (id: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  depth: number;
  index: number;
}

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
  flatView?: boolean; // New prop to toggle between flat and tree views
}