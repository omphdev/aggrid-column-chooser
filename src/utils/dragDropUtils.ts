// src/utils/dragDropUtils.ts
import { ColumnItem } from "../types";
import { 
  findItemInTree, 
  countSelectedItems, 
  getSelectedItems,
  deepCloneColumnItem,
  removeItemFromTree
} from "./treeUtils";
import { flattenTreeWithParentInfo, FlatItem } from "./columnUtils";

// Global variable to track drag source
let currentDragSource: string | null = null;

// Global variable to track dragged item info for silhouette
let draggedItemInfo: { name: string, ids: string[] } | null = null;

/**
 * Get the current drag source
 * @returns Current drag source identifier
 */
export const getCurrentDragSource = (): string | null => {
  return currentDragSource;
};

/**
 * Set the current drag source
 * @param source Source identifier
 */
export const setCurrentDragSource = (source: string | null): void => {
  currentDragSource = source;
};

/**
 * Get information about the currently dragged item(s)
 * @returns Dragged item info
 */
export const getDraggedItemInfo = (): { name: string, ids: string[] } | null => {
  return draggedItemInfo;
};

/**
 * Set information about the currently dragged item(s)
 * @param info Dragged item info
 */
export const setDraggedItemInfo = (info: { name: string, ids: string[] } | null): void => {
  draggedItemInfo = info;
};

/**
 * Reset all drag state
 */
export const resetDragState = (): void => {
  setCurrentDragSource(null);
  setDraggedItemInfo(null);
};

/**
 * Find the nearest drop target from a drag event
 * @param e Drag event
 * @param rootElement Root container element
 * @returns Target ID and insertion position
 */
export const findDropTarget = (
  e: React.DragEvent, 
  rootElement: HTMLElement
): { targetId: string | undefined, insertBefore: boolean, targetElement: HTMLElement | null } => {
  const target = document.elementFromPoint(e.clientX, e.clientY);
  if (!target) return { targetId: undefined, insertBefore: true, targetElement: null };
  
  // Find the closest tree-item ancestor
  let treeItem = target.closest('.tree-item') as HTMLElement;
  if (!treeItem) return { targetId: undefined, insertBefore: true, targetElement: null };
  
  // Get the item ID from data attribute
  const targetId = treeItem.dataset.itemId;
  
  // Calculate if we should insert before or after based on mouse position
  const rect = treeItem.getBoundingClientRect();
  const mouseY = e.clientY;
  const threshold = rect.top + (rect.height / 2);
  const insertBefore = mouseY < threshold;
  
  return { targetId, insertBefore, targetElement: treeItem };
};

/**
 * Handle drag start for the available columns panel
 * @param e Drag event
 * @param item Item being dragged
 * @param items All items in the panel
 */
export const handleDragStartForAvailable = (
  e: React.DragEvent, 
  item: ColumnItem,
  items: ColumnItem[]
) => {
  // Set the global source
  setCurrentDragSource('available');
  
  // Always set up data transfer with this item ID
  // For single item dragging without requiring selection first
  const itemIds = [item.id];
  
  // If the item is already selected, include other selected items too
  if (item.selected && countSelectedItems(items) > 1) {
    // Use all selected items
    const selectedIds = getSelectedItems(items);
    e.dataTransfer.setData('text/plain', JSON.stringify({
      ids: selectedIds,
      source: 'available',
      itemName: selectedIds.length > 1 ? `${selectedIds.length} columns` : item.name
    }));
    
    // Store info about dragged items
    setDraggedItemInfo({
      name: selectedIds.length > 1 ? `${selectedIds.length} columns` : item.name,
      ids: selectedIds
    });
  } else {
    // Just drag this one item, ignoring any other selections
    e.dataTransfer.setData('text/plain', JSON.stringify({
      ids: itemIds,
      source: 'available',
      itemName: item.name
    }));
    
    // Store info about dragged item
    setDraggedItemInfo({
      name: item.name,
      ids: itemIds
    });
  }
  
  // Mark the element as being dragged
  const element = e.currentTarget as HTMLElement;
  element.setAttribute('data-dragging', 'true');
};

/**
 * Handle drag start for the selected columns panel
 * @param e Drag event
 * @param item Item being dragged
 * @param items All items in the panel
 */
export const handleDragStartForSelected = (
  e: React.DragEvent, 
  item: ColumnItem,
  items: ColumnItem[]
) => {
  // Set the global source
  setCurrentDragSource('selected');
  
  // Always set up data transfer with this item ID
  // For single item dragging without requiring selection first
  const itemIds = [item.id];
  
  // If the item is already selected, include other selected items too
  if (item.selected && countSelectedItems(items) > 1) {
    // Use all selected items
    const selectedIds = getSelectedItems(items);
    e.dataTransfer.setData('text/plain', JSON.stringify({
      ids: selectedIds,
      source: 'selected',
      itemName: selectedIds.length > 1 ? `${selectedIds.length} columns` : item.name
    }));
    
    // Store info about dragged items
    setDraggedItemInfo({
      name: selectedIds.length > 1 ? `${selectedIds.length} columns` : item.name,
      ids: selectedIds
    });
  } else {
    // Just drag this one item, ignoring any other selections
    e.dataTransfer.setData('text/plain', JSON.stringify({
      ids: itemIds,
      source: 'selected',
      itemName: item.name
    }));
    
    // Store info about dragged item
    setDraggedItemInfo({
      name: item.name,
      ids: itemIds
    });
  }
  
  // Mark the element as being dragged
  const element = e.currentTarget as HTMLElement;
  element.setAttribute('data-dragging', 'true');
};

/**
 * Handle drag end to clean up UI state
 * @param e Drag event
 */
export const handleDragEnd = (e: React.DragEvent): void => {
  // Reset all drag state
  resetDragState();
  
  // Remove dragging attribute from all elements
  const draggingElements = document.querySelectorAll('[data-dragging="true"]');
  draggingElements.forEach(el => {
    el.removeAttribute('data-dragging');
  });
};

/**
 * Process drop operations with position targeting and flat view support
 * @param e Drag event
 * @param sourcePanel Source panel identifier
 * @param availableColumns Available columns
 * @param selectedColumns Selected columns
 * @param allPossibleColumns Reference to all possible columns
 * @param clearSelectionFunctions Function to clear all selections
 * @param isFlatView Whether we're in flat view mode
 * @returns Updated available and selected column arrays
 */
export const processDragDrop = (
  e: React.DragEvent,
  sourcePanel: string,
  availableColumns: ColumnItem[],
  selectedColumns: ColumnItem[],
  allPossibleColumns: ColumnItem[],
  clearSelectionFunctions: () => void,
  isFlatView: boolean = false
): { 
  newAvailable: ColumnItem[], 
  newSelected: ColumnItem[] 
} => {
  e.preventDefault();
  
  try {
    const data = JSON.parse(e.dataTransfer.getData('text/plain')) as { 
      ids: string[], 
      source: string 
    };
    
    if (data.source === sourcePanel && data.ids && data.ids.length > 0) {
      // Create new arrays to avoid mutation
      let newAvailable = [...availableColumns];
      let newSelected = [...selectedColumns];
      
      // Find the drop target (where to insert)
      const dropContainer = e.currentTarget as HTMLElement;
      const { targetId, insertBefore } = findDropTarget(e, dropContainer);
      
      // Process each selected item
      for (const draggedItemId of data.ids) {
        const sourceItems = data.source === 'available' ? availableColumns : selectedColumns;
        const draggedItem = findItemInTree(sourceItems, draggedItemId);
        
        if (draggedItem) {
          // Clone the dragged item
          const clonedItem = deepCloneColumnItem(draggedItem);
          
          if (data.source === 'available') {
            // Remove from available
            newAvailable = removeItemFromTree(newAvailable, draggedItemId);
            
            // Add to selected at specific position
            if (isFlatView) {
              newSelected = insertItemIntoFlatList(
                newSelected, 
                clonedItem, 
                allPossibleColumns,
                targetId,
                insertBefore
              );
            } else {
              newSelected = insertItemIntoTreeAtIndex(
                newSelected, 
                clonedItem, 
                allPossibleColumns,
                targetId,
                insertBefore
              );
            }
          } else {
            // Remove from selected
            newSelected = removeItemFromTree(newSelected, draggedItemId);
            
            // Add to available (using helper to preserve hierarchy)
            if (sourcePanel === 'available' && isFlatView) {
              newAvailable = insertItemIntoFlatList(
                newAvailable, 
                clonedItem, 
                allPossibleColumns,
                targetId,
                insertBefore
              );
            } else {
              newAvailable = insertItemIntoTreeAtIndex(
                newAvailable, 
                clonedItem, 
                allPossibleColumns,
                targetId,
                insertBefore
              );
            }
          }
        }
      }
      
      // Clear selections after drag
      clearSelectionFunctions();
      
      // Reset the current drag source after successful drop
      setCurrentDragSource(null);
      
      return { newAvailable, newSelected };
    }
  } catch (err) {
    console.error('Error processing drag data:', err);
  }
  
  // Reset drag source on any error too
  setCurrentDragSource(null);
  
  return { newAvailable: availableColumns, newSelected: selectedColumns };
};

/**
 * Check if a field belongs to a group in the original column structure
 * @param allPossibleColumns The original column structure
 * @param fieldId The field ID to check
 * @returns {boolean} True if the field belongs to a group
 */
export const isPartOfGroup = (allPossibleColumns: ColumnItem[], fieldId: string): boolean => {
  for (const column of allPossibleColumns) {
    if (!column.field && column.children && column.children.length > 0) {
      // This is a group
      for (const child of column.children) {
        if (child.id === fieldId) {
          return true;
        }
        
        if (child.children && child.children.length > 0) {
          const foundInSubgroup = isPartOfGroup([child], fieldId);
          if (foundInSubgroup) return true;
        }
      }
    }
  }
  
  return false;
};

/**
 * Get the parent group of a field
 * @param allPossibleColumns The original column structure
 * @param fieldId The field ID to check
 * @returns The parent group or null if not found
 */
export const getParentGroup = (allPossibleColumns: ColumnItem[], fieldId: string): ColumnItem | null => {
  for (const column of allPossibleColumns) {
    if (!column.field && column.children && column.children.length > 0) {
      // This is a group
      for (const child of column.children) {
        if (child.id === fieldId) {
          return column;
        }
        
        if (child.children && child.children.length > 0) {
          const foundInSubgroup = getParentGroup([child], fieldId);
          if (foundInSubgroup) return foundInSubgroup;
        }
      }
    }
  }
  
  return null;
};

/**
 * Insert an item into a tree structure at a specific position
 * This version adds support for handling ungrouped columns differently
 * @param items Tree structure
 * @param item Item to insert
 * @param allPossibleColumns Reference to all possible columns for group structure
 * @param targetId Target item ID to insert near
 * @param insertBefore Whether to insert before or after the target
 * @returns Updated tree with the item inserted
 */
export const insertItemIntoTreeAtIndex = (
  items: ColumnItem[], 
  item: ColumnItem,
  allPossibleColumns: ColumnItem[],
  targetId?: string,
  insertBefore = true
): ColumnItem[] => {
  // Check if this item is part of a group in the original structure
  const isGroupedColumn = isPartOfGroup(allPossibleColumns, item.id);
  
  if (isGroupedColumn) {
    // Handle grouped columns - try to maintain their group structure
    for (const group of allPossibleColumns) {
      if (!group.field && group.children && group.children.length > 0) {
        // This is a group
        let belongsToThisGroup = false;
        
        // Check if the item belongs to this group or its subgroups
        for (const child of group.children) {
          if (child.id === item.id) {
            belongsToThisGroup = true;
            break;
          }
          
          if (child.children && child.children.length > 0) {
            const foundInSubgroup = isPartOfGroup([child], item.id);
            if (foundInSubgroup) {
              belongsToThisGroup = true;
              break;
            }
          }
        }
        
        if (belongsToThisGroup) {
          // Find or create the group in items
          let targetGroup = items.find(i => i.id === group.id);
          
          if (!targetGroup) {
            targetGroup = {
              id: group.id,
              name: group.name,
              field: group.field,
              expanded: true,
              children: []
            };
            items.push(targetGroup);
          }
          
          if (!targetGroup.children) {
            targetGroup.children = [];
          }
          
          // If we have a target ID and it belongs to this group, insert at specific position
          if (targetId) {
            const targetIndex = targetGroup.children.findIndex(child => child.id === targetId);
            if (targetIndex >= 0) {
              // Insert before or after target
              const insertIndex = insertBefore ? targetIndex : targetIndex + 1;
              // Make sure we don't already have this item
              if (!targetGroup.children.some(child => child.id === item.id)) {
                targetGroup.children.splice(insertIndex, 0, item);
              }
              return items;
            }
          }
          
          // Add the item to the group if it's not already there (at the end)
          if (!targetGroup.children.some(child => child.id === item.id)) {
            targetGroup.children.push(item);
          }
          
          return items;
        }
      }
    }
  }
  
  // For ungrouped columns or if group not found, add at root level
  if (targetId) {
    const targetIndex = items.findIndex(i => i.id === targetId);
    if (targetIndex >= 0) {
      // Insert before or after target
      const insertIndex = insertBefore ? targetIndex : targetIndex + 1;
      // Make sure we don't already have this item
      if (!items.some(existingItem => existingItem.id === item.id)) {
        items.splice(insertIndex, 0, item);
      }
      return items;
    }
  }
  
  // Add at the end if no target specified or target not found
  if (!items.some(existingItem => existingItem.id === item.id)) {
    items.push(item);
  }
  
  return items;
};

/**
 * Insert an item into a flat list at a specific position
 * @param tree Tree structure
 * @param item Item to insert
 * @param allPossibleColumns Reference to all possible columns for group structure
 * @param targetId Target item ID to insert near
 * @param insertBefore Whether to insert before or after the target
 * @returns Updated tree with the item inserted in flat structure
 */
export const insertItemIntoFlatList = (
  tree: ColumnItem[],
  item: ColumnItem,
  allPossibleColumns: ColumnItem[],
  targetId?: string,
  insertBefore = true
): ColumnItem[] => {
  // Check if this item is part of a group in the original structure
  const isGroupedColumn = isPartOfGroup(allPossibleColumns, item.id);
  
  if (isGroupedColumn) {
    // For grouped columns, preserve the group structure
    return insertItemIntoTreeAtIndex(tree, item, allPossibleColumns, targetId, insertBefore);
  }
  
  // For ungrouped columns, add at root level
  if (!targetId) {
    // If no target, just add to the end
    if (!tree.some(existingItem => existingItem.id === item.id)) {
      tree.push(item);
    }
    return tree;
  }
  
  // Find the target item's index
  const targetIndex = tree.findIndex(i => i.id === targetId);
  
  if (targetIndex >= 0) {
    // Target is at root level
    const insertIndex = insertBefore ? targetIndex : targetIndex + 1;
    // Make sure we don't already have this item
    if (!tree.some(existingItem => existingItem.id === item.id)) {
      tree.splice(insertIndex, 0, item);
    }
    return tree;
  }
  
  // Target might be in a group, we need to find it
  for (const rootItem of tree) {
    if (rootItem.children) {
      const targetIndexInGroup = rootItem.children.findIndex(c => c.id === targetId);
      if (targetIndexInGroup >= 0) {
        // If the target is in a group but our item is not grouped,
        // we should add it at root level based on the group's position
        const rootIndex = tree.indexOf(rootItem);
        const insertIndex = insertBefore ? rootIndex : rootIndex + 1;
        
        // Make sure we don't already have this item
        if (!tree.some(existingItem => existingItem.id === item.id)) {
          tree.splice(insertIndex, 0, item);
        }
        return tree;
      }
    }
  }
  
  // If target not found, add to the end
  if (!tree.some(existingItem => existingItem.id === item.id)) {
    tree.push(item);
  }
  
  return tree;
};