// src/components/ColumnChooser/hooks/useDragAndDrop.ts
import { useCallback } from 'react';
import { DragItem, TreeNode, ExtendedColDef } from '../types';
import { useColumnChooser } from '../context/ColumnChooserContext';
import { 
  createDragGhost, 
  setupDataTransfer, 
  parseDragData, 
  getDropPosition 
} from '../utils/dragUtils';
import { findNodeById, findGroupLeafNodes } from '../utils/treeUtils';

/**
 * Custom hook for drag and drop operations in the column chooser
 */
export function useDragAndDrop() {
  const { 
    state, 
    dispatch, 
    handleColumnSelectionChange, 
    moveColumnOutOfGroup 
  } = useColumnChooser();
  
  // Get specific state values for easier access
  const { 
    draggedItem, 
    dropTarget, 
    dropPosition, 
    selectedAvailableIds, 
    selectedSelectedIds,
    availableColumns,
    selectedColumns,
    selectedGroups
  } = state;
  
  // Helper to get column IDs in a group
  const getGroupColumnIds = useCallback((groupId: string): string[] => {
    const group = selectedGroups.find(g => g.id === groupId);
    return group ? [...group.children] : [];
  }, [selectedGroups]);
  
  // Handle drag start
  const handleDragStart = useCallback((
    nodeId: string, 
    isGroup: boolean, 
    event: React.DragEvent, 
    parentGroupId?: string,
    source: 'available' | 'selected' = 'selected'
  ) => {
    event.stopPropagation();
    
    // Determine which selection list to use
    const selectedIds = source === 'available' 
      ? selectedAvailableIds 
      : selectedSelectedIds;
    
    // If dragging a node not in the current selection, select only that node
    if (!selectedIds.includes(nodeId)) {
      if (source === 'available') {
        dispatch({ type: 'SET_SELECTED_AVAILABLE_IDS', payload: [nodeId] });
      } else {
        dispatch({ type: 'SET_SELECTED_SELECTED_IDS', payload: [nodeId] });
      }
    }
    
    // Create drag data
    const dragItem: DragItem = {
      id: nodeId,
      type: isGroup ? 'group' : 'column',
      source,
      parentId: parentGroupId
    };
    
    // Set drag data in dataTransfer
    setupDataTransfer(event, dragItem, selectedIds);
    
    // Create and set drag ghost
    let ghostText = '';
    
    if (selectedIds.length > 1 && selectedIds.includes(nodeId)) {
      ghostText = `${selectedIds.length} columns`;
    } else if (isGroup) {
      const group = selectedGroups.find(g => g.id === nodeId);
      ghostText = group?.name || 'Group';
    } else {
      // Find the column name
      if (source === 'available') {
        const node = findNodeById(availableColumns, nodeId);
        ghostText = node?.name || 'Column';
      } else {
        const column = selectedColumns.find(col => col.id === nodeId);
        ghostText = column?.name || 'Column';
      }
    }
    
    // Create ghost element with group info if applicable
    let groupName;
    if (!isGroup && parentGroupId) {
      const group = selectedGroups.find(g => g.id === parentGroupId);
      groupName = group?.name;
    }
    
    const ghostElement = createDragGhost(
      ghostText, 
      !!parentGroupId, 
      groupName
    );
    
    // Set drag image
    event.dataTransfer.setDragImage(ghostElement, 0, 0);
    
    // Store drag item in state
    dispatch({ 
      type: 'SET_DRAGGED_ITEM', 
      payload: {
        ...dragItem,
        selectedIds: selectedIds.includes(nodeId) ? selectedIds : [nodeId]
      }
    });
  }, [
    selectedAvailableIds,
    selectedSelectedIds,
    availableColumns,
    selectedColumns,
    selectedGroups,
    dispatch
  ]);
  
  // Handle drag over
  const handleDragOver = useCallback((
    event: React.DragEvent, 
    targetId: string, 
    position?: number
  ) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Set drop effect
    event.dataTransfer.dropEffect = 'move';
    
    // Update drop target and position
    dispatch({ type: 'SET_DROP_TARGET', payload: targetId });
    
    if (position !== undefined) {
      dispatch({ type: 'SET_DROP_POSITION', payload: position });
    }
  }, [dispatch]);
  
  // Handle drag over for group
  const handleDragOverGroup = useCallback((
    event: React.DragEvent, 
    groupId: string
  ) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Add visual feedback
    const groupElement = event.currentTarget as HTMLElement;
    groupElement.classList.add('group-drop-target');
    
    handleDragOver(event, groupId);
  }, [handleDragOver]);
  
  // Handle drag over for column within group
  const handleDragOverGroupColumn = useCallback((
    event: React.DragEvent, 
    columnId: string, 
    groupId: string, 
    columnRef: HTMLElement | null
  ) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Calculate position within group
    const groupColumns = selectedColumns.filter(
      col => getGroupColumnIds(groupId).includes(col.id)
    );
    const columnIndex = groupColumns.findIndex(col => col.id === columnId);
    
    // Determine drop position
    if (columnRef) {
      const isAfter = getDropPosition(event, columnRef);
      const position = isAfter ? columnIndex + 1 : columnIndex;
      
      handleDragOver(event, columnId, position);
    }
  }, [selectedColumns, getGroupColumnIds, handleDragOver]);
  
  // Handle drag over for ungrouped column
  const handleDragOverColumn = useCallback((
    event: React.DragEvent, 
    columnId: string,
    columnRef: HTMLElement | null
  ) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Clear group-related drag state
    
    // Get ungrouped columns
    const groupedColumnIds = selectedGroups.flatMap(g => g.children);
    const ungroupedColumns = selectedColumns.filter(
      col => !groupedColumnIds.includes(col.id)
    );
    
    const columnIndex = ungroupedColumns.findIndex(col => col.id === columnId);
    
    // Determine drop position
    if (columnRef) {
      const isAfter = getDropPosition(event, columnRef);
      const position = isAfter ? columnIndex + 1 : columnIndex;
      
      // Clear any previous styling
      document.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
      });
      
      // Add indicator for drop target
      columnRef.classList.add('drag-over');
      
      handleDragOver(event, columnId, position);
    }
  }, [selectedColumns, selectedGroups, handleDragOver]);
  
  // Handle drag over for the entire panel
  const handlePanelDragOver = useCallback((
    event: React.DragEvent, 
    panelType: 'available' | 'selected'
  ) => {
    event.preventDefault();
    
    if (panelType === 'selected') {
      // Get ungrouped columns
      const groupedColumnIds = selectedGroups.flatMap(g => g.children);
      const ungroupedColumns = selectedColumns.filter(
        col => !groupedColumnIds.includes(col.id)
      );
      
      // Position at the end of ungrouped columns
      const position = ungroupedColumns.length;
      handleDragOver(event, `empty-${panelType}-panel`, position);
    } else {
      handleDragOver(event, `empty-${panelType}-panel`);
    }
  }, [selectedColumns, selectedGroups, handleDragOver]);
  
  // Handle drop
  const handleDrop = useCallback((
    event: React.DragEvent,
    target: { 
      id: string, 
      type: 'available' | 'selected', 
      parentId?: string, 
      index?: number 
    }
  ) => {
    event.preventDefault();
    event.stopPropagation();
    
    try {
      // Clear any styling
      document.querySelectorAll('.drag-over, .group-drop-target').forEach(el => {
        el.classList.remove('drag-over', 'group-drop-target');
      });
      
      // Get drag data from dataTransfer or state
      const parsedDragData = parseDragData(event);
      const item = parsedDragData || draggedItem;
      
      if (!item) {
        console.log('No dragged item found');
        return;
      }
      
      // Special case for column from group
      const isFromGroup = event.dataTransfer.types.includes('column-from-group');
      const sourceGroupId = isFromGroup ? event.dataTransfer.getData('source-group-id') : null;
      
      if (isFromGroup && sourceGroupId && target.type === 'selected' && !target.parentId) {
        const draggedColumnId = event.dataTransfer.getData('text/plain');
        moveColumnOutOfGroup(draggedColumnId, sourceGroupId, target.index);
        return;
      }
      
      // Handle drops between panels
      if (item.source !== target.type) {
        if (item.source === 'available' && target.type === 'selected') {
          // Moving from available to selected
          handleMoveFromAvailableToSelected(item, target);
        } else if (item.source === 'selected' && target.type === 'available') {
          // Moving from selected to available
          handleMoveFromSelectedToAvailable(item);
        }
      } else if (item.source === 'selected' && target.type === 'selected') {
        // Reordering within selected panel
        handleReorderWithinSelected(item, target);
      }
    } catch (e) {
      console.error('Error in handleDrop:', e);
    } finally {
      // Always reset drag state
      dispatch({ type: 'RESET_DRAG_STATE' });
    }
  }, [
    draggedItem, 
    selectedGroups, 
    moveColumnOutOfGroup, 
    dispatch
  ]);
  
  // Handle moving from available to selected
  const handleMoveFromAvailableToSelected = useCallback((
    item: DragItem, 
    target: { 
      id: string, 
      type: 'available' | 'selected', 
      parentId?: string, 
      index?: number 
    }
  ) => {
    let columnsToMove: ExtendedColDef[] = [];
    
    // Check if dragging a group
    if (item.type === 'group') {
      // Find all leaf nodes in the group
      columnsToMove = findGroupLeafNodes(item.id, availableColumns);
    } else {
      // Handle regular column or multiple selected columns
      const selectedIds = item.selectedIds || [item.id];
      
      const findColumnsInTree = (nodes: typeof availableColumns, ids: string[]) => {
        nodes.forEach(node => {
          if (!node.isGroup && ids.includes(node.id) && node.column) {
            columnsToMove.push(node.column);
          }
          if (node.children.length > 0) {
            findColumnsInTree(node.children, ids);
          }
        });
      };

      findColumnsInTree(availableColumns, selectedIds);
    }
    
    if (columnsToMove.length > 0) {
      // Add columns
      handleColumnSelectionChange({
        items: columnsToMove,
        operationType: 'ADD',
        index: target.index
      });
      
      // If dropping into a group, add the columns to that group
      if (target.parentId) {
        const columnIds = columnsToMove.map(col => col.id || col.field || '');
        dispatch({
          type: 'ADD_TO_GROUP', 
          payload: { 
            groupId: target.parentId, 
            columnIds 
          }
        });
      }
    }
  }, [availableColumns, handleColumnSelectionChange, dispatch]);
  
  // Handle moving from selected to available
  const handleMoveFromSelectedToAvailable = useCallback((item: DragItem) => {
    const selectedIds = item.selectedIds || [item.id];
    
    const columnsToMove = selectedColumns
      .filter(col => selectedIds.includes(col.id))
      .map(node => node.column);
    
    if (columnsToMove.length > 0) {
      handleColumnSelectionChange({
        items: columnsToMove,
        operationType: 'REMOVE'
      });
    }
  }, [selectedColumns, handleColumnSelectionChange]);
  
  // Handle reordering within selected panel
  const handleReorderWithinSelected = useCallback((
    item: DragItem, 
    target: { 
      id: string, 
      type: 'available' | 'selected', 
      parentId?: string, 
      index?: number 
    }
  ) => {
    const selectedIds = item.selectedIds || [item.id];
    
    // If there's only one item and we're dropping it in its original position, do nothing
    if (selectedIds.length === 1 && 
        target.id === item.id && 
        !target.parentId && 
        !item.parentId) {
      return;
    }
    
    // If dragging a group
    if (item.type === 'group') {
      handleDragGroup(item.id, target);
    } else {
      // Regular column reordering or moving in/out of groups
      
      // Determine if this is a group operation
      const sourceGroupId = item.parentId;
      const targetGroupId = target.parentId;
      
      if (sourceGroupId && targetGroupId && sourceGroupId === targetGroupId) {
        // Reordering within the same group
        handleReorderWithinGroup(selectedIds, sourceGroupId, target);
      } else if (sourceGroupId && !targetGroupId) {
        // Moving from group to ungrouped
        handleMoveFromGroupToUngrouped(selectedIds, sourceGroupId, target);
      } else if (!sourceGroupId && targetGroupId) {
        // Moving from ungrouped to group
        handleMoveFromUngroupedToGroup(selectedIds, targetGroupId, target);
      } else if (sourceGroupId && targetGroupId && sourceGroupId !== targetGroupId) {
        // Moving between different groups
        handleMoveBetweenGroups(selectedIds, sourceGroupId, targetGroupId, target);
      } else {
        // Regular reordering in ungrouped area
        handleRegularReordering(selectedIds, target);
      }
    }
  }, []);
  
  // Handle dragging an entire group
  const handleDragGroup = useCallback((
    groupId: string, 
    target: { 
      id: string, 
      type: string, 
      parentId?: string, 
      index?: number 
    }
  ) => {
    // Get columns in the dragged group
    const groupColumnIds = getGroupColumnIds(groupId);
    if (groupColumnIds.length === 0) return;
    
    if (target.parentId) {
      // Dragging a group into another group (merge)
      const targetGroupIds = getGroupColumnIds(target.parentId);
      
      // Insert at specific position
      const insertIndex = target.index !== undefined 
        ? target.index 
        : targetGroupIds.length;
      
      const updatedTargetGroupIds = [...targetGroupIds];
      updatedTargetGroupIds.splice(insertIndex, 0, ...groupColumnIds);
      
      // Update target group
      dispatch({
        type: 'UPDATE_GROUP_COLUMNS',
        payload: { groupId: target.parentId, columnIds: updatedTargetGroupIds }
      });
      
      // Remove source group
      dispatch({ type: 'REMOVE_GROUP', payload: groupId });
    } else {
      // Dragging a group to the ungrouped area
      // Get the columns for this group
      const groupColumns = selectedColumns.filter(col => groupColumnIds.includes(col.id));
      
      // Create a copy of current columns
      const newOrder = [...selectedColumns];
      
      // Remove group columns from their current positions
      const remainingItems = newOrder.filter(item => !groupColumnIds.includes(item.id));
      
      // Determine insert position
      let insertIndex = target.index !== undefined 
        ? target.index 
        : target.id === 'empty-selected-panel' 
          ? remainingItems.length 
          : remainingItems.findIndex(item => item.id === target.id);
          
      if (insertIndex === -1) insertIndex = remainingItems.length;
      
      // Insert items at the target position
      remainingItems.splice(insertIndex, 0, ...groupColumns);
      
      handleColumnSelectionChange({
        items: remainingItems.map(node => node.column),
        operationType: 'REORDER'
      });
      
      // Remove the group
      dispatch({ type: 'REMOVE_GROUP', payload: groupId });
    }
  }, [
    getGroupColumnIds, 
    selectedColumns, 
    handleColumnSelectionChange, 
    dispatch
  ]);
  
  // Handle reordering within the same group
  const handleReorderWithinGroup = useCallback((
    selectedIds: string[], 
    groupId: string, 
    target: { 
      id: string, 
      type: 'available' | 'selected', 
      parentId?: string, 
      index?: number 
    }
  ) => {
    const groupColumnIds = getGroupColumnIds(groupId);
    
    // Remove dragged items
    const remainingIds = groupColumnIds.filter(id => !selectedIds.includes(id));
    
    // Find insertion point
    let insertIndex = target.index !== undefined 
      ? target.index 
      : remainingIds.findIndex(id => id === target.id);
    
    if (insertIndex === -1) insertIndex = remainingIds.length;
    
    // Insert items at position
    remainingIds.splice(insertIndex, 0, ...selectedIds);
    
    // Update group
    dispatch({
      type: 'UPDATE_GROUP_COLUMNS',
      payload: { groupId, columnIds: remainingIds }
    });
  }, [getGroupColumnIds, dispatch]);
  
  // Handle moving from group to ungrouped
  const handleMoveFromGroupToUngrouped = useCallback((
    selectedIds: string[], 
    sourceGroupId: string, 
    target: { 
      id: string, 
      type: 'available' | 'selected', 
      parentId?: string, 
      index?: number 
    }
  ) => {
    // Remove from source group
    const updatedSourceGroupIds = getGroupColumnIds(sourceGroupId)
      .filter(id => !selectedIds.includes(id));
    
    dispatch({
      type: 'UPDATE_GROUP_COLUMNS',
      payload: { groupId: sourceGroupId, columnIds: updatedSourceGroupIds }
    });
    
    // Create a copy of current columns
    const newOrder = [...selectedColumns];
    
    // Find the items we're moving
    const itemsToMove = newOrder.filter(item => selectedIds.includes(item.id));
    
    // Remove them from their current positions
    const remainingItems = newOrder.filter(item => !selectedIds.includes(item.id));
    
    // Determine insert position more accurately
    let insertIndex;
    
    if (target.index !== undefined) {
      // Use explicit position if provided
      insertIndex = target.index;
    } else if (target.id === 'empty-selected-panel') {
      // Drop at the end if targeting empty area
      insertIndex = remainingItems.length;
    } else {
      // Find the target column's position in remaining items
      insertIndex = remainingItems.findIndex(item => item.id === target.id);
      
      // If dropping after the target column
      if (dropPosition !== null && dropPosition > 0) {
        insertIndex++;
      }
      
      // If not found, add to the end
      if (insertIndex === -1) {
        insertIndex = remainingItems.length;
      }
    }
    
    // Insert items at the target position
    remainingItems.splice(insertIndex, 0, ...itemsToMove);
    
    // Update the grid with the new order
    handleColumnSelectionChange({
      items: remainingItems.map(node => node.column),
      operationType: 'REORDER'
    });
  }, [
    getGroupColumnIds, 
    selectedColumns, 
    dropPosition, 
    handleColumnSelectionChange, 
    dispatch
  ]);
  
  // Handle moving from ungrouped to group
  const handleMoveFromUngroupedToGroup = useCallback((
    selectedIds: string[], 
    targetGroupId: string, 
    target: { 
      id: string, 
      type: 'available' | 'selected', 
      parentId?: string, 
      index?: number 
    }
  ) => {
    // Add to target group
    const updatedTargetGroupIds = [...getGroupColumnIds(targetGroupId)];
    
    // Insert at specific position
    const insertIndex = target.index !== undefined 
      ? target.index 
      : updatedTargetGroupIds.length;
    
    updatedTargetGroupIds.splice(insertIndex, 0, ...selectedIds);
    
    dispatch({
      type: 'UPDATE_GROUP_COLUMNS',
      payload: { groupId: targetGroupId, columnIds: updatedTargetGroupIds }
    });
  }, [getGroupColumnIds, dispatch]);
  
  // Handle moving between different groups
  const handleMoveBetweenGroups = useCallback((
    selectedIds: string[], 
    sourceGroupId: string, 
    targetGroupId: string, 
    target: { 
      id: string, 
      type: 'available' | 'selected', 
      parentId?: string, 
      index?: number 
    }
  ) => {
    // Remove from source group
    const updatedSourceGroupIds = getGroupColumnIds(sourceGroupId)
      .filter(id => !selectedIds.includes(id));
    
    dispatch({
      type: 'UPDATE_GROUP_COLUMNS',
      payload: { groupId: sourceGroupId, columnIds: updatedSourceGroupIds }
    });
    
    // Add to target group
    const updatedTargetGroupIds = [...getGroupColumnIds(targetGroupId)];
    
    // Insert at specific position
    const insertIndex = target.index !== undefined 
      ? target.index 
      : updatedTargetGroupIds.length;
    
    updatedTargetGroupIds.splice(insertIndex, 0, ...selectedIds);
    
    dispatch({
      type: 'UPDATE_GROUP_COLUMNS',
      payload: { groupId: targetGroupId, columnIds: updatedTargetGroupIds }
    });
  }, [getGroupColumnIds, dispatch]);
  
  // Handle regular reordering in ungrouped area
  const handleRegularReordering = useCallback((
    selectedIds: string[], 
    target: { 
      id: string, 
      type: 'available' | 'selected', 
      parentId?: string, 
      index?: number 
    }
  ) => {
    // Create a copy of current columns
    const newOrder = [...selectedColumns];
    
    // Remove dragged items from their current positions
    const itemsToMove = newOrder.filter(item => selectedIds.includes(item.id));
    const remainingItems = newOrder.filter(item => !selectedIds.includes(item.id));
    
    // Determine insert position
    let insertIndex;
    if (target.index !== undefined) {
      // Use explicit position if provided
      insertIndex = target.index;
    } else if (target.id === 'empty-selected-panel') {
      // Drop at the end if targeting empty area
      insertIndex = remainingItems.length;
    } else {
      // Find the target column's position in remaining items
      insertIndex = remainingItems.findIndex(item => item.id === target.id);
      
      // If dropping after the target column (based on cursor position)
      if (dropPosition !== null && dropPosition > 0) {
        insertIndex++;
      }
      
      // If not found, add to the end
      if (insertIndex === -1) {
        insertIndex = remainingItems.length;
      }
    }
    
    // Insert items at the target position
    remainingItems.splice(insertIndex, 0, ...itemsToMove);
    
    handleColumnSelectionChange({
      items: remainingItems.map(node => node.column),
      operationType: 'REORDER'
    });
  }, [selectedColumns, dropPosition, handleColumnSelectionChange]);
  
  // Handle double-click to move between panels
  const handleDoubleClick = useCallback((
    id: string, 
    source: 'available' | 'selected', 
    isGroup?: boolean,
    groupId?: string
  ) => {
    if (groupId) {
      // If double-clicking a column in a group, move it out of the group
      moveColumnOutOfGroup(id, groupId);
    } else if (source === 'available') {
      // Move from available to selected
      if (isGroup) {
        // Double-click on group - move all children
        const columnsToMove = findGroupLeafNodes(id, availableColumns);
        
        if (columnsToMove.length > 0) {
          handleColumnSelectionChange({
            items: columnsToMove,
            operationType: 'ADD'
          });
        }
      } else {
        // Double-click on column
        const columnsToMove: ExtendedColDef[] = [];
        
        const findColumnsInTree = (nodes: typeof availableColumns, clickedId: string) => {
          for (const node of nodes) {
            if (!node.isGroup && node.id === clickedId && node.column) {
              columnsToMove.push(node.column);
              return true;
            }
            if (node.children.length > 0 && findColumnsInTree(node.children, clickedId)) {
              return true;
            }
          }
          return false;
        };

        findColumnsInTree(availableColumns, id);

        if (columnsToMove.length > 0) {
          handleColumnSelectionChange({
            items: columnsToMove,
            operationType: 'ADD'
          });
        }
      }
    } else {
      // Move from selected to available
      const column = selectedColumns.find(col => col.id === id)?.column;
      
      if (column) {
        handleColumnSelectionChange({
          items: [column],
          operationType: 'REMOVE'
        });
      }
    }
  }, [
    availableColumns, 
    selectedColumns, 
    handleColumnSelectionChange, 
    moveColumnOutOfGroup
  ]);
  
  return {
    draggedItem,
    dropTarget,
    dropPosition,
    handleDragStart,
    handleDragOver,
    handleDragOverGroup,
    handleDragOverGroupColumn,
    handleDragOverColumn,
    handlePanelDragOver,
    handleDrop,
    handleDoubleClick
  };
}
