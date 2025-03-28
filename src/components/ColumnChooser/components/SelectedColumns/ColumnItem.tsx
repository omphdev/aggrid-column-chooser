import React, { useRef } from 'react';
import { SelectedNode } from '../../types';
import { useColumnChooser } from '../../context/ColumnChooserContext';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { useGroupManagement } from '../../hooks/useGroupManagement';
import { handleNodeSelection } from '../../utils/columnUtils';

interface ColumnItemProps {
  column: SelectedNode;
  inGroup: boolean;
  groupId?: string;
}

const ColumnItem: React.FC<ColumnItemProps> = ({ column, inGroup, groupId }) => {
  // Get reference to column element
  const columnRef = useRef<HTMLDivElement>(null);
  
  // Access state and dispatch from context
  const { state, dispatch, moveColumnOutOfGroup } = useColumnChooser();
  const { selectedSelectedIds } = state;
  
  // Get drag and drop handlers
  const { 
    draggedItem, 
    dropTarget,
    handleDragStart,
    handleDragOverColumn,
    handleDragOverGroupColumn,
    handleDrop,
    handleDoubleClick
  } = useDragAndDrop();
  
  // Get context menu handler
  const { handleContextMenu } = useGroupManagement();
  
  // Determine if this column is selected, a drop target, or being dragged
  const isSelected = selectedSelectedIds.includes(column.id);
  const isDropTarget = dropTarget === column.id;
  const isDragging = draggedItem?.id === column.id && draggedItem.source === 'selected';
  
  // Handle column selection
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Get all selectable column IDs
    const allColumnIds = state.selectedColumns.map(col => col.id);
    
    // Use the utility function to handle selection
    const newSelectedIds = handleNodeSelection(
      column.id,
      e,
      selectedSelectedIds,
      allColumnIds
    );
    
    // Update selected IDs
    dispatch({ 
      type: 'SET_SELECTED_SELECTED_IDS', 
      payload: newSelectedIds 
    });
  };
  
  // Handle drag start
  const handleColumnDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    handleDragStart(column.id, false, e, groupId, 'selected');
  };
  
  // Handle drag over
  const handleColumnDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (inGroup && groupId) {
      handleDragOverGroupColumn(e, column.id, groupId, columnRef.current);
    } else {
      handleDragOverColumn(e, column.id, columnRef.current);
    }
  };
  
  // Handle drop
  const handleColumnDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (inGroup && groupId) {
      handleDrop(e, {
        id: column.id,
        type: 'selected',
        parentId: groupId
      });
    } else {
      handleDrop(e, {
        id: column.id,
        type: 'selected'
      });
    }
  };
  
  // Handle double click
  const handleColumnDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleDoubleClick(column.id, 'selected', false, groupId);
  };
  
  // Handle context menu
  const handleColumnContextMenu = (e: React.MouseEvent) => {
    handleContextMenu(e, column.id, 'column');
  };
  
  // Handle moving out of group
  const handleMoveOutOfGroup = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (groupId) {
      moveColumnOutOfGroup(column.id, groupId);
    }
  };
  
  // Render column action buttons for in-group columns
  const renderColumnActions = () => {
    if (!inGroup || !groupId) return null;
    
    return (
      <div className="column-actions" onClick={e => e.stopPropagation()}>
        <button 
          className="action-button move-out"
          title="Move out of group"
          onClick={handleMoveOutOfGroup}
        >
          ↗️
        </button>
      </div>
    );
  };
  
  return (
    <div
      ref={columnRef}
      className={`selected-column ${isSelected ? 'selected' : ''} ${isDropTarget ? 'drop-target' : ''} ${isDragging ? 'dragging' : ''} ${inGroup ? 'in-group' : ''}`}
      onClick={handleClick}
      onDoubleClick={handleColumnDoubleClick}
      onContextMenu={handleColumnContextMenu}
      draggable="true"
      onDragStart={handleColumnDragStart}
      onDragOver={handleColumnDragOver}
      onDrop={handleColumnDrop}
    >
      <span className="column-reorder-handle">≡</span>
      <span className="column-name">{column.name}</span>
      {renderColumnActions()}
      {inGroup && groupId && (
        <span className="column-group-indicator" title={`Part of group: ${state.selectedGroups.find(g => g.id === groupId)?.name}`}>
          🔗
        </span>
      )}
    </div>
  );
};

export default React.memo(ColumnItem);
