import React, { useState } from 'react';
import { ToolGrid } from './components';
import { ExtendedColDef, ColumnGroup, OperationType, ColumnGroupAction } from './components/types';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import './components/styles.css';

const App: React.FC = () => {
  // Sample column definitions with groupPath and some hidden columns
  const initialColumnDefs: ExtendedColDef[] = [
    { 
      headerName: 'ID', 
      field: 'id', 
      groupPath: ['Basic Info'] 
    },
    { 
      headerName: 'Name', 
      field: 'name',
      groupPath: ['Basic Info'] 
    },
    { 
      headerName: 'Age', 
      field: 'age',
      groupPath: ['Personal Info'] 
    },
    { 
      headerName: 'Email', 
      field: 'email',
      groupPath: ['Contact Info'] 
    },
    { 
      headerName: 'Phone', 
      field: 'phone',
      hide: true, // This column will be in available columns
      groupPath: ['Contact Info'] 
    },
    { 
      headerName: 'Address', 
      field: 'address',
      hide: true, // This column will be in available columns
      groupPath: ['Contact Info', 'Location'] 
    },
    { 
      headerName: 'City', 
      field: 'city',
      groupPath: ['Contact Info', 'Location'] 
    },
    { 
      headerName: 'State', 
      field: 'state',
      groupPath: ['Contact Info', 'Location'] 
    },
    { 
      headerName: 'Zip', 
      field: 'zip',
      hide: true, // This column will be in available columns
      groupPath: ['Contact Info', 'Location'] 
    },
    { 
      headerName: 'Country', 
      field: 'country',
      hide: true, // This column will be in available columns
      groupPath: ['Contact Info', 'Location'] 
    },
    { 
      headerName: 'Salary', 
      field: 'salary',
      groupPath: ['Employment Info'] 
    },
    { 
      headerName: 'Department', 
      field: 'department',
      groupPath: ['Employment Info'] 
    },
    { 
      headerName: 'Position', 
      field: 'position',
      hide: true, // This column will be in available columns
      groupPath: ['Employment Info'] 
    },
    { 
      headerName: 'Start Date', 
      field: 'startDate',
      hide: true, // This column will be in available columns
      groupPath: ['Employment Info'] 
    },
  ];

  // State for column definitions
  const [columnDefs, setColumnDefs] = useState<ExtendedColDef[]>(initialColumnDefs);

  // Initial column groups
  const [columnGroups, setColumnGroups] = useState<ColumnGroup[]>([
    { headerName: 'Personal Information', children: ['id', 'name', 'age'] },
    { headerName: 'Contact Details', children: ['email', 'city', 'state'] },
  ]);

  // Handle column changes
  const handleColumnChanged = (selectedColumns: ExtendedColDef[], operationType: OperationType) => {
    console.log('Column changed:', operationType, selectedColumns.map(col => col.field).join(', '));
    
    // For all operations, we only need to update the hide property in our state
    const updatedColumnDefs = columnDefs.map(col => {
      // Check if this column is in the selectedColumns array
      const isSelected = selectedColumns.some(selCol => selCol.field === col.field);
      
      // Set hide property based on whether it's in selectedColumns
      return {
        ...col,
        hide: !isSelected
      };
    });
    
    setColumnDefs(updatedColumnDefs);
  };

  // Handle column group changes
  const handleColumnGroupChanged = (headerName: string, action: ColumnGroupAction, replacementName?: string) => {
    console.log('Column group changed:', action, headerName, replacementName);

    if (action === 'REMOVE') {
      // Remove the group
      setColumnGroups(prevGroups => prevGroups.filter(group => group.headerName !== headerName));
    } else if (action === 'UPDATE') {
      // If this is a rename operation (replacement name provided and different from current)
      if (replacementName && replacementName !== headerName) {
        setColumnGroups(prevGroups => {
          const groupIndex = prevGroups.findIndex(group => group.headerName === headerName);
          
          if (groupIndex !== -1) {
            const newGroups = [...prevGroups];
            newGroups[groupIndex] = {
              ...newGroups[groupIndex],
              headerName: replacementName,
            };
            return newGroups;
          }
          
          return prevGroups;
        });
      } 
      // If this is an update to group members (columns changed)
      else {
        // The actual column changes are managed inside the ColumnPanel component
        // We just need to refresh our state to trigger a re-render
        setColumnGroups(prevGroups => [...prevGroups]);
      }
    }
  };

  // Sample data for the grid
  const rowData = [
    { id: 1, name: 'John Doe', age: 30, email: 'john@example.com', phone: '123-456-7890', address: '123 Main St', city: 'New York', state: 'NY', zip: '10001', country: 'USA', salary: 100000, department: 'Engineering', position: 'Developer', startDate: '2020-01-01' },
    { id: 2, name: 'Jane Smith', age: 25, email: 'jane@example.com', phone: '098-765-4321', address: '456 Park Ave', city: 'Los Angeles', state: 'CA', zip: '90001', country: 'USA', salary: 110000, department: 'Marketing', position: 'Manager', startDate: '2019-03-15' },
    { id: 3, name: 'Bob Johnson', age: 35, email: 'bob@example.com', phone: '555-123-4567', address: '789 Oak St', city: 'Chicago', state: 'IL', zip: '60601', country: 'USA', salary: 95000, department: 'Sales', position: 'Representative', startDate: '2021-06-10' },
    { id: 4, name: 'Alice Williams', age: 28, email: 'alice@example.com', phone: '555-987-6543', address: '321 Pine St', city: 'Boston', state: 'MA', zip: '02108', country: 'USA', salary: 105000, department: 'Engineering', position: 'Developer', startDate: '2020-04-20' },
    { id: 5, name: 'Charlie Brown', age: 40, email: 'charlie@example.com', phone: '555-567-8901', address: '654 Maple St', city: 'San Francisco', state: 'CA', zip: '94102', country: 'USA', salary: 120000, department: 'Product', position: 'Manager', startDate: '2018-09-05' },
  ];

  return (
    <div className="app-container">
      <h1>AG Grid Column Chooser Example</h1>
      <ToolGrid
        columnDefs={columnDefs}
        rowData={rowData}
        configPanelParams={{
          configPanel: {
            columnGroups: columnGroups,
            onColumnChanged: handleColumnChanged,
            onColumnGroupChanged: handleColumnGroupChanged,
          }
        }}
      />
    </div>
  );
};

export default App;