import React, { useRef } from 'react';
import { ColumnItem } from '../../types';

interface FlatItemProps {
  item: ColumnItem;
  index: number;
  flatIndex?: number;
  isSelected: boolean;
  onDragStart: (e: React.DragEvent, item: ColumnItem) => void;
  onSelect: (id: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  onDragOver?: (e: React.DragEvent, element: HTMLElement | null, itemId: string) => void;
  onDragLeave?: () => void;
  groupName?: string;
  showGroupLabels?: boolean;
  source: 'available' | 'selected';
  onDoubleClick?: (item: ColumnItem) => void;
  enableReordering?: boolean;
}

const FlatItem: React.FC<FlatItemProps> = ({
  item,
  index,
  flatIndex,
  isSelected,
  onDragStart,
  onSelect,
  onDragOver,
  onDragLeave,
  groupName,
  showGroupLabels = false,
  source,
  onDoubleClick,
  enableReordering = false
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  
  // Handle click for selection
  const handleClick = (e: React.MouseEvent) => {
    onSelect(item.id, e.ctrlKey || e.metaKey, e.shiftKey);
  };
  
  // Handle double click to move item
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDoubleClick) {
      onDoubleClick(item);
    }
  };
  
  // Handle drag start - simplified to just pass to parent
  const handleItemDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    onDragStart(e, item);
  };
  
  // Handle dragover
  const handleItemDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onDragOver && itemRef.current) {
      onDragOver(e, itemRef.current, item.id);
    }
  };
  
  // Determine CSS classes
  const itemClasses = [
    'flat-item',
    isSelected ? 'selected' : '',
    enableReordering ? 'reorderable' : '',
  ].filter(Boolean).join(' ');
  
  return (
    <div 
      ref={itemRef}
      className={itemClasses}
      draggable={true}
      onDragStart={handleItemDragStart}
      onDragOver={handleItemDragOver}
      onDragLeave={onDragLeave}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      data-item-id={item.id}
      data-item-index={index}
      data-flat-index={flatIndex !== undefined ? flatIndex : index}
      data-group={groupName}
      data-source={source}
      data-selected={isSelected ? 'true' : 'false'} // Add data attribute for selection state
    >
      {/* Reorder handle if reordering is enabled */}
      {enableReordering && (
        <div className="reorder-handle" title="Drag to reorder">
          <span className="drag-icon">⋮⋮</span>
        </div>
      )}
      
      {/* Show group label if enabled */}
      {showGroupLabels && groupName && (
        <div className="group-label">{groupName}</div>
      )}
      
      {/* Item name */}
      <span className="item-name">{item.name}</span>
    </div>
  );
};

export default React.memo(FlatItem);