import { useState, useEffect } from 'react';
import { ExtendedColDef, OperationType, ColumnGroup } from '../../types';

export interface UseSelectedColumnsProps {
  columnDefs: ExtendedColDef[];
  isReorderingRef: React.MutableRefObject<boolean>;
  lastReorderTimeRef: React.MutableRefObject<number>;
  onColumnChanged: (selectedColumns: ExtendedColDef[], operationType: OperationType) => void;
}

export function useSelectedColumns({
  columnDefs,
  isReorderingRef,
  lastReorderTimeRef,
  onColumnChanged
}: UseSelectedColumnsProps) {
  // State for selected columns
  const [selectedColumns, setSelectedColumns] = useState<ExtendedColDef[]>([]);

  // Initialize selected columns (columns with hide: false or undefined)
  useEffect(() => {
    // Don't update if we're in the middle of a reordering operation
    if (isReorderingRef.current) return;
    
    setSelectedColumns(columnDefs.filter(col => col.hide !== true));
  }, [columnDefs, isReorderingRef]);

  // Function to reorder a column within the selected panel
  const reorderColumn = (columnId: string, targetIndex: number, selectedItems: string[]) => {
    // If we're dragging multiple columns, we need to handle them all
    const columnsToMove = selectedItems.includes(columnId) 
      ? selectedItems 
      : [columnId];
    
    // Prevent multiple rapid reordering operations
    const now = Date.now();
    if (now - lastReorderTimeRef.current < 200) {
      console.log('Ignoring rapid reordering request');
      return;
    }
    
    // Update the timestamp
    lastReorderTimeRef.current = now;
    
    // Find indices of columns to move
    const columnIndices = columnsToMove
      .map(id => selectedColumns.findIndex(col => col.field === id))
      .filter(index => index !== -1)
      .sort((a, b) => a - b); // Sort in ascending order
    
    if (columnIndices.length === 0 || targetIndex < 0) return;
    
    console.log(`Reordering columns [${columnsToMove.join(', ')}] to index ${targetIndex}`);
    
    // Mark that we are reordering
    isReorderingRef.current = true;
    
    // Create a deep copy to avoid mutation issues
    const columnsCopy = JSON.parse(JSON.stringify(selectedColumns));
    
    // Create an array of columns to move
    const movedColumns = columnIndices.map(index => columnsCopy[index]);
    
    // Remove columns from original array (in reverse order to maintain correct indices)
    for (let i = columnIndices.length - 1; i >= 0; i--) {
      columnsCopy.splice(columnIndices[i], 1);
    }
    
    // Adjust the target index based on how many items were removed before the target
    let adjustedTargetIndex = targetIndex;
    for (const index of columnIndices) {
      if (index < targetIndex) {
        adjustedTargetIndex--;
      }
    }
    
    // Make sure the target index is valid
    adjustedTargetIndex = Math.max(0, Math.min(adjustedTargetIndex, columnsCopy.length));
    
    console.log(`Adjusted target index: ${adjustedTargetIndex}`);
    
    // Insert all moved columns at the target position
    columnsCopy.splice(adjustedTargetIndex, 0, ...movedColumns);
    
    console.log('New column order:', columnsCopy.map(col => col.field).join(', '));
    
    // Update the state
    setSelectedColumns(columnsCopy);
    
    // Create deep copies of columns for the update
    const orderedColumns = columnsCopy.map(col => ({
      ...col,
      hide: false
    }));
    
    // Notify parent component about the reordering
    onColumnChanged(orderedColumns, 'REORDER_AT_INDEX');
    
    // Reset the reordering flag after a delay to allow state updates to complete
    setTimeout(() => {
      isReorderingRef.current = false;
    }, 100);
  };
  
  // Function to reorder a column within a group
  const reorderColumnInGroup = (
    groupName: string, 
    columnId: string, 
    targetIndex: number, 
    selectedItems: string[], 
    columnGroups: ColumnGroup[]
  ) => {
    // Find the group
    const groupIndex = columnGroups.findIndex(g => g.headerName === groupName);
    if (groupIndex === -1) return;
    
    const group = columnGroups[groupIndex];
    
    // If we're dragging multiple columns, handle them all
    const columnsToMove = selectedItems.includes(columnId) 
      ? selectedItems.filter(id => group.children.includes(id))
      : [columnId];
    
    if (columnsToMove.length === 0) return;
    
    console.log(`Reordering columns [${columnsToMove.join(', ')}] within group "${groupName}" to index ${targetIndex}`);
    
    // Create a new array with the updated order
    const currentChildren = [...group.children];
    
    // Find indices of columns to move
    const columnIndices = columnsToMove
      .map(id => currentChildren.indexOf(id))
      .filter(index => index !== -1)
      .sort((a, b) => a - b); // Sort in ascending order
    
    if (columnIndices.length === 0) return;
    
    // Create an array of columns to move
    const movedColumns = columnIndices.map(index => currentChildren[index]);
    
    // Remove columns from original array (in reverse order to maintain correct indices)
    for (let i = columnIndices.length - 1; i >= 0; i--) {
      currentChildren.splice(columnIndices[i], 1);
    }
    
    // Adjust the target index based on how many items were removed before the target
    let adjustedTargetIndex = targetIndex;
    for (const index of columnIndices) {
      if (index < targetIndex) {
        adjustedTargetIndex--;
      }
    }
    
    // Make sure the target index is valid
    adjustedTargetIndex = Math.max(0, Math.min(adjustedTargetIndex, currentChildren.length));
    
    // Insert all moved columns at the target position
    currentChildren.splice(adjustedTargetIndex, 0, ...movedColumns);
    
    // We also need to update the column order in the selected panel
    // First, get the current selected columns
    const currentSelected = [...selectedColumns];
    
    // Create a new array with columns in the correct order
    // We maintain the overall order but with the group's columns reordered
    const newSelectedOrder: ExtendedColDef[] = [];
    let groupColumnsAdded = false;
    
    // Go through the current selected columns
    for (let i = 0; i < currentSelected.length; i++) {
      const col = currentSelected[i];
      
      // If this column is part of the group, we'll handle it specially
      if (group.children.includes(col.field)) {
        // If we haven't added the group columns yet, add them in the new order
        if (!groupColumnsAdded) {
          // Add columns in the new order
          for (const fieldId of currentChildren) {
            const groupCol = currentSelected.find(c => c.field === fieldId);
            if (groupCol) {
              newSelectedOrder.push(groupCol);
            }
          }
          groupColumnsAdded = true;
        }
        // Skip this column as we've already handled it in the group
      } else {
        // This column is not part of the group, add it normally
        newSelectedOrder.push(col);
      }
    }
    
    // Mark that we are reordering
    isReorderingRef.current = true;
    
    // Update the selected columns with the new order
    setSelectedColumns(newSelectedOrder);
    
    // Create updated columns with hide property
    const updatedColumns = newSelectedOrder.map(col => ({
      ...col,
      hide: false
    }));
    
    // Notify parent component about the reordering
    onColumnChanged(updatedColumns, 'REORDER_AT_INDEX');
    
    // Return updated children for the group
    return { updatedGroupChildren: currentChildren, newSelectedColumns: newSelectedOrder };
  };

  // Function to reorder a group within the selected panel
  const reorderGroup = (groupName: string, targetIndex: number, columnGroups: ColumnGroup[]) => {
    // Find the group
    const group = columnGroups.find(g => g.headerName === groupName);
    
    if (!group) return;
    
    // Find all columns from the group that exist in the selected columns
    const groupColObjects = selectedColumns.filter(col => 
      group.children.includes(col.field)
    );
    
    if (groupColObjects.length === 0 || targetIndex < 0) return;
    
    // Mark that we are reordering
    isReorderingRef.current = true;
    
    // Create a deep copy of selected columns
    const columnsCopy = [...selectedColumns];
    
    // Remove all columns in the group from the copy
    const remainingColumns = columnsCopy.filter(col => 
      !group.children.includes(col.field)
    );
    
    // Make sure target index is within valid range
    const adjustedTargetIndex = Math.max(0, Math.min(targetIndex, remainingColumns.length));
    
    // Insert all group columns at the target position, maintaining their order within the group
    const orderedGroupColumns = group.children
      .map(field => groupColObjects.find(col => col.field === field))
      .filter(Boolean) as ExtendedColDef[];
    
    // Create the new order by inserting the group columns at the target position
    const newColumnOrder = [
      ...remainingColumns.slice(0, adjustedTargetIndex),
      ...orderedGroupColumns,
      ...remainingColumns.slice(adjustedTargetIndex)
    ];
    
    // Update the state
    setSelectedColumns(newColumnOrder);
    
    // Create deep copies of columns for the update
    const orderedColumns = newColumnOrder.map(col => ({
      ...col,
      hide: false
    }));
    
    // Notify parent component about the reordering
    onColumnChanged(orderedColumns, 'REORDER_AT_INDEX');
    
    // Reset the reordering flag after a delay
    setTimeout(() => {
      isReorderingRef.current = false;
    }, 100);
  };

  // Function to move selected columns up in the selected panel
  const moveUp = (selectedItems: string[]) => {
    if (selectedItems.length === 0) return;
    
    const newSelectedColumns = [...selectedColumns];
    const indices = selectedItems
      .map(id => newSelectedColumns.findIndex(col => col.field === id))
      .filter(index => index !== -1)
      .sort((a, b) => a - b);
    
    // Can't move up if the first selected item is already at the top
    if (indices[0] === 0) return;
    
    // Move each selected item up one position
    indices.forEach(index => {
      const temp = newSelectedColumns[index];
      newSelectedColumns[index] = newSelectedColumns[index - 1];
      newSelectedColumns[index - 1] = temp;
    });
    
    // Mark that we are reordering
    isReorderingRef.current = true;
    
    setSelectedColumns(newSelectedColumns);
    
    // Notify parent component about the reordering
    onColumnChanged(newSelectedColumns, 'REORDERED');
    
    // Reset reordering flag after a short delay
    setTimeout(() => {
      isReorderingRef.current = false;
    }, 100);
  };

  // Function to move selected columns down in the selected panel
  const moveDown = (selectedItems: string[]) => {
    if (selectedItems.length === 0) return;
    
    const newSelectedColumns = [...selectedColumns];
    const indices = selectedItems
      .map(id => newSelectedColumns.findIndex(col => col.field === id))
      .filter(index => index !== -1)
      .sort((a, b) => b - a); // Sort in descending order for moving down
    
    // Can't move down if the last selected item is already at the bottom
    if (indices[0] === newSelectedColumns.length - 1) return;
    
    // Move each selected item down one position
    indices.forEach(index => {
      const temp = newSelectedColumns[index];
      newSelectedColumns[index] = newSelectedColumns[index + 1];
      newSelectedColumns[index + 1] = temp;
    });
    
    // Mark that we are reordering
    isReorderingRef.current = true;
    
    setSelectedColumns(newSelectedColumns);
    
    // Notify parent component about the reordering
    onColumnChanged(newSelectedColumns, 'REORDERED');
    
    // Reset reordering flag after a short delay
    setTimeout(() => {
      isReorderingRef.current = false;
    }, 100);
  };
  
  return {
    selectedColumns,
    setSelectedColumns,
    reorderColumn,
    reorderColumnInGroup,
    reorderGroup,
    moveUp,
    moveDown
  };
}