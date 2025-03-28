import React from 'react';
import { SelectedGroup } from '../../types';
import { useColumnChooser } from '../../context/ColumnChooserContext';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { useGroupManagement } from '../../hooks/useGroupManagement';

interface GroupHeaderProps {
  group: SelectedGroup;
  columnCount: number;
}

const GroupHeader: React.FC<GroupHeaderProps> = ({ group, columnCount }) => {
  const { handleContextMenu } = useGroupManagement();
  const { handleDragStart } = useDragAndDrop();
  
  // Handle drag start for group
  const handleGroupDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    handleDragStart(group.id, true, e, undefined, 'selected');
  };
  
  // Handle context menu for group
  const handleGroupContextMenu = (e: React.MouseEvent) => {
    handleContextMenu(e, group.id, 'group');
  };
  
  return (
    <div 
      className="group-header"
      draggable="true"
      onDragStart={handleGroupDragStart}
      onContextMenu={handleGroupContextMenu}
    >
      <span className="group-reorder-handle">≡</span>
      <span className="group-name">{group.name}</span>
      <span className="group-count">({columnCount})</span>
    </div>
  );
};

export default React.memo(GroupHeader);
