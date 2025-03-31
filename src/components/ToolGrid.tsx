import React, { useState, useEffect, useRef } from 'react';
import { ToolGridProps, ExtendedColDef, OperationType, ColumnGroup, ColumnGroupAction } from './types';
import MainGrid from './MainGrid';
import ConfigurationPanel from './ConfigurationPanel';
import ColumnGroupUtils from './ColumnGroupUtils';
import './styles.css';


// Extend MainGrid props type with getGridApi
interface ExtendedMainGridProps {
  columnDefs: ExtendedColDef[];
  rowData: any[];
  getGridApi: (api: any) => void;
}

const ToolGrid: React.FC<ToolGridProps> = ({ columnDefs, rowData, configPanelParams }) => {
  // Reference to grid API
  const gridRef = useRef<any>(null);
  
  // State for the actively displayed columns in the grid
  const [activeColumnDefs, setActiveColumnDefs] = useState<ExtendedColDef[]>([]);
  
  // State for column groups
  const [localColumnGroups, setLocalColumnGroups] = useState<ColumnGroup[]>([]);
  
  // Flag to track if we're in the middle of a column update operation
  const isUpdatingRef = useRef<boolean>(false);
  
  // Debounce timer reference
  const timerRef = useRef<number | null>(null);
  
  // Explicitly track column order 
  const [columnOrder, setColumnOrder] = useState<string[]>([]);

  // Initialize active columns from columnDefs (only columns without hide: true)
  useEffect(() => {
    // Skip if we're in the middle of a column update operation
    if (isUpdatingRef.current) return;
    
    const visibleColumns = columnDefs.filter(colDef => colDef.hide !== true);
    
    // Use the utility to get columns ordered according to groups
    const initialGroups = configPanelParams?.configPanel?.columnGroups || [];
    const orderedColumns = ColumnGroupUtils.getOrderedColumnsFromGroups(visibleColumns, initialGroups);
    
    setActiveColumnDefs(orderedColumns);
    setColumnOrder(orderedColumns.map(col => col.field));
    
    // Initialize column groups
    if (configPanelParams?.configPanel?.columnGroups) {
      setLocalColumnGroups(configPanelParams.configPanel.columnGroups);
    }
  }, [columnDefs, configPanelParams]);

  // Function to get a reference to the grid API
  const getGridApi = (api: any) => {
    gridRef.current = api;
  };

  // Use effect to update the grid when active column definitions change
  useEffect(() => {
    if (!gridRef.current || !gridRef.current.api) return;
    
    // Skip if we're in the middle of a column update operation
    if (isUpdatingRef.current) return;
    
    // Apply column state to ensure the grid respects our ordering
    const applyColumnOrdering = () => {
      if (!gridRef.current || !gridRef.current.api) return;
      
      const columnState = activeColumnDefs.map(col => ({
        colId: col.field,
        hide: false
      }));
      
      // Apply column state with explicit ordering
      gridRef.current.columnApi.applyColumnState({
        state: columnState,
        applyOrder: true
      });
    };
    
    // First set the column definitions
    gridRef.current.api.setColumnDefs(activeColumnDefs);
    
    // Then apply the column ordering
    applyColumnOrdering();
    
  }, [activeColumnDefs, columnOrder, localColumnGroups]);

  // Function to safely update columns with debouncing
  const safelyUpdateColumns = (columns: ExtendedColDef[], operationType: string) => {
    // Set the updating flag
    isUpdatingRef.current = true;
    
    // Clear any existing timer
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    
    // Update the columns
    setActiveColumnDefs(columns);
    setColumnOrder(columns.map(col => col.field));
    
    // Create a timeout to reset the updating flag
    timerRef.current = window.setTimeout(() => {
      isUpdatingRef.current = false;
      timerRef.current = null;
    }, 150); // Wait 150ms before allowing new updates
  };

  // Handle column changes from the configuration panel
  const handleColumnChanged = (selectedColumns: ExtendedColDef[], operationType: OperationType) => {
    // Skip if we're already updating
    if (isUpdatingRef.current) return;
    
    console.log(`Column change: ${operationType} with ${selectedColumns.length} columns`);
    console.log('New column order:', selectedColumns.map(col => col.field).join(', '));
    
    // For explicit index-based operations, trust the exact order provided
    if (operationType === 'ADD_AT_INDEX' || operationType === 'REORDER_AT_INDEX') {
      // Get columns ordered according to groups
      const orderedColumns = ColumnGroupUtils.getOrderedColumnsFromGroups(selectedColumns, localColumnGroups);
      
      // Update column groups ordering based on the new column order
      const updatedGroups = ColumnGroupUtils.updateGroupsFromColumnOrder(localColumnGroups, orderedColumns);
      setLocalColumnGroups(updatedGroups);
      
      // Update our local state with the new columns and order
      safelyUpdateColumns(orderedColumns, operationType);
      
      // Update the grid directly if we have access to its API
      if (gridRef.current && gridRef.current.api) {
        // First, update the column definitions
        gridRef.current.api.setColumnDefs(orderedColumns);
        
        // Then, force the exact order by applying column state
        const columnState = orderedColumns.map(col => ({
          colId: col.field,
          hide: false
        }));
        
        console.log('Applying column state with order:', columnState.map(state => state.colId).join(', '));
        
        gridRef.current.columnApi.applyColumnState({
          state: columnState,
          applyOrder: true
        });
      }
    } 
    // Standard handling for other operations
    else {
      const orderedColumns = ColumnGroupUtils.getOrderedColumnsFromGroups(selectedColumns, localColumnGroups);
      safelyUpdateColumns(orderedColumns, operationType);
      
      // Update column groups ordering for standard operations as well
      const updatedGroups = ColumnGroupUtils.updateGroupsFromColumnOrder(localColumnGroups, orderedColumns);
      setLocalColumnGroups(updatedGroups);
    }
    
    // Pass the change to the parent component
    if (configPanelParams?.configPanel?.onColumnChanged) {
      // For special operations, translate them to standard operations for the parent
      const parentOperationType = 
        operationType === 'ADD_AT_INDEX' ? 'ADD' :
        operationType === 'REORDER_AT_INDEX' ? 'REORDERED' :
        operationType;
      
      configPanelParams.configPanel.onColumnChanged(selectedColumns, parentOperationType);
    }
  };

  // Handle column group changes
// Handle column group changes
const handleColumnGroupChanged = (headerName: string, action: ColumnGroupAction, replacementName?: string) => {
  if (action === 'REMOVE') {
    // Remove the group
    const updatedGroups = localColumnGroups.filter(group => group.headerName !== headerName);
    setLocalColumnGroups(updatedGroups);
    
    // Re-order columns without this group
    const reorderedColumns = ColumnGroupUtils.getOrderedColumnsFromGroups(activeColumnDefs, updatedGroups);
    safelyUpdateColumns(reorderedColumns, 'REORDERED');
  } 
  else if (action === 'UPDATE' && replacementName) {
    // Update the group
    const updatedGroups = [...localColumnGroups];
    const groupIndex = updatedGroups.findIndex(group => group.headerName === headerName);
    
    if (groupIndex !== -1) {
      // Update existing group
      updatedGroups[groupIndex] = {
        ...updatedGroups[groupIndex],
        headerName: replacementName
      };
    } else {
      // Add new group
      updatedGroups.push({
        headerName: replacementName,
        children: []
      });
    }
    
    setLocalColumnGroups(updatedGroups);
    
    // Re-order columns with the updated group
    const reorderedColumns = ColumnGroupUtils.getOrderedColumnsFromGroups(activeColumnDefs, updatedGroups);
    safelyUpdateColumns(reorderedColumns, 'REORDERED');
  }
  
  // Pass the change to the parent component
  if (configPanelParams?.configPanel?.onColumnGroupChanged) {
    configPanelParams.configPanel.onColumnGroupChanged(headerName, action, replacementName);
  }
};

  return (
    <div className="tool-grid-container">
      {/* Pass the getGridApi function to MainGrid */}
      <MainGrid 
        columnDefs={activeColumnDefs} 
        rowData={rowData}
        getGridApi={getGridApi}
      />
      
      {configPanelParams && (
        <ConfigurationPanel 
          columnDefs={columnDefs} 
          configPanelParams={{
            ...configPanelParams,
            configPanel: {
              ...configPanelParams.configPanel,
              columnGroups: localColumnGroups,
              onColumnChanged: handleColumnChanged,
              onColumnGroupChanged: handleColumnGroupChanged
            }
          }}
        />
      )}
    </div>
  );
};

export default ToolGrid;