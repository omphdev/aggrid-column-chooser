import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColumnApi, GridApi, GridReadyEvent, ColDef, ColGroupDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { 
  ToolGridProps, 
  ExtendedColDef, 
  TreeNode, 
  SelectedNode, 
  SelectedGroup,
  ColumnChangeEvent
} from './types';
import ColumnChooser from './ColumnChooser';

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
    const buildTree = () => {
      const tree: TreeNode[] = [];
      const nodeMap: { [path: string]: TreeNode } = {};

      // Create a helper function to ensure a path exists in the tree
      const ensurePathExists = (pathSegments: string[], parentPath: string[] = []): TreeNode => {
        if (pathSegments.length === 0) return { id: '', name: '', children: [], isGroup: false };

        const currentSegment = pathSegments[0];
        const currentPath = [...parentPath, currentSegment];
        const currentPathString = currentPath.join('/');

        if (!nodeMap[currentPathString]) {
          const newNode: TreeNode = {
            id: currentPathString,
            name: currentSegment,
            children: [],
            isGroup: true,
            isExpanded: true,
            parentPath
          };

          nodeMap[currentPathString] = newNode;

          // Add to parent or to root
          if (parentPath.length === 0) {
            tree.push(newNode);
          } else {
            const parentPathString = parentPath.join('/');
            const parentNode = nodeMap[parentPathString];
            if (parentNode) {
              parentNode.children.push(newNode);
            }
          }
        }

        if (pathSegments.length > 1) {
          return ensurePathExists(pathSegments.slice(1), currentPath);
        }

        return nodeMap[currentPathString];
      };

      // Filter out columns that are already selected
      const selectedColumnIds = selectedColumns.map(col => col.id);
      const availableColumns = normalizedColumnDefs.filter(
        col => !selectedColumnIds.includes(col.id!)
      );

      // Populate the tree with available columns
      availableColumns.forEach(col => {
        const groupPath = col.groupPath || [];
        
        if (groupPath.length === 0) {
          // If no group path, add directly to the root
          tree.push({
            id: col.id!,
            name: col.headerName || col.field || 'Unnamed Column',
            children: [],
            column: col,
            isGroup: false
          });
        } else {
          // Ensure the path exists and add the column as a leaf node
          const parentNode = ensurePathExists(groupPath);
          parentNode.children.push({
            id: col.id!,
            name: col.headerName || col.field || 'Unnamed Column',
            children: [],
            column: col,
            isGroup: false
          });
        }
      });

      // Filter out empty groups
      const filterEmptyGroups = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.filter(node => {
          if (node.isGroup) {
            node.children = filterEmptyGroups(node.children);
            return node.children.length > 0;
          }
          return true;
        });
      };

      return filterEmptyGroups(tree);
    };

    setAvailableTree(buildTree());
  }, [normalizedColumnDefs, selectedColumns]);

  // Apply selected columns to the grid with appropriate grouping
  useEffect(() => {
    if (apiRef.current.column) {
      // Create AG Grid column definitions with groups
      const gridColDefs = createGridColumnDefs();
      
      // Update grid columns
      apiRef.current.grid?.setColumnDefs(gridColDefs);
    }
  }, [selectedColumns, selectedGroups]);

  // Create AG Grid column definitions with grouping
  const createGridColumnDefs = (): (ColDef | ColGroupDef)[] => {
    // First, get all ungrouped columns
    const groupedColumnIds = selectedGroups.flatMap(g => g.children);
    const ungroupedColumns = selectedColumns
      .filter(col => !groupedColumnIds.includes(col.id))
      .map(node => ({
        ...node.column,
        hide: false
      }));
    
    // Create column group definitions
    const groupDefs: ColGroupDef[] = selectedGroups.map(group => {
      // Get columns for this group
      const groupColumns = selectedColumns
        .filter(col => group.children.includes(col.id))
        .map(node => ({
          ...node.column,
          hide: false
        }));
      
      // Ensure columns appear in the correct order in the group
      const orderedColumns: ColDef[] = [];
      group.children.forEach(childId => {
        const column = groupColumns.find(col => (col.id === childId || col.field === childId));
        if (column) {
          orderedColumns.push(column);
        }
      });
      
      return {
        headerName: group.name,
        children: orderedColumns
      };
    });
    
    // Combine group definitions with ungrouped columns
    const visibleColumnDefs = [...groupDefs, ...ungroupedColumns];
    
    // Add hidden columns (those in available)
    const hiddenColumns = normalizedColumnDefs
      .filter(col => !selectedColumns.find(selected => selected.id === col.id))
      .map(col => ({ ...col, hide: true }));
    
    return [...visibleColumnDefs, ...hiddenColumns];
  };

  // Handle grid ready event
  const onGridReady = (params: GridReadyEvent) => {
    apiRef.current.grid = params.api;
    apiRef.current.column = params.columnApi;
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
          setSelectedGroups={setSelectedGroups}
        />
      )}

      <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          // Use grouped column definitions
          columnDefs={createGridColumnDefs()}
          onGridReady={onGridReady}
          {...gridOptions}
        />
      </div>
    </div>
  );
};

export default ToolGrid;