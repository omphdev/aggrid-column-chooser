import React, { useRef, useEffect } from 'react';
import { ColumnItem } from '../../types';
import { handleDragStartForAvailable, handleDragStartForSelected } from '../../utils/dragUtils/operations';
import { countLeafNodes } from '../../utils/columnUtils';

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
  onDoubleClick?: (item: ColumnItem) => void;
  countChildren?: boolean;
  enableReordering?: boolean;
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
  source,
  onDoubleClick,
  countChildren = true,
  enableReordering = false
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const hasChildren = item.children && item.children.length > 0;
  
  // Handle click for selection
  const handleClick = (e: React.MouseEvent) => {
    toggleSelect(item.id, e.ctrlKey || e.metaKey, e.shiftKey);
  };

  // Handle double click to move item
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDoubleClick && !hasChildren) {
      onDoubleClick(item);
    } else if (hasChildren) {
      // If it has children, just toggle expansion on double-click
      toggleExpand(item.id);
    }
  };
  
  // Handle drag start
  const handleItemDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    console.log('Starting drag from TreeItem', item.id);
    
    // Get selected IDs - pass as string array
    const selectedIds = getSelectedIds();
    
    // Use the relevant drag handler based on source
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
  
  // Apply visual cue for reordering
  useEffect(() => {
    if (itemRef.current && enableReordering) {
      // Add visual cue when reordering is enabled
      itemRef.current.classList.add('reorderable');
      
      return () => {
        if (itemRef.current) {
          itemRef.current.classList.remove('reorderable');
        }
      };
    }
  }, [enableReordering]);

  // Count leaf nodes (only actual columns, not groups)
  const childCount = countChildren && hasChildren 
    ? countLeafNodes(item.children!)
    : 0;
  
  // Determine CSS classes
  const itemClasses = [
    'tree-item',
    item.selected ? 'selected' : '',
    hasChildren ? 'has-children' : '',
    enableReordering ? 'reorderable' : ''
  ].filter(Boolean).join(' ');
  
  return (
    <div className="tree-item-container">
      {/* Item header */}
      <div 
        ref={itemRef}
        className={itemClasses}
        draggable={true}
        onDragStart={handleItemDragStart}
        onDragOver={handleItemDragOver}
        onDragLeave={onDragLeave}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        style={{ paddingLeft: `${depth * 16}px` }}
        data-item-id={item.id}
        data-item-index={index}
        data-source={source}
      >
        {/* Reorder handle if reordering is enabled */}
        {enableReordering && (
          <div className="reorder-handle" title="Drag to reorder">
            <span className="drag-icon">⋮⋮</span>
          </div>
        )}
        
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
        
        {/* Item name with child count if applicable */}
        <span className="item-name">
          {item.name}
          {hasChildren && countChildren && childCount > 0 && (
            <span className="group-count">({childCount})</span>
          )}
        </span>
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
              onDoubleClick={onDoubleClick}
              countChildren={countChildren}
              enableReordering={enableReordering}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(TreeItem);