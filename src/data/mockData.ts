// src/data/mockData.ts
import { useMemo } from "react";
import { ColumnItem, ColumnDefinition } from "../types";
import { convertToTreeStructure } from "../utils/columnUtils";

/**
 * Mock column definitions with group path
 */
export const useMockColumnDefinitions = () => {
  return useMemo<ColumnDefinition[]>(() => {
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
  }, []);
};

/**
 * Convert column definitions to tree structure for the column chooser
 */
export const useAllPossibleColumns = () => {
  const columnDefinitions = useMockColumnDefinitions();
  return useMemo<ColumnItem[]>(() => 
    convertToTreeStructure(columnDefinitions)
  , [columnDefinitions]);
};

/**
 * Mock data for the main grid
 */
export const useMockData = () => {
  return useMemo(() => {
    // Generate 100 rows
    return Array.from({ length: 100 }, (_, rowIndex) => {
      const rowData: Record<string, any> = {};
      
      // Generate data for all 100 columns
      for (let i = 1; i <= 100; i++) {
        const fieldName = `column_${i}`;
        
        // Different data generation strategies based on column type
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
  }, []);
};