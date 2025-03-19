import React, { useCallback, useMemo } from 'react';
import { ColumnItem } from '../../types';
import TreeItem from './TreeItem';
import FlatItem from './FlatItem';
import { useTreeDragDrop } from './hooks/useTreeDragDrop';
import { countLeafNodes, countSelectedLeafNodes } from '../../utils/columnUtils';
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
  hideHeader?: boolean;
  onDoubleClick?: (item: ColumnItem) => void;
  countChildren?: boolean;
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
  source,
  hideHeader = false,
  onDoubleClick,
  countChildren = true
}) => {
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
  
  // Use custom hook for drag and drop functionality
  const {
    activeDropTarget,
    handleItemDragOver,
    handleDragLeave,
    handleContainerDragOver,
    handleDrop
  } = useTreeDragDrop(onDrop);
  
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

  // Count leaf nodes (excluding groups)
  const leafNodeCount = useMemo(() => countLeafNodes(items), [items]);
  
  // Count selected leaf nodes
  const selectedLeafCount = useMemo(() => countSelectedLeafNodes(items), [items]);
  
  return (
    <div 
      className="tree-view"
      onDragOver={handleContainerDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
    >
      {/* Header with actions - only show if not hidden */}
      {!hideHeader && (
        <div className="tree-view-header">
          <div className="header-left">
            <span className="title">{title}</span>
            <span className="column-count">{leafNodeCount} columns</span>
          </div>
          <div className="actions">
            {selectedCount > 0 && (
              <span className="selected-count">{selectedLeafCount} selected</span>
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
                onDragStart={onDragStart}
                toggleSelect={toggleSelect}
                onDragOver={handleItemDragOver}
                onDragLeave={handleDragLeave}
                groupName={groupName}
                showGroupLabels={showGroupLabels}
                getSelectedIds={getSelectedIds}
                source={source}
                onDoubleClick={onDoubleClick}
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
                onDoubleClick={onDoubleClick}
                countChildren={countChildren}
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