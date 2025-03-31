import { useState, useCallback, useRef, useMemo } from 'react';
import { ExtendedColDef, ColumnGroup } from '../components/types';

interface UseDragAndDropProps {
  availableColumns: ExtendedColDef[];
  selectedColumns: ExtendedColDef[];
  localColumnGroups: ColumnGroup[];
  onColumnChanged: (columns: ExtendedColDef[], operation: string) => void;
  setAvailableColumns: (columns: ExtendedColDef[]) => void;
  setSelectedColumns: (columns: ExtendedColDef[]) => void;
  setLocalColumnGroups: (groups: ColumnGroup[]) => void;
  addToGroup: (groupId: string, columnIds: string[]) => void;
  reorderColumnInGroup: (groupId: string, columnId: string, targetIndex: number) => void;
  isSelectedPanel: boolean;
}

export const useDragAndDrop = ({
  availableColumns,
  selectedColumns,
  localColumnGroups,
  onColumnChanged,
  setAvailableColumns,
  setSelectedColumns,
  setLocalColumnGroups,
  addToGroup,
  reorderColumnInGroup,
  isSelectedPanel
}: UseDragAndDropProps) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number | null>(null);
  const dragTimeoutRef = useRef<number | null>(null);

  // Function to start dragging a column
  const startDragging = useCallback((columnId: string) => {
    setDraggedItem(columnId);
    setDraggedGroupId(null);
  }, []);

  // Function to start dragging a group
  const startDraggingGroup = useCallback((groupId: string) => {
    setDraggedGroupId(groupId);
    setDraggedItem(null);
  }, []);

  // Function to handle drag over
  const handleDragOver = useCallback((event: React.DragEvent, index: number) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (dragTimeoutRef.current) {
      window.clearTimeout(dragTimeoutRef.current);
    }
    
    dragTimeoutRef.current = window.setTimeout(() => {
      setDropIndicatorIndex(index);
    }, 50);
  }, []);

  // Function to handle drag leave
  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (dragTimeoutRef.current) {
      window.clearTimeout(dragTimeoutRef.current);
    }
    
    dragTimeoutRef.current = window.setTimeout(() => {
      setDropIndicatorIndex(null);
    }, 50);
  }, []);

  // Function to handle drop
  const handleDrop = useCallback((event: React.DragEvent, targetIndex: number) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (dragTimeoutRef.current) {
      window.clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = null;
    }
    
    setDropIndicatorIndex(null);
    
    if (draggedItem) {
      const sourceIndex = selectedColumns.findIndex(col => col.field === draggedItem);
      if (sourceIndex === -1) return;
      
      const newColumns = [...selectedColumns];
      const [movedColumn] = newColumns.splice(sourceIndex, 1);
      newColumns.splice(targetIndex, 0, movedColumn);
      
      setSelectedColumns(newColumns);
      onColumnChanged(newColumns, 'REORDER');
    } else if (draggedGroupId) {
      const sourceIndex = localColumnGroups.findIndex(g => g.headerName === draggedGroupId);
      if (sourceIndex === -1) return;
      
      const newGroups = [...localColumnGroups];
      const [movedGroup] = newGroups.splice(sourceIndex, 1);
      newGroups.splice(targetIndex, 0, movedGroup);
      
      setLocalColumnGroups(newGroups);
    }
    
    setDraggedItem(null);
    setDraggedGroupId(null);
  }, [draggedItem, draggedGroupId, selectedColumns, localColumnGroups, onColumnChanged]);

  // Function to handle drop on a group
  const handleDropOnGroup = useCallback((event: React.DragEvent, groupId: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (draggedItem) {
      addToGroup(groupId, [draggedItem]);
    }
    
    setDraggedItem(null);
    setDraggedGroupId(null);
  }, [draggedItem, addToGroup]);

  // Function to handle drop on a column within a group
  const handleDropOnGroupColumn = useCallback((event: React.DragEvent, groupId: string, columnId: string, targetIndex: number) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (draggedItem) {
      reorderColumnInGroup(groupId, columnId, targetIndex);
    }
    
    setDraggedItem(null);
    setDraggedGroupId(null);
  }, [draggedItem, reorderColumnInGroup]);

  // Memoized drag and drop state
  const dragAndDropState = useMemo(() => ({
    draggedItem,
    draggedGroupId,
    dropIndicatorIndex,
    isDragging: (columnId: string) => draggedItem === columnId,
    isDraggingGroup: (groupId: string) => draggedGroupId === groupId,
    isDropTarget: (index: number) => dropIndicatorIndex === index
  }), [draggedItem, draggedGroupId, dropIndicatorIndex]);

  return {
    ...dragAndDropState,
    startDragging,
    startDraggingGroup,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDropOnGroup,
    handleDropOnGroupColumn
  };
}; 