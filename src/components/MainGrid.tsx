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

    // Update the column definitions
    gridRef.current.api.setColumnDefs(columnDefs);
    
    // Force the column order to match exactly what was provided
    gridRef.current.columnApi.applyColumnState({
      state: columnDefs.map(col => ({
        colId: col.field
      })),
      applyOrder: true
    });
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
      />
    </div>
  );
};

export default MainGrid;