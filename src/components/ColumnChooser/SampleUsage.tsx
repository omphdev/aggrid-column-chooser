import React, { useState } from 'react';
import { 
  ToolGrid, 
  ExtendedColDef, 
  ColumnChangeEvent,
  ColumnGroup
} from './index';

const SampleUsage: React.FC = () => {
  // Generate 100 sequential columns
  const generateColumns = (): ExtendedColDef[] => {
    const columns: ExtendedColDef[] = [];
    
    for (let i = 1; i <= 100; i++) {
      // Assign columns to different groups based on ranges
      let groupPath: string[] = [];
      
      if (i <= 20) {
        groupPath = ['Group A', `Subgroup A${Math.ceil(i/5)}`];
      } else if (i <= 40) {
        groupPath = ['Group B', `Subgroup B${Math.ceil((i-20)/5)}`];
      } else if (i <= 60) {
        groupPath = ['Group C', `Subgroup C${Math.ceil((i-40)/5)}`];
      } else if (i <= 80) {
        groupPath = ['Group D', `Subgroup D${Math.ceil((i-60)/5)}`];
      } else {
        groupPath = ['Group E', `Subgroup E${Math.ceil((i-80)/5)}`];
      }
      
      columns.push({
        field: `field${i}`,
        headerName: `Column ${i}`,
        groupPath: groupPath
      });
    }
    
    return columns;
  };
  
  const initialColumnDefs = generateColumns();

  // Initial column groups
  const initialColumnGroups: ColumnGroup[] = [
    {
      headerName: 'Essential Columns',
      children: ['field1', 'field2', 'field3', 'field4', 'field5']
    },
    {
      headerName: 'Financial Columns',
      children: ['field21', 'field22', 'field23', 'field24', 'field25']
    },
    {
      headerName: 'User Information',
      children: ['field41', 'field42', 'field43', 'field44', 'field45']
    },
    {
      headerName: 'Statistics',
      children: ['field61', 'field62', 'field63', 'field64', 'field65']
    },
    {
      headerName: 'Additional Information',
      children: ['field81', 'field82', 'field83', 'field84', 'field85']
    }
  ];

  // Generate sample row data
  const generateRowData = (rowCount: number) => {
    const rows = [];
    
    for (let i = 1; i <= rowCount; i++) {
      const row: Record<string, any> = { id: i };
      
      // Add all fields to the row
      for (let j = 1; j <= 100; j++) {
        row[`field${j}`] = `Field ${j}`;
      }
      
      rows.push(row);
    }
    
    return rows;
  };

  const rowData = generateRowData(5);

  // State for column defs and groups
  const [columnDefs, setColumnDefs] = useState<ExtendedColDef[]>(initialColumnDefs);
  const [columnGroups, setColumnGroups] = useState<ColumnGroup[]>(initialColumnGroups);

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