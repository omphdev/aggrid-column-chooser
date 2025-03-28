import React from 'react';
import ColumnItem from './ColumnItem';
import { SelectedNode } from '../../types';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';

interface GroupContentProps {
  groupId: string;
  columns: SelectedNode[];
  isDraggingOverGroup: boolean;
  dragOverGroupId: string | null;
  dropPosition: number | null;
}

const GroupContent: React.FC<GroupContentProps> = ({
  groupId,
  columns,
  isDraggingOverGroup,
  dragOverGroupId,
  dropPosition
}) => {
  return (
    <div className="group-columns">
      {/* Render drop indicator at start position if needed */}
      {isDraggingOverGroup && dragOverGroupId === groupId && dropPosition === 0 && (
        <div className="drop-indicator"></div>
      )}
      
      {/* Render group columns with drop indicators */}
      {columns.map((col, index) => (
        <React.Fragment key={col.id}>
          <ColumnItem 
            column={col}
            inGroup={true}
            groupId={groupId}
          />
          {/* Render drop indicator after this column if needed */}
          {isDraggingOverGroup && dragOverGroupId === groupId && dropPosition === index + 1 && (
            <div className="drop-indicator"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default React.memo(GroupContent);
