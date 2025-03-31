import { ExtendedColDef, ColumnGroup } from '../../types';

/**
 * Organizes columns into a tree structure based on groupPath
 * @param columns Column definitions to organize
 * @returns Tree structure with nested groups and columns
 */
export const organizeColumnsIntoTree = (columns: ExtendedColDef[]) => {
  const tree: any = {};
  
  columns.forEach(col => {
    const groupPath = col.groupPath || [];
    
    let current = tree;
    
    groupPath.forEach(group => {
      if (!current[group]) {
        current[group] = {};
      }
      current = current[group];
    });
    
    if (!current.columns) {
      current.columns = [];
    }
    
    current.columns.push(col);
  });
  
  return tree;
};

/**
 * Get all columns in a group and its subgroups
 * @param columns Available columns
 * @param groupPath Group path string (dot separated)
 * @returns All columns in the specified group and its subgroups
 */
export const getAllColumnsInGroup = (columns: ExtendedColDef[], groupPath: string) => {
  const pathSegments = groupPath.split('.');
  
  // Extract all columns that belong to this group or its subgroups
  return columns.filter(col => {
    // No group path means it's not in a group
    if (!col.groupPath || col.groupPath.length === 0) return false;
    
    // Check if the column's group path starts with our target path segments
    for (let i = 0; i < pathSegments.length; i++) {
      if (i >= col.groupPath.length || col.groupPath[i] !== pathSegments[i]) {
        return false;
      }
    }
    
    return true;
  });
};

/**
 * Organizes selected columns by groups
 * @param selectedColumns Currently selected columns
 * @param columnGroups Column groups configuration
 * @returns Organized structure of groups and columns
 */
export const organizeSelectedColumnsByGroups = (
  selectedColumns: ExtendedColDef[], 
  columnGroups: ColumnGroup[]
) => {
  // Create a map of column field to column object for quick lookup
  const columnMap = new Map<string, ExtendedColDef>();
  selectedColumns.forEach(col => {
    columnMap.set(col.field, col);
  });
  
  // Get all column fields in the current order
  const orderedFields = selectedColumns.map(col => col.field);
  
  // Create a map for fast group lookup
  const groupMap = new Map<string, ColumnGroup>();
  columnGroups.forEach(group => {
    groupMap.set(group.headerName, group);
  });
  
  // Create an array to hold the organized structure
  // Each item can be a column or a group
  const organizedStructure: Array<{
    type: 'column' | 'group';
    headerName: string;
    columns?: ExtendedColDef[];
    field?: string;
    column?: ExtendedColDef;
  }> = [];
  
  // Keep track of processed columns to avoid duplicates
  const processedColumns = new Set<string>();
  
  // Process columns in their current order
  for (const field of orderedFields) {
    // Skip if already processed
    if (processedColumns.has(field)) continue;
    
    // Check if this column belongs to a group
    let belongsToGroup = false;
    
    for (const group of columnGroups) {
      if (group.children.includes(field)) {
        // Check if the group is already processed
        if (!organizedStructure.some(item => item.type === 'group' && item.headerName === group.headerName)) {
          // Add the entire group
          const groupColumns = group.children
            .filter(childField => orderedFields.includes(childField) && columnMap.has(childField))
            .map(childField => columnMap.get(childField)!)
            .filter(Boolean);
          
          if (groupColumns.length > 0) {
            organizedStructure.push({
              type: 'group',
              headerName: group.headerName,
              columns: groupColumns
            });
            
            // Mark all group columns as processed
            groupColumns.forEach(col => {
              processedColumns.add(col.field);
            });
          }
        }
        
        belongsToGroup = true;
        break;
      }
    }
    
    // If the column doesn't belong to any group, add it individually
    if (!belongsToGroup && !processedColumns.has(field) && columnMap.has(field)) {
      const column = columnMap.get(field)!;
      organizedStructure.push({
        type: 'column',
        field: field,
        headerName: column.headerName || field,
        column: column
      });
      
      processedColumns.add(field);
    }
  }
  
  return organizedStructure;
};