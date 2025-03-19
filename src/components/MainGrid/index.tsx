import React, { useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { GridReadyEvent } from 'ag-grid-community';
import { useColumnContext } from '../../contexts/ColumnContext';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'ag-grid-enterprise';

interface MainGridProps {
  height?: string | number;
}

const MainGrid: React.FC<MainGridProps> = ({
  height = '100%'
}) => {
  const {
    state,
    setGridApi,
    getDefaultColDef
  } = useColumnContext();
  
  const { rowData, mainGridColumns } = state;
  
  // Create default column definition
  const defaultColDef = getDefaultColDef();
  
  // Grid ready event handler
  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
  }, [setGridApi]);
  
  return (
    <div 
      className="ag-theme-alpine" 
      style={{ width: '100%', height }}
    >
      <AgGridReact
        rowData={rowData}
        columnDefs={mainGridColumns}
        defaultColDef={defaultColDef}
        onGridReady={onGridReady}
        animateRows={true}
        domLayout="autoHeight"
      />
    </div>
  );
};

export default React.memo(MainGrid);