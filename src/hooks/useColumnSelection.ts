import { useState, useCallback } from 'react';
import { ExtendedColDef } from '../components/types';

interface UseColumnSelectionProps {
  availableColumns: ExtendedColDef[];
  selectedColumns: ExtendedColDef[];
  onColumnChanged: (columns: ExtendedColDef[], operation: string) => void;
  setSelectedColumns: (columns: ExtendedColDef[]) => void;
  setAvailableColumns: (columns: ExtendedColDef[]) => void;
}

export const useColumnSelection = ({
  availableColumns,
  selectedColumns,
  onColumnChanged,
  setSelectedColumns,
  setAvailableColumns
}: UseColumnSelectionProps) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Function to handle column selection
  const handleSelect = useCallback((columnId: string, event: React.MouseEvent) => {
    if (event.shiftKey && selectedItems.length > 0) {
      const lastSelectedId = selectedItems[selectedItems.length - 1];
      const allColumns = [...availableColumns, ...selectedColumns];
      const lastIndex = allColumns.findIndex(col => col.field === lastSelectedId);
      const currentIndex = allColumns.findIndex(col => col.field === columnId);
      
      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const newSelectedItems = allColumns
          .slice(start, end + 1)
          .map(col => col.field);
        
        setSelectedItems(newSelectedItems);
        return;
      }
    }
    
    setSelectedItems(prev => {
      if (prev.includes(columnId)) {
        return prev.filter(id => id !== columnId);
      }
      return [...prev, columnId];
    });
  }, [availableColumns, selectedColumns, selectedItems]);

  // Function to clear selection
  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  // Function to select all columns
  const selectAll = useCallback(() => {
    const allColumnIds = [...availableColumns, ...selectedColumns].map(col => col.field);
    setSelectedItems(allColumnIds);
  }, [availableColumns, selectedColumns]);

  // Function to move selected columns to selected panel
  const moveToSelected = useCallback(() => {
    if (selectedItems.length === 0) return;
    
    const columnsToMove = availableColumns.filter(col => selectedItems.includes(col.field));
    const remainingColumns = availableColumns.filter(col => !selectedItems.includes(col.field));
    
    setAvailableColumns(remainingColumns);
    setSelectedColumns([...selectedColumns, ...columnsToMove]);
    
    onColumnChanged([...selectedColumns, ...columnsToMove], 'ADD');
    clearSelection();
  }, [availableColumns, selectedColumns, selectedItems, onColumnChanged, clearSelection]);

  // Function to move selected columns to available panel
  const moveToAvailable = useCallback(() => {
    if (selectedItems.length === 0) return;
    
    const columnsToMove = selectedColumns.filter(col => selectedItems.includes(col.field));
    const remainingColumns = selectedColumns.filter(col => !selectedItems.includes(col.field));
    
    setSelectedColumns(remainingColumns);
    setAvailableColumns([...availableColumns, ...columnsToMove]);
    
    onColumnChanged(remainingColumns, 'REMOVE');
    clearSelection();
  }, [availableColumns, selectedColumns, selectedItems, onColumnChanged, clearSelection]);

  return {
    selectedItems,
    handleSelect,
    clearSelection,
    selectAll,
    moveToSelected,
    moveToAvailable
  };
}; 