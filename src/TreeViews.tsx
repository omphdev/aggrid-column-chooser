// TreeViews.tsx with fixed drop indicator cleanup
import React, { useState, useRef, useEffect } from "react";
import { ColumnItem, TreeItemProps, TreeViewProps } from "./types";
import { flattenTree } from "./utils/columnConverter";

// Component for rendering a tree item
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

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDragOver) {
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

// Create a separate component for flat items to properly handle hooks
const FlatItem: React.FC<{
  item: ColumnItem;
  index: number;
  onDragStart: (e: React.DragEvent, item: ColumnItem) => void;
  toggleSelect: (id: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  onDragOver?: (e: React.DragEvent, element: HTMLElement | null, itemId: string) => void;
  onDragLeave?: () => void;
  groupName?: string;
}> = ({ item, index, onDragStart, toggleSelect, onDragOver, onDragLeave, groupName }) => {
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
    if (onDragOver) {
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
  showGroupLabels = false
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
      const dragElement = document.querySelector('[data-dragging="true"]');
      if (!dragElement) {
        cleanupDropIndicators();
      }
    }, 50);
  };

  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    
    // If we're dragging over the container but not over any item,
    // show indicator at the bottom to allow appending
    if (!dropIndicator.visible && items.length > 0) {
      const containerRect = treeRef.current?.getBoundingClientRect();
      if (containerRect) {
        setDropIndicator({
          visible: true,
          top: containerRect.height - 2,
          insertBefore: false
        });
      }
    }
    
    // Call the parent onDragOver if provided
    if (onDragOver) {
      onDragOver(e);
    }
  };

  // Add global event listeners for drag end to ensure cleanup
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      cleanupDropIndicators();
      
      // Also remove any dragging flags from elements
      const draggingElements = document.querySelectorAll('[data-dragging="true"]');
      draggingElements.forEach(el => {
        el.removeAttribute('data-dragging');
      });
    };
    
    // Handle drag end globally
    document.addEventListener('dragend', handleGlobalDragEnd);
    
    // Cleanup
    return () => {
      document.removeEventListener('dragend', handleGlobalDragEnd);
    };
  }, []);

  const handleTreeDrop = (e: React.DragEvent) => {
    // Try to parse the data transfer to detect if it's a reordering operation
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain')) as { 
        ids: string[], 
        source: string 
      };
      
      // If this is a reordering within the same panel and we have the handler
      if (
        ((title === "Selected Columns" && data.source === "selected") ||
         (title === "Available Columns" && data.source === "available")) &&
        onItemReorder
      ) {
        // Call the reordering handler
        const positionedEvent = e as any;
        positionedEvent.dropPosition = {
          targetId: dropIndicator.itemId,
          insertBefore: dropIndicator.insertBefore
        };
        
        onItemReorder(positionedEvent);
        
        // Clean up drop indicators
        cleanupDropIndicators();
        return;
      }
    } catch (err) {
      // Continue with normal drop handling
    }
    
    // Add position info to the event for normal drops
    const positionedEvent = e as any;
    positionedEvent.dropPosition = {
      targetId: dropIndicator.itemId,
      insertBefore: dropIndicator.insertBefore
    };
    
    // Clean up drop indicators
    cleanupDropIndicators();
    
    // Call the parent onDrop handler
    if (onDrop) {
      onDrop(positionedEvent);
    }
  };

  return (
    <div 
      ref={treeRef}
      className="tree-view" 
      onDrop={handleTreeDrop} 
      onDragOver={handleContainerDragOver}
      onDragLeave={handleDragLeave}
      style={{ 
        border: '1px solid #ccc', 
        height: '100%', 
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      {/* Drop indicator line */}
      {dropIndicator.visible && (
        <div 
          className="drop-indicator-line"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${dropIndicator.top}px`,
            height: '2px',
            backgroundColor: '#1890ff',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        />
      )}
      
      <div style={{ 
        padding: '8px', 
        fontWeight: 'bold', 
        borderBottom: '1px solid #ccc',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>{title}</span>
        <div>
          {selectedCount > 0 && (
            <span style={{ 
              marginRight: '10px', 
              fontSize: '12px',
              color: '#1890ff'
            }}>
              {selectedCount} selected
            </span>
          )}
          <button 
            onClick={onSelectAll}
            className="action-button"
            style={{ marginRight: '5px' }}
          >
            Select All
          </button>
          <button 
            onClick={onClearSelection}
            className="action-button"
          >
            Clear
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {items.length > 0 ? (
          flatView ? (
            // Flat view - render all leaf nodes regardless of hierarchy
            renderFlatItems(
              items, 
              onDragStart, 
              toggleSelect, 
              handleItemDragOver, 
              handleDragLeave,
              showGroupLabels
            )
          ) : (
            // Tree view - render normally with hierarchy
            items.map((item, idx) => (
              <TreeItem 
                key={item.id} 
                item={item} 
                onDragStart={onDragStart} 
                toggleExpand={toggleExpand}
                toggleSelect={toggleSelect}
                depth={0}
                index={idx}
                onDragOver={handleItemDragOver}
                onDragLeave={handleDragLeave}
              />
            ))
          )
        ) : (
          <div style={{ 
            padding: '15px', 
            textAlign: 'center', 
            color: '#999' 
          }}>
            Drag columns here
          </div>
        )}
      </div>
    </div>
  );
};