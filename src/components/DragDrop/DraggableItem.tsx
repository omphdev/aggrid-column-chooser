// DraggableTreeItem.tsx
import React from 'react';
import { ColumnItem } from '../../types';
import { handleDragStart } from '../../utils/dragSilhouette';

interface DraggableTreeItemProps {
  item: ColumnItem;
  depth?: number;
  onClick: (e: React.MouseEvent) => void;
  onExpand?: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent, item: ColumnItem) => void;
  className?: string;
  isSelected?: boolean;
  isExpanded?: boolean;
  hasChildren?: boolean;
  isDragTarget?: boolean;
  dragInsertBefore?: boolean;
}

/**
 * A enhanced draggable tree item that uses the stable silhouette system
 */
export const DraggableItem: React.FC<DraggableTreeItemProps> = ({
  item,
  depth = 0,
  onClick,
  onExpand,
  onDragStart,
  className = '',
  isSelected = false,
  isExpanded = false,
  hasChildren = false,
  isDragTarget = false,
  dragInsertBefore = false
}) => {
  const handleItemDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    
    // Use the stable silhouette system
    handleDragStart(e, item.name);
    
    // Call the original handler to handle the data transfer
    onDragStart(e, item);
  };
  
  // Calculate indentation
  const indentStyle = { marginLeft: `${depth * 16}px` };
  
  // Calculate style based on drag target status
  const getItemStyle = () => {
    const baseStyle = {
      padding: '6px 8px', 
      cursor: 'grab', 
      display: 'flex',
      alignItems: 'center',
      backgroundColor: isSelected ? '#e6f7ff' : 'white',
      color: isSelected ? '#1890ff' : 'inherit',
      borderBottom: '1px solid #f0f0f0',
      userSelect: 'none' as const,
      position: 'relative' as const,
      fontWeight: isSelected ? '500' : 'normal',
      transition: 'background-color 0.2s ease, margin-top 0.3s ease, margin-bottom 0.3s ease',
      marginTop: 0,
      marginBottom: 0
    };

    // Add push-down effect if this is a drag target
    if (isDragTarget) {
      if (dragInsertBefore) {
        return {
          ...baseStyle,
          marginTop: 40 // Space for drop indicator
        };
      } else {
        return {
          ...baseStyle,
          marginBottom: 40 // Space for drop indicator when inserting after
        };
      }
    }

    return baseStyle;
  };

  return (
    <div 
      className={`draggable-tree-item ${className} ${isDragTarget ? 'is-drag-target' : ''}`}
      draggable={true}
      onDragStart={handleItemDragStart}
      onClick={onClick}
      style={getItemStyle()}
      data-item-id={item.id}
      data-drag-insert={isDragTarget ? (dragInsertBefore ? 'before' : 'after') : 'none'}
    >
      <div style={indentStyle} className="tree-item-content">
        {hasChildren && onExpand && (
          <span 
            onClick={(e) => {
              e.stopPropagation(); // Prevent selection when clicking expand/collapse
              onExpand(e);
            }} 
            style={{ 
              cursor: 'pointer', 
              marginRight: '5px',
              display: 'inline-block',
              width: '16px',
              height: '16px',
              textAlign: 'center',
              lineHeight: '16px',
              border: '1px solid #ccc',
              borderRadius: '2px',
              backgroundColor: '#f0f0f0'
            }}
          >
            {isExpanded ? '-' : '+'}
          </span>
        )}
        <span>{item.name}</span>
      </div>
    </div>
  );
};

/**
 * A drop indicator that shows where the item will be placed
 */
export const DropIndicator: React.FC<{
  top: number;
  left?: number;
  right?: number;
  text?: string;
}> = ({ top, left = 8, right = 8, text = 'Drop Here' }) => (
  <div 
    className="drop-indicator"
    style={{
      position: 'absolute',
      left: `${left}px`,
      right: `${right}px`,
      top: `${top}px`,
      padding: '6px 8px',
      backgroundColor: 'rgba(24, 144, 255, 0.1)',
      border: '2px dashed #1890ff',
      borderRadius: '4px',
      color: '#1890ff',
      fontSize: '14px',
      fontStyle: 'italic',
      zIndex: 100,
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
      height: '32px',
      justifyContent: 'center'
    }}
  >
<span>{text}</span>
  </div>
);