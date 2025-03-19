import { ColumnItem } from '../../types';
import { ColDef } from 'ag-grid-community';

/**
 * Toggle expansion state of an item
 */
export function toggleExpandState(items: ColumnItem[], itemId: string): ColumnItem[] {
  return items.map(item => {
    if (item.id === itemId) {
      return { ...item, expanded: !item.expanded };
    }
    if (item.children) {
      return {
        ...item,
        children: toggleExpandState(item.children, itemId)
      };
    }
    return item;
  });
}

/**
 * Toggle selection state of an item with support for multi-select
 */
export function toggleItemSelection(
  items: ColumnItem[],
  itemId: string,
  isMultiSelect: boolean,
  isRangeSelect: boolean,
  lastSelectedId: string | null,
  flatView: boolean
): [ColumnItem[], string | null] {
  let newLastSelectedId = itemId;
  
  // Handle range selection
  if (isRangeSelect && lastSelectedId) {
    const allItems = getAllVisibleItems(items, flatView);
    const currentIndex = allItems.findIndex(item => item.id === itemId);
    const lastIndex = allItems.findIndex(item => item.id === lastSelectedId);
    
    if (currentIndex >= 0 && lastIndex >= 0) {
      const startIdx = Math.min(currentIndex, lastIndex);
      const endIdx = Math.max(currentIndex, lastIndex);
      const rangeIds = new Set(allItems.slice(startIdx, endIdx + 1).map(item => item.id));
      
      return [
        updateSelectionState(items, (item) => {
          // If in range, always select
          if (rangeIds.has(item.id)) {
            return true;
          }
          // If not multi-select, deselect all items outside range
          if (!isMultiSelect && (item.selected === true) && !rangeIds.has(item.id)) {
            return false;
          }
          // Otherwise keep current selection
          return item.selected === true;
        }),
        newLastSelectedId
      ];
    }
  }
  
  // Regular selection toggle
  return [
    updateSelectionState(items, (item) => {
      if (item.id === itemId) {
        // Toggle this item
        return !(item.selected === true);
      }
      // If not multi-select, deselect all other items
      if (!isMultiSelect && !isRangeSelect && (item.selected === true)) {
        return false;
      }
      // Otherwise keep current selection
      return item.selected === true;
    }),
    newLastSelectedId
  ];
}

/**
 * Update selection state using a predicate function
 */
export function updateSelectionState(
  items: ColumnItem[],
  selectionPredicate: (item: ColumnItem) => boolean
): ColumnItem[] {
  return items.map(item => {
    const newSelectionState = selectionPredicate(item);
    
    if (item.children && item.children.length > 0) {
      return {
        ...item,
        selected: newSelectionState,
        children: updateSelectionState(item.children, selectionPredicate)
      };
    }
    
    return { ...item, selected: newSelectionState };
  });
}

/**
 * Select all items in a tree
 */
export function selectAllItems(items: ColumnItem[]): ColumnItem[] {
  return updateSelectionState(items, () => true);
}

/**
 * Clear all selections in a tree
 */
export function clearAllSelections(items: ColumnItem[]): ColumnItem[] {
  return updateSelectionState(items, () => false);
}

/**
 * Get all visible items as a flat list
 */
export function getAllVisibleItems(
  items: ColumnItem[],
  flatView: boolean
): { id: string, index: number }[] {
  const result: { id: string, index: number }[] = [];
  let index = 0;
  
  if (flatView) {
    // In flat view, only include leaf nodes
    const processItems = (itemList: ColumnItem[]) => {
      for (const item of itemList) {
        if (item.field && (!item.children || item.children.length === 0)) {
          result.push({ id: item.id, index: index++ });
        }
        
        if (item.children && item.children.length > 0) {
          processItems(item.children);
        }
      }
    };
    
    processItems(items);
  } else {
    // In tree view, respect expansion state
    const processItems = (itemList: ColumnItem[]) => {
      for (const item of itemList) {
        result.push({ id: item.id, index: index++ });
        
        if (item.children && item.children.length > 0 && item.expanded) {
          processItems(item.children);
        }
      }
    };
    
    processItems(items);
  }
  
  return result;
}

/**
 * Find an item in the tree by ID
 */
export function findItemInTree(items: ColumnItem[], itemId: string): ColumnItem | null {
  for (const item of items) {
    if (item.id === itemId) {
      return item;
    }
    
    if (item.children) {
      const found = findItemInTree(item.children, itemId);
      if (found) return found;
    }
  }
  
  return null;
}

/**
 * Create a deep clone of an item and its children
 */
export function deepCloneItem(item: ColumnItem): ColumnItem {
  return {
    ...item,
    children: item.children ? item.children.map(deepCloneItem) : undefined,
    selected: false // Reset selection state when cloning
  };
}

/**
 * Remove an item from a tree by ID
 */
export function removeItemFromTree(items: ColumnItem[], itemId: string): ColumnItem[] {
  // First filter out the item at this level
  const result = items.filter(item => item.id !== itemId);
  
  // Then process children recursively
  const processedResult = result.map(item => {
    if (item.children && item.children.length > 0) {
      return {
        ...item,
        children: removeItemFromTree(item.children, itemId)
      };
    }
    return item;
  });
  
  // Filter out empty groups
  return processedResult.filter(item => 
    !item.children || item.children.length > 0 || item.field
  );
}

/**
 * Insert an item into a tree at a specific position
 */
export function insertItemIntoTreeAtPosition(
  items: ColumnItem[],
  item: ColumnItem,
  allPossibleCols: ColumnItem[],
  targetId?: string,
  insertBefore: boolean = true,
  respectGroups: boolean = true
): ColumnItem[] {
  // Clone to avoid mutating the original array
  const result = [...items];
  
  // If we should ignore groups (for example, in selected panel)
  if (!respectGroups) {
    if (targetId) {
      const targetIndex = result.findIndex(i => i.id === targetId);
      if (targetIndex >= 0) {
        // Insert before or after target
        const insertIndex = insertBefore ? targetIndex : targetIndex + 1;
        // Make sure we don't already have this item
        if (!result.some(existingItem => existingItem.id === item.id)) {
          result.splice(insertIndex, 0, item);
        }
        return result;
      }
    }
    
    // Add to the end if target not found
    if (!result.some(existingItem => existingItem.id === item.id)) {
      result.push(item);
    }
    
    return result;
  }

  // Normal group-based insertion (for available panel)
  // Find which group this item belongs to
  for (const group of allPossibleCols) {
    if (group.children && group.children.some(child => child.id === item.id)) {
      // Find or create the group in items
      let targetGroupIndex = result.findIndex(i => i.id === group.id);
      
      if (targetGroupIndex === -1) {
        // Create the group if it doesn't exist
        const newGroup: ColumnItem = {
          id: group.id,
          name: group.name,
          field: group.field,
          expanded: true,
          children: []
        };
        result.push(newGroup);
        targetGroupIndex = result.length - 1;
      }
      
      const targetGroup = result[targetGroupIndex];
      if (!targetGroup.children) {
        targetGroup.children = [];
      }
      
      // If we have a target ID and it's in this group, insert at position
      if (targetId) {
        const targetChildIndex = targetGroup.children.findIndex(child => child.id === targetId);
        if (targetChildIndex >= 0) {
          // Insert before or after target
          const insertIndex = insertBefore ? targetChildIndex : targetChildIndex + 1;
          // Make sure we don't already have this item
          if (!targetGroup.children.some(child => child.id === item.id)) {
            targetGroup.children.splice(insertIndex, 0, item);
          }
          return result;
        }
      }
      
      // Add to the end of the group if target not found
      if (!targetGroup.children.some(child => child.id === item.id)) {
        targetGroup.children.push(item);
      }
      
      return result;
    }
  }
  
  // If not found in a group, handle as top-level item
  if (targetId) {
    const targetIndex = result.findIndex(i => i.id === targetId);
    if (targetIndex >= 0) {
      // Insert before or after target
      const insertIndex = insertBefore ? targetIndex : targetIndex + 1;
      // Make sure we don't already have this item
      if (!result.some(existingItem => existingItem.id === item.id)) {
        result.splice(insertIndex, 0, item);
      }
      return result;
    }
  }
  
  // Add to the end if target not found
  if (!result.some(existingItem => existingItem.id === item.id)) {
    result.push(item);
  }
  
  return result;
}

/**
 * Insert an item into a flat list at a specific position
 */
export function insertItemIntoFlatList(
  tree: ColumnItem[],
  item: ColumnItem,
  allPossibleCols: ColumnItem[],
  targetId?: string,
  insertBefore: boolean = true,
  respectGroups: boolean = true
): ColumnItem[] {
  // Clone to avoid mutating the original array
  const result = [...tree];
  
  // For the selected panel, we want to completely flatten the list
  // and insert exactly where specified
  if (!respectGroups) {
    // First, let's get a flattened version of the tree (in case there are nested items)
    const flatItems: ColumnItem[] = [];
    const flattenTree = (items: ColumnItem[]) => {
      for (const itm of items) {
        // Create a copy without children to add to flat list
        if (itm.field) {
          const flatItem = { ...itm };
          delete flatItem.children;
          flatItems.push(flatItem);
        }
        
        // Process children
        if (itm.children && itm.children.length > 0) {
          flattenTree(itm.children);
        }
      }
    };
    
    // Get all existing items as a flat list
    flattenTree(result);
    
    // Remove original tree and replace with flat items
    result.length = 0;
    result.push(...flatItems);
    
    // Now insert the new item at the specified position
    if (targetId) {
      const targetIndex = result.findIndex(i => i.id === targetId);
      if (targetIndex >= 0) {
        const insertIndex = insertBefore ? targetIndex : targetIndex + 1;
        
        // Ensure we're not duplicating the item
        const existingIndex = result.findIndex(i => i.id === item.id);
        if (existingIndex >= 0) {
          // Remove existing item first
          result.splice(existingIndex, 1);
          
          // Adjust insert index if needed
          const adjustedInsertIndex = existingIndex < insertIndex ? insertIndex - 1 : insertIndex;
          result.splice(adjustedInsertIndex, 0, item);
        } else {
          // Insert the item without children to keep it flat
          const flatItem = { ...item };
          delete flatItem.children;
          result.splice(insertIndex, 0, flatItem);
        }
        
        console.log(`Inserted item ${item.id} at index ${insertIndex}, target: ${targetId}, insertBefore: ${insertBefore}`);
        return result;
      }
    }
    
    // Add to the end if target not found (after ensuring we don't duplicate)
    const existingIndex = result.findIndex(i => i.id === item.id);
    if (existingIndex >= 0) {
      // Remove and re-add at the end
      result.splice(existingIndex, 1);
    }
    
    // Insert flat version at the end
    const flatItem = { ...item };
    delete flatItem.children;
    result.push(flatItem);
    console.log(`Inserted item ${item.id} at the end (no target found)`);
    
    return result;
  }
  
  // If respecting groups, find the appropriate group
  for (const group of allPossibleCols) {
    if (group.children && group.children.some(child => child.id === item.id)) {
      // Find or create the group
      let targetGroupIndex = result.findIndex(i => i.id === group.id);
      
      if (targetGroupIndex === -1) {
        // Create the group
        const newGroup: ColumnItem = {
          id: group.id,
          name: group.name,
          field: group.field,
          expanded: true,
          children: []
        };
        result.push(newGroup);
        targetGroupIndex = result.length - 1;
      }
      
      // Add to the group
      const targetGroup = result[targetGroupIndex];
      if (!targetGroup.children) {
        targetGroup.children = [];
      }
      
      if (targetId) {
        // Try to find target in this group
        const targetChildIndex = targetGroup.children.findIndex(child => child.id === targetId);
        if (targetChildIndex >= 0) {
          const insertIndex = insertBefore ? targetChildIndex : targetChildIndex + 1;
          if (!targetGroup.children.some(child => child.id === item.id)) {
            targetGroup.children.splice(insertIndex, 0, item);
          }
          return result;
        }
      }
      
      // Add to end of group if target not found
      if (!targetGroup.children.some(child => child.id === item.id)) {
        targetGroup.children.push(item);
      }
      
      return result;
    }
  }
  
  // If not belonging to any group, add at root level
  if (targetId) {
    const targetIndex = result.findIndex(i => i.id === targetId);
    if (targetIndex >= 0) {
      const insertIndex = insertBefore ? targetIndex : targetIndex + 1;
      if (!result.some(i => i.id === item.id)) {
        result.splice(insertIndex, 0, item);
      }
      return result;
    }
  }
  
  // Add to the end if target not found
  if (!result.some(i => i.id === item.id)) {
    result.push(item);
  }
  
  return result;
}

/**
 * Count selected items in a tree
 */
export function countSelectedItems(items: ColumnItem[]): number {
  let count = 0;
  
  const countSelected = (itemList: ColumnItem[]) => {
    for (const item of itemList) {
      if (item.selected) {
        count++;
      }
      
      if (item.children && item.children.length > 0) {
        countSelected(item.children);
      }
    }
  };
  
  countSelected(items);
  return count;
}

/**
 * Generate AG Grid column definitions from a tree of column items
 */
export function generateGridColumns(items: ColumnItem[]): ColDef[] {
  const result: ColDef[] = [];
  
  const processItem = (item: ColumnItem) => {
    if (item.field) {
      result.push({
        field: item.field,
        headerName: item.name,
        sortable: true,
        filter: true
      });
    }
    
    if (item.children && item.children.length > 0) {
      item.children.forEach(processItem);
    }
  };
  
  items.forEach(processItem);
  return result;
}