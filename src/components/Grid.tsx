import React, { useState, useEffect, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { GridReadyEvent, ColDef, ColGroupDef } from 'ag-grid-community';
import { ColumnItem, ColumnGroup } from '../types';
import ColumnChooser from './ColumnChooser';
import { convertToTreeStructure } from '../utils/columnUtils';
import { initializeDragSilhouette, cleanupDragSilhouette } from '../utils/dragUtils';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'ag-grid-enterprise';

interface GridProps {
  // All available column definitions
  columnDefs: ColDef[];
  // Data for the grid
  rowData: any[];
  // Initial selected column IDs (optional)
  initialSelectedColumnIds?: string[];
  // Initial column groups (optional)
  initialColumnGroups?: ColumnGroup[];
  // Callback when selected columns change
  onColumnChanged?: (selectedColumns: ColumnItem[]) => void;
  // Callback when column groups change
  onColumnGroupsChanged?: (columnGroups: ColumnGroup[]) => void;
  // Grid height
  height?: string | number;
  // Use flat view in column chooser (default: false)
  useFlatView?: boolean;
}

const Grid: React.FC<GridProps> = ({
  columnDefs,
  rowData,
  initialSelectedColumnIds = [],
  initialColumnGroups = [],
  onColumnChanged,
  onColumnGroupsChanged,
  height = '600px',
  useFlatView = false
}) => {
  // State for columns and groups
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>(initialSelectedColumnIds);
  const [selectedColumns, setSelectedColumns] = useState<ColumnItem[]>([]);
  const [availableColumns, setAvailableColumns] = useState<ColumnItem[]>([]);
  const [columnGroups, setColumnGroups] = useState<ColumnGroup[]>(initialColumnGroups);
  const [isFlatView, setIsFlatView] = useState<boolean>(useFlatView);
  
  // Default column definition for AG Grid
  const defaultColDef = React.useMemo<ColDef>(() => ({
    flex: 1,
    minWidth: 100,
    resizable: true,
    sortable: true,
    filter: true
  }), []);

  // Initialize drag and drop system
  useEffect(() => {
    initializeDragSilhouette();
    
    return () => {
      cleanupDragSilhouette();
    };
  }, []);

  // Convert AG Grid column definitions to our internal format
  const convertColumnsFormat = useCallback((columns: ColDef[]) => {
    return columns.map(col => ({
      id: col.field || `col_${Math.random().toString(36).substring(2, 9)}`,
      field: col.field || `col_${Math.random().toString(36).substring(2, 9)}`,
      groupPath: col.headerName ? [col.headerName] : [col.field || '']
    }));
  }, []);
  
  // Update available and selected columns when columnDefs change
  useEffect(() => {
    // Convert AG Grid column defs to our internal format
    const formattedColumns = convertColumnsFormat(columnDefs);
    
    // Create treeStructure for all columns
    const allColumnsTree = convertToTreeStructure(formattedColumns);
    
    // Split into available and selected based on IDs
    const selectedSet = new Set(selectedColumnIds);
    
    // Create selected columns from the selected IDs that exist in the new columnDefs
    const validSelectedIds: string[] = [];
    const newSelectedColumns: ColumnItem[] = [];
    
    formattedColumns.forEach(col => {
      if (selectedSet.has(col.id)) {
        validSelectedIds.push(col.id);
        newSelectedColumns.push({
          id: col.id,
          name: col.groupPath[col.groupPath.length - 1],
          field: col.field
        });
      }
    });
    
    // Filter tree to get only available columns (not in selected)
    const filterAvailable = (items: ColumnItem[]): ColumnItem[] => {
      const result: ColumnItem[] = [];
      
      for (const item of items) {
        // Skip if this item is selected
        if (item.field && selectedSet.has(item.id)) {
          continue;
        }
        
        // For groups, process children
        if (item.children && item.children.length > 0) {
          const filteredChildren = filterAvailable(item.children);
          if (filteredChildren.length > 0) {
            result.push({
              ...item,
              children: filteredChildren
            });
          }
        } else if (!selectedSet.has(item.id)) {
          // Add leaf node if not selected
          result.push({ ...item });
        }
      }
      
      return result;
    };
    
    const filteredAvailable = filterAvailable(allColumnsTree);
    
    // Update state
    setSelectedColumnIds(validSelectedIds);
    setSelectedColumns(newSelectedColumns);
    setAvailableColumns(filteredAvailable);
    
    // Update column groups - filter out any columns that no longer exist
    const newColumnGroups = columnGroups.map(group => ({
      ...group,
      columnIds: group.columnIds.filter(id => 
        formattedColumns.some(col => col.id === id)
      )
    })).filter(group => group.columnIds.length > 0);
    
    setColumnGroups(newColumnGroups);
    
  }, [columnDefs, selectedColumnIds, columnGroups, convertColumnsFormat]);
  
  // Handle column selection changes
  const handleSelectedColumnsChange = useCallback((columnIds: string[]) => {
    setSelectedColumnIds(columnIds);
    
    // Create selected columns objects from the IDs
    const formattedColumns = convertColumnsFormat(columnDefs);
    const columnMap = new Map(formattedColumns.map(col => [col.id, col]));
    
    const newSelectedColumns = columnIds
      .filter(id => columnMap.has(id))
      .map(id => {
        const col = columnMap.get(id)!;
        return {
          id: col.id,
          name: col.groupPath[col.groupPath.length - 1],
          field: col.field
        };
      });
    
    setSelectedColumns(newSelectedColumns);
    
    // Notify parent of change
    if (onColumnChanged) {
      onColumnChanged(newSelectedColumns);
    }
  }, [columnDefs, convertColumnsFormat, onColumnChanged]);
  
  // Handle column group changes
  const handleColumnGroupsChange = useCallback((groups: ColumnGroup[]) => {
    setColumnGroups(groups);
    
    // Notify parent of change
    if (onColumnGroupsChanged) {
      onColumnGroupsChanged(groups);
    }
  }, [onColumnGroupsChanged]);
  
  // Generate grid column definitions from selected columns
  const gridColumnDefs = React.useMemo(() => {
    // Create map for looking up original column props
    const colDefMap = new Map(
      columnDefs.map(col => [col.field, col])
    );
    
    // Create a map of column ID to group ID
    const columnToGroupMap = new Map<string, string>();
    columnGroups.forEach(group => {
      group.columnIds.forEach(columnId => {
        columnToGroupMap.set(columnId, group.id);
      });
    });
    
    // Create a map of group ID to group for quick lookup
    const groupMap = new Map<string, ColumnGroup>();
    columnGroups.forEach(group => groupMap.set(group.id, group));
    
    // Process selected columns to generate grid column definitions
    const result: (ColDef | ColGroupDef)[] = [];
    const processedGroups = new Set<string>();
    
    selectedColumns.forEach(col => {
      const groupId = columnToGroupMap.get(col.id);
      
      if (groupId && !processedGroups.has(groupId)) {
        // This column belongs to a group
        const group = groupMap.get(groupId)!;
        const groupColumns = selectedColumns.filter(c => 
          group.columnIds.includes(c.id)
        );
        
        if (groupColumns.length > 0) {
          const groupChildren = groupColumns.map(childCol => {
            const originalProps = colDefMap.get(childCol.field) || {};
            // Merge original props with our required ones
            return {
              ...originalProps,
              field: childCol.field,
              headerName: childCol.name
            };
          });
          
          result.push({
            headerName: group.name,
            children: groupChildren
          } as ColGroupDef);
          
          processedGroups.add(groupId);
        }
      } else if (!groupId) {
        // This is an ungrouped column
        const originalProps = colDefMap.get(col.field) || {};
        // Merge original props with our required ones
        result.push({
          ...originalProps,
          field: col.field,
          headerName: col.name
        });
      }
    });
    
    return result;
  }, [columnDefs, selectedColumns, columnGroups]);
  
  // Grid ready event handler
  const onGridReady = useCallback((params: GridReadyEvent) => {
    console.log('Grid is ready');
  }, []);
  
  // Handle flat view toggle
  const handleFlatViewChange = useCallback((flatView: boolean) => {
    setIsFlatView(flatView);
  }, []);
  
  return (
    <div style={{ height, display: 'flex', gap: '20px' }}>
      {/* Main Grid */}
      <div style={{ flex: 2 }}>
        <div className="ag-theme-alpine" style={{ width: '100%', height: '100%' }}>
          <AgGridReact
            rowData={rowData}
            columnDefs={gridColumnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            animateRows={true}
            domLayout="autoHeight"
          />
        </div>
      </div>
      
      {/* Column Chooser */}
      <div style={{ flex: 1 }}>
        <ColumnChooser
          availableColumns={availableColumns}
          selectedColumns={selectedColumns}
          isFlatView={isFlatView}
          columnGroups={columnGroups}
          onSelectedColumnsChange={handleSelectedColumnsChange}
          onColumnGroupsChange={handleColumnGroupsChange}
        />
      </div>
    </div>
  );
};

export default React.memo(Grid);