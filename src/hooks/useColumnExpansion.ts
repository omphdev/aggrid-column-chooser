import { useState, useCallback } from 'react';
import { ColumnItem } from '../types';
import { getAllParentIds } from '../utils/columnUtils';

interface UseColumnExpansionProps {
  availableColumns: ColumnItem[];
  selectedColumns: ColumnItem[];
}

export const useColumnExpansion = ({ availableColumns, selectedColumns }: UseColumnExpansionProps) => {
  // Expansion state
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  // Get all parent IDs that should be expanded
  const getParentIds = useCallback(() => {
    return getAllParentIds([...availableColumns, ...selectedColumns]);
  }, [availableColumns, selectedColumns]);

  // Toggle expansion of an item
  const toggleExpansion = useCallback((itemId: string) => {
    setExpandedIds(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      }
      return [...prev, itemId];
    });
  }, []);

  // Expand all items
  const expandAll = useCallback(() => {
    setExpandedIds(getParentIds());
  }, [getParentIds]);

  // Collapse all items
  const collapseAll = useCallback(() => {
    setExpandedIds([]);
  }, []);

  // Check if an item is expanded
  const isExpanded = useCallback((itemId: string) => {
    return expandedIds.includes(itemId);
  }, [expandedIds]);

  // Expand an item and all its parents
  const expandItemAndParents = useCallback((itemId: string) => {
    const parentIds = getParentIds();
    const itemParents = parentIds.filter(id => {
      const item = [...availableColumns, ...selectedColumns].find(col => col.id === id);
      return item?.children?.some(child => child.id === itemId || child.children?.some(grandChild => grandChild.id === itemId));
    });

    setExpandedIds(prev => [...new Set([...prev, ...itemParents])]);
  }, [availableColumns, selectedColumns, getParentIds]);

  return {
    expandedIds,
    toggleExpansion,
    expandAll,
    collapseAll,
    isExpanded,
    expandItemAndParents,
  };
}; 