// components/TreeItem.tsx
import React, { useState, useRef } from "react";
import { ColumnItem, TreeItemProps } from "./types";

export const TreeItem: React.FC<TreeItemProps> = ({ 
  item, 
  onDragStart, 
  toggleExpand, 
  toggleSelect, 
  depth, 
  index,
  onDragOver,
  onDragLeave
}) => {
  const hasChildren = item.children && item.children.length > 0;
  const indentStyle = { marginLeft: `${depth * 16}px` };
  const [isHovered, setIsHovered] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  // Modified drag start handler that directly handles the column
  const handleItemDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    onDragStart(e, item);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Use e.ctrlKey or e.metaKey (for Mac) to detect multi-select
    // Use e.shiftKey to detect range selection
    toggleSelect(item.id, e.ctrlKey || e.metaKey, e.shiftKey);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDragOver) {
      onDragOver(e, itemRef.current, item.id);
    }
  };

  const handleDragLeave = () => {
    if (onDragLeave) {
      onDragLeave();
    }
  };

  // Add dragend handler to clean up
  const handleDragEnd = (e: React.DragEvent) => {
    // Remove dragging attribute
    const element = e.currentTarget as HTMLElement;
    element.removeAttribute('data-dragging');
  };

  return (
    <div>
      <div 
        ref={itemRef}
        className="tree-item" 
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
          position: 'relative',
          fontWeight: item.selected ? '500' : 'normal',
          transition: 'background-color 0.2s ease'
        }}
        data-item-id={item.id}
        data-item-index={index}
      >
        <div style={indentStyle} className="tree-item-content">
          {hasChildren && (
            <span 
              onClick={(e) => {
                e.stopPropagation(); // Prevent selection when clicking expand/collapse
                toggleExpand(item.id);
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
                backgroundColor: isHovered ? '#e8e8e8' : '#f0f0f0'
              }}
            >
              {item.expanded ? '-' : '+'}
            </span>
          )}
          <span>{item.name}</span>
        </div>
      </div>
      
      {hasChildren && item.expanded && (
        <div className="tree-children">
          {item.children!.map((child, childIndex) => (
            <TreeItem 
              key={child.id} 
              item={child} 
              onDragStart={onDragStart} 
              toggleExpand={toggleExpand}
              toggleSelect={toggleSelect}
              depth={depth + 1}
              index={childIndex}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
            />
          ))}
        </div>
      )}
    </div>
  );
};