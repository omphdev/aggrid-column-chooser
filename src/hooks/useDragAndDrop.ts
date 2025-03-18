// src/hooks/useDragAndDrop.ts
import { useCallback, useState } from 'react';
import { ColumnItem } from '../types';
import { 
  handleDragStartForAvailable,
  handleDragStartForSelected
} from '../utils/dragDropUtils';

/**
 * Hook for managing drag and drop operations
 */
export const useDragAndDrop = (
  availableColumns: ColumnItem[],
  selectedColumns: ColumnItem[]
) => {
  // State for tracking drop position
  const [dropTarget, setDropTarget] = useState<{
    id?: string;
    insertBefore: boolean;
  }>({
    insertBefore: true
  });

  // Handle drag start for available columns
  const handleAvailableDragStart = useCallback((e: React.DragEvent, item: ColumnItem) => {
    handleDragStartForAvailable(e, item, availableColumns);
  }, [availableColumns]);

  // Handle drag start for selected columns
  const handleSelectedDragStart = useCallback((e: React.DragEvent, item: ColumnItem) => {
    handleDragStartForSelected(e, item, selectedColumns);
  }, [selectedColumns]);

  // Prevent default behavior for drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Update drop target when dragging over an item
  const updateDropTarget = useCallback((id: string, insertBefore: boolean) => {
    setDropTarget({ id, insertBefore });
  }, []);

  // Clear drop target
  const clearDropTarget = useCallback(() => {
    setDropTarget({ insertBefore: true });
  }, []);

  return {
    dropTarget,
    handleAvailableDragStart,
    handleSelectedDragStart,
    handleDragOver,
    updateDropTarget,
    clearDropTarget
  };
};

// Add export statement to make it a module
export default useDragAndDrop;