// src/components/GroupPanel/components/SelectedTreePanel.tsx
import React from 'react';
import { SelectedTreePanelProps } from '../../types';
import GroupItem from './GroupItem';
import { organizeItemsIntoTree, countItemsInGroup } from '../utils/treeUtils';

const SelectedTreePanel: React.FC<SelectedTreePanelProps> = ({
  selectedGroups,
  selectedItems,
  expandedGroups,
  draggedItemId,
  draggedGroupPath,
  groupDropTarget,
  dropTarget,
  dropIndicatorIndex,
  selectedPanelRef,
  onSelect,
  onMoveToAvailable,
  onMoveUp,
  onMoveDown,
  onClearAll,
  onDragStart,
  onGroupDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onToggleGroup
}) => {
  // Function to render tree nodes recursively
  const renderTreeNode = (node: any, path: string[] = [], level = 0) => {
    const entries = Object.entries(node);
    
    return (
      <>
        {entries.map(([key, value]: [string, any]) => {
          if (key === 'items') {
            return (value as any[]).map((item, idx) => (
              <GroupItem
                key={item.field as string}
                item={item}
                index={idx}
                isAvailable={false}
                isSelected={selectedItems.includes(item.field as string)}
                isDragging={item.field === draggedItemId}
                onSelect={onSelect}
                onDoubleClick={() => onMoveToAvailable([item.field as string])}
                onDragStart={(e, item) => onDragStart(e, item, false)}
                className="indented"
                style={{ paddingLeft: (level + 1) * 20 + 'px' }}
              />
            ));
          } else {
            const currentPath = [...path, key];
            const pathString = currentPath.join('.');
            const isExpanded = expandedGroups.has(pathString);
            const isDropTarget = groupDropTarget === pathString;
            const isDragging = draggedGroupPath === pathString;
            
            // Count items in this group
            const itemCount = countItemsInGroup(selectedGroups, pathString);
            
            // Only render groups that have items
            if (itemCount === 0) return null;
            
            return (
              <div key={pathString} className="group-container">
                <div 
                  className={`group-header ${isDropTarget ? 'group-drop-target' : ''} ${isDragging ? 'dragging' : ''}`}
                  style={{ paddingLeft: level ? `${level * 20}px` : undefined }}
                  draggable
                  onDragStart={(e) => onGroupDragStart(e, pathString)}
                  onDragOver={(e) => onDragOver(e, 'selected', pathString)}
                  onDrop={(e) => onDrop(e, 'selected', pathString)}
                >
                  <span 
                    className="expand-icon"
                    onClick={(e) => onToggleGroup(e, pathString)}
                  >
                    {isExpanded ? '−' : '+'}
                  </span>
                  <span className="group-name">{key}</span>
                  <span className="group-count">({itemCount})</span>
                </div>
                {isExpanded && renderTreeNode(value, currentPath, level + 1)}
              </div>
            );
          }
        })}
      </>
    );
  };

  // Organize selected items into a tree structure
  const selectedItemsTree = organizeItemsIntoTree(selectedGroups);
  
  // Get flat list of items not in any group
  const ungroupedItems = selectedGroups.filter(item => !item.groupPath || item.groupPath.length === 0);

  return (
    <div className="panel-section selected-columns">
      <div className="panel-header">
        <h3>Selected Groups</h3>
        <div className="column-count">
          {selectedGroups.length} groups
        </div>
      </div>
      <div className="panel-content">
        <div 
          ref={selectedPanelRef}
          className={`columns-list-container ${dropTarget === 'selected' ? 'drop-target-active' : ''}`}
          onDragOver={(e) => onDragOver(e, 'selected')}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, 'selected')}
        >
          <div className="columns-list">
            {/* Drop indicator at the top */}
            {dropIndicatorIndex === 0 && (
              <div className="drop-indicator"></div>
            )}
            
            {/* Render the tree structure */}
            {renderTreeNode(selectedItemsTree)}
            
            {/* Render ungrouped items */}
            {ungroupedItems.map((item, index) => (
              <React.Fragment key={item.field as string}>
                <GroupItem
                  item={item}
                  index={index}
                  isAvailable={false}
                  isSelected={selectedItems.includes(item.field as string)}
                  isDragging={item.field === draggedItemId}
                  onSelect={onSelect}
                  onDoubleClick={() => onMoveToAvailable([item.field as string])}
                  onDragStart={(e, item) => onDragStart(e, item, false)}
                />
                
                {/* Drop indicator after this item if it's at the right position */}
                {dropIndicatorIndex === selectedGroups.length - ungroupedItems.length + index + 1 && (
                  <div className="drop-indicator"></div>
                )}
              </React.Fragment>
            ))}
            
            {/* If list is empty, show drop indicator in empty state */}
            {selectedGroups.length === 0 && dropIndicatorIndex === 0 && (
              <div className="drop-indicator"></div>
            )}
          </div>
        </div>
      </div>
      <div className="panel-footer">
        <button 
          onClick={() => onMoveToAvailable(selectedItems)} 
          disabled={selectedItems.length === 0 || !selectedItems.some(id => selectedGroups.some(col => col.field === id))}
        >
          &lt; Remove from Selected
        </button>
        <button 
          onClick={onMoveUp} 
          disabled={selectedItems.length === 0 || !selectedItems.some(id => selectedGroups.some(col => col.field === id))}
        >
          Move Up
        </button>
        <button 
          onClick={onMoveDown} 
          disabled={selectedItems.length === 0 || !selectedItems.some(id => selectedGroups.some(col => col.field === id))}
        >
          Move Down
        </button>
        <button 
          onClick={onClearAll} 
          disabled={selectedGroups.length === 0}
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default SelectedTreePanel;