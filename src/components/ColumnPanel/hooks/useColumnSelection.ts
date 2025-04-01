import { useState } from 'react';
import { ExtendedColDef } from '../../types';

export interface UseColumnSelectionProps {
  availableColumns: ExtendedColDef[];
  selectedColumns: ExtendedColDef[];
}

export function useColumnSelection({
  availableColumns,
  selectedColumns
}: UseColumnSelectionProps) {
  // State for selected items
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Function to handle selection of a column
  const handleSelect = (columnId: string, isMultiSelect: boolean, isRangeSelect: boolean) => {
    let newSelectedItems = [...selectedItems];
    
    if (isMultiSelect) {
      // Toggle selection for multi-select (Ctrl/Cmd+click)
      if (newSelectedItems.includes(columnId)) {
        newSelectedItems = newSelectedItems.filter(id => id !== columnId);
      } else {
        newSelectedItems.push(columnId);
      }
    } else if (isRangeSelect) {
      // Range selection (Shift+click)
      if (newSelectedItems.length > 0) {
        const lastSelectedId = newSelectedItems[newSelectedItems.length - 1];
        const allColumns = [...availableColumns, ...selectedColumns];
        
        const lastSelectedIndex = allColumns.findIndex(col => col.field === lastSelectedId);
        const currentIndex = allColumns.findIndex(col => col.field === columnId);
        
        if (lastSelectedIndex !== -1 && currentIndex !== -1) {
          const startIndex = Math.min(lastSelectedIndex, currentIndex);
          const endIndex = Math.max(lastSelectedIndex, currentIndex);
          
          const rangeIds = allColumns
            .slice(startIndex, endIndex + 1)
            .map(col => col.field);
            
          newSelectedItems = Array.from(new Set([...newSelectedItems, ...rangeIds]));
        }
      } else {
        newSelectedItems = [columnId];
      }
    } else {
      // Single selection (regular click)
      newSelectedItems = [columnId];
    }
    
    setSelectedItems(newSelectedItems);
  };

  // Function to clear selection
  const clearSelection = () => {
    setSelectedItems([]);
  };
  
  return {
    selectedItems,
    setSelectedItems,
    handleSelect,
    clearSelection
  };
}