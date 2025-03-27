import React, { useEffect } from 'react';
import ColumnChooser from './components/ColumnChooser';
import MainGrid from './components/MainGrid';
import { initializeDragSilhouette, cleanupDragSilhouette } from './utils/dragUtils';
import { generateMockColumnDefinitions, generateMockData } from './utils/mockData';
import useDashboardState from './hooks/useDashboardState';
import dashboardStateService from './services/dashboardStateService';
import { ColumnGroup } from './types';
import './App.css';
// Import selection styles to ensure they're loaded
import './components/TreeView/SelectionStyles.css';

// Main App component demonstrating how a consumer would use this
const App: React.FC = () => {
  // Get the dashboard state via our custom hook
  const [state, stateService] = useDashboardState();
  
  // Initialize on mount
  useEffect(() => {
    // Get sample data
    const columnDefinitions = generateMockColumnDefinitions();
    const mockData = generateMockData();
    
    // Create sample column groups
    const initialColumnGroups: ColumnGroup[] = [
      {
        id: 'group1',
        name: 'Key Metrics',
        columnIds: ['column_1', 'column_2', 'column_3']
      },
      {
        id: 'group2',
        name: 'Performance Indicators',
        columnIds: ['column_11', 'column_12', 'column_13']
      }
    ];
    
    // Initialize the dashboard state with data and column groups
    dashboardStateService.initialize(columnDefinitions, mockData, initialColumnGroups);
    
    // Initialize drag and drop system
    initializeDragSilhouette();
    
    console.log('Drag system initialized');
    
    // Force an update to apply initial available columns filtering
    // This ensures items don't appear in both panels on startup
    if (dashboardStateService.value.selectedColumnIds.length > 0) {
      dashboardStateService.updateSelectedColumns(dashboardStateService.value.selectedColumnIds);
    }
    
    // Add debugging listener
    const handleDragEvents = (e: DragEvent) => {
      console.log(`Drag event: ${e.type}`);
    };
    
    document.addEventListener('dragstart', handleDragEvents);
    document.addEventListener('dragover', handleDragEvents);
    document.addEventListener('drop', handleDragEvents);
    
    // Clean up on unmount
    return () => {
      cleanupDragSilhouette();
      document.removeEventListener('dragstart', handleDragEvents);
      document.removeEventListener('dragover', handleDragEvents);
      document.removeEventListener('drop', handleDragEvents);
    };
  }, []);
  
  // Handle column selection changes
  const handleSelectedColumnsChange = (columnIds: string[]) => {
    console.log('Selected columns changed:', columnIds);
    // Update the dashboard state, which will trigger UI updates
    dashboardStateService.updateSelectedColumns(columnIds);
  };
  
  // Handle column group changes
  const handleColumnGroupsChange = (columnGroups: ColumnGroup[]) => {
    console.log('Column groups changed:', columnGroups);
    // Update the dashboard state with new column groups
    dashboardStateService.updateColumnGroups(columnGroups);
  };
  
  return (
    <div className="app-container">
      <div className="app-layout">
        {/* Main Grid */}
        <div className="main-grid-container">
          <h3>Data Grid</h3>
          <MainGrid 
            columnDefs={state.gridColumnDefs}
            rowData={state.gridData}
            height="calc(100% - 40px)" 
          />
        </div>
        
        {/* Column Chooser */}
        <div className="column-chooser-container">
          <ColumnChooser 
            availableColumns={state.availableColumns}
            selectedColumns={state.selectedColumns}
            isFlatView={state.isFlatView}
            columnGroups={state.columnGroups}
            onSelectedColumnsChange={handleSelectedColumnsChange}
            onColumnGroupsChange={handleColumnGroupsChange}
          />
        </div>
      </div>
    </div>
  );
};

export default App;