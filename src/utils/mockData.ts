import { ColumnDefinition } from '../types';

/**
 * Generate mock column definitions for testing
 */
export const generateMockColumnDefinitions = (): ColumnDefinition[] => {
  const columns: ColumnDefinition[] = [];
  
  // Generate 100 columns with guaranteed uniqueness
  for (let i = 1; i <= 100; i++) {
    columns.push({
      id: `column_${i}`,
      field: `column_${i}`,
      groupPath: [`Group ${Math.ceil(i / 10)}`, `Group ${Math.ceil(i / 10 * 2)}`, `Column ${i}`]
    });
  }
  
  return columns;
};

/**
 * Generate mock data for the grid
 */
export const generateMockData = (): any[] => {
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
};