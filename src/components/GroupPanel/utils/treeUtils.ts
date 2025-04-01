// src/components/GroupPanel/utils/treeUtils.ts
import { ColDef } from 'ag-grid-community';

/**
 * Organizes items into a tree structure based on groupPath
 * @param items Item definitions to organize
 * @returns Tree structure with nested groups and items
 */
export const organizeItemsIntoTree = (items: (ColDef & { groupPath?: string[] })[]) => {
  const tree: any = {};
  
  items.forEach(item => {
    const groupPath = item.groupPath || [];
    // Exclude the last element (field name) from the group path
    const groupPathWithoutField = groupPath.slice(0, -1);
    
    let current = tree;
    
    groupPathWithoutField.forEach(group => {
      if (!current[group]) {
        current[group] = {};
      }
      current = current[group];
    });
    
    if (!current.items) {
      current.items = [];
    }
    
    current.items.push(item);
  });
  
  return tree;
};

/**
 * Get all items in a group and its subgroups
 * @param items Available items
 * @param groupPath Group path string (dot separated)
 * @returns All items in the specified group and its subgroups
 */
export const getAllItemsInGroup = (items: (ColDef & { groupPath?: string[] })[], groupPath: string) => {
  const pathSegments = groupPath.split('.');
  
  // Extract all items that belong to this group or its subgroups
  return items.filter(item => {
    // No group path means it's not in a group
    if (!item.groupPath || item.groupPath.length === 0) return false;
    
    // Check if the item's group path starts with our target path segments
    for (let i = 0; i < pathSegments.length; i++) {
      if (i >= item.groupPath.length || item.groupPath[i] !== pathSegments[i]) {
        return false;
      }
    }
    
    return true;
  });
};

/**
 * Count items in a group and its subgroups
 * @param items Available items
 * @param groupPath Group path string (dot separated)
 * @returns Count of items in the specified group and its subgroups
 */
export const countItemsInGroup = (items: (ColDef & { groupPath?: string[] })[], groupPath: string) => {
  return getAllItemsInGroup(items, groupPath).length;
};

/**
 * Organizes items into a tree structure for the selected panel
 * @param items Items to organize
 * @returns Tree structure with groups and items
 */
export const organizeItemsForTreePanel = (items: (ColDef & { groupPath?: string[] })[]) => {
  const result: { 
    type: 'group' | 'item',
    path?: string,
    groupName?: string,
    level?: number,
    items?: (ColDef & { groupPath?: string[] })[],
    item?: ColDef & { groupPath?: string[] }
  }[] = [];
  
  // Organize items into groups by path
  const groupPaths = new Set<string>();
  const flattenedGroups: { 
    path: string, 
    level: number,
    segments: string[] 
  }[] = [];
  
  // Extract all unique group paths
  items.forEach(item => {
    if (item.groupPath && item.groupPath.length > 0) {
      let currentPath = '';
      item.groupPath.slice(0, -1).forEach((segment, index) => {
        const newPath = currentPath ? `${currentPath}.${segment}` : segment;
        if (!groupPaths.has(newPath)) {
          groupPaths.add(newPath);
          flattenedGroups.push({
            path: newPath,
            level: index,
            segments: newPath.split('.')
          });
        }
        currentPath = newPath;
      });
    }
  });
  
  // Sort groups by path to maintain hierarchy
  flattenedGroups.sort((a, b) => {
    // First sort by level (depth)
    if (a.level !== b.level) {
      return a.level - b.level;
    }
    
    // Then sort alphabetically within the same level
    return a.path.localeCompare(b.path);
  });
  
  // Add groups to result
  flattenedGroups.forEach(group => {
    result.push({
      type: 'group',
      path: group.path,
      groupName: group.segments[group.segments.length - 1],
      level: group.level,
      items: items.filter(item => {
        if (!item.groupPath || item.groupPath.length <= group.level) return false;
        
        // Check if the item's path up to this level matches the group path
        const itemPath = item.groupPath.slice(0, group.level + 1).join('.');
        return itemPath === group.path && item.groupPath[item.groupPath.length - 1] === item.field;
      })
    });
  });
  
  // Add individual items that don't belong to any group
  items.forEach(item => {
    if (!item.groupPath || item.groupPath.length === 0 || item.groupPath[item.groupPath.length - 1] !== item.field) {
      result.push({
        type: 'item',
        item
      });
    }
  });
  
  return result;
};