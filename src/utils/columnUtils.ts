import { ColumnDefinition, ColumnItem } from '../types';
import { ColDef } from 'ag-grid-community';

/**
 * Converts a flat list of columns with groupPath information to a hierarchical tree structure
 */
export const convertToTreeStructure = (columns: ColumnDefinition[]): ColumnItem[] => {
  const rootItems: ColumnItem[] = [];
  const groupsMap: Record<string, ColumnItem> = {};
  
  // Process each column
  columns.forEach(column => {
    // For columns with no groupPath, add directly to root
    if (!column.groupPath || column.groupPath.length === 0) {
      rootItems.push({
        id: column.id,
        name: column.field,
        field: column.field,
        selected: false,
        expanded: true
      });
      return;
    }
    
    // Process groupPath to build the tree
    let currentPath = '';
    let parentGroup: ColumnItem | null = null;
    
    // Create or find each level of the group path
    for (let i = 0; i < column.groupPath.length - 1; i++) {
      const groupName = column.groupPath[i];
      const groupId = currentPath ? `${currentPath}/${groupName}` : groupName;
      currentPath = groupId;
      
      if (!groupsMap[groupId]) {
        // Create a new group
        const newGroup: ColumnItem = {
          id: groupId,
          name: groupName,
          field: '', // Groups don't have fields
          children: [],
          expanded: true,
          selected: false
        };
        
        // Add to parent or root
        if (parentGroup) {
          if (!parentGroup.children) {
            parentGroup.children = [];
          }
          parentGroup.children.push(newGroup);
        } else {
          rootItems.push(newGroup);
        }
        
        groupsMap[groupId] = newGroup;
      }
      
      // Update parent reference for next iteration
      parentGroup = groupsMap[groupId];
    }
    
    // Add the actual column as a leaf node
    const leafNode: ColumnItem = {
      id: column.id,
      name: column.groupPath[column.groupPath.length - 1],
      field: column.field,
      selected: false
    };
    
    // Add to parent group or root
    if (parentGroup) {
      if (!parentGroup.children) {
        parentGroup.children = [];
      }
      parentGroup.children.push(leafNode);
    } else {
      rootItems.push(leafNode);
    }
  });
  
  return rootItems;
};

/**
 * Converts a tree structure back to a flat list of columns with groupPath
 */
export const convertToFlatColumns = (treeItems: ColumnItem[]): ColumnDefinition[] => {
  const result: ColumnDefinition[] = [];
  
  const processItem = (item: ColumnItem, parentPath: string[] = []) => {
    const currentPath = [...parentPath, item.name];
    
    if (item.field) {
      // This is a leaf node
      result.push({
        id: item.id,
        field: item.field,
        groupPath: currentPath
      });
    }
    
    // Process children if any
    if (item.children && item.children.length > 0) {
      item.children.forEach(child => processItem(child, currentPath));
    }
  };
  
  treeItems.forEach(item => processItem(item));
  
  return result;
};

/**
 * Generate AG Grid column definitions from a tree of column items
 */
export function generateGridColumns(items: ColumnItem[]): ColDef[] {
  const result: ColDef[] = [];
  
  const processItem = (item: ColumnItem) => {
    if (item.field) {
      result.push({
        field: item.field,
        headerName: item.name,
        sortable: true,
        filter: true
      });
    }
    
    if (item.children && item.children.length > 0) {
      item.children.forEach(processItem);
    }
  };
  
  items.forEach(processItem);
  return result;
}

/**
 * Count only leaf nodes in a tree (items with fields)
 * This excludes group nodes from the count
 */
export function countLeafNodes(items: ColumnItem[]): number {
  let count = 0;
  
  const countLeaves = (itemList: ColumnItem[]) => {
    for (const item of itemList) {
      // Count only if it's a leaf node (has field but no children)
      if (item.field && (!item.children || item.children.length === 0)) {
        count++;
      }
      
      // Recursively count children
      if (item.children && item.children.length > 0) {
        countLeaves(item.children);
      }
    }
  };
  
  countLeaves(items);
  return count;
}

/**
 * Count selected leaf nodes in a tree
 */
export function countSelectedLeafNodes(items: ColumnItem[]): number {
  let count = 0;
  
  const countSelectedLeaves = (itemList: ColumnItem[]) => {
    for (const item of itemList) {
      // Count only if it's a selected leaf node
      if (item.field && (!item.children || item.children.length === 0) && item.selected) {
        count++;
      }
      
      // Recursively count children
      if (item.children && item.children.length > 0) {
        countSelectedLeaves(item.children);
      }
    }
  };
  
  countSelectedLeaves(items);
  return count;
}

/**
 * Filter out empty groups from a tree structure recursively
 * An empty group is one that has no children or all of its children are empty groups
 */
export function filterEmptyGroups(items: ColumnItem[]): ColumnItem[] {
  return items.reduce<ColumnItem[]>((filteredItems, item) => {
    // If it's a leaf node (has a field but no children), keep it
    if (item.field && (!item.children || item.children.length === 0)) {
      filteredItems.push({ ...item });
      return filteredItems;
    }
    
    // If it's a group with children, process its children
    if (item.children && item.children.length > 0) {
      const filteredChildren = filterEmptyGroups(item.children);
      
      // Only include this group if it has non-empty children after filtering
      if (filteredChildren.length > 0) {
        filteredItems.push({
          ...item,
          children: filteredChildren
        });
      }
    }
    
    return filteredItems;
  }, []);
}

/**
 * Find an item in a tree by ID
 */
export function findItemInTree(items: ColumnItem[], itemId: string): ColumnItem | null {
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
}

/**
 * Remove an item from a tree by ID
 */
export function removeItemFromTree(items: ColumnItem[], itemId: string): ColumnItem[] {
  // First filter out the item at this level
  const result = items.filter(item => item.id !== itemId);
  
  // Then process children recursively
  const processedResult = result.map(item => {
    if (item.children && item.children.length > 0) {
      return {
        ...item,
        children: removeItemFromTree(item.children, itemId)
      };
    }
    return item;
  });
  
  // Filter out empty groups
  return processedResult.filter(item => 
    !item.children || item.children.length > 0 || item.field
  );
}

/**
 * Deep clone a column item
 */
export function deepCloneItem(item: ColumnItem): ColumnItem {
  return {
    ...item,
    children: item.children ? item.children.map(deepCloneItem) : undefined,
    selected: false // Reset selection state when cloning
  };
}

/**
 * Update available columns by removing items that are in selected columns
 * This ensures that items don't appear in both panels
 */
export function removeSelectedFromAvailable(
  availableColumns: ColumnItem[],
  selectedColumnIds: string[]
): ColumnItem[] {
  // Create a set for faster lookups
  const selectedIdSet = new Set(selectedColumnIds);
  
  // Helper function to recursively filter out selected items
  const filterSelectedItems = (items: ColumnItem[]): ColumnItem[] => {
    return items.reduce<ColumnItem[]>((filteredItems, item) => {
      // If this item is in the selected set, skip it
      if (selectedIdSet.has(item.id) && item.field) {
        return filteredItems;
      }
      
      // If it's a group, process its children
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterSelectedItems(item.children);
        
        // Only include this group if it has non-empty children after filtering
        if (filteredChildren.length > 0) {
          filteredItems.push({
            ...item,
            children: filteredChildren
          });
        }
      } else {
        // It's a leaf node not in selected, include it
        filteredItems.push({ ...item });
      }
      
      return filteredItems;
    }, []);
  };
  
  return filterSelectedItems(availableColumns);
}

// Get all leaf node IDs from a tree of columns
export const getAllLeafIds = (items: ColumnItem[]): string[] => {
  const result: string[] = [];
  
  const collectIds = (itemList: ColumnItem[]) => {
    for (const item of itemList) {
      if (item.field) { // Only collect leaf nodes with fields
        result.push(item.id);
      }
      
      if (item.children && item.children.length > 0) {
        collectIds(item.children);
      }
    }
  };
  
  collectIds(items);
  return result;
};

// Get all parent node IDs from a tree of columns
export const getAllParentIds = (items: ColumnItem[]): string[] => {
  const result: string[] = [];
  
  const collectIds = (itemList: ColumnItem[]) => {
    for (const item of itemList) {
      if (item.children && item.children.length > 0) {
        result.push(item.id);
        collectIds(item.children);
      }
    }
  };
  
  collectIds(items);
  return result;
};

// Find a group containing specific columns
export const findGroupContainingColumns = (groups: ColumnItem[], columnIds: string[]): ColumnItem | null => {
  for (const group of groups) {
    if (group.children) {
      const groupColumnIds = getAllLeafIds(group.children);
      if (columnIds.every(id => groupColumnIds.includes(id))) {
        return group;
      }
    }
  }
  return null;
};

// Get the depth of a column in the tree
export const getColumnDepth = (items: ColumnItem[], targetId: string, currentDepth = 0): number => {
  for (const item of items) {
    if (item.id === targetId) {
      return currentDepth;
    }
    if (item.children && item.children.length > 0) {
      const depth = getColumnDepth(item.children, targetId, currentDepth + 1);
      if (depth !== -1) {
        return depth;
      }
    }
  }
  return -1;
};

// Get the path to a column in the tree
export const getColumnPath = (items: ColumnItem[], targetId: string, currentPath: string[] = []): string[] | null => {
  for (const item of items) {
    if (item.id === targetId) {
      return [...currentPath, item.id];
    }
    if (item.children && item.children.length > 0) {
      const path = getColumnPath(item.children, targetId, [...currentPath, item.id]);
      if (path) {
        return path;
      }
    }
  }
  return null;
};