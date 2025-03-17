// utils/dragDropUtils.ts
import { ColumnItem } from "../types";
import { 
  findItemInTree, 
  removeItemFromTree, 
  deepCloneColumnItem, 
  countSelectedItems, 
  getSelectedItems 
} from "./treeUtils";

// Helper function to insert item into tree
export const insertItemIntoTree = (
  items: ColumnItem[], 
  item: ColumnItem,
  allPossibleColumns: ColumnItem[]
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
      
      // Add the item to the group if it's not already there
      if (!targetGroup.children.some(child => child.id === item.id)) {
        targetGroup.children.push(item);
      }
      
      return items;
    }
  }
  
  // This is a top-level item, add directly if not already there
  if (!items.some(existingItem => existingItem.id === item.id)) {
    items.push(item);
  }
  
  return items;
};

// Handle drag start for the available items panel
export const handleDragStartForAvailable = (
  e: React.DragEvent, 
  item: ColumnItem,
  items: ColumnItem[]
) => {
  // Always set up data transfer with this item ID
  // For single item dragging without requiring selection first
  const itemIds = [item.id];
  
  // If the item is already selected, include other selected items too
  if (item.selected && countSelectedItems(items) > 1) {
    // Use all selected items
    const selectedIds = getSelectedItems(items);
    e.dataTransfer.setData('text/plain', JSON.stringify({
      ids: selectedIds,
      source: 'available'
    }));
  } else {
    // Just drag this one item, ignoring any other selections
    e.dataTransfer.setData('text/plain', JSON.stringify({
      ids: itemIds,
      source: 'available'
    }));
  }
};

// Handle drag start for the selected items panel
export const handleDragStartForSelected = (
  e: React.DragEvent, 
  item: ColumnItem,
  items: ColumnItem[]
) => {
  // Always set up data transfer with this item ID
  // For single item dragging without requiring selection first
  const itemIds = [item.id];
  
  // If the item is already selected, include other selected items too
  if (item.selected && countSelectedItems(items) > 1) {
    // Use all selected items
    const selectedIds = getSelectedItems(items);
    e.dataTransfer.setData('text/plain', JSON.stringify({
      ids: selectedIds,
      source: 'selected'
    }));
  } else {
    // Just drag this one item, ignoring any other selections
    e.dataTransfer.setData('text/plain', JSON.stringify({
      ids: itemIds,
      source: 'selected'
    }));
  }
};

// Process drop operations
export const processDragDrop = (
  e: React.DragEvent,
  sourcePanel: string,
  availableColumns: ColumnItem[],
  selectedColumns: ColumnItem[],
  allPossibleColumns: ColumnItem[],
  clearSelectionFunctions: () => void,
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
            
            // Add to selected (using helper to preserve hierarchy)
            newSelected = insertItemIntoTree(newSelected, clonedItem, allPossibleColumns);
          } else {
            // Remove from selected
            newSelected = removeItemFromTree(newSelected, draggedItemId);
            
            // Add to available (using helper to preserve hierarchy)
            newAvailable = insertItemIntoTree(newAvailable, clonedItem, allPossibleColumns);
          }
        }
      }
      
      // Clear selections after drag
      clearSelectionFunctions();
      
      return { newAvailable, newSelected };
    }
  } catch (err) {
    console.error('Error processing drag data:', err);
  }
  
  return { newAvailable: availableColumns, newSelected: selectedColumns };
};