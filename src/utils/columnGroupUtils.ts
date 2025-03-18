// src/utils/columnGroupUtils.ts
import { ColumnItem, CustomColumnGroup } from '../types';
import { findItemInTree, deepCloneColumnItem } from './treeUtils';

/**
 * Check if a column is part of a group in the original column structure
 * @param allPossibleColumns The original column structure
 * @param itemId The column ID to check
 * @returns True if the column belongs to a group
 */
export const isPartOfGroup = (allPossibleColumns: ColumnItem[], itemId: string): boolean => {
  for (const column of allPossibleColumns) {
    if (!column.field && column.children && column.children.length > 0) {
      // This is a group
      for (const child of column.children) {
        if (child.id === itemId) {
          return true;
        }
        
        if (child.children && child.children.length > 0) {
          const foundInSubgroup = isPartOfGroup([child], itemId);
          if (foundInSubgroup) return true;
        }
      }
    }
  }
  
  return false;
};

/**
 * Get the parent group of a column
 * @param allPossibleColumns The original column structure
 * @param itemId The column ID to check
 * @returns The parent group object or null if not found
 */
export const getParentGroup = (allPossibleColumns: ColumnItem[], itemId: string): ColumnItem | null => {
  for (const column of allPossibleColumns) {
    if (!column.field && column.children && column.children.length > 0) {
      // This is a group
      for (const child of column.children) {
        if (child.id === itemId) {
          return column;
        }
        
        if (child.children && child.children.length > 0) {
          const foundInSubgroup = getParentGroup([child], itemId);
          if (foundInSubgroup) return foundInSubgroup;
        }
      }
    }
  }
  
  return null;
};

/**
 * Find or create a group in the column structure
 * @param columns The current column structure
 * @param groupId The ID of the group to find or create
 * @param groupName The name of the group (used when creating)
 * @returns The existing or newly created group
 */
export const findOrCreateGroup = (
  columns: ColumnItem[], 
  groupId: string, 
  groupName: string
): ColumnItem => {
  // Try to find the existing group
  const existingGroup = columns.find(col => col.id === groupId);
  if (existingGroup) {
    return existingGroup;
  }
  
  // Create a new group if not found
  const newGroup: ColumnItem = {
    id: groupId,
    name: groupName,
    field: '', // Groups don't have fields
    expanded: true,
    children: []
  };
  
  return newGroup;
};

/**
 * Insert a column into the column structure with proper grouping
 * @param columns The current column structure
 * @param item The column to insert
 * @param allPossibleColumns The original column structure for reference
 * @param preserveGroups Whether to preserve group structure
 * @param targetId Optional target ID to insert next to
 * @param insertBefore Whether to insert before or after the target
 * @returns Updated column structure
 */
export const insertColumnWithGrouping = (
  columns: ColumnItem[],
  item: ColumnItem,
  allPossibleColumns: ColumnItem[],
  preserveGroups: boolean = true,
  targetId?: string,
  insertBefore: boolean = true
): ColumnItem[] => {
  // Create a new array to avoid mutation
  let result = [...columns];
  
  // If preserveGroups is false or the item is not part of a group,
  // add it directly to the root level
  if (!preserveGroups || !isPartOfGroup(allPossibleColumns, item.id)) {
    // Handle ungrouped column
    if (targetId) {
      // Try to find the target at root level
      const targetIndex = result.findIndex(col => col.id === targetId);
      if (targetIndex >= 0) {
        // Target found at root level
        const insertPos = insertBefore ? targetIndex : targetIndex + 1;
        result.splice(insertPos, 0, item);
        return result;
      }
      
      // Target might be in a group
      for (let i = 0; i < result.length; i++) {
        const group = result[i];
        if (group.children) {
          const targetInGroup = group.children.findIndex(child => child.id === targetId);
          if (targetInGroup >= 0) {
            // Target is in this group, but our item is ungrouped
            // Add at root level next to the group
            const insertPos = insertBefore ? i : i + 1;
            result.splice(insertPos, 0, item);
            return result;
          }
        }
      }
    }
    
    // If no target or target not found, add to the end
    result.push(item);
    return result;
  }
  
  // Handle grouped column
  // Find which group this column belongs to
  const parentGroup = getParentGroup(allPossibleColumns, item.id);
  
  if (parentGroup) {
    // Find or create the group in our column structure
    let targetGroup = result.find(col => col.id === parentGroup.id);
    
    if (!targetGroup) {
      // Create the group
      targetGroup = {
        id: parentGroup.id,
        name: parentGroup.name,
        field: '',
        expanded: true,
        children: []
      };
      result.push(targetGroup);
    }
    
    // Ensure children array exists
    if (!targetGroup.children) {
      targetGroup.children = [];
    }
    
    // If target specified and it's in this group, insert at that position
    if (targetId) {
      const targetInGroup = targetGroup.children.findIndex(child => child.id === targetId);
      if (targetInGroup >= 0) {
        const insertPos = insertBefore ? targetInGroup : targetInGroup + 1;
        targetGroup.children.splice(insertPos, 0, item);
        return result;
      }
    }
    
    // Default: add to the end of the group
    targetGroup.children.push(item);
    return result;
  }
  
  // Fallback: if no parent group found, add to root level
  result.push(item);
  return result;
};

/**
 * Create custom column groups from the provided structure
 */
export const applyCustomGroups = (
  availableColumns: ColumnItem[],
  customGroups: CustomColumnGroup[]
): ColumnItem[] => {
  if (!customGroups || customGroups.length === 0) {
    return [];
  }

  // Create an array for the grouped columns
  const groupedColumns: ColumnItem[] = [];

  // Process each custom group
  customGroups.forEach(group => {
    // Create the group item
    const groupItem: ColumnItem = {
      id: group.id || `custom-group-${group.headerName.replace(/\s+/g, '-').toLowerCase()}`,
      name: group.headerName,
      field: '',
      expanded: true,
      children: []
    };

    // Find and clone each child column
    group.children.forEach(columnField => {
      // Search through all available columns to find this field
      for (const column of availableColumns) {
        const foundItem = findItemByField(column, columnField);
        if (foundItem) {
          // Clone the item to avoid reference issues
          const clonedItem = deepCloneColumnItem(foundItem);
          // Add to the group's children
          groupItem.children!.push(clonedItem);
          break;
        }
      }
    });

    // Only add the group if it has children
    if (groupItem.children && groupItem.children.length > 0) {
      groupedColumns.push(groupItem);
    }
  });

  return groupedColumns;
};

/**
 * Recursively find an item by its field name
 */
export const findItemByField = (item: ColumnItem, fieldName: string): ColumnItem | null => {
  // Check if this is the target item
  if (item.field === fieldName) {
    return item;
  }
  
  // Check children if any
  if (item.children && item.children.length > 0) {
    for (const child of item.children) {
      const found = findItemByField(child, fieldName);
      if (found) return found;
    }
  }
  
  return null;
};