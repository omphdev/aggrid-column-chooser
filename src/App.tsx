// src/App.tsx
import React, { useState, useCallback } from 'react';
import { ColumnDefinition, CustomColumnGroup } from './types';
import ColumnChooser from './components/ColumnChooser';
import MainGrid from './components/MainGrid';
import DragSilhouette from './components/DragDrop/DragSilhouette';
import ColumnGroupsIntegration from './components/ColumnGroupsIntegration';
import { ColumnProvider } from './contexts/ColumnContext';

/**
 * Main application component with custom column groups support
 */
const App: React.FC = () => {
  // State to store the currently selected columns
  const [selectedColumns, setSelectedColumns] = useState<ColumnDefinition[]>([]);
  
  // State to store custom groups
  const [customGroups, setCustomGroups] = useState<CustomColumnGroup[]>([
    {
      headerName: 'Personal Information',
      id: 'personal-info',
      children: ['column_1', 'column_2', 'column_3', 'column_4']
    },
    {
      headerName: 'Financial Data',
      id: 'financial-data',
      children: ['column_21', 'column_22', 'column_23', 'column_24', 'column_25']
    }
  ]);
  
  // Handler for column selection changes
  const handleSelectedColumnsChange = useCallback((columns: ColumnDefinition[]) => {
    setSelectedColumns(columns);
    console.log('Selected columns updated:', columns);
  }, []);
  
  // Handler for custom groups changes
  const handleCustomGroupsChange = useCallback((groups: CustomColumnGroup[]) => {
    setCustomGroups(groups);
    console.log('Custom groups updated:', groups);
  }, []);
  
  // Get sample data for the provider
  const { useAllPossibleColumns, useMockData } = require('./data/mockData');
  const allPossibleColumns = useAllPossibleColumns();
  const mockData = useMockData();

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '20px'
    }}>
      {/* Initialize the drag silhouette system */}
      <DragSilhouette />
      
      {/* Wrap everything that needs context in the provider */}
      <ColumnProvider 
        allPossibleColumns={allPossibleColumns}
        initialData={mockData}
        customGroups={customGroups}
        onSelectedColumnsChange={handleSelectedColumnsChange}
      >
        <div style={{
          display: 'flex',
          gap: '20px',
          height: 'calc(100vh - 40px)',
          overflow: 'hidden'
        }}>
          {/* Main content area - takes up more space */}
          <div style={{ 
            flex: '3', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <h3>AG-Grid with Custom Column Groups</h3>
            
            {/* Custom Groups Integration */}
            <ColumnGroupsIntegration 
              initialGroups={customGroups}
              onGroupsChange={handleCustomGroupsChange}
              showDebugger={true}
            />
            
            {/* Main Grid */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <MainGrid height="100%" />
            </div>
          </div>
          
          {/* Column Chooser - takes up less space */}
          <div style={{ 
            flex: '1', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <ColumnChooser 
              onSelectedColumnsChange={handleSelectedColumnsChange} 
            />
          </div>
        </div>
      </ColumnProvider>
    </div>
  );
};

export default App;