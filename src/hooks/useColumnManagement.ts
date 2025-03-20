import { useState, useCallback, useMemo } from 'react';
import { ColumnItem, ColumnGroup } from '../types';
import dashboardStateService from '../services/dashboardStateService';
import { countLeafNodes, findItemInTree, filterEmptyGroups } from '../utils/columnUtils';

/**
 * Props for the useColumnManagement hook
 */
export interface ColumnManagementProps {
  availableColumns: ColumnItem[];
  selectedColumns: ColumnItem[];
  isFlatView: boolean;
  columnGroups: ColumnGroup[];
  onSelectedColumnsChange: (columnIds: string[]) => void;
  onColumnGroupsChange: (columnGroups: ColumnGroup[]) => void;
}

/**
 * Custom hook to manage column interactions without using reducers
 */
export const useColumnManagement = ({
  availableColumns,
  selectedColumns,
  isFlatView,
  columnGroups,
  onSelectedColumnsChange,
  onColumnGroupsChange
}: ColumnManagementProps) => {
  // Local state for selection tracking
  const [selectedAvailableIds, setSelectedAvailableIds] = useState<string[]>([]);
  const [selectedSelectedIds, setSelectedSelectedIds] = useState<string[]>([]);
  const [lastSelectedAvailableId, setLastSelectedAvailableId] = useState<string | null>(null);
  const [lastSelectedSelectedId, setLastSelectedSelectedId] = useState<string | null>(null);
  const [shiftClickAnchorId, setShiftClickAnchorId] = useState<string | null>(null);
  const [shiftClickSource, setShiftClickSource] = useState<'available' | 'selected' | null>(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOnlyAvailable, setSearchOnlyAvailable] = useState(true);

  // Filter columns based on search term
  const filterColumnsBySearch = useCallback((items: ColumnItem[], term: string): ColumnItem[] => {
    if (!term) return items;
    
    const searchLower = term.toLowerCase();
    
    const filterItem = (item: ColumnItem): boolean => {
      const matchesSearch = item.name.toLowerCase().includes(searchLower);
      if (item.children && item.children.length > 0) {
        const filteredChildren = item.children.filter(filterItem);
        if (filteredChildren.length > 0) {
          item.children = filteredChildren;
          return true;
        }
        return false;
      }
      return matchesSearch;
    };

    return items.filter(filterItem);
  }, []);

  // Filtered available columns (remove empty groups and apply search)
  const filteredAvailableColumns = useMemo(() => {
    let filtered = filterEmptyGroups(availableColumns);
    if (searchTerm) {
      filtered = filterColumnsBySearch(filtered, searchTerm);
    }
    return filtered;
  }, [availableColumns, searchTerm, filterColumnsBySearch]);

  // Filtered selected columns based on search
  const filteredSelectedColumns = useMemo(() => {
    if (!searchTerm || searchOnlyAvailable) return selectedColumns;
    return filterColumnsBySearch(selectedColumns, searchTerm);
  }, [selectedColumns, searchTerm, searchOnlyAvailable, filterColumnsBySearch]);
  
  // Count leaf nodes
  const availableLeafCount = useMemo(() => 
    countLeafNodes(availableColumns),
    [availableColumns]
  );
  
  const selectedLeafCount = useMemo(() => 
    selectedColumns.length, // In the new architecture, selected columns are always flat
    [selectedColumns]
  );

  // Helper function to find which group contains a set of columns
  const findGroupContainingColumns = useCallback((columnIds: string[]): string | null => {
    // If no column IDs provided, return null
    if (!columnIds || columnIds.length === 0) return null;
    
    // Convert to Set for faster lookups
    const idSet = new Set(columnIds);
    
    // Find the first group that contains all the columns
    for (const group of columnGroups) {
      // Check if all columnIds are in this group
      const containsAll = columnIds.every(id => group.columnIds.includes(id));
      if (containsAll) {
        return group.id;
      }
    }
    
    return null;
  }, [columnGroups]);

  // Helper function to find which group contains a specific column
  const findGroupContainingColumn = useCallback((columnId: string): string | null => {
    // If no column ID provided, return null
    if (!columnId) return null;
    
    // Find the group that contains this column
    for (const group of columnGroups) {
      if (group.columnIds.includes(columnId)) {
        return group.id;
      }
    }
    
    return null;
  }, [columnGroups]);

  // Toggle expand available column groups
  const toggleExpandAvailable = useCallback((itemId: string) => {
    // Create updated column structure with toggled expand state
    const updateExpandState = (items: ColumnItem[]): ColumnItem[] => {
      return items.map(item => {
        if (item.id === itemId) {
          return { ...item, expanded: !item.expanded };
        }
        if (item.children && item.children.length > 0) {
          return { ...item, children: updateExpandState(item.children) };
        }
        return item;
      });
    };
    
    // Update available columns in dashboard state
    dashboardStateService.next({ 
      availableColumns: updateExpandState(availableColumns) 
    }, 'Toggle expand available column');
  }, [availableColumns]);
  
  // Toggle selection handling for available columns
  const toggleSelectAvailable = useCallback((itemId: string, isMultiSelect: boolean, isRangeSelect: boolean) => {
    console.log(`Toggle select available: ${itemId}, multiSelect: ${isMultiSelect}, rangeSelect: ${isRangeSelect}`);
    
    if (isRangeSelect && lastSelectedAvailableId) {
      // Get all available column IDs
      const allIds = getAllItemIds(availableColumns);
      const currentIndex = allIds.indexOf(itemId);
      const lastIndex = allIds.indexOf(lastSelectedAvailableId);
      
      if (currentIndex >= 0 && lastIndex >= 0) {
        const startIdx = Math.min(currentIndex, lastIndex);
        const endIdx = Math.max(currentIndex, lastIndex);
        const rangeIds = allIds.slice(startIdx, endIdx + 1);
        
        // Filter out duplicates
        const newSelectedIds = isMultiSelect 
          ? [...new Set([...selectedAvailableIds, ...rangeIds])]
          : rangeIds;
        
        setSelectedAvailableIds(newSelectedIds);
        setLastSelectedAvailableId(itemId);
        console.log(`Range selection from ${lastSelectedAvailableId} to ${itemId}, ${newSelectedIds.length} items selected`);
        return;
      }
    }

    // For regular selection
    if (isMultiSelect) {
      setSelectedAvailableIds(prev => {
        if (prev.includes(itemId)) {
          return prev.filter(id => id !== itemId);
        } else {
          return [...prev, itemId];
        }
      });
    } else {
      setSelectedAvailableIds([itemId]);
    }
    
    setLastSelectedAvailableId(itemId);
  }, [availableColumns, selectedAvailableIds, lastSelectedAvailableId]);
  
  // Toggle selection handling for selected columns
  const toggleSelectSelected = useCallback((itemId: string, isMultiSelect: boolean, isRangeSelect: boolean) => {
    console.log(`Toggle select selected: ${itemId}, multiSelect: ${isMultiSelect}, rangeSelect: ${isRangeSelect}`);
    
    // Check if the item is a group header (prefix with 'group_')
    if (itemId.startsWith('group_')) {
      // Find the group
      const groupId = itemId.substring(6); // Remove 'group_' prefix
      const group = columnGroups.find(g => g.id === groupId);
      
      if (group) {
        // Select all columns in the group
        const groupColumnIds = group.columnIds.filter(id => 
          selectedColumns.some(col => col.id === id)
        );
        
        if (isMultiSelect) {
          // Add all group columns to selection
          setSelectedSelectedIds(prev => {
            const newSelection = [...prev];
            groupColumnIds.forEach(id => {
              if (!newSelection.includes(id)) {
                newSelection.push(id);
              }
            });
            return newSelection;
          });
        } else {
          // Replace selection with group columns
          setSelectedSelectedIds(groupColumnIds);
        }
        
        return;
      }
    }

    if (isRangeSelect && lastSelectedSelectedId) {
      // Find which group the last selected item was in
      const lastSelectedGroup = columnGroups.find(group => 
        group.columnIds.includes(lastSelectedSelectedId)
      );
      
      // Find which group the current item is in
      const currentGroup = columnGroups.find(group => 
        group.columnIds.includes(itemId)
      );
      
      // If both items are in the same group, perform range selection within that group
      if (lastSelectedGroup && currentGroup && lastSelectedGroup.id === currentGroup.id) {
        const groupColumnIds = lastSelectedGroup.columnIds;
        const lastIndex = groupColumnIds.indexOf(lastSelectedSelectedId);
        const currentIndex = groupColumnIds.indexOf(itemId);
        
        if (lastIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastIndex, currentIndex);
          const end = Math.max(lastIndex, currentIndex);
          const rangeIds = groupColumnIds.slice(start, end + 1);
          
          setSelectedSelectedIds(rangeIds);
          setLastSelectedSelectedId(itemId);
          return;
        }
      }
      
      // If items are in different groups or not in any group, perform flat list range selection
      const allIds = selectedColumns.map(item => item.id);
      const currentIndex = allIds.indexOf(itemId);
      const lastIndex = allIds.indexOf(lastSelectedSelectedId);
      
      if (currentIndex >= 0 && lastIndex >= 0) {
        const startIdx = Math.min(currentIndex, lastIndex);
        const endIdx = Math.max(currentIndex, lastIndex);
        const rangeIds = allIds.slice(startIdx, endIdx + 1);
        
        // Filter out duplicates
        const newSelectedIds = isMultiSelect 
          ? [...new Set([...selectedSelectedIds, ...rangeIds])]
          : rangeIds;
        
        setSelectedSelectedIds(newSelectedIds);
        setLastSelectedSelectedId(itemId);
        console.log(`Range selection from ${lastSelectedSelectedId} to ${itemId}, ${newSelectedIds.length} items selected`);
        return;
      }
    }

    // For regular selection
    if (isMultiSelect) {
      setSelectedSelectedIds(prev => {
        if (prev.includes(itemId)) {
          return prev.filter(id => id !== itemId);
        } else {
          return [...prev, itemId];
        }
      });
    } else {
      setSelectedSelectedIds([itemId]);
    }
    
    setLastSelectedSelectedId(itemId);
  }, [selectedColumns, selectedSelectedIds, lastSelectedSelectedId, columnGroups]);
  
  // Select all available columns
  const selectAllAvailable = useCallback(() => {
    const allIds = getAllItemIds(availableColumns);
    setSelectedAvailableIds(allIds);
    console.log(`Selected all available: ${allIds.length} items`);
  }, [availableColumns]);
  
  // Select all selected columns
  const selectAllSelected = useCallback(() => {
    const allIds = selectedColumns.map(item => item.id);
    setSelectedSelectedIds(allIds);
    console.log(`Selected all selected: ${allIds.length} items`);
  }, [selectedColumns]);
  
  // Clear selection for available columns
  const clearSelectionAvailable = useCallback(() => {
    setSelectedAvailableIds([]);
    setLastSelectedAvailableId(null);
    console.log('Cleared available selection');
  }, []);
  
  // Clear selection for selected columns
  const clearSelectionSelected = useCallback(() => {
    setSelectedSelectedIds([]);
    setLastSelectedSelectedId(null);
    console.log('Cleared selected selection');
  }, []);

    // Add columns to an existing group
    const addColumnsToGroup = useCallback((columnIds: string[], groupId: string) => {
      // Find the group
      const groupIndex = columnGroups.findIndex(g => g.id === groupId);
      if (groupIndex === -1) return;
      
      // Get valid column IDs (only those that exist in selected columns)
      const validColumnIds = columnIds.filter(id => 
        selectedColumns.some(col => col.id === id)
      );
      
      if (validColumnIds.length === 0) return;
      
      // Create updated groups - first remove these columns from any existing groups
      const updatedGroups = columnGroups.map(group => ({
        ...group,
        columnIds: group.id === groupId
          ? [...new Set([...group.columnIds, ...validColumnIds])] // Add to target group, ensure uniqueness
          : group.columnIds.filter(id => !validColumnIds.includes(id)) // Remove from other groups
      })).filter(group => group.columnIds.length > 0); // Remove empty groups
      
      // Update column groups
      onColumnGroupsChange(updatedGroups);
    }, [columnGroups, selectedColumns, onColumnGroupsChange]);
  
  // Move items from available to selected
  const moveItemsToSelected = useCallback((ids: string[], dropPosition: { targetId?: string, insertBefore: boolean, targetGroupId?: string | null }) => {
    console.log(`Moving to selected: ${ids.join(', ')}, targetId: ${dropPosition.targetId || 'none'}, insertBefore: ${dropPosition.insertBefore}`);
    
    // Collect items to move
    const itemsToMove: {id: string, name: string, field: string}[] = [];
    const idSet = new Set(ids);
    
    // Helper function to find all items including children of groups
    const findAllItems = (items: ColumnItem[]) => {
      for (const item of items) {
        if (idSet.has(item.id)) {
          // If this is a group, collect all its leaf nodes
          if (item.children && item.children.length > 0) {
            // Get all leaf nodes from this group
            findAllLeafNodes(item.children);
          } else if (item.field) {
            // This is a leaf node
            itemsToMove.push({
              id: item.id,
              name: item.name,
              field: item.field
            });
          }
        } else if (item.children && item.children.length > 0) {
          // Keep searching in children
          findAllItems(item.children);
        }
      }
    };
    
    // Helper to find all leaf nodes in a subtree
    const findAllLeafNodes = (items: ColumnItem[]) => {
      for (const item of items) {
        if (item.children && item.children.length > 0) {
          findAllLeafNodes(item.children);
        } else if (item.field) {
          itemsToMove.push({
            id: item.id,
            name: item.name,
            field: item.field
          });
        }
      }
    };
    
    // Find all items to move
    findAllItems(availableColumns);
    
    console.log(`Found ${itemsToMove.length} items to move`);
    
    // Get current selected columns
    const currentSelectedIds = selectedColumns.map(col => col.id);
    
    // Determine new order of selected column IDs
    let newSelectedIds: string[];
    
    // Handle dropping into a group
    if (dropPosition.targetGroupId) {
      // Add to existing list and then add to group
      newSelectedIds = [
        ...currentSelectedIds.filter(id => !idSet.has(id)),
        ...itemsToMove.map(item => item.id)
      ];
      
      // Notify parent of changes
      onSelectedColumnsChange(newSelectedIds);
      
      // Add to group with a small delay to ensure state is updated
      setTimeout(() => {
        addColumnsToGroup(itemsToMove.map(item => item.id), dropPosition.targetGroupId!);
      }, 100);
      
      return;
    }
    
    if (dropPosition.targetId) {
      // Check if target is a group
      if (dropPosition.targetId.startsWith('group_')) {
        const groupId = dropPosition.targetId.substring(6);
        
        // Add to existing list and then add to group
        newSelectedIds = [
          ...currentSelectedIds.filter(id => !idSet.has(id)),
          ...itemsToMove.map(item => item.id)
        ];
        
        // Notify parent of changes
        onSelectedColumnsChange(newSelectedIds);
        
        // Add to group with a small delay to ensure state is updated
        setTimeout(() => {
          addColumnsToGroup(itemsToMove.map(item => item.id), groupId);
        }, 100);
        
        return;
      }
      
      // Find insertion index
      const targetIndex = currentSelectedIds.indexOf(dropPosition.targetId);
      if (targetIndex !== -1) {
        // Insert at the specified position
        const insertIndex = dropPosition.insertBefore ? targetIndex : targetIndex + 1;
        
        // Get ids to insert
        const idsToInsert = itemsToMove.map(item => item.id);
        
        // Remove any of these ids if they're already in the selected columns
        const filteredCurrentIds = currentSelectedIds.filter(id => !idSet.has(id));
        
        // Insert the ids at the right position
        newSelectedIds = [
          ...filteredCurrentIds.slice(0, insertIndex),
          ...idsToInsert,
          ...filteredCurrentIds.slice(insertIndex)
        ];
      } else {
        // Target not found, append to end
        newSelectedIds = [
          ...currentSelectedIds.filter(id => !idSet.has(id)),
          ...itemsToMove.map(item => item.id)
        ];
      }
    } else {
      // No target specified, append to end
      newSelectedIds = [
        ...currentSelectedIds.filter(id => !idSet.has(id)),
        ...itemsToMove.map(item => item.id)
      ];
    }
    
    // Notify parent of changes
    console.log(`New selected IDs: ${newSelectedIds.join(', ')}`);
    onSelectedColumnsChange(newSelectedIds);
    
    // Clear selections
    clearSelectionAvailable();
    clearSelectionSelected();
  }, [availableColumns, selectedColumns, onSelectedColumnsChange, clearSelectionAvailable, clearSelectionSelected, addColumnsToGroup]);
  
  // Move items from selected to available
  const moveItemsToAvailable = useCallback((ids: string[], dropPosition: { targetId?: string, insertBefore: boolean }) => {
    console.log(`Moving to available: ${ids.join(', ')}`);
    
    // Get current selected columns
    const currentSelectedIds = selectedColumns.map(col => col.id);
    
    // Filter out the ids to be removed
    const idSet = new Set(ids);
    const newSelectedIds = currentSelectedIds.filter(id => !idSet.has(id));
    
    // Also remove these columns from any groups they might be in
    const updatedGroups = columnGroups.map(group => ({
      ...group,
      columnIds: group.columnIds.filter(id => !idSet.has(id))
    }));
    
    // Remove any empty groups
    const filteredGroups = updatedGroups.filter(group => group.columnIds.length > 0);
    
    // Notify parent of changes
    console.log(`New selected IDs after removal: ${newSelectedIds.join(', ')}`);
    onSelectedColumnsChange(newSelectedIds);
    
    // Update groups if they've changed
    if (filteredGroups.length !== columnGroups.length || 
        updatedGroups.some(g => g.columnIds.length !== 
          columnGroups.find(og => og.id === g.id)?.columnIds.length)) {
      onColumnGroupsChange(filteredGroups);
    }
    
    // Clear selections
    clearSelectionAvailable();
    clearSelectionSelected();
  }, [selectedColumns, columnGroups, onSelectedColumnsChange, onColumnGroupsChange, clearSelectionAvailable, clearSelectionSelected]);
  
  // Reorder column groups
  const reorderColumnGroups = useCallback((groupIds: string[], dropPosition: { targetId?: string, insertBefore: boolean }) => {
    // Get current group order
    const currentGroupIds = columnGroups.map(group => group.id);
    
    // Create a set of group IDs to move
    const groupIdSet = new Set(groupIds);
    
    // If we're dragging onto a group
    if (dropPosition.targetId && dropPosition.targetId.startsWith('group_')) {
      const targetGroupId = dropPosition.targetId.substring(6); // Remove 'group_' prefix
      
      // Skip if dragging onto itself
      if (groupIds.length === 1 && groupIds[0] === targetGroupId) {
        return;
      }
      
      // Find the target index
      const targetIndex = currentGroupIds.indexOf(targetGroupId);
      if (targetIndex === -1) return; // Target not found
      
      // Remove the groups to be moved
      const remainingGroupIds = currentGroupIds.filter(id => !groupIdSet.has(id));
      
      // Calculate the insertion index
      let insertIndex;
      if (dropPosition.insertBefore) {
        insertIndex = remainingGroupIds.indexOf(targetGroupId);
      } else {
        insertIndex = remainingGroupIds.indexOf(targetGroupId) + 1;
      }
      
      // Handle boundary cases
      if (insertIndex < 0) insertIndex = 0;
      if (insertIndex > remainingGroupIds.length) insertIndex = remainingGroupIds.length;
      
      // Create the new order of group IDs
      const newGroupIds = [
        ...remainingGroupIds.slice(0, insertIndex),
        ...groupIds,
        ...remainingGroupIds.slice(insertIndex)
      ];
      
      // Create updated groups array based on new order
      const groupMap = new Map(columnGroups.map(group => [group.id, group]));
      const updatedGroups = newGroupIds.map(id => groupMap.get(id)!);
      
      // Update column groups
      onColumnGroupsChange(updatedGroups);
      return;
    }
    
    // If we're dragging between regular columns
    if (dropPosition.targetId) {
      // Get current selected columns
      const currentSelectedIds = selectedColumns.map(col => col.id);
      
      // Find the target index
      const targetIndex = currentSelectedIds.indexOf(dropPosition.targetId);
      if (targetIndex === -1) return; // Target not found
      
      // For each group being moved, get its member columns
      const columnsToInsert: string[] = [];
      groupIds.forEach(groupId => {
        const group = columnGroups.find(g => g.id === groupId);
        if (group) {
          // Add all columns from this group that exist in selected columns
          columnsToInsert.push(...group.columnIds.filter(id => 
            selectedColumns.some(col => col.id === id)
          ));
        }
      });
      
      // Create a set of columns to remove
      const columnsToRemove = new Set(columnsToInsert);
      
      // Remove the columns from their current positions
      const remainingIds = currentSelectedIds.filter(id => !columnsToRemove.has(id));
      
      // Calculate the insertion index
      let insertIndex;
      if (dropPosition.insertBefore) {
        insertIndex = remainingIds.indexOf(dropPosition.targetId);
      } else {
        insertIndex = remainingIds.indexOf(dropPosition.targetId) + 1;
      }
      
      // Handle boundary cases
      if (insertIndex < 0) insertIndex = 0;
      if (insertIndex > remainingIds.length) insertIndex = remainingIds.length;
      
      // Insert the columns at the new position
      const updatedIds = [
        ...remainingIds.slice(0, insertIndex),
        ...columnsToInsert,
        ...remainingIds.slice(insertIndex)
      ];
      
      // Update selected columns order
      onSelectedColumnsChange(updatedIds);
      
      // Update the group structure to maintain the group order
      const updatedGroups = columnGroups.map(group => {
        if (groupIdSet.has(group.id)) {
          // For groups being moved, update their columnIds to match the new order
          return {
            ...group,
            columnIds: group.columnIds.filter(id => updatedIds.includes(id))
          };
        }
        return group;
      }).filter(group => group.columnIds.length > 0);
      
      // Update column groups
      onColumnGroupsChange(updatedGroups);
    }
  }, [columnGroups, selectedColumns, onColumnGroupsChange, onSelectedColumnsChange]);
  
  // Reorder selected columns - ensures that all selected items move together
  const reorderSelectedItems = useCallback((ids: string[], dropPosition: { targetId?: string, insertBefore: boolean, targetGroupId?: string | null }) => {
    if (!dropPosition.targetId) {
      return; // Need a target to reorder
    }
    
    // Skip if dragging onto itself (single item)
    if (ids.length === 1 && ids[0] === dropPosition.targetId) {
      return;
    }
    
    console.log(`Reordering in selected: ${ids.join(', ')}, target: ${dropPosition.targetId}, insertBefore: ${dropPosition.insertBefore}`);
    console.log('Drop position details:', dropPosition);
    
    // Check if we're reordering a group
    const isGroupReorder = ids.some(id => id.startsWith('group_'));
    
    if (isGroupReorder) {
      // Handle group reordering
      reorderColumnGroups(ids, dropPosition);
      return;
    }
    
    // Identify source and target groups
    // If targetGroupId is provided in the drop position, use it
    const targetGroupId = dropPosition.targetGroupId || findGroupContainingColumn(dropPosition.targetId);
    
    // Find the source group for the dragged items
    const sourceGroupId = findGroupContainingColumns(ids);
    
    console.log(`Source group: ${sourceGroupId}, Target group: ${targetGroupId}`);
    
    // If both source and target are in the same group, we need to reorder within the group
    if (sourceGroupId && targetGroupId && sourceGroupId === targetGroupId) {
      console.log(`Reordering within group ${sourceGroupId}`);
      
      // Find the group
      const groupIndex = columnGroups.findIndex(g => g.id === sourceGroupId);
      if (groupIndex === -1) return;
      
      const group = columnGroups[groupIndex];
      
      // Get the current order of column IDs in the group
      const currentGroupColumnIds = [...group.columnIds];
      
      // Create a set of the IDs being moved
      const movingIdSet = new Set(ids);
      
      // Remove the IDs to be moved
      const remainingIds = currentGroupColumnIds.filter(id => !movingIdSet.has(id));
      
      // Find insertion index
      const targetIndex = remainingIds.indexOf(dropPosition.targetId);
      
      // If target not found in the remaining IDs, find its original position
      let insertIndex: number;
      if (targetIndex === -1) {
        // Get original position of target
        const originalIndex = currentGroupColumnIds.indexOf(dropPosition.targetId);
        if (originalIndex === -1) return; // Exit if target not found at all
        
        // Calculate insert position based on whether we're inserting before or after
        insertIndex = dropPosition.insertBefore ? originalIndex : originalIndex + 1;
        
        // Adjust for the removed items if needed
        const adjustedInsertIndex = ids.filter(id => {
          const idIndex = currentGroupColumnIds.indexOf(id);
          return idIndex !== -1 && idIndex < insertIndex;
        }).length;
        
        insertIndex -= adjustedInsertIndex;
      } else {
        // Normal case - target found in remaining IDs
        insertIndex = dropPosition.insertBefore ? targetIndex : targetIndex + 1;
      }
      
      // Handle boundary cases
      if (insertIndex < 0) insertIndex = 0;
      if (insertIndex > remainingIds.length) insertIndex = remainingIds.length;
      
      // Create the new column order
      const newGroupColumnIds = [
        ...remainingIds.slice(0, insertIndex),
        ...ids,
        ...remainingIds.slice(insertIndex)
      ];
      
      console.log('Old group order:', currentGroupColumnIds);
      console.log('New group order:', newGroupColumnIds);
      
      // Update the group with the new column order
      const updatedGroups = [...columnGroups];
      updatedGroups[groupIndex] = {
        ...group,
        columnIds: newGroupColumnIds
      };
      
      // Update the column groups
      onColumnGroupsChange(updatedGroups);
      return;
    }
    
    // Handle normal reordering (outside of groups or between groups)
    
    // Get current selected columns
    const currentSelectedIds = selectedColumns.map(col => col.id);
    console.log('Current order:', currentSelectedIds.join(', '));
    
    // Create a set of ids to move
    const idSet = new Set(ids);
    
    // Find the target index
    const targetIndex = currentSelectedIds.indexOf(dropPosition.targetId);
    if (targetIndex === -1) {
      console.log('Target not found');
      return; // Target not found
    }
    
    // Remove the items to be moved
    const remainingIds = currentSelectedIds.filter(id => !idSet.has(id));
    
    // Calculate the insertion index
    let insertIndex;
    if (dropPosition.insertBefore) {
      insertIndex = remainingIds.indexOf(dropPosition.targetId);
    } else {
      insertIndex = remainingIds.indexOf(dropPosition.targetId) + 1;
    }
    
    // Handle boundary cases
    if (insertIndex < 0) insertIndex = 0;
    if (insertIndex > remainingIds.length) insertIndex = remainingIds.length;
    
    console.log(`Insertion index: ${insertIndex}, remaining: ${remainingIds.join(', ')}`);
    
    // Create the new order of IDs
    const newSelectedIds = [
      ...remainingIds.slice(0, insertIndex),
      ...ids,
      ...remainingIds.slice(insertIndex)
    ];
    
    // Update the selected columns order
    onSelectedColumnsChange(newSelectedIds);
    
    // Handle group membership changes
    if (sourceGroupId) {
      // If moving from a group to outside or to another group
      let updatedGroups = [...columnGroups];
      
      if (targetGroupId && sourceGroupId !== targetGroupId) {
        // Moving from one group to another
        updatedGroups = updatedGroups.map(group => {
          if (group.id === sourceGroupId) {
            // Remove from source group
            return {
              ...group,
              columnIds: group.columnIds.filter(id => !idSet.has(id))
            };
          } else if (group.id === targetGroupId) {
            // Add to target group
            return {
              ...group,
              columnIds: [...group.columnIds, ...ids]
            };
          }
          return group;
        });
      } else {
        // Moving from a group to outside a group
        updatedGroups = updatedGroups.map(group => {
          if (group.id === sourceGroupId) {
            // Remove from source group
            return {
              ...group,
              columnIds: group.columnIds.filter(id => !idSet.has(id))
            };
          }
          return group;
        });
      }
      
      // Filter out any empty groups
      updatedGroups = updatedGroups.filter(group => group.columnIds.length > 0);
      
      // Update column groups
      onColumnGroupsChange(updatedGroups);
    } else if (targetGroupId) {
      // Moving from outside a group into a group
      const updatedGroups = columnGroups.map(group => {
        if (group.id === targetGroupId) {
          // Add to target group
          return {
            ...group,
            columnIds: [...group.columnIds, ...ids]
          };
        }
        return group;
      });
      
      // Update column groups
      onColumnGroupsChange(updatedGroups);
    }
  }, [selectedColumns, onSelectedColumnsChange, reorderColumnGroups, columnGroups, onColumnGroupsChange, findGroupContainingColumns, findGroupContainingColumn]);
  
  // Move selected items up as a group
  const moveSelectedUp = useCallback(() => {
    if (selectedSelectedIds.length === 0) return;
    
    // Get current selected columns
    const currentSelectedIds = selectedColumns.map(col => col.id);
    
    // Find indices of all selected items
    const selectedIndices = selectedSelectedIds.map(id => 
      currentSelectedIds.indexOf(id)
    ).sort((a, b) => a - b);
    
    // Check if we can move up (if first selected is at position 0, can't move up)
    if (selectedIndices[0] === 0) return;
    
    // Clone the current order
    const newSelectedIds = [...currentSelectedIds];
    
    // Find the item directly above the topmost selected item
    const itemAboveIndex = selectedIndices[0] - 1;
    const itemAbove = newSelectedIds[itemAboveIndex];
    
    // Move the item above below all the selected items
    newSelectedIds.splice(itemAboveIndex, 1);
    newSelectedIds.splice(selectedIndices[selectedIndices.length - 1], 0, itemAbove);
    
    // Notify parent of changes
    onSelectedColumnsChange(newSelectedIds);
  }, [selectedColumns, selectedSelectedIds, onSelectedColumnsChange]);
  
  // Move selected items down as a group
  const moveSelectedDown = useCallback(() => {
    if (selectedSelectedIds.length === 0) return;
    
    // Get current selected columns
    const currentSelectedIds = selectedColumns.map(col => col.id);
    
    // Find indices of all selected items
    const selectedIndices = selectedSelectedIds.map(id => 
      currentSelectedIds.indexOf(id)
    ).sort((a, b) => a - b);
    
    // Check if we can move down (if last selected is at the end, can't move down)
    if (selectedIndices[selectedIndices.length - 1] === currentSelectedIds.length - 1) return;
    
    // Clone the current order
    const newSelectedIds = [...currentSelectedIds];
    
    // Find the item directly below the bottommost selected item
    const itemBelowIndex = selectedIndices[selectedIndices.length - 1] + 1;
    const itemBelow = newSelectedIds[itemBelowIndex];
    
    // Move the item below above all the selected items
    newSelectedIds.splice(itemBelowIndex, 1);
    newSelectedIds.splice(selectedIndices[0], 0, itemBelow);
    
    // Notify parent of changes
    onSelectedColumnsChange(newSelectedIds);
  }, [selectedColumns, selectedSelectedIds, onSelectedColumnsChange]);
  
  // Clear all selected columns
  const clearSelected = useCallback(() => {
    // Empty the selected columns
    onSelectedColumnsChange([]);
    
    // Also clear all groups
    if (columnGroups.length > 0) {
      onColumnGroupsChange([]);
    }
  }, [onSelectedColumnsChange, onColumnGroupsChange, columnGroups]);
  
  // Move a single item to selected on double-click
  const moveItemToSelected = useCallback((id: string) => {
    // Find the item
    const item = findItemInTree(availableColumns, id);
    if (!item) return;
    
    // If it's a group, collect all leaf nodes
    if (item.children && item.children.length > 0) {
      // Collect all leaf node IDs
      const leafNodeIds: string[] = [];
      
      const collectLeafIds = (items: ColumnItem[]) => {
        for (const child of items) {
          if (child.children && child.children.length > 0) {
            collectLeafIds(child.children);
          } else if (child.field) {
            leafNodeIds.push(child.id);
          }
        }
      };
      
      collectLeafIds(item.children);
      
      // Move all leaf nodes
      if (leafNodeIds.length > 0) {
        const dropPosition = { insertBefore: false }; // Add to end
        moveItemsToSelected(leafNodeIds, dropPosition);
      }
    } else if (item.field) {
      // It's a leaf node, move it directly
      // Get current selected columns
      const currentSelectedIds = selectedColumns.map(col => col.id);
      
      // Append the new id if not already selected
      if (!currentSelectedIds.includes(id)) {
        onSelectedColumnsChange([...currentSelectedIds, id]);
      }
    }
  }, [availableColumns, selectedColumns, onSelectedColumnsChange, moveItemsToSelected]);
  
  // Move a single item to available on double-click
  const moveItemToAvailable = useCallback((id: string) => {
    // Get current selected columns
    const currentSelectedIds = selectedColumns.map(col => col.id);
    
    // Remove the id if present
    if (currentSelectedIds.includes(id)) {
      onSelectedColumnsChange(currentSelectedIds.filter(colId => colId !== id));
      
      // Also remove from any groups
      const updatedGroups = columnGroups.map(group => ({
        ...group,
        columnIds: group.columnIds.filter(colId => colId !== id)
      })).filter(group => group.columnIds.length > 0);
      
      if (updatedGroups.length !== columnGroups.length) {
        onColumnGroupsChange(updatedGroups);
      }
    }
  }, [selectedColumns, columnGroups, onSelectedColumnsChange, onColumnGroupsChange]);
  
  // Toggle flat view
  const setFlatView = useCallback((value: boolean) => {
    dashboardStateService.toggleFlatView(value);
  }, []);
  
  // Column Groups Functions
  
  // Create a new column group
  const createColumnGroup = useCallback((name: string, columnIds: string[]) => {
    // Generate a unique ID
    const newGroupId = `group_${Date.now()}`;
    
    // Create new group
    const newGroup: ColumnGroup = {
      id: newGroupId,
      name,
      columnIds: columnIds.filter(id => selectedColumns.some(col => col.id === id))
    };
    
    // Add to existing groups
    const updatedGroups = [...columnGroups, newGroup];
    
    // Update column groups
    onColumnGroupsChange(updatedGroups);
  }, [columnGroups, selectedColumns, onColumnGroupsChange]);
  
  // Remove columns from a group
  const removeColumnsFromGroup = useCallback((columnIds: string[], groupId: string) => {
    // Find the group
    const groupIndex = columnGroups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return;
    
    // Create updated group
    const updatedGroup = {
      ...columnGroups[groupIndex],
      columnIds: columnGroups[groupIndex].columnIds.filter(id => !columnIds.includes(id))
    };
    
    // Update the groups array
    let updatedGroups: ColumnGroup[];
    
    if (updatedGroup.columnIds.length === 0) {
      // Remove the group if it's now empty
      updatedGroups = columnGroups.filter(g => g.id !== groupId);
    } else {
      // Replace the group with the updated version
      updatedGroups = columnGroups.map(g => g.id === groupId ? updatedGroup : g);
    }
    
    // Update column groups
    onColumnGroupsChange(updatedGroups);
    
    // Ensure the columns remain in the selected columns list
    const currentSelectedIds = selectedColumns.map(col => col.id);
    const columnsToKeep = currentSelectedIds.filter(id => !columnIds.includes(id));
    const columnsToAdd = columnIds.filter(id => !currentSelectedIds.includes(id));
    
    if (columnsToAdd.length > 0) {
      // Add any columns that aren't already in the selected list
      onSelectedColumnsChange([...columnsToKeep, ...columnsToAdd]);
    }
  }, [columnGroups, selectedColumns, onColumnGroupsChange, onSelectedColumnsChange]);
  
  // Rename a column group
  const renameColumnGroup = useCallback((groupId: string, newName: string) => {
    // Update the group with the new name
    const updatedGroups = columnGroups.map(group => 
      group.id === groupId ? { ...group, name: newName } : group
    );
    
    // Update column groups
    onColumnGroupsChange(updatedGroups);
  }, [columnGroups, onColumnGroupsChange]);
  
  // Delete a column group
  const deleteColumnGroup = useCallback((groupId: string) => {
    // Simply filter out the group
    const updatedGroups = columnGroups.filter(group => group.id !== groupId);
    
    // Update column groups
    onColumnGroupsChange(updatedGroups);
  }, [columnGroups, onColumnGroupsChange]);
  
  // Move columns between groups
  const moveColumnsBetweenGroups = useCallback((columnIds: string[], sourceGroupId: string, targetGroupId: string) => {
    // If source and target are the same, do nothing
    if (sourceGroupId === targetGroupId) return;
    
    // Find both groups
    const sourceGroup = columnGroups.find(g => g.id === sourceGroupId);
    const targetGroup = columnGroups.find(g => g.id === targetGroupId);
    
    if (!sourceGroup || !targetGroup) return;
    
    // Get valid column IDs (only those that exist in the source group)
    const validColumnIds = columnIds.filter(id => 
      sourceGroup.columnIds.includes(id) && 
      selectedColumns.some(col => col.id === id)
    );
    
    if (validColumnIds.length === 0) return;
    
    // Create updated groups
    const updatedGroups = columnGroups.map(group => {
      if (group.id === sourceGroupId) {
        // Remove columns from source group
        return {
          ...group,
          columnIds: group.columnIds.filter(id => !validColumnIds.includes(id))
        };
      } else if (group.id === targetGroupId) {
        // Add columns to target group
        return {
          ...group,
          columnIds: [...new Set([...group.columnIds, ...validColumnIds])]
        };
      }
      return group;
    }).filter(group => group.columnIds.length > 0); // Remove empty groups
    
    // Update column groups
    onColumnGroupsChange(updatedGroups);
  }, [columnGroups, selectedColumns, onColumnGroupsChange]);
  
  // Update column groups directly
  const updateColumnGroups = useCallback((newGroups: ColumnGroup[]) => {
    onColumnGroupsChange(newGroups);
  }, [onColumnGroupsChange]);
  
  // Helper function to get all item IDs from a tree
  const getAllItemIds = (items: ColumnItem[]): string[] => {
    const result: string[] = [];
    
    const collectIds = (itemList: ColumnItem[]) => {
      for (const item of itemList) {
        if (item.field) { // Only collect leaf nodes with fields
          result.push(item.id);
        }
        
        if (item.children && item.children.length > 0) {
          collectIds(item.children);
        }
      }
    };
    
    collectIds(items);
    return result;
  };
  
  return {
    // Derived values
    filteredAvailableColumns,
    availableLeafCount,
    selectedLeafCount,
    selectedAvailableIds,
    selectedSelectedIds,
    
    // Actions
    toggleExpandAvailable,
    toggleSelectAvailable,
    toggleSelectSelected,
    selectAllAvailable,
    selectAllSelected,
    clearSelectionAvailable,
    clearSelectionSelected,
    moveItemsToSelected,
    moveItemsToAvailable,
    reorderSelectedItems,
    moveSelectedUp,
    moveSelectedDown,
    clearSelected,
    moveItemToSelected,
    moveItemToAvailable,
    setFlatView,
    
    // Group operations
    createColumnGroup,
    addColumnsToGroup,
    removeColumnsFromGroup,
    renameColumnGroup,
    deleteColumnGroup,
    reorderColumnGroups,
    moveColumnsBetweenGroups,
    updateColumnGroups,
    
    // Helper functions
    getSelectedAvailableCount: () => selectedAvailableIds.length,
    getSelectedSelectedCount: () => selectedSelectedIds.length,
    searchTerm,
  setSearchTerm,
    searchOnlyAvailable,
    setSearchOnlyAvailable,
    filteredSelectedColumns,
  };
};

export default useColumnManagement;