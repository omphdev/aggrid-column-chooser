import React, { useState, useEffect } from 'react';
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
      groupPath: ['Basic Info', 'id'] 
    },
    { 
      headerName: 'Name', 
      field: 'name',
      groupPath: ['Basic Info', 'name'] 
    },
    { 
      headerName: 'Age', 
      field: 'age',
      groupPath: ['Personal Info', 'age'] 
    },
    { 
      headerName: 'Email', 
      field: 'email',
      groupPath: ['Contact Info', 'email'] 
    },
    { 
      headerName: 'Phone', 
      field: 'phone',
      hide: true, // This column will be in available columns
      groupPath: ['Contact Info', 'phone'] 
    },
    { 
      headerName: 'Address', 
      field: 'address',
      hide: true, // This column will be in available columns
      groupPath: ['Contact Info', 'Location', 'address'] 
    },
    { 
      headerName: 'City', 
      field: 'city',
      groupPath: ['Contact Info', 'Location', 'city'] 
    },
    { 
      headerName: 'State', 
      field: 'state',
      groupPath: ['Contact Info', 'Location', 'state'] 
    },
    { 
      headerName: 'Zip', 
      field: 'zip',
      hide: true, // This column will be in available columns
      groupPath: ['Contact Info', 'Location', 'zip'] 
    },
    { 
      headerName: 'Country', 
      field: 'country',
      hide: true, // This column will be in available columns
      groupPath: ['Contact Info', 'Location', 'country'] 
    },
    { 
      headerName: 'Salary', 
      field: 'salary',
      groupPath: ['Employment Info', 'salary'] 
    },
    { 
      headerName: 'Department', 
      field: 'department',
      groupPath: ['Employment Info', 'department'] 
    },
    { 
      headerName: 'Position', 
      field: 'position',
      hide: true, // This column will be in available columns
      groupPath: ['Employment Info', 'position'] 
    },
    { 
      headerName: 'Start Date', 
      field: 'startDate',
      hide: true, // This column will be in available columns
      groupPath: ['Employment Info', 'startDate'] 
    },
  ];

  // State for column definitions
  const [columnDefs, setColumnDefs] = useState<ExtendedColDef[]>(initialColumnDefs);

  // Initial column groups - these will be displayed in the selected panel
  const [columnGroups, setColumnGroups] = useState<ColumnGroup[]>([
    { headerName: 'Personal Information', children: ['id', 'name', 'age'], isExpanded: true },
    { headerName: 'Location Information', children: ['city', 'state'], isExpanded: true },
    { headerName: 'Employment Details', children: ['salary', 'department'], isExpanded: true }
  ]);

  // Effect to ensure initial groups have the correct children and are expanded
  useEffect(() => {
    // Update groups to only include visible columns
    const visibleColumnFields = columnDefs
      .filter(col => col.hide !== true)
      .map(col => col.field);
    
    const updatedGroups = columnGroups.map(group => ({
      ...group,
      children: group.children.filter(field => visibleColumnFields.includes(field)),
      isExpanded: true // Ensure groups are expanded
    })).filter(group => group.children.length > 0);
    
    setColumnGroups(updatedGroups);
  }, []);

  // Handle column changes
  const handleColumnChanged = (selectedColumns: ExtendedColDef[], operationType: OperationType) => {
    console.log('Column changed:', operationType, selectedColumns.map(col => col.field).join(', '));
    
    // Note: operationType might be one of our standard types like 'ADD', 'REMOVED', 'REORDERED'
    // We're letting the ToolGrid component handle the actual column ordering now
    
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
    } 
    else if (action === 'UPDATE') {
      // Find the existing group
      const existingGroupIndex = columnGroups.findIndex(group => group.headerName === headerName);
      
      if (existingGroupIndex !== -1) {
        // Update existing group
        if (replacementName && replacementName !== headerName) {
          // Rename the group
          setColumnGroups(prevGroups => {
            const newGroups = [...prevGroups];
            newGroups[existingGroupIndex] = {
              ...newGroups[existingGroupIndex],
              headerName: replacementName
            };
            return newGroups;
          });
        }
      } 
      else if (replacementName) {
        // Create a new group
        setColumnGroups(prevGroups => [
          ...prevGroups,
          { headerName: replacementName, children: [] }
        ]);
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
      <ToolGrid
        columnDefs={columnDefs}
        rowData={rowData}
        configPanelParams={{
          configPanel: {
            columnGroups: [],
            onColumnChanged: handleColumnChanged,
            onColumnGroupChanged: handleColumnGroupChanged,
          }
        }}
      />
    </div>
  );
};

export default App;