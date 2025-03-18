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
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '20px'
    }}>
      {/* Initialize the drag silhouette system */}
      <DragSilhouette />
      
      <div style={{ marginBottom: '20px' }}>
        <h2>AG Grid Column Chooser</h2>
        <p>Drag columns between panels to customize the grid below</p>
      </div>
      
      {/* Wrap everything that needs context in the provider */}
      <ColumnProvider 
        allPossibleColumns={allPossibleColumns}
        initialData={mockData}
        onSelectedColumnsChange={handleSelectedColumnsChange}
      >
        {/* Column Chooser */}
        <ColumnChooser 
          onSelectedColumnsChange={handleSelectedColumnsChange} 
        />
        
        {/* Main Grid */}
        <MainGrid height="400px" />
      </ColumnProvider>
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#999' }}>
          <h4>Selected Columns</h4>
          <pre>{JSON.stringify(selectedColumns, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default App;