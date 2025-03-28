import { ColDef } from 'ag-grid-community';

// Extend the ColDef interface to include groupPath
export interface ExtendedColDef extends ColDef {
  groupPath?: string[];
  field: string; // Make field required for our implementation
}

// Define operation types for column changes
export type OperationType = 'INSERT' | 'ADD' | 'REMOVED' | 'REORDERED' | 'NONE';

// Define column group actions
export type ColumnGroupAction = 'REMOVE' | 'UPDATE';

// Define column group structure
export interface ColumnGroup {
  headerName: string;
  children: string[];
}

// Define configuration panel parameters
export interface ConfigPanelParams {
  configPanel: {
    columnGroups: ColumnGroup[];
    onColumnChanged: (selectedColumns: ExtendedColDef[], operationType: OperationType) => void;
    onColumnGroupChanged: (headerName: string, action: ColumnGroupAction, replacementName?: string) => void;
  };
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