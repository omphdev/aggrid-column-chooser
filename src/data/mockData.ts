// src/data/mockData.ts
import { useMemo } from "react";
import { ColumnItem, ColumnDefinition } from "../types";
import { convertToTreeStructure } from "../utils/columnUtils";

/**
 * Mock column definitions with group path
 */
export const useMockColumnDefinitions = () => {
  return useMemo<ColumnDefinition[]>(() => [
    { id: 'id', field: 'id', groupPath: ['Basic Information', 'ID'] },
    { id: 'name', field: 'name', groupPath: ['Basic Information', 'Name'] },
    { id: 'email', field: 'email', groupPath: ['Basic Information', 'Email'] },
    { id: 'street', field: 'street', groupPath: ['Address', 'Street'] },
    { id: 'city', field: 'city', groupPath: ['Address', 'City'] },
    { id: 'state', field: 'state', groupPath: ['Address', 'State'] },
    { id: 'zip', field: 'zip', groupPath: ['Address', 'Zip Code'] },
    { id: 'sales', field: 'sales', groupPath: ['Metrics', 'Sales'] },
    { id: 'profit', field: 'profit', groupPath: ['Metrics', 'Profit'] },
    { id: 'cost', field: 'cost', groupPath: ['Metrics', 'Cost'] },
  ], []);
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
    return Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Person ${i + 1}`,
      email: `person${i + 1}@example.com`,
      street: `${100 + i} Main St`,
      city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][i % 5],
      state: ['NY', 'CA', 'IL', 'TX', 'AZ'][i % 5],
      zip: `${10000 + i * 100}`,
      sales: Math.round(Math.random() * 10000),
      profit: Math.round(Math.random() * 5000),
      cost: Math.round(Math.random() * 3000)
    }));
  }, []);
};