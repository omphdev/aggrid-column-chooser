// components/FlatItem.tsx
import React, { useState, useRef } from "react";
import { ColumnItem } from "./types";

export interface FlatItemProps {
  item: ColumnItem;
  index: number;
  flatIndex?: number;
  onDragStart: (e: React.DragEvent, item: ColumnItem) => void;
  toggleSelect: (id: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  onDragOver?: (e: React.DragEvent, element: HTMLElement | null, itemId: string) => void;
  onDragLeave?: () => void;
  groupName?: string;
  showGroupLabels?: boolean;
}

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
  
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    onDragStart(e, item);
  };
  
  const handleClick = (e: React.MouseEvent) => {
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
      onDragStart={handleDragStart}
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
      <span>{item.name}</span>
    </div>
  );
};
