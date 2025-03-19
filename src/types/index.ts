export interface ColumnDefinition {
  id: string;
  field: string;
  groupPath: string[];
  hide?: boolean;
}

export interface ColumnItem {
  id: string;
  name: string;
  field: string;
  children?: ColumnItem[];
  expanded?: boolean;
  selected?: boolean;
}

export interface DragItem {
  id: string;
  source: 'available' | 'selected';
  itemName: string;
  ids: string[];
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