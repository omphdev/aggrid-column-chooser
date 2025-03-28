import React, { useState, useEffect, useRef } from 'react';
import { ToolGridProps, ExtendedColDef, OperationType } from './types';
import MainGrid from './MainGrid';
import ConfigurationPanel from './ConfigurationPanel';
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
  
  // Explicitly track column order 
  const [columnOrder, setColumnOrder] = useState<string[]>([]);

  // Initialize active columns from columnDefs (only columns without hide: true)
  useEffect(() => {
    const visibleColumns = columnDefs.filter(colDef => colDef.hide !== true);
    setActiveColumnDefs(visibleColumns);
    setColumnOrder(visibleColumns.map(col => col.field));
  }, [columnDefs]);

  // Function to get a reference to the grid API
  const getGridApi = (api: any) => {
    gridRef.current = api;
  };

  // Handle column changes from the configuration panel
  const handleColumnChanged = (selectedColumns: ExtendedColDef[], operationType: OperationType) => {
    console.log(`Column change: ${operationType} with ${selectedColumns.length} columns`);
    
    // Special handling for explicit index-based operations
    if (operationType === 'ADD_AT_INDEX' || operationType === 'REORDER_AT_INDEX') {
      // For these operations, we trust the exact order provided by the panel
      const newOrder = selectedColumns.map(col => col.field);
      console.log('Explicit column order: ', newOrder.join(', '));
      
      // Update our local state
      setActiveColumnDefs([...selectedColumns]);
      setColumnOrder(newOrder);
      
      // Update the grid directly if we have access to its API
      if (gridRef.current) {
        // First, update the column definitions
        gridRef.current.api.setColumnDefs(selectedColumns);
        
        // Then, force the exact order
        const columnState = selectedColumns.map(col => ({
          colId: col.field,
          hide: false
        }));
        
        gridRef.current.columnApi.applyColumnState({
          state: columnState,
          applyOrder: true
        });
      }
    } 
    // Standard handling for other operations
    else {
      setActiveColumnDefs(selectedColumns);
      setColumnOrder(selectedColumns.map(col => col.field));
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
              onColumnChanged: handleColumnChanged
            }
          }}
        />
      )}
    </div>
  );
};

export default ToolGrid;