import React, { useState, useEffect } from 'react';
import { ToolGridProps, ExtendedColDef, OperationType } from './types';
import MainGrid from './MainGrid';
import ConfigurationPanel from './ConfigurationPanel';
import './styles.css';

const ToolGrid: React.FC<ToolGridProps> = ({ columnDefs, rowData, configPanelParams }) => {
  const [activeColumnDefs, setActiveColumnDefs] = useState<ExtendedColDef[]>([]);

  // Initialize active columns from columnDefs (only columns without hide: true)
  useEffect(() => {
    setActiveColumnDefs(columnDefs.filter(colDef => colDef.hide !== true));
  }, [columnDefs]);

  // Handle column changes from the configuration panel
  const handleColumnChanged = (selectedColumns: ExtendedColDef[], operationType: OperationType) => {
    // Update active columns in the grid (columns that are visible)
    setActiveColumnDefs(selectedColumns);
    
    // Pass the change to the parent through configPanelParams
    if (configPanelParams?.configPanel?.onColumnChanged) {
      configPanelParams.configPanel.onColumnChanged(selectedColumns, operationType);
    }
  };

  return (
    <div className="tool-grid-container">
      <MainGrid columnDefs={activeColumnDefs} rowData={rowData} />
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