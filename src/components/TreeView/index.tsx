import React, { useCallback, useMemo, useRef } from 'react';
import { ColumnItem } from '../../types';
import TreeItem from './TreeItem';
import FlatItem from './FlatItem';
import { useTreeDragDrop } from './hooks/useTreeDragDrop';
import { countLeafNodes } from '../../utils/columnUtils';
import './TreeView.css';

interface TreeViewProps {
  items: ColumnItem[];
  selectedIds: string[];
  title: string;
  onDragStart: (e: React.DragEvent, item: ColumnItem) => void;
  onDrop: (e: React.DragEvent) => void;
  toggleExpand: (id: string) => void;
  toggleSelect: (id: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  selectedCount: number;
  totalCount: number;
  flatView?: boolean;
  showGroupLabels?: boolean;
  source: 'available' | 'selected';
  hideHeader?: boolean;
  onDoubleClick?: (item: ColumnItem) => void;
  countChildren?: boolean;
  enableReordering?: boolean;
}

const TreeView: React.FC<TreeViewProps> = ({
  items,
  selectedIds,
  title,
  onDragStart,
  onDrop,
  toggleExpand,
  toggleSelect,
  onSelectAll,
  onClearSelection,
  selectedCount,
  totalCount,
  flatView = false,
  showGroupLabels = false,
  source,
  hideHeader = false,
  onDoubleClick,
  countChildren = true,
  enableReordering = false
}) => {
  // Keep a reference to the selected IDs for use in drag events
  const selectedIdsRef = useRef(selectedIds);
  React.useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);
  
  // Use custom hook for drag and drop functionality
  const {
    handleItemDragOver,
    handleDragLeave,
    handleContainerDragOver,
    handleDrop: handleEnhancedDrop
  } = useTreeDragDrop(onDrop);
  
  // Handle drag start for any item (tree or flat)
  const handleDragStart = useCallback((e: React.DragEvent, item: ColumnItem) => {
    console.log(`Drag start in ${source} panel for item:`, item.id);
    console.log('Currently selected IDs:', selectedIdsRef.current);
    
    // Determine which items to include in the drag
    let dragIds: string[] = [];
    
    // If the item being dragged is in the selection, include all selected items
    if (selectedIdsRef.current.includes(item.id)) {
      dragIds = [...selectedIdsRef.current];
      console.log(`Item ${item.id} is part of multiselection, dragging all ${dragIds.length} selected items`);
    } else {
      // Otherwise, just include this one item
      dragIds = [item.id];
      console.log(`Item ${item.id} is not part of multiselection, dragging single item`);
    }
    
    // Set drag data
    const dragText = dragIds.length > 1 ? `${dragIds.length} columns` : item.name;
    
    // Set the drag data directly with all needed information
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({
      ids: dragIds,
      source,
      itemName: dragText
    }));
    
    // Add "being dragged" visual effect to all selected items
    if (dragIds.length > 1) {
      // Apply visual effect to all selected items
      document.querySelectorAll(`.tree-view[data-source="${source}"] .selected`).forEach(el => {
        el.classList.add('dragging');
      });
    }
    
    // Call the parent's drag handler
    onDragStart(e, item);
    
    // Clean up on drag end
    const handleDragEnd = () => {
      // Remove dragging class from all elements
      document.querySelectorAll('.dragging').forEach(el => {
        el.classList.remove('dragging');
      });
      
      document.removeEventListener('dragend', handleDragEnd);
    };
    
    document.addEventListener('dragend', handleDragEnd);
  }, [onDragStart, source]);
  
  // Check if an item is selected - this is the key function for selection state
  const isItemSelected = useCallback((id: string) => {
    return selectedIds.includes(id);
  }, [selectedIds]);
  
  // Generate flat items for flat view mode
  const flatItems = useMemo(() => {
    if (!flatView) return [];
    
    const result: Array<{ item: ColumnItem, groupName?: string, flatIndex: number }> = [];
    let flatIndex = 0;
    
    const processItem = (item: ColumnItem, groupName?: string) => {
      if (item.field && (!item.children || item.children.length === 0)) {
        // This is a leaf node
        result.push({ 
          item, 
          groupName, 
          flatIndex: flatIndex++ 
        });
      }
      
      if (item.children && item.children.length > 0) {
        // Process children with this item as their group
        const newGroupName = item.name;
        item.children.forEach(child => processItem(child, newGroupName));
      }
    };
    
    items.forEach(item => processItem(item));
    return result;
  }, [items, flatView]);
  
  // Handle double-click
  const handleItemDoubleClick = useCallback((item: ColumnItem) => {
    if (onDoubleClick) {
      onDoubleClick(item);
    }
  }, [onDoubleClick]);
  
  return (
    <div 
      className="tree-view"
      onDragOver={handleContainerDragOver}
      onDrop={handleEnhancedDrop}
      onDragLeave={handleDragLeave}
      data-source={source}
    >
      {/* Header with actions - only show if not hidden */}
      {!hideHeader && (
        <div className="tree-view-header">
          <div className="header-left">
            <span className="title">{title}</span>
            <span className="column-count">{totalCount} columns</span>
          </div>
          <div className="actions">
            {selectedCount > 0 && (
              <span className="selected-count">{selectedCount} selected</span>
            )}
            <button className="select-all-btn" onClick={onSelectAll}>Select All</button>
            <button className="clear-btn" onClick={onClearSelection}>Clear</button>
          </div>
        </div>
      )}
      
      {/* Content area */}
      <div className="tree-view-content">
        {items.length > 0 ? (
          flatView ? (
            // Flat view - only leaf nodes
            flatItems.map(({ item, groupName, flatIndex }, index) => (
              <FlatItem
                key={item.id}
                item={item}
                index={index}
                flatIndex={flatIndex}
                isSelected={isItemSelected(item.id)}
                onDragStart={handleDragStart}
                onSelect={toggleSelect}
                onDragOver={handleItemDragOver}
                onDragLeave={handleDragLeave}
                groupName={groupName}
                showGroupLabels={showGroupLabels}
                source={source}
                onDoubleClick={handleItemDoubleClick}
                enableReordering={enableReordering}
              />
            ))
          ) : (
            // Tree view - hierarchical
            items.map((item, index) => (
              <TreeItem
                key={item.id}
                item={item}
                depth={0}
                index={index}
                isSelected={isItemSelected(item.id)}
                onDragStart={handleDragStart}
                onExpand={toggleExpand}
                onSelect={toggleSelect}
                onDragOver={handleItemDragOver}
                onDragLeave={handleDragLeave}
                source={source}
                onDoubleClick={handleItemDoubleClick}
                countChildren={countChildren}
                enableReordering={enableReordering}
                selectedIds={selectedIds} // Pass selectedIds to enable checking children
              />
            ))
          )
        ) : (
          <div className="empty-message drag-target">Drag columns here</div>
        )}
      </div>
    </div>
  );
};

export default React.memo(TreeView);