import React, { useState, useEffect } from 'react';
import Grid from './components/Grid';
import { ColumnItem, ColumnGroup } from './types';
import { generateMockColumnDefinitions, generateMockData } from './utils/mockData';
import './App.css';

// Import selection styles to ensure they're loaded
import './components/TreeView/SelectionStyles.css';

// Main App component as entry point for the application
const App: React.FC = () => {
  // State for columns, data, and selections
  const [columnDefs, setColumnDefs] = useState<any[]>([]);
  const [rowData, setRowData] = useState<any[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<ColumnItem[]>([]);
  const [columnGroups, setColumnGroups] = useState<ColumnGroup[]>([]);
  
  // Initialize data on mount
  useEffect(() => {
    // Get sample data
    const initialColumnDefs = generateMockColumnDefinitions().map(col => ({
      field: col.field,
      headerName: col.groupPath[col.groupPath.length - 1],
      sortable: true,
      filter: true
    }));
    
    const initialRowData = generateMockData();
    
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
    
    // Set state
    setColumnDefs(initialColumnDefs);
    setRowData(initialRowData);
    setColumnGroups(initialColumnGroups);
  }, []);
  
  // Handle column selection changes
  const handleSelectedColumnsChange = (columns: ColumnItem[]) => {
    setSelectedColumns(columns);
    console.log('Selected columns changed:', columns);
    
    // You could save selections to your backend/localStorage/etc. here
  };
  
  // Handle column group changes
  const handleColumnGroupsChange = (groups: ColumnGroup[]) => {
    setColumnGroups(groups);
    console.log('Column groups changed:', groups);
    
    // You could save group configurations to your backend/localStorage/etc. here
  };
  
  return (
    <div className="app-container">
      <h3>Column Chooser Demo</h3>
      
      <div className="app-layout">
        <Grid
          columnDefs={columnDefs}
          rowData={rowData}
          initialSelectedColumnIds={['column_1', 'column_2', 'column_3', 'column_11', 'column_12', 'column_13']}
          initialColumnGroups={columnGroups}
          onColumnChanged={handleSelectedColumnsChange}
          onColumnGroupsChanged={handleColumnGroupsChange}
          height="calc(100% - 40px)"
        />
      </div>
    </div>
  );
};

export default App;