import { useState, useCallback } from 'react';
import { ColumnItem } from '../types';
import { getColumnDepth, getColumnPath } from '../utils/columnUtils';

interface UseColumnDragAndDropProps {
  availableColumns: ColumnItem[];
  selectedColumns: ColumnItem[];
  onDragStart?: (itemId: string) => void;
  onDragEnd?: () => void;
  onDrop?: (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
}

export const useColumnDragAndDrop = ({
  availableColumns,
  selectedColumns,
  onDragStart,
  onDragEnd,
  onDrop,
}: UseColumnDragAndDropProps) => {
  // Drag state
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | 'inside' | null>(null);

  // Start dragging an item
  const handleDragStart = useCallback((itemId: string) => {
    setDraggedItemId(itemId);
    onDragStart?.(itemId);
  }, [onDragStart]);

  // End dragging
  const handleDragEnd = useCallback(() => {
    setDraggedItemId(null);
    setDragOverItemId(null);
    setDropPosition(null);
    onDragEnd?.();
  }, [onDragEnd]);

  // Handle drag over an item
  const handleDragOver = useCallback((itemId: string, event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!draggedItemId || draggedItemId === itemId) return;

    const draggedDepth = getColumnDepth([...availableColumns, ...selectedColumns], draggedItemId);
    const targetDepth = getColumnDepth([...availableColumns, ...selectedColumns], itemId);

    if (draggedDepth === -1 || targetDepth === -1) return;

    // Calculate drop position based on mouse position
    const rect = event.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = event.clientY < midY ? 'before' : 'after';

    // If dragging over a group, allow dropping inside
    const targetItem = [...availableColumns, ...selectedColumns].find(item => item.id === itemId);
    if (targetItem?.children && position === 'after') {
      setDropPosition('inside');
    } else {
      setDropPosition(position);
    }

    setDragOverItemId(itemId);
  }, [draggedItemId, availableColumns, selectedColumns]);

  // Handle drop
  const handleDrop = useCallback((itemId: string) => {
    if (!draggedItemId || !dropPosition) return;

    onDrop?.(draggedItemId, itemId, dropPosition);
    handleDragEnd();
  }, [draggedItemId, dropPosition, onDrop, handleDragEnd]);

  // Check if an item can be dropped on another item
  const canDrop = useCallback((sourceId: string, targetId: string): boolean => {
    if (sourceId === targetId) return false;

    const sourcePath = getColumnPath([...availableColumns, ...selectedColumns], sourceId);
    const targetPath = getColumnPath([...availableColumns, ...selectedColumns], targetId);

    if (!sourcePath || !targetPath) return false;

    // Prevent dropping a parent onto its child
    return !targetPath.includes(sourceId);
  }, [availableColumns, selectedColumns]);

  return {
    draggedItemId,
    dragOverItemId,
    dropPosition,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    canDrop,
  };
}; 