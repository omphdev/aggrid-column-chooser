import React, { useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { GridReadyEvent, ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'ag-grid-enterprise';

interface MainGridProps {
  columnDefs: ColDef[];
  rowData: any[];
  height?: string | number;
}

const MainGrid: React.FC<MainGridProps> = ({
  columnDefs,
  rowData,
  height = '100%'
}) => {
  // Create default column definition
  const defaultColDef = useMemo<ColDef>(() => ({
    flex: 1,
    minWidth: 100,
    resizable: true,
    sortable: true,
    filter: true
  }), []);
  
  // Grid ready event handler
  const onGridReady = useCallback((params: GridReadyEvent) => {
    // You could save the gridApi here if needed
    console.log('Grid is ready');
  }, []);
  
  return (
    <div 
      className="ag-theme-alpine" 
      style={{ width: '100%', height }}
    >
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={onGridReady}
        animateRows={true}
        domLayout="autoHeight"
      />
    </div>
  );
};

export default React.memo(MainGrid);