import React, { useState, useEffect, useRef } from 'react';
import { ExtendedColDef, OperationType } from '../types';
import { getAllColumnsInGroup } from '../ColumnPanel/utils/treeUtils';
import AvailablePanel from '../ColumnPanel/components/AvailablePanel';
import SelectedPanel from '../ColumnPanel/components/SelectedPanel';

interface GroupPanel1Props {
  groupsCols: ExtendedColDef[];
  selectedGroups: string[];
  onGroupChanged?: (selectedGroups: ExtendedColDef[], operationType: OperationType) => void;
}

const GroupPanel1: React.FC<GroupPanel1Props> = ({
  groupsCols,
  selectedGroups,
  onGroupChanged
}) => {
  // State for available and selected groups
  const [availableGroups, setAvailableGroups] = useState<ExtendedColDef[]>([]);
  const [selectedGroupColumns, setSelectedGroupColumns] = useState<ExtendedColDef[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedSelectedGroups, setExpandedSelectedGroups] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // State for drag and drop
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [draggedGroupPath, setDraggedGroupPath] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number>(-1);
  const [draggedColumnGroup, setDraggedColumnGroup] = useState<string | null>(null);
  const [groupDropTarget, setGroupDropTarget] = useState<string | null>(null);
  const [selectedGroupDropTarget, setSelectedGroupDropTarget] = useState<string | null>(null);
  const [groupDropIndicatorIndices, setGroupDropIndicatorIndices] = useState<{[groupName: string]: number}>({});
  
  // Refs for panels
  const availablePanelRef = useRef<HTMLDivElement | null>(null);
  const selectedPanelRef = useRef<HTMLDivElement | null>(null);
  
  // Refs for tracking reordering state
  const isReorderingRef = useRef<boolean>(false);
  const lastReorderTimeRef = useRef<number>(0);
  
  // Initialize available and selected columns
  useEffect(() => {
    // Filter groups that are not in selectedGroups for available panel
    const available = groupsCols.filter(col => !selectedGroups.includes(col.field));
    // Filter groups that are in selectedGroups for selected panel
    const selected = groupsCols.filter(col => selectedGroups.includes(col.field));
    
    setAvailableGroups(available);
    setSelectedGroupColumns(selected);
  }, [groupsCols, selectedGroups]);
  
  // Reset drag state
  const resetDragState = () => {
    setDropTarget(null);
    setDropIndicatorIndex(-1);
    setDraggedColumnId(null);
    setDraggedGroupPath(null);
    setDraggedColumnGroup(null);
    setGroupDropTarget(null);
    setSelectedGroupDropTarget(null);
    setGroupDropIndicatorIndices({});
  };
  
  // Handle selection of a column
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
        const allColumns = [...availableGroups, ...selectedGroupColumns];
        
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
  
  // Clear selection
  const clearSelection = () => {
    setSelectedItems([]);
  };
  
  // Toggle group expansion
  const toggleGroup = (e: React.MouseEvent, groupPath: string) => {
    e.stopPropagation();
    
    const newExpandedGroups = new Set(expandedGroups);
    
    if (newExpandedGroups.has(groupPath)) {
      newExpandedGroups.delete(groupPath);
    } else {
      newExpandedGroups.add(groupPath);
    }
    
    setExpandedGroups(newExpandedGroups);
  };
  
  // Toggle group expansion in selected panel
  const toggleSelectedGroup = (e: React.MouseEvent, groupName: string) => {
    e.stopPropagation();
    
    const newExpandedGroups = new Set(expandedSelectedGroups);
    
    if (newExpandedGroups.has(groupName)) {
      newExpandedGroups.delete(groupName);
    } else {
      newExpandedGroups.add(groupName);
    }
    
    setExpandedSelectedGroups(newExpandedGroups);
  };
  
  // Move selected items to the selected panel
  const moveToSelected = (columnIds: string[] = selectedItems) => {
    if (columnIds.length === 0) return;
    
    // Find columns in available that are selected
    const columnsToMove = availableGroups.filter(col => 
      columnIds.includes(col.field)
    );
    
    if (columnsToMove.length === 0) return;
    
    // Remove columns from available
    const newAvailableGroups = availableGroups.filter(col => 
      !columnIds.includes(col.field)
    );
    
    // Add columns to selected
    const newSelectedGroups = [...selectedGroupColumns, ...columnsToMove];
    
    // Update state
    setAvailableGroups(newAvailableGroups);
    setSelectedGroupColumns(newSelectedGroups);
    clearSelection();
    
    // Notify parent
    if (onGroupChanged) {
      onGroupChanged(newSelectedGroups, 'ADD');
    }
  };
  
  // Move a group to the selected panel
  const moveGroupToSelected = (groupPath: string) => {
    // Get all columns in this group and subgroups
    const groupColumns = getAllColumnsInGroup(availableGroups, groupPath);
    
    // Extract column IDs
    const columnIds = groupColumns.map(col => col.field);
    
    if (columnIds.length === 0) return;
    
    // Use the standard moveToSelected function
    moveToSelected(columnIds);
  };
  
  // Move selected items to the available panel
  const moveToAvailable = (columnIds: string[] = selectedItems) => {
    if (columnIds.length === 0) return;
    
    // Find columns in selected that are selected
    const columnsToMove = selectedGroupColumns.filter(col => 
      columnIds.includes(col.field)
    );
    
    if (columnsToMove.length === 0) return;
    
    // Remove columns from selected
    const newSelectedGroups = selectedGroupColumns.filter(col => 
      !columnIds.includes(col.field)
    );
    
    // Add columns to available
    const newAvailableGroups = [...availableGroups, ...columnsToMove];
    
    // Update state
    setAvailableGroups(newAvailableGroups);
    setSelectedGroupColumns(newSelectedGroups);
    clearSelection();
    
    // Notify parent
    if (onGroupChanged) {
      onGroupChanged(newSelectedGroups, 'REMOVED');
    }
  };
  
  // Clear all selected items
  const clearAll = () => {
    if (selectedGroupColumns.length === 0) return;
    
    // Move all selected items to available
    const newAvailableGroups = [...availableGroups, ...selectedGroupColumns];
    
    // Update state
    setAvailableGroups(newAvailableGroups);
    setSelectedGroupColumns([]);
    clearSelection();
    
    // Notify parent
    if (onGroupChanged) {
      onGroupChanged([], 'REMOVED');
    }
  };
  
  // Move selected items up in the order
  const moveUp = () => {
    if (selectedItems.length === 0) return;
    
    const newSelectedGroups = [...selectedGroupColumns];
    const indices = selectedItems
      .map(id => newSelectedGroups.findIndex(col => col.field === id))
      .filter(index => index !== -1)
      .sort((a, b) => a - b);
    
    // Can't move up if the first selected item is already at the top
    if (indices[0] === 0) return;
    
    // Move each selected item up one position
    indices.forEach(index => {
      const temp = newSelectedGroups[index];
      newSelectedGroups[index] = newSelectedGroups[index - 1];
      newSelectedGroups[index - 1] = temp;
    });
    
    setSelectedGroupColumns(newSelectedGroups);
    
    // Notify parent
    if (onGroupChanged) {
      onGroupChanged(newSelectedGroups, 'REORDERED');
    }
  };
  
  // Move selected items down in the order
  const moveDown = () => {
    if (selectedItems.length === 0) return;
    
    const newSelectedGroups = [...selectedGroupColumns];
    const indices = selectedItems
      .map(id => newSelectedGroups.findIndex(col => col.field === id))
      .filter(index => index !== -1)
      .sort((a, b) => b - a); // Sort in descending order for moving down
    
    // Can't move down if the last selected item is already at the bottom
    if (indices[0] === newSelectedGroups.length - 1) return;
    
    // Move each selected item down one position
    indices.forEach(index => {
      const temp = newSelectedGroups[index];
      newSelectedGroups[index] = newSelectedGroups[index + 1];
      newSelectedGroups[index + 1] = temp;
    });
    
    setSelectedGroupColumns(newSelectedGroups);
    
    // Notify parent
    if (onGroupChanged) {
      onGroupChanged(newSelectedGroups, 'REORDERED');
    }
  };
  
  // Reorder selected items based on drag and drop
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
      .map(id => selectedGroupColumns.findIndex(col => col.field === id))
      .filter(index => index !== -1)
      .sort((a, b) => a - b); // Sort in ascending order
    
    if (columnIndices.length === 0 || targetIndex < 0) return;
    
    console.log(`Reordering columns [${columnsToMove.join(', ')}] to index ${targetIndex}`);
    
    // Mark that we are reordering
    isReorderingRef.current = true;
    
    // Create a deep copy to avoid mutation issues
    const columnsCopy = JSON.parse(JSON.stringify(selectedGroupColumns));
    
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
    setSelectedGroupColumns(columnsCopy);
    
    // Notify parent about the reordering
    if (onGroupChanged) {
      onGroupChanged(columnsCopy, 'REORDERED');
    }
    
    // Reset the reordering flag after a delay to allow state updates to complete
    setTimeout(() => {
      isReorderingRef.current = false;
    }, 100);
  };
  
  // Handle drag start for a column
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, column: ExtendedColDef, isAvailable: boolean) => {
    setDraggedColumnId(column.field);
    setDraggedGroupPath(null);
    setDraggedColumnGroup(null);
    
    const isMultiSelection = selectedItems.includes(column.field) && selectedItems.length > 1;
    
    const dragData = {
      type: 'column',
      columnId: column.field,
      sourcePanel: isAvailable ? 'available' : 'selected',
      isMultiSelection,
      selectedItems: isMultiSelection ? selectedItems : [column.field]
    };
    
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  };
  
  // Handle drag start for a group
  const handleGroupDragStart = (e: React.DragEvent<HTMLDivElement>, groupPath: string) => {
    e.stopPropagation();
    
    setDraggedGroupPath(groupPath);
    setDraggedColumnId(null);
    setDraggedColumnGroup(null);
    
    const dragData = {
      type: 'group',
      groupPath: groupPath,
      sourcePanel: 'available'
    };
    
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  };
  
  // Handle drag start for a column group in selected panel
  const handleSelectedGroupDragStart = (e: React.DragEvent<HTMLDivElement>, groupName: string) => {
    e.stopPropagation();
    
    setDraggedColumnGroup(groupName);
    setDraggedColumnId(null);
    setDraggedGroupPath(null);
    
    const dragData = {
      type: 'selected_group',
      groupName: groupName,
      sourcePanel: 'selected'
    };
    
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  };
  
  // Handler for column operations (for use with SelectedPanel)
  const handleColumnOperations = {
    moveToAvailable,
    moveUp,
    moveDown,
    clearAll
  };
  
  // Return empty handlers for context menu and group operations
  const emptyContextMenuHandler = (e: React.MouseEvent) => {
    e.preventDefault();
  };
  
  // No-operation function for unimplemented features
  const noop = (...args: any[]): void => {
    // This function intentionally does nothing
    // Used as a placeholder for unimplemented features
  };
  
  const handleCreateGroup = noop;
  const handleCreateSelectedGroup = noop;
  const handleRemoveFromGroup = noop;
  
  // Create empty column groups for SelectedPanel
  const emptyColumnGroups: any[] = [];
  
  return (
    <div className="column-panel">
      <div className="panel-container">
        <AvailablePanel
          availableColumns={availableGroups}
          selectedItems={selectedItems}
          expandedGroups={expandedGroups}
          draggedColumnId={draggedColumnId}
          draggedGroupPath={draggedGroupPath}
          groupDropTarget={groupDropTarget}
          dropTarget={dropTarget}
          availablePanelRef={availablePanelRef}
          onSelect={handleSelect}
          onMoveToSelected={moveToSelected}
          onCreateGroup={handleCreateGroup}
          onDragStart={handleDragStart}
          onGroupDragStart={handleGroupDragStart}
          onDragOver={noop}
          onDragLeave={noop}
          onDrop={noop}
          onContextMenu={emptyContextMenuHandler}
          onToggleGroup={toggleGroup}
        />

        <SelectedPanel
          selectedColumns={selectedGroupColumns}
          selectedItems={selectedItems}
          columnGroups={emptyColumnGroups}
          expandedSelectedGroups={expandedSelectedGroups}
          draggedColumnId={draggedColumnId}
          draggedColumnGroup={draggedColumnGroup}
          selectedGroupDropTarget={selectedGroupDropTarget}
          dropTarget={dropTarget}
          dropIndicatorIndex={dropIndicatorIndex}
          groupDropIndicatorIndices={groupDropIndicatorIndices}
          selectedPanelRef={selectedPanelRef}
          onSelect={handleSelect}
          onMoveToAvailable={moveToAvailable}
          onMoveUp={moveUp}
          onMoveDown={moveDown}
          onClearAll={clearAll}
          onCreateSelectedGroup={handleCreateSelectedGroup}
          onDragStart={handleDragStart}
          onSelectedGroupDragStart={handleSelectedGroupDragStart}
          onDragOver={noop}
          onDragLeave={noop}
          onDrop={noop}
          onContextMenu={emptyContextMenuHandler}
          onToggleSelectedGroup={toggleSelectedGroup}
        />
      </div>
    </div>
  );
};

export default GroupPanel1;