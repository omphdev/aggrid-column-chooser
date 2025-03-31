import { useRef } from 'react';
import { ExtendedColDef } from '../components/types';

interface UseColumnReorderingProps {
  selectedColumns: ExtendedColDef[];
  selectedItems: string[];
  onColumnChanged: (columns: ExtendedColDef[], operation: string) => void;
  setSelectedColumns: (columns: ExtendedColDef[]) => void;
}

export const useColumnReordering = ({
  selectedColumns,
  selectedItems,
  onColumnChanged,
  setSelectedColumns
}: UseColumnReorderingProps) => {
  const isReorderingRef = useRef<boolean>(false);
  const lastReorderTimeRef = useRef<number>(0);

  // Function to reorder a column within the selected panel
  const reorderColumn = (columnId: string, targetIndex: number) => {
    const columnsToMove = selectedItems.includes(columnId) 
      ? selectedItems 
      : [columnId];
    
    const now = Date.now();
    if (now - lastReorderTimeRef.current < 200) {
      console.log('Ignoring rapid reordering request');
      return;
    }
    
    lastReorderTimeRef.current = now;
    
    const columnIndices = columnsToMove
      .map(id => selectedColumns.findIndex(col => col.field === id))
      .filter(index => index !== -1)
      .sort((a, b) => a - b);
    
    if (columnIndices.length === 0 || targetIndex < 0) return;
    
    console.log(`Reordering columns [${columnsToMove.join(', ')}] to index ${targetIndex}`);
    
    isReorderingRef.current = true;
    
    const columnsCopy = JSON.parse(JSON.stringify(selectedColumns));
    
    const movedColumns = columnIndices.map(index => columnsCopy[index]);
    
    for (let i = columnIndices.length - 1; i >= 0; i--) {
      columnsCopy.splice(columnIndices[i], 1);
    }
    
    let adjustedTargetIndex = targetIndex;
    for (const index of columnIndices) {
      if (index < targetIndex) {
        adjustedTargetIndex--;
      }
    }
    
    adjustedTargetIndex = Math.max(0, Math.min(adjustedTargetIndex, columnsCopy.length));
    
    console.log(`Adjusted target index: ${adjustedTargetIndex}`);
    
    columnsCopy.splice(adjustedTargetIndex, 0, ...movedColumns);
    
    console.log('New column order:', columnsCopy.map(col => col.field).join(', '));
    
    setSelectedColumns(columnsCopy);
    
    const orderedColumns = columnsCopy.map(col => ({
      ...col,
      hide: false
    }));
    
    onColumnChanged(orderedColumns, 'REORDER_AT_INDEX');
    
    setTimeout(() => {
      isReorderingRef.current = false;
    }, 100);
  };

  // Function to move selected columns up in the selected panel
  const moveUp = () => {
    if (selectedItems.length === 0) return;
    
    const newSelectedColumns = [...selectedColumns];
    const indices = selectedItems
      .map(id => newSelectedColumns.findIndex(col => col.field === id))
      .filter(index => index !== -1)
      .sort((a, b) => a - b);
    
    if (indices[0] === 0) return;
    
    indices.forEach(index => {
      const temp = newSelectedColumns[index];
      newSelectedColumns[index] = newSelectedColumns[index - 1];
      newSelectedColumns[index - 1] = temp;
    });
    
    isReorderingRef.current = true;
    
    setSelectedColumns(newSelectedColumns);
    
    onColumnChanged(newSelectedColumns, 'REORDERED');
    
    setTimeout(() => {
      isReorderingRef.current = false;
    }, 100);
  };

  // Function to move selected columns down in the selected panel
  const moveDown = () => {
    if (selectedItems.length === 0) return;
    
    const newSelectedColumns = [...selectedColumns];
    const indices = selectedItems
      .map(id => newSelectedColumns.findIndex(col => col.field === id))
      .filter(index => index !== -1)
      .sort((a, b) => b - a);
    
    if (indices[0] === newSelectedColumns.length - 1) return;
    
    indices.forEach(index => {
      const temp = newSelectedColumns[index];
      newSelectedColumns[index] = newSelectedColumns[index + 1];
      newSelectedColumns[index + 1] = temp;
    });
    
    isReorderingRef.current = true;
    
    setSelectedColumns(newSelectedColumns);
    
    onColumnChanged(newSelectedColumns, 'REORDERED');
    
    setTimeout(() => {
      isReorderingRef.current = false;
    }, 100);
  };

  return {
    isReorderingRef,
    lastReorderTimeRef,
    reorderColumn,
    moveUp,
    moveDown
  };
}; 