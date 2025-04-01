// src/components/GroupPanel/components/GroupItem.tsx
import React from 'react';
import { ColDef } from 'ag-grid-community';
import { GroupItemProps } from '../../types';

const GroupItem: React.FC<GroupItemProps> = ({
  item,
  index,
  isAvailable,
  isSelected,
  isDragging,
  onSelect,
  onDoubleClick,
  onDragStart,
  className = '',
  style
}) => {
  return (
    <div
      className={`column-item draggable ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${className}`}
      data-column-id={item.field}
      data-index={index}
      style={style}
      onClick={(e) => onSelect(
        item.field as string, 
        e.ctrlKey || e.metaKey, 
        e.shiftKey
      )}
      onDoubleClick={() => onDoubleClick(item.field as string)}
      draggable
      onDragStart={(e) => onDragStart(e, item)}
    >
      {item.headerName || item.field}
    </div>
  );
};

export default GroupItem;