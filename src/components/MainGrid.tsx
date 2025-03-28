import React, { useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { MainGridProps } from './types';

const MainGrid: React.FC<MainGridProps> = ({ columnDefs, rowData }) => {
  const gridRef = useRef<AgGridReact>(null);

  // Update grid when column definitions change
  useEffect(() => {
    if (gridRef.current && gridRef.current.api) {
      gridRef.current.api.setColumnDefs(columnDefs);
    }
  }, [columnDefs]);

  return (
    <div className="main-grid-container ag-theme-alpine" style={{ height: '500px', width: '100%' }}>
      <AgGridReact
        ref={gridRef}
        columnDefs={columnDefs}
        rowData={rowData}
        defaultColDef={{
          flex: 1,
          minWidth: 100,
          resizable: true,
          sortable: true,
          filter: true,
        }}
      />
    </div>
  );
};

export default MainGrid;