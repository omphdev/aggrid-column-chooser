import { useState, useCallback, useMemo } from 'react';
import { ExtendedColDef, ColumnGroup } from '../components/types';

interface UseColumnSelectionAndVisibilityProps {
  availableColumns: ExtendedColDef[];
  selectedColumns: ExtendedColDef[];
  localColumnGroups: ColumnGroup[];
  onColumnChanged: (columns: ExtendedColDef[], operation: string) => void;
  setAvailableColumns: (columns: ExtendedColDef[]) => void;
  setSelectedColumns: (columns: ExtendedColDef[]) => void;
}

export const useColumnSelectionAndVisibility = ({
  availableColumns,
  selectedColumns,
  localColumnGroups,
  onColumnChanged,
  setAvailableColumns,
  setSelectedColumns
}: UseColumnSelectionAndVisibilityProps) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [pinnedColumns, setPinnedColumns] = useState<string[]>([]);

  // Function to handle column selection
  const handleSelect = useCallback((columnId: string, event: React.MouseEvent) => {
    if (event.shiftKey && selectedItems.length > 0) {
      const lastSelectedId = selectedItems[selectedItems.length - 1];
      const allColumns = [...availableColumns, ...selectedColumns];
      const lastIndex = allColumns.findIndex(col => col.field === lastSelectedId);
      const currentIndex = allColumns.findIndex(col => col.field === columnId);
      
      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const newSelectedItems = allColumns
          .slice(start, end + 1)
          .map(col => col.field);
        
        setSelectedItems(newSelectedItems);
        return;
      }
    }
    
    setSelectedItems(prev => {
      if (prev.includes(columnId)) {
        return prev.filter(id => id !== columnId);
      }
      return [...prev, columnId];
    });
  }, [availableColumns, selectedColumns, selectedItems]);

  // Function to clear selection
  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  // Function to select all columns
  const selectAll = useCallback(() => {
    const allColumnIds = [...availableColumns, ...selectedColumns].map(col => col.field);
    setSelectedItems(allColumnIds);
  }, [availableColumns, selectedColumns]);

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
      }));
      
      const updatedSelectedColumns = selectedColumns.map(col => ({
        ...col,
        hide: newHidden.includes(col.field)
      }));
      
      setAvailableColumns(updatedAvailableColumns);
      setSelectedColumns(updatedSelectedColumns);
      
      // Update column visibility in groups
      const updatedGroups = localColumnGroups.map(group => ({
        ...group,
        columns: (group.columns || []).map(col => ({
          ...col,
          hide: newHidden.includes(col.field)
        }))
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
        columns: (group.columns || []).map(col => ({
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
    }));
    
    const updatedSelectedColumns = selectedColumns.map(col => ({
      ...col,
      hide: false
    }));
    
    setAvailableColumns(updatedAvailableColumns);
    setSelectedColumns(updatedSelectedColumns);
    
    // Update column visibility in groups
    const updatedGroups = localColumnGroups.map(group => ({
      ...group,
      columns: (group.columns || []).map(col => ({
        ...col,
        hide: false
      }))
    }));
    
    onColumnChanged(updatedSelectedColumns, 'SHOW_ALL');
  }, [availableColumns, selectedColumns, localColumnGroups, onColumnChanged]);

  // Function to hide all columns
  const hideAllColumns = useCallback(() => {
    const allColumnIds = [
      ...availableColumns.map(col => col.field),
      ...selectedColumns.map(col => col.field),
      ...localColumnGroups.flatMap(group => (group.columns || []).map(col => col.field))
    ];
    
    setHiddenColumns(allColumnIds);
    
    // Update column visibility in available and selected columns
    const updatedAvailableColumns = availableColumns.map(col => ({
      ...col,
      hide: true
    }));
    
    const updatedSelectedColumns = selectedColumns.map(col => ({
      ...col,
      hide: true
    }));
    
    setAvailableColumns(updatedAvailableColumns);
    setSelectedColumns(updatedSelectedColumns);
    
    // Update column visibility in groups
    const updatedGroups = localColumnGroups.map(group => ({
      ...group,
      columns: (group.columns || []).map(col => ({
        ...col,
        hide: true
      }))
    }));
    
    onColumnChanged(updatedSelectedColumns, 'HIDE_ALL');
  }, [availableColumns, selectedColumns, localColumnGroups, onColumnChanged]);

  // Memoized selection and visibility state
  const selectionAndVisibilityState = useMemo(() => ({
    selectedItems,
    hiddenColumns,
    pinnedColumns,
    isColumnSelected: (columnId: string) => selectedItems.includes(columnId),
    isColumnHidden: (columnId: string) => hiddenColumns.includes(columnId),
    isColumnPinned: (columnId: string) => pinnedColumns.includes(columnId)
  }), [selectedItems, hiddenColumns, pinnedColumns]);

  return {
    ...selectionAndVisibilityState,
    handleSelect,
    clearSelection,
    selectAll,
    toggleColumnVisibility,
    toggleColumnPinning,
    showAllColumns,
    hideAllColumns
  };
}; 