// src/components/ColumnChooser/SampleUsage.tsx
import React, { useState, useCallback } from 'react';
import { 
  ToolGrid, 
  ExtendedColDef, 
  ColumnChangeEvent,
  ColumnGroup
} from './index';

/**
 * Sample component demonstrating the usage of the ToolGrid component
 */
const SampleUsage: React.FC = () => {
  // Generate 100 sequential columns
  const generateColumns = useCallback((): ExtendedColDef[] => {
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
  }, []);
  
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
  const generateRowData = useCallback((rowCount: number) => {
    const rows: Record<string, any>[] = [];
    
    for (let i = 1; i <= rowCount; i++) {
      const row: Record<string, any> = { id: i };
      
      // Add all fields to the row
      for (let j = 1; j <= 100; j++) {
        // Add some variety to the data
        if (j % 5 === 0) {
          row[`field${j}`] = i * j;
        } else if (j % 3 === 0) {
          row[`field${j}`] = `Value ${i}-${j}`;
        } else {
          row[`field${j}`] = `Data ${String.fromCharCode(64 + (i % 26) + 1)}${j}`;
        }
      }
      
      rows.push(row);
    }
    
    return rows;
  }, []);

  const rowData = generateRowData(20);

  // State for column defs and groups
  const [columnDefs] = useState<ExtendedColDef[]>(initialColumnDefs);
  const [columnGroups, setColumnGroups] = useState<ColumnGroup[]>(initialColumnGroups);

  // Handle column changes
  const handleColumnChanged = useCallback((event: ColumnChangeEvent) => {
    console.log('Column changed:', event);
    
    // In a real application, you would update your state here
    // This example just logs the event
  }, []);

  // Handle column group changes
  const handleColumnGroupChanged = useCallback((
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
  }, []);

  return (
    <div className="sample-container">
      <h1>AG Grid Column Chooser Example</h1>
      <p>
        This example demonstrates a fully functional column chooser for AG Grid with:
      </p>
      <ul>
        <li>Drag-and-drop for moving columns between available and selected panels</li>
        <li>Tree view for available columns with groups and subgroups</li>
        <li>Column grouping in the selected panel</li>
        <li>Search functionality in both panels</li>
        <li>Multiple selection with Ctrl/Cmd+click and Shift+click</li>
        <li>Context menu for operations like creating groups</li>
      </ul>
      <p>
        Click the &ldquo;Show Column Chooser&rdquo; button to start managing columns.
      </p>
      
      <div style={{ marginTop: '20px' }}>
        <ToolGrid
          columnDefs={columnDefs}
          rowData={rowData}
          columnGroups={columnGroups}
          onColumnChanged={handleColumnChanged}
          onColumnGroupChanged={handleColumnGroupChanged}
          gridOptions={{
            pagination: true,
            paginationPageSize: 10,
            suppressRowClickSelection: true,
            rowSelection: 'multiple',
            defaultColDef: {
              resizable: true,
              sortable: true,
              filter: true
            }
          }}
        />
      </div>
    </div>
  );
};

export default SampleUsage;