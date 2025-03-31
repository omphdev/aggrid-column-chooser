import { useState, useCallback } from 'react';
import { ExtendedColDef } from '../components/types';

interface ColumnGroup {
  id: string;
  name: string;
  columns: ExtendedColDef[];
}

interface UseColumnGroupsProps {
  availableColumns: ExtendedColDef[];
  selectedColumns: ExtendedColDef[];
  onColumnGroupChanged: (groups: ColumnGroup[], operation: string) => void;
  setAvailableColumns: (columns: ExtendedColDef[]) => void;
  setSelectedColumns: (columns: ExtendedColDef[]) => void;
}

export const useColumnGroups = ({
  availableColumns,
  selectedColumns,
  onColumnGroupChanged,
  setAvailableColumns,
  setSelectedColumns
}: UseColumnGroupsProps) => {
  const [localColumnGroups, setLocalColumnGroups] = useState<ColumnGroup[]>([]);

  // Function to create a new group in the available panel
  const createNewGroup = useCallback(() => {
    const newGroup: ColumnGroup = {
      id: `group-${Date.now()}`,
      name: 'New Group',
      columns: []
    };
    
    setLocalColumnGroups(prev => [...prev, newGroup]);
    onColumnGroupChanged([...localColumnGroups, newGroup], 'ADD');
  }, [localColumnGroups, onColumnGroupChanged]);

  // Function to add columns to a group
  const addToGroup = useCallback((groupId: string, columnIds: string[]) => {
    const columnsToAdd = availableColumns.filter(col => columnIds.includes(col.field));
    const remainingColumns = availableColumns.filter(col => !columnIds.includes(col.field));
    
    setLocalColumnGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          columns: [...group.columns, ...columnsToAdd]
        };
      }
      return group;
    }));
    
    setAvailableColumns(remainingColumns);
    onColumnGroupChanged(
      localColumnGroups.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            columns: [...group.columns, ...columnsToAdd]
          };
        }
        return group;
      }),
      'UPDATE'
    );
  }, [availableColumns, localColumnGroups, onColumnGroupChanged]);

  // Function to create a new group in the selected panel
  const createSelectedColumnGroup = useCallback(() => {
    const newGroup: ColumnGroup = {
      id: `selected-group-${Date.now()}`,
      name: 'New Selected Group',
      columns: []
    };
    
    setLocalColumnGroups(prev => [...prev, newGroup]);
    onColumnGroupChanged([...localColumnGroups, newGroup], 'ADD');
  }, [localColumnGroups, onColumnGroupChanged]);

  // Function to add columns to a selected group
  const addToSelectedGroup = useCallback((groupId: string, columnIds: string[]) => {
    const columnsToAdd = selectedColumns.filter(col => columnIds.includes(col.field));
    const remainingColumns = selectedColumns.filter(col => !columnIds.includes(col.field));
    
    setLocalColumnGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          columns: [...group.columns, ...columnsToAdd]
        };
      }
      return group;
    }));
    
    setSelectedColumns(remainingColumns);
    onColumnGroupChanged(
      localColumnGroups.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            columns: [...group.columns, ...columnsToAdd]
          };
        }
        return group;
      }),
      'UPDATE'
    );
  }, [selectedColumns, localColumnGroups, onColumnGroupChanged]);

  // Function to remove columns from a group
  const removeFromGroup = useCallback((groupId: string, columnIds: string[]) => {
    const group = localColumnGroups.find(g => g.id === groupId);
    if (!group) return;
    
    const columnsToRemove = group.columns.filter(col => columnIds.includes(col.field));
    const remainingColumns = group.columns.filter(col => !columnIds.includes(col.field));
    
    setLocalColumnGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          columns: remainingColumns
        };
      }
      return g;
    }));
    
    setAvailableColumns([...availableColumns, ...columnsToRemove]);
    onColumnGroupChanged(
      localColumnGroups.map(g => {
        if (g.id === groupId) {
          return {
            ...g,
            columns: remainingColumns
          };
        }
        return g;
      }),
      'UPDATE'
    );
  }, [localColumnGroups, onColumnGroupChanged]);

  // Function to reorder columns within a group
  const reorderColumnInGroup = useCallback((groupId: string, columnId: string, targetIndex: number) => {
    setLocalColumnGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        const columns = [...group.columns];
        const sourceIndex = columns.findIndex(col => col.field === columnId);
        if (sourceIndex === -1) return group;
        
        const [movedColumn] = columns.splice(sourceIndex, 1);
        columns.splice(targetIndex, 0, movedColumn);
        
        return {
          ...group,
          columns
        };
      }
      return group;
    }));
    
    onColumnGroupChanged(
      localColumnGroups.map(group => {
        if (group.id === groupId) {
          const columns = [...group.columns];
          const sourceIndex = columns.findIndex(col => col.field === columnId);
          if (sourceIndex === -1) return group;
          
          const [movedColumn] = columns.splice(sourceIndex, 1);
          columns.splice(targetIndex, 0, movedColumn);
          
          return {
            ...group,
            columns
          };
        }
        return group;
      }),
      'UPDATE'
    );
  }, [localColumnGroups, onColumnGroupChanged]);

  // Function to reorder groups
  const reorderGroup = useCallback((groupId: string, targetIndex: number) => {
    setLocalColumnGroups(prev => {
      const groups = [...prev];
      const sourceIndex = groups.findIndex(g => g.id === groupId);
      if (sourceIndex === -1) return groups;
      
      const [movedGroup] = groups.splice(sourceIndex, 1);
      groups.splice(targetIndex, 0, movedGroup);
      
      return groups;
    });
    
    onColumnGroupChanged(
      localColumnGroups.map((group, index) => {
        if (group.id === groupId) {
          return {
            ...group,
            columns: [...group.columns]
          };
        }
        return group;
      }),
      'REORDER'
    );
  }, [localColumnGroups, onColumnGroupChanged]);

  return {
    localColumnGroups,
    createNewGroup,
    addToGroup,
    createSelectedColumnGroup,
    addToSelectedGroup,
    removeFromGroup,
    reorderColumnInGroup,
    reorderGroup
  };
}; 