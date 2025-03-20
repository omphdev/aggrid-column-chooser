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
  onReorderWithinGroup?: (columnIds: string[], groupId: string, dropPosition: { targetId: string, insertBefore: boolean }) => void;
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
  groupId,
  onReorderWithinGroup
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
    
    // Support reordering within a group
    if (groupId && onReorderWithinGroup) {
      try {
        const dataText = e.dataTransfer.getData('text/plain');
        if (dataText) {
          const data = JSON.parse(dataText);
          
          // If dragging from the same group, visualize drop position
          if (data.sourceGroupId === groupId) {
            // Add visual indicator
            const rect = itemRef.current!.getBoundingClientRect();
            const mouseY = e.clientY;
            const mouseRelativePos = (mouseY - rect.top) / rect.height;
            const insertBefore = mouseRelativePos < 0.5;
            
            // Add appropriate class
            if (insertBefore) {
              itemRef.current!.classList.add('drag-over-top');
              itemRef.current!.classList.remove('drag-over-bottom');
            } else {
              itemRef.current!.classList.add('drag-over-bottom');
              itemRef.current!.classList.remove('drag-over-top');
            }
          }
        }
      } catch (err) {
        // Continue even if we can't get data (this happens in some browsers)
      }
    }
  };
  
  // Handle drag leave
  const handleItemDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (onDragLeave) {
      onDragLeave();
    }
    
    // Remove all drop indicators
    if (itemRef.current) {
      itemRef.current.classList.remove('drag-over-top', 'drag-over-bottom');
    }
  };
  
  // Handle drop on an item in a group - for reordering within group
  const handleItemDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove drop indicators
    if (itemRef.current) {
      itemRef.current.classList.remove('drag-over-top', 'drag-over-bottom');
    }
    
    // Check if this is a within-group reordering drop
    if (groupId && onReorderWithinGroup) {
      try {
        const dataText = e.dataTransfer.getData('text/plain');
        if (!dataText) return;
        
        const data = JSON.parse(dataText);
        
        // Only handle if the source is also from the same group
        if (data.source === 'selected' && data.sourceGroupId === groupId) {
          // Calculate insert position
          const rect = itemRef.current!.getBoundingClientRect();
          const mouseY = e.clientY;
          const mouseRelativePos = (mouseY - rect.top) / rect.height;
          const insertBefore = mouseRelativePos < 0.5;
          
          // Call reordering handler
          onReorderWithinGroup(
            data.ids, 
            groupId, 
            { targetId: item.id, insertBefore }
          );
        }
      } catch (err) {
        console.error('Error processing drop for group reordering:', err);
      }
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
      onDragLeave={handleItemDragLeave}
      onDrop={handleItemDrop}
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