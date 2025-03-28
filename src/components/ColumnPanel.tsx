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
  
  // State to track which panel is the current drop target
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  
  // State to track the currently dragged column
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  
  // State to track the currently dragged group
  const [draggedGroupPath, setDraggedGroupPath] = useState<string | null>(null);
  
  // State for group drop target (for when dragging onto a group)
  const [groupDropTarget, setGroupDropTarget] = useState<string | null>(null);
  
  // State for context menu
  const [contextMenuPosition, setContextMenuPosition] = useState<{x: number, y: number} | null>(null);
  const [contextMenuTargetGroup, setContextMenuTargetGroup] = useState<string | null>(null);
  
  // Flag to prevent multiple state updates during reordering
  const isReorderingRef = useRef<boolean>(false);
  
  // Last reordering operation timestamp to prevent duplicates
  const lastReorderTimeRef = useRef<number>(0);
  
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

  // Function to organize columns into a tree structure
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
    
    // Update local state
    setAvailableColumns(newAvailableColumns);
    setSelectedColumns(newSelectedColumns);
    setSelectedItems([]);
    
    // Notify parent component about the updated columns
    onColumnChanged(newSelectedColumns, 'REMOVED');
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
    
    setAvailableColumns(newAvailableColumns);
    setSelectedColumns([]);
    setSelectedItems([]);
    
    // Notify parent component that all columns were removed
    onColumnChanged([], 'REMOVED');
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
      columnsList.querySelectorAll('.column-item')
    );
    if (columnItems.length === 0) return 0;
    
    // If we're dragging multiple columns, we need to filter out all selected items
    const selectedIndices = selectedItems.includes(draggedColumnId || '')
      ? selectedItems.map(id => selectedColumns.findIndex(col => col.field === id))
      : draggedColumnId
        ? [selectedColumns.findIndex(col => col.field === draggedColumnId)]
        : [];
    
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

  // Drag handlers for columns
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, column: ExtendedColDef, isAvailable: boolean) => {
    // Set the column being dragged in state
    setDraggedColumnId(column.field);
    setDraggedGroupPath(null);
    
    // Check if this column is part of a multi-selection
    const isMultiSelection = selectedItems.includes(column.field) && selectedItems.length > 1;
    
    // Prepare data for drag operation
    const dragData = {
      type: 'column',
      columnId: column.field,
      sourcePanel: isAvailable ? 'available' : 'selected',
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

  // Drag handler for groups
  const handleGroupDragStart = (e: React.DragEvent<HTMLDivElement>, groupPath: string) => {
    e.stopPropagation();
    
    // Set the group being dragged in state
    setDraggedGroupPath(groupPath);
    setDraggedColumnId(null);
    
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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, panel: string, groupPath?: string) => {
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
    
    if (panel === 'selected') {
      // Calculate drop index directly based on mouse position
      const index = calculateDropIndex(e);
      
      // Update the dropIndicatorIndex state only if it has changed
      // This prevents unnecessary re-renders
      if (index !== dropIndicatorIndex) {
        setDropIndicatorIndex(index);
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
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, panel: string, groupPath?: string) => {
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
    
    // Handle different drag data types
    if (dragData.type === 'column') {
      const { columnId, sourcePanel, isMultiSelection, selectedItems: draggedItems } = dragData;
      
      // Handle dropping onto a group in the available panel
      if (groupPath && panel === 'available') {
        const pathSegments = groupPath.split('.');
        addToGroup(pathSegments, draggedItems);
      } 
      // Handle standard panel drops
      else if (sourcePanel === 'available' && panel === 'selected') {
        // Move from available to selected at the calculated drop index
        moveToSelected(draggedItems, finalDropIndex);
      } else if (sourcePanel === 'selected' && panel === 'available') {
        // Move from selected to available
        moveToAvailable(draggedItems);
      } else if (sourcePanel === 'selected' && panel === 'selected') {
        // Only reorder if actually changing position
        reorderColumn(columnId, finalDropIndex);
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
    
    // Reset drop indicators and dragged state
    setDropTarget(null);
    setDropIndicatorIndex(-1);
    setDraggedColumnId(null);
    setDraggedGroupPath(null);
    setGroupDropTarget(null);
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
        onContextMenu={(e) => isAvailable && handleContextMenu(e)}
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
                {/* Drop indicator at the top */}
                {dropIndicatorIndex === 0 && (
                  <div className="drop-indicator"></div>
                )}
                
                {/* Render selected columns without groups */}
                {selectedColumns.map((column, index) => (
                  <React.Fragment key={column.field}>
                    {renderColumnItem(column, index, false)}
                    {/* Drop indicator after this item */}
                    {dropIndicatorIndex === index + 1 && (
                      <div className="drop-indicator"></div>
                    )}
                  </React.Fragment>
                ))}
                
                {/* If list is empty, show drop indicator in empty state */}
                {selectedColumns.length === 0 && dropIndicatorIndex === 0 && (
                  <div className="drop-indicator"></div>
                )}
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