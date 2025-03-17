// TreeViews.tsx
import React, { useState } from "react";
import { ColumnItem, TreeItemProps, TreeViewProps } from "./types";

// Component for rendering a tree item
export const TreeItem: React.FC<TreeItemProps> = ({ 
  item, 
  onDragStart, 
  toggleExpand, 
  toggleSelect, 
  depth, 
  index 
}) => {
  const hasChildren = item.children && item.children.length > 0;
  const indentStyle = { marginLeft: `${depth * 16}px` };
  const [isHovered, setIsHovered] = useState(false);

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

  return (
    <div>
      <div 
        className="tree-item" 
        draggable={true}
        onDragStart={handleItemDragStart}
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Tree component
// Helper function to flatten a tree structure into a single list of items
const flattenTree = (items: ColumnItem[]): ColumnItem[] => {
  let result: ColumnItem[] = [];
  
  for (const item of items) {
    // Only add items with a field (leaf nodes)
    if (item.field) {
      result.push(item);
    }
    
    // Recursively process children
    if (item.children && item.children.length > 0) {
      result = [...result, ...flattenTree(item.children)];
    }
  }
  
  return result;
};

// Create a separate component for flat items to properly handle hooks
const FlatItem: React.FC<{
  item: ColumnItem;
  index: number;
  onDragStart: (e: React.DragEvent, item: ColumnItem) => void;
  toggleSelect: (id: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
}> = ({ item, index, onDragStart, toggleSelect }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    onDragStart(e, item);
  };
  
  const handleClick = (e: React.MouseEvent) => {
    toggleSelect(item.id, e.ctrlKey || e.metaKey, e.shiftKey);
  };
  
  return (
    <div 
      className="flat-item" 
      draggable={true}
      onDragStart={handleDragStart}
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
    >
      <span>{item.name}</span>
    </div>
  );
};

// Render flat list of items
const renderFlatItems = (
  items: ColumnItem[], 
  onDragStart: (e: React.DragEvent, item: ColumnItem) => void,
  toggleSelect: (id: string, isMultiSelect: boolean, isRangeSelect: boolean) => void
) => {
  // Flatten the tree structure
  const flatItems = flattenTree(items);
  
  return flatItems.map((item, idx) => (
    <FlatItem
      key={item.id}
      item={item}
      index={idx}
      onDragStart={onDragStart}
      toggleSelect={toggleSelect}
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
  flatView = false // Default to tree view unless specified otherwise
}) => {
  return (
    <div 
      className="tree-view" 
      onDrop={onDrop} 
      onDragOver={onDragOver}
      style={{ 
        border: '1px solid #ccc', 
        height: '100%', 
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
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
            style={{
              marginRight: '5px',
              border: '1px solid #ccc',
              borderRadius: '3px',
              padding: '2px 6px',
              background: '#f0f0f0',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Select All
          </button>
          <button 
            onClick={onClearSelection}
            style={{
              border: '1px solid #ccc',
              borderRadius: '3px',
              padding: '2px 6px',
              background: '#f0f0f0',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Clear
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {items.length > 0 ? (
          flatView ? (
            // Flat view - render all leaf nodes regardless of hierarchy
            renderFlatItems(items, onDragStart, toggleSelect)
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