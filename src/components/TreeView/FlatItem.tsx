import React, { useRef, useState } from 'react';
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
  onRemoveFromGroup?: (columnIds: string[]) => void;
  canDragToGroup?: boolean; // New prop to enable drag-to-group
  groupId?: string; // The group this item belongs to, if any
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
  enableReordering = false,
  onRemoveFromGroup,
  canDragToGroup = true,
  groupId
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
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
  
  // Handle drag start - enhanced to include group info
  const handleItemDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    
    // Set dragging state
    setIsDragging(true);
    
    // Add source group information to the drag data
    const dragData = {
      ids: [item.id],
      source,
      itemName: item.name,
      sourceGroupId: groupId // Include source group if applicable
    };
    
    // Set drag data
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
    
    // Call parent drag start handler
    onDragStart(e, item);
    
    // Clean up on drag end
    const handleDragEnd = () => {
      setIsDragging(false);
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
  
  // Handle remove from group
  const handleRemoveFromGroup = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemoveFromGroup) {
      onRemoveFromGroup([item.id]);
    }
  };
  
  // Determine CSS classes
  const itemClasses = [
    'flat-item',
    isSelected ? 'selected' : '',
    enableReordering ? 'reorderable' : '',
    groupName ? 'grouped-item' : '',
    isDragging ? 'dragging' : '',
    canDragToGroup ? 'can-drag-to-group' : ''
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
      data-selected={isSelected ? 'true' : 'false'}
      data-group-id={groupId || ''}
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
      
      {/* Remove from group button if applicable */}
      {onRemoveFromGroup && (
        <button
          className="remove-from-group-btn"
          onClick={handleRemoveFromGroup}
          title={`Remove from ${groupName || 'group'}`}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default React.memo(FlatItem);