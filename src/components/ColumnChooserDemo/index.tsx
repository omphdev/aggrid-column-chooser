// src/components/ColumnChooserDemo/index.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'ag-grid-enterprise';
import { ColumnItem, ColumnDefinition, CustomColumnGroup } from '../../types';
import { useColumnContext } from '../../contexts/ColumnContext';
import AvailableColumns from '../ColumnChooser/AvailableColumns';
import SelectedColumns from '../ColumnChooser/SelectedColumns';
import DragSilhouette from '../DragDrop/DragSilhouette';
import './styles.css';

/**
 * Demo component for the AG-Grid column chooser with custom drag and drop
 */
const ColumnChooserDemo: React.FC = () => {
  // State for flat view toggle
  const [selectedColumnsFlat, setSelectedColumnsFlat] = useState(false);
  
  // Use the column context
  const { 
    rowData, 
    mainGridColumns, 
    defaultColDef, 
    onGridReady,
    setIsFlatView
  } = useColumnContext();
  
  // Update the context when the flat view toggle changes
  useEffect(() => {
    setIsFlatView(selectedColumnsFlat);
  }, [selectedColumnsFlat, setIsFlatView]);

  return (
    <div className="column-chooser-demo">
      {/* Initialize the drag silhouette system */}
      <DragSilhouette />
      
      <div className="column-chooser-layout">
        <div className="main-panel">
          <h3>AG-Grid with Custom Column Groups</h3>
          
          <div className="grid-container">
            <div className="ag-theme-alpine" style={{ height: '500px', width: '100%' }}>
              <AgGridReact
                rowData={rowData}
                columnDefs={mainGridColumns}
                defaultColDef={defaultColDef}
                onGridReady={onGridReady}
                animateRows={true}
              />
            </div>
          </div>
        </div>
        
        <div className="chooser-panel">
          <div className="chooser-header">
            <h3>Column Chooser</h3>
            
            <label className="flat-view-toggle">
              <input
                type="checkbox"
                checked={selectedColumnsFlat}
                onChange={(e) => setSelectedColumnsFlat(e.target.checked)}
              />
              Flat View
            </label>
          </div>
          
          <div className="columns-container">
            <AvailableColumns title="Available Columns" />
            <SelectedColumns 
              title="Selected Columns" 
              flatView={selectedColumnsFlat}
              showGroupLabels={true}
            />
          </div>
        </div>
      </div>
      
      <div className="instructions">
        <h3>Instructions:</h3>
        <p>Drag columns between the Available and Selected panels to customize the grid.</p>
        <ul>
          <li>Grouped columns will remain in their groups when moved to the Selected panel.</li>
          <li>Ungrouped columns will appear at the root level in the Selected panel.</li>
          <li>Use the "Flat View" toggle to switch between hierarchical and flat views.</li>
        </ul>
      </div>
    </div>
  );
};

export default ColumnChooserDemo;