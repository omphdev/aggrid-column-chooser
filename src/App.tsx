// src/App.tsx
import React, { useState, useCallback } from 'react';
import { ColumnDefinition } from './types';
import ColumnChooser from './components/ColumnChooser';
import MainGrid from './components/MainGrid';
import DragSilhouette from './components/DragDrop/DragSilhouette';
import { ColumnProvider } from './contexts/ColumnContext';

/**
 * Main application component
 */
const App: React.FC = () => {
  // State to store the currently selected columns
  const [selectedColumns, setSelectedColumns] = useState<ColumnDefinition[]>([]);
  
  // Handler for column selection changes
  const handleSelectedColumnsChange = useCallback((columns: ColumnDefinition[]) => {
    setSelectedColumns(columns);
    console.log('Selected columns updated:', columns);
  }, []);
  
  // Get sample data for the provider
  const { useAllPossibleColumns, useMockData } = require('./data/mockData');
  const allPossibleColumns = useAllPossibleColumns();
  const mockData = useMockData();

  return (
    <div style={{ 
      height: '600px', 
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
        onSelectedColumnsChange={handleSelectedColumnsChange}
      >
        <div style={{
          display: 'flex',
          gap: '20px',
          height: '600px',
          overflow: 'hidden'
        }}>
          {/* Main Grid - takes up more space */}
          <div style={{ 
            flex: '3', 
            display: 'flex', 
            flexDirection: 'column' 
          }}>
            <h3>Data Grid</h3>
            <MainGrid height="100%" />
          </div>
          
          {/* Column Chooser - takes up less space */}
          <div style={{ 
            flex: '1', 
            display: 'flex', 
            flexDirection: 'column' 
          }}>
            <ColumnChooser 
              onSelectedColumnsChange={handleSelectedColumnsChange} 
            />
          </div>
        </div>
      </ColumnProvider>
      
      {/* Debug info */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#999' }}>
          <h4>Selected Columns</h4>
          <pre>{JSON.stringify(selectedColumns, null, 2)}</pre>
        </div>
      )} */}
    </div>
  );
};

export default App;