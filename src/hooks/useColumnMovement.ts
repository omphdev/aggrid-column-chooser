import { useCallback } from 'react';
import { ColumnItem } from '../types';
import { findGroupContainingColumns } from '../utils/columnUtils';

interface UseColumnMovementProps {
  availableColumns: ColumnItem[];
  selectedColumns: ColumnItem[];
  columnGroups: ColumnItem[];
  onAvailableColumnsChange: (columns: ColumnItem[]) => void;
  onSelectedColumnsChange: (columns: ColumnItem[]) => void;
  onColumnGroupsChange: (groups: ColumnItem[]) => void;
}

export const useColumnMovement = ({
  availableColumns,
  selectedColumns,
  columnGroups,
  onAvailableColumnsChange,
  onSelectedColumnsChange,
  onColumnGroupsChange,
}: UseColumnMovementProps) => {
  // Move items from available to selected
  const moveItemsToSelected = useCallback((
    itemIds: string[],
    targetId?: string,
    position: 'before' | 'after' | 'inside' = 'after'
  ) => {
    // Find items in available columns
    const itemsToMove = itemIds
      .map(id => {
        const findItem = (items: ColumnItem[]): ColumnItem | null => {
          for (const item of items) {
            if (item.id === id) return item;
            if (item.children) {
              const found = findItem(item.children);
              if (found) return found;
            }
          }
          return null;
        };
        return findItem(availableColumns);
      })
      .filter((item): item is ColumnItem => item !== null);

    if (itemsToMove.length === 0) return;

    // Remove items from available columns
    const removeItems = (items: ColumnItem[] | undefined): ColumnItem[] => {
      if (!items) return [];
      return items.filter(item => {
        if (item.children) {
          item.children = removeItems(item.children);
          return item.children.length > 0;
        }
        return !itemIds.includes(item.id);
      });
    };

    const newAvailableColumns = removeItems(availableColumns);
    onAvailableColumnsChange(newAvailableColumns);

    // Add items to selected columns
    if (targetId) {
      const findTargetIndex = (items: ColumnItem[] | undefined): number => {
        if (!items) return -1;
        for (let i = 0; i < items.length; i++) {
          if (items[i].id === targetId) {
            return position === 'before' ? i : i + 1;
          }
          if (items[i].children) {
            const index = findTargetIndex(items[i].children);
            if (index !== -1) return index;
          }
        }
        return -1;
      };

      const insertItems = (items: ColumnItem[], targetIndex: number): ColumnItem[] => {
        const result = [...items];
        result.splice(targetIndex, 0, ...itemsToMove);
        return result;
      };

      const targetIndex = findTargetIndex(selectedColumns);
      if (targetIndex !== -1) {
        const newSelectedColumns = insertItems(selectedColumns, targetIndex);
        onSelectedColumnsChange(newSelectedColumns);
      }
    } else {
      onSelectedColumnsChange([...selectedColumns, ...itemsToMove]);
    }
  }, [availableColumns, selectedColumns, onAvailableColumnsChange, onSelectedColumnsChange]);

  // Move items from selected to available
  const moveItemsToAvailable = useCallback((
    itemIds: string[],
    targetId?: string,
    position: 'before' | 'after' | 'inside' = 'after'
  ) => {
    // Find items in selected columns
    const itemsToMove = itemIds
      .map(id => {
        const findItem = (items: ColumnItem[]): ColumnItem | null => {
          for (const item of items) {
            if (item.id === id) return item;
            if (item.children) {
              const found = findItem(item.children);
              if (found) return found;
            }
          }
          return null;
        };
        return findItem(selectedColumns);
      })
      .filter((item): item is ColumnItem => item !== null);

    if (itemsToMove.length === 0) return;

    // Remove items from selected columns
    const removeItems = (items: ColumnItem[] | undefined): ColumnItem[] => {
      if (!items) return [];
      return items.filter(item => {
        if (item.children) {
          item.children = removeItems(item.children);
          return item.children.length > 0;
        }
        return !itemIds.includes(item.id);
      });
    };

    const newSelectedColumns = removeItems(selectedColumns);
    onSelectedColumnsChange(newSelectedColumns);

    // Remove items from groups
    const newGroups = columnGroups.map(group => ({
      ...group,
      children: removeItems(group.children),
    })).filter(group => group.children && group.children.length > 0);
    onColumnGroupsChange(newGroups);

    // Add items to available columns
    if (targetId) {
      const findTargetIndex = (items: ColumnItem[] | undefined): number => {
        if (!items) return -1;
        for (let i = 0; i < items.length; i++) {
          if (items[i].id === targetId) {
            return position === 'before' ? i : i + 1;
          }
          if (items[i].children) {
            const index = findTargetIndex(items[i].children);
            if (index !== -1) return index;
          }
        }
        return -1;
      };

      const insertItems = (items: ColumnItem[], targetIndex: number): ColumnItem[] => {
        const result = [...items];
        result.splice(targetIndex, 0, ...itemsToMove);
        return result;
      };

      const targetIndex = findTargetIndex(availableColumns);
      if (targetIndex !== -1) {
        const newAvailableColumns = insertItems(availableColumns, targetIndex);
        onAvailableColumnsChange(newAvailableColumns);
      }
    } else {
      onAvailableColumnsChange([...availableColumns, ...itemsToMove]);
    }
  }, [availableColumns, selectedColumns, columnGroups, onAvailableColumnsChange, onSelectedColumnsChange, onColumnGroupsChange]);

  // Move a single item to selected on double click
  const moveItemToSelected = useCallback((itemId: string) => {
    moveItemsToSelected([itemId]);
  }, [moveItemsToSelected]);

  // Move a single item to available on double click
  const moveItemToAvailable = useCallback((itemId: string) => {
    moveItemsToAvailable([itemId]);
  }, [moveItemsToAvailable]);

  return {
    moveItemsToSelected,
    moveItemsToAvailable,
    moveItemToSelected,
    moveItemToAvailable,
  };
}; 