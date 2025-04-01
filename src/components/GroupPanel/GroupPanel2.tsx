// src/components/GroupPanel/GroupPanel2.tsx
import React, { useRef, useState, useEffect } from 'react';
import { ColDef } from 'ag-grid-community';
import { GroupPanelProps } from '../types';
import AvailablePanel from './components/AvailablePanel';
import SelectedTreePanel from './components/SelectedTreePanel';
import { organizeItemsIntoTree } from './utils/treeUtils';

const GroupPanel2: React.FC<GroupPanelProps> = ({
  groupsCols,
  selectedGroups,
  onGroupChanged
}) => {
  // Refs for tracking reordering state and timestamps
  const isReorderingRef = useRef<boolean>(false);
  const lastReorderTimeRef = useRef<number>(0);
  
  // Refs for the panels
  const availablePanelRef = useRef<HTMLDivElement | null>(null);
  const selectedPanelRef = useRef<HTMLDivElement | null>(null);

  // State for available and selected groups
  const [availableGroups, setAvailableGroups] = useState<(ColDef & { groupPath?: string[] })[]>([]);
  const [selectedGroupCols, setSelectedGroupCols] = useState<(ColDef & { groupPath?: string[] })[]>([]);
  
  // State for selection
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // State for drag and drop
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number>(-1);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [draggedGroupPath, setDraggedGroupPath] = useState<string | null>(null);
  const [groupDropTarget, setGroupDropTarget] = useState<string | null>(null);
  
  // State for expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedSelectedGroups, setExpandedSelectedGroups] = useState<Set<string>>(new Set());

  // Initialize groups from props
  useEffect(() => {
    if (isReorderingRef.current) return;
    
    // Available groups are those not in selectedGroups
    const available = groupsCols.filter(col => !selectedGroups.includes(col.field as string));
    setAvailableGroups(available);
    
    // Selected groups are those in selectedGroups
    const selected = selectedGroups
      .map(field => groupsCols.find(col => col.field === field))
      .filter(Boolean) as (ColDef & { groupPath?: string[] })[];
    setSelectedGroupCols(selected);
    
    // Initialize expanded groups from groupPaths
    const initialExpandedGroups = new Set<string>();
    const initialExpandedSelectedGroups = new Set<string>();
    
    groupsCols.forEach(col => {
      if (col.groupPath) {
        let path = "";
        col.groupPath.forEach(segment => {
          path = path ? `${path}.${segment}` : segment;
          if (selectedGroups.includes(col.field as string)) {
            initialExpandedSelectedGroups.add(path);
          } else {
            initialExpandedGroups.add(path);
          }
        });
      }
    });
    
    setExpandedGroups(initialExpandedGroups);
    setExpandedSelectedGroups(initialExpandedSelectedGroups);
  }, [groupsCols, selectedGroups]);

  // Handle selection
  const handleSelect = (itemId: string, isMultiSelect: boolean, isRangeSelect: boolean) => {
    let newSelectedItems = [...selectedItems];
    
    if (isMultiSelect) {
      // Toggle selection for multi-select (Ctrl/Cmd+click)
      if (newSelectedItems.includes(itemId)) {
        newSelectedItems = newSelectedItems.filter(id => id !== itemId);
      } else {
        newSelectedItems.push(itemId);
      }
    } else if (isRangeSelect) {
      // Range selection (Shift+click)
      if (newSelectedItems.length > 0) {
        const lastSelectedId = newSelectedItems[newSelectedItems.length - 1];
        const allItems = [...availableGroups, ...selectedGroupCols];
        
        const lastSelectedIndex = allItems.findIndex(col => col.field === lastSelectedId);
        const currentIndex = allItems.findIndex(col => col.field === itemId);
        
        if (lastSelectedIndex !== -1 && currentIndex !== -1) {
          const startIndex = Math.min(lastSelectedIndex, currentIndex);
          const endIndex = Math.max(lastSelectedIndex, currentIndex);
          
          const rangeIds = allItems
            .slice(startIndex, endIndex + 1)
            .map(col => col.field as string);
            
          newSelectedItems = Array.from(new Set([...newSelectedItems, ...rangeIds]));
        }
      } else {
        newSelectedItems = [itemId];
      }
    } else {
      // Single selection (regular click)
      newSelectedItems = [itemId];
    }
    
    setSelectedItems(newSelectedItems);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedItems([]);
  };

  // Handle toggle group expansion in available panel
  const toggleGroup = (e: React.MouseEvent, groupPath: string) => {
    e.stopPropagation();
    
    const newExpandedGroups = new Set(expandedGroups);
    
    if (newExpandedGroups.has(groupPath)) {
      newExpandedGroups.delete(groupPath);
    } else {
      newExpandedGroups.add(groupPath);
    }
    
    setExpandedGroups(newExpandedGroups);
  };

  // Handle toggle group expansion in selected panel
  const toggleSelectedGroup = (e: React.MouseEvent, groupPath: string) => {
    e.stopPropagation();
    
    const newExpandedGroups = new Set(expandedSelectedGroups);
    
    if (newExpandedGroups.has(groupPath)) {
      newExpandedGroups.delete(groupPath);
    } else {
      newExpandedGroups.add(groupPath);
    }
    
    setExpandedSelectedGroups(newExpandedGroups);
  };

  // Reset drag state
  const resetDragState = () => {
    setDropTarget(null);
    setDropIndicatorIndex(-1);
    setDraggedItemId(null);
    setDraggedGroupPath(null);
    setGroupDropTarget(null);
  };

  // Group reordering function
  const reorderGroup = (groupId: string, targetIndex: number, items: string[]) => {
    // If we're dragging multiple groups, we need to handle them all
    const groupsToMove = items.includes(groupId) ? items : [groupId];
    
    // Prevent multiple rapid reordering operations
    const now = Date.now();
    if (now - lastReorderTimeRef.current < 200) {
      console.log('Ignoring rapid reordering request');
      return;
    }
    
    // Update the timestamp
    lastReorderTimeRef.current = now;
    
    // Find indices of groups to move
    const groupIndices = groupsToMove
      .map(id => selectedGroupCols.findIndex(col => col.field === id))
      .filter(index => index !== -1)
      .sort((a, b) => a - b); // Sort in ascending order
    
    if (groupIndices.length === 0 || targetIndex < 0) return;
    
    console.log(`Reordering groups [${groupsToMove.join(', ')}] to index ${targetIndex}`);
    
    // Mark that we are reordering
    isReorderingRef.current = true;
    
    // Create a deep copy to avoid mutation issues
    const groupsCopy = JSON.parse(JSON.stringify(selectedGroupCols));
    
    // Create an array of groups to move
    const movedGroups = groupIndices.map(index => groupsCopy[index]);
    
    // Remove groups from original array (in reverse order to maintain correct indices)
    for (let i = groupIndices.length - 1; i >= 0; i--) {
      groupsCopy.splice(groupIndices[i], 1);
    }
    
    // Adjust the target index based on how many items were removed before the target
    let adjustedTargetIndex = targetIndex;
    for (const index of groupIndices) {
      if (index < targetIndex) {
        adjustedTargetIndex--;
      }
    }
    
    // Make sure the target index is valid
    adjustedTargetIndex = Math.max(0, Math.min(adjustedTargetIndex, groupsCopy.length));
    
    // Insert all moved groups at the target position
    groupsCopy.splice(adjustedTargetIndex, 0, ...movedGroups);
    
    // Update the state
    setSelectedGroupCols(groupsCopy);
    
    // Notify parent component about the reordering
    if (onGroupChanged) {
      onGroupChanged(groupsCopy, 'REORDERED');
    }
    
    // Reset the reordering flag after a delay
    setTimeout(() => {
      isReorderingRef.current = false;
    }, 100);
  };

  // Move up function
  const moveUp = () => {
    if (selectedItems.length === 0) return;
    
    const newSelectedGroups = [...selectedGroupCols];
    const indices = selectedItems
      .map(id => newSelectedGroups.findIndex(col => col.field === id))
      .filter(index => index !== -1)
      .sort((a, b) => a - b);
    
    // Can't move up if the first selected item is already at the top
    if (indices[0] === 0) return;
    
    // Move each selected item up one position
    indices.forEach(index => {
      const temp = newSelectedGroups[index];
      newSelectedGroups[index] = newSelectedGroups[index - 1];
      newSelectedGroups[index - 1] = temp;
    });
    
    // Mark that we are reordering
    isReorderingRef.current = true;
    
    setSelectedGroupCols(newSelectedGroups);
    
    // Notify parent component about the reordering
    if (onGroupChanged) {
      onGroupChanged(newSelectedGroups, 'REORDERED');
    }
    
    // Reset reordering flag after a short delay
    setTimeout(() => {
      isReorderingRef.current = false;
    }, 100);
  };

  // Move down function
  const moveDown = () => {
    if (selectedItems.length === 0) return;
    
    const newSelectedGroups = [...selectedGroupCols];
    const indices = selectedItems
      .map(id => newSelectedGroups.findIndex(col => col.field === id))
      .filter(index => index !== -1)
      .sort((a, b) => b - a); // Sort in descending order for moving down
    
    // Can't move down if the last selected item is already at the bottom
    if (indices[0] === newSelectedGroups.length - 1) return;
    
    // Move each selected item down one position
    indices.forEach(index => {
      const temp = newSelectedGroups[index];
      newSelectedGroups[index] = newSelectedGroups[index + 1];
      newSelectedGroups[index + 1] = temp;
    });
    
    // Mark that we are reordering
    isReorderingRef.current = true;
    
    setSelectedGroupCols(newSelectedGroups);
    
    // Notify parent component about the reordering
    if (onGroupChanged) {
      onGroupChanged(newSelectedGroups, 'REORDERED');
    }
    
    // Reset reordering flag after a short delay
    setTimeout(() => {
      isReorderingRef.current = false;
    }, 100);
  };

  // Move to selected function
  const moveToSelected = (itemIds: string[] = selectedItems, targetIndex?: number) => {
    if (itemIds.length === 0) return;
    
    // Find items in available that are selected
    const itemsToMove = availableGroups.filter(col => 
      itemIds.includes(col.field as string)
    );
    
    if (itemsToMove.length === 0) return;
    
    // Remove items from available
    const newAvailableGroups = availableGroups.filter(col => 
      !itemIds.includes(col.field as string)
    );
    
    // Add items to selected at the specified index or at the end
    let newSelectedGroups = [...selectedGroupCols];
    
    if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= newSelectedGroups.length) {
      // Insert at specific index
      newSelectedGroups = [
        ...newSelectedGroups.slice(0, targetIndex),
        ...itemsToMove,
        ...newSelectedGroups.slice(targetIndex)
      ];
    } else {
      // Append to the end
      newSelectedGroups = [...newSelectedGroups, ...itemsToMove];
    }
    
    // Update state
    setAvailableGroups(newAvailableGroups);
    setSelectedGroupCols(newSelectedGroups);
    clearSelection();
    
    // Expand parent groups in the selected panel
    const newExpandedSelectedGroups = new Set(expandedSelectedGroups);
    itemsToMove.forEach(item => {
      if (item.groupPath) {
        let path = "";
        item.groupPath.forEach(segment => {
          path = path ? `${path}.${segment}` : segment;
          newExpandedSelectedGroups.add(path);
        });
      }
    });
    setExpandedSelectedGroups(newExpandedSelectedGroups);
    
    // Notify parent component about the updated items
    if (onGroupChanged) {
      onGroupChanged(newSelectedGroups, 'ADD');
    }
  };

  // Move to available function
  const moveToAvailable = (itemIds: string[] = selectedItems) => {
    if (itemIds.length === 0) return;
    
    // Find items in selected that are selected
    const itemsToMove = selectedGroupCols.filter(col => 
      itemIds.includes(col.field as string)
    );
    
    if (itemsToMove.length === 0) return;
    
    // Remove items from selected
    const newSelectedGroups = selectedGroupCols.filter(col => 
      !itemIds.includes(col.field as string)
    );
    
    // Add items to available
    const newAvailableGroups = [...availableGroups, ...itemsToMove];
    
    // Update state
    setAvailableGroups(newAvailableGroups);
    setSelectedGroupCols(newSelectedGroups);
    clearSelection();
    
    // Expand parent groups in the available panel
    const newExpandedGroups = new Set(expandedGroups);
    itemsToMove.forEach(item => {
      if (item.groupPath) {
        let path = "";
        item.groupPath.forEach(segment => {
          path = path ? `${path}.${segment}` : segment;
          newExpandedGroups.add(path);
        });
      }
    });
    setExpandedGroups(newExpandedGroups);
    
    // Notify parent component about the updated items
    if (onGroupChanged) {
      onGroupChanged(newSelectedGroups, 'REMOVED');
    }
  };

  // Clear all function
  const clearAll = () => {
    if (selectedGroupCols.length === 0) return;
    
    // Move all selected items to available
    const newAvailableGroups = [...availableGroups, ...selectedGroupCols];
    
    // Update state
    setAvailableGroups(newAvailableGroups);
    setSelectedGroupCols([]);
    clearSelection();
    
    // Notify parent component that all items were removed
    if (onGroupChanged) {
      onGroupChanged([], 'REMOVED');
    }
  };

  // Drag start handler
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: ColDef & { groupPath?: string[] }, isAvailable: boolean) => {
    // Set the item being dragged in state
    setDraggedItemId(item.field as string);
    setDraggedGroupPath(null);
    
    // Check if this item is part of a multi-selection
    const isMultiSelection = selectedItems.includes(item.field as string) && selectedItems.length > 1;
    
    // Prepare data for drag operation
    const dragData = {
      type: 'group',
      itemId: item.field,
      sourcePanel: isAvailable ? 'available' : 'selected',
      isMultiSelection,
      selectedItems: isMultiSelection ? selectedItems : [item.field]
    };
    
    // Set data for transfer
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    
    // Set the drag effect
    e.dataTransfer.effectAllowed = 'move';
    
    // Add a class to the dragged element
    if (e.currentTarget.classList) {
      e.currentTarget.classList.add('dragging');
    }
  };

  // Group drag start handler
  const handleGroupDragStart = (e: React.DragEvent<HTMLDivElement>, groupPath: string) => {
    e.stopPropagation();
    
    // Set the group being dragged in state
    setDraggedGroupPath(groupPath);
    setDraggedItemId(null);
    
    // Prepare data for drag operation
    const dragData = {
      type: 'group_path',
      groupPath: groupPath,
      sourcePanel: e.currentTarget.closest('.available-columns') ? 'available' : 'selected'
    };
    
    // Set data for transfer
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    
    // Set the drag effect
    e.dataTransfer.effectAllowed = 'move';
    
    // Add a class to the dragged element
    if (e.currentTarget.classList) {
      e.currentTarget.classList.add('dragging');
    }
  };

  // Drag over handler
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, panel: string, groupPath?: string) => {
    e.preventDefault();
    
    // Set the drop effect
    e.dataTransfer.dropEffect = 'move';
    
    // Set current drop target panel
    setDropTarget(panel);
    
    // If dragging over a group, highlight it
    if (groupPath) {
      setGroupDropTarget(groupPath);
    } else {
      setGroupDropTarget(null);
    }
    
    if (panel === 'selected') {
      // Calculate drop index based on mouse position
      const selectedPanelElement = selectedPanelRef.current;
      if (!selectedPanelElement) return;
      
      // Get container
      const columnsList = selectedPanelElement.querySelector('.columns-list');
      if (!columnsList) return;
      
      const containerRect = columnsList.getBoundingClientRect();
      
      // Get all column items
      const columnItems = Array.from(
        columnsList.querySelectorAll('.column-item')
      );
      if (columnItems.length === 0) return;
      
      // If we're dragging multiple columns, we need to filter out all selected items
      const selectedIndices = selectedItems.includes(draggedItemId || '')
        ? selectedItems.map(id => {
            return columnItems.findIndex(item => 
              item.getAttribute('data-column-id') === id
            );
          }).filter(index => index !== -1)
        : draggedItemId
          ? [columnItems.findIndex(item => 
              item.getAttribute('data-column-id') === draggedItemId
            )]
          : [];
      
      // Mouse position relative to container
      const mouseY = e.clientY - containerRect.top;
      
      // Find the index where we should insert
      let insertIndex = 0;
      for (let i = 0; i < columnItems.length; i++) {
        // Skip if this is a selected item being dragged
        if (selectedIndices.includes(i)) continue;
        
        const rect = columnItems[i].getBoundingClientRect();
        const itemTop = rect.top - containerRect.top;
        const itemHeight = rect.height;
        const middleY = itemTop + (itemHeight / 2);
        
        if (mouseY < middleY) {
          insertIndex = i;
          break;
        }
        
        insertIndex = i + 1;
      }
      
      // Update the dropIndicatorIndex state only if it has changed
      setDropIndicatorIndex(insertIndex);
    }
  };

  // Drag leave handler
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only clear drop target if leaving the container (not just moving between children)
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    
    setDropTarget(null);
    setDropIndicatorIndex(-1);
    setGroupDropTarget(null);
  };

  // Drop handler
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, panel: string, groupPath?: string) => {
    e.preventDefault();
    
    // Parse the drag data
    let dragData;
    try {
      dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
    } catch (error) {
      console.error('Invalid drag data');
      return;
    }
    
    // Calculate the final drop index at the time of drop for selected panel
    const finalDropIndex = panel === 'selected' ? dropIndicatorIndex : -1;
    
    console.log(`Drop at index ${finalDropIndex} in ${panel} panel`);
    if (groupPath) console.log(`Onto group path: ${groupPath}`);
    
    // Handle different drag data types
    if (dragData.type === 'group') {
      const { itemId, sourcePanel, isMultiSelection, selectedItems: draggedItems } = dragData;
      
      if (sourcePanel === 'available' && panel === 'selected') {
        // Move from available to selected at the calculated drop index
        moveToSelected(draggedItems, finalDropIndex);
      } else if (sourcePanel === 'selected' && panel === 'available') {
        // Move from selected to available
        moveToAvailable(draggedItems);
      } else if (sourcePanel === 'selected' && panel === 'selected') {
        // Reorder within selected panel
        reorderGroup(itemId, finalDropIndex, draggedItems);
      }
    } else if (dragData.type === 'group_path') {
      const { groupPath: draggedPath, sourcePanel } = dragData;
      
      if (sourcePanel === 'available' && panel === 'selected') {
        // Move all groups in the path to selected
        // Find all items that belong to this group
        const itemsInGroup = availableGroups.filter(item => {
          if (!item.groupPath) return false;
          const itemPath = item.groupPath.join('.');
          return itemPath.startsWith(draggedPath);
        });
        
        const itemIds = itemsInGroup.map(item => item.field as string);
        if (itemIds.length > 0) {
          moveToSelected(itemIds, finalDropIndex);
        }
      } else if (sourcePanel === 'selected' && panel === 'available') {
        // Move all groups in the path from selected to available
        const itemsInGroup = selectedGroupCols.filter(item => {
          if (!item.groupPath) return false;
          const itemPath = item.groupPath.join('.');
          return itemPath.startsWith(draggedPath);
        });
        
        const itemIds = itemsInGroup.map(item => item.field as string);
        if (itemIds.length > 0) {
          moveToAvailable(itemIds);
        }
      }
    }
    
    // Reset drop indicators and dragged state
    resetDragState();
    clearSelection();
  };

  return (
    <div className="group-panel">
      <div className="panel-container">
        <AvailablePanel
          availableGroups={availableGroups}
          selectedItems={selectedItems}
          expandedGroups={expandedGroups}
          draggedItemId={draggedItemId}
          draggedGroupPath={draggedGroupPath}
          groupDropTarget={groupDropTarget}
          dropTarget={dropTarget}
          availablePanelRef={availablePanelRef}
          onSelect={handleSelect}
          onMoveToSelected={moveToSelected}
          onDragStart={handleDragStart}
          onGroupDragStart={handleGroupDragStart}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onToggleGroup={toggleGroup}
        />

        <SelectedTreePanel
          selectedGroups={selectedGroupCols}
          selectedItems={selectedItems}
          expandedGroups={expandedSelectedGroups}
          draggedItemId={draggedItemId}
          draggedGroupPath={draggedGroupPath}
          groupDropTarget={groupDropTarget}
          dropTarget={dropTarget}
          dropIndicatorIndex={dropIndicatorIndex}
          selectedPanelRef={selectedPanelRef}
          onSelect={handleSelect}
          onMoveToAvailable={moveToAvailable}
          onMoveUp={moveUp}
          onMoveDown={moveDown}
          onClearAll={clearAll}
          onDragStart={handleDragStart}
          onGroupDragStart={handleGroupDragStart}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onToggleGroup={toggleSelectedGroup}
        />
      </div>
    </div>
  );
};

export default GroupPanel2;