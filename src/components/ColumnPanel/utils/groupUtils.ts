import { ExtendedColDef, ColumnGroup } from '../../types';
import { getAllColumnsInGroup } from './treeUtils';

/**
 * Utility functions for column group operations
 */
export const GroupUtils = {
  /**
   * Move columns from available to selected panel
   */
  moveToSelected: (
    columnIds: string[],
    availableColumns: ExtendedColDef[],
    selectedColumns: ExtendedColDef[],
    targetIndex?: number
  ): { newAvailable: ExtendedColDef[], newSelected: ExtendedColDef[] } => {
    if (columnIds.length === 0) {
      return { newAvailable: availableColumns, newSelected: selectedColumns };
    }
    
    // Find columns in available that are selected
    const columnsToMove = availableColumns.filter(col => 
      columnIds.includes(col.field)
    );
    
    if (columnsToMove.length === 0) {
      return { newAvailable: availableColumns, newSelected: selectedColumns };
    }
    
    // Remove columns from available
    const newAvailableColumns = availableColumns.filter(col => 
      !columnIds.includes(col.field)
    );
    
    // Update hide property for columns being moved
    const updatedColumnsToMove = columnsToMove.map(col => ({
      ...col,
      hide: false
    }));
    
    // Add columns to selected at the specified index or at the end
    let newSelectedColumns: ExtendedColDef[] = [...selectedColumns];
    
    if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= newSelectedColumns.length) {
      // Insert at specific index
      newSelectedColumns = [
        ...newSelectedColumns.slice(0, targetIndex),
        ...updatedColumnsToMove,
        ...newSelectedColumns.slice(targetIndex)
      ];
    } else {
      // Append to the end
      newSelectedColumns = [...newSelectedColumns, ...updatedColumnsToMove];
    }
    
    return {
      newAvailable: newAvailableColumns,
      newSelected: newSelectedColumns
    };
  },

  /**
   * Move an entire group from available to selected
   */
  moveGroupToSelected: (
    groupPath: string,
    availableColumns: ExtendedColDef[],
    selectedColumns: ExtendedColDef[],
    targetIndex?: number
  ): { newAvailable: ExtendedColDef[], newSelected: ExtendedColDef[] } => {
    // Get all columns in this group and subgroups
    const groupColumns = getAllColumnsInGroup(availableColumns, groupPath);
    
    // Extract column IDs
    const columnIds = groupColumns.map(col => col.field);
    
    if (columnIds.length === 0) {
      return { newAvailable: availableColumns, newSelected: selectedColumns };
    }
    
    // Use the standard moveToSelected function to move all columns
    return GroupUtils.moveToSelected(columnIds, availableColumns, selectedColumns, targetIndex);
  },

  /**
   * Move columns from selected to available
   */
  moveToAvailable: (
    columnIds: string[],
    availableColumns: ExtendedColDef[],
    selectedColumns: ExtendedColDef[],
    columnGroups: ColumnGroup[]
  ): { 
    newAvailable: ExtendedColDef[], 
    newSelected: ExtendedColDef[],
    updatedGroups: ColumnGroup[]
  } => {
    if (columnIds.length === 0) {
      return { 
        newAvailable: availableColumns, 
        newSelected: selectedColumns,
        updatedGroups: columnGroups
      };
    }
    
    // Find columns in selected that are selected
    const columnsToMove = selectedColumns.filter(col => 
      columnIds.includes(col.field)
    );
    
    if (columnsToMove.length === 0) {
      return { 
        newAvailable: availableColumns, 
        newSelected: selectedColumns,
        updatedGroups: columnGroups
      };
    }
    
    // Remove columns from selected
    const newSelectedColumns = selectedColumns.filter(col => 
      !columnIds.includes(col.field)
    );
    
    // Update hide property for columns being moved
    const updatedColumnsToMove = columnsToMove.map(col => ({
      ...col,
      hide: true
    }));
    
    // Add columns to available
    const newAvailableColumns = [...availableColumns, ...updatedColumnsToMove];
    
    // Remove columns from any groups they belong to
    const newColumnGroups = columnGroups.map(group => ({
      ...group,
      children: group.children.filter(field => !columnIds.includes(field))
    })).filter(group => group.children.length > 0); // Remove empty groups
    
    return {
      newAvailable: newAvailableColumns,
      newSelected: newSelectedColumns,
      updatedGroups: newColumnGroups
    };
  },

  /**
   * Clear all selected columns
   */
  clearAll: (
    availableColumns: ExtendedColDef[],
    selectedColumns: ExtendedColDef[],
    columnGroups: ColumnGroup[]
  ): {
    newAvailable: ExtendedColDef[],
    newGroups: ColumnGroup[]
  } => {
    // Update hide property for all selected columns
    const updatedColumns = selectedColumns.map(col => ({
      ...col,
      hide: true
    }));
    
    // Move all selected columns to available
    const newAvailableColumns = [...availableColumns, ...updatedColumns];
    
    return {
      newAvailable: newAvailableColumns,
      newGroups: []
    };
  }
};

export default GroupUtils;