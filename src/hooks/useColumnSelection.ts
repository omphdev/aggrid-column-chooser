import { useState, useCallback, useMemo } from 'react';
import { ColumnItem } from '../types';
import { getAllLeafIds, getAllParentIds } from '../utils/columnUtils';

interface UseColumnSelectionProps {
  availableColumns: ColumnItem[];
  selectedColumns: ColumnItem[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export const useColumnSelection = ({ availableColumns, selectedColumns, onSelectionChange }: UseColumnSelectionProps) => {
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Get all leaf IDs from selected columns
  const selectedLeafIds = useMemo(() => {
    return getAllLeafIds(selectedColumns);
  }, [selectedColumns]);

  // Get all parent IDs from selected columns
  const selectedParentIds = useMemo(() => {
    return getAllParentIds(selectedColumns);
  }, [selectedColumns]);

  // Toggle selection of an item
  const toggleSelection = useCallback((itemId: string) => {
    setSelectedIds(prev => {
      const newSelection = prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId];
      onSelectionChange(newSelection);
      return newSelection;
    });
  }, [onSelectionChange]);

  // Select all items
  const selectAll = useCallback(() => {
    const allIds = getAllLeafIds(availableColumns);
    setSelectedIds(allIds);
    onSelectionChange(allIds);
  }, [availableColumns, onSelectionChange]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    onSelectionChange([]);
  }, [onSelectionChange]);

  // Check if an item is selected
  const isSelected = useCallback((itemId: string) => {
    return selectedIds.includes(itemId);
  }, [selectedIds]);

  // Check if an item is partially selected (some children selected)
  const isPartiallySelected = useCallback((itemId: string) => {
    return selectedParentIds.includes(itemId);
  }, [selectedParentIds]);

  return {
    selectedIds,
    selectedLeafIds,
    selectedParentIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    isPartiallySelected,
  };
}; 