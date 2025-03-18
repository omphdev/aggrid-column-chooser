// src/utils/treeUtils.ts
import { ColDef } from "ag-grid-community";
import { ColumnItem } from "../types";

/**
 * Toggle expand state of a tree item
 * @param treeData Tree structure
 * @param itemId ID of the item to toggle
 * @returns Updated tree with toggled expand state
 */
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

/**
 * Find an item in a tree structure by ID
 * @param items Tree structure
 * @param itemId ID to find
 * @returns Found item or null
 */
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

/**
 * Remove an item from a tree structure
 * @param items Tree structure
 * @param itemId ID to remove
 * @returns Updated tree with item removed
 */
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

/**
 * Deep clone a column item and its children
 * @param item Item to clone
 * @returns Deep clone of the item
 */
export const deepCloneColumnItem = (item: ColumnItem): ColumnItem => {
  return {
    ...item,
    children: item.children ? item.children.map(deepCloneColumnItem) : undefined
  };
};

/**
 * Get all selected items from a tree
 * @param items Tree structure
 * @returns Array of IDs of selected items
 */
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

/**
 * Get all item IDs with their index in visible order
 * @param items Tree structure
 * @returns Array of items with index
 */
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

/**
 * Count the number of selected items in a tree
 * @param items Tree structure
 * @returns Count of selected items
 */
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