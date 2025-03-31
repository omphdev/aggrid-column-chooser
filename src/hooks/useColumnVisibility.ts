import { useState, useCallback, useMemo } from 'react';
import { ExtendedColDef, ColumnGroup } from '../components/types';

interface UseColumnVisibilityProps {
  availableColumns: ExtendedColDef[];
  selectedColumns: ExtendedColDef[];
  localColumnGroups: ColumnGroup[];
  onColumnChanged: (columns: ExtendedColDef[], operation: string) => void;
  setAvailableColumns: (columns: ExtendedColDef[]) => void;
  setSelectedColumns: (columns: ExtendedColDef[]) => void;
}

export const useColumnVisibility = ({
  availableColumns,
  selectedColumns,
  localColumnGroups,
  onColumnChanged,
  setAvailableColumns,
  setSelectedColumns
}: UseColumnVisibilityProps) => {
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [pinnedColumns, setPinnedColumns] = useState<string[]>([]);

  // Function to toggle column visibility
  const toggleColumnVisibility = useCallback((columnId: string) => {
    setHiddenColumns(prev => {
      const isHidden = prev.includes(columnId);
      const newHidden = isHidden
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId];
      
      // Update column visibility in available and selected columns
      const updatedAvailableColumns = availableColumns.map(col => ({
        ...col,
        hide: newHidden.includes(col.field)
      })) as ExtendedColDef[];
      
      const updatedSelectedColumns = selectedColumns.map(col => ({
        ...col,
        hide: newHidden.includes(col.field)
      })) as ExtendedColDef[];
      
      setAvailableColumns(updatedAvailableColumns);
      setSelectedColumns(updatedSelectedColumns);
      
      // Update column visibility in groups
      const updatedGroups = localColumnGroups.map(group => ({
        ...group,
        columns: group.columns?.map(col => ({
          ...col,
          hide: newHidden.includes(col.field)
        })) as ExtendedColDef[]
      }));
      
      onColumnChanged(updatedSelectedColumns, 'VISIBILITY_CHANGED');
      
      return newHidden;
    });
  }, [availableColumns, selectedColumns, localColumnGroups, onColumnChanged]);

  // Function to toggle column pinning
  const toggleColumnPinning = useCallback((columnId: string) => {
    setPinnedColumns(prev => {
      const isPinned = prev.includes(columnId);
      const newPinned = isPinned
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId];
      
      // Update column pinning in available and selected columns
      const updatedAvailableColumns = availableColumns.map(col => ({
        ...col,
        pinned: newPinned.includes(col.field) ? 'left' : null
      })) as ExtendedColDef[];
      
      const updatedSelectedColumns = selectedColumns.map(col => ({
        ...col,
        pinned: newPinned.includes(col.field) ? 'left' : null
      })) as ExtendedColDef[];
      
      setAvailableColumns(updatedAvailableColumns);
      setSelectedColumns(updatedSelectedColumns);
      
      // Update column pinning in groups
      const updatedGroups = localColumnGroups.map(group => ({
        ...group,
        columns: group.columns?.map(col => ({
          ...col,
          pinned: newPinned.includes(col.field) ? 'left' : null
        })) as ExtendedColDef[]
      }));
      
      onColumnChanged(updatedSelectedColumns, 'PINNING_CHANGED');
      
      return newPinned;
    });
  }, [availableColumns, selectedColumns, localColumnGroups, onColumnChanged]);

  // Function to show all columns
  const showAllColumns = useCallback(() => {
    setHiddenColumns([]);
    
    // Update column visibility in available and selected columns
    const updatedAvailableColumns = availableColumns.map(col => ({
      ...col,
      hide: false
    })) as ExtendedColDef[];
    
    const updatedSelectedColumns = selectedColumns.map(col => ({
      ...col,
      hide: false
    })) as ExtendedColDef[];
    
    setAvailableColumns(updatedAvailableColumns);
    setSelectedColumns(updatedSelectedColumns);
    
    // Update column visibility in groups
    const updatedGroups = localColumnGroups.map(group => ({
      ...group,
      columns: group.columns?.map(col => ({
        ...col,
        hide: false
      })) as ExtendedColDef[]
    }));
    
    onColumnChanged(updatedSelectedColumns, 'SHOW_ALL');
  }, [availableColumns, selectedColumns, localColumnGroups, onColumnChanged]);

  // Function to hide all columns
  const hideAllColumns = useCallback(() => {
    const allColumnIds = [
      ...availableColumns.map(col => col.field),
      ...selectedColumns.map(col => col.field),
      ...localColumnGroups.flatMap(group => group.columns?.map(col => col.field) || [])
    ];
    
    setHiddenColumns(allColumnIds);
    
    // Update column visibility in available and selected columns
    const updatedAvailableColumns = availableColumns.map(col => ({
      ...col,
      hide: true
    })) as ExtendedColDef[];
    
    const updatedSelectedColumns = selectedColumns.map(col => ({
      ...col,
      hide: true
    })) as ExtendedColDef[];
    
    setAvailableColumns(updatedAvailableColumns);
    setSelectedColumns(updatedSelectedColumns);
    
    // Update column visibility in groups
    const updatedGroups = localColumnGroups.map(group => ({
      ...group,
      columns: group.columns?.map(col => ({
        ...col,
        hide: true
      })) as ExtendedColDef[]
    }));
    
    onColumnChanged(updatedSelectedColumns, 'HIDE_ALL');
  }, [availableColumns, selectedColumns, localColumnGroups, onColumnChanged]);

  // Memoized visibility state
  const visibilityState = useMemo(() => ({
    hiddenColumns,
    pinnedColumns,
    isColumnHidden: (columnId: string) => hiddenColumns.includes(columnId),
    isColumnPinned: (columnId: string) => pinnedColumns.includes(columnId)
  }), [hiddenColumns, pinnedColumns]);

  return {
    ...visibilityState,
    toggleColumnVisibility,
    toggleColumnPinning,
    showAllColumns,
    hideAllColumns
  };
}; 