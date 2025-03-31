import { useState, useCallback, useRef, useMemo } from 'react';
import { ExtendedColDef, ColumnGroup } from '../components/types';

interface UseColumnResizingProps {
  availableColumns: ExtendedColDef[];
  selectedColumns: ExtendedColDef[];
  localColumnGroups: ColumnGroup[];
  onColumnChanged: (columns: ExtendedColDef[], operation: string) => void;
  setAvailableColumns: (columns: ExtendedColDef[]) => void;
  setSelectedColumns: (columns: ExtendedColDef[]) => void;
}

export const useColumnResizing = ({
  availableColumns,
  selectedColumns,
  localColumnGroups,
  onColumnChanged,
  setAvailableColumns,
  setSelectedColumns
}: UseColumnResizingProps) => {
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState<number>(0);
  const [resizeStartWidth, setResizeStartWidth] = useState<number>(0);
  const resizeTimeoutRef = useRef<number | null>(null);

  // Function to start column resizing
  const startResizing = useCallback((columnId: string, event: React.MouseEvent) => {
    setResizingColumn(columnId);
    setResizeStartX(event.clientX);
    
    const column = [...availableColumns, ...selectedColumns].find(col => col.field === columnId);
    if (column) {
      setResizeStartWidth(column.width || 100);
    }
  }, [availableColumns, selectedColumns]);

  // Function to handle column resizing
  const handleResizing = useCallback((event: MouseEvent) => {
    if (!resizingColumn) return;
    
    const deltaX = event.clientX - resizeStartX;
    const newWidth = Math.max(50, resizeStartWidth + deltaX);
    
    // Update column width in available and selected columns
    const updatedAvailableColumns = availableColumns.map(col => ({
      ...col,
      width: col.field === resizingColumn ? newWidth : col.width
    })) as ExtendedColDef[];
    
    const updatedSelectedColumns = selectedColumns.map(col => ({
      ...col,
      width: col.field === resizingColumn ? newWidth : col.width
    })) as ExtendedColDef[];
    
    setAvailableColumns(updatedAvailableColumns);
    setSelectedColumns(updatedSelectedColumns);
    
    // Update column width in groups
    const updatedGroups = localColumnGroups.map(group => ({
      ...group,
      columns: group.columns?.map(col => ({
        ...col,
        width: col.field === resizingColumn ? newWidth : col.width
      })) as ExtendedColDef[]
    }));
    
    // Debounce the column change event
    if (resizeTimeoutRef.current) {
      window.clearTimeout(resizeTimeoutRef.current);
    }
    resizeTimeoutRef.current = window.setTimeout(() => {
      onColumnChanged(updatedSelectedColumns, 'RESIZE');
    }, 100);
  }, [resizingColumn, resizeStartX, resizeStartWidth, availableColumns, selectedColumns, localColumnGroups, onColumnChanged]);

  // Function to stop column resizing
  const stopResizing = useCallback(() => {
    setResizingColumn(null);
    if (resizeTimeoutRef.current) {
      window.clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = null;
    }
  }, []);

  // Function to reset column widths
  const resetColumnWidths = useCallback(() => {
    const defaultWidth = 100;
    
    // Reset column widths in available and selected columns
    const updatedAvailableColumns = availableColumns.map(col => ({
      ...col,
      width: defaultWidth
    })) as ExtendedColDef[];
    
    const updatedSelectedColumns = selectedColumns.map(col => ({
      ...col,
      width: defaultWidth
    })) as ExtendedColDef[];
    
    setAvailableColumns(updatedAvailableColumns);
    setSelectedColumns(updatedSelectedColumns);
    
    // Reset column widths in groups
    const updatedGroups = localColumnGroups.map(group => ({
      ...group,
      columns: group.columns?.map(col => ({
        ...col,
        width: defaultWidth
      })) as ExtendedColDef[]
    }));
    
    onColumnChanged(updatedSelectedColumns, 'RESET_WIDTHS');
  }, [availableColumns, selectedColumns, localColumnGroups, onColumnChanged]);

  // Memoized resizing state
  const resizingState = useMemo(() => ({
    resizingColumn,
    isResizing: (columnId: string) => resizingColumn === columnId
  }), [resizingColumn]);

  return {
    ...resizingState,
    startResizing,
    handleResizing,
    stopResizing,
    resetColumnWidths
  };
}; 