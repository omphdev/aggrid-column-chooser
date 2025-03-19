import React, { useRef } from 'react';
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
  
  // Handle drag start
  const handleItemDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    
    // Get the selected IDs
    const selectedIds = getSelectedIds();
    
    // Use the appropriate function based on source
    if (source === 'available') {
      handleDragStartForAvailable(e, item, selectedIds);
    } else {
      handleDragStartForSelected(e, item, selectedIds);
    }
    
    onDragStart(e, item);
  };
  
  // Handle dragover
  // Handle dragover
  const handleItemDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onDragOver && itemRef.current) {
      // Add debug output
      console.log(`Drag over FlatItem: ${item.id}, ${item.name}`);
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