import { ExtendedColDef, ColumnGroup, OperationType, ColumnGroupAction } from '../types';
import { detectDropArea, calculateDropIndex, calculateGroupColumnDropIndex } from './utils/dragDropUtils';
import { resetGroupDropIndicators } from './utils/columnUtils';
import GroupUtils from './utils/groupUtils';

/**
 * Factory for creating drag and drop handlers
 */
export const createDragDropHandlers = (
  availableColumns: ExtendedColDef[],
  setAvailableColumns: (columns: ExtendedColDef[]) => void,
  selectedColumns: ExtendedColDef[],
  setSelectedColumns: (columns: ExtendedColDef[]) => void,
  selectedItems: string[],
  clearSelection: () => void,
  columnGroups: ColumnGroup[],
  setColumnGroups: (groups: ColumnGroup[]) => void,
  draggedColumnId: string | null,
  setDraggedColumnId: (id: string | null) => void,
  draggedGroupPath: string | null,
  setDraggedGroupPath: (path: string | null) => void,
  draggedColumnGroup: string | null,
  setDraggedColumnGroup: (group: string | null) => void,
  dropTarget: string | null,
  setDropTarget: (target: string | null) => void,
  setGroupDropTarget: (target: string | null) => void,
  setSelectedGroupDropTarget: (target: string | null) => void,
  setDropIndicatorIndex: (index: number) => void,
  setGroupDropIndicatorIndices: (indices: { [groupName: string]: number }) => void,
  resetDragState: () => void,
  reorderColumn: (columnId: string, targetIndex: number, selectedItems: string[]) => void,
  reorderColumnInGroup: (groupName: string, columnId: string, targetIndex: number, selectedItems: string[], columnGroups: ColumnGroup[]) => {
    updatedGroupChildren: string[];
    newSelectedColumns: ExtendedColDef[];
  } | void,
  reorderGroup: (groupName: string, targetIndex: number, columnGroups: ColumnGroup[]) => void,
  addToSelectedGroup: (groupName: string, columnIds: string[]) => void,
  removeFromSelectedGroup: (groupName: string, columnIds: string[]) => void,
  onColumnChanged: (selectedColumns: ExtendedColDef[], operationType: OperationType) => void,
  onColumnGroupChanged: (headerName: string, action: ColumnGroupAction, replacementName?: string) => void,
  isReorderingRef: React.MutableRefObject<boolean>,
  availablePanelRef: React.RefObject<HTMLDivElement | null>,
  selectedPanelRef: React.RefObject<HTMLDivElement | null>
) => {
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
      const group = columnGroups.find(g => g.children.includes(column.field));
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

  const handleSelectedGroupDragStart = (e: React.DragEvent<HTMLDivElement>, groupName: string) => {
    e.stopPropagation();
    
    // Set the group being dragged in state
    setDraggedColumnGroup(groupName);
    setDraggedColumnId(null);
    setDraggedGroupPath(null);
    
    // Find the group
    const group = columnGroups.find(g => g.headerName === groupName);
    
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
        const groupDropIndex = calculateGroupColumnDropIndex(
          groupName, 
          e, 
          selectedPanelRef,
          draggedColumnId,
          selectedItems
        );
        setGroupDropIndicatorIndices({
          ...resetGroupDropIndicators(),
          [groupName]: groupDropIndex
        });
      }
    } else if (panel === 'selected') {
      // Check if we're hovering over a group's content area
      const { isGroupContent, groupName: hoveredGroupName } = detectDropArea(e);
      
      if (isGroupContent && hoveredGroupName) {
        setSelectedGroupDropTarget(hoveredGroupName);
        const groupDropIndex = calculateGroupColumnDropIndex(
          hoveredGroupName, 
          e, 
          selectedPanelRef,
          draggedColumnId,
          selectedItems
        );
        setGroupDropIndicatorIndices({
          ...resetGroupDropIndicators(),
          [hoveredGroupName]: groupDropIndex
        });
      } else {
        setSelectedGroupDropTarget(null);
        setGroupDropIndicatorIndices(resetGroupDropIndicators());
      }
    } else {
      setSelectedGroupDropTarget(null);
      setGroupDropIndicatorIndices(resetGroupDropIndicators());
    }
    
    if (panel === 'selected' && !groupName) {
      // Calculate drop index directly based on mouse position if not explicitly over a group
      // but first check if we're over a group's content area
      const { isGroupContent } = detectDropArea(e);
      
      if (!isGroupContent) {
        // Reset group drop indicators when dragging over the main panel
        setGroupDropIndicatorIndices(resetGroupDropIndicators());
        
        // Calculate drop index based on mouse position
        const index = calculateDropIndex(
          e, 
          selectedPanelRef,
          selectedItems,
          draggedColumnId,
          draggedColumnGroup,
          columnGroups
        );
        
        // Update the dropIndicatorIndex state only if it has changed
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
    setSelectedGroupDropTarget(null);
    setGroupDropIndicatorIndices(resetGroupDropIndicators());
  };

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
    const finalDropIndex = panel === 'selected' ? calculateDropIndex(
      e, 
      selectedPanelRef,
      selectedItems,
      draggedColumnId,
      draggedColumnGroup,
      columnGroups
    ) : -1;
    const columnDropIndex = finalDropIndex;
    
    // If dropping within a group, calculate the group-specific drop index
    let groupDropIndex = -1;
    if (panel === 'selected' && groupName) {
      groupDropIndex = calculateGroupColumnDropIndex(
        groupName, 
        e, 
        selectedPanelRef,
        draggedColumnId,
        selectedItems
      );
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
        // Call utility to update group assignment for these columns in available panel
        // Note: The implementation of addToGroup should update availableColumns state
      } 
      // Handle dropping onto a group in the selected panel
      else if (groupName && panel === 'selected') {
        // Check if this is reordering within the same group
        const isReorderingInGroup = sourcePanel === 'selected' && 
          columnGroups.some(g => 
            g.headerName === groupName && 
            draggedItems.some(id => g.children.includes(id))
          );
        
        if (isReorderingInGroup) {
          // Reorder columns within the group
          reorderColumnInGroup(groupName, columnId, groupDropIndex, draggedItems, columnGroups);
        } else {
          // Add columns to the selected group
          if (sourcePanel === 'available') {
            // First move columns from available to selected
            const result = GroupUtils.moveToSelected(draggedItems, availableColumns, selectedColumns);
            setAvailableColumns(result.newAvailable);
            setSelectedColumns(result.newSelected);
            onColumnChanged(result.newSelected, 'ADD_AT_INDEX');
            
            // Then add them to the group
            addToSelectedGroup(groupName, draggedItems);
          } else if (sourcePanel === 'selected') {
            // If columns are from the same panel, just add them to the group
            // First remove them from any other groups they might be in
            const otherGroups = columnGroups.filter(g => g.headerName !== groupName);
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
        const result = GroupUtils.moveToSelected(draggedItems, availableColumns, selectedColumns, columnDropIndex);
        setAvailableColumns(result.newAvailable);
        setSelectedColumns(result.newSelected);
        onColumnChanged(result.newSelected, 'ADD_AT_INDEX');
      } else if (sourcePanel === 'selected' && panel === 'available') {
        // Move from selected to available
        const result = GroupUtils.moveToAvailable(draggedItems, availableColumns, selectedColumns, columnGroups);
        setAvailableColumns(result.newAvailable);
        setSelectedColumns(result.newSelected);
        setColumnGroups(result.updatedGroups);
        onColumnChanged(result.newSelected, 'REMOVED');
        
        // Notify parent about removed groups if any were emptied
        columnGroups.forEach(group => {
          const newChildren = group.children.filter(field => !draggedItems.includes(field));
          if (newChildren.length === 0 && group.children.length > 0) {
            onColumnGroupChanged(group.headerName, 'REMOVE');
          }
        });
      } else if (sourcePanel === 'selected' && panel === 'selected') {
        // Find the current group the column belongs to (if any)
        const fromGroup = columnGroups.find(group => 
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
          reorderColumnInGroup(
            fromGroup.headerName, 
            columnId, 
            calculateGroupColumnDropIndex(
              fromGroup.headerName, 
              e, 
              selectedPanelRef, 
              draggedColumnId, 
              selectedItems
            ), 
            draggedItems, 
            columnGroups
          );
        } else if (fromGroup && !isDroppedInGroupContent) {
          // If dragging from a group to outside any group, remove from group first
          removeFromSelectedGroup(fromGroup.headerName, draggedItems);
          // Then reorder in the main panel
          reorderColumn(columnId, columnDropIndex, draggedItems);
        } else if (!fromGroup && !isDroppedInGroupContent) {
          // If dragging outside of any group and not dropped in a group, just reorder
          reorderColumn(columnId, columnDropIndex, draggedItems);
        }
        // Note: if dragging to a different group, it's handled by the group drop case above
      }
    } 
    // Handle group drops from available panel
    else if (dragData.type === 'group') {
      const { groupPath: draggedGroup } = dragData;
      
      if (panel === 'selected') {
        // Move all columns from the group to selected panel
        const result = GroupUtils.moveGroupToSelected(
          draggedGroup, 
          availableColumns, 
          selectedColumns, 
          columnDropIndex
        );
        setAvailableColumns(result.newAvailable);
        setSelectedColumns(result.newSelected);
        onColumnChanged(result.newSelected, 'ADD_AT_INDEX');
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
            const updatedGroups = columnGroups.filter(g => g.headerName !== draggedGroupName);
            setColumnGroups(updatedGroups);
            onColumnGroupChanged(draggedGroupName, 'REMOVE');
          }
        } else {
          // Reorder the group to a new position
          reorderGroup(draggedGroupName, columnDropIndex, columnGroups);
        }
      } else if (panel === 'available') {
        // Move the entire group to available
        const result = GroupUtils.moveToAvailable(
          groupChildren, 
          availableColumns, 
          selectedColumns, 
          columnGroups
        );
        setAvailableColumns(result.newAvailable);
        setSelectedColumns(result.newSelected);
        setColumnGroups(result.updatedGroups);
        onColumnChanged(result.newSelected, 'REMOVED');
        
        // Remove the group
        onColumnGroupChanged(draggedGroupName, 'REMOVE');
      }
    }
    
    // Reset drop indicators and dragged state
    resetDragState();
    clearSelection();
  };

  return {
    handleDragStart,
    handleGroupDragStart,
    handleSelectedGroupDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
};

/**
 * Factory for creating column operations handlers
 */
export const createColumnOperationHandlers = (
  availableColumns: ExtendedColDef[],
  setAvailableColumns: (columns: ExtendedColDef[]) => void,
  selectedColumns: ExtendedColDef[],
  setSelectedColumns: (columns: ExtendedColDef[]) => void,
  columnGroups: ColumnGroup[],
  setColumnGroups: (groups: ColumnGroup[]) => void,
  selectedItems: string[],
  clearSelection: () => void,
  onColumnChanged: (selectedColumns: ExtendedColDef[], operationType: OperationType) => void,
  onColumnGroupChanged: (headerName: string, action: ColumnGroupAction, replacementName?: string) => void,
  addToGroup: (groupPath: string[], columnIds: string[]) => string,
  createNewGroup: (groupName: string, columnIds: string[]) => string,
  toggleGroup: (e: React.MouseEvent, groupPath: string) => void,
  addToSelectedGroup: (groupName: string, columnIds: string[]) => void,
  removeFromSelectedGroup: (groupName: string, columnIds: string[]) => void,
  createSelectedColumnGroup: (groupName: string, columnIds: string[]) => void,
  moveUp: (selectedItems: string[]) => void,
  moveDown: (selectedItems: string[]) => void,
  expandedGroups: Set<string>,
  setExpandedGroups: (groups: Set<string>) => void
) => {
  const moveToSelected = (columnIds: string[] = selectedItems, targetIndex?: number) => {
    if (columnIds.length === 0) return;
    
    const result = GroupUtils.moveToSelected(columnIds, availableColumns, selectedColumns, targetIndex);
    
    // Update local state
    setAvailableColumns(result.newAvailable);
    setSelectedColumns(result.newSelected);
    clearSelection();
    
    // Notify parent component about the updated columns with specific operation type
    onColumnChanged(result.newSelected, 'ADD_AT_INDEX');
  };

  const moveGroupToSelected = (groupPath: string, targetIndex?: number) => {
    const result = GroupUtils.moveGroupToSelected(groupPath, availableColumns, selectedColumns, targetIndex);
    
    // Update local state
    setAvailableColumns(result.newAvailable);
    setSelectedColumns(result.newSelected);
    clearSelection();
    
    // Notify parent component about the updated columns with specific operation type
    onColumnChanged(result.newSelected, 'ADD_AT_INDEX');
  };

  const moveToAvailable = (columnIds: string[] = selectedItems) => {
    if (columnIds.length === 0) return;
    
    const result = GroupUtils.moveToAvailable(columnIds, availableColumns, selectedColumns, columnGroups);
    
    // Update local state
    setAvailableColumns(result.newAvailable);
    setSelectedColumns(result.newSelected);
    setColumnGroups(result.updatedGroups);
    clearSelection();
    
    // Notify parent component about the updated columns
    onColumnChanged(result.newSelected, 'REMOVED');
    
    // Notify parent about group changes if needed
    columnGroups.forEach((group) => {
      const newGroupChildren = group.children.filter(field => !columnIds.includes(field));
      if (newGroupChildren.length !== group.children.length) {
        if (newGroupChildren.length === 0) {
          // Group is now empty, remove it
          onColumnGroupChanged(group.headerName, 'REMOVE');
        } else {
          // Update group with new children
          onColumnGroupChanged(group.headerName, 'UPDATE', group.headerName);
        }
      }
    });
  };

  const clearAll = () => {
    const result = GroupUtils.clearAll(availableColumns, selectedColumns, columnGroups);
    
    // Update state
    setAvailableColumns(result.newAvailable);
    setSelectedColumns([]);
    setColumnGroups([]);
    clearSelection();
    
    // Notify parent component that all columns were removed
    onColumnChanged([], 'REMOVED');
    
    // Notify parent about all groups being removed
    columnGroups.forEach(group => {
      onColumnGroupChanged(group.headerName, 'REMOVE');
    });
  };

  const handleCreateGroup = (groupPath?: string) => {
    // Only create groups in available panel
    const availableSelectedItems = selectedItems.filter(id => 
      availableColumns.some(col => col.field === id)
    );
    
    if (availableSelectedItems.length === 0) return;
    
    // Prompt for group name
    const groupName = prompt('Enter name for new group:');
    if (!groupName) return;
    
    if (groupPath) {
      // Add to existing group
      const pathSegments = groupPath.split('.');
      const newGroupPath = addToGroup(pathSegments, availableSelectedItems);
      
      // Expand the group that columns were added to
      if (!expandedGroups.has(newGroupPath)) {
        const newExpandedGroups = new Set(expandedGroups);
        newExpandedGroups.add(newGroupPath);
        setExpandedGroups(newExpandedGroups);
      }
    } else {
      // Create new group
      const newGroupName = createNewGroup(groupName, availableSelectedItems);
      
      // Expand the new group
      const newExpandedGroups = new Set(expandedGroups);
      newExpandedGroups.add(newGroupName);
      setExpandedGroups(newExpandedGroups);
    }
    
    clearSelection();
  };

  const handleCreateSelectedGroup = (targetGroup?: string) => {
    // Only create groups in selected panel
    const selectedPanelItems = selectedItems.filter(id => 
      selectedColumns.some(col => col.field === id)
    );
    
    if (selectedPanelItems.length === 0) return;
    
    if (targetGroup) {
      // Add to existing group
      addToSelectedGroup(targetGroup, selectedPanelItems);
    } else {
      // Prompt for group name
      const groupName = prompt('Enter name for new group:');
      if (!groupName) return;
      
      // Create new group
      createSelectedColumnGroup(groupName, selectedPanelItems);
    }
    
    clearSelection();
  };

  const handleRemoveFromGroup = (groupName: string) => {
    if (!groupName || selectedItems.length === 0) return;
    
    // Remove from the group
    removeFromSelectedGroup(groupName, selectedItems);
    clearSelection();
  };

  return {
    moveToSelected,
    moveGroupToSelected,
    moveToAvailable,
    clearAll,
    handleCreateGroup,
    handleCreateSelectedGroup,
    handleRemoveFromGroup,
    moveUp: () => moveUp(selectedItems),
    moveDown: () => moveDown(selectedItems)
  };
};