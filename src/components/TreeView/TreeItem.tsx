import React, { useRef } from 'react';
import { ColumnItem } from '../../types';
import { countLeafNodes } from '../../utils/columnUtils';

interface TreeItemProps {
  item: ColumnItem;
  depth: number;
  index: number;
  isSelected: boolean;
  onDragStart: (e: React.DragEvent, item: ColumnItem) => void;
  onExpand: (id: string) => void;
  onSelect: (id: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  onDragOver?: (e: React.DragEvent, element: HTMLElement | null, itemId: string) => void;
  onDragLeave?: () => void;
  source: 'available' | 'selected';
  onDoubleClick?: (item: ColumnItem) => void;
  countChildren?: boolean;
  enableReordering?: boolean;
  selectedIds?: string[]; // Add selectedIds prop to check children
}

const TreeItem: React.FC<TreeItemProps> = ({
  item,
  depth,
  index,
  isSelected,
  onDragStart,
  onExpand,
  onSelect,
  onDragOver,
  onDragLeave,
  source,
  onDoubleClick,
  countChildren = true,
  enableReordering = false,
  selectedIds = []
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const hasChildren = item.children && item.children.length > 0;
  
  // Handle click for selection
  const handleClick = (e: React.MouseEvent) => {
    onSelect(item.id, e.ctrlKey || e.metaKey, e.shiftKey);
  };

  // Handle double click
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDoubleClick && !hasChildren) {
      onDoubleClick(item);
    } else if (hasChildren) {
      // Toggle expansion on double-click for groups
      onExpand(item.id);
    }
  };
  
  // Handle drag start - simplified to just pass to parent
  const handleItemDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
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
  
  // Count leaf nodes (only actual columns, not groups)
  const childCount = countChildren && hasChildren 
    ? countLeafNodes(item.children!)
    : 0;
  
  // Determine CSS classes
  const itemClasses = [
    'tree-item',
    isSelected ? 'selected' : '',
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
        data-selected={isSelected ? 'true' : 'false'} // Add data attribute for selection state
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
              onExpand(item.id);
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
              isSelected={selectedIds.includes(child.id)} // Check each child individually
              onDragStart={onDragStart}
              onExpand={onExpand}
              onSelect={onSelect}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              source={source}
              onDoubleClick={onDoubleClick}
              countChildren={countChildren}
              enableReordering={enableReordering}
              selectedIds={selectedIds} // Pass selectedIds to children
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(TreeItem);