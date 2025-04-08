import React, { useState, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ExtendedColDef, ColumnGroup, OperationType, ColumnGroupAction } from './types';
import ColumnChooser from './components/ColumnChooser';
import './App.css';

// Generate a large number of columns for testing performance
const generateColumns = (count: number): ExtendedColDef[] => {
  const columns: ExtendedColDef[] = [];
  
  // Define some groups for organizing columns
  const groups = [
    'Basic Info',
    'Contact',
    'Location',
    'Employment',
    'Financial',
    'Personal',
    'Technical',
    'Social',
    'Health',
    'Education'
  ];
  
  const subGroups = [
    'Details',
    'History',
    'Primary',
    'Secondary',
    'Optional',
    'Required',
    'References',
    'Statistics'
  ];
  
  for (let i = 0; i < count; i++) {
    // Determine if this column should be hidden initially (about 30% are hidden)
    const hide = Math.random() > 0.7;
    
    // Generate a group path for hierarchical organization
    // About 80% of columns have a group path
    let groupPath = undefined;
    
    if (Math.random() > 0.2) {
      const groupIndex = Math.floor(Math.random() * groups.length);
      const group = groups[groupIndex];
      
      // Add a subgroup for some columns (about 50%)
      if (Math.random() > 0.5) {
        const subGroupIndex = Math.floor(Math.random() * subGroups.length);
        const subGroup = subGroups[subGroupIndex];
        groupPath = [group, subGroup, `field_${i}`];
      } else {
        groupPath = [group, `field_${i}`];
      }
    }
    
    columns.push({
      field: `field_${i}`,
      headerName: `Column ${i}`,
      hide,
      groupPath
    });
  }
  
  return columns;
};

// Generate example data for the grid
const generateData = (rowCount: number, columnCount: number) => {
  const data = [];
  
  for (let i = 0; i < rowCount; i++) {
    const row: Record<string, any> = { id: i };
    
    for (let j = 0; j < columnCount; j++) {
      row[`field_${j}`] = `Value ${i}-${j}`;
    }
    
    data.push(row);
  }
  
  return data;
};

const App: React.FC = () => {
  // Initialize with a large number of columns for performance testing
  const [columnDefs, setColumnDefs] = useState<ExtendedColDef[]>(generateColumns(500));
  
  // Initialize with some example column groups
  const [columnGroups, setColumnGroups] = useState<ColumnGroup[]>([
    { 
      headerName: 'Primary Information', 
      children: ['field_0', 'field_1', 'field_2', 'field_3'] 
    },
    { 
      headerName: 'Secondary Information', 
      children: ['field_4', 'field_5', 'field_6'] 
    }
  ]);
  
  // Generate example data
  const [rowData] = useState(generateData(100, 500));
  
  // Handler for column changes
  const handleColumnChanged = useCallback((columns: ExtendedColDef[], operationType: OperationType) => {
    console.log(`Column operation: ${operationType}`);
    
    // Update the columnDefs with the new visibility status
    setColumnDefs(prevCols => {
      return prevCols.map(col => {
        const isSelected = columns.some(selCol => selCol.field === col.field);
        return {
          ...col,
          hide: !isSelected
        };
      });
    });
  }, []);
  
  // Handler for column group changes
  const handleColumnGroupChanged = useCallback((headerName: string, action: ColumnGroupAction, replacementName?: string) => {
    console.log(`Group operation: ${action} on ${headerName}`);
    
    if (action === 'REMOVE') {
      // Remove the group
      setColumnGroups(prev => prev.filter(g => g.headerName !== headerName));
    } else if (action === 'UPDATE') {
      // Update or add the group
      setColumnGroups(prev => {
        const groupIndex = prev.findIndex(g => g.headerName === headerName);
        
        if (groupIndex >= 0 && replacementName) {
          // Update existing group
          const newGroups = [...prev];
          newGroups[groupIndex] = {
            ...newGroups[groupIndex],
            headerName: replacementName
          };
          return newGroups;
        } else if (replacementName) {
          // Add new group
          return [...prev, { headerName: replacementName, children: [] }];
        }
        
        return prev;
      });
    }
  }, []);
  
  // Get visible columns for the grid
  const visibleColumns = columnDefs.filter(col => !col.hide);
  
  return (
    <div className="app">
      <header className="app-header">
        <h1>AG Grid Column Chooser</h1>
        <p>High-performance column management for AG Grid</p>
      </header>
      
      <main className="app-content">
        <div className="grid-container">
          <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
            <AgGridReact
              rowData={rowData}
              columnDefs={visibleColumns}
              defaultColDef={{
                flex: 1,
                minWidth: 100,
                sortable: true,
                filter: true,
                resizable: true
              }}
            />
          </div>
        </div>
        
        <div className="column-chooser-container">
          <h2>Column Management</h2>
          <div className="column-chooser-wrapper">
            <ColumnChooser
              columnDefs={columnDefs}
              columnGroups={columnGroups}
              onColumnChanged={handleColumnChanged}
              onColumnGroupChanged={handleColumnGroupChanged}
            />
          </div>
        </div>
      </main>
      
      <footer className="app-footer">
        <p>
          Optimized for performance with virtualized lists and efficient state management.
          Handles hundreds of columns with minimal lag.
        </p>
      </footer>
    </div>
  );
};

export default App;