import React, { useCallback, useMemo, useRef, useState } from 'react';
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
  renderGroupHeader?: (groupId: string) => React.ReactNode;
  onContextMenu?: (e: React.MouseEvent, itemIds?: string[]) => void;
  onDropOnGroup?: (groupId: string, columnIds: string[]) => void;
  onRemoveFromGroup?: (columnIds: string[], groupId: string) => void;
  moveItemsToSelected?: (ids: string[], dropPosition: { targetId?: string, insertBefore: boolean }) => void;
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
  enableReordering = false,
  renderGroupHeader,
  onContextMenu,
  onDropOnGroup,
  onRemoveFromGroup,
  moveItemsToSelected
}) => {
  // Keep a reference to the selected IDs for use in drag events
  const selectedIdsRef = useRef(selectedIds);
  React.useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);
  
  // State for group drag targets
  const [groupDragTarget, setGroupDragTarget] = useState<string | null>(null);
  const [groupContentDragTarget, setGroupContentDragTarget] = useState<string | null>(null);
  const [emptyGroupDragTarget, setEmptyGroupDragTarget] = useState<string | null>(null);
  
  // Use custom hook for drag and drop functionality
  const {
    handleItemDragOver,
    handleDragLeave,
    handleContainerDragOver,
    handleDrop: handleEnhancedDrop
  } = useTreeDragDrop(onDrop);
  
// Replace the handleDragStart function in src/components/TreeView/index.tsx

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
  
  // Add source group information if applicable
  const sourceGroupId = item.groupId || item.parentGroupId;
  
  e.dataTransfer.setData('text/plain', JSON.stringify({
    ids: dragIds,
    source,
    itemName: dragText,
    sourceGroupId: sourceGroupId
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
  
  // Handle drag over a group header
  const handleGroupHeaderDragOver = useCallback((e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setGroupDragTarget(groupId);
  }, []);
  
  // Handle drag over group content area
  const handleGroupContentDragOver = useCallback((e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setGroupContentDragTarget(groupId);
  }, []);
  
  // Handle drop on a group
  const handleDropOnGroup = useCallback((e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!onDropOnGroup) return;
    
    try {
      // Get the drag data
      const dataText = e.dataTransfer.getData('text/plain');
      if (!dataText) {
        console.error('No drag data found');
        return;
      }
      
      const data = JSON.parse(dataText);
      
      if (data.source && data.ids && data.ids.length > 0) {
        // Handle drop differently based on source
        if (data.source === 'available') {
          // First move from available to selected
          if (moveItemsToSelected) {
            moveItemsToSelected(data.ids, { insertBefore: false });
            
            // Then add to group with a delay to ensure state is updated
            setTimeout(() => {
              onDropOnGroup(groupId, data.ids);
            }, 100);
          }
        } else if (data.source === 'selected') {
          // Direct add to group from selected
          onDropOnGroup(groupId, data.ids);
        }
      }
    } catch (err) {
      console.error('Error handling drop on group:', err);
    }
    
    // Reset drag targets
    setGroupDragTarget(null);
    setGroupContentDragTarget(null);
    setEmptyGroupDragTarget(null);
  }, [onDropOnGroup, moveItemsToSelected]);
  
  // Handle drop in a group (between items)
  const handleDropInGroup = useCallback((e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!onDropOnGroup) return;
    
    try {
      // Get the drag data
      const dataText = e.dataTransfer.getData('text/plain');
      if (!dataText) {
        console.error('No drag data found');
        return;
      }
      
      const data = JSON.parse(dataText);
      
      if (data.source && data.ids && data.ids.length > 0) {
        // Handle drop differently based on source
        if (data.source === 'available') {
          // First move from available to selected
          if (moveItemsToSelected) {
            moveItemsToSelected(data.ids, { insertBefore: false });
            
            // Then add to group with a delay to ensure state is updated
            setTimeout(() => {
              onDropOnGroup(groupId, data.ids);
            }, 100);
          }
        } else if (data.source === 'selected') {
          // Direct add to group from selected
          onDropOnGroup(groupId, data.ids);
        }
      }
    } catch (err) {
      console.error('Error handling drop in group:', err);
    }
    
    // Reset drag targets
    setGroupDragTarget(null);
    setGroupContentDragTarget(null);
    setEmptyGroupDragTarget(null);
  }, [onDropOnGroup, moveItemsToSelected]);
  
  // Handle context menu (right-click)
  const handleContextMenu = useCallback((e: React.MouseEvent, itemIds?: string[]) => {
    if (onContextMenu) {
      e.preventDefault();
      onContextMenu(e, itemIds);
    }
  }, [onContextMenu]);
  
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
  
  // Handle remove from group
  const handleRemoveFromGroup = useCallback((columnIds: string[], groupId: string) => {
    if (onRemoveFromGroup) {
      onRemoveFromGroup(columnIds, groupId);
    }
  }, [onRemoveFromGroup]);
  
  return (
    <div 
      className="tree-view"
      onDragOver={handleContainerDragOver}
      onDrop={handleEnhancedDrop}
      onDragLeave={handleDragLeave}
      onContextMenu={(e) => handleContextMenu(e, selectedIds)}
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
            // Tree view - hierarchical with special handling for groups
            items.map((item, index) => {
              // Check if this is a group item in the selected panel
              if (source === 'selected' && item.isGroup && renderGroupHeader && item.groupId) {
                return (
                  <div 
                    key={item.id} 
                    className={`group-container ${groupDragTarget === item.groupId ? 'drag-over' : ''}`}
                  >
                    {/* Render custom group header with enhanced drop handling */}
                    <div 
                      className={`group-header-wrapper ${groupDragTarget === item.groupId ? 'drag-over' : ''}`}
                      onDragOver={(e) => handleGroupHeaderDragOver(e, item.groupId!)}
                      onDragLeave={() => setGroupDragTarget(null)}
                      onDrop={(e) => handleDropOnGroup(e, item.groupId!)}
                    >
                      {renderGroupHeader(item.groupId)}
                    </div>
                    
                    {/* Render group children with enhanced drop handling */}
                    <div 
                      className={`group-content ${groupContentDragTarget === item.groupId ? 'drag-over' : ''}`}
                      onDragOver={(e) => handleGroupContentDragOver(e, item.groupId!)}
                      onDragLeave={() => setGroupContentDragTarget(null)}
                      onDrop={(e) => handleDropInGroup(e, item.groupId!)}
                    >
                      {item.children?.map((child, childIndex) => {
                        // Add parent group ID to the child item
                        const enhancedChild = {
                          ...child,
                          parentGroupId: item.groupId
                        };
                        
                        return (
                          <FlatItem
                            key={child.id}
                            item={enhancedChild}
                            index={childIndex}
                            isSelected={isItemSelected(child.id)}
                            onDragStart={handleDragStart}
                            onSelect={toggleSelect}
                            onDragOver={handleItemDragOver}
                            onDragLeave={handleDragLeave}
                            groupName={item.name}
                            showGroupLabels={false} // Don't show duplicate group labels
                            source={source}
                            onDoubleClick={handleItemDoubleClick}
                            enableReordering={enableReordering}
                            onRemoveFromGroup={item.groupId ? 
                              (columnIds) => handleRemoveFromGroup(columnIds, item.groupId!) : 
                              undefined}
                            groupId={item.groupId}
                          />
                        );
                      })}
                      
                      {/* Empty placeholder for dropping when group is empty */}
                      {(!item.children || item.children.length === 0) && (
                        <div 
                          className={`empty-group-placeholder ${emptyGroupDragTarget === item.groupId ? 'drag-over' : ''}`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEmptyGroupDragTarget(item.groupId!);
                          }}
                          onDragLeave={() => setEmptyGroupDragTarget(null)}
                          onDrop={(e) => handleDropOnGroup(e, item.groupId!)}
                        >
                          Drag columns here
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              
              // Normal tree item
              return (
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
              );
            })
          )
        ) : (
          <div className="empty-message drag-target">Drag columns here</div>
        )}
      </div>
    </div>
  );
};

export default React.memo(TreeView);