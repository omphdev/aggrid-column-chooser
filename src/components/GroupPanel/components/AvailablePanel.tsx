// src/components/GroupPanel/components/AvailablePanel.tsx
import React from 'react';
import { ColDef } from 'ag-grid-community';
import { AvailablePanelProps } from '../../types';
import GroupItem from './GroupItem';
import { countItemsInGroup } from '../utils/treeUtils';

const AvailablePanel: React.FC<AvailablePanelProps> = ({
  availableGroups,
  selectedItems,
  expandedGroups,
  draggedItemId,
  draggedGroupPath,
  groupDropTarget,
  dropTarget,
  availablePanelRef,
  onSelect,
  onMoveToSelected,
  onDragStart,
  onGroupDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onToggleGroup
}) => {
  // Function to create tree structure from columns
  const organizeItemsIntoTree = (items: (ColDef & { groupPath?: string[] })[]) => {
    const tree: any = {};
    
    items.forEach(item => {
      const groupPath = item.groupPath || [];
      // Exclude the last element (field name) from the group path
      const groupPathWithoutField = groupPath.slice(0, -1);
      
      let current = tree;
      
      groupPathWithoutField.forEach(group => {
        if (!current[group]) {
          current[group] = {};
        }
        current = current[group];
      });
      
      if (!current.items) {
        current.items = [];
      }
      
      current.items.push(item);
    });
    
    return tree;
  };

  // Function to render tree nodes recursively
  const renderTreeNode = (node: any, path: string[] = [], level = 0) => {
    const entries = Object.entries(node);
    
    return (
      <>
        {entries.map(([key, value]: [string, any]) => {
          if (key === 'items') {
            return (value as (ColDef & { groupPath?: string[] })[]).map((item, idx) => (
              <GroupItem
                key={item.field as string}
                item={item}
                index={idx}
                isAvailable={true}
                isSelected={selectedItems.includes(item.field as string)}
                isDragging={item.field === draggedItemId}
                onSelect={onSelect}
                onDoubleClick={() => onMoveToSelected([item.field as string])}
                onDragStart={(e, item) => onDragStart(e, item, true)}
              />
            ));
          } else {
            const currentPath = [...path, key];
            const pathString = currentPath.join('.');
            const isExpanded = expandedGroups.has(pathString);
            const isDropTarget = groupDropTarget === pathString;
            const isDragging = draggedGroupPath === pathString;
            
            // Count items in this group
            const itemCount = countItemsInGroup(availableGroups, pathString);
            
            // Only render groups that have items
            if (itemCount === 0) return null;
            
            return (
              <div key={pathString} className="group-container">
                <div 
                  className={`group-header ${isDropTarget ? 'group-drop-target' : ''} ${isDragging ? 'dragging' : ''}`}
                  style={{ paddingLeft: level ? `${level * 20}px` : undefined }}
                  draggable
                  onDragStart={(e) => onGroupDragStart(e, pathString)}
                  onDragOver={(e) => onDragOver(e, 'available', pathString)}
                  onDrop={(e) => onDrop(e, 'available', pathString)}
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

  // Organize available columns into a tree structure
  const availableItemsTree = organizeItemsIntoTree(availableGroups);

  return (
    <div className="panel-section available-columns">
      <div className="panel-header">
        <h3>Available Groups</h3>
        <div className="column-count">
          {availableGroups.length} groups
        </div>
      </div>
      <div className="panel-content">
        <div 
          ref={availablePanelRef}
          className={`columns-list-container ${dropTarget === 'available' ? 'drop-target-active' : ''}`}
          onDragOver={(e) => onDragOver(e, 'available')}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, 'available')}
        >
          <div className="columns-list">
            {renderTreeNode(availableItemsTree)}
          </div>
        </div>
      </div>
      <div className="panel-footer">
        <button 
          onClick={() => onMoveToSelected(selectedItems)} 
          disabled={selectedItems.length === 0 || !selectedItems.some(id => availableGroups.some(col => col.field === id))}
        >
          Add to Selected &gt;
        </button>
      </div>
    </div>
  );
};

export default AvailablePanel;