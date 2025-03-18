// src/hooks/useSelection.ts
import { useCallback, useState } from 'react';
import { ColumnItem } from '../types';
import { 
  toggleSelect as toggleSelectUtil,
  selectAll as selectAllUtil,
  clearSelection as clearSelectionUtil
} from '../utils/selectionUtils';

/**
 * Hook for managing selection state in a tree structure
 */
export const useSelection = (initialItems: ColumnItem[] = []) => {
  // State for items
  const [items, setItems] = useState<ColumnItem[]>(initialItems);
  
  // State for the last selected item (used for range selection)
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  // Toggle selection for an item
  const toggleSelect = useCallback((
    itemId: string, 
    isMultiSelect: boolean, 
    isRangeSelect: boolean,
    flatView: boolean = false
  ) => {
    setItems(prevItems => {
      const [updatedItems, updatedLastSelected] = toggleSelectUtil(
        prevItems,
        itemId,
        isMultiSelect,
        isRangeSelect,
        lastSelectedId,
        flatView
      );
      
      setLastSelectedId(updatedLastSelected);
      return updatedItems;
    });
  }, [lastSelectedId]);

  // Select all items
  const selectAll = useCallback(() => {
    setItems(prevItems => selectAllUtil(prevItems));
  }, []);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setItems(prevItems => clearSelectionUtil(prevItems));
    setLastSelectedId(null);
  }, []);

  // Get count of selected items
  const getSelectedCount = useCallback(() => {
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
  }, [items]);

  return {
    items,
    setItems,
    lastSelectedId,
    toggleSelect,
    selectAll,
    clearSelection,
    getSelectedCount
  };
};

// Add export statement to make it a module
export default useSelection;