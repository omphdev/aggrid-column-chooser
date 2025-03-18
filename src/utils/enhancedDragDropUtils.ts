// utils/enhancedDragDropUtils.ts
import { ColumnItem } from "../types";
import { 
  findItemInTree, 
  removeItemFromTree, 
  deepCloneColumnItem, 
  countSelectedItems, 
  getSelectedItems
} from "./treeUtils";
import { flattenTree } from "./columnConverter";

// Global variable to track drag source and dragged item info
let currentDragSource: string | null = null;
let draggedItemInfo: { name: string, ids: string[] } | null = null;

// Helper function to get the current drag source
export const getCurrentDragSource = (): string | null => {
  return currentDragSource;
};

// Helper function to set the current drag source
export const setCurrentDragSource = (source: string | null): void => {
  currentDragSource = source;
};

// Helper to get info about the currently dragged item(s)
export const getDraggedItemInfo = (): { name: string, ids: string[] } | null => {
  return draggedItemInfo;
};

// Helper to set info about the currently dragged item(s)
export const setDraggedItemInfo = (info: { name: string, ids: string[] } | null): void => {
  draggedItemInfo = info;
};

/**
 * Enhanced handler for drag start in the available columns panel
 * Also stores info about the dragged items for visualization
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
 * Enhanced handler for drag start in the selected columns panel
 * Also stores info about the dragged items for visualization
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
 * Reset all drag state when a drag operation ends
 */
export const resetDragState = (): void => {
  setCurrentDragSource(null);
  setDraggedItemInfo(null);
};

/**
 * Process drop operations with position targeting and flat view support
 * This is an enhanced version of the original processDragDrop function
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
      
      // Find the drop target position from the event
      const positionedEvent = e as any;
      const targetId = positionedEvent.dropPosition?.targetId;
      const insertBefore = positionedEvent.dropPosition?.insertBefore ?? true;
      
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
            
            // Add to available
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
      resetDragState();
      
      return { newAvailable, newSelected };
    }
  } catch (err) {
    console.error('Error processing drag data:', err);
  }
  
  // Reset drag source on any error too
  resetDragState();
  
  return { newAvailable: availableColumns, newSelected: selectedColumns };
};

/**
 * Enhanced helper to handle drag end events
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
 * Find the nearest tree item from a drop event
 */
export const findDropTarget = (
  e: React.DragEvent, 
  rootElement: HTMLElement
): { targetId: string | undefined, insertBefore: boolean } => {
  const target = document.elementFromPoint(e.clientX, e.clientY);
  if (!target) return { targetId: undefined, insertBefore: true };
  
  // Find the closest tree-item ancestor
  let treeItem = target.closest('.tree-item') as HTMLElement;
  if (!treeItem) return { targetId: undefined, insertBefore: true };
  
  // Get the item ID from data attribute
  const targetId = treeItem.dataset.itemId;
  
  // Calculate if we should insert before or after based on mouse position
  const rect = treeItem.getBoundingClientRect();
  const mouseY = e.clientY;
  const threshold = rect.top + (rect.height / 2);
  const insertBefore = mouseY < threshold;
  
  return { targetId, insertBefore };
};

/**
 * Helper to insert an item into a tree at a specific position with support for reordering
 * Handles both flat view and hierarchical view
 */
export const insertColumnItem = (
  tree: ColumnItem[],
  item: ColumnItem,
  allPossibleColumns: ColumnItem[],
  targetId?: string,
  insertBefore = true,
  useFlat = false
): ColumnItem[] => {
  // Determine the insertion method based on the view mode
  if (useFlat) {
    return insertItemIntoFlatList(tree, item, allPossibleColumns, targetId, insertBefore);
  } else {
    return insertItemIntoTreeAtIndex(tree, item, allPossibleColumns, targetId, insertBefore);
  }
};

// Helper function to insert item into tree at specific index
export const insertItemIntoTreeAtIndex = (
  items: ColumnItem[], 
  item: ColumnItem,
  allPossibleColumns: ColumnItem[],
  targetId?: string,
  insertBefore = true
): ColumnItem[] => {
  // Check if this is a child of any existing group
  for (const group of allPossibleColumns) {
    if (group.children && group.children.some(child => child.id === item.id)) {
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
  
  // Handle top-level item insertion
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
  
  // This is a top-level item, add directly if not already there (at the end)
  if (!items.some(existingItem => existingItem.id === item.id)) {
    items.push(item);
  }
  
  return items;
};

// Helper function to flatten tree but preserve parent information
interface FlatItem extends ColumnItem {
  parentId?: string;
}

export const flattenTreeWithParentInfo = (items: ColumnItem[]): FlatItem[] => {
  const result: FlatItem[] = [];
  
  const processItem = (item: ColumnItem, parentId?: string) => {
    // Add this item with parent info
    const flatItem: FlatItem = { ...item, parentId };
    result.push(flatItem);
    
    // Process children if any
    if (item.children && item.children.length > 0 && item.expanded !== false) {
      item.children.forEach(child => processItem(child, item.id));
    }
  };
  
  items.forEach(item => processItem(item));
  return result;
};

// Helper function to insert an item into a flat view at a specific position
export const insertItemIntoFlatList = (
  tree: ColumnItem[],
  item: ColumnItem,
  allPossibleColumns: ColumnItem[],
  targetId?: string,
  insertBefore = true
): ColumnItem[] => {
  // If there's no target, just add to the appropriate group and return
  if (!targetId) {
    return insertItemIntoTreeAtIndex(tree, item, allPossibleColumns);
  }
  
  // First, find the target item's group path in the original tree structure
  let targetGroupPath: ColumnItem | null = null;
  let targetInGroup = false;
  
  // Recursive function to find the containing group
  const findContainingGroup = (items: ColumnItem[]): boolean => {
    for (const currentItem of items) {
      if (currentItem.id === targetId) {
        return true;
      }
      
      if (currentItem.children) {
        targetInGroup = findContainingGroup(currentItem.children);
        if (targetInGroup) {
          targetGroupPath = currentItem;
          return true;
        }
      }
    }
    return false;
  };
  
  // Look for the target in the current tree structure
  for (const rootItem of tree) {
    if (rootItem.id === targetId) {
      targetInGroup = false;
      break;
    }
    
    if (rootItem.children) {
      targetInGroup = findContainingGroup(rootItem.children);
      if (targetInGroup) {
        targetGroupPath = rootItem;
        break;
      }
    }
  }
  
  // 1. Find the item's proper group in the structure
  let itemGroupId = '';
  
  // Find which group this item belongs to in the original structure
  for (const group of allPossibleColumns) {
    if (group.children && group.children.some(child => child.id === item.id)) {
      itemGroupId = group.id;
      break;
    }
  }
  
  // 2. Create a temporary flat view of the tree
  const flatItems = flattenTreeWithParentInfo(tree);
  const targetIndex = flatItems.findIndex(fi => fi.id === targetId);
  
  if (targetIndex === -1) {
    // If target not found, default to adding to the appropriate group
    return insertItemIntoTreeAtIndex(tree, item, allPossibleColumns);
  }
  
  // 3. Find the correct insertion point based on the target
  const finalInsertionIndex = insertBefore ? targetIndex : targetIndex + 1;
  
  // 4. Determine which group to insert into
  let targetGroup: ColumnItem | null = null;
  let insertIntoRootLevel = false;
  
  if (targetGroupPath) {
    // If target is in a group, find that group
    targetGroup = findItemInTree(tree, targetGroupPath.id);
  } else if (itemGroupId) {
    // If item has a predefined group, use that
    targetGroup = findItemInTree(tree, itemGroupId);
    
    // If group doesn't exist yet, we need to create it
    if (!targetGroup) {
      // Find group definition in allPossibleColumns
      const groupDefinition = allPossibleColumns.find(g => g.id === itemGroupId);
      
      if (groupDefinition) {
        // Create the group
        const newGroup: ColumnItem = {
          id: groupDefinition.id,
          name: groupDefinition.name,
          field: groupDefinition.field,
          children: [],
          expanded: true
        };
        
        // Add to the tree
        tree.push(newGroup);
        targetGroup = newGroup;
      } else {
        // If can't find group definition, add at root level
        insertIntoRootLevel = true;
      }
    }
  } else {
    // If no group information, add at root level
    insertIntoRootLevel = true;
  }
  
  // 5. Perform the insertion
  if (insertIntoRootLevel) {
    // Insert at root level
    if (!tree.some(existingItem => existingItem.id === item.id)) {
      // Need to find the right index at root level
      let rootIndex = 0;
      let itemsFound = 0;
      
      // Count items until we reach our target position
      for (const flatItem of flatItems) {
        if (itemsFound === finalInsertionIndex) {
          break;
        }
        
        if (!flatItem.parentId) {
          // Root level item
          rootIndex++;
        }
        
        itemsFound++;
      }
      
      // Insert at the calculated root index
      tree.splice(rootIndex, 0, item);
    }
  } else if (targetGroup && targetGroup.children) {
    // Insert into the target group
    if (!targetGroup.children.some(existingItem => existingItem.id === item.id)) {
      // Find the correct index within this group
      let groupIndex = 0;
      let itemsFound = 0;
      
      // Count items until we reach our target position
      for (const flatItem of flatItems) {
        if (itemsFound === finalInsertionIndex) {
          break;
        }
        
        if (flatItem.parentId === targetGroup.id) {
          // Item in this group
          groupIndex++;
        }
        
        itemsFound++;
      }
      
      // Insert at the calculated group index
      targetGroup.children.splice(groupIndex, 0, item);
    }
  }
  
  return tree;
};