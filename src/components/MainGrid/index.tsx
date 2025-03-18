// src/components/MainGrid/index.tsx
import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import { GridReadyEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'ag-grid-enterprise';
import { MainGridProps } from '../../types';
import { useColumnContext } from '../../contexts/ColumnContext';

/**
 * Main grid component for displaying data with the selected columns
 */
export const MainGrid: React.FC<MainGridProps> = ({
  height = "100%"
}) => {
  const {
    rowData,
    mainGridColumns,
    defaultColDef,
    onGridReady
  } = useColumnContext();

  return (
    <div className="ag-theme-alpine" style={{ 
      width: '100%', 
      height: height,
      marginTop: 20
    }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={mainGridColumns}
        defaultColDef={defaultColDef}
        onGridReady={(params: GridReadyEvent) => onGridReady(params)}
        animateRows={true}
        domLayout="autoHeight"
      />
    </div>
  );
};

export default MainGrid;