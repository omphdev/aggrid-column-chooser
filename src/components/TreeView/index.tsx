import React, { useState, useRef, useCallback, useMemo } from 'react';
import { ColumnItem } from '../../types';
import TreeItem from './TreeItem';
import FlatItem from './FlatItem';
import { parseDragData, showInsertIndicator, hideAllDragIndicators, findDropPosition } from '../../utils/dragUtils';
import './TreeView.css';

interface TreeViewProps {
  items: ColumnItem[];
  title: string;
  onDragStart: (e: React.DragEvent, item: ColumnItem) => void;
  onDrop: (e: React.DragEvent) => void;
  toggleExpand: (id: string) => void;
  toggleSelect: (id: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  selectedCount: number;
  flatView?: boolean;
  showGroupLabels?: boolean;
  source: 'available' | 'selected';
}

const TreeView: React.FC<TreeViewProps> = ({
  items,
  title,
  onDragStart,
  onDrop,
  toggleExpand,
  toggleSelect,
  onSelectAll,
  onClearSelection,
  selectedCount,
  flatView = false,
  showGroupLabels = false,
  source
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeDropTarget, setActiveDropTarget] = useState<string | null>(null);
  
  // Get all selected IDs for drag operations
  const getSelectedIds = useCallback(() => {
    const result: string[] = [];
    
    const collectSelectedIds = (itemList: ColumnItem[]) => {
      for (const item of itemList) {
        if (item.selected) {
          result.push(item.id);
        }
        
        if (item.children && item.children.length > 0) {
          collectSelectedIds(item.children);
        }
      }
    };
    
    collectSelectedIds(items);
    return result;
  }, [items]);
  
  // Handle drag over for drop indicator
  const handleItemDragOver = useCallback((e: React.DragEvent, element: HTMLElement | null, itemId: string) => {
    if (!element) return;
    
    // Check if this is a valid drop target
    const dragData = parseDragData(e);
    if (!dragData) return;
    
    // Don't show indicator if dragging onto itself
    if (dragData.ids.length === 1 && dragData.ids[0] === itemId) return;
    
    // Show the insertion indicator
    showInsertIndicator(element, e.clientY < element.getBoundingClientRect().top + element.offsetHeight / 2);
    
    // Update active drop target
    setActiveDropTarget(itemId);
  }, []);
  
  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    // Small delay to prevent flickering
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setActiveDropTarget(null);
      }
    }, 50);
  }, []);
  
  // Handle container drag over
  const handleContainerDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    // Only handle if not over an item
    if (activeDropTarget === null && items.length > 0) {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        // Show indicator at the bottom
        const lastItem = containerRef.current?.querySelector('.tree-item:last-child, .flat-item:last-child') as HTMLElement;
        if (lastItem) {
          showInsertIndicator(lastItem, false);
        }
      }
    }
  }, [activeDropTarget, items.length]);
  
  // Handle drop
 const handleDrop = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  
  // Get the drop position
  let dropPosition;
  
  if (activeDropTarget) {
    // Find the target element
    const targetElement = document.querySelector(`[data-item-id="${activeDropTarget}"]`) as HTMLElement;
    if (targetElement) {
      dropPosition = findDropPosition(e, targetElement);
    }
  } else if (items.length > 0) {
    // Dropping at the end - use the last item as reference
    const lastItem = containerRef.current?.querySelector('.tree-item:last-child, .flat-item:last-child') as HTMLElement;
    if (lastItem) {
      dropPosition = {
        targetId: lastItem.dataset.itemId,
        insertBefore: false
      };
    }
  } else {
    // Empty container - no specific position
    dropPosition = {
      targetId: undefined,
      insertBefore: true
    };
  }
  
  // Enhance the event with position information
  const enhancedEvent = e as any;
  if (dropPosition) {
    enhancedEvent.dropPosition = dropPosition;
  }
  
  // Hide indicators
  hideAllDragIndicators();
  setActiveDropTarget(null);
  
  // Call parent drop handler
  onDrop(enhancedEvent);
}, [activeDropTarget, onDrop, items.length]);;
  
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
  
  return (
    <div 
      ref={containerRef}
      className="tree-view"
      onDragOver={handleContainerDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
    >
      {/* Header with actions */}
      <div className="tree-view-header">
        <span className="title">{title}</span>
        <div className="actions">
          {selectedCount > 0 && (
            <span className="selected-count">{selectedCount} selected</span>
          )}
          <button className="select-all-btn" onClick={onSelectAll}>Select All</button>
          <button className="clear-btn" onClick={onClearSelection}>Clear</button>
        </div>
      </div>
      
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
                onDragStart={onDragStart}
                toggleSelect={toggleSelect}
                onDragOver={handleItemDragOver}
                onDragLeave={handleDragLeave}
                groupName={groupName}
                showGroupLabels={showGroupLabels}
                getSelectedIds={getSelectedIds}
                source={source}
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
                onDragStart={onDragStart}
                toggleExpand={toggleExpand}
                toggleSelect={toggleSelect}
                onDragOver={handleItemDragOver}
                onDragLeave={handleDragLeave}
                getSelectedIds={getSelectedIds}
                source={source}
              />
            ))
          )
        ) : (
          <div className="empty-message">Drag columns here</div>
        )}
      </div>
    </div>
  );
};

export default React.memo(TreeView);