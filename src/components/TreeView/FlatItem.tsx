// src/components/TreeView/FlatItem.jsx
import React, { useRef, useState } from 'react';
import { cx } from '../../utils/styleUtils';

const FlatItem = ({
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
  classes
}) => {
  const itemRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Handle click for selection
  const handleClick = (e) => {
    onSelect(item.id, e.ctrlKey || e.metaKey, e.shiftKey);
  };
  
  // Handle double click to move item
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (onDoubleClick) {
      onDoubleClick(item);
    }
  };
  
  // Handle drag start - enhanced to include group info
  const handleItemDragStart = (e) => {
    e.stopPropagation();
    
    // Set dragging state
    setIsDragging(true);
    
    // Add source group information to the drag data
    const dragData = {
      ids: [item.id],
      source,
      itemName: item.name,
      sourceGroupId: groupId,
      inGroup: !!groupId
    };
    
    console.log('Starting drag with data:', dragData);
    
    // Set drag data
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
    
    // Call parent drag start handler
    onDragStart(e, {
      ...item,
      parentGroupId: groupId
    });
    
    // Clean up on drag end
    const handleDragEnd = () => {
      setIsDragging(false);
      document.removeEventListener('dragend', handleDragEnd);
    };
    
    document.addEventListener('dragend', handleDragEnd);
  };
  
  // Handle dragover
  const handleItemDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onDragOver && itemRef.current) {
      // Add group context to the dragover event
      const enhancedEvent = e;
      enhancedEvent.targetGroupId = groupId;
      
      onDragOver(enhancedEvent, itemRef.current, item.id);
    }
  };
  
  // Handle remove from group
  const handleRemoveFromGroup = (e) => {
    e.stopPropagation();
    if (onRemoveFromGroup) {
      onRemoveFromGroup([item.id]);
    }
  };
  
  // Handle mouse enter/leave for hover effects
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);
  
  // Generate class names based on state
  const itemClasses = cx(
    classes.flatItem,
    isSelected ? classes.flatItemSelected : '',
    enableReordering ? classes.reorderable : '',
    groupName ? classes.flatItemGrouped : '',
    isDragging ? classes.flatItemDragging : '',
    canDragToGroup ? classes.flatItemDragToGroup : '',
    groupId ? 'in-group' : '',
    isSelected && groupName ? classes.flatItemGroupedSelected : ''
  );
  
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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
        <div className={classes.reorderHandle} title="Drag to reorder">
          <span className={classes.dragIcon}>⋮⋮</span>
        </div>
      )}
      
      {/* Show group label if enabled */}
      {showGroupLabels && groupName && (
        <div className={classes.groupLabel}>{groupName}</div>
      )}
      
      {/* Item name */}
      <span className={classes.itemName}>{item.name}</span>
      
      {/* Remove from group button if applicable */}
      {onRemoveFromGroup && (
        <button
          className={cx(
            classes.removeFromGroupBtn,
            isHovered ? classes.removeButtonVisible : ''
          )}
          onClick={handleRemoveFromGroup}
          title={`Remove from ${groupName || 'group'}`}
          onMouseEnter={() => setIsHovered(true)}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default React.memo(FlatItem);