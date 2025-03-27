import React, { useState } from 'react';
import { 
  ToolGrid, 
  ExtendedColDef, 
  ColumnChangeEvent,
  ColumnGroup
} from './index';

const SampleUsage: React.FC = () => {
  // Sample data
  const initialColumnDefs: ExtendedColDef[] = [
    { 
      field: 'id', 
      headerName: 'ID', 
      groupPath: ['System'] 
    },
    { 
      field: 'firstName', 
      headerName: 'First Name', 
      groupPath: ['Personal', 'Name'] 
    },
    { 
      field: 'lastName', 
      headerName: 'Last Name', 
      groupPath: ['Personal', 'Name'] 
    },
    { 
      field: 'email', 
      headerName: 'Email', 
      groupPath: ['Contact'] 
    },
    { 
      field: 'phone', 
      headerName: 'Phone', 
      groupPath: ['Contact'] 
    },
    { 
      field: 'department', 
      headerName: 'Department', 
      groupPath: ['Work'] 
    },
    { 
      field: 'position', 
      headerName: 'Position', 
      groupPath: ['Work'] 
    },
    { 
      field: 'startDate', 
      headerName: 'Start Date', 
      groupPath: ['Work', 'Dates'] 
    },
    { 
      field: 'endDate', 
      headerName: 'End Date', 
      groupPath: ['Work', 'Dates'] 
    },
    { 
      field: 'salary', 
      headerName: 'Salary', 
      groupPath: ['Compensation'] 
    },
    { 
      field: 'bonus', 
      headerName: 'Bonus', 
      groupPath: ['Compensation'] 
    },
    { 
      field: 'address', 
      headerName: 'Address', 
      groupPath: ['Personal', 'Location'] 
    },
    { 
      field: 'city', 
      headerName: 'City', 
      groupPath: ['Personal', 'Location'] 
    },
    { 
      field: 'state', 
      headerName: 'State', 
      groupPath: ['Personal', 'Location'] 
    },
    { 
      field: 'zipCode', 
      headerName: 'Zip Code', 
      groupPath: ['Personal', 'Location'] 
    }
  ];

  // Sample row data
  const rowData = [
    { 
      id: 1, 
      firstName: 'John', 
      lastName: 'Doe', 
      email: 'john.doe@example.com', 
      phone: '555-123-4567', 
      department: 'Engineering', 
      position: 'Software Engineer', 
      startDate: '2022-01-15', 
      endDate: '', 
      salary: 85000, 
      bonus: 5000, 
      address: '123 Main St', 
      city: 'Austin', 
      state: 'TX', 
      zipCode: '78701' 
    },
    { 
      id: 2, 
      firstName: 'Jane', 
      lastName: 'Smith', 
      email: 'jane.smith@example.com', 
      phone: '555-987-6543', 
      department: 'Marketing', 
      position: 'Marketing Manager', 
      startDate: '2021-03-10', 
      endDate: '', 
      salary: 92000, 
      bonus: 7500, 
      address: '456 Oak Ave', 
      city: 'Seattle', 
      state: 'WA', 
      zipCode: '98101' 
    },
    { 
      id: 3, 
      firstName: 'Bob', 
      lastName: 'Johnson', 
      email: 'bob.johnson@example.com', 
      phone: '555-555-5555', 
      department: 'Sales', 
      position: 'Sales Representative', 
      startDate: '2022-06-01', 
      endDate: '', 
      salary: 78000, 
      bonus: 15000, 
      address: '789 Pine St', 
      city: 'New York', 
      state: 'NY', 
      zipCode: '10001' 
    }
  ];

  // State for column defs and groups
  const [columnDefs, setColumnDefs] = useState<ExtendedColDef[]>(initialColumnDefs);
  const [columnGroups, setColumnGroups] = useState<ColumnGroup[]>([]);

  // Handle column changes
  const handleColumnChanged = (event: ColumnChangeEvent) => {
    console.log('Column changed:', event);
    
    // You can update your state here if needed
    // This example just logs the event
  };

  // Handle column group changes
  const handleColumnGroupChanged = (
    headerName: string, 
    action: 'REMOVE' | 'UPDATE', 
    replaceName?: string
  ) => {
    console.log('Column group changed:', { headerName, action, replaceName });
    
    if (action === 'REMOVE') {
      setColumnGroups(prev => prev.filter(group => group.headerName !== headerName));
    } else if (action === 'UPDATE' && replaceName) {
      setColumnGroups(prev => 
        prev.map(group => 
          group.headerName === headerName
            ? { ...group, headerName: replaceName }
            : group
        )
      );
    }
  };

  return (
    <div className="sample-container">
      <h1>AG Grid Column Chooser Example</h1>
      <ToolGrid
        columnDefs={columnDefs}
        rowData={rowData}
        columnGroups={columnGroups}
        onColumnChanged={handleColumnChanged}
        onColumnGroupChanged={handleColumnGroupChanged}
      />
    </div>
  );
};

export default SampleUsage;