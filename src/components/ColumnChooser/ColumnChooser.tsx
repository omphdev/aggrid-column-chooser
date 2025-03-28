import React, { useState, useRef, useEffect } from 'react';
import { 
  TreeNode, 
  SelectedNode, 
  SelectedGroup, 
  DragItem,
  ExtendedColDef,
  ColumnChangeEvent
} from './types';
import AvailableColumnsPanel from './AvailableColumnsPanel';
import SelectedColumnsPanel from './SelectedColumnsPanel';
import './ColumnChooser.css';

interface ColumnChooserProps {
  availableColumns: TreeNode[];
  selectedColumns: SelectedNode[];
  selectedGroups: SelectedGroup[];
  onColumnSelectionChange: (event: ColumnChangeEvent) => void;
  onColumnGroupChange: (headerName: string, action: 'REMOVE' | 'UPDATE', replaceName?: string) => void;
  setSelectedGroups: React.Dispatch<React.SetStateAction<SelectedGroup[]>>;
}

const ColumnChooser: React.FC<ColumnChooserProps> = ({
  availableColumns,
  selectedColumns,
  selectedGroups,
  onColumnSelectionChange,
  onColumnGroupChange,
  setSelectedGroups
}) => {
  // State for selection
  const [selectedAvailableIds, setSelectedAvailableIds] = useState<string[]>([]);
  const [selectedSelectedIds, setSelectedSelectedIds] = useState<string[]>([]);
  
  // State for drag and drop
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  
  // State for search
  const [availableSearchQuery, setAvailableSearchQuery] = useState('');
  const [selectedSearchQuery, setSelectedSearchQuery] = useState('');
  
  // Refs for panels
  const availablePanelRef = useRef<HTMLDivElement>(null);
  const selectedPanelRef = useRef<HTMLDivElement>(null);
  
  // Drop position ref
  const dropPositionRef = useRef<number | null>(null);

  // Logger for debugging
  const logDebug = (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ColumnChooser] ${message}`, data || '');
    }
  };

  // Clear selections when components re-render with new data
  useEffect(() => {
    setSelectedAvailableIds([]);
    setSelectedSelectedIds([]);
  }, [availableColumns, selectedColumns]);

  // Handle move up/down in selected panel
  const handleMoveUpDown = (direction: 'up' | 'down') => {
    if (selectedSelectedIds.length === 0) return;

    // Create a new array with the current order
    const newOrder = [...selectedColumns];
    const indices = selectedSelectedIds.map(id => 
      newOrder.findIndex(col => col.id === id)
    ).sort(direction === 'up' ? (a, b) => a - b : (a, b) => b - a);

    // Move each selected item
    indices.forEach(idx => {
      const newIdx = direction === 'up' 
        ? Math.max(0, idx - 1) 
        : Math.min(newOrder.length - 1, idx + 1);
      
      if (idx !== newIdx) {
        const [removed] = newOrder.splice(idx, 1);
        newOrder.splice(newIdx, 0, removed);
      }
    });

    // Send the reorder event
    onColumnSelectionChange({
      items: newOrder.map(node => node.column),
      operationType: 'REORDER'
    });
  };

  // Handle select all available columns
  const handleSelectAllAvailable = () => {
    const allIds: string[] = [];
    
    const collectIds = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (!node.isGroup) {
          allIds.push(node.id);
        }
        if (node.children.length > 0) {
          collectIds(node.children);
        }
      });
    };

    collectIds(availableColumns);
    setSelectedAvailableIds(allIds);
  };

  // Handle select all selected columns
  const handleSelectAllSelected = () => {
    setSelectedSelectedIds(selectedColumns.map(node => node.id));
  };

  // Handle clear selection
  const handleClearAvailableSelection = () => {
    setSelectedAvailableIds([]);
  };

  const handleClearSelectedSelection = () => {
    setSelectedSelectedIds([]);
  };

  // Handle clear all selected columns (move all to available)
  const handleClearAllSelected = () => {
    onColumnSelectionChange({
      items: selectedColumns.map(node => node.column),
      operationType: 'REMOVE'
    });
  };

  // Handle drag start - modified to handle multiple selections
  const handleDragStart = (item: DragItem) => {
    logDebug('Starting drag operation', item);
    
    const selectedIds = 
      item.source === 'available' 
        ? selectedAvailableIds 
        : selectedSelectedIds;
    
    // Create a new object to avoid mutating the original
    const enhancedItem: DragItem = {
      ...item,
      selectedIds: selectedIds.includes(item.id) ? [...selectedIds] : [item.id]
    };
    
    setDraggedItem(enhancedItem);
  };

  // Handle drag over
  const handleDragOver = (event: React.DragEvent, targetId: string, position?: number) => {
    event.preventDefault();
    
    // Make drag operations more permissive
    event.dataTransfer.dropEffect = 'move';
    
    setDropTarget(targetId);
    if (position !== undefined) {
      dropPositionRef.current = position;
      logDebug('Setting drop position', position);
    }
  };

  // Helper to find all leaf nodes in a tree
  const findAllLeafNodes = (nodes: TreeNode[]): ExtendedColDef[] => {
    const leafNodes: ExtendedColDef[] = [];
    
    const traverse = (nodeList: TreeNode[]) => {
      nodeList.forEach(node => {
        if (!node.isGroup && node.column) {
          leafNodes.push(node.column);
        } else if (node.children.length > 0) {
          traverse(node.children);
        }
      });
    };
    
    traverse(nodes);
    return leafNodes;
  };

  // Handle group drag - find all leaf nodes in the group
  const findGroupLeafNodes = (groupId: string, nodes: TreeNode[]): ExtendedColDef[] => {
    for (const node of nodes) {
      if (node.id === groupId && node.isGroup) {
        return findAllLeafNodes(node.children);
      }
      if (node.children.length > 0) {
        const found = findGroupLeafNodes(groupId, node.children);
        if (found.length > 0) return found;
      }
    }
    return [];
  };

  // Helper to get column IDs in a group
  const getGroupColumnIds = (groupId: string): string[] => {
    const group = selectedGroups.find(g => g.id === groupId);
    return group ? [...group.children] : [];
  };

  // Handle drop
  const handleDrop = (target: { id: string, type: 'available' | 'selected', parentId?: string, index?: number }) => {
    logDebug('Handling drop event', { target, draggedItem });
    
    if (!draggedItem) {
      logDebug('No dragged item found');
      return;
    }

    try {
      // Handle drops between panels
      if (draggedItem.source !== target.type) {
        if (draggedItem.source === 'available' && target.type === 'selected') {
          // Moving from available to selected
          let columnsToMove: ExtendedColDef[] = [];
          
          // Check if dragging a group
          if (draggedItem.type === 'group') {
            // Find all leaf nodes in the group
            columnsToMove = findGroupLeafNodes(draggedItem.id, availableColumns);
            logDebug('Moving group from available to selected', { groupId: draggedItem.id, columns: columnsToMove });
          } else {
            // Handle regular column or multiple selected columns
            const selectedIds = draggedItem.selectedIds || [draggedItem.id];
            logDebug('Moving columns from available to selected', { selectedIds });
            
            const findColumnsInTree = (nodes: TreeNode[], ids: string[]) => {
              nodes.forEach(node => {
                if (!node.isGroup && ids.includes(node.id) && node.column) {
                  columnsToMove.push(node.column);
                }
                if (node.children.length > 0) {
                  findColumnsInTree(node.children, ids);
                }
              });
            };

            findColumnsInTree(availableColumns, selectedIds);
          }

          if (columnsToMove.length > 0) {
            // Determine insert position - use target index if provided
            const insertIndex = target.index !== undefined ? target.index : selectedColumns.length;
            logDebug('Adding columns at index', { insertIndex, count: columnsToMove.length });
            
            onColumnSelectionChange({
              items: columnsToMove,
              operationType: 'ADD',
              index: insertIndex
            });
            
            // If dropping into a group, add the columns to that group
            if (target.parentId) {
              const columnIds = columnsToMove.map(col => col.id || col.field || '');
              logDebug('Adding columns to group', { groupId: target.parentId, columnIds });
              handleGroupColumnsChanged(target.parentId, [...getGroupColumnIds(target.parentId), ...columnIds]);
            }
          }
        } else if (draggedItem.source === 'selected' && target.type === 'available') {
          // Moving from selected to available
          const selectedIds = draggedItem.selectedIds || [draggedItem.id];
          logDebug('Moving columns from selected to available', { selectedIds });
          
          const columnsToMove = selectedColumns
            .filter(col => selectedIds.includes(col.id))
            .map(node => node.column);
          
          if (columnsToMove.length > 0) {
            onColumnSelectionChange({
              items: columnsToMove,
              operationType: 'REMOVE'
            });
          }
        }
      } else if (draggedItem.source === 'selected' && target.type === 'selected') {
        // Reordering within selected panel
        const selectedIds = draggedItem.selectedIds || [draggedItem.id];
        
        logDebug('Reordering within selected panel', { 
          selectedIds,
          draggedItem,
          target
        });
        
        // If there's only one item and we're dropping it in its original position, do nothing
        if (selectedIds.length === 1 && target.id === draggedItem.id && !target.parentId && !draggedItem.parentId) {
          logDebug('Dropping in same position, no action needed');
          setDraggedItem(null);
          setDropTarget(null);
          return;
        }
        
        // If dragging a group
        if (draggedItem.type === 'group') {
          // Handle dragging an entire group
          logDebug('Dragging an entire group', { groupId: draggedItem.id });
          handleDragGroup(draggedItem.id, target);
        } else {
          // Regular column reordering or moving in/out of groups
          
          // Determine if this is a group operation
          const sourceGroupId = draggedItem.parentId;
          const targetGroupId = target.parentId;
          
          logDebug('Group operation check', { sourceGroupId, targetGroupId });
          
          if (sourceGroupId && targetGroupId && sourceGroupId === targetGroupId) {
            // Reordering within the same group
            logDebug('Reordering within same group', { groupId: sourceGroupId });
            const groupColumnIds = getGroupColumnIds(sourceGroupId);
            
            // Remove dragged items
            const remainingIds = groupColumnIds.filter(id => !selectedIds.includes(id));
            
            // Find insertion point
            let insertIndex = target.index !== undefined 
              ? target.index 
              : remainingIds.findIndex(id => id === target.id);
            
            logDebug('Insert point within group', { insertIndex });
            
            if (insertIndex === -1) insertIndex = remainingIds.length;
            
            // Insert items at position
            remainingIds.splice(insertIndex, 0, ...selectedIds);
            logDebug('New group column order', remainingIds);
            
            // Update group
            handleGroupColumnsChanged(sourceGroupId, remainingIds);
          } else if (sourceGroupId && !targetGroupId) {
            // Moving from group to ungrouped
            logDebug('Moving from group to ungrouped', { sourceGroupId, selectedIds });
            
            // Remove from source group
            const updatedSourceGroupIds = getGroupColumnIds(sourceGroupId)
              .filter(id => !selectedIds.includes(id));
            
            logDebug('Updated source group IDs', updatedSourceGroupIds);
            handleGroupColumnsChanged(sourceGroupId, updatedSourceGroupIds);
            
            // Create a copy of current columns
            const newOrder = [...selectedColumns];
            
            // Find the items we're moving
            const itemsToMove = newOrder.filter(item => selectedIds.includes(item.id));
            logDebug('Items to move', itemsToMove);
            
            // Remove them from their current positions
            const remainingItems = newOrder.filter(item => !selectedIds.includes(item.id));
            
            // Determine insert position more accurately
            let insertIndex;
            
            if (target.index !== undefined) {
              // Use explicit position if provided
              insertIndex = target.index;
              logDebug('Using provided index', insertIndex);
            } else if (target.id === 'empty-selected-panel') {
              // Drop at the end if targeting empty area
              insertIndex = remainingItems.length;
              logDebug('Dropping at end of empty panel', insertIndex);
            } else {
              // Find the target column's position in remaining items
              insertIndex = remainingItems.findIndex(item => item.id === target.id);
              logDebug('Found target at index', insertIndex);
              
              // If dropping after the target column
              if (dropPositionRef.current !== null && dropPositionRef.current > 0) {
                insertIndex++;
                logDebug('Adjusted index for after-position drop', insertIndex);
              }
              
              // If not found, add to the end
              if (insertIndex === -1) {
                insertIndex = remainingItems.length;
                logDebug('Target not found, adding to end', insertIndex);
              }
            }
            
            // Insert items at the target position
            remainingItems.splice(insertIndex, 0, ...itemsToMove);
            logDebug('Final column order', remainingItems.map(i => i.id));
            
            // Update the grid with the new order
            onColumnSelectionChange({
              items: remainingItems.map(node => node.column),
              operationType: 'REORDER'
            });
          } else if (!sourceGroupId && targetGroupId) {
            // Moving from ungrouped to group
            logDebug('Moving from ungrouped to group', { targetGroupId });
            
            // Add to target group
            const updatedTargetGroupIds = [...getGroupColumnIds(targetGroupId)];
            
            // Insert at specific position
            const insertIndex = target.index !== undefined 
              ? target.index 
              : updatedTargetGroupIds.length;
            
            logDebug('Insert position in target group', { insertIndex });
            updatedTargetGroupIds.splice(insertIndex, 0, ...selectedIds);
            
            handleGroupColumnsChanged(targetGroupId, updatedTargetGroupIds);
          } else if (sourceGroupId && targetGroupId && sourceGroupId !== targetGroupId) {
            // Moving between different groups
            logDebug('Moving between different groups', { sourceGroupId, targetGroupId });
            
            // Remove from source group
            const updatedSourceGroupIds = getGroupColumnIds(sourceGroupId)
              .filter(id => !selectedIds.includes(id));
            
            handleGroupColumnsChanged(sourceGroupId, updatedSourceGroupIds);
            
            // Add to target group
            const updatedTargetGroupIds = [...getGroupColumnIds(targetGroupId)];
            
            // Insert at specific position
            const insertIndex = target.index !== undefined 
              ? target.index 
              : updatedTargetGroupIds.length;
            
            updatedTargetGroupIds.splice(insertIndex, 0, ...selectedIds);
            
            handleGroupColumnsChanged(targetGroupId, updatedTargetGroupIds);
          } else {
            // Regular reordering in ungrouped area
            logDebug('Regular reordering in ungrouped area');
            
            // Create a copy of current columns
            const newOrder = [...selectedColumns];
            
            // Remove dragged items from their current positions
            const itemsToMove = newOrder.filter(item => selectedIds.includes(item.id));
            const remainingItems = newOrder.filter(item => !selectedIds.includes(item.id));
            
            // Determine insert position
            let insertIndex;
            if (target.index !== undefined) {
              // Use explicit position if provided
              insertIndex = target.index;
              logDebug('Using provided index', insertIndex);
            } else if (target.id === 'empty-selected-panel') {
              // Drop at the end if targeting empty area
              insertIndex = remainingItems.length;
              logDebug('Dropping at end of panel', insertIndex);
            } else {
              // Find the target column's position in remaining items
              insertIndex = remainingItems.findIndex(item => item.id === target.id);
              
              // If dropping after the target column (based on cursor position)
              if (dropPositionRef.current !== null && dropPositionRef.current > 0) {
                insertIndex++;
                logDebug('Adjusted for after-position drop', insertIndex);
              }
              
              // If not found, add to the end
              if (insertIndex === -1) {
                insertIndex = remainingItems.length;
                logDebug('Target not found, adding to end', insertIndex);
              }
            }
            
            // Insert items at the target position
            remainingItems.splice(insertIndex, 0, ...itemsToMove);
            logDebug('Final column order', remainingItems.map(i => i.id));
            
            onColumnSelectionChange({
              items: remainingItems.map(node => node.column),
              operationType: 'REORDER'
            });
          }
        }
      }
    } catch (e) {
      console.error('Error in handleDrop:', e);
    } finally {
      // Always reset drag state
      setDraggedItem(null);
      setDropTarget(null);
      dropPositionRef.current = null;
    }
  };

  // Handle dragging a group
  const handleDragGroup = (groupId: string, target: { id: string, type: string, parentId?: string, index?: number }) => {
    // Get columns in the dragged group
    const groupColumnIds = getGroupColumnIds(groupId);
    if (groupColumnIds.length === 0) return;
    
    if (target.parentId) {
      // Dragging a group into another group (merge)
      const targetGroupIds = getGroupColumnIds(target.parentId);
      
      // Insert at specific position
      const insertIndex = target.index !== undefined 
        ? target.index 
        : targetGroupIds.length;
      
      const updatedTargetGroupIds = [...targetGroupIds];
      updatedTargetGroupIds.splice(insertIndex, 0, ...groupColumnIds);
      
      // Update target group
      handleGroupColumnsChanged(target.parentId, updatedTargetGroupIds);
      
      // Remove source group
      handleRemoveGroup(groupId);
    } else {
      // Dragging a group to the ungrouped area
      // Get the columns for this group
      const groupColumns = selectedColumns.filter(col => groupColumnIds.includes(col.id));
      
      // Create a copy of current columns
      const newOrder = [...selectedColumns];
      
      // Remove group columns from their current positions
      const remainingItems = newOrder.filter(item => !groupColumnIds.includes(item.id));
      
      // Determine insert position
      let insertIndex = target.index !== undefined 
        ? target.index 
        : target.id === 'empty-selected-panel' 
          ? remainingItems.length 
          : remainingItems.findIndex(item => item.id === target.id);
          
      if (insertIndex === -1) insertIndex = remainingItems.length;
      
      // Insert items at the target position
      remainingItems.splice(insertIndex, 0, ...groupColumns);
      
      onColumnSelectionChange({
        items: remainingItems.map(node => node.column),
        operationType: 'REORDER'
      });
      
      // Remove the group
      handleRemoveGroup(groupId);
    }
  };

  // Handle double-click to move between panels
  const handleDoubleClick = (id: string, source: 'available' | 'selected', isGroup?: boolean) => {
    if (source === 'available') {
      // Move from available to selected
      if (isGroup) {
        // Double-click on group - move all children
        const columnsToMove = findGroupLeafNodes(id, availableColumns);
        
        if (columnsToMove.length > 0) {
          onColumnSelectionChange({
            items: columnsToMove,
            operationType: 'ADD'
          });
        }
      } else {
        // Double-click on column
        const columnsToMove: ExtendedColDef[] = [];
        
        const findColumnsInTree = (nodes: TreeNode[], clickedId: string) => {
          for (const node of nodes) {
            if (!node.isGroup && node.id === clickedId && node.column) {
              columnsToMove.push(node.column);
              return true;
            }
            if (node.children.length > 0 && findColumnsInTree(node.children, clickedId)) {
              return true;
            }
          }
          return false;
        };

        findColumnsInTree(availableColumns, id);

        if (columnsToMove.length > 0) {
          onColumnSelectionChange({
            items: columnsToMove,
            operationType: 'ADD'
          });
        }
      }
    } else {
      // Move from selected to available
      const column = selectedColumns.find(col => col.id === id)?.column;
      
      if (column) {
        onColumnSelectionChange({
          items: [column],
          operationType: 'REMOVE'
        });
      }
    }
  };

  // Handle creating a new group
  const handleCreateGroup = (name: string) => {
    if (selectedSelectedIds.length === 0) return;

    const newGroup: SelectedGroup = {
      id: `group-${Math.random().toString(36).substring(2, 9)}`,
      name,
      children: selectedSelectedIds
    };

    setSelectedGroups(prev => [...prev, newGroup]);
    setSelectedSelectedIds([]);
  };

  // Handle removing a group
  const handleRemoveGroup = (groupId: string) => {
    const group = selectedGroups.find(g => g.id === groupId);
    if (!group) return;

    onColumnGroupChange(group.name, 'REMOVE');
  };

  // Handle updating a group
  const handleUpdateGroup = (groupId: string, newName: string) => {
    const group = selectedGroups.find(g => g.id === groupId);
    if (!group) return;

    onColumnGroupChange(group.name, 'UPDATE', newName);
  };

  // Handle adding columns to a group
  const handleAddToGroup = (groupId: string) => {
    if (selectedSelectedIds.length === 0) return;

    setSelectedGroups(prev => 
      prev.map(group => 
        group.id === groupId
          ? { ...group, children: [...new Set([...group.children, ...selectedSelectedIds])] }
          : group
      )
    );

    setSelectedSelectedIds([]);
  };

  // Handle removing columns from a group
  const handleRemoveFromGroup = (groupId: string, columnIds: string[]) => {
    logDebug('Removing columns from group', { groupId, columnIds });
    
    setSelectedGroups(prev => 
      prev.map(group => 
        group.id === groupId
          ? { ...group, children: group.children.filter(id => !columnIds.includes(id)) }
          : group
      )
    );
  };

  // Handle group columns changed (reordering or moving)
  const handleGroupColumnsChanged = (groupId: string, newColumnIds: string[]) => {
    logDebug('Changing group columns', { groupId, newColumnIds });
    
    setSelectedGroups(prev => 
      prev.map(group => 
        group.id === groupId
          ? { ...group, children: newColumnIds }
          : group
      )
    );
    
    // Get the group to notify the consumer
    const group = selectedGroups.find(g => g.id === groupId);
    if (group) {
      // We use UPDATE to signal group contents changed
      onColumnGroupChange(group.name, 'UPDATE', group.name);
    }
  };

  // Handle direct column selection change from SelectedColumnsPanel
  const handleColumnSelectionChange = (event: ColumnChangeEvent) => {
    onColumnSelectionChange(event);
  };

  // Filter available columns based on search
  const filteredAvailableColumns = React.useMemo(() => {
    if (!availableSearchQuery) return availableColumns;

    const searchLower = availableSearchQuery.toLowerCase();
    
    const filterNodes = (nodes: TreeNode[]): TreeNode[] => {
      return nodes
        .map(node => {
          if (node.isGroup) {
            const filteredChildren = filterNodes(node.children);
            if (filteredChildren.length > 0) {
              return {
                ...node,
                children: filteredChildren,
                isExpanded: true // Auto-expand groups with matching children
              };
            }
            // If group name matches, include the whole group
            if (node.name.toLowerCase().includes(searchLower)) {
              return { ...node, isExpanded: true };
            }
            return null;
          } else {
            // Leaf node - check if name matches
            if (node.name.toLowerCase().includes(searchLower)) {
              return node;
            }
            return null;
          }
        })
        .filter((node): node is TreeNode => node !== null);
    };

    return filterNodes(availableColumns);
  }, [availableColumns, availableSearchQuery]);

  // Filter selected columns based on search
  const filteredSelectedColumns = React.useMemo(() => {
    if (!selectedSearchQuery) return selectedColumns;

    const searchLower = selectedSearchQuery.toLowerCase();
    return selectedColumns.filter(col => 
      col.name.toLowerCase().includes(searchLower)
    );
  }, [selectedColumns, selectedSearchQuery]);

  return (
    <div className="column-chooser">
      <div className="column-chooser-header">
        <h3>Column Chooser</h3>
      </div>
      
      <div className="column-chooser-content">
        <div className="column-panels">
          <AvailableColumnsPanel
            columns={filteredAvailableColumns}
            selectedIds={selectedAvailableIds}
            setSelectedIds={setSelectedAvailableIds}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            dropTarget={dropTarget}
            draggedItem={draggedItem}
            onDoubleClick={handleDoubleClick}
            searchQuery={availableSearchQuery}
            setSearchQuery={setAvailableSearchQuery}
          />
          
          <SelectedColumnsPanel
            columns={filteredSelectedColumns}
            groups={selectedGroups}
            selectedIds={selectedSelectedIds}
            setSelectedIds={setSelectedSelectedIds}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            dropTarget={dropTarget}
            draggedItem={draggedItem}
            onDoubleClick={handleDoubleClick}
            onCreateGroup={handleCreateGroup}
            onRemoveGroup={handleRemoveGroup}
            onUpdateGroup={handleUpdateGroup}
            onAddToGroup={handleAddToGroup}
            onRemoveFromGroup={handleRemoveFromGroup}
            onGroupColumnsChanged={handleGroupColumnsChanged}
            searchQuery={selectedSearchQuery}
            setSearchQuery={setSelectedSearchQuery}
            onColumnSelectionChange={handleColumnSelectionChange}
          />
        </div>
        
        <div className="column-chooser-actions">
          <div className="available-actions">
            <button onClick={handleSelectAllAvailable}>Select All Available</button>
            <button onClick={handleClearAvailableSelection} disabled={selectedAvailableIds.length === 0}>
              Clear Selection
            </button>
          </div>
          
          <div className="selected-actions">
            <button onClick={handleSelectAllSelected}>Select All Selected</button>
            <button onClick={handleClearSelectedSelection} disabled={selectedSelectedIds.length === 0}>
              Clear Selection
            </button>
            <button onClick={handleClearAllSelected} disabled={selectedColumns.length === 0}>
              Clear All
            </button>
            <button onClick={() => handleMoveUpDown('up')} disabled={selectedSelectedIds.length === 0}>
              Move Up
            </button>
            <button onClick={() => handleMoveUpDown('down')} disabled={selectedSelectedIds.length === 0}>
              Move Down
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnChooser;