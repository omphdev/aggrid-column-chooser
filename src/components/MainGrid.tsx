import React, { useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { MainGridProps } from './types';

// Extended props to include the getGridApi function
interface ExtendedMainGridProps extends MainGridProps {
  getGridApi?: (api: any) => void;
}

const MainGrid: React.FC<ExtendedMainGridProps> = ({ columnDefs, rowData, getGridApi }) => {
  const gridRef = useRef<AgGridReact>(null);
  
  // Flag to track if columns are being updated
  const isUpdatingColumnsRef = useRef<boolean>(false);

  // Handle grid ready event
  const onGridReady = (params: any) => {
    // If the getGridApi function is provided, call it with the grid API
    if (getGridApi) {
      getGridApi(params);
    }
  };

  // Update grid when column definitions change
  useEffect(() => {
    if (!gridRef.current || !gridRef.current.api) return;
    
    // Set the updating flag to prevent multiple updates
    if (isUpdatingColumnsRef.current) return;
    isUpdatingColumnsRef.current = true;

    // Update the column definitions
    gridRef.current.api.setColumnDefs(columnDefs);
    
    // Force the column order to match exactly what was provided
    const columnState = columnDefs.map(col => ({
      colId: col.field
    }));
    
    gridRef.current.columnApi.applyColumnState({
      state: columnState,
      applyOrder: true
    });
    
    // Reset the updating flag after a short delay
    setTimeout(() => {
      isUpdatingColumnsRef.current = false;
    }, 100);
  }, [columnDefs]);

  return (
    <div className="main-grid-container ag-theme-alpine" style={{ height: '500px', width: '100%' }}>
      <AgGridReact
        ref={gridRef}
        onGridReady={onGridReady}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={{
          flex: 1,
          minWidth: 100,
          resizable: true,
          sortable: true,
          filter: true,
        }}
        // Critical settings to maintain column order
        maintainColumnOrder={true}
        suppressColumnVirtualisation={true}
        suppressMovableColumns={false}
        columnHoverHighlight={false} // Disable hover effect to prevent unintended interactions
        enableCellTextSelection={true} // Enable text selection to reduce accidental drag-drop
        suppressRowDrag={true} // Disable row drag to avoid confusion with column drag
      />
    </div>
  );
};

export default MainGrid;