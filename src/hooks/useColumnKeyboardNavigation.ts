import { useState, useCallback, useEffect } from 'react';
import { ColumnItem } from '../types';
import { getAllLeafIds, getAllParentIds } from '../utils/columnUtils';

interface UseColumnKeyboardNavigationProps {
  availableColumns: ColumnItem[];
  selectedColumns: ColumnItem[];
  onSelect?: (itemId: string) => void;
  onExpand?: (itemId: string) => void;
  onCollapse?: (itemId: string) => void;
}

export const useColumnKeyboardNavigation = ({
  availableColumns,
  selectedColumns,
  onSelect,
  onExpand,
  onCollapse,
}: UseColumnKeyboardNavigationProps) => {
  // Navigation state
  const [focusedId, setFocusedId] = useState<string | null>(null);

  // Get all focusable IDs
  const getAllFocusableIds = useCallback(() => {
    return [...getAllLeafIds(availableColumns), ...getAllParentIds(availableColumns)];
  }, [availableColumns]);

  // Get next focusable ID
  const getNextFocusableId = useCallback((currentId: string | null) => {
    const focusableIds = getAllFocusableIds();
    if (!currentId) return focusableIds[0];
    
    const currentIndex = focusableIds.indexOf(currentId);
    return currentIndex < focusableIds.length - 1 ? focusableIds[currentIndex + 1] : focusableIds[0];
  }, [getAllFocusableIds]);

  // Get previous focusable ID
  const getPreviousFocusableId = useCallback((currentId: string | null) => {
    const focusableIds = getAllFocusableIds();
    if (!currentId) return focusableIds[focusableIds.length - 1];
    
    const currentIndex = focusableIds.indexOf(currentId);
    return currentIndex > 0 ? focusableIds[currentIndex - 1] : focusableIds[focusableIds.length - 1];
  }, [getAllFocusableIds]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!focusedId) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedId(getNextFocusableId(focusedId));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedId(getPreviousFocusableId(focusedId));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        onSelect?.(focusedId);
        break;
      case 'ArrowRight':
        event.preventDefault();
        onExpand?.(focusedId);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        onCollapse?.(focusedId);
        break;
      case 'Home':
        event.preventDefault();
        setFocusedId(getAllFocusableIds()[0]);
        break;
      case 'End':
        event.preventDefault();
        const focusableIds = getAllFocusableIds();
        setFocusedId(focusableIds[focusableIds.length - 1]);
        break;
    }
  }, [focusedId, getAllFocusableIds, getNextFocusableId, getPreviousFocusableId, onSelect, onExpand, onCollapse]);

  // Set up keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Focus first item on mount
  useEffect(() => {
    if (!focusedId) {
      const focusableIds = getAllFocusableIds();
      if (focusableIds.length > 0) {
        setFocusedId(focusableIds[0]);
      }
    }
  }, [focusedId, getAllFocusableIds]);

  return {
    focusedId,
    setFocusedId,
  };
}; 