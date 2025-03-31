import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ColumnPanelProps, ExtendedColDef, ColumnGroup, OperationType } from './types';

const ColumnPanel: React.FC<ColumnPanelProps> = ({ 
  columnDefs, 
  columnGroups, 
  onColumnChanged, 
  onColumnGroupChanged 
}) => {
  // State for available and selected columns
  const [availableColumns, setAvailableColumns] = useState<ExtendedColDef[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<ExtendedColDef[]>([]);
  
  // State for selected items
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // State for expanded groups in available columns
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // State for drop indicator
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number>(-1);
  const [dropIndicatorGroupName, setDropIndicatorGroupName] = useState<string | null>(null);
  
  // State to track which panel is the current drop target
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  
  // State to track the currently dragged column
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  
  // State to track the currently dragged group
  const [draggedGroupPath, setDraggedGroupPath] = useState<string | null>(null);
  const [draggedSelectedGroup, setDraggedSelectedGroup] = useState<string | null>(null);
  
  // State for group drop target (for when dragging onto a group)
  const [groupDropTarget, setGroupDropTarget] = useState<string | null>(null);
  
  // State for context menu
  const [contextMenuPosition, setContextMenuPosition] = useState<{x: number, y: number} | null>(null);
  const [contextMenuTargetGroup, setContextMenuTargetGroup] = useState<string | null>(null);
  
  // Flag to prevent multiple state updates during reordering
  const isReorderingRef = useRef<boolean>(false);
  
  // Last reordering operation timestamp to prevent duplicates
  const lastReorderTimeRef = useRef<number>(0);
  
  // References to track column positions in selected panel
  const columnPositionsRef = useRef<Map<string, number>>(new Map());
  
  // Refs for the panels
  const availablePanelRef = useRef<HTMLDivElement>(null);
  const selectedPanelRef = useRef<HTMLDivElement>(null);

  // Initialize columns on mount and when columnDefs change
  useEffect(() => {
    // Don't update if we're in the middle of a reordering operation
    if (isReorderingRef.current) return;
    
    // Create initial available columns (columns with hide: true)
    setAvailableColumns(columnDefs.filter(col => col.hide === true));
    
    // Create initial selected columns (columns with hide: false or undefined)
    setSelectedColumns(columnDefs.filter(col => col.hide !== true));
    
    // Set first level groups as expanded by default
    const firstLevelGroups = new Set<string>();
    columnDefs.forEach(col => {
      if (col.groupPath && col.groupPath.length > 0) {
        firstLevelGroups.add(col.groupPath[0]);
      }
    });
    setExpandedGroups(firstLevelGroups);
  }, [columnDefs]);

  // Function to organize columns into a tree structure for available columns
  const organizeColumnsIntoTree = useCallback((columns: ExtendedColDef[]) => {
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
  }, []);

  // Function to organize selected columns with groups
  const organizeSelectedColumnsWithGroups = useCallback(() => {
    // Create a map of column field to column object
    const columnMap = new Map<string, ExtendedColDef>();
    selectedColumns.forEach(col => {
      columnMap.set(col.field, col);
    });
    
    // Initialize result structure with ungrouped columns
    const result: {
      ungrouped: ExtendedColDef[];
      groups: {
        headerName: string;
        columns: ExtendedColDef[];
      }[];
    } = {
      ungrouped: [],
      groups: []
    };
    
    // Create a set to track which columns belong to groups
    const groupedColumns = new Set<string>();
    
    // Find columns that belong to each group
    columnGroups.forEach(group => {
      const groupColumns: ExtendedColDef[] = [];
      
      // Filter children to only include columns that exist in selected columns
      group.children.forEach(fieldName => {
        const column = columnMap.get(fieldName);
        if (column) {
          groupColumns.push(column);
          groupedColumns.add(fieldName);
        }
      });
      
      // Add group to result if it has columns
      if (groupColumns.length > 0) {
        result.groups.push({
          headerName: group.headerName,
          // Sort columns based on their original order in the selectedColumns array for consistency
          columns: groupColumns.sort((a, b) => {
            const indexA = selectedColumns.findIndex(col => col.field === a.field);
            const indexB = selectedColumns.findIndex(col => col.field === b.field);
            return indexA - indexB;
          }),
        });
      }
    });
    
    // Add all non-grouped columns to ungrouped list
    selectedColumns.forEach(col => {
      if (!groupedColumns.has(col.field)) {
        result.ungrouped.push(col);
      }
    });
    
    return result;
  }, [selectedColumns, columnGroups]);

  // Function to get all columns in a group and its subgroups
  const getAllColumnsInGroup = (groupPath: string) => {
    const pathSegments = groupPath.split('.');
    
    // Extract all columns that belong to this group or its subgroups
    return availableColumns.filter(col => {
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

  // Function to get selected columns in a specific group
  const getGroupColumns = (groupName: string) => {
    const group = columnGroups.find(g => g.headerName === groupName);
    if (!group) return [];
    
    return selectedColumns.filter(col => group.children.includes(col.field));
  };

  // Function to toggle group expansion
  const toggleGroup = (e: React.MouseEvent, groupPath: string) => {
    // Stop propagation to prevent other event handlers from firing
    e.stopPropagation();
    
    const newExpandedGroups = new Set(expandedGroups);
    
    if (newExpandedGroups.has(groupPath)) {
      newExpandedGroups.delete(groupPath);
    } else {
      newExpandedGroups.add(groupPath);
    }
    
    setExpandedGroups(newExpandedGroups);
  };

  // Function to handle selection of a column
  const handleSelect = (columnId: string, isMultiSelect: boolean, isRangeSelect: boolean) => {
    let newSelectedItems = [...selectedItems];
    
    if (isMultiSelect) {
      // Toggle selection for multi-select (Ctrl/Cmd+click)
      if (newSelectedItems.includes(columnId)) {
        newSelectedItems = newSelectedItems.filter(id => id !== columnId);
      } else {
        newSelectedItems.push(columnId);
      }
    } else if (isRangeSelect) {
      // Range selection (Shift+click)
      if (newSelectedItems.length > 0) {
        const lastSelectedId = newSelectedItems[newSelectedItems.length - 1];
        const allColumns = [...availableColumns, ...selectedColumns];
        
        const lastSelectedIndex = allColumns.findIndex(col => col.field === lastSelectedId);
        const currentIndex = allColumns.findIndex(col => col.field === columnId);
        
        if (lastSelectedIndex !== -1 && currentIndex !== -1) {
          const startIndex = Math.min(lastSelectedIndex, currentIndex);
          const endIndex = Math.max(lastSelectedIndex, currentIndex);
          
          const rangeIds = allColumns
            .slice(startIndex, endIndex + 1)
            .map(col => col.field);
            
          newSelectedItems = Array.from(new Set([...newSelectedItems, ...rangeIds]));
        }
      } else {
        newSelectedItems = [columnId];
      }
    } else {
      // Single selection (regular click)
      newSelectedItems = [columnId];
    }
    
    setSelectedItems(newSelectedItems);
  };

  // Function to handle selection of a group
  const handleSelectGroup = (groupName: string, isMultiSelect: boolean) => {
    // Find all columns in this group
    const groupColumns = getGroupColumns(groupName);
    const groupColumnIds = groupColumns.map(col => col.field);
    
    let newSelectedItems = [...selectedItems];
    
    if (isMultiSelect) {
      // Toggle all columns in the group
      const allInGroup = groupColumnIds.every(id => selectedItems.includes(id));
      
      if (allInGroup) {
        // Remove all columns in the group
        newSelectedItems = newSelectedItems.filter(id => !groupColumnIds.includes(id));
      } else {
        // Add all columns in the group
        newSelectedItems = Array.from(new Set([...newSelectedItems, ...groupColumnIds]));
      }
    } else {
      // Select only columns in this group
      newSelectedItems = [...groupColumnIds];
    }
    
    setSelectedItems(newSelectedItems);
  };

  // Function to move columns from available to selected
  const moveToSelected = (columnIds: string[] = selectedItems, targetIndex?: number) => {
    if (columnIds.length === 0) return;
    
    // Find columns in available that are selected
    const columnsToMove = availableColumns.filter(col => 
      columnIds.includes(col.field)
    );
    
    if (columnsToMove.length === 0) return;
    
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
    
    // Update local state
    setAvailableColumns(newAvailableColumns);
    setSelectedColumns(newSelectedColumns);
    setSelectedItems([]);
    
    // Mark that we are reordering to prevent duplicate updates
    isReorderingRef.current = true;
    
    // Important: Create a completely new array with explicit order to be used by the grid
    const orderedColumns = [...newSelectedColumns].map(col => ({
      ...col,
      hide: false
    }));
    
    // Notify parent component about the updated columns with specific operation type
    onColumnChanged(orderedColumns, 'ADD_AT_INDEX');
    
    // Reset reordering flag after a short delay to allow for state updates
    setTimeout(() => {
      isReorderingRef.current = false;
    }, 100);
  };

  // Function to move an entire group from available to selected
  const moveGroupToSelected = (groupPath: string, targetIndex?: number) => {
    // Get all columns in this group and subgroups
    const groupColumns = getAllColumnsInGroup(groupPath);
    
    // Extract column IDs
    const columnIds = groupColumns.map(col => col.field);
    
    if (columnIds.length === 0) return;
    
    // Use the standard moveToSelected function to move all columns
    moveToSelected(columnIds, targetIndex);
  };

  // Function to move columns from selected to available
  const moveToAvailable = (columnIds: string[] = selectedItems) => {
    if (columnIds.length === 0) return;
    
    // Find columns in selected that are selected
    const columnsToMove = selectedColumns.filter(col => 
      columnIds.includes(col.field)
    );
    
    if (columnsToMove.length === 0) return;
    
    // Remove columns from any groups they might be in
    const newColumnGroups = columnGroups.map(group => {
      return {
        ...group,
        children: group.children.filter(field => !columnIds.includes(field))
      };
    }).filter(group => group.children.length > 0);
    
    // Notify about column group changes if groups were affected
    if (JSON.stringify(newColumnGroups) !== JSON.stringify(columnGroups)) {
      // For each affected group, notify the parent
      columnGroups.forEach(group => {
        if (!newColumnGroups.some(ng => ng.headerName === group.headerName && 
            JSON.stringify(ng.children) === JSON.stringify(group.children))) {
          // Group was modified or removed
          if (newColumnGroups.some(ng => ng.headerName === group.headerName)) {
            // Group was modified
            onColumnGroupChanged(group.headerName, 'UPDATE');
          } else {
            // Group was removed
            onColumnGroupChanged(group.headerName, 'REMOVE');
          }
        }
      });
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
    
    // Update local state
    setAvailableColumns(newAvailableColumns);
    setSelectedColumns(newSelectedColumns);
    setSelectedItems([]);
    
    // Notify parent component about the updated columns
    onColumnChanged(newSelectedColumns, 'REMOVED');
  };

  // Function to add columns to a column group
  const addToColumnGroup = (groupName: string, columnIds: string[] = selectedItems) => {
    if (columnIds.length === 0 || !groupName) return;
    
    // Filter to only selected columns that are in the selected panel
    const validColumnIds = columnIds.filter(id => 
      selectedColumns.some(col => col.field === id)
    );
    
    if (validColumnIds.length === 0) return;
    
    // Create a copy of the column groups to work with
    let updatedGroups = [...columnGroups];
    
    // Find the target group
    const groupIndex = updatedGroups.findIndex(g => g.headerName === groupName);
    
    // If the group doesn't exist, create it
    if (groupIndex === -1) {
      const newGroup: ColumnGroup = {
        headerName: groupName,
        children: validColumnIds
      };
      
      // Add the new group
      updatedGroups = [...updatedGroups, newGroup];
      
      // Notify parent about the new group
      onColumnGroupChanged(groupName, 'UPDATE');
    } else {
      // Remove columns from any other groups they might be in
      updatedGroups.forEach(group => {
        if (group.headerName !== groupName) {
          const originalLength = group.children.length;
          group.children = group.children.filter(field => !validColumnIds.includes(field));
          
          // Notify if this group was modified
          if (group.children.length !== originalLength) {
            onColumnGroupChanged(group.headerName, 'UPDATE');
          }
        }
      });
      
      // Add columns to the target group
      validColumnIds.forEach(columnId => {
        if (!updatedGroups[groupIndex].children.includes(columnId)) {
          updatedGroups[groupIndex].children.push(columnId);
        }
      });
      
      // Notify parent about the updated group
      onColumnGroupChanged(groupName, 'UPDATE');
    }
    
    // Filter out any empty groups
    updatedGroups = updatedGroups.filter(group => group.children.length > 0);
    
    // Clear selection
    setSelectedItems([]);
  };

  // Function to remove columns from a column group
  const removeFromColumnGroup = (groupName: string, columnIds: string[] = selectedItems) => {
    if (columnIds.length === 0 || !groupName) return;
    
    // Find the group
    const groupIndex = columnGroups.findIndex(g => g.headerName === groupName);
    
    if (groupIndex === -1) return;
    
    // Create updated column groups
    const updatedGroups = [...columnGroups];
    
    // Remove the specified columns from the group
    const originalChildren = [...updatedGroups[groupIndex].children];
    updatedGroups[groupIndex].children = updatedGroups[groupIndex].children.filter(
      field => !columnIds.includes(field)
    );
    
    // Check if group is now empty
    if (updatedGroups[groupIndex].children.length === 0) {
      // Remove the empty group
      updatedGroups.splice(groupIndex, 1);
      onColumnGroupChanged(groupName, 'REMOVE');
    } else if (JSON.stringify(originalChildren) !== JSON.stringify(updatedGroups[groupIndex].children)) {
      // Notify parent about the updated group if it was changed
      onColumnGroupChanged(groupName, 'UPDATE');
    }
    
    // Clear selection
    setSelectedItems([]);
    
    // Reset drop indicators to prevent visual artifacts
    setDropIndicatorIndex(-1);
    setDropIndicatorGroupName(null);
  };

  // Function to reorder a column within the selected panel
  const reorderColumn = (columnId: string, targetIndex: number) => {
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

  // Function to reorder an entire column group
  const reorderColumnGroup = (groupName: string, targetIndex: number) => {
    // Find the group
    const group = columnGroups.find(g => g.headerName === groupName);
    if (!group) return;
    
    // Get all columns in this group
    const groupColumnsFields = group.children;
    
    // Find the indices of all columns in the group
    const firstColumnIndex = selectedColumns.findIndex(col => col.field === groupColumnsFields[0]);
    if (firstColumnIndex === -1) return;
    
    // Calculate group span (how many consecutive columns are in the group)
    let groupSpan = 0;
    for (let i = 0; i < groupColumnsFields.length; i++) {
      if (i + firstColumnIndex < selectedColumns.length && 
          selectedColumns[i + firstColumnIndex].field === groupColumnsFields[i]) {
        groupSpan++;
      } else {
        break;
      }
    }
    
    // If group is not consecutive in the selected columns, abort
    if (groupSpan !== groupColumnsFields.length) {
      console.warn('Group columns are not consecutive in the selected columns list');
      return;
    }
    
    // Create a copy of selectedColumns
    const columnsCopy = [...selectedColumns];
    
    // Remove the group columns
    const removedColumns = columnsCopy.splice(firstColumnIndex, groupSpan);
    
    // Adjust the target index
    let adjustedTargetIndex = targetIndex;
    if (targetIndex > firstColumnIndex) {
      adjustedTargetIndex -= groupSpan;
    }
    
    // Make sure the target index is valid
    adjustedTargetIndex = Math.max(0, Math.min(adjustedTargetIndex, columnsCopy.length));
    
    // Insert the group columns at the new position
    columnsCopy.splice(adjustedTargetIndex, 0, ...removedColumns);
    
    // Mark that we are reordering
    isReorderingRef.current = true;
    
    // Update the state
    setSelectedColumns(columnsCopy);
    
    // Notify parent component about the reordering
    onColumnChanged(columnsCopy, 'REORDER_AT_INDEX');
    
    // Reset the reordering flag after a delay
    setTimeout(() => {
      isReorderingRef.current = false;
    }, 100);
  };

  // Function to add columns to a group in the available panel
  const addToGroup = (groupPath: string[], columnIds: string[] = selectedItems) => {
    if (columnIds.length === 0 || !groupPath.length) return;
    
    // Create a deep copy of available columns
    const newAvailableColumns = JSON.parse(JSON.stringify(availableColumns));
    
    // Update group path for each selected column
    columnIds.forEach(columnId => {
      const columnIndex = newAvailableColumns.findIndex(col => col.field === columnId);
      if (columnIndex !== -1) {
        newAvailableColumns[columnIndex].groupPath = [...groupPath];
      }
    });
    
    // Update state
    setAvailableColumns(newAvailableColumns);
    setSelectedItems([]);
    
    // Expand the group that columns were added to
    const groupPathString = groupPath.join('.');
    if (!expandedGroups.has(groupPathString)) {
      const newExpandedGroups = new Set(expandedGroups);
      newExpandedGroups.add(groupPathString);
      setExpandedGroups(newExpandedGroups);
    }
  };

  // Function to create a new group in the available panel
  const createNewGroup = (groupName: string, columnIds: string[] = selectedItems) => {
    if (!groupName || columnIds.length === 0) return;
    
    // Create a deep copy of available columns
    const newAvailableColumns = JSON.parse(JSON.stringify(availableColumns));
    
    // Update group path for each selected column
    columnIds.forEach(columnId => {
      const columnIndex = newAvailableColumns.findIndex(col => col.field === columnId);
      if (columnIndex !== -1) {
        newAvailableColumns[columnIndex].groupPath = [groupName];
      }
    });
    
    // Update state
    setAvailableColumns(newAvailableColumns);
    setSelectedItems([]);
    
    // Expand the new group
    const newExpandedGroups = new Set(expandedGroups);
    newExpandedGroups.add(groupName);
    setExpandedGroups(newExpandedGroups);
  };

  // Function to create a new column group in the selected panel
  const createNewColumnGroup = () => {
    if (selectedItems.length === 0) return;
    
    // Filter to only include columns that are in the selected panel
    const validColumnIds = selectedItems.filter(id => 
      selectedColumns.some(col => col.field === id)
    );
    
    if (validColumnIds.length === 0) return;
    
    // Prompt for group name
    const groupName = prompt('Enter name for new group:');
    if (!groupName) return;
    
    // Check if group name already exists
    if (columnGroups.some(g => g.headerName === groupName)) {
      alert('A group with that name already exists. Please choose a different name.');
      return;
    }
    
    // Create the new group
    const newGroup: ColumnGroup = {
      headerName: groupName,
      children: validColumnIds
    };
    
    // Remove columns from any other groups they might be in
    const updatedGroups = columnGroups.map(group => {
      return {
        ...group,
        children: group.children.filter(field => !validColumnIds.includes(field))
      };
    }).filter(group => group.children.length > 0);
    
    // Add the new group
    updatedGroups.push(newGroup);
    
    // Notify parent about each modified group
    columnGroups.forEach(group => {
      const updatedGroup = updatedGroups.find(g => g.headerName === group.headerName);
      if (!updatedGroup) {
        // Group was removed
        onColumnGroupChanged(group.headerName, 'REMOVE');
      } else if (JSON.stringify(updatedGroup.children) !== JSON.stringify(group.children)) {
        // Group was modified
        onColumnGroupChanged(group.headerName, 'UPDATE');
      }
    });
    
    // Notify about the new group
    onColumnGroupChanged(groupName, 'UPDATE');
    
    // Clear selection
    setSelectedItems([]);
  };

  // Function to move selected columns up in the selected panel
  const moveUp = () => {
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
  const moveDown = () => {
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

  // Function to clear all selected columns
  const clearAll = () => {
    // Update hide property for all selected columns
    const updatedColumns = selectedColumns.map(col => ({
      ...col,
      hide: true
    }));
    
    // Move all selected columns to available
    const newAvailableColumns = [...availableColumns, ...updatedColumns];
    
    setAvailableColumns(newAvailableColumns);
    setSelectedColumns([]);
    setSelectedItems([]);
    
    // Notify parent component that all columns were removed
    onColumnChanged([], 'REMOVED');
    
    // Clear all column groups
    columnGroups.forEach(group => {
      onColumnGroupChanged(group.headerName, 'REMOVE');
    });
  };

  // Function to calculate the drop index based on mouse position
  const calculateDropIndex = (e: React.DragEvent<HTMLDivElement>) => {
    const selectedPanelElement = selectedPanelRef.current;
    if (!selectedPanelElement) return 0;
    
    // Get container
    const columnsList = selectedPanelElement.querySelector('.columns-list');
    if (!columnsList) return 0;
    
    const containerRect = columnsList.getBoundingClientRect();
    
    // Get all column items and group headers
    const items = Array.from(
      columnsList.querySelectorAll('.column-item, .selected-group-header')
    );
    if (items.length === 0) return 0;
    
    // If we're dragging multiple columns, we need to filter out all selected items
    const selectedIndices = selectedItems.includes(draggedColumnId || '')
      ? selectedItems.map(id => {
          const itemEl = items.find(el => el.getAttribute('data-column-id') === id);
          return itemEl ? items.indexOf(itemEl) : -1;
        }).filter(idx => idx !== -1)
      : draggedColumnId
        ? [items.findIndex(el => el.getAttribute('data-column-id') === draggedColumnId)]
        : [];
    
    // If we're dragging a group, find all its items
    let groupItemIndices: number[] = [];
    if (draggedSelectedGroup) {
      // Get all columns in the dragged group
      const group = columnGroups.find(g => g.headerName === draggedSelectedGroup);
      if (group) {
        groupItemIndices = items
          .map((el, idx) => {
            const columnId = el.getAttribute('data-column-id');
            const groupName = el.getAttribute('data-group-name');
            return (groupName === draggedSelectedGroup || (columnId && group.children.includes(columnId))) ? idx : -1;
          })
          .filter(idx => idx !== -1);
      }
    }
    
    // Combine indices to skip
    const indicesToSkip = [...selectedIndices, ...groupItemIndices];
    
    // Mouse position relative to container
    const mouseY = e.clientY - containerRect.top;
    
    // Find the index where we should insert
    for (let i = 0; i < items.length; i++) {
      // Skip if this is a selected item being dragged
      if (indicesToSkip.includes(i)) continue;
      
      const rect = items[i].getBoundingClientRect();
      const itemTop = rect.top - containerRect.top;
      const itemHeight = rect.height;
      const middleY = itemTop + (itemHeight / 2);
      
      if (mouseY < middleY) {
        return i;
      }
    }
    
    // If mouse is below all items, drop at the end
    return items.length;
  };

  // Drag handlers for columns
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, column: ExtendedColDef, isAvailable: boolean, groupName?: string) => {
    // Set the column being dragged in state
    setDraggedColumnId(column.field);
    setDraggedGroupPath(null);
    setDraggedSelectedGroup(null);
    
    // Check if this column is part of a multi-selection
    const isMultiSelection = selectedItems.includes(column.field) && selectedItems.length > 1;
    
    // Prepare data for drag operation
    const dragData = {
      type: 'column',
      columnId: column.field,
      sourcePanel: isAvailable ? 'available' : 'selected',
      isMultiSelection,
      selectedItems: isMultiSelection ? selectedItems : [column.field],
      groupName
    };
    
    // Set data for transfer
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    
    // Set the drag effect
    e.dataTransfer.effectAllowed = 'move';
    
    // Add a class to the dragged element
    if (e.currentTarget.classList) {
      e.currentTarget.classList.add('dragging');
    }
  };

  // Drag handler for groups
  const handleGroupDragStart = (e: React.DragEvent<HTMLDivElement>, groupPath: string) => {
    e.stopPropagation();
    
    // Set the group being dragged in state
    setDraggedGroupPath(groupPath);
    setDraggedColumnId(null);
    setDraggedSelectedGroup(null);
    
    // Prepare data for drag operation
    const dragData = {
      type: 'group',
      groupPath: groupPath,
      sourcePanel: 'available'
    };
    
    // Set data for transfer
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    
    // Set the drag effect
    e.dataTransfer.effectAllowed = 'move';
    
    // Add a class to the dragged element
    if (e.currentTarget.classList) {
      e.currentTarget.classList.add('dragging');
    }
  };

  // Update group drop handlers
  const handleSelectedGroupDragStart = (e: React.DragEvent<HTMLDivElement>, groupName: string) => {
    e.stopPropagation();
    
    // Set the group being dragged in state
    setDraggedSelectedGroup(groupName);
    setDraggedColumnId(null);
    setDraggedGroupPath(null);
    
    // Prepare data for drag operation
    const dragData = {
      type: 'selectedGroup',
      groupName: groupName,
      sourcePanel: 'selected'
    };
    
    // Set data for transfer
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    
    // Set the drag effect
    e.dataTransfer.effectAllowed = 'move';
    
    // Add a class to the dragged element
    if (e.currentTarget.classList) {
      e.currentTarget.classList.add('dragging');
    }
  };
  
  // Add dragEnd handler for groups
  const handleGroupDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    resetDropState();
  };

  // Handle any drag end (successful or canceled)
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    // Reset all drop state regardless of whether the drop was successful
    resetDropState();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, panel: string, groupPath?: string, groupName?: string) => {
    e.preventDefault();
    
    // Set the drop effect
    e.dataTransfer.dropEffect = 'move';
    
    // Set current drop target panel
    setDropTarget(panel);
    
    // If dragging over a group, highlight it
    if ((groupPath && panel === 'available') || (groupName && panel === 'selected')) {
      setGroupDropTarget(groupPath || groupName || null);
    } else {
      setGroupDropTarget(null);
    }
    
    if (panel === 'selected') {
      // Calculate drop index directly based on mouse position
      const index = calculateDropIndex(e);
      
      // Update the dropIndicatorIndex state only if it has changed
      // This prevents unnecessary re-renders
      if (index !== dropIndicatorIndex) {
        setDropIndicatorIndex(index);
      }
      
      // Store the group where the indicator should appear (or null if not in a group)
      setDropIndicatorGroupName(groupName || null);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only clear drop target if leaving the container (not just moving between children)
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    
    setDropTarget(null);
    setDropIndicatorIndex(-1);
    setGroupDropTarget(null);
    setDropIndicatorGroupName(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, panel: string, groupPath?: string, groupName?: string) => {
    e.preventDefault();
    
    // Parse the drag data
    let dragData;
    try {
      dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
    } catch (error) {
      console.error('Invalid drag data');
      resetDropState();
      return;
    }
    
    // Calculate the final drop index at the time of drop for selected panel
    const finalDropIndex = panel === 'selected' ? calculateDropIndex(e) : -1;
    
    // Handle different drag data types
    if (dragData.type === 'column') {
      const { columnId, sourcePanel, isMultiSelection, selectedItems: draggedItems, groupName: sourceGroupName } = dragData;
      
      // Handle dropping onto a group in the available panel
      if (groupPath && panel === 'available') {
        const pathSegments = groupPath.split('.');
        addToGroup(pathSegments, draggedItems);
      } 
      // Handle dropping onto a group in the selected panel
      else if (groupName && panel === 'selected') {
        // Move columns to the target group
        addToColumnGroup(groupName, draggedItems);
        
        // Update grid
        onColumnChanged(selectedColumns, 'REORDERED');
      }
      // Handle dropping out of a group in the selected panel
      else if (sourceGroupName && panel === 'selected' && !groupName) {
        // Remove columns from their group
        removeFromColumnGroup(sourceGroupName, draggedItems);
        
        // Move to specific position if needed (reordering)
        if (finalDropIndex >= 0) {
          reorderColumn(columnId, finalDropIndex);
        }
      }
      // Handle standard panel drops
      else if (sourcePanel === 'available' && panel === 'selected') {
        // Move from available to selected at the calculated drop index
        moveToSelected(draggedItems, finalDropIndex);
      } else if (sourcePanel === 'selected' && panel === 'available') {
        // Move from selected to available
        moveToAvailable(draggedItems);
      } else if (sourcePanel === 'selected' && panel === 'selected') {
        // Only reorder if actually changing position and
        // if we're not moving a column to the same place
        const existingIndex = selectedColumns.findIndex(col => col.field === columnId);
        if (existingIndex !== finalDropIndex && existingIndex !== finalDropIndex - 1) {
          reorderColumn(columnId, finalDropIndex);
        }
      }
    } 
    // Handle group drops
    else if (dragData.type === 'group') {
      const { groupPath: draggedGroup } = dragData;
      
      if (panel === 'selected') {
        // Move all columns from the group to selected panel
        moveGroupToSelected(draggedGroup, finalDropIndex);
      }
    }
    // Handle selected group drops (reordering entire groups)
    else if (dragData.type === 'selectedGroup') {
      const { groupName: draggedGroupName } = dragData;
      
      if (panel === 'selected') {
        // Reorder the entire group
        reorderColumnGroup(draggedGroupName, finalDropIndex);
      }
    }
    
    // Reset all drop state
    resetDropState();
  };
  
  // Function to reset all drop-related state
  const resetDropState = () => {
    setDropTarget(null);
    setDropIndicatorIndex(-1);
    setDraggedColumnId(null);
    setDraggedGroupPath(null);
    setDraggedSelectedGroup(null);
    setGroupDropTarget(null);
    setDropIndicatorGroupName(null);
    
    // Remove any dragging classes from elements
    const draggingElements = document.querySelectorAll('.dragging');
    draggingElements.forEach(el => el.classList.remove('dragging'));
  };

  // Handle right-click for context menu
  const handleContextMenu = (e: React.MouseEvent, groupPath?: string) => {
    // Only show context menu in available panel
    if (selectedItems.length === 0 || !availableColumns.some(col => selectedItems.includes(col.field))) return;
    
    e.preventDefault();
    
    // Position the context menu at the mouse coordinates
    setContextMenuPosition({
      x: e.clientX,
      y: e.clientY
    });
    
    // Set target group if right-clicking on a group
    setContextMenuTargetGroup(groupPath || null);
  };

  // Close context menu
  const closeContextMenu = () => {
    setContextMenuPosition(null);
    setContextMenuTargetGroup(null);
  };

  // Handle creating a new group from context menu
  const handleCreateGroup = () => {
    // Only create groups in available panel
    const availableSelectedItems = selectedItems.filter(id => 
      availableColumns.some(col => col.field === id)
    );
    
    if (availableSelectedItems.length === 0) return;
    
    // Prompt for group name
    const groupName = prompt('Enter name for new group:');
    if (!groupName) return;
    
    if (contextMenuTargetGroup) {
      // Add to existing group
      const pathSegments = contextMenuTargetGroup.split('.');
      addToGroup(pathSegments, availableSelectedItems);
    } else {
      // Create new group
      createNewGroup(groupName, availableSelectedItems);
    }
    
    closeContextMenu();
  };

  // Render column item
  const renderColumnItem = (column: ExtendedColDef, index: number, isAvailable: boolean, groupName?: string) => {
    return (
      <div
        key={column.field}
        className={`column-item draggable ${selectedItems.includes(column.field) ? 'selected' : ''} ${column.field === draggedColumnId ? 'dragging' : ''} ${groupName ? 'in-group' : ''}`}
        style={groupName ? { marginLeft: '20px' } : {}}
        data-column-id={column.field}
        data-group-name={groupName}
        data-index={index}
        onClick={(e) => handleSelect(
          column.field, 
          e.ctrlKey || e.metaKey, 
          e.shiftKey
        )}
        onDoubleClick={() => {
          handleSelect(column.field, false, false);
          isAvailable ? moveToSelected([column.field]) : moveToAvailable([column.field]);
        }}
        onContextMenu={(e) => isAvailable && handleContextMenu(e)}
        draggable
        onDragStart={(e) => handleDragStart(e, column, isAvailable, groupName)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOver(e, isAvailable ? 'available' : 'selected', undefined, groupName)}
        onDrop={(e) => handleDrop(e, isAvailable ? 'available' : 'selected', undefined, groupName)}
      >
        {column.headerName || column.field}
      </div>
    );
  };

  // Render tree structure for available columns
  const renderTreeNode = (node: any, path: string[] = [], level = 0) => {
    const entries = Object.entries(node);
    
    return (
      <>
        {entries.map(([key, value]: [string, any]) => {
          if (key === 'columns') {
            return (value as ExtendedColDef[]).map((col, idx) => renderColumnItem(col, idx, true));
          } else {
            const currentPath = [...path, key];
            const pathString = currentPath.join('.');
            const isExpanded = expandedGroups.has(pathString);
            const isDropTarget = groupDropTarget === pathString;
            const isDragging = draggedGroupPath === pathString;
            
            // Count columns in this group
            const columnsInGroup = getAllColumnsInGroup(pathString);
            const columnCount = columnsInGroup.length;
            
            return (
              <div key={pathString} className="group-container">
                <div
                  className={`group-header ${isDropTarget ? 'group-drop-target' : ''} ${isDragging ? 'dragging' : ''}`}
                  style={{ paddingLeft: `${level * 20}px` }}
                  draggable
                  onDragStart={(e) => handleGroupDragStart(e, pathString)}
                  onContextMenu={(e) => handleContextMenu(e, pathString)}
                  onDragOver={(e) => handleDragOver(e, 'available', pathString)}
                  onDrop={(e) => handleDrop(e, 'available', pathString)}
                >
                  <span 
                    className="expand-icon"
                    onClick={(e) => toggleGroup(e, pathString)}
                  >
                    {isExpanded ? '−' : '+'}
                  </span>
                  <span className="group-name">{key}</span>
                  <span className="group-count">({columnCount})</span>
                </div>
                {isExpanded && renderTreeNode(value, currentPath, level + 1)}
              </div>
            );
          }
        })}
      </>
    );
  };

  // Function to render selected columns with groups
// Function to render selected columns with groups - completely rewritten
const renderSelectedColumnsWithGroups = () => {
  // Only calculate and show drop indicators during active drag operations
  const showDropIndicators = draggedColumnId !== null || draggedGroupPath !== null || draggedSelectedGroup !== null;
  
  // Organize columns into groups and ungrouped
  const { ungrouped, groups } = organizeSelectedColumnsWithGroups();
  
  // Create a Map to track the rendered column to prevent duplicates
  const renderedColumns = new Map<string, boolean>();
  
  return (
    <>
      {/* Render ungrouped columns */}
      {ungrouped.map((column, index) => {
        if (renderedColumns.has(column.field)) return null;
        renderedColumns.set(column.field, true);
        
        return (
          <React.Fragment key={`ungrouped-${column.field}`}>
            {showDropIndicators && dropIndicatorIndex === index && dropIndicatorGroupName === null && (
              <div className="drop-indicator"></div>
            )}
            {renderColumnItem(column, index, false)}
          </React.Fragment>
        );
      })}
      
      {/* Render the final drop indicator for ungrouped columns if needed */}
      {showDropIndicators && dropIndicatorIndex === ungrouped.length && dropIndicatorGroupName === null && (
        <div className="drop-indicator"></div>
      )}
      
      {/* Render groups with their columns */}
      {groups.map((group, groupIndex) => {
        // Calculate global index for this group (after all ungrouped columns)
        const groupHeaderIndex = ungrouped.length + groupIndex;
        
        // Filter out columns that have already been rendered
        const visibleGroupColumns = group.columns.filter(col => !renderedColumns.has(col.field));
        if (visibleGroupColumns.length === 0) return null;
        
        // Mark these columns as rendered
        visibleGroupColumns.forEach(col => renderedColumns.set(col.field, true));
        
        const isGroupDropTarget = groupDropTarget === group.headerName;
        const isGroupDragging = draggedSelectedGroup === group.headerName;
        
        return (
          <React.Fragment key={`group-${group.headerName}`}>
            {/* Drop indicator before group if needed */}
            {showDropIndicators && dropIndicatorIndex === groupHeaderIndex && dropIndicatorGroupName === null && (
              <div className="drop-indicator"></div>
            )}
            
            {/* Group header */}
            <div 
              className={`selected-group-header ${isGroupDropTarget ? 'group-drop-target' : ''} ${isGroupDragging ? 'dragging' : ''}`}
              data-group-name={group.headerName}
              draggable
              onDragStart={(e) => handleSelectedGroupDragStart(e, group.headerName)}
              onDragEnd={handleGroupDragEnd}
              onDragOver={(e) => handleDragOver(e, 'selected', undefined, group.headerName)}
              onDrop={(e) => handleDrop(e, 'selected', undefined, group.headerName)}
              onClick={(e) => handleSelectGroup(group.headerName, e.ctrlKey || e.metaKey)}
            >
              <span className="group-name">{group.headerName}</span>
              <span className="group-count">({visibleGroupColumns.length})</span>
            </div>
            
            {/* Drop indicator inside group if needed */}
            {showDropIndicators && dropIndicatorIndex === groupHeaderIndex && dropIndicatorGroupName === group.headerName && (
              <div className="drop-indicator in-group"></div>
            )}
            
            {/* Group columns */}
            {visibleGroupColumns.map((column, colIndex) => {
              // Calculate global index for this column
              const columnIndex = groupHeaderIndex + 1 + colIndex;
              
              return (
                <React.Fragment key={`group-${group.headerName}-column-${column.field}`}>
                  {/* Drop indicator before column if needed */}
                  {showDropIndicators && dropIndicatorIndex === columnIndex && 
                    (dropIndicatorGroupName === group.headerName || dropIndicatorGroupName === null) && (
                    <div 
                      className={`drop-indicator ${dropIndicatorGroupName === group.headerName ? 'in-group' : ''}`}
                      style={dropIndicatorGroupName === group.headerName ? { marginLeft: '20px' } : {}}
                    ></div>
                  )}
                  
                  {/* Column item */}
                  {renderColumnItem(column, columnIndex, false, group.headerName)}
                </React.Fragment>
              );
            })}
            
            {/* Drop indicator after the last column in group if needed */}
            {showDropIndicators && dropIndicatorIndex === groupHeaderIndex + 1 + visibleGroupColumns.length && 
              (dropIndicatorGroupName === group.headerName || dropIndicatorGroupName === null) && (
              <div 
                className={`drop-indicator ${dropIndicatorGroupName === group.headerName ? 'in-group' : ''}`}
                style={dropIndicatorGroupName === group.headerName ? { marginLeft: '20px' } : {}}
              ></div>
            )}
          </React.Fragment>
        );
      })}
      
      {/* If the list is empty, show a drop indicator */}
      {ungrouped.length === 0 && groups.length === 0 && showDropIndicators && dropIndicatorIndex === 0 && (
        <div className="drop-indicator"></div>
      )}
    </>
  );
};

  // Organize available columns into a tree structure
  const availableColumnsTree = organizeColumnsIntoTree(availableColumns);

  return (
    <div className="column-panel">
      <div className="panel-container">
        <div className="panel-section available-columns">
          <div className="panel-header">
            <h3>Available Columns</h3>
            <div className="column-count">
              {availableColumns.length} columns
            </div>
          </div>
          <div className="panel-content">
            <div 
              ref={availablePanelRef}
              className={`columns-list-container ${dropTarget === 'available' ? 'drop-target-active' : ''}`}
              onDragOver={(e) => handleDragOver(e, 'available')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'available')}
              onContextMenu={(e) => handleContextMenu(e)}
            >
              <div className="columns-list">
                {renderTreeNode(availableColumnsTree)}
              </div>
            </div>
          </div>
          <div className="panel-footer">
            <button 
              onClick={() => moveToSelected()} 
              disabled={selectedItems.length === 0 || !selectedItems.some(id => availableColumns.some(col => col.field === id))}
            >
              Add to Selected &gt;
            </button>
            {selectedItems.length > 0 && selectedItems.some(id => availableColumns.some(col => col.field === id)) && (
              <button onClick={handleCreateGroup}>
                Create Group
              </button>
            )}
          </div>
        </div>
        
        <div className="panel-section selected-columns">
          <div className="panel-header">
            <h3>Selected Columns</h3>
            <div className="column-count">
              {selectedColumns.length} columns
            </div>
          </div>
          <div className="panel-content">
            <div 
              ref={selectedPanelRef}
              className={`columns-list-container ${dropTarget === 'selected' ? 'drop-target-active' : ''}`}
              onDragOver={(e) => handleDragOver(e, 'selected')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'selected')}
            >
              <div className="columns-list">
                {renderSelectedColumnsWithGroups()}
              </div>
            </div>
          </div>
          <div className="panel-footer">
            <button 
              onClick={() => moveToAvailable()} 
              disabled={selectedItems.length === 0 || !selectedItems.some(id => selectedColumns.some(col => col.field === id))}
            >
              &lt; Remove from Selected
            </button>
            <button 
              onClick={moveUp} 
              disabled={selectedItems.length === 0 || !selectedItems.some(id => selectedColumns.some(col => col.field === id))}
            >
              Move Up
            </button>
            <button 
              onClick={moveDown} 
              disabled={selectedItems.length === 0 || !selectedItems.some(id => selectedColumns.some(col => col.field === id))}
            >
              Move Down
            </button>
            <button 
              onClick={clearAll} 
              disabled={selectedColumns.length === 0}
            >
              Clear All
            </button>
            <button
              onClick={createNewColumnGroup}
              disabled={selectedItems.length === 0 || !selectedItems.some(id => selectedColumns.some(col => col.field === id))}
            >
              Create Group
            </button>
          </div>
        </div>
      </div>

      {/* Context Menu (only for available panel) */}
      {contextMenuPosition && (
        <div 
          className="context-menu"
          style={{
            position: 'fixed',
            top: contextMenuPosition.y,
            left: contextMenuPosition.x,
            zIndex: 1000
          }}
        >
          <div className="context-menu-item" onClick={handleCreateGroup}>
            {contextMenuTargetGroup ? `Add to ${contextMenuTargetGroup.split('.').pop()}` : 'Create New Group'}
          </div>
          <div className="context-menu-item" onClick={closeContextMenu}>
            Cancel
          </div>
        </div>
      )}

      {/* Overlay to close context menu when clicking outside */}
      {contextMenuPosition && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={closeContextMenu}
        />
      )}
    </div>
  );
};

export default ColumnPanel;