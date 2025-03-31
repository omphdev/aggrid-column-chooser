import React from 'react';

interface GroupHeaderProps {
  groupName: string;
  isExpanded: boolean;
  columnCount: number;
  isDropTarget: boolean;
  isDragging: boolean;
  level?: number;
  onToggle: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  className?: string;
}

const GroupHeader: React.FC<GroupHeaderProps> = ({
  groupName,
  isExpanded,
  columnCount,
  isDropTarget,
  isDragging,
  level = 0,
  onToggle,
  onDragStart,
  onContextMenu,
  onDragOver,
  onDrop,
  className = ''
}) => {
  return (
    <div
      className={`${className} ${isDropTarget ? 'group-drop-target' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{ paddingLeft: level ? `${level * 20}px` : undefined }}
      draggable
      onDragStart={onDragStart}
      onContextMenu={onContextMenu}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <span 
        className="expand-icon"
        onClick={onToggle}
      >
        {isExpanded ? '−' : '+'}
      </span>
      <span className="group-name">{groupName}</span>
      <span className="group-count">({columnCount})</span>
    </div>
  );
};

export default GroupHeader;