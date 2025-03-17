// TreeViews.tsx with source awareness
import React, { useState, useRef, useEffect } from "react";
import { ColumnItem, TreeItemProps, TreeViewProps } from "./types";
import { flattenTree } from "./utils/columnConverter";
import { getCurrentDragSource, setCurrentDragSource } from "./utils/dragDropUtils";

// Component for rendering a tree item
export const TreeItem: React.FC<TreeItemProps> = ({ 
  item, 
  onDragStart, 
  toggleExpand, 
  toggleSelect, 
  depth, 
  index,
  onDragOver,
  onDragLeave,
  panelType
}) => {
  const hasChildren = item.children && item.children.length > 0;
  const indentStyle = { marginLeft: `${depth * 16}px` };

export default TreeView;
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

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only show drop indicators if we're not dragging from this panel
    const currentSource = getCurrentDragSource();
    if (currentSource !== panelType && onDragOver) {
      onDragOver(e, itemRef.current, item.id);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (onDragLeave) {
      onDragLeave();
    }
  };

  // Add dragend handler to clean up
  const handleDragEnd = (e: React.DragEvent) => {
    // Remove dragging attribute
    const element = e.currentTarget as HTMLElement;
    element.removeAttribute('data-dragging');
    
    // Reset global drag source
    setCurrentDragSource(null);
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
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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
        data-panel-type={panelType}
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
              panelType={panelType}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Create a separate component for flat items to properly handle hooks
const FlatItem: React.FC<{
  item: ColumnItem;
  index: number;
  onDragStart: (e: React.DragEvent, item: ColumnItem) => void;
  toggleSelect: (id: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  onDragOver?: (e: React.DragEvent, element: HTMLElement | null, itemId: string) => void;
  onDragLeave?: () => void;
  groupName?: string;
  panelType: string;
}> = ({ item, index, onDragStart, toggleSelect, onDragOver, onDragLeave, groupName, panelType }) => {
  const [isHovered, setIsHovered] = React.useState(false);
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
    
    // Only show drop indicators if we're not dragging from this panel
    const currentSource = getCurrentDragSource();
    if (currentSource !== panelType && onDragOver) {
      onDragOver(e, itemRef.current, item.id);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (onDragLeave) {
      onDragLeave();
    }
  };

  // Add dragend handler to clean up
  const handleDragEnd = (e: React.DragEvent) => {
    // Remove dragging attribute
    const element = e.currentTarget as HTMLElement;
    element.removeAttribute('data-dragging');
    
    // Reset global drag source
    setCurrentDragSource(null);
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
      data-panel-type={panelType}
      data-group={groupName}
    >
      {groupName && (
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

// Render flat list of items
const renderFlatItems = (
  items: ColumnItem[], 
  onDragStart: (e: React.DragEvent, item: ColumnItem) => void,
  toggleSelect: (id: string, isMultiSelect: boolean, isRangeSelect: boolean) => void,
  onDragOver?: (e: React.DragEvent, element: HTMLElement | null, itemId: string) => void,
  onDragLeave?: () => void,
  showGroupLabels = false,
  panelType = 'unknown'
) => {
  // Flatten the tree structure while tracking group info for each leaf node
  interface EnhancedFlatItem extends ColumnItem {
    groupName?: string;
  }
  
  const flatItems: EnhancedFlatItem[] = [];
  
  const processItem = (item: ColumnItem, groupName?: string) => {
    if (item.field && (!item.children || item.children.length === 0)) {
      // This is a leaf node, add it with its group info
      flatItems.push({ ...item, groupName });
    }
    
    if (item.children && item.children.length > 0) {
      // For all children, pass the current item's name as their group
      const newGroupName = item.name;
      item.children.forEach(child => processItem(child, newGroupName));
    }
  };
  
  // Process all items
  items.forEach(item => processItem(item));
  
  return flatItems.map((item, idx) => (
    <FlatItem
      key={item.id}
      item={item}
      index={idx}
      onDragStart={onDragStart}
      toggleSelect={toggleSelect}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      groupName={showGroupLabels ? item.groupName : undefined}
      panelType={panelType}
    />
  ));
};

export const TreeView: React.FC<TreeViewProps> = ({ 
  items, 
  onDragStart, 
  onDrop, 
  onDragOver, 
  title, 
  toggleExpand, 
  toggleSelect,
  onSelectAll,
  onClearSelection,
  selectedCount,
  flatView = false, // Default to tree view unless specified otherwise
  showGroupLabels = true, // Show group labels in flat view
  onItemReorder, // New prop for handling reordering
}) => {
  const treeRef = useRef<HTMLDivElement>(null);
  const [dropIndicator, setDropIndicator] = useState<{
    visible: boolean;
    top: number;
    itemId?: string;
    insertBefore: boolean;
  }>({
    visible: false,
    top: 0,
    insertBefore: true
  });
  
  // Get panel type from title (simplified)
  const panelType = title.toLowerCase().includes('available') ? 'available' : 'selected';

  // Cleanup function for drop indicators (can be called from multiple places)
  const cleanupDropIndicators = () => {
    setDropIndicator({
      visible: false,
      top: 0,
      insertBefore: true
    });
  };

  // Handle showing drop indicators
  const handleItemDragOver = (e: React.DragEvent, element: HTMLElement | null, itemId: string) => {
    if (!element) return;
    
    // Only show drop indicators if we're not dragging from this panel
    const currentSource = getCurrentDragSource();
    if (currentSource === panelType) {
      // If it's an internal reordering, only show indicator if we have a reorder handler
      if (onItemReorder) {
        // Calculate indicator position...
      } else {
        // No reordering allowed, hide indicator
        cleanupDropIndicators();
        return;
      }
    }
    
    // Calculate if we should insert before or after based on mouse position
    const rect = element.getBoundingClientRect();
    const mouseY = e.clientY;
    const threshold = rect.top + (rect.height / 2);
    const insertBefore = mouseY < threshold;
    
    // Calculate position for the drop indicator
    const offsetTop = insertBefore ? rect.top : rect.bottom;
    const containerRect = treeRef.current?.getBoundingClientRect();
    const top = containerRect ? offsetTop - containerRect.top : offsetTop;

    setDropIndicator({
      visible: true,
      top,
      itemId,
      insertBefore
    });
  };

  const handleDragLeave = () => {
    // We need a small delay to avoid flickering when moving between items
    setTimeout(() => {
      // Check if we're still over any item before hiding
      const containerRect = treeRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      
      const x = event?.clientX || 0;
      const y = event?.clientY || 0;
      
      // Check if point is inside container
      if (
        x < containerRect.left || 
        x > containerRect.right || 
        y < containerRect.top || 
        y > containerRect.bottom
      ) {
        cleanupDropIndicators();
      }
    }, 50);
  };