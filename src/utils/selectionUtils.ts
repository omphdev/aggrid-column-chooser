// utils/selectionUtils.ts
import { ColumnItem } from "../types";
import { getAllItemIds } from "./treeUtils";

// Get all visible items in a flat structure, regardless of hierarchy
export const getAllVisibleItems = (items: ColumnItem[], flatView: boolean = false): { id: string, index: number }[] => {
  const result: { id: string, index: number }[] = [];
  let index = 0;
  
  if (flatView) {
    // In flat view, we only include leaf nodes (items with field)
    const flattenItems = (itemList: ColumnItem[]) => {
      for (const item of itemList) {
        if (item.field && (!item.children || item.children.length === 0)) {
          // This is a leaf node
          result.push({ id: item.id, index: index++ });
        }
        
        if (item.children && item.children.length > 0) {
          flattenItems(item.children);
        }
      }
    };
    
    flattenItems(items);
  } else {
    // In tree view, we respect the expanded state
    const collectItems = (itemList: ColumnItem[]) => {
      for (const item of itemList) {
        result.push({ id: item.id, index: index++ });
        
        if (item.children && item.children.length > 0 && item.expanded) {
          collectItems(item.children);
        }
      }
    };
    
    collectItems(items);
  }
  
  return result;
};

// Enhanced toggle selection with flat view support
export const toggleSelect = (
  items: ColumnItem[], 
  itemId: string, 
  isMultiSelect: boolean, 
  isRangeSelect: boolean,
  lastSelectedId: string | null,
  flatView: boolean = false
): [ColumnItem[], string | null] => {
  let updatedLastSelected = itemId;
  
  // For range selection, we need all visible items
  if (isRangeSelect && lastSelectedId) {
    // Use the enhanced method that properly handles flat view
    const allItems = getAllVisibleItems(items, flatView);
    const currentIndex = allItems.findIndex(item => item.id === itemId);
    const lastIndex = allItems.findIndex(item => item.id === lastSelectedId);
    
    if (currentIndex >= 0 && lastIndex >= 0) {
      const startIdx = Math.min(currentIndex, lastIndex);
      const endIdx = Math.max(currentIndex, lastIndex);
      const rangeIds = new Set(allItems.slice(startIdx, endIdx + 1).map(item => item.id));
      
      // Debug log to help identify selection issues
      console.log(`Selecting range from index ${startIdx} to ${endIdx}`);
      console.log(`Range items: ${Array.from(rangeIds).join(', ')}`);
      
      const updateSelectionRange = (itemsList: ColumnItem[]): ColumnItem[] => {
        return itemsList.map(item => {
          // If in the range, always select
          if (rangeIds.has(item.id)) {
            return { ...item, selected: true };
          }
          
          if (item.children && item.children.length > 0) {
            return {
              ...item,
              children: updateSelectionRange(item.children)
            };
          }
          
          // When using shift+select, keep other selected items selected
          // Only deselect other items if not using multi-select (Ctrl key) or shift key
          if (!isMultiSelect && !isRangeSelect && item.selected && !rangeIds.has(item.id)) {
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
      
      // If not multi-select or range-select, deselect all other items
      if (!isMultiSelect && !isRangeSelect && item.selected) {
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