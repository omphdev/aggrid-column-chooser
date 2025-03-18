// src/utils/columnUtils.ts
import { ColumnDefinition, ColumnItem, CustomColumnGroup } from '../types';
import { ColDef, ColGroupDef } from 'ag-grid-community';

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
 * Convert tree items to AG Grid column definitions with proper support for column groups
 * @param columns Column tree structure
 * @returns AG Grid column definitions with hierarchical groups
 */
export const convertToAgGridColumns = (columns: ColumnItem[]): (ColDef | ColGroupDef)[] => {
  const processItem = (item: ColumnItem): ColDef | ColGroupDef | null => {
    // If it's a leaf node with a field
    if (item.field && (!item.children || item.children.length === 0)) {
      return {
        field: item.field,
        headerName: item.name,
        sortable: true,
        filter: true
      } as ColDef;
    }
    
    // If it's a group with children
    if (!item.field && item.children && item.children.length > 0) {
      const childColumns: (ColDef | ColGroupDef)[] = [];
      
      // Process all children
      item.children.forEach(child => {
        const processed = processItem(child);
        if (processed) {
          childColumns.push(processed);
        }
      });
      
      // Only create the group if it has children
      if (childColumns.length > 0) {
        return {
          headerName: item.name,
          children: childColumns,
          marryChildren: true // Keep children together when column move happens
        } as ColGroupDef;
      }
    }
    
    return null;
  };
  
  // Process all top-level items
  const result: (ColDef | ColGroupDef)[] = [];
  columns.forEach(item => {
    const processed = processItem(item);
    if (processed) {
      result.push(processed);
    }
  });
  
  return result;
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

/**
 * Flattens a tree structure into a list of items with parent information
 * @param items Tree structure
 * @returns Flattened list with parent info
 */
export interface FlatItem extends ColumnItem {
  parentId?: string;
}

export const flattenTreeWithParentInfo = (items: ColumnItem[]): FlatItem[] => {
  const result: FlatItem[] = [];
  
  const processItem = (item: ColumnItem, parentId?: string) => {
    // Add this item with parent info
    const flatItem: FlatItem = { ...item, parentId };
    result.push(flatItem);
    
    // Process children if any
    if (item.children && item.children.length > 0 && item.expanded !== false) {
      item.children.forEach(child => processItem(child, item.id));
    }
  };
  
  items.forEach(item => processItem(item));
  return result;
};

/**
 * Create a column item tree structure from custom groups definition
 * @param availableColumns All available columns
 * @param customGroups Custom groups definition
 * @returns Column tree structure with the specified groups
 */
export const createColumnTreeFromCustomGroups = (
  availableColumns: ColumnItem[],
  customGroups: CustomColumnGroup[]
): ColumnItem[] => {
  if (!customGroups || customGroups.length === 0) {
    return [];
  }
  
  // Create a map for fast lookup of columns by field
  const columnMap = new Map<string, ColumnItem>();
  
  // Populate the map
  const populateMap = (items: ColumnItem[]) => {
    items.forEach(item => {
      if (item.field) {
        columnMap.set(item.field, item);
      }
      
      if (item.children && item.children.length > 0) {
        populateMap(item.children);
      }
    });
  };
  
  populateMap(availableColumns);
  
  // Create the grouped structure
  const result: ColumnItem[] = [];
  
  customGroups.forEach(group => {
    const groupItem: ColumnItem = {
      id: group.id || `group-${group.headerName.replace(/\s+/g, '-').toLowerCase()}`,
      name: group.headerName,
      field: '', // Groups don't have fields
      expanded: true,
      children: []
    };
    
    // Add all the specified columns to this group
    group.children.forEach(fieldName => {
      const column = columnMap.get(fieldName);
      if (column) {
        // Deep clone to avoid reference issues
        const clonedColumn = JSON.parse(JSON.stringify(column));
        groupItem.children!.push(clonedColumn);
      }
    });
    
    // Only add the group if it has children
    if (groupItem.children && groupItem.children.length > 0) {
      result.push(groupItem);
    }
  });
  
  return result;
};

/**
 * Extract custom groups from a column tree structure
 * @param columns Column tree structure
 * @returns Custom groups definition
 */
export const extractCustomGroupsFromColumns = (columns: ColumnItem[]): CustomColumnGroup[] => {
  const customGroups: CustomColumnGroup[] = [];
  
  columns.forEach(item => {
    // Check if this is a group (no field, has children)
    if (!item.field && item.children && item.children.length > 0) {
      const childFields: string[] = [];
      
      // Extract field names from children
      const getFieldsFromChildren = (children: ColumnItem[]) => {
        children.forEach(child => {
          if (child.field) {
            childFields.push(child.field);
          }
          
          if (child.children && child.children.length > 0) {
            getFieldsFromChildren(child.children);
          }
        });
      };
      
      getFieldsFromChildren(item.children);
      
      // Add to custom groups if we found child fields
      if (childFields.length > 0) {
        customGroups.push({
          headerName: item.name,
          id: item.id,
          children: childFields
        });
      }
    }
  });
  
  return customGroups;
};

/**
 * Merge the existing column structure with custom groups
 * This preserves existing columns and adds/updates groups
 * @param existingColumns Current column structure
 * @param customGroups Custom groups to apply
 * @param allPossibleColumns Reference to all available columns
 * @returns Updated column structure
 */
export const mergeCustomGroupsIntoColumns = (
  existingColumns: ColumnItem[],
  customGroups: CustomColumnGroup[],
  allPossibleColumns: ColumnItem[]
): ColumnItem[] => {
  if (!customGroups || customGroups.length === 0) {
    return existingColumns;
  }
  
  // Create a map for fast lookup of columns by field
  const columnMap = new Map<string, ColumnItem>();
  
  // Populate the map with all possible columns
  const populateMap = (items: ColumnItem[]) => {
    items.forEach(item => {
      if (item.field) {
        columnMap.set(item.field, item);
      }
      
      if (item.children && item.children.length > 0) {
        populateMap(item.children);
      }
    });
  };
  
  populateMap(allPossibleColumns);
  
  // Create a set of all fields in the custom groups
  const customGroupFields = new Set<string>();
  customGroups.forEach(group => {
    group.children.forEach(field => {
      customGroupFields.add(field);
    });
  });
  
  // Filter out columns that are now part of custom groups
  const nonGroupedColumns = existingColumns.filter(column => {
    if (!column.field) return true; // Keep existing groups
    return !customGroupFields.has(column.field);
  });
  
  // Create the new groups
  const newGroups: ColumnItem[] = customGroups.map(group => {
    const groupItem: ColumnItem = {
      id: group.id || `group-${group.headerName.replace(/\s+/g, '-').toLowerCase()}`,
      name: group.headerName,
      field: '', // Groups don't have fields
      expanded: true,
      children: []
    };
    
    // Add all the specified columns to this group
    group.children.forEach(fieldName => {
      const column = columnMap.get(fieldName);
      if (column) {
        // Deep clone to avoid reference issues
        const clonedColumn = JSON.parse(JSON.stringify(column));
        groupItem.children!.push(clonedColumn);
      }
    });
    
    return groupItem;
  });
  
  // Only include groups that have children
  const validGroups = newGroups.filter(group => group.children && group.children.length > 0);
  
  // Combine non-grouped columns and new groups
  return [...nonGroupedColumns, ...validGroups];
};