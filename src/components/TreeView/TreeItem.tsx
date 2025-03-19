import React, { useRef } from 'react';
import { ColumnItem } from '../../types';
import { handleDragStartForAvailable, handleDragStartForSelected } from '../../utils/dragUtils/operations';

interface TreeItemProps {
  item: ColumnItem;
  depth: number;
  index: number;
  onDragStart: (e: React.DragEvent, item: ColumnItem) => void;
  toggleExpand: (id: string) => void;
  toggleSelect: (id: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  onDragOver?: (e: React.DragEvent, element: HTMLElement | null, itemId: string) => void;
  onDragLeave?: () => void;
  getSelectedIds: () => string[];
  source: 'available' | 'selected';
}

const TreeItem: React.FC<TreeItemProps> = ({
  item,
  depth,
  index,
  onDragStart,
  toggleExpand,
  toggleSelect,
  onDragOver,
  onDragLeave,
  getSelectedIds,
  source
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const hasChildren = item.children && item.children.length > 0;
  
  // Handle click for selection
  const handleClick = (e: React.MouseEvent) => {
    toggleSelect(item.id, e.ctrlKey || e.metaKey, e.shiftKey);
  };
  
  // Handle drag start
  const handleItemDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    console.log('Starting drag from TreeItem', item.id);
    
    // Get selected IDs
    const selectedIds = getSelectedIds();
    
    // Use our refactored handler
    if (source === 'available') {
      handleDragStartForAvailable(e, item, selectedIds);
    } else {
      handleDragStartForSelected(e, item, selectedIds);
    }
    
    // Call the parent handler
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
    <div className="tree-item-container">
      {/* Item header */}
      <div 
        ref={itemRef}
        className={`tree-item ${item.selected ? 'selected' : ''}`}
        draggable={true}
        onDragStart={handleItemDragStart}
        onDragOver={handleItemDragOver}
        onDragLeave={onDragLeave}
        onClick={handleClick}
        style={{ paddingLeft: `${depth * 16}px` }}
        data-item-id={item.id}
        data-item-index={index}
      >
        {/* Expand/collapse button for groups */}
        {hasChildren && (
          <button 
            className="expand-button"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(item.id);
            }}
          >
            {item.expanded ? '-' : '+'}
          </button>
        )}
        
        {/* Item name */}
        <span className="item-name">{item.name}</span>
      </div>
      
      {/* Children */}
      {hasChildren && item.expanded && (
        <div className="tree-children">
          {item.children!.map((child, childIndex) => (
            <TreeItem 
              key={child.id}
              item={child}
              depth={depth + 1}
              index={childIndex}
              onDragStart={onDragStart}
              toggleExpand={toggleExpand}
              toggleSelect={toggleSelect}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              getSelectedIds={getSelectedIds}
              source={source}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(TreeItem);