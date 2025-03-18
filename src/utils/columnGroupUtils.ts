import { ColumnItem, CustomColumnGroup } from '../types';
import { findItemInTree, deepCloneColumnItem } from './treeUtils';

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
const findItemByField = (item: ColumnItem, fieldName: string): ColumnItem | null => {
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

/**
 * Convert AG-Grid column definitions to custom groups structure
 */
export const extractCustomGroupsFromColumns = (columns: ColumnItem[]): CustomColumnGroup[] => {
  const customGroups: CustomColumnGroup[] = [];
  
  columns.forEach(column => {
    if (!column.field && column.children && column.children.length > 0) {
      // This is a group
      const group: CustomColumnGroup = {
        headerName: column.name,
        id: column.id,
        children: []
      };
      
      // Extract child field names
      column.children.forEach(child => {
        if (child.field) {
          group.children.push(child.field);
        }
      });
      
      if (group.children.length > 0) {
        customGroups.push(group);
      }
    }
  });
  
  return customGroups;
};