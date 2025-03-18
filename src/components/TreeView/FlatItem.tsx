// src/components/TreeView/FlatItem.tsx
import React, { useState, useRef } from "react";
import { FlatItemProps } from "../../types";
import { handleDragStart } from "../../utils/dragSilhouette";

/**
 * Component for rendering an item in flat view mode
 */
export const FlatItem: React.FC<FlatItemProps> = ({ 
  item, 
  index, 
  flatIndex, 
  onDragStart, 
  toggleSelect, 
  onDragOver, 
  onDragLeave, 
  groupName, 
  showGroupLabels = false 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  
  // Enhanced drag start handler using silhouette
  const handleItemDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    
    // Use the silhouette system for visual feedback
    handleDragStart(e, item.name);
    
    // Call the original handler to handle the data transfer
    onDragStart(e, item);
  };
  
  // Handle clicking for selection
  const handleClick = (e: React.MouseEvent) => {
    toggleSelect(item.id, e.ctrlKey || e.metaKey, e.shiftKey);
  };

  // Handle dragover for drop indicators
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDragOver) {
      onDragOver(e, itemRef.current, item.id);
    }
  };

  // Handle dragleave to clean up
  const handleDragLeave = () => {
    if (onDragLeave) {
      onDragLeave();
    }
  };

  // Clean up dragging state on drag end
  const handleDragEnd = (e: React.DragEvent) => {
    // Remove dragging attribute
    const element = e.currentTarget as HTMLElement;
    element.removeAttribute('data-dragging');
  };
  
  return (
    <div 
      ref={itemRef}
      className="flat-item tree-item" 
      draggable={true}
      onDragStart={handleItemDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        padding: '6px 8px', 
        cursor: 'grab', 
        display: 'flex',
        alignItems: 'center',
        backgroundColor: item.selected ? '#e6f7ff' : isHovered ? '#f5f5f5' : 'white',
        color: item.selected ? '#1890ff' : 'inherit',
        borderBottom: '1px solid #f0f0f0',
        userSelect: 'none',
        fontWeight: item.selected ? '500' : 'normal',
        transition: 'background-color 0.2s ease'
      }}
      data-item-id={item.id}
      data-item-index={index}
      data-flat-index={flatIndex !== undefined ? flatIndex : index}
      data-group={groupName}
    >
      {/* Show group label badge if enabled */}
      {showGroupLabels && groupName && (
        <div style={{ 
          fontSize: '11px',
          color: '#999',
          marginRight: '8px',
          backgroundColor: '#f5f5f5',
          padding: '2px 4px',
          borderRadius: '3px'
        }}>
          {groupName}
        </div>
      )}
      
      {/* Item name */}
      <span>{item.name}</span>
    </div>
  );
};

export default FlatItem;