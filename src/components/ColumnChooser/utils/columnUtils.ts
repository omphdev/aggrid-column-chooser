import { ExtendedColDef, ColumnGroup, ColumnTreeNode } from '../../../types';

/**
 * Organizes columns into a tree structure based on groupPath
 * @param columns Columns to organize
 * @param expandedGroups Set of expanded group paths
 * @returns Flattened tree structure with nodes that should be visible
 */
export function organizeColumnsIntoTree(
  columns: ExtendedColDef[], 
  expandedGroups: Set<string>
): ColumnTreeNode[] {
  // First build the tree structure
  const treeMap = new Map<string, {
    type: 'group';
    id: string;
    name: string;
    children: ColumnTreeNode[];
    level: number;
    parentPath?: string[];
  }>();
  
  // Organize columns by their group paths
  columns.forEach(column => {
    const groupPath = column.groupPath || [];
    
    if (groupPath.length === 0) {
      // This is a top-level column without a group
      return;
    }
    
    // Build the path for each level
    let currentPath = '';
    let parentPath: string[] = [];
    
    groupPath.slice(0, -1).forEach((segment, index) => {
      const prevPath = currentPath;
      currentPath = currentPath ? `${currentPath}.${segment}` : segment;
      
      // Create the group node if it doesn't exist
      if (!treeMap.has(currentPath)) {
        treeMap.set(currentPath, {
          type: 'group',
          id: currentPath,
          name: segment,
          children: [],
          level: index,
          parentPath: prevPath ? [prevPath] : undefined
        });
      }
      
      parentPath = [...parentPath, currentPath];
    });
  });
  
  // Now create the flat tree representation
  const result: ColumnTreeNode[] = [];
  
  // Add top-level columns without groups
  columns.filter(col => !col.groupPath || col.groupPath.length === 0)
    .forEach(col => {
      result.push({
        type: 'column',
        id: col.field,
        name: col.headerName || col.field,
        column: col,
        level: 0
      });
    });
  
  // Add top-level groups
  const topLevelGroups = Array.from(treeMap.values())
    .filter(group => !group.parentPath || group.parentPath.length === 0)
    .sort((a, b) => a.name.localeCompare(b.name));
  
  topLevelGroups.forEach(group => {
    result.push({
      type: 'group',
      id: group.id,
      name: group.name,
      level: group.level,
      children: []
    });
    
    // If group is expanded, add its children
    if (expandedGroups.has(group.id)) {
      addGroupChildren(group.id, expandedGroups, treeMap, columns, result);
    }
  });
  
  return result;
}

/**
 * Helper function to add children of a group to the result array
 */
function addGroupChildren(
  groupPath: string,
  expandedGroups: Set<string>,
  treeMap: Map<string, any>,
  columns: ExtendedColDef[],
  result: ColumnTreeNode[]
) {
  // Add direct child columns of this group
  columns.filter(col => {
    if (!col.groupPath || col.groupPath.length === 0) return false;
    
    const colPath = col.groupPath.slice(0, -1).join('.');
    return colPath === groupPath;
  }).forEach(col => {
    result.push({
      type: 'column',
      id: col.field,
      name: col.headerName || col.field,
      column: col,
      level: groupPath.split('.').length,
      parentPath: [groupPath]
    });
  });
  
  // Add child groups
  const childGroups = Array.from(treeMap.values())
    .filter(group => group.parentPath && group.parentPath.includes(groupPath))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  childGroups.forEach(group => {
    result.push({
      type: 'group',
      id: group.id,
      name: group.name,
      level: group.level,
      children: [],
      parentPath: group.parentPath
    });
    
    // If group is expanded, add its children
    if (expandedGroups.has(group.id)) {
      addGroupChildren(group.id, expandedGroups, treeMap, columns, result);
    }
  });
}

/**
 * Organizes selected columns by groups
 * @param columns Selected columns
 * @param columnGroups Column groups
 * @param expandedGroups Set of expanded group paths
 * @returns Flattened structure of organized columns
 */
export function organizeSelectedColumnsByGroups(
  columns: ExtendedColDef[],
  columnGroups: ColumnGroup[],
  expandedGroups: Set<string>
): ColumnTreeNode[] {
  const result: ColumnTreeNode[] = [];
  const processedColumns = new Set<string>();
  
  // First add the groups
  columnGroups.forEach(group => {
    // Get columns in this group
    const groupColumns = columns.filter(col => 
      group.children.includes(col.field)
    );
    
    if (groupColumns.length === 0) return;
    
    // Add the group
    result.push({
      type: 'group',
      id: group.headerName,
      name: group.headerName,
      level: 0,
      children: groupColumns.map(col => ({
        type: 'column' as const,
        id: col.field,
        name: col.headerName || col.field,
        column: col,
        level: 1,
        parentPath: [group.headerName]
      }))
    });
    
    // Mark these columns as processed
    groupColumns.forEach(col => processedColumns.add(col.field));
    
    // If group is expanded, add its children
    if (expandedGroups.has(group.headerName)) {
      groupColumns.forEach(col => {
        result.push({
          type: 'column',
          id: col.field,
          name: col.headerName || col.field,
          column: col,
          level: 1,
          parentPath: [group.headerName]
        });
      });
    }
  });
  
  // Then add any columns not in groups
  columns.forEach(col => {
    if (!processedColumns.has(col.field)) {
      result.push({
        type: 'column',
        id: col.field,
        name: col.headerName || col.field,
        column: col,
        level: 0
      });
    }
  });
  
  return result;
}

/**
 * Calculate drop index based on mouse position
 * @param mouseY Mouse Y position relative to list container
 * @param items The list items
 * @param draggedId ID of the item being dragged
 * @param draggedItems IDs of all items being dragged (for multi-selection)
 * @returns The calculated drop index
 */
export function calculateDropIndex(
  mouseY: number,
  items: ColumnTreeNode[],
  draggedId: string,
  draggedItems: string[]
): number {
  const ITEM_HEIGHT = 36; // Estimated height of each item
  
  // Calculate the index based on mouse position
  let index = Math.floor(mouseY / ITEM_HEIGHT);
  
  // Adjust for boundaries
  index = Math.max(0, Math.min(index, items.length));
  
  // If dragging multiple items, adjust the index
  if (draggedItems.includes(draggedId) && draggedItems.length > 1) {
    // Filter out all dragged items
    const filteredItems = items.filter(item => 
      item.type === 'column' && !draggedItems.includes(item.id)
    );
    
    // Find the nearest non-dragged item based on mouse position
    const nearestIndex = Math.min(index, filteredItems.length);
    
    // Convert back to original index
    if (nearestIndex < filteredItems.length) {
      const nearestItem = filteredItems[nearestIndex];
      index = items.findIndex(item => item.id === nearestItem.id);
    } else {
      index = items.length;
    }
  }
  
  return index;
}

/**
 * Count number of columns in a group
 * @param columns Columns to count
 * @param groupPath Group path to match
 * @returns Number of columns in the group
 */
export function countColumnsInGroup(columns: ExtendedColDef[], groupPath: string): number {
  return columns.filter(col => {
    if (!col.groupPath || col.groupPath.length === 0) return false;
    
    const colPath = col.groupPath.slice(0, -1).join('.');
    return colPath === groupPath;
  }).length;
}