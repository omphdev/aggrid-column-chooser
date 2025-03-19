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
 * Helper function to find all leaf node IDs in a tree structure
 */
export const getLeafNodeIds = (items: ColumnItem[]): string[] => {
  const leafIds: string[] = [];
  
  const findLeafNodes = (item: ColumnItem) => {
    if (item.field && (!item.children || item.children.length === 0)) {
      leafIds.push(item.id);
    }
    
    if (item.children && item.children.length > 0) {
      item.children.forEach(findLeafNodes);
    }
  };
  
  items.forEach(findLeafNodes);
  return leafIds;
};

/**
 * Flattens a tree structure into a single list of leaf nodes
 */
export const flattenTree = (items: ColumnItem[]): ColumnItem[] => {
  let result: ColumnItem[] = [];
  
  const processItem = (item: ColumnItem) => {
    // Only add leaf nodes (items with field property)
    if (item.field && (!item.children || item.children.length === 0)) {
      result.push(item);
    }
    
    // Process children if any
    if (item.children && item.children.length > 0) {
      item.children.forEach(processItem);
    }
  };
  
  items.forEach(processItem);
  return result;
};

/**
 * Interface for items with parent info in flattened tree
 */
export interface FlatItem extends ColumnItem {
  parentId?: string;
  index: number;
}

/**
 * Flattens a tree structure into a list of items with parent information
 */
export const flattenTreeWithParentInfo = (items: ColumnItem[]): FlatItem[] => {
  const result: FlatItem[] = [];
  let index = 0;
  
  const processItem = (itemList: ColumnItem[], parentId?: string) => {
    for (const item of itemList) {
      // Add this item with parent info
      const flatItem: FlatItem = { ...item, parentId, index: index++ };
      result.push(flatItem);
      
      // Process children if any and if expanded
      if (item.children && item.children.length > 0 && item.expanded !== false) {
        processItem(item.children, item.id);
      }
    }
  };
  
  processItem(items);
  return result;
};

/**
 * Convert columns to AG Grid format
 */
export const convertToAgGridColumns = (selectedCols: ColumnItem[]): ColDef[] => {
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
  
  selectedCols.forEach(processItem);
  return result;
};