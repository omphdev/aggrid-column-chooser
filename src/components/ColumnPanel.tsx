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
  
  // State for column groups (maintain local copy to manipulate)
  const [localColumnGroups, setLocalColumnGroups] = useState<ColumnGroup[]>([]);
  
  // State for selected items
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // State for expanded groups in available columns
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // State for expanded groups in selected columns
  const [expandedSelectedGroups, setExpandedSelectedGroups] = useState<Set<string>>(new Set());
  
  // State for drop indicator
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number>(-1);
  
  // State to track which panel is the current drop target
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  
  // State to track the currently dragged column
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  
  // State to track the currently dragged group
  const [draggedGroupPath, setDraggedGroupPath] = useState<string | null>(null);
  
  // State for the currently dragged column group in selected panel
  const [draggedColumnGroup, setDraggedColumnGroup] = useState<string | null>(null);
  
  // State for group drop target (for when dragging onto a group)
  const [groupDropTarget, setGroupDropTarget] = useState<string | null>(null);
  
  // State for selected panel group drop target
  const [selectedGroupDropTarget, setSelectedGroupDropTarget] = useState<string | null>(null);
  
  // State for context menu
  const [contextMenuPosition, setContextMenuPosition] = useState<{x: number, y: number} | null>(null);
  const [contextMenuTargetGroup, setContextMenuTargetGroup] = useState<string | null>(null);
  
  // State for group column drop indicators
  const [groupDropIndicatorIndices, setGroupDropIndicatorIndices] = useState<{[groupName: string]: number}>({});
  
  // Flag to prevent multiple state updates during reordering
  const isReorderingRef = useRef<boolean>(false);
  
  // Last reordering operation timestamp to prevent duplicates
  const lastReorderTimeRef = useRef<number>(0);
  
  // Refs for the panels
  const availablePanelRef = useRef<HTMLDivElement>(null);
  const selectedPanelRef = useRef<HTMLDivElement>(null);

  // Reset group drop indicators
  const resetGroupDropIndicators = () => {
    setGroupDropIndicatorIndices({});
  };

  // Initialize columns and groups on mount and when columnDefs or columnGroups change
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
    
    // Initialize local column groups
    setLocalColumnGroups(columnGroups || []);
    
    // Set all selected column groups as expanded by default
    const selectedGroupsSet = new Set<string>();
    (columnGroups || []).forEach(group => {
      selectedGroupsSet.add(group.headerName);
    });
    setExpandedSelectedGroups(selectedGroupsSet);
  }, [columnDefs, columnGroups]);

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

  // Function to organize selected columns by groups
  const organizeSelectedColumnsByGroups = useCallback(() => {
    // Create a map of column field to column object for quick lookup
    const columnMap = new Map<string, ExtendedColDef>();
    selectedColumns.forEach(col => {
      columnMap.set(col.field, col);
    });
    
    // Get all column fields in the current order
    const orderedFields = selectedColumns.map(col => col.field);
    
    // Create a map for fast group lookup
    const groupMap = new Map<string, ColumnGroup>();
    localColumnGroups.forEach(group => {
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
      
      for (const group of localColumnGroups) {
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
  }, [selectedColumns, localColumnGroups]);

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

  // Function to toggle group expansion in available panel
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

  // Function to toggle group expansion in selected panel
  const toggleSelectedGroup = (e: React.MouseEvent, groupName: string) => {
    // Stop propagation to prevent other event handlers from firing
    e.stopPropagation();
    
    const newExpandedGroups = new Set(expandedSelectedGroups);
    
    if (newExpandedGroups.has(groupName)) {
      newExpandedGroups.delete(groupName);
    } else {
      newExpandedGroups.add(groupName);
    }
    
    setExpandedSelectedGroups(newExpandedGroups);
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
    const newColumnGroups = localColumnGroups.map(group => ({
      ...group,
      children: group.children.filter(field => !columnIds.includes(field))
    })).filter(group => group.children.length > 0); // Remove empty groups
    
    // Update local state
    setAvailableColumns(newAvailableColumns);
    setSelectedColumns(newSelectedColumns);
    setLocalColumnGroups(newColumnGroups);
    setSelectedItems([]);
    
    // Notify parent component about the updated columns
    onColumnChanged(newSelectedColumns, 'REMOVED');
    
    // Notify parent about group changes if needed
    localColumnGroups.forEach((group, index) => {
      const newGroupChildren = group.children.filter(field => !columnIds.includes(field));
      if (newGroupChildren.length !== group.children.length) {
        if (newGroupChildren.length === 0) {
          // Group is now empty, remove it
          onColumnGroupChanged(group.headerName, 'REMOVE');
        } else {
          // Update group with new children
          const updatedGroup = { ...group, children: newGroupChildren };
          onColumnGroupChanged(group.headerName, 'UPDATE', group.headerName);
        }
      }
    });
  };

  // Function to create a new column group in the selected panel
  const createSelectedColumnGroup = (groupName: string, columnIds: string[] = selectedItems) => {
    if (!groupName || columnIds.length === 0) return;
    
    // Create a new group
    const newGroup: ColumnGroup = {
      headerName: groupName,
      children: columnIds,
      columns: []
    };
    
    // Check if a group with this name already exists
    const existingGroupIndex = localColumnGroups.findIndex(g => g.headerName === groupName);
    let newColumnGroups: ColumnGroup[] = [];
    
    if (existingGroupIndex !== -1) {
      // Update existing group
      newColumnGroups = [...localColumnGroups];
      newColumnGroups[existingGroupIndex] = {
        ...newColumnGroups[existingGroupIndex],
        children: Array.from(new Set([...newColumnGroups[existingGroupIndex].children, ...columnIds]))
      };
    } else {
      // Add new group
      newColumnGroups = [...localColumnGroups, newGroup];
    }
    
    // Update local state
    setLocalColumnGroups(newColumnGroups);
    setSelectedItems([]);
    
    // Expand the group by default
    const newExpandedGroups = new Set(expandedSelectedGroups);
    newExpandedGroups.add(groupName);
    setExpandedSelectedGroups(newExpandedGroups);
    
    // Notify parent about the group change
    if (existingGroupIndex !== -1) {
      onColumnGroupChanged(groupName, 'UPDATE', groupName);
    } else {
      // This is a new group - we can pass the group object to the parent
      // For simplicity, we just pass the name and action
      onColumnGroupChanged(groupName, 'UPDATE', groupName);
    }
  };

  // Function to add columns to an existing group in the selected panel
  const addToSelectedGroup = (groupName: string, columnIds: string[] = selectedItems) => {
    if (!groupName || columnIds.length === 0) return;
    
    // Find the group
    const groupIndex = localColumnGroups.findIndex(g => g.headerName === groupName);
    
    if (groupIndex === -1) return;
    
    // Update the group
    const newColumnGroups = [...localColumnGroups];
    newColumnGroups[groupIndex] = {
      ...newColumnGroups[groupIndex],
      children: Array.from(new Set([...newColumnGroups[groupIndex].children, ...columnIds]))
    };
    
    // Update local state
    setLocalColumnGroups(newColumnGroups);
    setSelectedItems([]);
    
    // Notify parent about the group change
    onColumnGroupChanged(groupName, 'UPDATE', groupName);
  };

  // Function to remove columns from a group in the selected panel
  const removeFromSelectedGroup = (groupName: string, columnIds: string[] = selectedItems) => {
    if (!groupName || columnIds.length === 0) return;
    
    // Find the group
    const groupIndex = localColumnGroups.findIndex(g => g.headerName === groupName);
    
    if (groupIndex === -1) return;
    
    // Update the group
    const newColumnGroups = [...localColumnGroups];
    const newChildren = newColumnGroups[groupIndex].children.filter(field => !columnIds.includes(field));
    
    if (newChildren.length === 0) {
      // Group is now empty, remove it
      newColumnGroups.splice(groupIndex, 1);
      onColumnGroupChanged(groupName, 'REMOVE');
    } else {
      // Update group with new children
      newColumnGroups[groupIndex] = {
        ...newColumnGroups[groupIndex],
        children: newChildren
      };
      onColumnGroupChanged(groupName, 'UPDATE', groupName);
    }
    
    // Update local state
    setLocalColumnGroups(newColumnGroups);
    setSelectedItems([]);
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

  const detectDropArea = (e: React.DragEvent<HTMLDivElement>): {
    isGroupContent: boolean;
    groupName: string | null;
  } => {
    const currentElement = e.target as HTMLElement;
    let isGroupContent = false;
    let groupName: string | null = null;
    
    // Check if dropping in a group's content area
    const groupContentElement = currentElement.closest('.group-columns-container');
    if (groupContentElement) {
      isGroupContent = true;
      
      // Get the parent group container
      const groupContainer = groupContentElement.closest('.group-container-selected');
      if (groupContainer) {
        const name = groupContainer.getAttribute('data-group-name');
        if (name) groupName = name;
      }
    } else {
      // If not in group content, see if we're on a group header
      const groupHeader = currentElement.closest('.selected-group-header');
      if (groupHeader) {
        const groupContainer = groupHeader.closest('.group-container-selected');
        if (groupContainer) {
          const name = groupContainer.getAttribute('data-group-name');
          if (name) groupName = name;
        }
      }
    }
    
    return { isGroupContent, groupName };
  };

  // Calculate drop position within a group
  const calculateGroupColumnDropIndex = (groupName: string, e: React.DragEvent<HTMLDivElement>) => {
    const selectedPanelElement = selectedPanelRef.current;
    if (!selectedPanelElement) return 0;
    
    // Find the group container
    const groupContainer = selectedPanelElement.querySelector(`[data-group-name="${groupName}"]`);
    if (!groupContainer) return 0;
    
    // Get all column items in this group
    const columnItems = Array.from(
      groupContainer.querySelectorAll('.column-item')
    );
    if (columnItems.length === 0) return 0;
    
    // Mouse position relative to container
    const containerRect = groupContainer.getBoundingClientRect();
    const mouseY = e.clientY - containerRect.top;
    
    // Find the column we're dragging (if any)
    let draggedColumnIndices: number[] = [];
    if (draggedColumnId) {
      const draggedIndex = columnItems.findIndex(
        item => item.getAttribute('data-column-id') === draggedColumnId
      );
      draggedColumnIndices = draggedIndex !== -1 ? [draggedIndex] : [];
      
      // If we're dragging multiple columns, include their indices too
      if (selectedItems.includes(draggedColumnId) && selectedItems.length > 1) {
        draggedColumnIndices = selectedItems
          .map(id => columnItems.findIndex(item => item.getAttribute('data-column-id') === id))
          .filter(index => index !== -1);
      }
    }
    
    // Find the column position where we should insert
    for (let i = 0; i < columnItems.length; i++) {
      // Skip if this is a selected item being dragged
      if (draggedColumnIndices.includes(i)) continue;
      
      const rect = columnItems[i].getBoundingClientRect();
      const itemTop = rect.top - containerRect.top;
      const itemHeight = rect.height;
      const middleY = itemTop + (itemHeight / 2);
      
      if (mouseY < middleY) {
        return i;
      }
    }
    
    // If mouse is below all items, drop at the end
    return columnItems.length;
  };

  // Function to reorder a column within a group
// Enhanced reorderColumnInGroup function
const reorderColumnInGroup = (groupName: string, columnId: string, targetIndex: number) => {
  // Find the group
  const groupIndex = localColumnGroups.findIndex(g => g.headerName === groupName);
  if (groupIndex === -1) return;
  
  const group = localColumnGroups[groupIndex];
  
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
  
  // Update the group with new column order
  const updatedGroups = [...localColumnGroups];
  updatedGroups[groupIndex] = {
    ...updatedGroups[groupIndex],
    children: currentChildren
  };
  
  // Mark that we are reordering
  isReorderingRef.current = true;
  
  // Update local state
  setLocalColumnGroups(updatedGroups);
  
  // Notify parent component about the group change
  onColumnGroupChanged(groupName, 'UPDATE', groupName);
  
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
  
  // Update the selected columns with the new order
  setSelectedColumns(newSelectedOrder);
  
  // Notify parent component about the reordering
  onColumnChanged(newSelectedOrder, 'REORDER_AT_INDEX');
  
  // Reset the reordering flag after a delay
  setTimeout(() => {
    isReorderingRef.current = false;
  }, 100);
};

  // Function to reorder a group within the selected panel
  const reorderGroup = (groupName: string, targetIndex: number) => {
    // Find the group
    const group = localColumnGroups.find(g => g.headerName === groupName);
    
    if (!group) return;
    
    // Get all columns in the group
    const groupColumns = group.children;
    
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
    
    // Clear all column groups
    setLocalColumnGroups([]);
    
    // Update state
    setAvailableColumns(newAvailableColumns);
    setSelectedColumns([]);
    setSelectedItems([]);
    
    // Notify parent component that all columns were removed
    onColumnChanged([], 'REMOVED');
    
    // Notify parent about all groups being removed
    localColumnGroups.forEach(group => {
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
    
    // Get all column items
    const columnItems = Array.from(
      columnsList.querySelectorAll('.column-item, .group-container-selected')
    );
    if (columnItems.length === 0) return 0;
    
    // If we're dragging multiple columns, we need to filter out all selected items
    const selectedIndices = selectedItems.includes(draggedColumnId || '')
      ? selectedItems.map(id => {
          // Find the index of the item with this id (can be column or group)
          return columnItems.findIndex(item => {
            if (item.classList.contains('column-item')) {
              return item.getAttribute('data-column-id') === id;
            } else {
              // For groups, check if any of its columns match
              const groupName = item.getAttribute('data-group-name');
              const group = localColumnGroups.find(g => g.headerName === groupName);
              return group && group.children.includes(id);
            }
          });
        }).filter(index => index !== -1)
      : draggedColumnId
        ? [columnItems.findIndex(item => 
            item.classList.contains('column-item') && 
            item.getAttribute('data-column-id') === draggedColumnId
          )]
        : [];
    
    // If dragging a group, find its index
    if (draggedColumnGroup) {
      selectedIndices.push(columnItems.findIndex(item => 
        item.classList.contains('group-container-selected') && 
        item.getAttribute('data-group-name') === draggedColumnGroup
      ));
    }
    
    // Mouse position relative to container
    const mouseY = e.clientY - containerRect.top;
    
    // Find the index where we should insert
    for (let i = 0; i < columnItems.length; i++) {
      // Skip if this is a selected item being dragged
      if (selectedIndices.includes(i)) continue;
      
      const rect = columnItems[i].getBoundingClientRect();
      const itemTop = rect.top - containerRect.top;
      const itemHeight = rect.height;
      const middleY = itemTop + (itemHeight / 2);
      
      if (mouseY < middleY) {
        return i;
      }
    }
    
    // If mouse is below all items, drop at the end
    return columnItems.length;
  };

  // Calculate drop index for a specific column position
  const calculateColumnDropIndex = (columnIndex: number) => {
    // Get flat list of columns in current order
    const orderedColumns = selectedColumns.map(col => col.field);
    
    // Return the actual index in the flat list
    return columnIndex;
  };

  // Drag handlers for columns in available panel
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, column: ExtendedColDef, isAvailable: boolean) => {
    // Set the column being dragged in state
    setDraggedColumnId(column.field);
    setDraggedGroupPath(null);
    setDraggedColumnGroup(null);
    
    // Check if this column is part of a multi-selection
    const isMultiSelection = selectedItems.includes(column.field) && selectedItems.length > 1;
    
    // Find which group this column belongs to (if any)
    let sourceGroup: string | null = null;
    if (!isAvailable) {
      const group = localColumnGroups.find(g => g.children.includes(column.field));
      if (group) {
        sourceGroup = group.headerName;
      }
    }
    
    // Prepare data for drag operation
    const dragData = {
      type: 'column',
      columnId: column.field,
      sourcePanel: isAvailable ? 'available' : 'selected',
      sourceGroup: sourceGroup,
      isMultiSelection,
      selectedItems: isMultiSelection ? selectedItems : [column.field]
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

  // Drag handler for groups in available panel
  const handleGroupDragStart = (e: React.DragEvent<HTMLDivElement>, groupPath: string) => {
    e.stopPropagation();
    
    // Set the group being dragged in state
    setDraggedGroupPath(groupPath);
    setDraggedColumnId(null);
    setDraggedColumnGroup(null);
    
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

  // Drag handler for groups in selected panel
  const handleSelectedGroupDragStart = (e: React.DragEvent<HTMLDivElement>, groupName: string) => {
    e.stopPropagation();
    
    // Set the group being dragged in state
    setDraggedColumnGroup(groupName);
    setDraggedColumnId(null);
    setDraggedGroupPath(null);
    
    // Find the group
    const group = localColumnGroups.find(g => g.headerName === groupName);
    
    if (!group) return;
    
    // Prepare data for drag operation
    const dragData = {
      type: 'selected_group',
      groupName: groupName,
      groupChildren: group.children,
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

  // Update drag over to handle group columns
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, panel: string, groupPath?: string, groupName?: string) => {
    e.preventDefault();
    
    // Set the drop effect
    e.dataTransfer.dropEffect = 'move';
    
    // Set current drop target panel
    setDropTarget(panel);
    
    // If dragging over a group in the available panel, highlight it
    if (groupPath && panel === 'available') {
      setGroupDropTarget(groupPath);
    } else {
      setGroupDropTarget(null);
    }
    
    // If dragging over a group in the selected panel, highlight it
    if (groupName && panel === 'selected') {
      setSelectedGroupDropTarget(groupName);
      
      // If we're dragging a column and hovering over a group's contents, calculate the group-specific drop index
      if (draggedColumnId) {
        const groupDropIndex = calculateGroupColumnDropIndex(groupName, e);
        setGroupDropIndicatorIndices({
          ...groupDropIndicatorIndices,
          [groupName]: groupDropIndex
        });
      }
    } else if (panel === 'selected') {
      // Check if we're hovering over a group's content area
      const { isGroupContent, groupName: hoveredGroupName } = detectDropArea(e);
      
      if (isGroupContent && hoveredGroupName) {
        setSelectedGroupDropTarget(hoveredGroupName);
        const groupDropIndex = calculateGroupColumnDropIndex(hoveredGroupName, e);
        setGroupDropIndicatorIndices({
          ...groupDropIndicatorIndices,
          [hoveredGroupName]: groupDropIndex
        });
      } else {
        setSelectedGroupDropTarget(null);
        resetGroupDropIndicators();
      }
    } else {
      setSelectedGroupDropTarget(null);
      resetGroupDropIndicators();
    }
    
    if (panel === 'selected' && !groupName) {
      // Calculate drop index directly based on mouse position if not explicitly over a group
      // but first check if we're over a group's content area
      const { isGroupContent } = detectDropArea(e);
      
      if (!isGroupContent) {
        // Reset group drop indicators when dragging over the main panel
        resetGroupDropIndicators();
        
        // Calculate drop index based on mouse position
        const index = calculateDropIndex(e);
        
        // Update the dropIndicatorIndex state only if it has changed
        if (index !== dropIndicatorIndex) {
          setDropIndicatorIndex(index);
        }
      }
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
    setSelectedGroupDropTarget(null);
    resetGroupDropIndicators();
  };

// Modified handleDrop function in ColumnPanel.tsx to fix group reordering issue
const handleDrop = (e: React.DragEvent<HTMLDivElement>, panel: string, groupPath?: string, groupName?: string) => {
  e.preventDefault();
  
  // Parse the drag data
  let dragData;
  try {
    dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
  } catch (error) {
    console.error('Invalid drag data');
    return;
  }
  
  // Calculate the final drop index at the time of drop for selected panel
  const finalDropIndex = panel === 'selected' ? calculateDropIndex(e) : -1;
  const columnDropIndex = panel === 'selected' ? calculateColumnDropIndex(finalDropIndex) : -1;
  
  // If dropping within a group, calculate the group-specific drop index
  let groupDropIndex = -1;
  if (panel === 'selected' && groupName) {
    groupDropIndex = calculateGroupColumnDropIndex(groupName, e);
  }
  
  console.log(`Drop at index ${columnDropIndex} in ${panel} panel`);
  if (groupPath) console.log(`Onto group path: ${groupPath}`);
  if (groupName) console.log(`Onto group: ${groupName} at index ${groupDropIndex}`);
  
  // Handle different drag data types
  if (dragData.type === 'column') {
    const { columnId, sourcePanel, isMultiSelection, selectedItems: draggedItems } = dragData;
    
    // Handle dropping onto a group in the available panel
    if (groupPath && panel === 'available') {
      const pathSegments = groupPath.split('.');
      addToGroup(pathSegments, draggedItems);
    } 
    // Handle dropping onto a group in the selected panel
    else if (groupName && panel === 'selected') {
      // Check if this is reordering within the same group
      const isReorderingInGroup = sourcePanel === 'selected' && 
        localColumnGroups.some(g => 
          g.headerName === groupName && 
          draggedItems.some(id => g.children.includes(id))
        );
      
      if (isReorderingInGroup) {
        // Reorder columns within the group
        reorderColumnInGroup(groupName, columnId, groupDropIndex);
      } else {
        // Add columns to the selected group
        if (sourcePanel === 'available') {
          // First move columns from available to selected
          moveToSelected(draggedItems);
          // Then add them to the group
          addToSelectedGroup(groupName, draggedItems);
        } else if (sourcePanel === 'selected') {
          // If columns are from the same panel, just add them to the group
          // First remove them from any other groups they might be in
          const otherGroups = localColumnGroups.filter(g => g.headerName !== groupName);
          for (const group of otherGroups) {
            if (draggedItems.some(id => group.children.includes(id))) {
              removeFromSelectedGroup(group.headerName, draggedItems);
            }
          }
          // Then add them to the target group
          addToSelectedGroup(groupName, draggedItems);
        }
      }
    }
    // Handle standard panel drops
    else if (sourcePanel === 'available' && panel === 'selected') {
      // Move from available to selected at the calculated drop index
      moveToSelected(draggedItems, columnDropIndex);
    } else if (sourcePanel === 'selected' && panel === 'available') {
      // Move from selected to available
      moveToAvailable(draggedItems);
    } else if (sourcePanel === 'selected' && panel === 'selected') {
      // Find the current group the column belongs to (if any)
      const fromGroup = localColumnGroups.find(group => 
        draggedItems.some(id => group.children.includes(id))
      );
      
      // Determine if we're dropping inside a group's content area
      const isDroppedInGroupContent = e.target && 
        (e.target as HTMLElement).closest('.group-columns-container') !== null;
      
      // Determine target group name from the DOM if dropping in a group's content
      const targetGroupElement = (e.target as HTMLElement).closest('.group-container-selected');
      const targetGroupName = targetGroupElement ? 
        targetGroupElement.getAttribute('data-group-name') : null;
      
      if (fromGroup && targetGroupName && fromGroup.headerName === targetGroupName) {
        // If dragging within the same group, just reorder within that group
        reorderColumnInGroup(fromGroup.headerName, columnId, 
          calculateGroupColumnDropIndex(fromGroup.headerName, e));
      } else if (fromGroup && !isDroppedInGroupContent) {
        // If dragging from a group to outside any group, remove from group first
        removeFromSelectedGroup(fromGroup.headerName, draggedItems);
        // Then reorder in the main panel
        reorderColumn(columnId, columnDropIndex);
      } else if (!fromGroup && !isDroppedInGroupContent) {
        // If dragging outside of any group and not dropped in a group, just reorder
        reorderColumn(columnId, columnDropIndex);
      }
      // Note: if dragging to a different group, it's handled by the group drop case above
    }
  } 
  // Handle group drops from available panel
  else if (dragData.type === 'group') {
    const { groupPath: draggedGroup } = dragData;
    
    if (panel === 'selected') {
      // Move all columns from the group to selected panel
      moveGroupToSelected(draggedGroup, columnDropIndex);
    }
  }
  // Handle group drops from selected panel
  else if (dragData.type === 'selected_group') {
    const { groupName: draggedGroupName, groupChildren } = dragData;
    
    if (panel === 'selected') {
      if (groupName && groupName !== draggedGroupName) {
        // Dropping onto another group - merge groups
        const confirmMerge = window.confirm(
          `Do you want to merge group "${draggedGroupName}" into "${groupName}"?`
        );
        
        if (confirmMerge) {
          // First add all columns from dragged group to target group
          addToSelectedGroup(groupName, groupChildren);
          // Then remove the original group
          const updatedGroups = localColumnGroups.filter(g => g.headerName !== draggedGroupName);
          setLocalColumnGroups(updatedGroups);
          onColumnGroupChanged(draggedGroupName, 'REMOVE');
        }
      } else {
        // Reorder the group to a new position
        reorderGroup(draggedGroupName, columnDropIndex);
      }
    } else if (panel === 'available') {
      // Move the entire group to available
      moveToAvailable(groupChildren);
      
      // Remove the group
      const updatedGroups = localColumnGroups.filter(g => g.headerName !== draggedGroupName);
      setLocalColumnGroups(updatedGroups);
      onColumnGroupChanged(draggedGroupName, 'REMOVE');
    }
  }
  
  // Reset drop indicators and dragged state
  setDropTarget(null);
  setDropIndicatorIndex(-1);
  setDraggedColumnId(null);
  setDraggedGroupPath(null);
  setDraggedColumnGroup(null);
  setGroupDropTarget(null);
  setSelectedGroupDropTarget(null);
  resetGroupDropIndicators();
};

  // Handle right-click for context menu
  const handleContextMenu = (e: React.MouseEvent, groupPath?: string, inSelectedPanel = false, groupName?: string) => {
    e.preventDefault();
    
    if (inSelectedPanel) {
      // Only show context menu in selected panel if items are selected
      if (selectedItems.length === 0 || !selectedColumns.some(col => selectedItems.includes(col.field))) return;
      
      // Position the context menu at the mouse coordinates
      setContextMenuPosition({
        x: e.clientX,
        y: e.clientY
      });
      
      // Set target group if right-clicking on a group
      setContextMenuTargetGroup(groupName || null);
      
    } else {
      // Only show context menu in available panel if items are selected
      if (selectedItems.length === 0 || !availableColumns.some(col => selectedItems.includes(col.field))) return;
      
      // Position the context menu at the mouse coordinates
      setContextMenuPosition({
        x: e.clientX,
        y: e.clientY
      });
      
      // Set target group if right-clicking on a group
      setContextMenuTargetGroup(groupPath || null);
    }
  };

  // Close context menu
  const closeContextMenu = () => {
    setContextMenuPosition(null);
    setContextMenuTargetGroup(null);
  };

  // Handle creating a new group from context menu in available panel
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

  // Handle creating a new group from context menu in selected panel
  const handleCreateSelectedGroup = () => {
    // Only create groups in selected panel
    const selectedPanelItems = selectedItems.filter(id => 
      selectedColumns.some(col => col.field === id)
    );
    
    if (selectedPanelItems.length === 0) return;
    
    // Prompt for group name
    const groupName = prompt('Enter name for new group:');
    if (!groupName) return;
    
    if (contextMenuTargetGroup) {
      // Add to existing group
      addToSelectedGroup(contextMenuTargetGroup, selectedPanelItems);
    } else {
      // Create new group
      createSelectedColumnGroup(groupName, selectedPanelItems);
    }
    
    closeContextMenu();
  };

  // Handle removing from a group in the selected panel
  const handleRemoveFromGroup = () => {
    if (!contextMenuTargetGroup || selectedItems.length === 0) return;
    
    // Remove from the group
    removeFromSelectedGroup(contextMenuTargetGroup, selectedItems);
    
    closeContextMenu();
  };

  // Render column item
  const renderColumnItem = (column: ExtendedColDef, index: number, isAvailable: boolean) => {
    return (
      <div
        key={column.field}
        className={`column-item draggable ${selectedItems.includes(column.field) ? 'selected' : ''} ${column.field === draggedColumnId ? 'dragging' : ''}`}
        data-column-id={column.field}
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
        onContextMenu={(e) => handleContextMenu(e, undefined, !isAvailable)}
        draggable
        onDragStart={(e) => handleDragStart(e, column, isAvailable)}
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

  // Render selected columns with groups
  const renderSelectedColumns = () => {
    // Get organized structure with groups
    const organizedStructure = organizeSelectedColumnsByGroups();
    
    return (
      <>
        {/* Drop indicator at the top */}
        {dropIndicatorIndex === 0 && (
          <div className="drop-indicator"></div>
        )}
        
        {organizedStructure.map((item, index) => {
          if (item.type === 'column') {
            // Render individual column
            return (
              <React.Fragment key={item.field}>
                {renderColumnItem(item.column!, index, false)}
                {/* Drop indicator after this item */}
                {dropIndicatorIndex === index + 1 && (
                  <div className="drop-indicator"></div>
                )}
              </React.Fragment>
            );
          } else if (item.type === 'group') {
            // Render column group
            const isExpanded = expandedSelectedGroups.has(item.headerName);
            const isDropTarget = selectedGroupDropTarget === item.headerName;
            const isDragging = draggedColumnGroup === item.headerName;
            const groupDropIndicatorIndex = groupDropIndicatorIndices[item.headerName];
            
            return (
              <div 
                key={item.headerName} 
                className={`group-container-selected ${isDragging ? 'dragging' : ''}`}
                data-group-name={item.headerName}
              >
                <div 
                  className={`selected-group-header ${isDropTarget ? 'group-drop-target' : ''}`}
                  draggable
                  onDragStart={(e) => handleSelectedGroupDragStart(e, item.headerName)}
                  onDragOver={(e) => handleDragOver(e, 'selected', undefined, item.headerName)}
                  onDrop={(e) => handleDrop(e, 'selected', undefined, item.headerName)}
                  onContextMenu={(e) => handleContextMenu(e, undefined, true, item.headerName)}
                >
                  <span 
                    className="expand-icon"
                    onClick={(e) => toggleSelectedGroup(e, item.headerName)}
                  >
                    {isExpanded ? '−' : '+'}
                  </span>
                  <span className="group-name">{item.headerName}</span>
                  <span className="group-count">({item.columns?.length || 0})</span>
                </div>
                
                {isExpanded && item.columns && (
                  <div className="group-columns-container">
                    {/* Drop indicator at the top of group columns if index is 0 */}
                    {groupDropIndicatorIndex === 0 && (
                      <div className="drop-indicator group-drop-indicator"></div>
                    )}
                    
                    {item.columns.map((column, colIndex) => (
                      <React.Fragment key={column.field}>
                        <div 
                          className={`column-item draggable indented ${selectedItems.includes(column.field) ? 'selected' : ''} ${column.field === draggedColumnId ? 'dragging' : ''}`}
                          data-column-id={column.field}
                          data-index={colIndex}
                          style={{ paddingLeft: '30px' }}
                          onClick={(e) => handleSelect(
                            column.field, 
                            e.ctrlKey || e.metaKey, 
                            e.shiftKey
                          )}
                          onDoubleClick={() => {
                            handleSelect(column.field, false, false);
                            moveToAvailable([column.field]);
                          }}
                          onContextMenu={(e) => handleContextMenu(e, undefined, true, item.headerName)}
                          draggable
                          onDragStart={(e) => handleDragStart(e, column, false)}
                          onDragOver={(e) => handleDragOver(e, 'selected', undefined, item.headerName)}
                        >
                          {column.headerName || column.field}
                        </div>
                        
                        {/* Drop indicator after this column */}
                        {groupDropIndicatorIndex === colIndex + 1 && (
                          <div className="drop-indicator group-drop-indicator"></div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}
                
                {/* Drop indicator after this group */}
                {dropIndicatorIndex === index + 1 && (
                  <div className="drop-indicator"></div>
                )}
              </div>
            );
          }
          
          return null;
        })}
        
        {/* If list is empty, show drop indicator in empty state */}
        {selectedColumns.length === 0 && dropIndicatorIndex === 0 && (
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
              onContextMenu={(e) => handleContextMenu(e, undefined, true)}
            >
              <div className="columns-list">
                {renderSelectedColumns()}
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
            {selectedItems.length > 0 && selectedItems.some(id => selectedColumns.some(col => col.field === id)) && (
              <button onClick={handleCreateSelectedGroup}>
                Create Group
              </button>
            )}
            <button 
              onClick={clearAll} 
              disabled={selectedColumns.length === 0}
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Context Menu */}
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
          {/* Context menu items for available panel */}
          {!selectedItems.some(id => selectedColumns.some(col => col.field === id)) && (
            <div className="context-menu-item" onClick={handleCreateGroup}>
              {contextMenuTargetGroup ? `Add to ${contextMenuTargetGroup.split('.').pop()}` : 'Create New Group'}
            </div>
          )}

          {/* Context menu items for selected panel */}
          {selectedItems.some(id => selectedColumns.some(col => col.field === id)) && (
            <>
              <div className="context-menu-item" onClick={handleCreateSelectedGroup}>
                {contextMenuTargetGroup ? `Add to ${contextMenuTargetGroup}` : 'Create New Group'}
              </div>
              {contextMenuTargetGroup && (
                <div className="context-menu-item" onClick={handleRemoveFromGroup}>
                  Remove from {contextMenuTargetGroup}
                </div>
              )}
            </>
          )}

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