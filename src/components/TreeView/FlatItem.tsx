import React, { useRef } from 'react';
import { ColumnItem } from '../../types';
import { handleDragStart } from '../../utils/dragUtils';

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
  source
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  
  // Handle click for selection
  const handleClick = (e: React.MouseEvent) => {
    toggleSelect(item.id, e.ctrlKey || e.metaKey, e.shiftKey);
  };
  
  // Handle drag start with silhouette
  const handleItemDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    
    // Get currently selected IDs
    const selectedIds = getSelectedIds();
    
    // Use our drag utility
    handleDragStart(e, item, source, selectedIds);
    
    // Call parent handler
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
  
  return (
    <div 
      ref={itemRef}
      className={`flat-item ${item.selected ? 'selected' : ''}`}
      draggable={true}
      onDragStart={handleItemDragStart}
      onDragOver={handleItemDragOver}
      onDragLeave={onDragLeave}
      onClick={handleClick}
      data-item-id={item.id}
      data-item-index={index}
      data-flat-index={flatIndex !== undefined ? flatIndex : index}
      data-group={groupName}
    >
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