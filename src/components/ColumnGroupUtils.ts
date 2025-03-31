import { ExtendedColDef, ColumnGroup } from './types';

/**
 * Utility functions for working with column groups
 */
export const ColumnGroupUtils = {
  /**
   * Reorder columns based on column groups
   * @param columns The columns to reorder
   * @param groups The column groups to use for ordering
   * @returns Columns in the correct order based on groups
   */
  getOrderedColumnsFromGroups: (columns: ExtendedColDef[], groups: ColumnGroup[]): ExtendedColDef[] => {
    // Create a map for quick lookups
    const columnMap = new Map<string, ExtendedColDef>();
    columns.forEach(col => columnMap.set(col.field, col));
    
    // Create a set to track processed columns
    const processedColumns = new Set<string>();
    
    // Array to hold columns in the correct order
    const orderedColumns: ExtendedColDef[] = [];
    
    // Process each column in the current order
    const currentOrder = columns.map(col => col.field);
    
    for (const field of currentOrder) {
      // Skip if already processed
      if (processedColumns.has(field)) continue;
      
      // Check if this column belongs to a group
      let belongsToGroup = false;
      
      for (const group of groups) {
        if (group.children.includes(field)) {
          // If this is the first column from this group we're encountering,
          // process the entire group
          const isFirstColumnFromGroup = !group.children.some(
            childField => processedColumns.has(childField)
          );
          
          if (isFirstColumnFromGroup) {
            // Add all columns from the group in the group's order
            for (const childField of group.children) {
              if (columnMap.has(childField) && !processedColumns.has(childField)) {
                orderedColumns.push(columnMap.get(childField)!);
                processedColumns.add(childField);
              }
            }
          }
          
          belongsToGroup = true;
          break;
        }
      }
      
      // If the column doesn't belong to a group or its group was already processed, add it individually
      if (!belongsToGroup && !processedColumns.has(field) && columnMap.has(field)) {
        orderedColumns.push(columnMap.get(field)!);
        processedColumns.add(field);
      }
    }
    
    return orderedColumns;
  },
  
  /**
   * Update column groups when columns are reordered
   * @param groups Current column groups
   * @param columns New column order
   * @returns Updated column groups with preserved internal ordering
   */
  updateGroupsFromColumnOrder: (groups: ColumnGroup[], columns: ExtendedColDef[]): ColumnGroup[] => {
    // If there are no groups, nothing to update
    if (groups.length === 0) return groups;
    
    // Get the new column order
    const newOrder = columns.map(col => col.field);
    
    // Create a map to track the min index of each group's columns
    const groupMinIndexMap = new Map<string, number>();
    
    // Find the minimum index for each group's columns in the new order
    for (const group of groups) {
      let minIndex = Number.MAX_SAFE_INTEGER;
      let hasVisibleColumns = false;
      
      for (const field of group.children) {
        const index = newOrder.indexOf(field);
        if (index !== -1) {
          minIndex = Math.min(minIndex, index);
          hasVisibleColumns = true;
        }
      }
      
      // If the group has visible columns, store its position
      if (hasVisibleColumns) {
        groupMinIndexMap.set(group.headerName, minIndex);
      }
    }
    
    // Sort groups based on their first column's position
    const sortedGroups = [...groups].sort((a, b) => {
      const indexA = groupMinIndexMap.get(a.headerName) ?? Number.MAX_SAFE_INTEGER;
      const indexB = groupMinIndexMap.get(b.headerName) ?? Number.MAX_SAFE_INTEGER;
      return indexA - indexB;
    });
    
    return sortedGroups;
  },
  
  /**
   * Get a flat list of columns in the correct order, respecting column groups
   * @param columns All available columns
   * @param groups Column groups
   * @returns Ordered flat list of column fields
   */
  getFlatColumnOrder: (columns: ExtendedColDef[], groups: ColumnGroup[]): string[] => {
    const orderedColumns = ColumnGroupUtils.getOrderedColumnsFromGroups(columns, groups);
    return orderedColumns.map(col => col.field);
  },
  
  /**
   * Update column group membership when columns are moved
   * @param groups Current column groups
   * @param columnIds Columns to add or remove
   * @param targetGroupName Target group name (null to remove from all groups)
   * @param operation 'add' or 'remove'
   * @returns Updated column groups
   */
  updateGroupMembership: (
    groups: ColumnGroup[],
    columnIds: string[],
    targetGroupName: string | null,
    operation: 'add' | 'remove'
  ): ColumnGroup[] => {
    const updatedGroups = [...groups];
    
    if (operation === 'remove') {
      // Remove columns from all groups or a specific group
      return updatedGroups.map(group => {
        if (targetGroupName === null || group.headerName === targetGroupName) {
          return {
            ...group,
            children: group.children.filter(field => !columnIds.includes(field))
          };
        }
        return group;
      }).filter(group => group.children.length > 0); // Remove empty groups
    } 
    else if (operation === 'add' && targetGroupName) {
      // Add columns to the target group
      const groupIndex = updatedGroups.findIndex(g => g.headerName === targetGroupName);
      
      if (groupIndex !== -1) {
        // Update existing group
        updatedGroups[groupIndex] = {
          ...updatedGroups[groupIndex],
          children: Array.from(new Set([...updatedGroups[groupIndex].children, ...columnIds]))
        };
      } else {
        // Create new group
        updatedGroups.push({
          headerName: targetGroupName,
          children: [...columnIds]
        });
      }
    }
    
    return updatedGroups;
  },
  
  /**
   * Create a new column group
   * @param groups Current column groups
   * @param groupName Name of the new group
   * @param columnIds Columns to include in the group
   * @returns Updated column groups including the new group
   */
  createColumnGroup: (
    groups: ColumnGroup[],
    groupName: string,
    columnIds: string[]
  ): ColumnGroup[] => {
    // Check if a group with this name already exists
    const existingGroupIndex = groups.findIndex(g => g.headerName === groupName);
    
    if (existingGroupIndex !== -1) {
      // Update existing group
      const updatedGroups = [...groups];
      updatedGroups[existingGroupIndex] = {
        ...updatedGroups[existingGroupIndex],
        children: Array.from(new Set([...updatedGroups[existingGroupIndex].children, ...columnIds]))
      };
      return updatedGroups;
    } else {
      // Create new group
      return [...groups, { headerName: groupName, children: columnIds }];
    }
  },
  
  /**
   * Reorder a column group
   * @param columns Current columns
   * @param groups Current column groups
   * @param groupName Group to reorder
   * @param targetIndex Target index for the group
   * @returns Ordered columns with the group moved to the target position
   */
  reorderGroup: (
    columns: ExtendedColDef[],
    groups: ColumnGroup[],
    groupName: string,
    targetIndex: number
  ): ExtendedColDef[] => {
    // Find the group
    const group = groups.find(g => g.headerName === groupName);
    if (!group) return columns;
    
    // Create a map for quick lookups
    const columnMap = new Map<string, ExtendedColDef>();
    columns.forEach(col => columnMap.set(col.field, col));
    
    // Get group columns that exist in the current columns
    const groupColumns = group.children
      .filter(field => columnMap.has(field))
      .map(field => columnMap.get(field)!);
    
    if (groupColumns.length === 0) return columns;
    
    // Create a deep copy of columns
    const columnsCopy = [...columns];
    
    // Remove group columns from the array
    const remainingColumns = columnsCopy.filter(col => !group.children.includes(col.field));
    
    // Calculate the actual target index in the remaining columns
    const actualTargetIndex = Math.min(targetIndex, remainingColumns.length);
    
    // Insert the group columns at the target position
    const reorderedColumns = [
      ...remainingColumns.slice(0, actualTargetIndex),
      ...groupColumns,
      ...remainingColumns.slice(actualTargetIndex)
    ];
    
    return reorderedColumns;
  }
};

export default ColumnGroupUtils;