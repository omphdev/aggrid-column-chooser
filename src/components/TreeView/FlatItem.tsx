import React, { useRef, useEffect } from 'react';
import { ColumnItem } from '../../types';
import { handleDragStartForSelected, handleDragStartForAvailable } from '../../utils/dragUtils/operations';

interface FlatItemProps {
  item: ColumnItem;
  index: number;
  flatIndex?: number;
  onDragStart: (e: React.DragEvent, item: ColumnItem) => void;
  toggleSelect: (id: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  onDragOver?: (e: React.DragEvent, element: HTMLElement | null, itemId: string) => void;
  onDragLeave?: () => void;
  groupName?: string;
  showGroupLabels?: boolean;
  getSelectedIds: () => string[];
  source: 'available' | 'selected';
  onDoubleClick?: (item: ColumnItem) => void;
  enableReordering?: boolean;
}

const FlatItem: React.FC<FlatItemProps> = ({
  item,
  index,
  flatIndex,
  onDragStart,
  toggleSelect,
  onDragOver,
  onDragLeave,
  groupName,
  showGroupLabels = false,
  getSelectedIds,
  source,
  onDoubleClick,
  enableReordering = false
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  
  // Handle click for selection
  const handleClick = (e: React.MouseEvent) => {
    toggleSelect(item.id, e.ctrlKey || e.metaKey, e.shiftKey);
  };
  
  // Handle double click to move item
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDoubleClick) {
      onDoubleClick(item);
    }
  };
  
  // Handle drag start
  const handleItemDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    
    // Add dragging class to element
    if (itemRef.current) {
      itemRef.current.classList.add('dragging');
    }
    
    // Get the selected IDs as a string array
    const selectedIds = getSelectedIds();
    
    // Use the appropriate function based on source
    if (source === 'available') {
      handleDragStartForAvailable(e, item, selectedIds);
    } else {
      handleDragStartForSelected(e, item, selectedIds);
    }
    
    onDragStart(e, item);
    
    // Clean up dragging class on drag end
    const handleDragEnd = () => {
      if (itemRef.current) {
        itemRef.current.classList.remove('dragging');
      }
      document.removeEventListener('dragend', handleDragEnd);
    };
    
    document.addEventListener('dragend', handleDragEnd);
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
    item.selected ? 'selected' : '',
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