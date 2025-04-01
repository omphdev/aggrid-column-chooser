import { ColDef } from 'ag-grid-community';

export type GroupOperationType = 
  | 'ADD' 
  | 'ADD_AT_INDEX' 
  | 'REMOVED' 
  | 'REORDERED' 
  | 'REORDER_AT_INDEX';

// Extend the ColDef interface to include groupPath
export interface ExtendedColDef extends ColDef {
  groupPath?: string[];
  field: string; // Make field required for our implementation
}

// Define operation types for column changes
export type OperationType = 
  | 'INSERT' 
  | 'ADD' 
  | 'ADD_AT_INDEX' 
  | 'REMOVED' 
  | 'REORDERED' 
  | 'REORDER_AT_INDEX' 
  | 'NONE';

// Define column group actions
export type ColumnGroupAction = 'REMOVE' | 'UPDATE';

// Define column group structure
export interface ColumnGroup {
  headerName: string;
  children: string[];
  isExpanded?: boolean;
}

export interface GroupPanelProps {
  groupsCols: (ColDef & { groupPath?: string[] })[];
  selectedGroups: string[];
  onGroupChanged?: (selectedGroups: ColDef[], operationType: string) => void;
}

// Define configuration panel parameters
export interface ConfigPanelParams {
  configPanel: {
    columnGroups: ColumnGroup[];
    onColumnChanged: (selectedColumns: ExtendedColDef[], operationType: OperationType) => void;
    onColumnGroupChanged: (headerName: string, action: ColumnGroupAction, replacementName?: string) => void;
  };
  groupPanel?: GroupPanelProps;
}

// Define props for ToolGrid component
export interface ToolGridProps {
  columnDefs: ExtendedColDef[];
  rowData: any[];
  configPanelParams?: ConfigPanelParams;
}

// Define props for MainGrid component
export interface MainGridProps {
  columnDefs: ExtendedColDef[];
  rowData: any[];
}

// Define props for ConfigurationPanel component
export interface ConfigurationPanelProps {
  columnDefs: ExtendedColDef[];
  configPanelParams: ConfigPanelParams;
}

// Define props for ColumnPanel component
export interface ColumnPanelProps {
  columnDefs: ExtendedColDef[];
  columnGroups: ColumnGroup[];
  onColumnChanged: (selectedColumns: ExtendedColDef[], operationType: OperationType) => void;
  onColumnGroupChanged: (headerName: string, action: ColumnGroupAction, replacementName?: string) => void;
}

export interface AvailablePanelProps {
  availableGroups: (ColDef & { groupPath?: string[] })[];
  selectedItems: string[];
  expandedGroups: Set<string>;
  draggedItemId: string | null;
  draggedGroupPath: string | null;
  groupDropTarget: string | null;
  dropTarget: string | null;
  availablePanelRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (itemId: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  onMoveToSelected: (itemIds: string[]) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, item: ColDef & { groupPath?: string[] }, isAvailable: boolean) => void;
  onGroupDragStart: (e: React.DragEvent<HTMLDivElement>, groupPath: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, panel: string, groupPath?: string) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, panel: string, groupPath?: string) => void;
  onToggleGroup: (e: React.MouseEvent, groupPath: string) => void;
}

export interface SelectedFlatPanelProps {
  selectedGroups: (ColDef & { groupPath?: string[] })[];
  selectedItems: string[];
  draggedItemId: string | null;
  dropTarget: string | null;
  dropIndicatorIndex: number;
  selectedPanelRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (itemId: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  onMoveToAvailable: (itemIds: string[]) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onClearAll: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, item: ColDef & { groupPath?: string[] }, isAvailable: boolean) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, panel: string) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, panel: string) => void;
}

export interface SelectedTreePanelProps {
  selectedGroups: (ColDef & { groupPath?: string[] })[];
  selectedItems: string[];
  expandedGroups: Set<string>;
  draggedItemId: string | null;
  draggedGroupPath: string | null;
  groupDropTarget: string | null;
  dropTarget: string | null;
  dropIndicatorIndex: number;
  selectedPanelRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (itemId: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  onMoveToAvailable: (itemIds: string[]) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onClearAll: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, item: ColDef & { groupPath?: string[] }, isAvailable: boolean) => void;
  onGroupDragStart: (e: React.DragEvent<HTMLDivElement>, groupPath: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, panel: string, groupPath?: string) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, panel: string, groupPath?: string) => void;
  onToggleGroup: (e: React.MouseEvent, groupPath: string) => void;
}

export interface GroupItemProps {
  item: ColDef & { groupPath?: string[] };
  index: number;
  isAvailable: boolean;
  isSelected: boolean;
  isDragging: boolean;
  onSelect: (itemId: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  onDoubleClick: (itemId: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, item: ColDef & { groupPath?: string[] }) => void;
  className?: string;
  style?: React.CSSProperties;
}
