// utils/treeUtils.ts
import { ColumnItem } from "../types";
import { ColDef } from "ag-grid-community";

// Helper to toggle expand state of tree items
export const toggleExpand = (treeData: ColumnItem[], itemId: string): ColumnItem[] => {
  return treeData.map(item => {
    if (item.id === itemId) {
      return { ...item, expanded: !item.expanded };
    }
    if (item.children) {
      return {
        ...item,
        children: toggleExpand(item.children, itemId)
      };
    }
    return item;
  });
};

// Helper functions for tree data manipulation
export const findItemInTree = (items: ColumnItem[], itemId: string): ColumnItem | null => {
  for (const item of items) {
    if (item.id === itemId) {
      return item;
    }
    
    if (item.children) {
      const found = findItemInTree(item.children, itemId);
      if (found) return found;
    }
  }
  
  return null;
};

export const removeItemFromTree = (items: ColumnItem[], itemId: string): ColumnItem[] => {
  const result = items.filter(item => item.id !== itemId).map(item => {
    if (item.children && item.children.length > 0) {
      return {
        ...item,
        children: removeItemFromTree(item.children, itemId)
      };
    }
    return item;
  });
  
  // Filter out any empty groups after removal
  return result.filter(item => !item.children || item.children.length > 0 || item.field);
};

export const deepCloneColumnItem = (item: ColumnItem): ColumnItem => {
  return {
    ...item,
    children: item.children ? item.children.map(deepCloneColumnItem) : undefined
  };
};

// Functions to get all selected items
export const getSelectedItems = (items: ColumnItem[]): string[] => {
  const selectedIds: string[] = [];
  
  const collectSelectedIds = (itemList: ColumnItem[]) => {
    for (const item of itemList) {
      if (item.selected) {
        selectedIds.push(item.id);
      }
      
      if (item.children && item.children.length > 0) {
        collectSelectedIds(item.children);
      }
    }
  };
  
  collectSelectedIds(items);
  return selectedIds;
};

// Helper to find all item IDs in tree
export const getAllItemIds = (items: ColumnItem[]): { id: string, index: number }[] => {
  const result: { id: string, index: number }[] = [];
  let index = 0;
  
  const collectIds = (itemList: ColumnItem[]) => {
    for (const item of itemList) {
      result.push({ id: item.id, index: index++ });
      
      if (item.children && item.children.length > 0 && item.expanded) {
        collectIds(item.children);
      }
    }
  };
  
  collectIds(items);
  return result;
};

// Count selected items
export const countSelectedItems = (items: ColumnItem[]): number => {
  let count = 0;
  
  const countSelected = (itemList: ColumnItem[]) => {
    for (const item of itemList) {
      if (item.selected) {
        count++;
      }
      
      if (item.children && item.children.length > 0) {
        countSelected(item.children);
      }
    }
  };
  
  countSelected(items);
  return count;
};

// Convert the flat list of selected column items to AG Grid column definitions
export const convertToAgGridColumns = (selectedCols: ColumnItem[]): ColDef[] => {
  const flattenColumns = (columns: ColumnItem[]): ColDef[] => {
    return columns.reduce<ColDef[]>((acc, column) => {
      if (column.children && column.children.length > 0) {
        return [...acc, ...flattenColumns(column.children)];
      }
      
      if (column.field) {
        return [...acc, {
          field: column.field,
          headerName: column.name,
          sortable: true,
          filter: true
        }];
      }
      
      return acc;
    }, []);
  };

  return flattenColumns(selectedCols);
};