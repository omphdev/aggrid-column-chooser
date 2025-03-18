// App.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { GridReadyEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'ag-grid-enterprise';
import { TreeView } from './TreeViews';
import { useAllPossibleColumns, useMockData, useMockColumnDefinitions } from './mockData';
import { useColumnManagement } from './hooks/useColumnManagement';
import { ColumnDefinition } from './types';
import './DragDropStyles.css';

// Main App Component
const ColumnChooserDemo: React.FC = () => {
  // Get mock data
  const allPossibleColumns = useAllPossibleColumns();
  const mockData = useMockData();
  const mockColumnDefinitions = useMockColumnDefinitions();
  
  // State for view toggle and selected columns
  const [selectedColumnsFlat, setSelectedColumnsFlat] = useState(true);
  const [selectedColumnDefinitions, setSelectedColumnDefinitions] = useState<ColumnDefinition[]>([]);
  
  // Handle selected columns change
  const handleSelectedColumnsChange = useCallback((columns: ColumnDefinition[]) => {
    setSelectedColumnDefinitions(columns);
    console.log('Selected columns updated:', columns);
  }, []);
  
  // Use the column management hook
  const {
    rowData,
    mainGridColumns,
    availableColumns,
    selectedColumns,
    defaultColDef,
    selectedAvailableCount,
    selectedSelectedCount,
    toggleExpandAvailable,
    toggleExpandSelected,
    toggleSelectAvailable,
    toggleSelectSelected,
    selectAllAvailable,
    selectAllSelected,
    clearSelectionAvailable,
    clearSelectionSelected,
    handleAvailableItemDragStart,
    handleSelectedItemDragStart,
    handleDragOver,
    handleDropToSelected,
    handleDropToAvailable,
    handleSelectedItemReorder,
    onGridReady,
    setIsFlatView
  } = useColumnManagement({
    allPossibleColumns,
    mockData,
    onSelectedColumnsChange: handleSelectedColumnsChange,
    flatViewSelected: selectedColumnsFlat
  });

  // Update flat view state in the column management hook when it changes
  useEffect(() => {
    setIsFlatView(selectedColumnsFlat);
  }, [selectedColumnsFlat, setIsFlatView]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Column Chooser Section */}
      <div style={{ display: 'flex', padding: '10px', gap: '10px', height: '300px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3>Column Chooser</h3>
            
            <div>
              <label className="flat-view-toggle">
                <input
                  type="checkbox"
                  checked={selectedColumnsFlat}
                  onChange={(e) => setSelectedColumnsFlat(e.target.checked)}
                  style={{ marginRight: '5px' }}
                />
                Flat View
              </label>
            </div>
          </div>
          <div className="column-chooser-container">
            {/* Available Columns */}
            <div className="column-chooser-panel">
              <TreeView 
                items={availableColumns}
                onDragStart={handleAvailableItemDragStart}
                onDrop={handleDropToAvailable}
                onDragOver={handleDragOver}
                title="Available Columns"
                toggleExpand={toggleExpandAvailable}
                toggleSelect={toggleSelectAvailable}
                onSelectAll={selectAllAvailable}
                onClearSelection={clearSelectionAvailable}
                selectedCount={selectedAvailableCount}
              />
            </div>
            
            {/* Selected Columns */}
            <div className="column-chooser-panel">
              <TreeView 
                items={selectedColumns}
                onDragStart={handleSelectedItemDragStart}
                onDrop={handleDropToSelected}
                onDragOver={handleDragOver}
                title="Selected Columns"
                toggleExpand={toggleExpandSelected}
                toggleSelect={toggleSelectSelected}
                onSelectAll={selectAllSelected}
                onClearSelection={clearSelectionSelected}
                selectedCount={selectedSelectedCount}
                flatView={selectedColumnsFlat}
                showGroupLabels={true}
                onItemReorder={handleSelectedItemReorder}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Grid */}
      <div className="ag-theme-alpine" style={{ flex: 1, width: '100%' , marginTop: 80 }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={mainGridColumns}
          defaultColDef={defaultColDef}
          onGridReady={(params: GridReadyEvent) => onGridReady(params)}
          animateRows={true}
          domLayout="autoHeight"
        />
      </div>
    </div>
  );
};

export default ColumnChooserDemo;