import React from 'react';
import { ExtendedColDef } from '../../types';

interface ColumnItemProps {
  column: ExtendedColDef;
  index: number;
  isAvailable: boolean;
  isSelected: boolean;
  isDragging: boolean;
  onSelect: (columnId: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  onDoubleClick: (columnId: string) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, column: ExtendedColDef) => void;
  className?: string;
  style?: React.CSSProperties;
}

const ColumnItem: React.FC<ColumnItemProps> = ({
  column,
  index,
  isAvailable,
  isSelected,
  isDragging,
  onSelect,
  onDoubleClick,
  onContextMenu,
  onDragStart,
  className = '',
  style
}) => {
  return (
    <div
      className={`column-item draggable ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${className}`}
      data-column-id={column.field}
      data-index={index}
      style={style}
      onClick={(e) => onSelect(
        column.field, 
        e.ctrlKey || e.metaKey, 
        e.shiftKey
      )}
      onDoubleClick={() => onDoubleClick(column.field)}
      onContextMenu={onContextMenu}
      draggable
      onDragStart={(e) => onDragStart(e, column)}
    >
      {column.headerName || column.field}
    </div>
  );
};

export default ColumnItem;