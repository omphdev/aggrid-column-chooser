import React, { useRef } from 'react';
import GroupHeader from './GroupHeader';
import GroupContent from './GroupContent';
import { SelectedGroup, SelectedNode } from '../../types';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';

interface GroupItemProps {
  group: SelectedGroup;
  columns: SelectedNode[];
  isDraggingOverGroup: boolean;
  dragOverGroupId: string | null;
  dropPosition: number | null;
}

const GroupItem: React.FC<GroupItemProps> = ({
  group,
  columns,
  isDraggingOverGroup,
  dragOverGroupId,
  dropPosition
}) => {
  // Get reference to group element
  const groupRef = useRef<HTMLDivElement>(null);
  
  // Get drag and drop handlers
  const { 
    draggedItem, 
    dropTarget,
    handleDragOverGroup,
    handleDrop
  } = useDragAndDrop();
  
  // Determine if this group is a drop target or being dragged
  const isDropTarget = dropTarget === group.id || dragOverGroupId === group.id;
  const isDragging = draggedItem?.id === group.id && draggedItem.source === 'selected';
  
  // Handle drag over for group
  const handleGroupDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleDragOverGroup(e, group.id);
  };
  
  // Handle drop on group
  const handleGroupDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    handleDrop(e, {
      id: group.id,
      type: 'selected'
    });
  };
  
  return (
    <div
      ref={groupRef}
      className={`selected-group ${isDropTarget ? 'drop-target' : ''} ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleGroupDragOver}
      onDrop={handleGroupDrop}
    >
      <GroupHeader 
        group={group}
        columnCount={columns.length}
      />
      <GroupContent 
        groupId={group.id}
        columns={columns}
        isDraggingOverGroup={isDraggingOverGroup}
        dragOverGroupId={dragOverGroupId}
        dropPosition={dropPosition}
      />
    </div>
  );
};

export default React.memo(GroupItem);
