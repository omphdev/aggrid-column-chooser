// src/components/ColumnChooser/ToolGrid.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColumnApi, GridApi, GridReadyEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { 
  ToolGridProps, 
  ExtendedColDef, 
  TreeNode, 
  SelectedNode, 
  SelectedGroup,
  ColumnChangeEvent,
  ColumnGroup
} from './types';
import ColumnChooser from './ColumnChooser';
import { buildColumnTree } from './utils/treeUtils';
import { createGridColumnDefs } from './utils/columnUtils';

const ToolGrid: React.FC<ToolGridProps> = ({
  columnDefs,
  rowData,
  columnGroups = [],
  onColumnChanged,
  onColumnGroupChanged,
  gridOptions = {},
  className = ''
}) => {
  // Refs
  const gridRef = useRef<AgGridReact>(null);
  const apiRef = useRef<{ grid: GridApi | null; column: ColumnApi | null }>({
    grid: null,
    column: null
  });

  // State
  const [selectedColumns, setSelectedColumns] = useState<SelectedNode[]>([]);
  const [availableTree, setAvailableTree] = useState<TreeNode[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<SelectedGroup[]>([]);
  const [isColumnChooserVisible, setIsColumnChooserVisible] = useState<boolean>(false);

  // Convert column definitions to ensure they have IDs
  const normalizedColumnDefs = useMemo(() => {
    return columnDefs.map(col => ({
      ...col,
      id: col.id || col.field || `col-${Math.random().toString(36).substring(2, 9)}`
    }));
  }, [columnDefs]);

  // Initialize selected columns based on AG Grid's default behavior
  // We'll consider columns as selected if they don't have 'hide: true'
  useEffect(() => {
    const initialSelectedColumns = normalizedColumnDefs
      .filter(col => !col.hide)
      .map(col => ({
        id: col.id!,
        name: col.headerName || col.field || 'Unnamed Column',
        column: col
      }));

    setSelectedColumns(initialSelectedColumns);
  }, [normalizedColumnDefs]);

  // Convert columnGroups to selectedGroups format
  useEffect(() => {
    const groups = columnGroups.map(group => ({
      id: `group-${Math.random().toString(36).substring(2, 9)}`,
      name: group.headerName,
      children: group.children
    }));

    setSelectedGroups(groups);
  }, [columnGroups]);

  // Build tree structure for available columns based on groupPath
  useEffect(() => {
    // Get IDs of selected columns to filter them out from available columns
    const selectedColumnIds = selectedColumns.map(col => col.id);
    
    // Build the tree structure
    const tree = buildColumnTree(normalizedColumnDefs, selectedColumnIds);
    
    // Log for debugging
    console.log("Available Tree:", tree);
    console.log("Selected Columns:", selectedColumns);
    
    setAvailableTree(tree);
  }, [normalizedColumnDefs, selectedColumns]);

  // Apply selected columns to the grid with appropriate grouping
  useEffect(() => {
    if (apiRef.current.column) {
      // Create AG Grid column definitions with groups
      const gridColDefs = createGridColumnDefs(
        selectedColumns, 
        selectedGroups,
        normalizedColumnDefs
      );
      
      // Update grid columns
      apiRef.current.grid?.setColumnDefs(gridColDefs);
    }
  }, [selectedColumns, selectedGroups, normalizedColumnDefs]);

  // Handle grid ready event
  const onGridReady = (params: GridReadyEvent) => {
    apiRef.current.grid = params.api;
    apiRef.current.column = params.columnApi;
    
    // Call user's onGridReady if provided in gridOptions
    if (gridOptions.onGridReady) {
      gridOptions.onGridReady(params);
    }
  };

  // Toggle column chooser visibility
  const toggleColumnChooser = () => {
    setIsColumnChooserVisible(!isColumnChooserVisible);
  };

  // Handle selection changes from the column chooser
  const handleColumnSelectionChange = (event: ColumnChangeEvent) => {
    const { items, operationType, index } = event;

    // Update selected columns based on operation type
    if (operationType === 'ADD') {
      const newNodes = items.map(col => ({
        id: col.id!,
        name: col.headerName || col.field || 'Unnamed Column',
        column: col
      }));
      
      if (index !== undefined) {
        // Insert at specific position
        setSelectedColumns(prev => {
          const newSelectedColumns = [...prev];
          newSelectedColumns.splice(index, 0, ...newNodes);
          return newSelectedColumns;
        });
      } else {
        // Append to the end
        setSelectedColumns(prev => [...prev, ...newNodes]);
      }
    } else if (operationType === 'REMOVE') {
      const removeIds = items.map(col => col.id!);
      setSelectedColumns(prev => prev.filter(node => !removeIds.includes(node.id)));
      
      // Also remove these columns from any groups they might be in
      setSelectedGroups(prev => 
        prev.map(group => ({
          ...group,
          children: group.children.filter(id => !removeIds.includes(id))
        }))
      );
    } else if (operationType === 'REORDER') {
      // For reorder, we replace the entire selected columns array
      const newNodes = items.map(col => ({
        id: col.id!,
        name: col.headerName || col.field || 'Unnamed Column',
        column: col
      }));
      
      setSelectedColumns(newNodes);
    }

    // Call the parent callback
    onColumnChanged(event);
  };

  // Handle column group changes
  const handleColumnGroupChange = (
    headerName: string,
    action: 'REMOVE' | 'UPDATE',
    replaceName?: string
  ) => {
    if (action === 'REMOVE') {
      setSelectedGroups(prev => 
        prev.filter(group => group.name !== headerName)
      );
    } else if (action === 'UPDATE' && replaceName) {
      setSelectedGroups(prev => 
        prev.map(group => 
          group.name === headerName ? { ...group, name: replaceName } : group
        )
      );
    }

    // Call the parent callback if provided
    if (onColumnGroupChanged) {
      onColumnGroupChanged(headerName, action, replaceName);
    }
  };

  // Create the final grid options by combining defaults with user-provided options
  const finalGridOptions = {
    ...gridOptions,
    onGridReady
  };
  
  // Log state for debugging
  console.log("ToolGrid Rendering:", {
    availableTree,
    selectedColumns,
    selectedGroups
  });

  return (
    <div className={`tool-grid-container ${className}`}>
      <div className="tool-grid-header">
        <button onClick={toggleColumnChooser}>
          {isColumnChooserVisible ? 'Hide Column Chooser' : 'Show Column Chooser'}
        </button>
      </div>

      {isColumnChooserVisible && (
        <ColumnChooser
          availableColumns={availableTree}
          selectedColumns={selectedColumns}
          selectedGroups={selectedGroups}
          onColumnSelectionChange={handleColumnSelectionChange}
          onColumnGroupChange={handleColumnGroupChange}
        />
      )}

      <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          // Use grouped column definitions
          columnDefs={createGridColumnDefs(
            selectedColumns, 
            selectedGroups,
            normalizedColumnDefs
          )}
          {...finalGridOptions}
        />
      </div>
    </div>
  );
};

export default ToolGrid;