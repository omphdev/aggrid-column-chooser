import { useState, useCallback } from 'react';
import { ColumnItem } from '../types';

interface UseColumnViewStateProps {
  availableColumns: ColumnItem[];
  selectedColumns: ColumnItem[];
  onViewChange?: (isFlatView: boolean) => void;
}

export const useColumnViewState = ({
  availableColumns,
  selectedColumns,
  onViewChange,
}: UseColumnViewStateProps) => {
  // View state
  const [isFlatView, setIsFlatView] = useState(false);

  // Toggle view mode
  const toggleViewMode = useCallback(() => {
    setIsFlatView(prev => {
      const newValue = !prev;
      onViewChange?.(newValue);
      return newValue;
    });
  }, [onViewChange]);

  // Set view mode
  const setViewMode = useCallback((flat: boolean) => {
    setIsFlatView(flat);
    onViewChange?.(flat);
  }, [onViewChange]);

  // Get flattened columns
  const getFlattenedColumns = useCallback((columns: ColumnItem[]): ColumnItem[] => {
    if (!isFlatView) return columns;

    const flatten = (items: ColumnItem[]): ColumnItem[] => {
      return items.reduce<ColumnItem[]>((acc, item) => {
        if (item.children && item.children.length > 0) {
          return [...acc, ...flatten(item.children)];
        }
        return [...acc, item];
      }, []);
    };

    return flatten(columns);
  }, [isFlatView]);

  // Get available columns in current view
  const getAvailableColumnsInView = useCallback(() => {
    return getFlattenedColumns(availableColumns);
  }, [availableColumns, getFlattenedColumns]);

  // Get selected columns in current view
  const getSelectedColumnsInView = useCallback(() => {
    return getFlattenedColumns(selectedColumns);
  }, [selectedColumns, getFlattenedColumns]);

  return {
    isFlatView,
    toggleViewMode,
    setViewMode,
    getFlattenedColumns,
    getAvailableColumnsInView,
    getSelectedColumnsInView,
  };
}; 