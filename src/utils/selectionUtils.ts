// utils/selectionUtils.ts
import { ColumnItem } from "../types";
import { getAllItemIds } from "./treeUtils";

// Toggle selection of a single item, with support for range selection
export const toggleSelect = (
  items: ColumnItem[], 
  itemId: string, 
  isMultiSelect: boolean, 
  isRangeSelect: boolean,
  lastSelectedId: string | null
): [ColumnItem[], string | null] => {
  let updatedLastSelected = itemId;
  
  // For range selection, we need all visible items
  if (isRangeSelect && lastSelectedId) {
    const allItems = getAllItemIds(items);
    const currentIndex = allItems.findIndex(item => item.id === itemId);
    const lastIndex = allItems.findIndex(item => item.id === lastSelectedId);
    
    if (currentIndex >= 0 && lastIndex >= 0) {
      const startIdx = Math.min(currentIndex, lastIndex);
      const endIdx = Math.max(currentIndex, lastIndex);
      const rangeIds = new Set(allItems.slice(startIdx, endIdx + 1).map(item => item.id));
      
      const updateSelectionRange = (itemsList: ColumnItem[]): ColumnItem[] => {
        return itemsList.map(item => {
          if (rangeIds.has(item.id)) {
            return { ...item, selected: true };
          }
          
          if (item.children && item.children.length > 0) {
            return {
              ...item,
              children: updateSelectionRange(item.children)
            };
          }
          
          // If not multi-select, deselect all items not in range
          if (!isMultiSelect && item.selected && !rangeIds.has(item.id)) {
            return { ...item, selected: false };
          }
          
          return item;
        });
      };
      
      return [updateSelectionRange(items), updatedLastSelected];
    }
  }
  
  // Regular selection (single or ctrl+click)
  const updateSelection = (itemsList: ColumnItem[]): ColumnItem[] => {
    return itemsList.map(item => {
      if (item.id === itemId) {
        // Toggle the current item
        return { ...item, selected: !item.selected };
      }
      
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: updateSelection(item.children)
        };
      }
      
      // If not multi-select, deselect all other items
      if (!isMultiSelect && item.selected) {
        return { ...item, selected: false };
      }
      
      return item;
    });
  };
  
  return [updateSelection(items), updatedLastSelected];
};

// Select all items
export const selectAll = (items: ColumnItem[]): ColumnItem[] => {
  const updateSelection = (itemList: ColumnItem[]): ColumnItem[] => {
    return itemList.map(item => {
      const updatedItem = { ...item, selected: true };
      
      if (item.children && item.children.length > 0) {
        updatedItem.children = updateSelection(item.children);
      }
      
      return updatedItem;
    });
  };
  
  return updateSelection(items);
};

// Clear all selections
export const clearSelection = (items: ColumnItem[]): ColumnItem[] => {
  const updateSelection = (itemList: ColumnItem[]): ColumnItem[] => {
    return itemList.map(item => {
      const updatedItem = { ...item, selected: false };
      
      if (item.children && item.children.length > 0) {
        updatedItem.children = updateSelection(item.children);
      }
      
      return updatedItem;
    });
  };
  
  return updateSelection(items);
};