// utils/columnConverter.ts
import { ColumnDefinition, ColumnItem } from '../types';

/**
 * Converts a flat list of columns with groupPath information to a hierarchical tree structure
 * @param columns Flat list of column definitions with groupPath
 * @returns Tree structure of columns for display in TreeView
 */
export const convertToTreeStructure = (columns: ColumnDefinition[]): ColumnItem[] => {
  const rootItems: ColumnItem[] = [];
  const groupsMap: Record<string, ColumnItem> = {};
  
  // Process each column
  columns.forEach(column => {
    // For columns with no groupPath or empty groupPath, add directly to root
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
      name: column.groupPath[column.groupPath.length - 1], // Use the last part of the path as name
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
 * @param treeItems Tree structure of columns
 * @returns Flat list of column definitions with groupPath
 */
export const convertToFlatColumns = (treeItems: ColumnItem[]): ColumnDefinition[] => {
  const result: ColumnDefinition[] = [];
  
  const processItem = (item: ColumnItem, parentPath: string[] = []) => {
    const currentPath = [...parentPath, item.name];
    
    if (item.field) {
      // This is a leaf node, add it to the result
      result.push({
        id: item.id,
        field: item.field,
        hide: false, // Default to not hidden
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
 * @param items The tree structure
 * @returns Array of leaf node IDs
 */
export const getLeafNodeIds = (items: ColumnItem[]): string[] => {
  const leafIds: string[] = [];
  
  const findLeafNodes = (item: ColumnItem) => {
    if (item.field && !item.children) {
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
 * @param items Tree structure of columns
 * @returns Flattened list of leaf nodes
 */
export const flattenTree = (items: ColumnItem[]): ColumnItem[] => {
  let result: ColumnItem[] = [];
  
  const processItem = (item: ColumnItem) => {
    // Only add leaf nodes (items with a field property)
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