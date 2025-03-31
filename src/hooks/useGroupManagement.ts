import { useState, useCallback, useMemo } from 'react';
import { ExtendedColDef, ColumnGroup } from '../components/types';

interface UseGroupManagementProps {
  availableColumns: ExtendedColDef[];
  selectedColumns: ExtendedColDef[];
  localColumnGroups: ColumnGroup[];
  onColumnChanged: (columns: ExtendedColDef[], operation: string) => void;
  onColumnGroupChanged: (headerName: string, action: string, replacementName?: string) => void;
  setAvailableColumns: (columns: ExtendedColDef[]) => void;
  setSelectedColumns: (columns: ExtendedColDef[]) => void;
  setLocalColumnGroups: (groups: ColumnGroup[]) => void;
  selectedItems: string[];
}

export const useGroupManagement = ({
  availableColumns,
  selectedColumns,
  localColumnGroups,
  onColumnChanged,
  onColumnGroupChanged,
  setAvailableColumns,
  setSelectedColumns,
  setLocalColumnGroups,
  selectedItems
}: UseGroupManagementProps) => {
  // Function to add columns to a group in the available panel
  const addToGroup = useCallback((groupId: string, columnIds: string[]) => {
    const group = localColumnGroups.find(g => g.headerName === groupId);
    if (!group) return;
    
    const newChildren = Array.from(new Set([...group.children, ...columnIds]));
    const updatedGroups = localColumnGroups.map(g => 
      g.headerName === groupId ? { ...g, children: newChildren } : g
    );
    
    setLocalColumnGroups(updatedGroups);
  }, [localColumnGroups]);

  // Function to add columns to a group in the selected panel
  const addToSelectedGroup = useCallback((groupId: string, columnIds: string[]) => {
    const group = localColumnGroups.find(g => g.headerName === groupId);
    if (!group) return;
    
    const newChildren = Array.from(new Set([...group.children, ...columnIds]));
    const updatedGroups = localColumnGroups.map(g => 
      g.headerName === groupId ? { ...g, children: newChildren } : g
    );
    
    setLocalColumnGroups(updatedGroups);
  }, [localColumnGroups]);

  // Function to create a new group in the selected panel
  const createSelectedGroup = useCallback((groupName: string, columnIds: string[]) => {
    if (!groupName || columnIds.length === 0) return;
    
    const newGroup: ColumnGroup = {
      headerName: groupName,
      children: columnIds,
      columns: selectedColumns.filter(col => columnIds.includes(col.field))
    };
    
    setLocalColumnGroups([...localColumnGroups, newGroup]);
  }, [localColumnGroups, selectedColumns]);

  // Function to remove columns from a group
  const removeFromGroup = useCallback((groupId: string, columnIds: string[]) => {
    const group = localColumnGroups.find(g => g.headerName === groupId);
    if (!group) return;
    
    const newChildren = group.children.filter(id => !columnIds.includes(id));
    const updatedGroups = localColumnGroups.map(g => 
      g.headerName === groupId ? { ...g, children: newChildren } : g
    );
    
    setLocalColumnGroups(updatedGroups);
  }, [localColumnGroups]);

  // Function to reorder columns within a group
  const reorderColumnInGroup = useCallback((groupId: string, columnId: string, targetIndex: number) => {
    const group = localColumnGroups.find(g => g.headerName === groupId);
    if (!group) return;
    
    const newChildren = [...group.children];
    const currentIndex = newChildren.indexOf(columnId);
    if (currentIndex === -1) return;
    
    newChildren.splice(currentIndex, 1);
    newChildren.splice(targetIndex, 0, columnId);
    
    const updatedGroups = localColumnGroups.map(g => 
      g.headerName === groupId ? { ...g, children: newChildren } : g
    );
    
    setLocalColumnGroups(updatedGroups);
  }, [localColumnGroups]);

  // Function to move columns between groups
  const moveColumnsBetweenGroups = useCallback((sourceGroupId: string, targetGroupId: string, columnIds: string[]) => {
    const sourceGroup = localColumnGroups.find(g => g.headerName === sourceGroupId);
    const targetGroup = localColumnGroups.find(g => g.headerName === targetGroupId);
    if (!sourceGroup || !targetGroup) return;
    
    const updatedGroups = localColumnGroups.map(g => {
      if (g.headerName === sourceGroupId) {
        return {
          ...g,
          children: g.children.filter(id => !columnIds.includes(id))
        };
      }
      if (g.headerName === targetGroupId) {
        return {
          ...g,
          children: Array.from(new Set([...g.children, ...columnIds]))
        };
      }
      return g;
    });
    
    setLocalColumnGroups(updatedGroups);
  }, [localColumnGroups]);

  // Function to remove a group
  const removeGroup = useCallback((groupId: string) => {
    const updatedGroups = localColumnGroups.filter(g => g.headerName !== groupId);
    setLocalColumnGroups(updatedGroups);
    onColumnGroupChanged(groupId, 'REMOVE');
  }, [localColumnGroups, onColumnGroupChanged]);

  // Function to update a group
  const updateGroup = useCallback((groupId: string, newName: string) => {
    const updatedGroups = localColumnGroups.map(g => 
      g.headerName === groupId ? { ...g, headerName: newName } : g
    );
    setLocalColumnGroups(updatedGroups);
    onColumnGroupChanged(groupId, 'UPDATE', newName);
  }, [localColumnGroups, onColumnGroupChanged]);

  // Function to move columns out of a group
  const moveColumnsOutOfGroup = useCallback((groupId: string, columnIds: string[]) => {
    const group = localColumnGroups.find(g => g.headerName === groupId);
    if (!group) return;
    
    const updatedGroups = localColumnGroups.map(g => 
      g.headerName === groupId
        ? { ...g, children: g.children.filter(id => !columnIds.includes(id)) }
        : g
    );
    
    setLocalColumnGroups(updatedGroups);
    
    // Add columns back to selected columns
    const columnsToAdd = selectedColumns.filter(col => columnIds.includes(col.field));
    setSelectedColumns([...selectedColumns, ...columnsToAdd]);
  }, [localColumnGroups, selectedColumns]);

  // Memoized group management state
  const groupManagementState = useMemo(() => ({
    groups: localColumnGroups,
    getGroupColumns: (groupId: string) => {
      const group = localColumnGroups.find(g => g.headerName === groupId);
      return group?.children || [];
    }
  }), [localColumnGroups]);

  return {
    ...groupManagementState,
    addToGroup,
    addToSelectedGroup,
    createSelectedGroup,
    removeFromGroup,
    reorderColumnInGroup,
    moveColumnsBetweenGroups,
    removeGroup,
    updateGroup,
    moveColumnsOutOfGroup
  };
}; 