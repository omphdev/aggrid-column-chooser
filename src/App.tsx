import React, { useEffect } from 'react';
import { ColumnProvider, useColumnContext } from './contexts/ColumnContext';
import ColumnChooser from './components/ColumnChooser';
import MainGrid from './components/MainGrid';
import { initializeDragSilhouette, cleanupDragSilhouette } from './utils/dragUtils';
import { convertToTreeStructure } from './utils/columnUtils';
import './App.css';
import { ColumnDefinition } from './types';


// App content component (using context)
const AppContent: React.FC = () => {
  const { initialize } = useColumnContext();
  
  // Initialize on mount
  useEffect(() => {
    // Get sample data
    const columnDefinitions = generateMockColumnDefinitions();
    const mockData = generateMockData();
    
    // Convert column definitions to tree structure
    const allPossibleColumns = convertToTreeStructure(columnDefinitions);
    
    // Initialize the store with data
    initialize(allPossibleColumns, mockData);
    
    // Initialize drag and drop system
    initializeDragSilhouette();
    
    initializeDragSilhouette();
    
    console.log('Drag system initialized');
    
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
  }, [initialize]);
  
  return (
    <div className="app-layout">
      {/* Main Grid */}
      <div className="main-grid-container">
        <h3>Data Grid</h3>
        <MainGrid height="calc(100% - 40px)" />
      </div>
      
      {/* Column Chooser */}
      <div className="column-chooser-container">
        <ColumnChooser />
      </div>
    </div>
  );
};

// Main App component (provides context)
const App: React.FC = () => {
  return (
    <div className="app-container">
      <ColumnProvider>
        <AppContent />
      </ColumnProvider>
    </div>
  );
};

// Mock data utilities
function generateMockColumnDefinitions() {
  const columns: ColumnDefinition[] = [];
  
  // Generate 100 columns with guaranteed uniqueness
  for (let i = 1; i <= 100; i++) {
    columns.push({
      id: `column_${i}`,
      field: `column_${i}`,
      groupPath: [`Group ${Math.ceil(i / 10)}`, `Column ${i}`]
    });
  }
  
  return columns;
}

function generateMockData() {
  // Generate 100 rows
  return Array.from({ length: 100 }, (_, rowIndex) => {
    const rowData: Record<string, any> = {};
    
    // Generate data for all 100 columns
    for (let i = 1; i <= 100; i++) {
      const fieldName = `column_${i}`;
      
      // Different data types based on column
      switch (i % 4) {
        case 0: // Integer
          rowData[fieldName] = rowIndex * i;
          break;
        case 1: // Float
          rowData[fieldName] = (rowIndex * i) / 10;
          break;
        case 2: // String
          rowData[fieldName] = `Cell ${i}, Row ${rowIndex + 1}`;
          break;
        case 3: // Boolean
          rowData[fieldName] = rowIndex % 2 === 0;
          break;
      }
    }
    
    return rowData;
  });
}

export default App;